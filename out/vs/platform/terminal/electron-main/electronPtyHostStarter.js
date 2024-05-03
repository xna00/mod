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
define(["require", "exports", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/environmentService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/base/parts/ipc/electron-main/ipc.mp", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/base/common/network"], function (require, exports, environmentMainService_1, environmentService_1, lifecycleMainService_1, log_1, telemetryUtils_1, utilityProcess_1, ipc_mp_1, ipcMain_1, lifecycle_1, event_1, objects_1, configuration_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronPtyHostStarter = void 0;
    let ElectronPtyHostStarter = class ElectronPtyHostStarter extends lifecycle_1.Disposable {
        constructor(_reconnectConstants, _configurationService, _environmentMainService, _lifecycleMainService, _logService) {
            super();
            this._reconnectConstants = _reconnectConstants;
            this._configurationService = _configurationService;
            this._environmentMainService = _environmentMainService;
            this._lifecycleMainService = _lifecycleMainService;
            this._logService = _logService;
            this.utilityProcess = undefined;
            this._onRequestConnection = new event_1.Emitter();
            this.onRequestConnection = this._onRequestConnection.event;
            this._onWillShutdown = new event_1.Emitter();
            this.onWillShutdown = this._onWillShutdown.event;
            this._lifecycleMainService.onWillShutdown(() => this._onWillShutdown.fire());
            // Listen for new windows to establish connection directly to pty host
            ipcMain_1.validatedIpcMain.on('vscode:createPtyHostMessageChannel', (e, nonce) => this._onWindowConnection(e, nonce));
            this._register((0, lifecycle_1.toDisposable)(() => {
                ipcMain_1.validatedIpcMain.removeHandler('vscode:createPtyHostMessageChannel');
            }));
        }
        start() {
            this.utilityProcess = new utilityProcess_1.UtilityProcess(this._logService, telemetryUtils_1.NullTelemetryService, this._lifecycleMainService);
            const inspectParams = (0, environmentService_1.parsePtyHostDebugPort)(this._environmentMainService.args, this._environmentMainService.isBuilt);
            const execArgv = inspectParams.port ? [
                '--nolazy',
                `--inspect${inspectParams.break ? '-brk' : ''}=${inspectParams.port}`
            ] : undefined;
            this.utilityProcess.start({
                type: 'ptyHost',
                entryPoint: 'vs/platform/terminal/node/ptyHostMain',
                execArgv,
                args: ['--logsPath', this._environmentMainService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath],
                env: this._createPtyHostConfiguration()
            });
            const port = this.utilityProcess.connect();
            const client = new ipc_mp_1.Client(port, 'ptyHost');
            const store = new lifecycle_1.DisposableStore();
            store.add(client);
            store.add((0, lifecycle_1.toDisposable)(() => {
                this.utilityProcess?.kill();
                this.utilityProcess?.dispose();
                this.utilityProcess = undefined;
            }));
            return {
                client,
                store,
                onDidProcessExit: this.utilityProcess.onExit
            };
        }
        _createPtyHostConfiguration() {
            this._environmentMainService.unsetSnapExportedVariables();
            const config = {
                ...(0, objects_1.deepClone)(process.env),
                VSCODE_AMD_ENTRYPOINT: 'vs/platform/terminal/node/ptyHostMain',
                VSCODE_PIPE_LOGGING: 'true',
                VSCODE_VERBOSE_LOGGING: 'true', // transmit console logs from server to client,
                VSCODE_RECONNECT_GRACE_TIME: String(this._reconnectConstants.graceTime),
                VSCODE_RECONNECT_SHORT_GRACE_TIME: String(this._reconnectConstants.shortGraceTime),
                VSCODE_RECONNECT_SCROLLBACK: String(this._reconnectConstants.scrollback),
            };
            const simulatedLatency = this._configurationService.getValue("terminal.integrated.developer.ptyHost.latency" /* TerminalSettingId.DeveloperPtyHostLatency */);
            if (simulatedLatency && typeof simulatedLatency === 'number') {
                config.VSCODE_LATENCY = String(simulatedLatency);
            }
            const startupDelay = this._configurationService.getValue("terminal.integrated.developer.ptyHost.startupDelay" /* TerminalSettingId.DeveloperPtyHostStartupDelay */);
            if (startupDelay && typeof startupDelay === 'number') {
                config.VSCODE_STARTUP_DELAY = String(startupDelay);
            }
            this._environmentMainService.restoreSnapExportedVariables();
            return config;
        }
        _onWindowConnection(e, nonce) {
            this._onRequestConnection.fire();
            const port = this.utilityProcess.connect();
            // Check back if the requesting window meanwhile closed
            // Since shared process is delayed on startup there is
            // a chance that the window close before the shared process
            // was ready for a connection.
            if (e.sender.isDestroyed()) {
                port.close();
                return;
            }
            e.sender.postMessage('vscode:createPtyHostMessageChannelResult', nonce, [port]);
        }
    };
    exports.ElectronPtyHostStarter = ElectronPtyHostStarter;
    exports.ElectronPtyHostStarter = ElectronPtyHostStarter = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentMainService_1.IEnvironmentMainService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, log_1.ILogService)
    ], ElectronPtyHostStarter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb25QdHlIb3N0U3RhcnRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvZWxlY3Ryb24tbWFpbi9lbGVjdHJvblB0eUhvc3RTdGFydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQVNyRCxZQUNrQixtQkFBd0MsRUFDbEMscUJBQTZELEVBQzNELHVCQUFpRSxFQUNuRSxxQkFBNkQsRUFDdkUsV0FBeUM7WUFFdEQsS0FBSyxFQUFFLENBQUM7WUFOUyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ2pCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDMUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUNsRCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBWi9DLG1CQUFjLEdBQStCLFNBQVMsQ0FBQztZQUU5Qyx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ25ELHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDOUMsb0JBQWUsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzlDLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFXcEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0Usc0VBQXNFO1lBQ3RFLDBCQUFnQixDQUFDLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDLENBQUMsRUFBRSxL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