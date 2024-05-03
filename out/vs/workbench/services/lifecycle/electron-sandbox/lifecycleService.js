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
define(["require", "exports", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycleService", "vs/platform/instantiation/common/extensions", "vs/platform/native/common/native", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/cancellation"], function (require, exports, lifecycle_1, lifecycle_2, storage_1, globals_1, log_1, lifecycleService_1, extensions_1, native_1, async_1, errorMessage_1, cancellation_1) {
    "use strict";
    var NativeLifecycleService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLifecycleService = void 0;
    let NativeLifecycleService = class NativeLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        static { NativeLifecycleService_1 = this; }
        static { this.BEFORE_SHUTDOWN_WARNING_DELAY = 5000; }
        static { this.WILL_SHUTDOWN_WARNING_DELAY = 800; }
        constructor(nativeHostService, storageService, logService) {
            super(logService, storageService);
            this.nativeHostService = nativeHostService;
            this.registerListeners();
        }
        registerListeners() {
            const windowId = this.nativeHostService.windowId;
            // Main side indicates that window is about to unload, check for vetos
            globals_1.ipcRenderer.on('vscode:onBeforeUnload', async (event, reply) => {
                this.logService.trace(`[lifecycle] onBeforeUnload (reason: ${reply.reason})`);
                // trigger onBeforeShutdown events and veto collecting
                const veto = await this.handleBeforeShutdown(reply.reason);
                // veto: cancel unload
                if (veto) {
                    this.logService.trace('[lifecycle] onBeforeUnload prevented via veto');
                    // Indicate as event
                    this._onShutdownVeto.fire();
                    globals_1.ipcRenderer.send(reply.cancelChannel, windowId);
                }
                // no veto: allow unload
                else {
                    this.logService.trace('[lifecycle] onBeforeUnload continues without veto');
                    this.shutdownReason = reply.reason;
                    globals_1.ipcRenderer.send(reply.okChannel, windowId);
                }
            });
            // Main side indicates that we will indeed shutdown
            globals_1.ipcRenderer.on('vscode:onWillUnload', async (event, reply) => {
                this.logService.trace(`[lifecycle] onWillUnload (reason: ${reply.reason})`);
                // trigger onWillShutdown events and joining
                await this.handleWillShutdown(reply.reason);
                // trigger onDidShutdown event now that we know we will quit
                this._onDidShutdown.fire();
                // acknowledge to main side
                globals_1.ipcRenderer.send(reply.replyChannel, windowId);
            });
        }
        async handleBeforeShutdown(reason) {
            const logService = this.logService;
            const vetos = [];
            const pendingVetos = new Set();
            let finalVeto = undefined;
            let finalVetoId = undefined;
            // before-shutdown event with veto support
            this._onBeforeShutdown.fire({
                reason,
                veto(value, id) {
                    vetos.push(value);
                    // Log any veto instantly
                    if (value === true) {
                        logService.info(`[lifecycle]: Shutdown was prevented (id: ${id})`);
                    }
                    // Track promise completion
                    else if (value instanceof Promise) {
                        pendingVetos.add(id);
                        value.then(veto => {
                            if (veto === true) {
                                logService.info(`[lifecycle]: Shutdown was prevented (id: ${id})`);
                            }
                        }).finally(() => pendingVetos.delete(id));
                    }
                },
                finalVeto(value, id) {
                    if (!finalVeto) {
                        finalVeto = value;
                        finalVetoId = id;
                    }
                    else {
                        throw new Error(`[lifecycle]: Final veto is already defined (id: ${id})`);
                    }
                }
            });
            const longRunningBeforeShutdownWarning = (0, async_1.disposableTimeout)(() => {
                logService.warn(`[lifecycle] onBeforeShutdown is taking a long time, pending operations: ${Array.from(pendingVetos).join(', ')}`);
            }, NativeLifecycleService_1.BEFORE_SHUTDOWN_WARNING_DELAY);
            try {
                // First: run list of vetos in parallel
                let veto = await (0, lifecycle_1.handleVetos)(vetos, error => this.handleBeforeShutdownError(error, reason));
                if (veto) {
                    return veto;
                }
                // Second: run the final veto if defined
                if (finalVeto) {
                    try {
                        pendingVetos.add(finalVetoId);
                        veto = await finalVeto();
                        if (veto) {
                            logService.info(`[lifecycle]: Shutdown was prevented by final veto (id: ${finalVetoId})`);
                        }
                    }
                    catch (error) {
                        veto = true; // treat error as veto
                        this.handleBeforeShutdownError(error, reason);
                    }
                }
                return veto;
            }
            finally {
                longRunningBeforeShutdownWarning.dispose();
            }
        }
        handleBeforeShutdownError(error, reason) {
            this.logService.error(`[lifecycle]: Error during before-shutdown phase (error: ${(0, errorMessage_1.toErrorMessage)(error)})`);
            this._onBeforeShutdownError.fire({ reason, error });
        }
        async handleWillShutdown(reason) {
            const joiners = [];
            const pendingJoiners = new Set();
            const cts = new cancellation_1.CancellationTokenSource();
            this._onWillShutdown.fire({
                reason,
                token: cts.token,
                joiners: () => Array.from(pendingJoiners.values()),
                join(promise, joiner) {
                    joiners.push(promise);
                    // Track promise completion
                    pendingJoiners.add(joiner);
                    promise.finally(() => pendingJoiners.delete(joiner));
                },
                force: () => {
                    cts.dispose(true);
                }
            });
            const longRunningWillShutdownWarning = (0, async_1.disposableTimeout)(() => {
                this.logService.warn(`[lifecycle] onWillShutdown is taking a long time, pending operations: ${Array.from(pendingJoiners).map(joiner => joiner.id).join(', ')}`);
            }, NativeLifecycleService_1.WILL_SHUTDOWN_WARNING_DELAY);
            try {
                await (0, async_1.raceCancellation)(async_1.Promises.settled(joiners), cts.token);
            }
            catch (error) {
                this.logService.error(`[lifecycle]: Error during will-shutdown phase (error: ${(0, errorMessage_1.toErrorMessage)(error)})`); // this error will not prevent the shutdown
            }
            finally {
                longRunningWillShutdownWarning.dispose();
            }
        }
        shutdown() {
            return this.nativeHostService.closeWindow();
        }
    };
    exports.NativeLifecycleService = NativeLifecycleService;
    exports.NativeLifecycleService = NativeLifecycleService = NativeLifecycleService_1 = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService)
    ], NativeLifecycleService);
    (0, extensions_1.registerSingleton)(lifecycle_2.ILifecycleService, NativeLifecycleService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xpZmVjeWNsZS9lbGVjdHJvbi1zYW5kYm94L2xpZmVjeWNsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLDJDQUF3Qjs7aUJBRTNDLGtDQUE2QixHQUFHLElBQUksQUFBUCxDQUFRO2lCQUNyQyxnQ0FBMkIsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQUUxRCxZQUNzQyxpQkFBcUMsRUFDekQsY0FBK0IsRUFDbkMsVUFBdUI7WUFFcEMsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUpHLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFNMUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDO1lBRWpELHNFQUFzRTtZQUN0RSxxQkFBVyxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsS0FBYyxFQUFFLEtBQTJFLEVBQUUsRUFBRTtnQkFDN0ksSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUU5RSxzREFBc0Q7Z0JBQ3RELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFM0Qsc0JBQXNCO2dCQUN0QixJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLElBQUksQ0FBQyxVQUFV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