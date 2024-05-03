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
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/performance", "vs/platform/storage/common/storage"], function (require, exports, event_1, async_1, lifecycle_1, lifecycle_2, log_1, performance_1, storage_1) {
    "use strict";
    var AbstractLifecycleService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractLifecycleService = void 0;
    let AbstractLifecycleService = class AbstractLifecycleService extends lifecycle_1.Disposable {
        static { AbstractLifecycleService_1 = this; }
        static { this.LAST_SHUTDOWN_REASON_KEY = 'lifecyle.lastShutdownReason'; }
        get startupKind() { return this._startupKind; }
        get phase() { return this._phase; }
        constructor(logService, storageService) {
            super();
            this.logService = logService;
            this.storageService = storageService;
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this.onBeforeShutdown = this._onBeforeShutdown.event;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onDidShutdown = this._register(new event_1.Emitter());
            this.onDidShutdown = this._onDidShutdown.event;
            this._onBeforeShutdownError = this._register(new event_1.Emitter());
            this.onBeforeShutdownError = this._onBeforeShutdownError.event;
            this._onShutdownVeto = this._register(new event_1.Emitter());
            this.onShutdownVeto = this._onShutdownVeto.event;
            this._phase = 1 /* LifecyclePhase.Starting */;
            this.phaseWhen = new Map();
            // Resolve startup kind
            this._startupKind = this.resolveStartupKind();
            // Save shutdown reason to retrieve on next startup
            this._register(this.storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this.storageService.store(AbstractLifecycleService_1.LAST_SHUTDOWN_REASON_KEY, this.shutdownReason, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            }));
        }
        resolveStartupKind() {
            const startupKind = this.doResolveStartupKind() ?? 1 /* StartupKind.NewWindow */;
            this.logService.trace(`[lifecycle] starting up (startup kind: ${startupKind})`);
            return startupKind;
        }
        doResolveStartupKind() {
            // Retrieve and reset last shutdown reason
            const lastShutdownReason = this.storageService.getNumber(AbstractLifecycleService_1.LAST_SHUTDOWN_REASON_KEY, 1 /* StorageScope.WORKSPACE */);
            this.storageService.remove(AbstractLifecycleService_1.LAST_SHUTDOWN_REASON_KEY, 1 /* StorageScope.WORKSPACE */);
            // Convert into startup kind
            let startupKind = undefined;
            switch (lastShutdownReason) {
                case 3 /* ShutdownReason.RELOAD */:
                    startupKind = 3 /* StartupKind.ReloadedWindow */;
                    break;
                case 4 /* ShutdownReason.LOAD */:
                    startupKind = 4 /* StartupKind.ReopenedWindow */;
                    break;
            }
            return startupKind;
        }
        set phase(value) {
            if (value < this.phase) {
                throw new Error('Lifecycle cannot go backwards');
            }
            if (this._phase === value) {
                return;
            }
            this.logService.trace(`lifecycle: phase changed (value: ${value})`);
            this._phase = value;
            (0, performance_1.mark)(`code/LifecyclePhase/${(0, lifecycle_2.LifecyclePhaseToString)(value)}`);
            const barrier = this.phaseWhen.get(this._phase);
            if (barrier) {
                barrier.open();
                this.phaseWhen.delete(this._phase);
            }
        }
        async when(phase) {
            if (phase <= this._phase) {
                return;
            }
            let barrier = this.phaseWhen.get(phase);
            if (!barrier) {
                barrier = new async_1.Barrier();
                this.phaseWhen.set(phase, barrier);
            }
            await barrier.wait();
        }
    };
    exports.AbstractLifecycleService = AbstractLifecycleService;
    exports.AbstractLifecycleService = AbstractLifecycleService = AbstractLifecycleService_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, storage_1.IStorageService)
    ], AbstractLifecycleService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xpZmVjeWNsZS9jb21tb24vbGlmZWN5Y2xlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQWUsd0JBQXdCLEdBQXZDLE1BQWUsd0JBQXlCLFNBQVEsc0JBQVU7O2lCQUV4Qyw2QkFBd0IsR0FBRyw2QkFBNkIsQUFBaEMsQ0FBaUM7UUFvQmpGLElBQUksV0FBVyxLQUFrQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBRzVELElBQUksS0FBSyxLQUFxQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBTW5ELFlBQ2MsVUFBMEMsRUFDdEMsY0FBa0Q7WUFFbkUsS0FBSyxFQUFFLENBQUM7WUFId0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUEzQmpELHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQStCLENBQUMsQ0FBQztZQUN6RixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRXRDLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUIsQ0FBQyxDQUFDO1lBQzdFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFFbEMsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvRCxrQkFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1lBRWhDLDJCQUFzQixHQUFHLElBQUks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