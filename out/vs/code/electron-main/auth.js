/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "electron", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/encryption/common/encryptionService", "vs/platform/log/common/log", "vs/platform/storage/electron-main/storageMainService", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, cancellation_1, event_1, hash_1, lifecycle_1, uuid_1, encryptionService_1, log_1, storageMainService_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyAuthHandler = void 0;
    var ProxyAuthState;
    (function (ProxyAuthState) {
        /**
         * Initial state: we will try to use stored credentials
         * first to reply to the auth challenge.
         */
        ProxyAuthState[ProxyAuthState["Initial"] = 1] = "Initial";
        /**
         * We used stored credentials and are still challenged,
         * so we will show a login dialog next.
         */
        ProxyAuthState[ProxyAuthState["StoredCredentialsUsed"] = 2] = "StoredCredentialsUsed";
        /**
         * Finally, if we showed a login dialog already, we will
         * not show any more login dialogs until restart to reduce
         * the UI noise.
         */
        ProxyAuthState[ProxyAuthState["LoginDialogShown"] = 3] = "LoginDialogShown";
    })(ProxyAuthState || (ProxyAuthState = {}));
    let ProxyAuthHandler = class ProxyAuthHandler extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, encryptionMainService, applicationStorageMainService) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.encryptionMainService = encryptionMainService;
            this.applicationStorageMainService = applicationStorageMainService;
            this.PROXY_CREDENTIALS_SERVICE_KEY = 'proxy-credentials://';
            this.pendingProxyResolve = undefined;
            this.state = ProxyAuthState.Initial;
            this.sessionCredentials = undefined;
            this.registerListeners();
        }
        registerListeners() {
            const onLogin = event_1.Event.fromNodeEventEmitter(electron_1.app, 'login', (event, webContents, req, authInfo, callback) => ({ event, webContents, req, authInfo, callback }));
            this._register(onLogin(this.onLogin, this));
        }
        async onLogin({ event, authInfo, req, callback }) {
            if (!authInfo.isProxy) {
                return; // only for proxy
            }
            if (!this.pendingProxyResolve && this.state === ProxyAuthState.LoginDialogShown && req.firstAuthAttempt) {
                this.logService.trace('auth#onLogin (proxy) - exit - proxy dialog already shown');
                return; // only one dialog per session at max (except when firstAuthAttempt: false which indicates a login problem)
            }
            // Signal we handle this event on our own, otherwise
            // Electron will ignore our provided credentials.
            event.preventDefault();
            let credentials = undefined;
            if (!this.pendingProxyResolve) {
                this.logService.trace('auth#onLogin (proxy) - no pending proxy handling found, starting new');
                this.pendingProxyResolve = this.resolveProxyCredentials(authInfo);
                try {
                    credentials = await this.pendingProxyResolve;
                }
                finally {
                    this.pendingProxyResolve = undefined;
                }
            }
            else {
                this.logService.trace('auth#onLogin (proxy) - pending proxy handling found');
                credentials = await this.pendingProxyResolve;
            }
            // According to Electron docs, it is fine to call back without
            // username or password to signal that the authentication was handled
            // by us, even though without having credentials received:
            //
            // > If `callback` is called without a username or password, the authentication
            // > request will be cancelled and the authentication error will be returned to the
            // > page.
            callback(credentials?.username, credentials?.password);
        }
        async resolveProxyCredentials(authInfo) {
            this.logService.trace('auth#resolveProxyCredentials (proxy) - enter');
            try {
                const credentials = await this.doResolveProxyCredentials(authInfo);
                if (credentials) {
                    this.logService.trace('auth#resolveProxyCredentials (proxy) - got credentials');
                    return credentials;
                }
                else {
                    this.logService.trace('auth#resolveProxyCredentials (proxy) - did not get credentials');
                }
            }
            finally {
                this.logService.trace('auth#resolveProxyCredentials (proxy) - exit');
            }
            return undefined;
        }
        async doResolveProxyCredentials(authInfo) {
            this.logService.trace('auth#doResolveProxyCredentials - enter', authInfo);
            // Compute a hash over the authentication info to be used
            // with the credentials store to return the right credentials
            // given the properties of the auth request
            // (see https://github.com/microsoft/vscode/issues/109497)
            const authInfoHash = String((0, hash_1.hash)({ scheme: authInfo.scheme, host: authInfo.host, port: authInfo.port }));
            let storedUsername;
            let storedPassword;
            try {
                // Try to find stored credentials for the given auth info
                const encryptedValue = this.applicationStorageMainService.get(this.PROXY_CREDENTIALS_SERVICE_KEY + authInfoHash, -1 /* StorageScope.APPLICATION */);
                if (encryptedValue) {
                    const credentials = JSON.parse(await this.encryptionMainService.decrypt(encryptedValue));
                    storedUsername = credentials.username;
                    storedPassword = credentials.password;
                }
            }
            catch (error) {
                this.logService.error(error); // handle errors by asking user for login via dialog
            }
            // Reply with stored credentials unless we used them already.
            // In that case we need to show a login dialog again because
            // they seem invalid.
            if (this.state !== ProxyAuthState.StoredCredentialsUsed && typeof storedUsername === 'string' && typeof storedPassword === 'string') {
                this.logService.trace('auth#doResolveProxyCredentials (proxy) - exit - found stored credentials to use');
                this.state = ProxyAuthState.StoredCredentialsUsed;
                return { username: storedUsername, password: storedPassword };
            }
            // Find suitable window to show dialog: prefer to show it in the
            // active window because any other network request will wait on
            // the credentials and we want the user to present the dialog.
            const window = this.windowsMainService.getFocusedWindow() || this.windowsMainService.getLastActiveWindow();
            if (!window) {
                this.logService.trace('auth#doResolveProxyCredentials (proxy) - exit - no opened window found to show dialog in');
                return undefined; // unexpected
            }
            this.logService.trace(`auth#doResolveProxyCredentials (proxy) - asking window ${window.id} to handle proxy login`);
            // Open proxy dialog
            const payload = {
                authInfo,
                username: this.sessionCredentials?.username ?? storedUsername, // prefer to show already used username (if any) over stored
                password: this.sessionCredentials?.password ?? storedPassword, // prefer to show already used password (if any) over stored
                replyChannel: `vscode:proxyAuthResponse:${(0, uuid_1.generateUuid)()}`
            };
            window.sendWhenReady('vscode:openProxyAuthenticationDialog', cancellation_1.CancellationToken.None, payload);
            this.state = ProxyAuthState.LoginDialogShown;
            // Handle reply
            const loginDialogCredentials = await new Promise(resolve => {
                const proxyAuthResponseHandler = async (event, channel, reply /* canceled */) => {
                    if (channel === payload.replyChannel) {
                        this.logService.trace(`auth#doResolveProxyCredentials - exit - received credentials from window ${window.id}`);
                        window.win?.webContents.off('ipc-message', proxyAuthResponseHandler);
                        // We got credentials from the window
                        if (reply) {
                            const credentials = { username: reply.username, password: reply.password };
                            // Update stored credentials based on `remember` flag
                            try {
                                if (reply.remember) {
                                    const encryptedSerializedCredentials = await this.encryptionMainService.encrypt(JSON.stringify(credentials));
                                    this.applicationStorageMainService.store(this.PROXY_CREDENTIALS_SERVICE_KEY + authInfoHash, encryptedSerializedCredentials, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                                }
                                else {
                                    this.applicationStorageMainService.remove(this.PROXY_CREDENTIALS_SERVICE_KEY + authInfoHash, -1 /* StorageScope.APPLICATION */);
                                }
                            }
                            catch (error) {
                                this.logService.error(error); // handle gracefully
                            }
                            resolve({ username: credentials.username, password: credentials.password });
                        }
                        // We did not get any credentials from the window (e.g. cancelled)
                        else {
                            resolve(undefined);
                        }
                    }
                };
                window.win?.webContents.on('ipc-message', proxyAuthResponseHandler);
            });
            // Remember credentials for the session in case
            // the credentials are wrong and we show the dialog
            // again
            this.sessionCredentials = loginDialogCredentials;
            return loginDialogCredentials;
        }
    };
    exports.ProxyAuthHandler = ProxyAuthHandler;
    exports.ProxyAuthHandler = ProxyAuthHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, encryptionService_1.IEncryptionMainService),
        __param(3, storageMainService_1.IApplicationStorageMainService)
    ], ProxyAuthHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9lbGVjdHJvbi1tYWluL2F1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0JoRyxJQUFLLGNBb0JKO0lBcEJELFdBQUssY0FBYztRQUVsQjs7O1dBR0c7UUFDSCx5REFBVyxDQUFBO1FBRVg7OztXQUdHO1FBQ0gscUZBQXFCLENBQUE7UUFFckI7Ozs7V0FJRztRQUNILDJFQUFnQixDQUFBO0lBQ2pCLENBQUMsRUFwQkksY0FBYyxLQUFkLGNBQWMsUUFvQmxCO0lBRU0sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQVUvQyxZQUNjLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUNyRCxxQkFBOEQsRUFDdEQsNkJBQThFO1lBRTlHLEtBQUssRUFBRSxDQUFDO1lBTHNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3BDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDckMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQVo5RixrQ0FBNkIsR0FBRyxzQkFBc0IsQ0FBQztZQUVoRSx3QkFBbUIsR0FBaUQsU0FBUyxDQUFDO1lBRTlFLFVBQUssR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDO1lBRS9CLHVCQUFrQixHQUE0QixTQUFTLENBQUM7WUFVL0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixNQUFNLE9BQU8sR0FBRyxhQUFLLENBQUMsb0JBQW9CLENBQWEsY0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLEtBQW9CLEVBQUUsV0FBd0IsRUFBRSxHQUEwQyxFQUFFLFFBQWtCLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0UCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQWM7WUFDbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxDQUFDLGlCQUFpQjtZQUMxQixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLGNBQWMsQ0FBQyxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDekcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMERBQTBELENBQUMsQ0FBQztnQkFFbEYsT0FBTyxDQUFDLDJHQUEyRztZQUNwSCxDQUFDO1lBRUQsb0RBQW9EO1lBQ3BELGlEQUFpRDtZQUNqRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFdkIsSUFBSSxXQUFXLEdBQTRCLFNBQVMsQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNFQUFzRSxDQUFDLENBQUM7Z0JBRTlGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksQ0FBQztvQkFDSixXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUM7Z0JBQzlDLENBQUM7d0JBQVMsQ0FBQztvQkFDVixJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7Z0JBRTdFLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztZQUM5QyxDQUFDO1lBRUQsOERBQThEO1lBQzlELHFFQUFxRTtZQUNyRSwwREFBMEQ7WUFDMUQsRUFBRTtZQUNGLCtFQUErRTtZQUMvRSxtRkFBbUY7WUFDbkYsVUFBVTtZQUNWLFFBQVEsQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRU8sS0FBSyxDQUFDLHVCQUF1QixDQUFDLFFBQWtCO1lBQ3ZELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7WUFFdEUsSUFBSSxDQUFDO2dCQUNKLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO29CQUVoRixPQUFPLFdBQVcsQ0FBQztnQkFDcEIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7Z0JBQ3pGLENBQUM7WUFDRixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztZQUN0RSxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxRQUFrQjtZQUN6RCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxRSx5REFBeUQ7WUFDekQsNkRBQTZEO1lBQzdELDJDQUEyQztZQUMzQywwREFBMEQ7WUFDMUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLElBQUEsV0FBSSxFQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFekcsSUFBSSxjQUFrQyxDQUFDO1lBQ3ZDLElBQUksY0FBa0MsQ0FBQztZQUN2QyxJQUFJLENBQUM7Z0JBQ0oseURBQXlEO2dCQUN6RCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsR0FBRyxZQUFZLG9DQUEyQixDQUFDO2dCQUMzSSxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUNwQixNQUFNLFdBQVcsR0FBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztvQkFDdEcsY0FBYyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7b0JBQ3RDLGNBQWMsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO2dCQUN2QyxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsb0RBQW9EO1lBQ25GLENBQUM7WUFFRCw2REFBNkQ7WUFDN0QsNERBQTREO1lBQzVELHFCQUFxQjtZQUNyQixJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssY0FBYyxDQUFDLHFCQUFxQixJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDckksSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUZBQWlGLENBQUMsQ0FBQztnQkFDekcsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUM7Z0JBRWxELE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsQ0FBQztZQUMvRCxDQUFDO1lBRUQsZ0VBQWdFO1lBQ2hFLCtEQUErRDtZQUMvRCw4REFBOEQ7WUFDOUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDM0csSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDBGQUEwRixDQUFDLENBQUM7Z0JBRWxILE9BQU8sU0FBUyxDQUFDLENBQUMsYUFBYTtZQUNoQyxDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMERBQTBELE1BQU0sQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFFbkgsb0JBQW9CO1lBQ3BCLE1BQU0sT0FBTyxHQUFHO2dCQUNmLFFBQVE7Z0JBQ1IsUUFBUSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLElBQUksY0FBYyxFQUFFLDREQUE0RDtnQkFDM0gsUUFBUSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLElBQUksY0FBYyxFQUFFLDREQUE0RDtnQkFDM0gsWUFBWSxFQUFFLDRCQUE0QixJQUFBLG1CQUFZLEdBQUUsRUFBRTthQUMxRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLGFBQWEsQ0FBQyxzQ0FBc0MsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUMsZ0JBQWdCLENBQUM7WUFFN0MsZUFBZTtZQUNmLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBMEIsT0FBTyxDQUFDLEVBQUU7Z0JBQ25GLE1BQU0sd0JBQXdCLEdBQUcsS0FBSyxFQUFFLEtBQW9CLEVBQUUsT0FBZSxFQUFFLEtBQXNELENBQUMsY0FBYyxFQUFFLEVBQUU7b0JBQ3ZKLElBQUksT0FBTyxLQUFLLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNEVBQTRFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMvRyxNQUFNLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLHdCQUF3QixDQUFDLENBQUM7d0JBRXJFLHFDQUFxQzt3QkFDckMsSUFBSSxLQUFLLEVBQUUsQ0FBQzs0QkFDWCxNQUFNLFdBQVcsR0FBZ0IsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUV4RixxREFBcUQ7NEJBQ3JELElBQUksQ0FBQztnQ0FDSixJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQ0FDcEIsTUFBTSw4QkFBOEIsR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29DQUM3RyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxDQUN2QyxJQUFJLENBQUMsNkJBQTZCLEdBQUcsWUFBWSxFQUNqRCw4QkFBOEIsbUVBSTlCLENBQUM7Z0NBQ0gsQ0FBQztxQ0FBTSxDQUFDO29DQUNQLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixHQUFHLFlBQVksb0NBQTJCLENBQUM7Z0NBQ3hILENBQUM7NEJBQ0YsQ0FBQzs0QkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dDQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLG9CQUFvQjs0QkFDbkQsQ0FBQzs0QkFFRCxPQUFPLENBQUMsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQzdFLENBQUM7d0JBRUQsa0VBQWtFOzZCQUM3RCxDQUFDOzRCQUNMLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDcEIsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFFRixNQUFNLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDckUsQ0FBQyxDQUFDLENBQUM7WUFFSCwrQ0FBK0M7WUFDL0MsbURBQW1EO1lBQ25ELFFBQVE7WUFDUixJQUFJLENBQUMsa0JBQWtCLEdBQUcsc0JBQXNCLENBQUM7WUFFakQsT0FBTyxzQkFBc0IsQ0FBQztRQUMvQixDQUFDO0tBQ0QsQ0FBQTtJQTlMWSw0Q0FBZ0I7K0JBQWhCLGdCQUFnQjtRQVcxQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLDZCQUFtQixDQUFBO1FBQ25CLFdBQUEsMENBQXNCLENBQUE7UUFDdEIsV0FBQSxtREFBOEIsQ0FBQTtPQWRwQixnQkFBZ0IsQ0E4TDVCIn0=