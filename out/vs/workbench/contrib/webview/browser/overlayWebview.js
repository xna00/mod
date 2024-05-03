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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/webview/browser/webview"], function (require, exports, dom_1, fastDomNode_1, event_1, lifecycle_1, uuid_1, contextkey_1, layoutService_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverlayWebview = void 0;
    /**
     * Webview that is absolutely positioned over another element and that can creates and destroys an underlying webview as needed.
     */
    let OverlayWebview = class OverlayWebview extends lifecycle_1.Disposable {
        get window() { return (0, dom_1.getWindowById)(this._windowId, true).window; }
        constructor(initInfo, _layoutService, _webviewService, _baseContextKeyService) {
            super();
            this._layoutService = _layoutService;
            this._webviewService = _webviewService;
            this._baseContextKeyService = _baseContextKeyService;
            this._isFirstLoad = true;
            this._firstLoadPendingMessages = new Set();
            this._webview = this._register(new lifecycle_1.MutableDisposable());
            this._webviewEvents = this._register(new lifecycle_1.DisposableStore());
            this._html = '';
            this._initialScrollProgress = 0;
            this._state = undefined;
            this._owner = undefined;
            this._windowId = undefined;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            this._shouldShowFindWidgetOnRestore = false;
            this._isDisposed = false;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidReload = this._register(new event_1.Emitter());
            this.onDidReload = this._onDidReload.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._onDidWheel = this._register(new event_1.Emitter());
            this.onDidWheel = this._onDidWheel.event;
            this._onFatalError = this._register(new event_1.Emitter());
            this.onFatalError = this._onFatalError.event;
            this.providedViewType = initInfo.providedViewType;
            this.origin = initInfo.origin ?? (0, uuid_1.generateUuid)();
            this._title = initInfo.title;
            this._extension = initInfo.extension;
            this._options = initInfo.options;
            this._contentOptions = initInfo.contentOptions;
        }
        get isFocused() {
            return !!this._webview.value?.isFocused;
        }
        dispose() {
            this._isDisposed = true;
            this._container?.domNode.remove();
            this._container = undefined;
            for (const msg of this._firstLoadPendingMessages) {
                msg.resolve(false);
            }
            this._firstLoadPendingMessages.clear();
            this._onDidDispose.fire();
            super.dispose();
        }
        get container() {
            if (this._isDisposed) {
                throw new Error(`OverlayWebview has been disposed`);
            }
            if (!this._container) {
                const node = document.createElement('div');
                node.style.position = 'absolute';
                node.style.overflow = 'hidden';
                this._container = new fastDomNode_1.FastDomNode(node);
                this._container.setVisibility('hidden');
                // Webviews cannot be reparented in the dom as it will destroy their contents.
                // Mount them to a high level node to avoid this.
                this._layoutService.getContainer(this.window).appendChild(node);
            }
            return this._container.domNode;
        }
        claim(owner, targetWindow, scopedContextKeyService) {
            if (this._isDisposed) {
                return;
            }
            const oldOwner = this._owner;
            if (this._windowId !== targetWindow.vscodeWindowId) {
                // moving to a new window
                this.release(oldOwner);
                // since we are moving to a new window, we need to dispose the webview and recreate
                this._webview.clear();
                this._webviewEvents.clear();
                this._container?.domNode.remove();
                this._container = undefined;
            }
            this._owner = owner;
            this._windowId = targetWindow.vscodeWindowId;
            this._show(targetWindow);
            if (oldOwner !== owner) {
                const contextKeyService = (scopedContextKeyService || this._baseContextKeyService);
                // Explicitly clear before creating the new context.
                // Otherwise we create the new context while the old one is still around
                this._scopedContextKeyService.clear();
                this._scopedContextKeyService.value = contextKeyService.createScoped(this.container);
                const wasFindVisible = this._findWidgetVisible?.get();
                this._findWidgetVisible?.reset();
                this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(contextKeyService);
                this._findWidgetVisible.set(!!wasFindVisible);
                this._findWidgetEnabled?.reset();
                this._findWidgetEnabled = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED.bindTo(contextKeyService);
                this._findWidgetEnabled.set(!!this.options.enableFindWidget);
                this._webview.value?.setContextKeyService(this._scopedContextKeyService.value);
            }
        }
        release(owner) {
            if (this._owner !== owner) {
                return;
            }
            this._scopedContextKeyService.clear();
            this._owner = undefined;
            if (this._container) {
                this._container.setVisibility('hidden');
            }
            if (this._options.retainContextWhenHidden) {
                // https://github.com/microsoft/vscode/issues/157424
                // We need to record the current state when retaining context so we can try to showFind() when showing webview again
                this._shouldShowFindWidgetOnRestore = !!this._findWidgetVisible?.get();
                this.hideFind(false);
            }
            else {
                this._webview.clear();
                this._webviewEvents.clear();
            }
        }
        layoutWebviewOverElement(element, dimension, clippingContainer) {
            if (!this._container || !this._container.domNode.parentElement) {
                return;
            }
            const whenContainerStylesLoaded = this._layoutService.whenContainerStylesLoaded(this.window);
            if (whenContainerStylesLoaded) {
                // In floating windows, we need to ensure that the
                // container is ready for us to compute certain
                // layout related properties.
                whenContainerStylesLoaded.then(() => this.doLayoutWebviewOverElement(element, dimension, clippingContainer));
            }
            else {
                this.doLayoutWebviewOverElement(element, dimension, clippingContainer);
            }
        }
        doLayoutWebviewOverElement(element, dimension, clippingContainer) {
            if (!this._container || !this._container.domNode.parentElement) {
                return;
            }
            const frameRect = element.getBoundingClientRect();
            const containerRect = this._container.domNode.parentElement.getBoundingClientRect();
            const parentBorderTop = (containerRect.height - this._container.domNode.parentElement.clientHeight) / 2.0;
            const parentBorderLeft = (containerRect.width - this._container.domNode.parentElement.clientWidth) / 2.0;
            this._container.setTop(frameRect.top - containerRect.top - parentBorderTop);
            this._container.setLeft(frameRect.left - containerRect.left - parentBorderLeft);
            this._container.setWidth(dimension ? dimension.width : frameRect.width);
            this._container.setHeight(dimension ? dimension.height : frameRect.height);
            if (clippingContainer) {
                const { top, left, right, bottom } = computeClippingRect(frameRect, clippingContainer);
                this._container.domNode.style.clipPath = `polygon(${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px)`;
            }
        }
        _show(targetWindow) {
            if (this._isDisposed) {
                throw new Error('OverlayWebview is disposed');
            }
            if (!this._webview.value) {
                const webview = this._webviewService.createWebviewElement({
                    providedViewType: this.providedViewType,
                    origin: this.origin,
                    title: this._title,
                    options: this._options,
                    contentOptions: this._contentOptions,
                    extension: this.extension,
                });
                this._webview.value = webview;
                webview.state = this._state;
                if (this._scopedContextKeyService.value) {
                    this._webview.value.setContextKeyService(this._scopedContextKeyService.value);
                }
                if (this._html) {
                    webview.setHtml(this._html);
                }
                if (this._options.tryRestoreScrollPosition) {
                    webview.initialScrollProgress = this._initialScrollProgress;
                }
                this._findWidgetEnabled?.set(!!this.options.enableFindWidget);
                webview.mountTo(this.container, targetWindow);
                // Forward events from inner webview to outer listeners
                this._webviewEvents.clear();
                this._webviewEvents.add(webview.onDidFocus(() => { this._onDidFocus.fire(); }));
                this._webviewEvents.add(webview.onDidBlur(() => { this._onDidBlur.fire(); }));
                this._webviewEvents.add(webview.onDidClickLink(x => { this._onDidClickLink.fire(x); }));
                this._webviewEvents.add(webview.onMessage(x => { this._onMessage.fire(x); }));
                this._webviewEvents.add(webview.onMissingCsp(x => { this._onMissingCsp.fire(x); }));
                this._webviewEvents.add(webview.onDidWheel(x => { this._onDidWheel.fire(x); }));
                this._webviewEvents.add(webview.onDidReload(() => { this._onDidReload.fire(); }));
                this._webviewEvents.add(webview.onFatalError(x => { this._onFatalError.fire(x); }));
                this._webviewEvents.add(webview.onDidScroll(x => {
                    this._initialScrollProgress = x.scrollYPercentage;
                    this._onDidScroll.fire(x);
                }));
                this._webviewEvents.add(webview.onDidUpdateState(state => {
                    this._state = state;
                    this._onDidUpdateState.fire(state);
                }));
                if (this._isFirstLoad) {
                    this._firstLoadPendingMessages.forEach(async (msg) => {
                        msg.resolve(await webview.postMessage(msg.message, msg.transfer));
                    });
                }
                this._isFirstLoad = false;
                this._firstLoadPendingMessages.clear();
            }
            // https://github.com/microsoft/vscode/issues/157424
            if (this.options.retainContextWhenHidden && this._shouldShowFindWidgetOnRestore) {
                this.showFind(false);
                // Reset
                this._shouldShowFindWidgetOnRestore = false;
            }
            this._container?.setVisibility('visible');
        }
        setHtml(html) {
            this._html = html;
            this._withWebview(webview => webview.setHtml(html));
        }
        setTitle(title) {
            this._title = title;
            this._withWebview(webview => webview.setTitle(title));
        }
        get initialScrollProgress() { return this._initialScrollProgress; }
        set initialScrollProgress(value) {
            this._initialScrollProgress = value;
            this._withWebview(webview => webview.initialScrollProgress = value);
        }
        get state() { return this._state; }
        set state(value) {
            this._state = value;
            this._withWebview(webview => webview.state = value);
        }
        get extension() { return this._extension; }
        set extension(value) {
            this._extension = value;
            this._withWebview(webview => webview.extension = value);
        }
        get options() { return this._options; }
        set options(value) { this._options = { customClasses: this._options.customClasses, ...value }; }
        get contentOptions() { return this._contentOptions; }
        set contentOptions(value) {
            this._contentOptions = value;
            this._withWebview(webview => webview.contentOptions = value);
        }
        set localResourcesRoot(resources) {
            this._withWebview(webview => webview.localResourcesRoot = resources);
        }
        async postMessage(message, transfer) {
            if (this._webview.value) {
                return this._webview.value.postMessage(message, transfer);
            }
            if (this._isFirstLoad) {
                let resolve;
                const p = new Promise(r => resolve = r);
                this._firstLoadPendingMessages.add({ message, transfer, resolve: resolve });
                return p;
            }
            return false;
        }
        focus() { this._webview.value?.focus(); }
        reload() { this._webview.value?.reload(); }
        selectAll() { this._webview.value?.selectAll(); }
        copy() { this._webview.value?.copy(); }
        paste() { this._webview.value?.paste(); }
        cut() { this._webview.value?.cut(); }
        undo() { this._webview.value?.undo(); }
        redo() { this._webview.value?.redo(); }
        showFind(animated = true) {
            if (this._webview.value) {
                this._webview.value.showFind(animated);
                this._findWidgetVisible?.set(true);
            }
        }
        hideFind(animated = true) {
            this._findWidgetVisible?.reset();
            this._webview.value?.hideFind(animated);
        }
        runFindAction(previous) { this._webview.value?.runFindAction(previous); }
        _withWebview(f) {
            if (this._webview.value) {
                f(this._webview.value);
            }
        }
        windowDidDragStart() {
            this._webview.value?.windowDidDragStart();
        }
        windowDidDragEnd() {
            this._webview.value?.windowDidDragEnd();
        }
        setContextKeyService(contextKeyService) {
            this._webview.value?.setContextKeyService(contextKeyService);
        }
    };
    exports.OverlayWebview = OverlayWebview;
    exports.OverlayWebview = OverlayWebview = __decorate([
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, webview_1.IWebviewService),
        __param(3, contextkey_1.IContextKeyService)
    ], OverlayWebview);
    function computeClippingRect(frameRect, clipper) {
        const rootRect = clipper.getBoundingClientRect();
        const top = Math.max(rootRect.top - frameRect.top, 0);
        const right = Math.max(frameRect.width - (frameRect.right - rootRect.right), 0);
        const bottom = Math.max(frameRect.height - (frameRect.bottom - rootRect.bottom), 0);
        const left = Math.max(rootRect.left - frameRect.left, 0);
        return { top, right, bottom, left };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheVdlYnZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci9vdmVybGF5V2Vidmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEc7O09BRUc7SUFDSSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFtQjdDLElBQVksTUFBTSxLQUFLLE9BQU8sSUFBQSxtQkFBYSxFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQWEzRSxZQUNDLFFBQXlCLEVBQ0EsY0FBd0QsRUFDaEUsZUFBaUQsRUFDOUMsc0JBQTJEO1lBRS9FLEtBQUssRUFBRSxDQUFDO1lBSmtDLG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUMvQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDN0IsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFvQjtZQWxDeEUsaUJBQVksR0FBRyxJQUFJLENBQUM7WUFDWCw4QkFBeUIsR0FBRyxJQUFJLEdBQUcsRUFBcUgsQ0FBQztZQUN6SixhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFtQixDQUFDLENBQUM7WUFDcEUsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFFaEUsVUFBSyxHQUFHLEVBQUUsQ0FBQztZQUVYLDJCQUFzQixHQUFXLENBQUMsQ0FBQztZQUNuQyxXQUFNLEdBQXVCLFNBQVMsQ0FBQztZQU12QyxXQUFNLEdBQVEsU0FBUyxDQUFDO1lBRXhCLGNBQVMsR0FBdUIsU0FBUyxDQUFDO1lBR2pDLDZCQUF3QixHQUFHLElBQUksQ0FBQyxT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