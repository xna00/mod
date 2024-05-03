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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uuid", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, DOM, event_1, lifecycle_1, platform_1, uuid_1, nls, contextkey_1, storage_1, telemetry_1, themeService_1, editorPane_1, webviewWindowDragMonitor_1, webviewEditorInput_1, editorGroupsService_1, editorService_1, host_1, layoutService_1) {
    "use strict";
    var WebviewEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditor = exports.CONTEXT_ACTIVE_WEBVIEW_PANEL_ID = void 0;
    /**
     * Tracks the id of the actively focused webview.
     */
    exports.CONTEXT_ACTIVE_WEBVIEW_PANEL_ID = new contextkey_1.RawContextKey('activeWebviewPanelId', '', {
        type: 'string',
        description: nls.localize('context.activeWebviewId', "The viewType of the currently active webview panel."),
    });
    let WebviewEditor = class WebviewEditor extends editorPane_1.EditorPane {
        static { WebviewEditor_1 = this; }
        static { this.ID = 'WebviewEditor'; }
        get onDidFocus() { return this._onDidFocusWebview.event; }
        constructor(group, telemetryService, themeService, storageService, _editorGroupsService, _editorService, _workbenchLayoutService, _hostService, _contextKeyService) {
            super(WebviewEditor_1.ID, group, telemetryService, themeService, storageService);
            this._editorGroupsService = _editorGroupsService;
            this._editorService = _editorService;
            this._workbenchLayoutService = _workbenchLayoutService;
            this._hostService = _hostService;
            this._contextKeyService = _contextKeyService;
            this._visible = false;
            this._isDisposed = false;
            this._webviewVisibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onFocusWindowHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWebview = this._register(new event_1.Emitter());
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            const part = _editorGroupsService.getPart(group);
            this._register(event_1.Event.any(part.onDidScroll, part.onDidAddGroup, part.onDidRemoveGroup, part.onDidMoveGroup)(() => {
                if (this.webview && this._visible) {
                    this.synchronizeWebviewContainerDimensions(this.webview);
                }
            }));
        }
        get webview() {
            return this.input instanceof webviewEditorInput_1.WebviewInput ? this.input.webview : undefined;
        }
        get scopedContextKeyService() {
            return this._scopedContextKeyService.value;
        }
        createEditor(parent) {
            const element = document.createElement('div');
            this._element = element;
            this._element.id = `webview-editor-element-${(0, uuid_1.generateUuid)()}`;
            parent.appendChild(element);
            this._scopedContextKeyService.value = this._register(this._contextKeyService.createScoped(element));
        }
        dispose() {
            this._isDisposed = true;
            this._element?.remove();
            this._element = undefined;
            super.dispose();
        }
        layout(dimension) {
            this._dimension = dimension;
            if (this.webview && this._visible) {
                this.synchronizeWebviewContainerDimensions(this.webview, dimension);
            }
        }
        focus() {
            super.focus();
            if (!this._onFocusWindowHandler.value && !platform_1.isWeb) {
                // Make sure we restore focus when switching back to a VS Code window
                this._onFocusWindowHandler.value = this._hostService.onDidChangeFocus(focused => {
                    if (focused && this._editorService.activeEditorPane === this && this._workbenchLayoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                        this.focus();
                    }
                });
            }
            this.webview?.focus();
        }
        setEditorVisible(visible) {
            this._visible = visible;
            if (this.input instanceof webviewEditorInput_1.WebviewInput && this.webview) {
                if (visible) {
                    this.claimWebview(this.input);
                }
                else {
                    this.webview.release(this);
                }
            }
            super.setEditorVisible(visible);
        }
        clearInput() {
            if (this.webview) {
                this.webview.release(this);
                this._webviewVisibleDisposables.clear();
            }
            super.clearInput();
        }
        async setInput(input, options, context, token) {
            if (this.input && input.matches(this.input)) {
                return;
            }
            const alreadyOwnsWebview = input instanceof webviewEditorInput_1.WebviewInput && input.webview === this.webview;
            if (this.webview && !alreadyOwnsWebview) {
                this.webview.release(this);
            }
            await super.setInput(input, options, context, token);
            await input.resolve();
            if (token.isCancellationRequested || this._isDisposed) {
                return;
            }
            if (input instanceof webviewEditorInput_1.WebviewInput) {
                input.updateGroup(this.group.id);
                if (!alreadyOwnsWebview) {
                    this.claimWebview(input);
                }
                if (this._dimension) {
                    this.layout(this._dimension);
                }
            }
        }
        claimWebview(input) {
            input.claim(this, this.window, this.scopedContextKeyService);
            if (this._element) {
                this._element.setAttribute('aria-flowto', input.webview.container.id);
                DOM.setParentFlowTo(input.webview.container, this._element);
            }
            this._webviewVisibleDisposables.clear();
            // Webviews are not part of the normal editor dom, so we have to register our own drag and drop handler on them.
            this._webviewVisibleDisposables.add(this._editorGroupsService.createEditorDropTarget(input.webview.container, {
                containsGroup: (group) => this.group.id === group.id
            }));
            this._webviewVisibleDisposables.add(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor(this.window, () => this.webview));
            this.synchronizeWebviewContainerDimensions(input.webview);
            this._webviewVisibleDisposables.add(this.trackFocus(input.webview));
        }
        synchronizeWebviewContainerDimensions(webview, dimension) {
            if (!this._element?.isConnected) {
                return;
            }
            const rootContainer = this._workbenchLayoutService.getContainer(this.window, "workbench.parts.editor" /* Parts.EDITOR_PART */);
            webview.layoutWebviewOverElement(this._element.parentElement, dimension, rootContainer);
        }
        trackFocus(webview) {
            const store = new lifecycle_1.DisposableStore();
            // Track focus in webview content
            const webviewContentFocusTracker = DOM.trackFocus(webview.container);
            store.add(webviewContentFocusTracker);
            store.add(webviewContentFocusTracker.onDidFocus(() => this._onDidFocusWebview.fire()));
            // Track focus in webview element
            store.add(webview.onDidFocus(() => this._onDidFocusWebview.fire()));
            return store;
        }
    };
    exports.WebviewEditor = WebviewEditor;
    exports.WebviewEditor = WebviewEditor = WebviewEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, editorService_1.IEditorService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, host_1.IHostService),
        __param(8, contextkey_1.IContextKeyService)
    ], WebviewEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0VkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2Vidmlld1BhbmVsL2Jyb3dzZXIvd2Vidmlld0VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRzs7T0FFRztJQUNVLFFBQUEsK0JBQStCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLHNCQUFzQixFQUFFLEVBQUUsRUFBRTtRQUNwRyxJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLHFEQUFxRCxDQUFDO0tBQzNHLENBQUMsQ0FBQztJQUVJLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSx1QkFBVTs7aUJBRXJCLE9BQUUsR0FBRyxlQUFlLEFBQWxCLENBQW1CO1FBVzVDLElBQW9CLFVBQVUsS0FBaUIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUl0RixZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3pCLGNBQStCLEVBQzFCLG9CQUEyRCxFQUNqRSxjQUErQyxFQUN0Qyx1QkFBaUUsRUFDNUUsWUFBMkMsRUFDckMsa0JBQXVEO1lBRTNFLEtBQUssQ0FBQyxlQUFhLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFOeEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDckIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUMzRCxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9C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