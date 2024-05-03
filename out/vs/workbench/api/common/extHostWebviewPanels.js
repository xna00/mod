/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostWebview", "./extHost.protocol", "./extHostTypes"], function (require, exports, event_1, lifecycle_1, uri_1, uuid_1, typeConverters, extHostWebview_1, extHostProtocol, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviewPanels = void 0;
    class ExtHostWebviewPanel extends lifecycle_1.Disposable {
        #handle;
        #proxy;
        #viewType;
        #webview;
        #options;
        #title;
        #iconPath;
        #viewColumn;
        #visible;
        #active;
        #isDisposed;
        #onDidDispose;
        #onDidChangeViewState;
        constructor(handle, proxy, webview, params) {
            super();
            this.#viewColumn = undefined;
            this.#visible = true;
            this.#isDisposed = false;
            this.#onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this.#onDidDispose.event;
            this.#onDidChangeViewState = this._register(new event_1.Emitter());
            this.onDidChangeViewState = this.#onDidChangeViewState.event;
            this.#handle = handle;
            this.#proxy = proxy;
            this.#webview = webview;
            this.#viewType = params.viewType;
            this.#options = params.panelOptions;
            this.#viewColumn = params.viewColumn;
            this.#title = params.title;
            this.#active = params.active;
        }
        dispose() {
            if (this.#isDisposed) {
                return;
            }
            this.#isDisposed = true;
            this.#onDidDispose.fire();
            this.#proxy.$disposeWebview(this.#handle);
            this.#webview.dispose();
            super.dispose();
        }
        get webview() {
            this.assertNotDisposed();
            return this.#webview;
        }
        get viewType() {
            this.assertNotDisposed();
            return this.#viewType;
        }
        get title() {
            this.assertNotDisposed();
            return this.#title;
        }
        set title(value) {
            this.assertNotDisposed();
            if (this.#title !== value) {
                this.#title = value;
                this.#proxy.$setTitle(this.#handle, value);
            }
        }
        get iconPath() {
            this.assertNotDisposed();
            return this.#iconPath;
        }
        set iconPath(value) {
            this.assertNotDisposed();
            if (this.#iconPath !== value) {
                this.#iconPath = value;
                this.#proxy.$setIconPath(this.#handle, uri_1.URI.isUri(value) ? { light: value, dark: value } : value);
            }
        }
        get options() {
            return this.#options;
        }
        get viewColumn() {
            this.assertNotDisposed();
            if (typeof this.#viewColumn === 'number' && this.#viewColumn < 0) {
                // We are using a symbolic view column
                // Return undefined instead to indicate that the real view column is currently unknown but will be resolved.
                return undefined;
            }
            return this.#viewColumn;
        }
        get active() {
            this.assertNotDisposed();
            return this.#active;
        }
        get visible() {
            this.assertNotDisposed();
            return this.#visible;
        }
        _updateViewState(newState) {
            if (this.#isDisposed) {
                return;
            }
            if (this.active !== newState.active || this.visible !== newState.visible || this.viewColumn !== newState.viewColumn) {
                this.#active = newState.active;
                this.#visible = newState.visible;
                this.#viewColumn = newState.viewColumn;
                this.#onDidChangeViewState.fire({ webviewPanel: this });
            }
        }
        reveal(viewColumn, preserveFocus) {
            this.assertNotDisposed();
            this.#proxy.$reveal(this.#handle, {
                viewColumn: typeof viewColumn === 'undefined' ? undefined : typeConverters.ViewColumn.from(viewColumn),
                preserveFocus: !!preserveFocus
            });
        }
        assertNotDisposed() {
            if (this.#isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
    }
    class ExtHostWebviewPanels extends lifecycle_1.Disposable {
        static newHandle() {
            return (0, uuid_1.generateUuid)();
        }
        constructor(mainContext, webviews, workspace) {
            super();
            this.webviews = webviews;
            this.workspace = workspace;
            this._webviewPanels = new Map();
            this._serializers = new Map();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviewPanels);
        }
        dispose() {
            super.dispose();
            this._webviewPanels.forEach(value => value.dispose());
            this._webviewPanels.clear();
        }
        createWebviewPanel(extension, viewType, title, showOptions, options = {}) {
            const viewColumn = typeof showOptions === 'object' ? showOptions.viewColumn : showOptions;
            const webviewShowOptions = {
                viewColumn: typeConverters.ViewColumn.from(viewColumn),
                preserveFocus: typeof showOptions === 'object' && !!showOptions.preserveFocus
            };
            const serializeBuffersForPostMessage = (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension);
            const handle = ExtHostWebviewPanels.newHandle();
            this._proxy.$createWebviewPanel((0, extHostWebview_1.toExtensionData)(extension), handle, viewType, {
                title,
                panelOptions: serializeWebviewPanelOptions(options),
                webviewOptions: (0, extHostWebview_1.serializeWebviewOptions)(extension, this.workspace, options),
                serializeBuffersForPostMessage,
            }, webviewShowOptions);
            const webview = this.webviews.createNewWebview(handle, options, extension);
            const panel = this.createNewWebviewPanel(handle, viewType, title, viewColumn, options, webview, true);
            return panel;
        }
        $onDidChangeWebviewPanelViewStates(newStates) {
            const handles = Object.keys(newStates);
            // Notify webviews of state changes in the following order:
            // - Non-visible
            // - Visible
            // - Active
            handles.sort((a, b) => {
                const stateA = newStates[a];
                const stateB = newStates[b];
                if (stateA.active) {
                    return 1;
                }
                if (stateB.active) {
                    return -1;
                }
                return (+stateA.visible) - (+stateB.visible);
            });
            for (const handle of handles) {
                const panel = this.getWebviewPanel(handle);
                if (!panel) {
                    continue;
                }
                const newState = newStates[handle];
                panel._updateViewState({
                    active: newState.active,
                    visible: newState.visible,
                    viewColumn: typeConverters.ViewColumn.to(newState.position),
                });
            }
        }
        async $onDidDisposeWebviewPanel(handle) {
            const panel = this.getWebviewPanel(handle);
            panel?.dispose();
            this._webviewPanels.delete(handle);
            this.webviews.deleteWebview(handle);
        }
        registerWebviewPanelSerializer(extension, viewType, serializer) {
            if (this._serializers.has(viewType)) {
                throw new Error(`Serializer for '${viewType}' already registered`);
            }
            this._serializers.set(viewType, { serializer, extension });
            this._proxy.$registerSerializer(viewType, {
                serializeBuffersForPostMessage: (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension)
            });
            return new extHostTypes.Disposable(() => {
                this._serializers.delete(viewType);
                this._proxy.$unregisterSerializer(viewType);
            });
        }
        async $deserializeWebviewPanel(webviewHandle, viewType, initData, position) {
            const entry = this._serializers.get(viewType);
            if (!entry) {
                throw new Error(`No serializer found for '${viewType}'`);
            }
            const { serializer, extension } = entry;
            const webview = this.webviews.createNewWebview(webviewHandle, initData.webviewOptions, extension);
            const revivedPanel = this.createNewWebviewPanel(webviewHandle, viewType, initData.title, position, initData.panelOptions, webview, initData.active);
            await serializer.deserializeWebviewPanel(revivedPanel, initData.state);
        }
        createNewWebviewPanel(webviewHandle, viewType, title, position, options, webview, active) {
            const panel = new ExtHostWebviewPanel(webviewHandle, this._proxy, webview, { viewType, title, viewColumn: position, panelOptions: options, active });
            this._webviewPanels.set(webviewHandle, panel);
            return panel;
        }
        getWebviewPanel(handle) {
            return this._webviewPanels.get(handle);
        }
    }
    exports.ExtHostWebviewPanels = ExtHostWebviewPanels;
    function serializeWebviewPanelOptions(options) {
        return {
            enableFindWidget: options.enableFindWidget,
            retainContextWhenHidden: options.retainContextWhenHidden,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXdQYW5lbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RXZWJ2aWV3UGFuZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQUVsQyxPQUFPLENBQWdDO1FBQ3ZDLE1BQU0sQ0FBK0M7UUFDckQsU0FBUyxDQUFTO1FBRWxCLFFBQVEsQ0FBaUI7UUFDekIsUUFBUSxDQUE2QjtRQUU5QyxNQUFNLENBQVM7UUFDZixTQUFTLENBQVk7UUFDckIsV0FBVyxDQUE0QztRQUN2RCxRQUFRLENBQWlCO1FBQ3pCLE9BQU8sQ0FBVTtRQUNqQixXQUFXLENBQWtCO1FBRXBCLGFBQWEsQ0FBdUM7UUFHcEQscUJBQXFCLENBQStFO1FBRzdHLFlBQ0MsTUFBcUMsRUFDckMsS0FBbUQsRUFDbkQsT0FBdUIsRUFDdkIsTUFNQztZQUVELEtBQUssRUFBRSxDQUFDO1lBdkJULGdCQUFXLEdBQWtDLFNBQVMsQ0FBQztZQUN2RCxhQUFRLEdBQVksSUFBSSxDQUFDO1lBRXpCLGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBRXBCLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDN0MsaUJBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUUvQywwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnRCxDQUFDLENBQUM7WUFDN0YseUJBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQWV2RSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsTUFB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