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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/platform/log/common/log", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/async", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/windows/electron-main/windows", "vs/platform/telemetry/common/telemetry"], function (require, exports, errors_1, event_1, log_1, lifecycleMainService_1, async_1, utilityProcess_1, windows_1, telemetry_1) {
    "use strict";
    var ExtensionHostStarter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostStarter = void 0;
    let ExtensionHostStarter = class ExtensionHostStarter {
        static { ExtensionHostStarter_1 = this; }
        static { this._lastId = 0; }
        constructor(_logService, _lifecycleMainService, _windowsMainService, _telemetryService) {
            this._logService = _logService;
            this._lifecycleMainService = _lifecycleMainService;
            this._windowsMainService = _windowsMainService;
            this._telemetryService = _telemetryService;
            this._extHosts = new Map();
            this._shutdown = false;
            // On shutdown: gracefully await extension host shutdowns
            this._lifecycleMainService.onWillShutdown(e => {
                this._shutdown = true;
                e.join('extHostStarter', this._waitForAllExit(6000));
            });
        }
        dispose() {
            // Intentionally not killing the extension host processes
        }
        _getExtHost(id) {
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                throw new Error(`Unknown extension host!`);
            }
            return extHostProcess;
        }
        onDynamicStdout(id) {
            return this._getExtHost(id).onStdout;
        }
        onDynamicStderr(id) {
            return this._getExtHost(id).onStderr;
        }
        onDynamicMessage(id) {
            return this._getExtHost(id).onMessage;
        }
        onDynamicExit(id) {
            return this._getExtHost(id).onExit;
        }
        async createExtensionHost() {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const id = String(++ExtensionHostStarter_1._lastId);
            const extHost = new utilityProcess_1.WindowUtilityProcess(this._logService, this._windowsMainService, this._telemetryService, this._lifecycleMainService);
            this._extHosts.set(id, extHost);
            extHost.onExit(({ pid, code, signal }) => {
                this._logService.info(`Extension host with pid ${pid} exited with code: ${code}, signal: ${signal}.`);
                setTimeout(() => {
                    extHost.dispose();
                    this._extHosts.delete(id);
                });
                // See https://github.com/microsoft/vscode/issues/194477
                // We have observed that sometimes the process sends an exit
                // event, but does not really exit and is stuck in an endless
                // loop. In these cases we kill the process forcefully after
                // a certain timeout.
                setTimeout(() => {
                    try {
                        process.kill(pid, 0); // will throw if the process doesn't exist anymore.
                        this._logService.error(`Extension host with pid ${pid} still exists, forcefully killing it...`);
                        process.kill(pid);
                    }
                    catch (er) {
                        // ignore, as the process is already gone
                    }
                }, 1000);
            });
            return { id };
        }
        async start(id, opts) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHost = this._getExtHost(id);
            extHost.start({
                ...opts,
                type: 'extensionHost',
                entryPoint: 'vs/workbench/api/node/extensionHostProcess',
                args: ['--skipWorkspaceStorageLock'],
                execArgv: opts.execArgv,
                allowLoadingUnsignedLibraries: true,
                forceAllocationsToV8Sandbox: true,
                correlationId: id
            });
            const pid = await event_1.Event.toPromise(extHost.onSpawn);
            return { pid };
        }
        async enableInspectPort(id) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                return false;
            }
            return extHostProcess.enableInspectPort();
        }
        async kill(id) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                // already gone!
                return;
            }
            extHostProcess.kill();
        }
        async _killAllNow() {
            for (const [, extHost] of this._extHosts) {
                extHost.kill();
            }
        }
        async _waitForAllExit(maxWaitTimeMs) {
            const exitPromises = [];
            for (const [, extHost] of this._extHosts) {
                exitPromises.push(extHost.waitForExit(maxWaitTimeMs));
            }
            return async_1.Promises.settled(exitPromises).then(() => { });
        }
    };
    exports.ExtensionHostStarter = ExtensionHostStarter;
    exports.ExtensionHostStarter = ExtensionHostStarter = ExtensionHostStarter_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, lifecycleMainService_1.ILifecycleMainService),
        __param(2, windows_1.IWindowsMainService),
        __param(3, telemetry_1.ITelemetryService)
    ], ExtensionHostStarter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFN0YXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbnMvZWxlY3Ryb24tbWFpbi9leHRlbnNpb25Ib3N0U3RhcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9COztpQkFJakIsWUFBTyxHQUFXLENBQUMsQUFBWixDQUFhO1FBS25DLFlBQ2MsV0FBeUMsRUFDL0IscUJBQTZELEVBQy9ELG1CQUF5RCxFQUMzRCxpQkFBcUQ7WUFIMUMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDZCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDMUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQVB4RCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWdDLENBQUM7WUFDN0QsY0FBUyxHQUFHLEtBQUssQ0FBQztZQVN6Qix5REFBeUQ7WUFDekQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU87WUFDTix5REFBeUQ7UUFDMUQsQ0FBQztRQUVPLFdBQVcsQ0FBQyxFQUFVO1lBQzdCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FB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