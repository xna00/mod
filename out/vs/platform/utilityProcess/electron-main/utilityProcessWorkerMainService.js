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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/windows/electron-main/windows", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/telemetry/common/telemetry", "vs/base/common/hash", "vs/base/common/event", "vs/base/common/async", "vs/platform/lifecycle/electron-main/lifecycleMainService"], function (require, exports, lifecycle_1, instantiation_1, log_1, windows_1, utilityProcess_1, telemetry_1, hash_1, event_1, async_1, lifecycleMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UtilityProcessWorkerMainService = exports.IUtilityProcessWorkerMainService = void 0;
    exports.IUtilityProcessWorkerMainService = (0, instantiation_1.createDecorator)('utilityProcessWorker');
    let UtilityProcessWorkerMainService = class UtilityProcessWorkerMainService extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, telemetryService, lifecycleMainService) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.telemetryService = telemetryService;
            this.lifecycleMainService = lifecycleMainService;
            this.workers = new Map();
        }
        async createWorker(configuration) {
            const workerLogId = `window: ${configuration.reply.windowId}, moduleId: ${configuration.process.moduleId}`;
            this.logService.trace(`[UtilityProcessWorker]: createWorker(${workerLogId})`);
            // Ensure to dispose any existing process for config
            const workerId = this.hash(configuration);
            if (this.workers.has(workerId)) {
                this.logService.warn(`[UtilityProcessWorker]: createWorker() found an existing worker that will be terminated (${workerLogId})`);
                this.disposeWorker(configuration);
            }
            // Create new worker
            const worker = new UtilityProcessWorker(this.logService, this.windowsMainService, this.telemetryService, this.lifecycleMainService, configuration);
            if (!worker.spawn()) {
                return { reason: { code: 1, signal: 'EINVALID' } };
            }
            this.workers.set(workerId, worker);
            const onDidTerminate = new async_1.DeferredPromise();
            event_1.Event.once(worker.onDidTerminate)(reason => {
                if (reason.code === 0) {
                    this.logService.trace(`[UtilityProcessWorker]: terminated normally with code ${reason.code}, signal: ${reason.signal}`);
                }
                else {
                    this.logService.error(`[UtilityProcessWorker]: terminated unexpectedly with code ${reason.code}, signal: ${reason.signal}`);
                }
                this.workers.delete(workerId);
                onDidTerminate.complete({ reason });
            });
            return onDidTerminate.p;
        }
        hash(configuration) {
            return (0, hash_1.hash)({
                moduleId: configuration.process.moduleId,
                windowId: configuration.reply.windowId
            });
        }
        async disposeWorker(configuration) {
            const workerId = this.hash(configuration);
            const worker = this.workers.get(workerId);
            if (!worker) {
                return;
            }
            this.logService.trace(`[UtilityProcessWorker]: disposeWorker(window: ${configuration.reply.windowId}, moduleId: ${configuration.process.moduleId})`);
            worker.kill();
            this.workers.delete(workerId);
        }
    };
    exports.UtilityProcessWorkerMainService = UtilityProcessWorkerMainService;
    exports.UtilityProcessWorkerMainService = UtilityProcessWorkerMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, lifecycleMainService_1.ILifecycleMainService)
    ], UtilityProcessWorkerMainService);
    let UtilityProcessWorker = class UtilityProcessWorker extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, telemetryService, lifecycleMainService, configuration) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.telemetryService = telemetryService;
            this.lifecycleMainService = lifecycleMainService;
            this.configuration = configuration;
            this._onDidTerminate = this._register(new event_1.Emitter());
            this.onDidTerminate = this._onDidTerminate.event;
            this.utilityProcess = new utilityProcess_1.WindowUtilityProcess(this.logService, this.windowsMainService, this.telemetryService, this.lifecycleMainService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.utilityProcess.onExit(e => this._onDidTerminate.fire({ code: e.code, signal: e.signal })));
            this._register(this.utilityProcess.onCrash(e => this._onDidTerminate.fire({ code: e.code, signal: 'ECRASH' })));
        }
        spawn() {
            const window = this.windowsMainService.getWindowById(this.configuration.reply.windowId);
            const windowPid = window?.win?.webContents.getOSProcessId();
            return this.utilityProcess.start({
                type: this.configuration.process.type,
                entryPoint: this.configuration.process.moduleId,
                parentLifecycleBound: windowPid,
                windowLifecycleBound: true,
                correlationId: `${this.configuration.reply.windowId}`,
                responseWindowId: this.configuration.reply.windowId,
                responseChannel: this.configuration.reply.channel,
                responseNonce: this.configuration.reply.nonce
            });
        }
        kill() {
            this.utilityProcess.kill();
        }
    };
    UtilityProcessWorker = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, lifecycleMainService_1.ILifecycleMainService)
    ], UtilityProcessWorker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eVByb2Nlc3NXb3JrZXJNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXRpbGl0eVByb2Nlc3MvZWxlY3Ryb24tbWFpbi91dGlsaXR5UHJvY2Vzc1dvcmtlck1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNuRixRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsc0JBQXNCLENBQUMsQ0FBQztJQU9uSCxJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHNCQUFVO1FBTTlELFlBQ2MsVUFBd0MsRUFDaEMsa0JBQXdELEVBQzFELGdCQUFvRCxFQUNoRCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFMc0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDekMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBTm5FLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQVM1RSxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUF1RDtZQUN6RSxNQUFNLFdBQVcsR0FBRyxXQUFXLGFBQWEsQ0FBQyxLQUFLLENBQUMsUUFBUSxlQUFlLGFBQWEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDM0csSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsd0NBQXdDLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFFOUUsb0RBQW9EO1lBQ3BELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUMsSUFBSSxJQUFJLENBQUMsT0FBTyxD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