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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTerminalService", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/async"], function (require, exports, lifecycle_1, instantiation_1, extHost_protocol_1, extHostRpcService_1, extHostTerminalService_1, event_1, uri_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTerminalShellIntegration = exports.IExtHostTerminalShellIntegration = void 0;
    exports.IExtHostTerminalShellIntegration = (0, instantiation_1.createDecorator)('IExtHostTerminalShellIntegration');
    let ExtHostTerminalShellIntegration = class ExtHostTerminalShellIntegration extends lifecycle_1.Disposable {
        constructor(extHostRpc, _extHostTerminalService) {
            super();
            this._extHostTerminalService = _extHostTerminalService;
            this._activeShellIntegrations = new Map();
            this._onDidChangeTerminalShellIntegration = new event_1.Emitter();
            this.onDidChangeTerminalShellIntegration = this._onDidChangeTerminalShellIntegration.event;
            this._onDidStartTerminalShellExecution = new event_1.Emitter();
            this.onDidStartTerminalShellExecution = this._onDidStartTerminalShellExecution.event;
            this._onDidEndTerminalShellExecution = new event_1.Emitter();
            this.onDidEndTerminalShellExecution = this._onDidEndTerminalShellExecution.event;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTerminalShellIntegration);
            // Clean up listeners
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const [_, integration] of this._activeShellIntegrations) {
                    integration.dispose();
                }
                this._activeShellIntegrations.clear();
            }));
            // Convenient test code:
            // this.onDidChangeTerminalShellIntegration(e => {
            // 	console.log('*** onDidChangeTerminalShellIntegration', e);
            // });
            // this.onDidStartTerminalShellExecution(async e => {
            // 	console.log('*** onDidStartTerminalShellExecution', e);
            // 	// new Promise<void>(r => {
            // 	// 	(async () => {
            // 	// 		for await (const d of e.createDataStream()) {
            // 	// 			console.log('data2', d);
            // 	// 		}
            // 	// 	})();
            // 	// });
            // 	for await (const d of e.createDataStream()) {
            // 		console.log('data', d);
            // 	}
            // });
            // this.onDidEndTerminalShellExecution(e => {
            // 	console.log('*** onDidEndTerminalShellExecution', e);
            // });
            // setTimeout(() => {
            // 	Array.from(this._activeShellIntegrations.values())[0].value.executeCommand('echo hello');
            // }, 4000);
        }
        $shellIntegrationChange(instanceId) {
            const terminal = this._extHostTerminalService.getTerminalById(instanceId);
            if (!terminal) {
                return;
            }
            const apiTerminal = terminal.value;
            let shellIntegration = this._activeShellIntegrations.get(instanceId);
            if (!shellIntegration) {
                shellIntegration = new InternalTerminalShellIntegration(terminal.value, this._onDidStartTerminalShellExecution);
                this._activeShellIntegrations.set(instanceId, shellIntegration);
                shellIntegration.store.add(terminal.onWillDispose(() => this._activeShellIntegrations.get(instanceId)?.dispose()));
                shellIntegration.store.add(shellIntegration.onDidRequestShellExecution(commandLine => this._proxy.$executeCommand(instanceId, commandLine)));
                shellIntegration.store.add(shellIntegration.onDidRequestEndExecution(e => this._onDidEndTerminalShellExecution.fire(e.value)));
                shellIntegration.store.add(shellIntegration.onDidRequestChangeShellIntegration(e => this._onDidChangeTerminalShellIntegration.fire(e)));
                terminal.shellIntegration = shellIntegration.value;
            }
            this._onDidChangeTerminalShellIntegration.fire({
                terminal: apiTerminal,
                shellIntegration: shellIntegration.value
            });
        }
        $shellExecutionStart(instanceId, commandLine, cwd) {
            // Force shellIntegration creation if it hasn't been created yet, this could when events
            // don't come through on startup
            if (!this._activeShellIntegrations.has(instanceId)) {
                this.$shellIntegrationChange(instanceId);
            }
            this._activeShellIntegrations.get(instanceId)?.startShellExecution(commandLine, cwd);
        }
        $shellExecutionEnd(instanceId, commandLine, exitCode) {
            this._activeShellIntegrations.get(instanceId)?.endShellExecution(commandLine, exitCode);
        }
        $shellExecutionData(instanceId, data) {
            this._activeShellIntegrations.get(instanceId)?.emitData(data);
        }
        $cwdChange(instanceId, cwd) {
            this._activeShellIntegrations.get(instanceId)?.setCwd(cwd);
        }
        $closeTerminal(instanceId) {
            this._activeShellIntegrations.get(instanceId)?.dispose();
            this._activeShellIntegrations.delete(instanceId);
        }
    };
    exports.ExtHostTerminalShellIntegration = ExtHostTerminalShellIntegration;
    exports.ExtHostTerminalShellIntegration = ExtHostTerminalShellIntegration = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostTerminalService_1.IExtHostTerminalService)
    ], ExtHostTerminalShellIntegration);
    class InternalTerminalShellIntegration extends lifecycle_1.Disposable {
        get currentExecution() { return this._currentExecution; }
        constructor(_terminal, _onDidStartTerminalShellExecution) {
            super();
            this._terminal = _terminal;
            this._onDidStartTerminalShellExecution = _onDidStartTerminalShellExecution;
            this._ignoreNextExecution = false;
            this.store = this._register(new lifecycle_1.DisposableStore());
            this._onDidRequestChangeShellIntegration = this._register(new event_1.Emitter());
            this.onDidRequestChangeShellIntegration = this._onDidRequestChangeShellIntegration.event;
            this._onDidRequestShellExecution = this._register(new event_1.Emitter());
            this.onDidRequestShellExecution = this._onDidRequestShellExecution.event;
            this._onDidRequestEndExecution = this._register(new event_1.Emitter());
            this.onDidRequestEndExecution = this._onDidRequestEndExecution.event;
            const that = this;
            this.value = {
                get cwd() {
                    return that._cwd;
                },
                executeCommand(commandLine) {
                    that._onDidRequestShellExecution.fire(commandLine);
                    const execution = that.startShellExecution(commandLine, that._cwd).value;
                    that._ignoreNextExecution = true;
                    return execution;
                }
            };
        }
        startShellExecution(commandLine, cwd) {
            if (this._ignoreNextExecution && this._currentExecution) {
                this._ignoreNextExecution = false;
            }
            else {
                if (this._currentExecution) {
                    this._currentExecution.endExecution(undefined, undefined);
                    this._onDidRequestEndExecution.fire(this._currentExecution);
                }
                this._currentExecution = new InternalTerminalShellExecution(this._terminal, commandLine, cwd);
                this._onDidStartTerminalShellExecution.fire(this._currentExecution.value);
            }
            return this._currentExecution;
        }
        emitData(data) {
            this.currentExecution?.emitData(data);
        }
        endShellExecution(commandLine, exitCode) {
            if (this._currentExecution) {
                this._currentExecution.endExecution(commandLine, exitCode);
                this._onDidRequestEndExecution.fire(this._currentExecution);
                this._currentExecution = undefined;
            }
        }
        setCwd(cwd) {
            let wasChanged = false;
            if (uri_1.URI.isUri(this._cwd)) {
                if (this._cwd.toString() !== cwd.toString()) {
                    wasChanged = true;
                }
            }
            else if (this._cwd !== cwd) {
                wasChanged = true;
            }
            if (wasChanged) {
                this._cwd = cwd;
                this._onDidRequestChangeShellIntegration.fire({ terminal: this._terminal, shellIntegration: this.value });
            }
        }
    }
    class InternalTerminalShellExecution {
        constructor(terminal, _commandLine, cwd) {
            this.terminal = terminal;
            this._commandLine = _commandLine;
            this.cwd = cwd;
            this._exitCode = new Promise(resolve => {
                this._exitCodeResolve = resolve;
            });
            const that = this;
            this.value = {
                get terminal() {
                    return terminal;
                },
                get commandLine() {
                    return that._commandLine;
                },
                get cwd() {
                    return cwd;
                },
                get exitCode() {
                    return that._exitCode;
                },
                createDataStream() {
                    return that._createDataStream();
                }
            };
        }
        _createDataStream() {
            if (!this._dataStream) {
                if (this._exitCodeResolve === undefined) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                this._dataStream = new ShellExecutionDataStream();
            }
            return this._dataStream.createIterable();
        }
        emitData(data) {
            this._dataStream?.emitData(data);
        }
        endExecution(commandLine, exitCode) {
            if (commandLine) {
                this._commandLine = commandLine;
            }
            this._dataStream?.endExecution();
            this._dataStream = undefined;
            this._exitCodeResolve?.(exitCode);
            this._exitCodeResolve = undefined;
        }
    }
    class ShellExecutionDataStream extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._emitters = [];
        }
        createIterable() {
            const barrier = this._barrier = new async_1.Barrier();
            const iterable = new async_1.AsyncIterableObject(async (emitter) => {
                this._emitters.push(emitter);
                await barrier.wait();
            });
            return iterable;
        }
        emitData(data) {
            for (const emitter of this._emitters) {
                emitter.emitOne(data);
            }
        }
        endExecution() {
            this._barrier?.open();
            this._barrier = undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlcm1pbmFsU2hlbGxJbnRlZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRlcm1pbmFsU2hlbGxJbnRlZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQm5GLFFBQUEsZ0NBQWdDLEdBQUcsSUFBQSwrQkFBZSxFQUFtQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBRS9ILElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEsc0JBQVU7UUFlOUQsWUFDcUIsVUFBOEIsRUFDekIsdUJBQWlFO1lBRTFGLEtBQUssRUFBRSxDQUFDO1lBRmtDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBeUI7WUFYbkYsNkJBQXdCLEdBQWdFLElBQUksR0FBRyxFQUFFLENBQUM7WUFFdkYseUNBQW9DLEdBQUcsSUFBSSxlQUFPLEVBQThDLENBQUM7WUFDM0csd0NBQW1DLEdBQUcsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQztZQUM1RSxzQ0FBaUMsR0FBRyxJQUFJLGVBQU8sRUFBaUMsQ0FBQztZQUMzRixxQ0FBZ0MsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDO1lBQ3RFLG9DQUErQixHQUFHLElBQUksZUFBTyxFQUFpQyxDQUFDO1lBQ3pGLG1DQUE4QixHQUFHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUM7WUFRcEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsa0NBQWtDLENBQUMsQ0FBQztZQUVsRixxQkFBcUI7WUFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUNoQyxLQUFLLE1B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