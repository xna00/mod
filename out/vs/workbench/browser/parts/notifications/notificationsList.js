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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/list/browser/listService", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/theme", "vs/workbench/browser/parts/notifications/notificationsViewer", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/platform/contextview/browser/contextView", "vs/base/common/types", "vs/workbench/common/contextkeys", "vs/base/common/lifecycle", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/css!./media/notificationsList"], function (require, exports, nls_1, dom_1, listService_1, instantiation_1, theme_1, notificationsViewer_1, notificationsActions_1, contextView_1, types_1, contextkeys_1, lifecycle_1, notificationsCommands_1, keybinding_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsList = void 0;
    let NotificationsList = class NotificationsList extends lifecycle_1.Disposable {
        constructor(container, options, instantiationService, contextMenuService) {
            super();
            this.container = container;
            this.options = options;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.viewModel = [];
        }
        show() {
            if (this.isVisible) {
                return; // already visible
            }
            // Lazily create if showing for the first time
            if (!this.list) {
                this.createNotificationsList();
            }
            // Make visible
            this.isVisible = true;
        }
        createNotificationsList() {
            // List Container
            this.listContainer = document.createElement('div');
            this.listContainer.classList.add('notifications-list-container');
            const actionRunner = this._register(this.instantiationService.createInstance(notificationsCommands_1.NotificationActionRunner));
            // Notification Renderer
            const renderer = this.instantiationService.createInstance(notificationsViewer_1.NotificationRenderer, actionRunner);
            // List
            const listDelegate = this.listDelegate = new notificationsViewer_1.NotificationsListDelegate(this.listContainer);
            const options = this.options;
            const list = this.list = this._register(this.instantiationService.createInstance(listService_1.WorkbenchList, 'NotificationsList', this.listContainer, listDelegate, [renderer], {
                ...options,
                setRowLineHeight: false,
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: theme_1.NOTIFICATIONS_BACKGROUND
                },
                accessibilityProvider: this.instantiationService.createInstance(NotificationAccessibilityProvider, options)
            }));
            // Context menu to copy message
            const copyAction = this._register(this.instantiationService.createInstance(notificationsActions_1.CopyNotificationMessageAction, notificationsActions_1.CopyNotificationMessageAction.ID, notificationsActions_1.CopyNotificationMessageAction.LABEL));
            this._register((list.onContextMenu(e => {
                if (!e.element) {
                    return;
                }
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => [copyAction],
                    getActionsContext: () => e.element,
                    actionRunner
                });
            })));
            // Toggle on double click
            this._register((list.onMouseDblClick(event => event.element.toggle())));
            // Clear focus when DOM focus moves out
            // Use document.hasFocus() to not clear the focus when the entire window lost focus
            // This ensures that when the focus comes back, the notification is still focused
            const listFocusTracker = this._register((0, dom_1.trackFocus)(list.getHTMLElement()));
            this._register(listFocusTracker.onDidBlur(() => {
                if ((0, dom_1.getWindow)(this.listContainer).document.hasFocus()) {
                    list.setFocus([]);
                }
            }));
            // Context key
            contextkeys_1.NotificationFocusedContext.bindTo(list.contextKeyService);
            // Only allow for focus in notifications, as the
            // selection is too strong over the contents of
            // the notification
            this._register(list.onDidChangeSelection(e => {
                if (e.indexes.length > 0) {
                    list.setSelection([]);
                }
            }));
            this.container.appendChild(this.listContainer);
        }
        updateNotificationsList(start, deleteCount, items = []) {
            const [list, listContainer] = (0, types_1.assertAllDefined)(this.list, this.listContainer);
            const listHasDOMFocus = (0, dom_1.isAncestorOfActiveElement)(listContainer);
            // Remember focus and relative top of that item
            const focusedIndex = list.getFocus()[0];
            const focusedItem = this.viewModel[focusedIndex];
            let focusRelativeTop = null;
            if (typeof focusedIndex === 'number') {
                focusRelativeTop = list.getRelativeTop(focusedIndex);
            }
            // Update view model
            this.viewModel.splice(start, deleteCount, ...items);
            // Update list
            list.splice(start, deleteCount, items);
            list.layout();
            // Hide if no more notifications to show
            if (this.viewModel.length === 0) {
                this.hide();
            }
            // Otherwise restore focus if we had
            else if (typeof focusedIndex === 'number') {
                let indexToFocus = 0;
                if (focusedItem) {
                    let indexToFocusCandidate = this.viewModel.indexOf(focusedItem);
                    if (indexToFocusCandidate === -1) {
                        indexToFocusCandidate = focusedIndex - 1; // item could have been removed
                    }
                    if (indexToFocusCandidate < this.viewModel.length && indexToFocusCandidate >= 0) {
                        indexToFocus = indexToFocusCandidate;
                    }
                }
                if (typeof focusRelativeTop === 'number') {
                    list.reveal(indexToFocus, focusRelativeTop);
                }
                list.setFocus([indexToFocus]);
            }
            // Restore DOM focus if we had focus before
            if (this.isVisible && listHasDOMFocus) {
                list.domFocus();
            }
        }
        updateNotificationHeight(item) {
            const index = this.viewModel.indexOf(item);
            if (index === -1) {
                return;
            }
            const [list, listDelegate] = (0, types_1.assertAllDefined)(this.list, this.listDelegate);
            list.updateElementHeight(index, listDelegate.getHeight(item));
            list.layout();
        }
        hide() {
            if (!this.isVisible || !this.list) {
                return; // already hidden
            }
            // Hide
            this.isVisible = false;
            // Clear list
            this.list.splice(0, this.viewModel.length);
            // Clear view model
            this.viewModel = [];
        }
        focusFirst() {
            if (!this.list) {
                return; // not created yet
            }
            this.list.focusFirst();
            this.list.domFocus();
        }
        hasFocus() {
            if (!this.listContainer) {
                return false; // not created yet
            }
            return (0, dom_1.isAncestorOfActiveElement)(this.listContainer);
        }
        layout(width, maxHeight) {
            if (this.listContainer && this.list) {
                this.listContainer.style.width = `${width}px`;
                if (typeof maxHeight === 'number') {
                    this.list.getHTMLElement().style.maxHeight = `${maxHeight}px`;
                }
                this.list.layout();
            }
        }
        dispose() {
            this.hide();
            super.dispose();
        }
    };
    exports.NotificationsList = NotificationsList;
    exports.NotificationsList = NotificationsList = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService)
    ], NotificationsList);
    let NotificationAccessibilityProvider = class NotificationAccessibilityProvider {
        constructor(_options, _keybindingService, _configurationService) {
            this._options = _options;
            this._keybindingService = _keybindingService;
            this._configurationService = _configurationService;
        }
        getAriaLabel(element) {
            let accessibleViewHint;
            const keybinding = this._keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel();
            if (this._configurationService.getValue('accessibility.verbosity.notification')) {
                accessibleViewHint = keybinding ? (0, nls_1.localize)('notificationAccessibleViewHint', "Inspect the response in the accessible view with {0}", keybinding) : (0, nls_1.localize)('notificationAccessibleViewHintNoKb', "Inspect the response in the accessible view via the command Open Accessible View which is currently not triggerable via keybinding");
            }
            if (!element.source) {
                return accessibleViewHint ? (0, nls_1.localize)('notificationAriaLabelHint', "{0}, notification, {1}", element.message.raw, accessibleViewHint) : (0, nls_1.localize)('notificationAriaLabel', "{0}, notification", element.message.raw);
            }
            return accessibleViewHint ? (0, nls_1.localize)('notificationWithSourceAriaLabelHint', "{0}, source: {1}, notification, {2}", element.message.raw, element.source, accessibleViewHint) : (0, nls_1.localize)('notificationWithSourceAriaLabel', "{0}, source: {1}, notification", element.message.raw, element.source);
        }
        getWidgetAriaLabel() {
            return this._options.widgetAriaLabel ?? (0, nls_1.localize)('notificationsList', "Notifications List");
        }
        getRole() {
            return 'dialog'; // https://github.com/microsoft/vscode/issues/82728
        }
    };
    NotificationAccessibilityProvider = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, configuration_1.IConfigurationService)
    ], NotificationAccessibilityProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc0xpc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9uc0xpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJ6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBUWhELFlBQ2tCLFNBQXNCLEVBQ3RCLE9BQWtDLEVBQzVCLG9CQUE0RCxFQUM5RCxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFMUyxjQUFTLEdBQVQsU0FBUyxDQUFhO1lBQ3RCLFlBQU8sR0FBUCxPQUFPLENBQTJCO1lBQ1gseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBUHRFLGNBQVMsR0FBNEIsRUFBRSxDQUFDO1FBVWhELENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxrQkFBa0I7WUFDM0IsQ0FBQztZQUVELDhDQUE4QztZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1lBRUQsZUFBZTtZQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7UUFFTyx1QkFBdUI7WUFFOUIsaUJBQWlCO1lBQ2pCLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FB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