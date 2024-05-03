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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, event_1, lifecycle_1, uri_1, contextkey_1, editor_1, instantiation_1, terminal_1, terminal_2, terminalEditorInput_1, terminalUri_1, terminalContextKey_1, editorGroupsService_1, editorService_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorService = void 0;
    let TerminalEditorService = class TerminalEditorService extends lifecycle_1.Disposable {
        constructor(_editorService, _editorGroupsService, _terminalInstanceService, _instantiationService, lifecycleService, contextKeyService) {
            super();
            this._editorService = _editorService;
            this._editorGroupsService = _editorGroupsService;
            this._terminalInstanceService = _terminalInstanceService;
            this._instantiationService = _instantiationService;
            this.instances = [];
            this._activeInstanceIndex = -1;
            this._isShuttingDown = false;
            this._editorInputs = new Map();
            this._instanceDisposables = new Map();
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this.onDidDisposeInstance = this._onDidDisposeInstance.event;
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this.onDidFocusInstance = this._onDidFocusInstance.event;
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            this.onDidChangeInstanceCapability = this._onDidChangeInstanceCapability.event;
            this._onDidChangeActiveInstance = this._register(new event_1.Emitter());
            this.onDidChangeActiveInstance = this._onDidChangeActiveInstance.event;
            this._onDidChangeInstances = this._register(new event_1.Emitter());
            this.onDidChangeInstances = this._onDidChangeInstances.event;
            this._terminalEditorActive = terminalContextKey_1.TerminalContextKeys.terminalEditorActive.bindTo(contextKeyService);
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const d of this._instanceDisposables.values()) {
                    (0, lifecycle_1.dispose)(d);
                }
            }));
            this._register(lifecycleService.onWillShutdown(() => this._isShuttingDown = true));
            this._register(this._editorService.onDidActiveEditorChange(() => {
                const activeEditor = this._editorService.activeEditor;
                const instance = activeEditor instanceof terminalEditorInput_1.TerminalEditorInput ? activeEditor?.terminalInstance : undefined;
                const terminalEditorActive = !!instance && activeEditor instanceof terminalEditorInput_1.TerminalEditorInput;
                this._terminalEditorActive.set(terminalEditorActive);
                if (terminalEditorActive) {
                    activeEditor?.setGroup(this._editorService.activeEditorPane?.group);
                    this.setActiveInstance(instance);
                }
                else {
                    for (const instance of this.instances) {
                        instance.resetFocusContextKey();
                    }
                }
            }));
            this._register(this._editorService.onDidVisibleEditorsChange(() => {
                // add any terminal editors created via the editor service split command
                const knownIds = this.instances.map(i => i.instanceId);
                const terminalEditors = this._getActiveTerminalEditors();
                const unknownEditor = terminalEditors.find(input => {
                    const inputId = input instanceof terminalEditorInput_1.TerminalEditorInput ? input.terminalInstance?.instanceId : undefined;
                    if (inputId === undefined) {
                        return false;
                    }
                    return !knownIds.includes(inputId);
                });
                if (unknownEditor instanceof terminalEditorInput_1.TerminalEditorInput && unknownEditor.terminalInstance) {
                    this._editorInputs.set(unknownEditor.terminalInstance.resource.path, unknownEditor);
                    this.instances.push(unknownEditor.terminalInstance);
                }
            }));
            // Remove the terminal from the managed instances when the editor closes. This fires when
            // dragging and dropping to another editor or closing the editor via cmd/ctrl+w.
            this._register(this._editorService.onDidCloseEditor(e => {
                const instance = e.editor instanceof terminalEditorInput_1.TerminalEditorInput ? e.editor.terminalInstance : undefined;
                if (instance) {
                    const instanceIndex = this.instances.findIndex(e => e === instance);
                    if (instanceIndex !== -1) {
                        const wasActiveInstance = this.instances[instanceIndex] === this.activeInstance;
                        this._removeInstance(instance);
                        if (wasActiveInstance) {
                            this.setActiveInstance(undefined);
                        }
                    }
                }
            }));
        }
        _getActiveTerminalEditors() {
            return this._editorService.visibleEditors.filter(e => e instanceof terminalEditorInput_1.TerminalEditorInput && e.terminalInstance?.instanceId);
        }
        get activeInstance() {
            if (this.instances.length === 0 || this._activeInstanceIndex === -1) {
                return undefined;
            }
            return this.instances[this._activeInstanceIndex];
        }
        setActiveInstance(instance) {
            this._activeInstanceIndex = instance ? this.instances.findIndex(e => e === instance) : -1;
            this._onDidChangeActiveInstance.fire(this.activeInstance);
        }
        async focusActiveInstance() {
            return this.activeInstance?.focusWhenReady(true);
        }
        async openEditor(instance, editorOptions) {
            const resource = this.resolveResource(instance);
            if (resource) {
                await this._activeOpenEditorRequest?.promise;
                this._activeOpenEditorRequest = {
                    instanceId: instance.instanceId,
                    promise: this._editorService.openEditor({
                        resource,
                        description: instance.description || instance.shellLaunchConfig.type,
                        options: {
                            pinned: true,
                            forceReload: true,
                            preserveFocus: editorOptions?.preserveFocus
                        }
                    }, editorOptions?.viewColumn ?? editorService_1.ACTIVE_GROUP)
                };
                await this._activeOpenEditorRequest?.promise;
                this._activeOpenEditorRequest = undefined;
            }
        }
        resolveResource(instance) {
            const resource = instance.resource;
            const inputKey = resource.path;
            const cachedEditor = this._editorInputs.get(inputKey);
            if (cachedEditor) {
                return cachedEditor.resource;
            }
            instance.target = terminal_1.TerminalLocation.Editor;
            const input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, resource, instance);
            this._registerInstance(inputKey, input, instance);
            return input.resource;
        }
        getInputFromResource(resource) {
            const input = this._editorInputs.get(resource.path);
            if (!input) {
                throw new Error(`Could not get input from resource: ${resource.path}`);
            }
            return input;
        }
        _registerInstance(inputKey, input, instance) {
            this._editorInputs.set(inputKey, input);
            this._instanceDisposables.set(inputKey, [
                instance.onDidFocus(this._onDidFocusInstance.fire, this._onDidFocusInstance),
                instance.onDisposed(this._onDidDisposeInstance.fire, this._onDidDisposeInstance),
                instance.capabilities.onDidAddCapabilityType(() => this._onDidChangeInstanceCapability.fire(instance)),
                instance.capabilities.onDidRemoveCapabilityType(() => this._onDidChangeInstanceCapability.fire(instance)),
            ]);
            this.instances.push(instance);
            this._onDidChangeInstances.fire();
        }
        _removeInstance(instance) {
            const inputKey = instance.resource.path;
            this._editorInputs.delete(inputKey);
            const instanceIndex = this.instances.findIndex(e => e === instance);
            if (instanceIndex !== -1) {
                this.instances.splice(instanceIndex, 1);
            }
            const disposables = this._instanceDisposables.get(inputKey);
            this._instanceDisposables.delete(inputKey);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._onDidChangeInstances.fire();
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        splitInstance(instanceToSplit, shellLaunchConfig = {}) {
            if (instanceToSplit.target === terminal_1.TerminalLocation.Editor) {
                // Make sure the instance to split's group is active
                const group = this._editorInputs.get(instanceToSplit.resource.path)?.group;
                if (group) {
                    this._editorGroupsService.activateGroup(group);
                }
            }
            const instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Editor);
            const resource = this.resolveResource(instance);
            if (resource) {
                this._editorService.openEditor({
                    resource: uri_1.URI.revive(resource),
                    description: instance.description,
                    options: {
                        pinned: true,
                        forceReload: true
                    }
                }, editorService_1.SIDE_GROUP);
            }
            return instance;
        }
        reviveInput(deserializedInput) {
            if ('pid' in deserializedInput) {
                const newDeserializedInput = { ...deserializedInput, findRevivedId: true };
                const instance = this._terminalInstanceService.createInstance({ attachPersistentProcess: newDeserializedInput }, terminal_1.TerminalLocation.Editor);
                const input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, instance.resource, instance);
                this._registerInstance(instance.resource.path, input, instance);
                return input;
            }
            else {
                throw new Error(`Could not revive terminal editor input, ${deserializedInput}`);
            }
        }
        detachInstance(instance) {
            const inputKey = instance.resource.path;
            const editorInput = this._editorInputs.get(inputKey);
            editorInput?.detachInstance();
            this._removeInstance(instance);
            // Don't dispose the input when shutting down to avoid layouts in the editor area
            if (!this._isShuttingDown) {
                editorInput?.dispose();
            }
        }
        async revealActiveEditor(preserveFocus) {
            const instance = this.activeInstance;
            if (!instance) {
                return;
            }
            // If there is an active openEditor call for this instance it will be revealed by that
            if (this._activeOpenEditorRequest?.instanceId === instance.instanceId) {
                return;
            }
            const editorInput = this._editorInputs.get(instance.resource.path);
            this._editorService.openEditor(editorInput, {
                pinned: true,
                forceReload: true,
                preserveFocus,
                activation: editor_1.EditorActivation.PRESERVE
            });
        }
    };
    exports.TerminalEditorService = TerminalEditorService;
    exports.TerminalEditorService = TerminalEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, terminal_2.ITerminalInstanceService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, contextkey_1.IContextKeyService)
    ], TerminalEditorService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsRWRpdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUF3QnBELFlBQ2lCLGNBQStDLEVBQ3pDLG9CQUEyRCxFQUN2RCx3QkFBbUUsRUFDdEUscUJBQTZELEVBQ2pFLGdCQUFtQyxFQUNsQyxpQkFBcUM7WUFFekQsS0FBSyxFQUFFLENBQUM7WUFQeUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDdEMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUNyRCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBekJyRixjQUFTLEdBQXdCLEVBQUUsQ0FBQztZQUM1Qix5QkFBb0IsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUNsQyxvQkFBZSxHQUFHLEtBQUssQ0FBQztZQUt4QixrQkFBYSxHQUFpRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3hFLHlCQUFvQixHQUEyQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRWhFLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUNqRix5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBQ2hELHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUMvRSx1QkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1C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