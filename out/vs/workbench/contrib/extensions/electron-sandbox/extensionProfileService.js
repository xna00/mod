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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/ports", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/dialogs/common/dialogs", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/workbench/contrib/extensions/common/runtimeExtensionsInput", "vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/electron-sandbox/extensionHostProfiler", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, dom_1, window_1, errors_1, event_1, lifecycle_1, ports_1, nls, commands_1, dialogs_1, extensions_1, instantiation_1, native_1, productService_1, runtimeExtensionsInput_1, runtimeExtensionsEditor_1, editorService_1, extensions_2, extensionHostProfiler_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostProfileService = void 0;
    let ExtensionHostProfileService = class ExtensionHostProfileService extends lifecycle_1.Disposable {
        get state() { return this._state; }
        get lastProfile() { return this._profile; }
        constructor(_extensionService, _editorService, _instantiationService, _nativeHostService, _dialogService, _statusbarService, _productService) {
            super();
            this._extensionService = _extensionService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._nativeHostService = _nativeHostService;
            this._dialogService = _dialogService;
            this._statusbarService = _statusbarService;
            this._productService = _productService;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._onDidChangeLastProfile = this._register(new event_1.Emitter());
            this.onDidChangeLastProfile = this._onDidChangeLastProfile.event;
            this._unresponsiveProfiles = new extensions_1.ExtensionIdentifierMap();
            this._state = runtimeExtensionsEditor_1.ProfileSessionState.None;
            this.profilingStatusBarIndicatorLabelUpdater = this._register(new lifecycle_1.MutableDisposable());
            this._profile = null;
            this._profileSession = null;
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            commands_1.CommandsRegistry.registerCommand('workbench.action.extensionHostProfiler.stop', () => {
                this.stopProfiling();
                this._editorService.openEditor(runtimeExtensionsInput_1.RuntimeExtensionsInput.instance, { pinned: true });
            });
        }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            this._state = state;
            if (this._state === runtimeExtensionsEditor_1.ProfileSessionState.Running) {
                this.updateProfilingStatusBarIndicator(true);
            }
            else if (this._state === runtimeExtensionsEditor_1.ProfileSessionState.Stopping) {
                this.updateProfilingStatusBarIndicator(false);
            }
            this._onDidChangeState.fire(undefined);
        }
        updateProfilingStatusBarIndicator(visible) {
            this.profilingStatusBarIndicatorLabelUpdater.clear();
            if (visible) {
                const indicator = {
                    name: nls.localize('status.profiler', "Extension Profiler"),
                    text: nls.localize('profilingExtensionHost', "Profiling Extension Host"),
                    showProgress: true,
                    ariaLabel: nls.localize('profilingExtensionHost', "Profiling Extension Host"),
                    tooltip: nls.localize('selectAndStartDebug', "Click to stop profiling."),
                    command: 'workbench.action.extensionHostProfiler.stop'
                };
                const timeStarted = Date.now();
                const handle = (0, dom_1.disposableWindowInterval)(window_1.mainWindow, () => {
                    this.profilingStatusBarIndicator?.update({ ...indicator, text: nls.localize('profilingExtensionHostTime', "Profiling Extension Host ({0} sec)", Math.round((new Date().getTime() - timeStarted) / 1000)), });
                }, 1000);
                this.profilingStatusBarIndicatorLabelUpdater.value = handle;
                if (!this.profilingStatusBarIndicator) {
                    this.profilingStatusBarIndicator = this._statusbarService.addEntry(indicator, 'status.profiler', 1 /* StatusbarAlignment.RIGHT */);
                }
                else {
                    this.profilingStatusBarIndicator.update(indicator);
                }
            }
            else {
                if (this.profilingStatusBarIndicator) {
                    this.profilingStatusBarIndicator.dispose();
                    this.profilingStatusBarIndicator = undefined;
                }
            }
        }
        async startProfiling() {
            if (this._state !== runtimeExtensionsEditor_1.ProfileSessionState.None) {
                return null;
            }
            const inspectPorts = await this._extensionService.getInspectPorts(1 /* ExtensionHostKind.LocalProcess */, true);
            if (inspectPorts.length === 0) {
                return this._dialogService.confirm({
                    type: 'info',
                    message: nls.localize('restart1', "Profile Extensions"),
                    detail: nls.localize('restart2', "In order to profile extensions a restart is required. Do you want to restart '{0}' now?", this._productService.nameLong),
                    primaryButton: nls.localize({ key: 'restart3', comment: ['&& denotes a mnemonic'] }, "&&Restart")
                }).then(res => {
                    if (res.confirmed) {
                        this._nativeHostService.relaunch({ addArgs: [`--inspect-extensions=${(0, ports_1.randomPort)()}`] });
                    }
                });
            }
            if (inspectPorts.length > 1) {
                // TODO
                console.warn(`There are multiple extension hosts available for profiling. Picking the first one...`);
            }
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Starting);
            return this._instantiationService.createInstance(extensionHostProfiler_1.ExtensionHostProfiler, inspectPorts[0]).start().then((value) => {
                this._profileSession = value;
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Running);
            }, (err) => {
                (0, errors_1.onUnexpectedError)(err);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            });
        }
        stopProfiling() {
            if (this._state !== runtimeExtensionsEditor_1.ProfileSessionState.Running || !this._profileSession) {
                return;
            }
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Stopping);
            this._profileSession.stop().then((result) => {
                this._setLastProfile(result);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            }, (err) => {
                (0, errors_1.onUnexpectedError)(err);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            });
            this._profileSession = null;
        }
        _setLastProfile(profile) {
            this._profile = profile;
            this._onDidChangeLastProfile.fire(undefined);
        }
        getUnresponsiveProfile(extensionId) {
            return this._unresponsiveProfiles.get(extensionId);
        }
        setUnresponsiveProfile(extensionId, profile) {
            this._unresponsiveProfiles.set(extensionId, profile);
            this._setLastProfile(profile);
        }
    };
    exports.ExtensionHostProfileService = ExtensionHostProfileService;
    exports.ExtensionHostProfileService = ExtensionHostProfileService = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, native_1.INativeHostService),
        __param(4, dialogs_1.IDialogService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, productService_1.IProductService)
    ], ExtensionHostProfileService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUHJvZmlsZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25Qcm9maWxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFrQjFELElBQVcsS0FBSyxLQUFLLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBVyxXQUFXLEtBQUssT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUVsRCxZQUNvQixpQkFBcUQsRUFDeEQsY0FBK0MsRUFDeEMscUJBQTZELEVBQ2hFLGtCQUF1RCxFQUMzRCxjQUErQyxFQUM1QyxpQkFBcUQsRUFDdkQsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFSNEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN2QyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDdkIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzFDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3RDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQXhCbEQsc0JBQWlCLEdBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3hFLHFCQUFnQixHQUFnQixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRTVELDRCQUF1QixHQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUM5RSwyQkFBc0IsR0FBZ0IsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUV4RSwwQkFBcUIsR0FBRyxJQUFJLG1DQUFzQixFQUF5QixDQUFDO1lBR3JGLFdBQU0sR0FBd0IsNkNBQW1CLENBQUMsSUFBSSxDQUFDO1lBRzlDLDRDQUF1QyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFlbEcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyw2Q0FBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV6QywyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO2dCQUNwRixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLCtDQUFzQixDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLFNBQVMsQ0FBQyxLQUEwQjtZQUMzQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFFcEIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLDZDQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsaUNBQWlDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssNkNBQW1CLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU8saUNBQWlDLENBQUMsT0FBZ0I7WUFDekQsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRXJELElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxTQUFTLEdBQW9CO29CQUNsQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxvQkFBb0IsQ0FBQztvQkFDM0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsMEJBQTBCLENBQUM7b0JBQ3hFLFlBQVksRUFBRSxJQUFJO29CQUNsQixTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSwwQkFBMEIsQ0FBQztvQkFDN0UsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsMEJBQTBCLENBQUM7b0JBQ3hFLE9BQU8sRUFBRSw2Q0FBNkM7aUJBQ3RELENBQUM7Z0JBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixNQUFNLE1BQU0sR0FBRyxJQUFBLDhCQUF3QixFQUFDLG1CQUFVLEVBQUUsR0FBRyxFQUFFO29CQUN4RCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLEVBQUUsR0FBRyxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsb0NBQW9DLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDVCxJQUFJLENBQUMsdUNBQXVDLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztnQkFFNUQsSUFBSSxDQUFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO29CQUN2QyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLG1DQUEyQixDQUFDO2dCQUM1SCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEQsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO29CQUN0QyxJQUFJLENBQUMsMkJBQTJCLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzNDLElBQUksQ0FBQywyQkFBMkIsR0FBRyxTQUFTLENBQUM7Z0JBQzlDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVNLEtBQUssQ0FBQyxjQUFjO1lBQzFCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyw2Q0FBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSx5Q0FBaUMsSUFBSSxDQUFDLENBQUM7WUFFeEcsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO29CQUNsQyxJQUFJLEVBQUUsTUFBTTtvQkFDWixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLENBQUM7b0JBQ3ZELE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSx5RkFBeUYsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQztvQkFDMUosYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUM7aUJBQ2pHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ2IsSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ25CLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyx3QkFBd0IsSUFBQSxrQkFBVSxHQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDekYsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU87Z0JBQ1AsT0FBTyxDQUFDLElBQUksQ0FBQyxzRkFBc0YsQ0FBQyxDQUFDO1lBQ3RHLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLDZDQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTdDLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUIsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDL0csSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsNkNBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1YsSUFBQSwwQkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyw2Q0FBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxhQUFhO1lBQ25CLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyw2Q0FBbUIsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFFLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyw2Q0FBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUMzQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLDZDQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNWLElBQUEsMEJBQWlCLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsNkNBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztRQUM3QixDQUFDO1FBRU8sZUFBZSxDQUFDLE9BQThCO1lBQ3JELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELHNCQUFzQixDQUFDLFdBQWdDO1lBQ3RELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsc0JBQXNCLENBQUMsV0FBZ0MsRUFBRSxPQUE4QjtZQUN0RixJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLENBQUM7S0FFRCxDQUFBO0lBMUpZLGtFQUEyQjswQ0FBM0IsMkJBQTJCO1FBc0JyQyxXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwyQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsZ0NBQWUsQ0FBQTtPQTVCTCwyQkFBMkIsQ0EwSnZDIn0=