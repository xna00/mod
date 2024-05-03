/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostWebview", "vs/workbench/api/common/extHostTypeConverters", "./extHost.protocol", "./extHostTypes"], function (require, exports, event_1, lifecycle_1, extHostWebview_1, extHostTypeConverters_1, extHostProtocol, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviewViews = void 0;
    /* eslint-disable local/code-no-native-private */
    class ExtHostWebviewView extends lifecycle_1.Disposable {
        #handle;
        #proxy;
        #viewType;
        #webview;
        #isDisposed;
        #isVisible;
        #title;
        #description;
        #badge;
        constructor(handle, proxy, viewType, title, webview, isVisible) {
            super();
            this.#isDisposed = false;
            this.#onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this.#onDidChangeVisibility.event;
            this.#onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this.#onDidDispose.event;
            this.#viewType = viewType;
            this.#title = title;
            this.#handle = handle;
            this.#proxy = proxy;
            this.#webview = webview;
            this.#isVisible = isVisible;
        }
        dispose() {
            if (this.#isDisposed) {
                return;
            }
            this.#isDisposed = true;
            this.#onDidDispose.fire();
            this.#webview.dispose();
            super.dispose();
        }
        #onDidChangeVisibility;
        #onDidDispose;
        get title() {
            this.assertNotDisposed();
            return this.#title;
        }
        set title(value) {
            this.assertNotDisposed();
            if (this.#title !== value) {
                this.#title = value;
                this.#proxy.$setWebviewViewTitle(this.#handle, value);
            }
        }
        get description() {
            this.assertNotDisposed();
            return this.#description;
        }
        set description(value) {
            this.assertNotDisposed();
            if (this.#description !== value) {
                this.#description = value;
                this.#proxy.$setWebviewViewDescription(this.#handle, value);
            }
        }
        get visible() { return this.#isVisible; }
        get webview() { return this.#webview; }
        get viewType() { return this.#viewType; }
        /* internal */ _setVisible(visible) {
            if (visible === this.#isVisible || this.#isDisposed) {
                return;
            }
            this.#isVisible = visible;
            this.#onDidChangeVisibility.fire();
        }
        get badge() {
            this.assertNotDisposed();
            return this.#badge;
        }
        set badge(badge) {
            this.assertNotDisposed();
            if (badge?.value === this.#badge?.value &&
                badge?.tooltip === this.#badge?.tooltip) {
                return;
            }
            this.#badge = extHostTypeConverters_1.ViewBadge.from(badge);
            this.#proxy.$setWebviewViewBadge(this.#handle, badge);
        }
        show(preserveFocus) {
            this.assertNotDisposed();
            this.#proxy.$show(this.#handle, !!preserveFocus);
        }
        assertNotDisposed() {
            if (this.#isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
    }
    class ExtHostWebviewViews {
        constructor(mainContext, _extHostWebview) {
            this._extHostWebview = _extHostWebview;
            this._viewProviders = new Map();
            this._webviewViews = new Map();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviewViews);
        }
        registerWebviewViewProvider(extension, viewType, provider, webviewOptions) {
            if (this._viewProviders.has(viewType)) {
                throw new Error(`View provider for '${viewType}' already registered`);
            }
            this._viewProviders.set(viewType, { provider, extension });
            this._proxy.$registerWebviewViewProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, {
                retainContextWhenHidden: webviewOptions?.retainContextWhenHidden,
                serializeBuffersForPostMessage: (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension),
            });
            return new extHostTypes.Disposable(() => {
                this._viewProviders.delete(viewType);
                this._proxy.$unregisterWebviewViewProvider(viewType);
            });
        }
        async $resolveWebviewView(webviewHandle, viewType, title, state, cancellation) {
            const entry = this._viewProviders.get(viewType);
            if (!entry) {
                throw new Error(`No view provider found for '${viewType}'`);
            }
            const { provider, extension } = entry;
            const webview = this._extHostWebview.createNewWebview(webviewHandle, { /* todo */}, extension);
            const revivedView = new ExtHostWebviewView(webviewHandle, this._proxy, viewType, title, webview, true);
            this._webviewViews.set(webviewHandle, revivedView);
            await provider.resolveWebviewView(revivedView, { state }, cancellation);
        }
        async $onDidChangeWebviewViewVisibility(webviewHandle, visible) {
            const webviewView = this.getWebviewView(webviewHandle);
            webviewView._setVisible(visible);
        }
        async $disposeWebviewView(webviewHandle) {
            const webviewView = this.getWebviewView(webviewHandle);
            this._webviewViews.delete(webviewHandle);
            webviewView.dispose();
            this._extHostWebview.deleteWebview(webviewHandle);
        }
        getWebviewView(handle) {
            const entry = this._webviewViews.get(handle);
            if (!entry) {
                throw new Error('No webview found');
            }
            return entry;
        }
    }
    exports.ExtHostWebviewViews = ExtHostWebviewViews;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXdWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0V2Vidmlld1ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLGlEQUFpRDtJQUVqRCxNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBRWpDLE9BQU8sQ0FBZ0M7UUFDdkMsTUFBTSxDQUE4QztRQUVwRCxTQUFTLENBQVM7UUFDbEIsUUFBUSxDQUFpQjtRQUVsQyxXQUFXLENBQVM7UUFDcEIsVUFBVSxDQUFVO1FBQ3BCLE1BQU0sQ0FBcUI7UUFDM0IsWUFBWSxDQUFxQjtRQUNqQyxNQUFNLENBQStCO1FBRXJDLFlBQ0MsTUFBcUMsRUFDckMsS0FBa0QsRUFDbEQsUUFBZ0IsRUFDaEIsS0FBeUIsRUFDekIsT0FBdUIsRUFDdkIsU0FBa0I7WUFFbEIsS0FBSyxFQUFFLENBQUM7WUFkVCxnQkFBVyxHQUFHLEtBQUssQ0FBQztZQXFDWCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN0RCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBRWpFLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDN0MsaUJBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQXpCdkQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7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