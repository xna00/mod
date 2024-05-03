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
define(["require", "exports", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/log/electron-main/loggerService", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/environment/node/environmentService", "vs/base/common/types", "vs/platform/sharedProcess/common/sharedProcess"], function (require, exports, ipcMain_1, async_1, lifecycle_1, environmentMainService_1, lifecycleMainService_1, log_1, userDataProfile_1, policy_1, loggerService_1, utilityProcess_1, telemetryUtils_1, environmentService_1, types_1, sharedProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcess = void 0;
    let SharedProcess = class SharedProcess extends lifecycle_1.Disposable {
        constructor(machineId, sqmId, environmentMainService, userDataProfilesService, lifecycleMainService, logService, loggerMainService, policyService) {
            super();
            this.machineId = machineId;
            this.sqmId = sqmId;
            this.environmentMainService = environmentMainService;
            this.userDataProfilesService = userDataProfilesService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.loggerMainService = loggerMainService;
            this.policyService = policyService;
            this.firstWindowConnectionBarrier = new async_1.Barrier();
            this.utilityProcess = undefined;
            this.utilityProcessLogListener = undefined;
            this._whenReady = undefined;
            this._whenIpcReady = undefined;
            this.registerListeners();
        }
        registerListeners() {
            // Shared process channel connections from workbench windows
            ipcMain_1.validatedIpcMain.on(sharedProcess_1.SharedProcessChannelConnection.request, (e, nonce) => this.onWindowConnection(e, nonce, sharedProcess_1.SharedProcessChannelConnection.response));
            // Shared process raw connections from workbench windows
            ipcMain_1.validatedIpcMain.on(sharedProcess_1.SharedProcessRawConnection.request, (e, nonce) => this.onWindowConnection(e, nonce, sharedProcess_1.SharedProcessRawConnection.response));
            // Lifecycle
            this._register(this.lifecycleMainService.onWillShutdown(() => this.onWillShutdown()));
        }
        async onWindowConnection(e, nonce, responseChannel) {
            this.logService.trace(`[SharedProcess] onWindowConnection for: ${responseChannel}`);
            // release barrier if this is the first window connection
            if (!this.firstWindowConnectionBarrier.isOpen()) {
                this.firstWindowConnectionBarrier.open();
            }
            // await the shared process to be overall ready
            // we do not just wait for IPC ready because the
            // workbench window will communicate directly
            await this.whenReady();
            // connect to the shared process passing the responseChannel
            // as payload to give a hint what the connection is about
            const port = await this.connect(responseChannel);
            // Check back if the requesting window meanwhile closed
            // Since shared process is delayed on startup there is
            // a chance that the window close before the shared process
            // was ready for a connection.
            if (e.sender.isDestroyed()) {
                return port.close();
            }
            // send the port back to the requesting window
            e.sender.postMessage(responseChannel, nonce, [port]);
        }
        onWillShutdown() {
            this.logService.trace('[SharedProcess] onWillShutdown');
            this.utilityProcess?.postMessage(sharedProcess_1.SharedProcessLifecycle.exit);
            this.utilityProcess = undefined;
        }
        whenReady() {
            if (!this._whenReady) {
                this._whenReady = (async () => {
                    // Wait for shared process being ready to accept connection
                    await this.whenIpcReady;
                    // Overall signal that the shared process was loaded and
                    // all services within have been created.
                    const whenReady = new async_1.DeferredPromise();
                    this.utilityProcess?.once(sharedProcess_1.SharedProcessLifecycle.initDone, () => whenReady.complete());
                    await whenReady.p;
                    this.utilityProcessLogListener?.dispose();
                    this.logService.trace('[SharedProcess] Overall ready');
                })();
            }
            return this._whenReady;
        }
        get whenIpcReady() {
            if (!this._whenIpcReady) {
                this._whenIpcReady = (async () => {
                    // Always wait for first window asking for connection
                    await this.firstWindowConnectionBarrier.wait();
                    // Spawn shared process
                    this.createUtilityProcess();
                    // Wait for shared process indicating that IPC connections are accepted
                    const sharedProcessIpcReady = new async_1.DeferredPromise();
                    this.utilityProcess?.once(sharedProcess_1.SharedProcessLifecycle.ipcReady, () => sharedProcessIpcReady.complete());
                    await sharedProcessIpcReady.p;
                    this.logService.trace('[SharedProcess] IPC ready');
                })();
            }
            return this._whenIpcReady;
        }
        createUtilityProcess() {
            this.utilityProcess = this._register(new utilityProcess_1.UtilityProcess(this.logService, telemetryUtils_1.NullTelemetryService, this.lifecycleMainService));
            // Install a log listener for very early shared process warnings and errors
            this.utilityProcessLogListener = this.utilityProcess.onMessage((e) => {
                if (typeof e.warning === 'string') {
                    this.logService.warn(e.warning);
                }
                else if (typeof e.error === 'string') {
                    this.logService.error(e.error);
                }
            });
            const inspectParams = (0, environmentService_1.parseSharedProcessDebugPort)(this.environmentMainService.args, this.environmentMainService.isBuilt);
            let execArgv = undefined;
            if (inspectParams.port) {
                execArgv = ['--nolazy'];
                if (inspectParams.break) {
                    execArgv.push(`--inspect-brk=${inspectParams.port}`);
                }
                else {
                    execArgv.push(`--inspect=${inspectParams.port}`);
                }
            }
            this.utilityProcess.start({
                type: 'shared-process',
                entryPoint: 'vs/code/node/sharedProcess/sharedProcessMain',
                payload: this.createSharedProcessConfiguration(),
                execArgv
            });
        }
        createSharedProcessConfiguration() {
            return {
                machineId: this.machineId,
                sqmId: this.sqmId,
                codeCachePath: this.environmentMainService.codeCachePath,
                profiles: {
                    home: this.userDataProfilesService.profilesHome,
                    all: this.userDataProfilesService.profiles,
                },
                args: this.environmentMainService.args,
                logLevel: this.loggerMainService.getLogLevel(),
                loggers: this.loggerMainService.getRegisteredLoggers(),
                policiesData: this.policyService.serialize()
            };
        }
        async connect(payload) {
            // Wait for shared process being ready to accept connection
            await this.whenIpcReady;
            // Connect and return message port
            const utilityProcess = (0, types_1.assertIsDefined)(this.utilityProcess);
            return utilityProcess.connect(payload);
        }
    };
    exports.SharedProcess = SharedProcess;
    exports.SharedProcess = SharedProcess = __decorate([
        __param(2, environmentMainService_1.IEnvironmentMainService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, lifecycleMainService_1.ILifecycleMainService),
        __param(5, log_1.ILogService),
        __param(6, loggerService_1.ILoggerMainService),
        __param(7, policy_1.IPolicyService)
    ], SharedProcess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc2hhcmVkUHJvY2Vzcy9lbGVjdHJvbi1tYWluL3NoYXJlZFByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUFPNUMsWUFDa0IsU0FBaUIsRUFDakIsS0FBYSxFQUNMLHNCQUFnRSxFQUMvRCx1QkFBa0UsRUFDckUsb0JBQTRELEVBQ3RFLFVBQXdDLEVBQ2pDLGlCQUFzRCxFQUMxRCxhQUE4QztZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQVRTLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNZLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDOUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNwRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDaEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN6QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFiOUMsaUNBQTRCLEdBQUcsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQUV0RCxtQkFBYyxHQUErQixTQUFTLENBQUM7WUFDdkQsOEJBQXlCLEdBQTRCLFNBQVMsQ0FBQztZQW9FL0QsZUFBVSxHQUE4QixTQUFTLENBQUM7WUF1QmxELGtCQUFhLEdBQThCLFNBQVMsQ0FBQztZQTdFNUQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4Qiw0REFBNEQ7WUFDNUQsMEJBQWdCLENBQUMsRUFBRSxDQUFDLDhDQUE4QixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLDhDQUE4QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFOUosd0RBQXdEO1lBQ3hELDBCQUFnQixDQUFDLEVBQUUsQ0FBQywwQ0FBMEIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSwwQ0FBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXRKLFlBQVk7WUFDWixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQWUsRUFBRSxLQUFhLEVBQUUsZUFBdUI7WUFDdkYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMkNBQTJDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFFcEYseURBQXlEO1lBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFDLENBQUM7WUFFRCwrQ0FBK0M7WUFDL0MsZ0RBQWdEO1lBQ2hELDZDQUE2QztZQUU3QyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUV2Qiw0REFBNEQ7WUFDNUQseURBQXlEO1lBRXpELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUVqRCx1REFBdUQ7WUFDdkQsc0RBQXNEO1lBQ3RELDJEQUEyRDtZQUMzRCw4QkFBOEI7WUFFOUIsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLENBQUM7WUFFRCw4Q0FBOEM7WUFDOUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVPLGNBQWM7WUFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztZQUV4RCxJQUFJLENBQUMsY0FBYyxFQUFFLFdBQVcsQ0FBQyxzQ0FBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztRQUNqQyxDQUFDO1FBR0QsU0FBUztZQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFFN0IsMkRBQTJEO29CQUMzRCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUM7b0JBRXhCLHdEQUF3RDtvQkFDeEQseUNBQXlDO29CQUV6QyxNQUFNLFNBQVMsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztvQkFDOUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsc0NBQXNCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO29CQUV2RixNQUFNLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxPQUFPLEVBQUUsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztnQkFDeEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNOLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUdELElBQVksWUFBWTtZQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBRWhDLHFEQUFxRDtvQkFDckQsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBRS9DLHVCQUF1QjtvQkFDdkIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBRTVCLHVFQUF1RTtvQkFDdkUsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztvQkFDMUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsc0NBQXNCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBRW5HLE1BQU0scUJBQXFCLENBQUMsQ0FBQyxDQUFDO29CQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ04sQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRU8sb0JBQW9CO1lBQzNCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLCtCQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxxQ0FBb0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBRTNILDJFQUEyRTtZQUMzRSxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRTtnQkFDekUsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ25DLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakMsQ0FBQztxQkFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLGFBQWEsR0FBRyxJQUFBLGdEQUEyQixFQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pILElBQUksUUFBUSxHQUF5QixTQUFTLENBQUM7WUFDL0MsSUFBSSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLFFBQVEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDekIsUUFBUSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3RELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3pCLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLFVBQVUsRUFBRSw4Q0FBOEM7Z0JBQzFELE9BQU8sRUFBRSxJQUFJLENBQUMsZ0NBQWdDLEVBQUU7Z0JBQ2hELFFBQVE7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sZ0NBQWdDO1lBQ3ZDLE9BQU87Z0JBQ04sU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLGFBQWEsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBYTtnQkFDeEQsUUFBUSxFQUFFO29CQUNULElBQUksRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBWTtvQkFDL0MsR0FBRyxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRO2lCQUMxQztnQkFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUk7Z0JBQ3RDLFFBQVEsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFO2dCQUM5QyxPQUFPLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixFQUFFO2dCQUN0RCxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUU7YUFDNUMsQ0FBQztRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQWlCO1lBRTlCLDJEQUEyRDtZQUMzRCxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUM7WUFFeEIsa0NBQWtDO1lBQ2xDLE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDNUQsT0FBTyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDRCxDQUFBO0lBL0tZLHNDQUFhOzRCQUFiLGFBQWE7UUFVdkIsV0FBQSxnREFBdUIsQ0FBQTtRQUN2QixXQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFdBQUEsNENBQXFCLENBQUE7UUFDckIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxrQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLHVCQUFjLENBQUE7T0FmSixhQUFhLENBK0t6QiJ9