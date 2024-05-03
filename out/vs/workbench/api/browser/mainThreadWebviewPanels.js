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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, errors_1, event_1, lifecycle_1, uri_1, uuid_1, configuration_1, storage_1, telemetry_1, mainThreadWebviews_1, extHostProtocol, diffEditorInput_1, webview_1, webviewEditorInput_1, webviewWorkbenchService_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewPanels = void 0;
    /**
     * Bi-directional map between webview handles and inputs.
     */
    class WebviewInputStore {
        constructor() {
            this._handlesToInputs = new Map();
            this._inputsToHandles = new Map();
        }
        add(handle, input) {
            this._handlesToInputs.set(handle, input);
            this._inputsToHandles.set(input, handle);
        }
        getHandleForInput(input) {
            return this._inputsToHandles.get(input);
        }
        getInputForHandle(handle) {
            return this._handlesToInputs.get(handle);
        }
        delete(handle) {
            const input = this.getInputForHandle(handle);
            this._handlesToInputs.delete(handle);
            if (input) {
                this._inputsToHandles.delete(input);
            }
        }
        get size() {
            return this._handlesToInputs.size;
        }
        [Symbol.iterator]() {
            return this._handlesToInputs.values();
        }
    }
    class WebviewViewTypeTransformer {
        constructor(prefix) {
            this.prefix = prefix;
        }
        fromExternal(viewType) {
            return this.prefix + viewType;
        }
        toExternal(viewType) {
            return viewType.startsWith(this.prefix)
                ? viewType.substr(this.prefix.length)
                : undefined;
        }
    }
    let MainThreadWebviewPanels = class MainThreadWebviewPanels extends lifecycle_1.Disposable {
        constructor(context, _mainThreadWebviews, _configurationService, _editorGroupService, _editorService, extensionService, storageService, _telemetryService, _webviewWorkbenchService) {
            super();
            this._mainThreadWebviews = _mainThreadWebviews;
            this._configurationService = _configurationService;
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._telemetryService = _telemetryService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this.webviewPanelViewType = new WebviewViewTypeTransformer('mainThreadWebview-');
            this._webviewInputs = new WebviewInputStore();
            this._revivers = this._register(new lifecycle_1.DisposableMap());
            this.webviewOriginStore = new webview_1.ExtensionKeyedWebviewOriginStore('mainThreadWebviewPanel.origins', storageService);
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviewPanels);
            this._register(event_1.Event.any(_editorService.onDidActiveEditorChange, _editorService.onDidVisibleEditorsChange, _editorGroupService.onDidAddGroup, _editorGroupService.onDidRemoveGroup, _editorGroupService.onDidMoveGroup)(() => {
                this.updateWebviewViewStates(this._editorService.activeEditor);
            }));
            this._register(_webviewWorkbenchService.onDidChangeActiveWebviewEditor(input => {
                this.updateWebviewViewStates(input);
            }));
            // This reviver's only job is to activate extensions.
            // This should trigger the real reviver to be registered from the extension host side.
            this._register(_webviewWorkbenchService.registerResolver({
                canResolve: (webview) => {
                    const viewType = this.webviewPanelViewType.toExternal(webview.viewType);
                    if (typeof viewType === 'string') {
                        extensionService.activateByEvent(`onWebviewPanel:${viewType}`);
                    }
                    return false;
                },
                resolveWebview: () => { throw new Error('not implemented'); }
            }));
        }
        get webviewInputs() { return this._webviewInputs; }
        addWebviewInput(handle, input, options) {
            this._webviewInputs.add(handle, input);
            this._mainThreadWebviews.addWebview(handle, input.webview, options);
            input.webview.onDidDispose(() => {
                this._proxy.$onDidDisposeWebviewPanel(handle).finally(() => {
                    this._webviewInputs.delete(handle);
                });
            });
        }
        $createWebviewPanel(extensionData, handle, viewType, initData, showOptions) {
            const targetGroup = this.getTargetGroupFromShowOptions(showOptions);
            const mainThreadShowOptions = showOptions ? {
                preserveFocus: !!showOptions.preserveFocus,
                group: targetGroup
            } : {};
            const extension = (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData);
            const origin = this.webviewOriginStore.getOrigin(viewType, extension.id);
            const webview = this._webviewWorkbenchService.openWebview({
                origin,
                providedViewType: viewType,
                title: initData.title,
                options: reviveWebviewOptions(initData.panelOptions),
                contentOptions: (0, mainThreadWebviews_1.reviveWebviewContentOptions)(initData.webviewOptions),
                extension
            }, this.webviewPanelViewType.fromExternal(viewType), initData.title, mainThreadShowOptions);
            this.addWebviewInput(handle, webview, { serializeBuffersForPostMessage: initData.serializeBuffersForPostMessage });
            const payload = {
                extensionId: extension.id.value,
                viewType
            };
            this._telemetryService.publicLog2('webviews:createWebviewPanel', payload);
        }
        $disposeWebview(handle) {
            const webview = this.tryGetWebviewInput(handle);
            if (!webview) {
                return;
            }
            webview.dispose();
        }
        $setTitle(handle, value) {
            this.tryGetWebviewInput(handle)?.setName(value);
        }
        $setIconPath(handle, value) {
            const webview = this.tryGetWebviewInput(handle);
            if (webview) {
                webview.iconPath = reviveWebviewIcon(value);
            }
        }
        $reveal(handle, showOptions) {
            const webview = this.tryGetWebviewInput(handle);
            if (!webview || webview.isDisposed()) {
                return;
            }
            const targetGroup = this.getTargetGroupFromShowOptions(showOptions);
            this._webviewWorkbenchService.revealWebview(webview, targetGroup, !!showOptions.preserveFocus);
        }
        getTargetGroupFromShowOptions(showOptions) {
            if (typeof showOptions.viewColumn === 'undefined'
                || showOptions.viewColumn === editorService_1.ACTIVE_GROUP
                || (this._editorGroupService.count === 1 && this._editorGroupService.activeGroup.isEmpty)) {
                return editorService_1.ACTIVE_GROUP;
            }
            if (showOptions.viewColumn === editorService_1.SIDE_GROUP) {
                return editorService_1.SIDE_GROUP;
            }
            if (showOptions.viewColumn >= 0) {
                // First check to see if an existing group exists
                const groupInColumn = this._editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[showOptions.viewColumn];
                if (groupInColumn) {
                    return groupInColumn.id;
                }
                // We are dealing with an unknown group and therefore need a new group.
                // Note that the new group's id may not match the one requested. We only allow
                // creating a single new group, so if someone passes in `showOptions.viewColumn = 99`
                // and there are two editor groups open, we simply create a third editor group instead
                // of creating all the groups up to 99.
                const newGroup = this._editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ });
                if (newGroup) {
                    const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this._configurationService);
                    return this._editorGroupService.addGroup(newGroup, direction);
                }
            }
            return editorService_1.ACTIVE_GROUP;
        }
        $registerSerializer(viewType, options) {
            if (this._revivers.has(viewType)) {
                throw new Error(`Reviver for ${viewType} already registered`);
            }
            this._revivers.set(viewType, this._webviewWorkbenchService.registerResolver({
                canResolve: (webviewInput) => {
                    return webviewInput.viewType === this.webviewPanelViewType.fromExternal(viewType);
                },
                resolveWebview: async (webviewInput) => {
                    const viewType = this.webviewPanelViewType.toExternal(webviewInput.viewType);
                    if (!viewType) {
                        webviewInput.webview.setHtml(this._mainThreadWebviews.getWebviewResolvedFailedContent(webviewInput.viewType));
                        return;
                    }
                    const handle = (0, uuid_1.generateUuid)();
                    this.addWebviewInput(handle, webviewInput, options);
                    let state = undefined;
                    if (webviewInput.webview.state) {
                        try {
                            state = JSON.parse(webviewInput.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewInput.webview.state);
                        }
                    }
                    try {
                        await this._proxy.$deserializeWebviewPanel(handle, viewType, {
                            title: webviewInput.getTitle(),
                            state,
                            panelOptions: webviewInput.webview.options,
                            webviewOptions: webviewInput.webview.contentOptions,
                            active: webviewInput === this._editorService.activeEditor,
                        }, (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, webviewInput.group || 0));
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewInput.webview.setHtml(this._mainThreadWebviews.getWebviewResolvedFailedContent(viewType));
                    }
                }
            }));
        }
        $unregisterSerializer(viewType) {
            if (!this._revivers.has(viewType)) {
                throw new Error(`No reviver for ${viewType} registered`);
            }
            this._revivers.deleteAndDispose(viewType);
        }
        updateWebviewViewStates(activeEditorInput) {
            if (!this._webviewInputs.size) {
                return;
            }
            const viewStates = {};
            const updateViewStatesForInput = (group, topLevelInput, editorInput) => {
                if (!(editorInput instanceof webviewEditorInput_1.WebviewInput)) {
                    return;
                }
                editorInput.updateGroup(group.id);
                const handle = this._webviewInputs.getHandleForInput(editorInput);
                if (handle) {
                    viewStates[handle] = {
                        visible: topLevelInput === group.activeEditor,
                        active: editorInput === activeEditorInput,
                        position: (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, group.id),
                    };
                }
            };
            for (const group of this._editorGroupService.groups) {
                for (const input of group.editors) {
                    if (input instanceof diffEditorInput_1.DiffEditorInput) {
                        updateViewStatesForInput(group, input, input.primary);
                        updateViewStatesForInput(group, input, input.secondary);
                    }
                    else {
                        updateViewStatesForInput(group, input, input);
                    }
                }
            }
            if (Object.keys(viewStates).length) {
                this._proxy.$onDidChangeWebviewPanelViewStates(viewStates);
            }
        }
        tryGetWebviewInput(handle) {
            return this._webviewInputs.getInputForHandle(handle);
        }
    };
    exports.MainThreadWebviewPanels = MainThreadWebviewPanels;
    exports.MainThreadWebviewPanels = MainThreadWebviewPanels = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, editorService_1.IEditorService),
        __param(5, extensions_1.IExtensionService),
        __param(6, storage_1.IStorageService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], MainThreadWebviewPanels);
    function reviveWebviewIcon(value) {
        if (!value) {
            return undefined;
        }
        return {
            light: uri_1.URI.revive(value.light),
            dark: uri_1.URI.revive(value.dark),
        };
    }
    function reviveWebviewOptions(panelOptions) {
        return {
            enableFindWidget: panelOptions.enableFindWidget,
            retainContextWhenHidden: panelOptions.retainContextWhenHidden,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdQYW5lbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkV2Vidmlld1BhbmVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHOztPQUVHO0lBQ0gsTUFBTSxpQkFBaUI7UUFBdkI7WUFDa0IscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7WUFDbkQscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7UUE4QnJFLENBQUM7UUE1Qk8sR0FBRyxDQUFDLE1BQWMsRUFBRSxLQUFtQjtZQUM3QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU0saUJBQWlCLENBQUMsS0FBbUI7WUFDM0MsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxNQUFjO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU0sTUFBTSxDQUFDLE1BQWM7WUFDM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMs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