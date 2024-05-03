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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/memento", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/contrib/webviewView/browser/webviewViewService", "vs/workbench/services/activity/common/activity", "vs/workbench/services/extensions/common/extensions"], function (require, exports, dom_1, cancellation_1, event_1, lifecycle_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, opener_1, progress_1, storage_1, telemetry_1, themeService_1, viewPane_1, memento_1, views_1, viewsService_1, webview_1, webviewWindowDragMonitor_1, webviewViewService_1, activity_1, extensions_1) {
    "use strict";
    var WebviewViewPane_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewViewPane = void 0;
    const storageKeys = {
        webviewState: 'webviewState',
    };
    let WebviewViewPane = class WebviewViewPane extends viewPane_1.ViewPane {
        static { WebviewViewPane_1 = this; }
        static getOriginStore(storageService) {
            this._originStore ??= new webview_1.ExtensionKeyedWebviewOriginStore('webviewViews.origins', storageService);
            return this._originStore;
        }
        constructor(options, configurationService, contextKeyService, contextMenuService, instantiationService, keybindingService, openerService, telemetryService, themeService, viewDescriptorService, activityService, extensionService, progressService, storageService, viewService, webviewService, webviewViewService) {
            super({ ...options, titleMenuId: actions_1.MenuId.ViewTitle, showActions: viewPane_1.ViewPaneShowActions.WhenExpanded }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.activityService = activityService;
            this.extensionService = extensionService;
            this.progressService = progressService;
            this.storageService = storageService;
            this.viewService = viewService;
            this.webviewService = webviewService;
            this.webviewViewService = webviewViewService;
            this._webview = this._register(new lifecycle_1.MutableDisposable());
            this._webviewDisposables = this._register(new lifecycle_1.DisposableStore());
            this._activated = false;
            this.activity = this._register(new lifecycle_1.MutableDisposable());
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.extensionId = options.fromExtensionId;
            this.defaultTitle = this.title;
            this.memento = new memento_1.Memento(`webviewView.${this.id}`, storageService);
            this.viewState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this._register(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this._register(this.webviewViewService.onNewResolverRegistered(e => {
                if (e.viewType === this.id) {
                    // Potentially re-activate if we have a new resolver
                    this.updateTreeVisibility();
                }
            }));
            this.updateTreeVisibility();
        }
        dispose() {
            this._onDispose.fire();
            clearTimeout(this._repositionTimeout);
            super.dispose();
        }
        focus() {
            super.focus();
            this._webview.value?.focus();
        }
        renderBody(container) {
            super.renderBody(container);
            this._container = container;
            this._rootContainer = undefined;
            if (!this._resizeObserver) {
                this._resizeObserver = new ResizeObserver(() => {
                    setTimeout(() => {
                        this.layoutWebview();
                    }, 0);
                });
                this._register((0, lifecycle_1.toDisposable)(() => {
                    this._resizeObserver.disconnect();
                }));
                this._resizeObserver.observe(container);
            }
        }
        saveState() {
            if (this._webview.value) {
                this.viewState[storageKeys.webviewState] = this._webview.value.state;
            }
            this.memento.saveMemento();
            super.saveState();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.layoutWebview(new dom_1.Dimension(width, height));
        }
        updateTreeVisibility() {
            if (this.isBodyVisible()) {
                this.activate();
                this._webview.value?.claim(this, (0, dom_1.getWindow)(this.element), undefined);
            }
            else {
                this._webview.value?.release(this);
            }
        }
        activate() {
            if (this._activated) {
                return;
            }
            this._activated = true;
            const origin = this.extensionId ? WebviewViewPane_1.getOriginStore(this.storageService).getOrigin(this.id, this.extensionId) : undefined;
            const webview = this.webviewService.createWebviewOverlay({
                origin,
                providedViewType: this.id,
                title: this.title,
                options: { purpose: "webviewView" /* WebviewContentPurpose.WebviewView */ },
                contentOptions: {},
                extension: this.extensionId ? { id: this.extensionId } : undefined
            });
            webview.state = this.viewState[storageKeys.webviewState];
            this._webview.value = webview;
            if (this._container) {
                this.layoutWebview();
            }
            this._webviewDisposables.add((0, lifecycle_1.toDisposable)(() => {
                this._webview.value?.release(this);
            }));
            this._webviewDisposables.add(webview.onDidUpdateState(() => {
                this.viewState[storageKeys.webviewState] = webview.state;
            }));
            // Re-dispatch all drag events back to the drop target to support view drag drop
            for (const event of [dom_1.EventType.DRAG, dom_1.EventType.DRAG_END, dom_1.EventType.DRAG_ENTER, dom_1.EventType.DRAG_LEAVE, dom_1.EventType.DRAG_START]) {
                this._webviewDisposables.add((0, dom_1.addDisposableListener)(this._webview.value.container, event, e => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.dropTargetElement.dispatchEvent(new DragEvent(e.type, e));
                }));
            }
            this._webviewDisposables.add(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor((0, dom_1.getWindow)(this.element), () => this._webview.value));
            const source = this._webviewDisposables.add(new cancellation_1.CancellationTokenSource());
            this.withProgress(async () => {
                await this.extensionService.activateByEvent(`onView:${this.id}`);
                const self = this;
                const webviewView = {
                    webview,
                    onDidChangeVisibility: this.onDidChangeBodyVisibility,
                    onDispose: this.onDispose,
                    get title() { return self.setTitle; },
                    set title(value) { self.updateTitle(value); },
                    get description() { return self.titleDescription; },
                    set description(value) { self.updateTitleDescription(value); },
                    get badge() { return self.badge; },
                    set badge(badge) { self.updateBadge(badge); },
                    dispose: () => {
                        // Only reset and clear the webview itself. Don't dispose of the view container
                        this._activated = false;
                        this._webview.clear();
                        this._webviewDisposables.clear();
                    },
                    show: (preserveFocus) => {
                        this.viewService.openView(this.id, !preserveFocus);
                    }
                };
                await this.webviewViewService.resolve(this.id, webviewView, source.token);
            });
        }
        updateTitle(value) {
            this.setTitle = value;
            super.updateTitle(typeof value === 'string' ? value : this.defaultTitle);
        }
        updateBadge(badge) {
            if (this.badge?.value === badge?.value &&
                this.badge?.tooltip === badge?.tooltip) {
                return;
            }
            this.badge = badge;
            if (badge) {
                const activity = {
                    badge: new activity_1.NumberBadge(badge.value, () => badge.tooltip),
                    priority: 150
                };
                this.activity.value = this.activityService.showViewActivity(this.id, activity);
            }
        }
        async withProgress(task) {
            return this.progressService.withProgress({ location: this.id, delay: 500 }, task);
        }
        onDidScrollRoot() {
            this.layoutWebview();
        }
        doLayoutWebview(dimension) {
            const webviewEntry = this._webview.value;
            if (!this._container || !webviewEntry) {
                return;
            }
            if (!this._rootContainer || !this._rootContainer.isConnected) {
                this._rootContainer = this.findRootContainer(this._container);
            }
            webviewEntry.layoutWebviewOverElement(this._container, dimension, this._rootContainer);
        }
        layoutWebview(dimension) {
            this.doLayoutWebview(dimension);
            // Temporary fix for https://github.com/microsoft/vscode/issues/110450
            // There is an animation that lasts about 200ms, update the webview positioning once this animation is complete.
            clearTimeout(this._repositionTimeout);
            this._repositionTimeout = setTimeout(() => this.doLayoutWebview(dimension), 200);
        }
        findRootContainer(container) {
            return (0, dom_1.findParentWithClass)(container, 'monaco-scrollable-element') ?? undefined;
        }
    };
    exports.WebviewViewPane = WebviewViewPane;
    exports.WebviewViewPane = WebviewViewPane = WebviewViewPane_1 = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, opener_1.IOpenerService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, themeService_1.IThemeService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, activity_1.IActivityService),
        __param(11, extensions_1.IExtensionService),
        __param(12, progress_1.IProgressService),
        __param(13, storage_1.IStorageService),
        __param(14, viewsService_1.IViewsService),
        __param(15, webview_1.IWebviewService),
        __param(16, webviewViewService_1.IWebviewViewService)
    ], WebviewViewPane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1ZpZXdQYW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3Vmlldy9icm93c2VyL3dlYnZpZXdWaWV3UGFuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0JoRyxNQUFNLFdBQVcsR0FBRztRQUNuQixZQUFZLEVBQUUsY0FBYztLQUNuQixDQUFDO0lBRUosSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxtQkFBUTs7UUFJcEMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxjQUErQjtZQUM1RCxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksMENBQWdDLENBQUMsc0JBQXNCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbkcsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFzQkQsWUFDQyxPQUE0QixFQUNMLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDekMsYUFBNkIsRUFDMUIsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ2xCLHFCQUE2QyxFQUNuRCxlQUFrRCxFQUNqRCxnQkFBb0QsRUFDckQsZUFBa0QsRUFDbkQsY0FBZ0QsRUFDbEQsV0FBMkMsRUFDekMsY0FBZ0QsRUFDNUMsa0JBQXdEO1lBRTdFLEtBQUssQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLFdBQVcsRUFBRSxnQkFBTSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsOEJBQW1CLENBQUMsWUFBWSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0Is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