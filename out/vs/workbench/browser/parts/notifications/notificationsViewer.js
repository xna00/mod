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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/nls", "vs/base/browser/ui/button/button", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/workbench/common/notifications", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/notification/common/notification", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/browser/event", "vs/base/browser/touch", "vs/base/common/event", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom_1, opener_1, uri_1, nls_1, button_1, actionbar_1, actions_1, instantiation_1, lifecycle_1, contextView_1, notifications_1, notificationsActions_1, keybinding_1, progressbar_1, notification_1, arrays_1, codicons_1, themables_1, dropdownActionViewItem_1, event_1, touch_1, event_2, defaultStyles_1, keyboardEvent_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var NotificationRenderer_1, NotificationTemplateRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationTemplateRenderer = exports.NotificationRenderer = exports.NotificationsListDelegate = void 0;
    class NotificationsListDelegate {
        static { this.ROW_HEIGHT = 42; }
        static { this.LINE_HEIGHT = 22; }
        constructor(container) {
            this.offsetHelper = this.createOffsetHelper(container);
        }
        createOffsetHelper(container) {
            const offsetHelper = document.createElement('div');
            offsetHelper.classList.add('notification-offset-helper');
            container.appendChild(offsetHelper);
            return offsetHelper;
        }
        getHeight(notification) {
            if (!notification.expanded) {
                return NotificationsListDelegate.ROW_HEIGHT; // return early if there are no more rows to show
            }
            // First row: message and actions
            let expandedHeight = NotificationsListDelegate.ROW_HEIGHT;
            // Dynamic height: if message overflows
            const preferredMessageHeight = this.computePreferredHeight(notification);
            const messageOverflows = NotificationsListDelegate.LINE_HEIGHT < preferredMessageHeight;
            if (messageOverflows) {
                const overflow = preferredMessageHeight - NotificationsListDelegate.LINE_HEIGHT;
                expandedHeight += overflow;
            }
            // Last row: source and buttons if we have any
            if (notification.source || (0, arrays_1.isNonEmptyArray)(notification.actions && notification.actions.primary)) {
                expandedHeight += NotificationsListDelegate.ROW_HEIGHT;
            }
            // If the expanded height is same as collapsed, unset the expanded state
            // but skip events because there is no change that has visual impact
            if (expandedHeight === NotificationsListDelegate.ROW_HEIGHT) {
                notification.collapse(true /* skip events, no change in height */);
            }
            return expandedHeight;
        }
        computePreferredHeight(notification) {
            // Prepare offset helper depending on toolbar actions count
            let actions = 0;
            if (!notification.hasProgress) {
                actions++; // close
            }
            if (notification.canCollapse) {
                actions++; // expand/collapse
            }
            if ((0, arrays_1.isNonEmptyArray)(notification.actions && notification.actions.secondary)) {
                actions++; // secondary actions
            }
            this.offsetHelper.style.width = `${450 /* notifications container width */ - (10 /* padding */ + 30 /* severity icon */ + (actions * 30) /* actions */ - (Math.max(actions - 1, 0) * 4) /* less padding for actions > 1 */)}px`;
            // Render message into offset helper
            const renderedMessage = NotificationMessageRenderer.render(notification.message);
            this.offsetHelper.appendChild(renderedMessage);
            // Compute height
            const preferredHeight = Math.max(this.offsetHelper.offsetHeight, this.offsetHelper.scrollHeight);
            // Always clear offset helper after use
            (0, dom_1.clearNode)(this.offsetHelper);
            return preferredHeight;
        }
        getTemplateId(element) {
            if (element instanceof notifications_1.NotificationViewItem) {
                return NotificationRenderer.TEMPLATE_ID;
            }
            throw new Error('unknown element type: ' + element);
        }
    }
    exports.NotificationsListDelegate = NotificationsListDelegate;
    class NotificationMessageRenderer {
        static render(message, actionHandler) {
            const messageContainer = document.createElement('span');
            for (const node of message.linkedText.nodes) {
                if (typeof node === 'string') {
                    messageContainer.appendChild(document.createTextNode(node));
                }
                else {
                    let title = node.title;
                    if (!title && node.href.startsWith('command:')) {
                        title = (0, nls_1.localize)('executeCommand', "Click to execute command '{0}'", node.href.substr('command:'.length));
                    }
                    else if (!title) {
                        title = node.href;
                    }
                    const anchor = (0, dom_1.$)('a', { href: node.href, title, tabIndex: 0 }, node.label);
                    if (actionHandler) {
                        const handleOpen = (e) => {
                            if ((0, dom_1.isEventLike)(e)) {
                                dom_1.EventHelper.stop(e, true);
                            }
                            actionHandler.callback(node.href);
                        };
                        const onClick = actionHandler.toDispose.add(new event_1.DomEmitter(anchor, dom_1.EventType.CLICK)).event;
                        const onKeydown = actionHandler.toDispose.add(new event_1.DomEmitter(anchor, dom_1.EventType.KEY_DOWN)).event;
                        const onSpaceOrEnter = event_2.Event.chain(onKeydown, $ => $.filter(e => {
                            const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                            return event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */);
                        }));
                        actionHandler.toDispose.add(touch_1.Gesture.addTarget(anchor));
                        const onTap = actionHandler.toDispose.add(new event_1.DomEmitter(anchor, touch_1.EventType.Tap)).event;
                        event_2.Event.any(onClick, onTap, onSpaceOrEnter)(handleOpen, null, actionHandler.toDispose);
                    }
                    messageContainer.appendChild(anchor);
                }
            }
            return messageContainer;
        }
    }
    let NotificationRenderer = class NotificationRenderer {
        static { NotificationRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'notification'; }
        constructor(actionRunner, contextMenuService, instantiationService, notificationService) {
            this.actionRunner = actionRunner;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
        }
        get templateId() {
            return NotificationRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = new lifecycle_1.DisposableStore();
            // Container
            data.container = document.createElement('div');
            data.container.classList.add('notification-list-item');
            // Main Row
            data.mainRow = document.createElement('div');
            data.mainRow.classList.add('notification-list-item-main-row');
            // Icon
            data.icon = document.createElement('div');
            data.icon.classList.add('notification-list-item-icon', 'codicon');
            // Message
            data.message = document.createElement('div');
            data.message.classList.add('notification-list-item-message');
            // Toolbar
            const that = this;
            const toolbarContainer = document.createElement('div');
            toolbarContainer.classList.add('notification-list-item-toolbar-container');
            data.toolbar = new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: (0, nls_1.localize)('notificationActions', "Notification Actions"),
                actionViewItemProvider: (action, options) => {
                    if (action instanceof notificationsActions_1.ConfigureNotificationAction) {
                        return data.toDispose.add(new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, {
                            getActions() {
                                const actions = [];
                                const source = { id: action.notification.sourceId, label: action.notification.source };
                                if ((0, notification_1.isNotificationSource)(source)) {
                                    const isSourceFiltered = that.notificationService.getFilter(source) === notification_1.NotificationsFilter.ERROR;
                                    actions.push((0, actions_1.toAction)({
                                        id: source.id,
                                        label: isSourceFiltered ? (0, nls_1.localize)('turnOnNotifications', "Turn On Notifications from '{0}'", source.label) : (0, nls_1.localize)('turnOffNotifications', "Turn Off Notifications from '{0}'", source.label),
                                        run: () => that.notificationService.setFilter({ ...source, filter: isSourceFiltered ? notification_1.NotificationsFilter.OFF : notification_1.NotificationsFilter.ERROR })
                                    }));
                                    if (action.notification.actions?.secondary?.length) {
                                        actions.push(new actions_1.Separator());
                                    }
                                }
                                if (Array.isArray(action.notification.actions?.secondary)) {
                                    actions.push(...action.notification.actions.secondary);
                                }
                                return actions;
                            },
                        }, this.contextMenuService, {
                            ...options,
                            actionRunner: this.actionRunner,
                            classNames: action.class
                        }));
                    }
                    return undefined;
                },
                actionRunner: this.actionRunner
            });
            data.toDispose.add(data.toolbar);
            // Details Row
            data.detailsRow = document.createElement('div');
            data.detailsRow.classList.add('notification-list-item-details-row');
            // Source
            data.source = document.createElement('div');
            data.source.classList.add('notification-list-item-source');
            // Buttons Container
            data.buttonsContainer = document.createElement('div');
            data.buttonsContainer.classList.add('notification-list-item-buttons-container');
            container.appendChild(data.container);
            // the details row appears first in order for better keyboard access to notification buttons
            data.container.appendChild(data.detailsRow);
            data.detailsRow.appendChild(data.source);
            data.detailsRow.appendChild(data.buttonsContainer);
            // main row
            data.container.appendChild(data.mainRow);
            data.mainRow.appendChild(data.icon);
            data.mainRow.appendChild(data.message);
            data.mainRow.appendChild(toolbarContainer);
            // Progress: below the rows to span the entire width of the item
            data.progress = new progressbar_1.ProgressBar(container, defaultStyles_1.defaultProgressBarStyles);
            data.toDispose.add(data.progress);
            // Renderer
            data.renderer = this.instantiationService.createInstance(NotificationTemplateRenderer, data, this.actionRunner);
            data.toDispose.add(data.renderer);
            return data;
        }
        renderElement(notification, index, data) {
            data.renderer.setInput(notification);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    };
    exports.NotificationRenderer = NotificationRenderer;
    exports.NotificationRenderer = NotificationRenderer = NotificationRenderer_1 = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, notification_1.INotificationService)
    ], NotificationRenderer);
    let NotificationTemplateRenderer = class NotificationTemplateRenderer extends lifecycle_1.Disposable {
        static { NotificationTemplateRenderer_1 = this; }
        static { this.SEVERITIES = [notification_1.Severity.Info, notification_1.Severity.Warning, notification_1.Severity.Error]; }
        constructor(template, actionRunner, openerService, instantiationService, keybindingService, contextMenuService) {
            super();
            this.template = template;
            this.actionRunner = actionRunner;
            this.openerService = openerService;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.inputDisposables = this._register(new lifecycle_1.DisposableStore());
            if (!NotificationTemplateRenderer_1.closeNotificationAction) {
                NotificationTemplateRenderer_1.closeNotificationAction = instantiationService.createInstance(notificationsActions_1.ClearNotificationAction, notificationsActions_1.ClearNotificationAction.ID, notificationsActions_1.ClearNotificationAction.LABEL);
                NotificationTemplateRenderer_1.expandNotificationAction = instantiationService.createInstance(notificationsActions_1.ExpandNotificationAction, notificationsActions_1.ExpandNotificationAction.ID, notificationsActions_1.ExpandNotificationAction.LABEL);
                NotificationTemplateRenderer_1.collapseNotificationAction = instantiationService.createInstance(notificationsActions_1.CollapseNotificationAction, notificationsActions_1.CollapseNotificationAction.ID, notificationsActions_1.CollapseNotificationAction.LABEL);
            }
        }
        setInput(notification) {
            this.inputDisposables.clear();
            this.render(notification);
        }
        render(notification) {
            // Container
            this.template.container.classList.toggle('expanded', notification.expanded);
            this.inputDisposables.add((0, dom_1.addDisposableListener)(this.template.container, dom_1.EventType.MOUSE_UP, e => {
                if (e.button === 1 /* Middle Button */) {
                    // Prevent firing the 'paste' event in the editor textarea - #109322
                    dom_1.EventHelper.stop(e, true);
                }
            }));
            this.inputDisposables.add((0, dom_1.addDisposableListener)(this.template.container, dom_1.EventType.AUXCLICK, e => {
                if (!notification.hasProgress && e.button === 1 /* Middle Button */) {
                    dom_1.EventHelper.stop(e, true);
                    notification.close();
                }
            }));
            // Severity Icon
            this.renderSeverity(notification);
            // Message
            const messageCustomHover = this.inputDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.template.message, ''));
            const messageOverflows = this.renderMessage(notification, messageCustomHover);
            // Secondary Actions
            this.renderSecondaryActions(notification, messageOverflows);
            // Source
            const sourceCustomHover = this.inputDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.template.source, ''));
            this.renderSource(notification, sourceCustomHover);
            // Buttons
            this.renderButtons(notification);
            // Progress
            this.renderProgress(notification);
            // Label Change Events that we can handle directly
            // (changes to actions require an entire redraw of
            // the notification because it has an impact on
            // epxansion state)
            this.inputDisposables.add(notification.onDidChangeContent(event => {
                switch (event.kind) {
                    case 0 /* NotificationViewItemContentChangeKind.SEVERITY */:
                        this.renderSeverity(notification);
                        break;
                    case 3 /* NotificationViewItemContentChangeKind.PROGRESS */:
                        this.renderProgress(notification);
                        break;
                    case 1 /* NotificationViewItemContentChangeKind.MESSAGE */:
                        this.renderMessage(notification, messageCustomHover);
                        break;
                }
            }));
        }
        renderSeverity(notification) {
            // first remove, then set as the codicon class names overlap
            NotificationTemplateRenderer_1.SEVERITIES.forEach(severity => {
                if (notification.severity !== severity) {
                    this.template.icon.classList.remove(...themables_1.ThemeIcon.asClassNameArray(this.toSeverityIcon(severity)));
                }
            });
            this.template.icon.classList.add(...themables_1.ThemeIcon.asClassNameArray(this.toSeverityIcon(notification.severity)));
        }
        renderMessage(notification, customHover) {
            (0, dom_1.clearNode)(this.template.message);
            this.template.message.appendChild(NotificationMessageRenderer.render(notification.message, {
                callback: link => this.openerService.open(uri_1.URI.parse(link), { allowCommands: true }),
                toDispose: this.inputDisposables
            }));
            const messageOverflows = notification.canCollapse && !notification.expanded && this.template.message.scrollWidth > this.template.message.clientWidth;
            customHover.update(messageOverflows ? this.template.message.textContent + '' : '');
            return messageOverflows;
        }
        renderSecondaryActions(notification, messageOverflows) {
            const actions = [];
            // Secondary Actions
            if ((0, arrays_1.isNonEmptyArray)(notification.actions?.secondary)) {
                const configureNotificationAction = this.instantiationService.createInstance(notificationsActions_1.ConfigureNotificationAction, notificationsActions_1.ConfigureNotificationAction.ID, notificationsActions_1.ConfigureNotificationAction.LABEL, notification);
                actions.push(configureNotificationAction);
                this.inputDisposables.add(configureNotificationAction);
            }
            // Expand / Collapse
            let showExpandCollapseAction = false;
            if (notification.canCollapse) {
                if (notification.expanded) {
                    showExpandCollapseAction = true; // allow to collapse an expanded message
                }
                else if (notification.source) {
                    showExpandCollapseAction = true; // allow to expand to details row
                }
                else if (messageOverflows) {
                    showExpandCollapseAction = true; // allow to expand if message overflows
                }
            }
            if (showExpandCollapseAction) {
                actions.push(notification.expanded ? NotificationTemplateRenderer_1.collapseNotificationAction : NotificationTemplateRenderer_1.expandNotificationAction);
            }
            // Close (unless progress is showing)
            if (!notification.hasProgress) {
                actions.push(NotificationTemplateRenderer_1.closeNotificationAction);
            }
            this.template.toolbar.clear();
            this.template.toolbar.context = notification;
            actions.forEach(action => this.template.toolbar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) }));
        }
        renderSource(notification, sourceCustomHover) {
            if (notification.expanded && notification.source) {
                this.template.source.textContent = (0, nls_1.localize)('notificationSource', "Source: {0}", notification.source);
                sourceCustomHover.update(notification.source);
            }
            else {
                this.template.source.textContent = '';
                sourceCustomHover.update('');
            }
        }
        renderButtons(notification) {
            (0, dom_1.clearNode)(this.template.buttonsContainer);
            const primaryActions = notification.actions ? notification.actions.primary : undefined;
            if (notification.expanded && (0, arrays_1.isNonEmptyArray)(primaryActions)) {
                const that = this;
                const actionRunner = new class extends actions_1.ActionRunner {
                    async runAction(action) {
                        // Run action
                        that.actionRunner.run(action, notification);
                        // Hide notification (unless explicitly prevented)
                        if (!(action instanceof notifications_1.ChoiceAction) || !action.keepOpen) {
                            notification.close();
                        }
                    }
                }();
                const buttonToolbar = this.inputDisposables.add(new button_1.ButtonBar(this.template.buttonsContainer));
                for (let i = 0; i < primaryActions.length; i++) {
                    const action = primaryActions[i];
                    const options = {
                        title: true, // assign titles to buttons in case they overflow
                        secondary: i > 0,
                        ...defaultStyles_1.defaultButtonStyles
                    };
                    const dropdownActions = action instanceof notifications_1.ChoiceAction ? action.menu : undefined;
                    const button = this.inputDisposables.add(dropdownActions ?
                        buttonToolbar.addButtonWithDropdown({
                            ...options,
                            contextMenuProvider: this.contextMenuService,
                            actions: dropdownActions,
                            actionRunner
                        }) :
                        buttonToolbar.addButton(options));
                    button.label = action.label;
                    this.inputDisposables.add(button.onDidClick(e => {
                        if (e) {
                            dom_1.EventHelper.stop(e, true);
                        }
                        actionRunner.run(action);
                    }));
                }
            }
        }
        renderProgress(notification) {
            // Return early if the item has no progress
            if (!notification.hasProgress) {
                this.template.progress.stop().hide();
                return;
            }
            // Infinite
            const state = notification.progress.state;
            if (state.infinite) {
                this.template.progress.infinite().show();
            }
            // Total / Worked
            else if (typeof state.total === 'number' || typeof state.worked === 'number') {
                if (typeof state.total === 'number' && !this.template.progress.hasTotal()) {
                    this.template.progress.total(state.total);
                }
                if (typeof state.worked === 'number') {
                    this.template.progress.setWorked(state.worked).show();
                }
            }
            // Done
            else {
                this.template.progress.done().hide();
            }
        }
        toSeverityIcon(severity) {
            switch (severity) {
                case notification_1.Severity.Warning:
                    return codicons_1.Codicon.warning;
                case notification_1.Severity.Error:
                    return codicons_1.Codicon.error;
            }
            return codicons_1.Codicon.info;
        }
        getKeybindingLabel(action) {
            const keybinding = this.keybindingService.lookupKeybinding(action.id);
            return keybinding ? keybinding.getLabel() : null;
        }
    };
    exports.NotificationTemplateRenderer = NotificationTemplateRenderer;
    exports.NotificationTemplateRenderer = NotificationTemplateRenderer = NotificationTemplateRenderer_1 = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextView_1.IContextMenuService)
    ], NotificationTemplateRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1ZpZXdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zVmlld2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErQmhHLE1BQWEseUJBQXlCO2lCQUViLGVBQVUsR0FBRyxFQUFFLENBQUM7aUJBQ2hCLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1FBSXpDLFlBQVksU0FBc0I7WUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFNBQXNCO1lBQ2hELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUV6RCxTQUFTLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRXBDLE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxTQUFTLENBQUMsWUFBbUM7WUFDNUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxpREFBaUQ7WUFDL0YsQ0FBQztZQUVELGlDQUFpQztZQUNqQyxJQUFJLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQyxVQUFVLENBQUM7WUFFMUQsdUNBQXVDO1lBQ3ZDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sZ0JBQWdCLEdBQUcseUJBQXlCLENBQUMsV0FBVyxHQUFHLHNCQUFzQixDQUFDO1lBQ3hGLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxRQUFRLEdBQUcsc0JBQXNCLEdBQUcseUJBQXlCLENBQUMsV0FBVyxDQUFDO2dCQUNoRixjQUFjLElBQUksUUFBUSxDQUFDO1lBQzVCLENBQUM7WUFFRCw4Q0FBOEM7WUFDOUMsSUFBSSxZQUFZLENBQUMsTUFBTSxJQUFJLElBQUEsd0JBQWUsRUFBQyxZQUFZLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDbEcsY0FBYyxJQUFJLHlCQUF5QixDQUFDLFVBQVUsQ0FBQztZQUN4RCxDQUFDO1lBRUQsd0VBQXdFO1lBQ3hFLG9FQUFvRTtZQUNwRSxJQUFJLGNBQWMsS0FBSyx5QkFBeUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDN0QsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBRUQsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVPLHNCQUFzQixDQUFDLFlBQW1DO1lBRWpFLDJEQUEyRDtZQUMzRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDaEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxFQUFFLENBQUMsQ0FBQyxRQUFRO1lBQ3BCLENBQUM7WUFDRCxJQUFJLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxFQUFFLENBQUMsQ0FBQyxrQkFBa0I7WUFDOUIsQ0FBQztZQUNELElBQUksSUFBQSx3QkFBZSxFQUFDLFlBQVksQ0FBQyxPQUFPLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQjtZQUNoQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLG1DQUFtQyxHQUFHLENBQUMsRUFBRSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUMsYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQztZQUVoTyxvQ0FBb0M7WUFDcEMsTUFBTSxlQUFlLEdBQUcsMkJBQTJCLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUUvQyxpQkFBaUI7WUFDakIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRWpHLHVDQUF1QztZQUN2QyxJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFN0IsT0FBTyxlQUFlLENBQUM7UUFDeEIsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUE4QjtZQUMzQyxJQUFJLE9BQU8sWUFBWSxvQ0FBb0IsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLG9CQUFvQixDQUFDLFdBQVcsQ0FBQztZQUN6QyxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsR0FBRyxPQUFPLENBQUMsQ0FBQztRQUNyRCxDQUFDOztJQXBGRiw4REFxRkM7SUF5QkQsTUFBTSwyQkFBMkI7UUFFaEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUE2QixFQUFFLGFBQXFDO1lBQ2pGLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV4RCxLQUFLLE1BQU0sSUFBSSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzdDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQzlCLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzdELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO29CQUV2QixJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7d0JBQ2hELEtBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDM0csQ0FBQzt5QkFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ25CLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUNuQixDQUFDO29CQUVELE1BQU0sTUFBTSxHQUFHLElBQUEsT0FBQyxFQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUUzRSxJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNuQixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQVUsRUFBRSxFQUFFOzRCQUNqQyxJQUFJLElBQUEsaUJBQVcsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUNwQixpQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7NEJBQzNCLENBQUM7NEJBRUQsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ25DLENBQUMsQ0FBQzt3QkFFRixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsTUFBTSxFQUFFLGVBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzt3QkFFM0YsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBVSxDQUFDLE1BQU0sRUFBRSxlQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7d0JBQ2hHLE1BQU0sY0FBYyxHQUFHLGFBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTs0QkFDL0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxxQ0FBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFFM0MsT0FBTyxLQUFLLENBQUMsTUFBTSx3QkFBZSxJQUFJLEtBQUssQ0FBQyxNQUFNLHVCQUFlLENBQUM7d0JBQ25FLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBRUosYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZUFBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUN2RCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsTUFBTSxFQUFFLGlCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO3dCQUU5RixhQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3RGLENBQUM7b0JBRUQsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sZ0JBQWdCLENBQUM7UUFDekIsQ0FBQztLQUNEO0lBRU0sSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7O2lCQUVoQixnQkFBVyxHQUFHLGNBQWMsQUFBakIsQ0FBa0I7UUFFN0MsWUFDUyxZQUEyQixFQUNHLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDNUMsbUJBQXlDO1lBSHhFLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ0csdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNyQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzVDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7UUFFakYsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sc0JBQW9CLENBQUMsV0FBVyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxJQUFJLEdBQThCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUV2QyxZQUFZO1lBQ1osSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBRXZELFdBQVc7WUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFFOUQsT0FBTztZQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFbEUsVUFBVTtZQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztZQUU3RCxVQUFVO1lBQ1YsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2RCxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHFCQUFTLENBQzNCLGdCQUFnQixFQUNoQjtnQkFDQyxTQUFTLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsc0JBQXNCLENBQUM7Z0JBQ2xFLHNCQUFzQixFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFO29CQUMzQyxJQUFJLE1BQU0sWUFBWSxrREFBMkIsRUFBRSxDQUFDO3dCQUNuRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksbURBQTBCLENBQUMsTUFBTSxFQUFFOzRCQUNoRSxVQUFVO2dDQUNULE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztnQ0FFOUIsTUFBTSxNQUFNLEdBQUcsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7Z0NBQ3ZGLElBQUksSUFBQSxtQ0FBb0IsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29DQUNsQyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssa0NBQW1CLENBQUMsS0FBSyxDQUFDO29DQUNsRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsa0JBQVEsRUFBQzt3Q0FDckIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO3dDQUNiLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxtQ0FBbUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDO3dDQUNqTSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsa0NBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxrQ0FBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztxQ0FDNUksQ0FBQyxDQUFDLENBQUM7b0NBRUosSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUM7d0NBQ3BELE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUyxFQUFFLENBQUMsQ0FBQztvQ0FDL0IsQ0FBQztnQ0FDRixDQUFDO2dDQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDO29DQUMzRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0NBQ3hELENBQUM7Z0NBRUQsT0FBTyxPQUFPLENBQUM7NEJBQ2hCLENBQUM7eUJBQ0QsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7NEJBQzNCLEdBQUcsT0FBTzs0QkFDVixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7NEJBQy9CLFVBQVUsRUFBRSxNQUFNLENBQUMsS0FBSzt5QkFDeEIsQ0FBQyxDQUFDLENBQUM7b0JBQ0wsQ0FBQztvQkFFRCxPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7YUFDL0IsQ0FDRCxDQUFDO1lBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpDLGNBQWM7WUFDZCxJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFFcEUsU0FBUztZQUNULElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUUzRCxvQkFBb0I7WUFDcEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUVoRixTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV0Qyw0RkFBNEY7WUFDNUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUVuRCxXQUFXO1lBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUzQyxnRUFBZ0U7WUFDaEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLHlCQUFXLENBQUMsU0FBUyxFQUFFLHdDQUF3QixDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWxDLFdBQVc7WUFDWCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFbEMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsYUFBYSxDQUFDLFlBQW1DLEVBQUUsS0FBYSxFQUFFLElBQStCO1lBQ2hHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxlQUFlLENBQUMsWUFBdUM7WUFDdEQsSUFBQSxtQkFBTyxFQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqQyxDQUFDOztJQTlIVyxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQU05QixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxtQ0FBb0IsQ0FBQTtPQVJWLG9CQUFvQixDQStIaEM7SUFFTSxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVOztpQkFNbkMsZUFBVSxHQUFHLENBQUMsdUJBQVEsQ0FBQyxJQUFJLEVBQUUsdUJBQVEsQ0FBQyxPQUFPLEVBQUUsdUJBQVEsQ0FBQyxLQUFLLENBQUMsQUFBcEQsQ0FBcUQ7UUFJdkYsWUFDUyxRQUFtQyxFQUNuQyxZQUEyQixFQUNuQixhQUE4QyxFQUN2QyxvQkFBNEQsRUFDL0QsaUJBQXNELEVBQ3JELGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQVBBLGFBQVEsR0FBUixRQUFRLENBQTJCO1lBQ25DLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ0Ysa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNwQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBUjdELHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQVl6RSxJQUFJLENBQUMsOEJBQTRCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDM0QsOEJBQTRCLENBQUMsdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhDQUF1QixFQUFFLDhDQUF1QixDQUFDLEVBQUUsRUFBRSw4Q0FBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDL0ssOEJBQTRCLENBQUMsd0JBQXdCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLCtDQUF3QixFQUFFLCtDQUF3QixDQUFDLEVBQUUsRUFBRSwrQ0FBd0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkwsOEJBQTRCLENBQUMsMEJBQTBCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlEQUEwQixFQUFFLGlEQUEwQixDQUFDLEVBQUUsRUFBRSxpREFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1TCxDQUFDO1FBQ0YsQ0FBQztRQUVELFFBQVEsQ0FBQyxZQUFtQztZQUMzQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRU8sTUFBTSxDQUFDLFlBQW1DO1lBRWpELFlBQVk7WUFDWixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLGVBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hHLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztvQkFDeEMsb0VBQW9FO29CQUNwRSxpQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLGVBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQ3JFLGlCQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFFMUIsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGdCQUFnQjtZQUNoQixJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRWxDLFVBQVU7WUFDVixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBQSx1Q0FBZ0IsRUFBQyxJQUFBLDhDQUF1QixFQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEksTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRTlFLG9CQUFvQjtZQUNwQixJQUFJLENBQUMsc0JBQXNCLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFNUQsU0FBUztZQUNULE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFBLHVDQUFnQixFQUFDLElBQUEsOENBQXVCLEVBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsSSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRW5ELFVBQVU7WUFDVixJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRWpDLFdBQVc7WUFDWCxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRWxDLGtEQUFrRDtZQUNsRCxrREFBa0Q7WUFDbEQsK0NBQStDO1lBQy9DLG1CQUFtQjtZQUNuQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakUsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3BCO3dCQUNDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ2xDLE1BQU07b0JBQ1A7d0JBQ0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDbEMsTUFBTTtvQkFDUDt3QkFDQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO3dCQUNyRCxNQUFNO2dCQUNSLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGNBQWMsQ0FBQyxZQUFtQztZQUN6RCw0REFBNEQ7WUFDNUQsOEJBQTRCLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDMUQsSUFBSSxZQUFZLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkcsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLHFCQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdHLENBQUM7UUFFTyxhQUFhLENBQUMsWUFBbUMsRUFBRSxXQUF5QjtZQUNuRixJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRTtnQkFDMUYsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDbkYsU0FBUyxFQUFFLElBQUksQ0FBQyxnQkFBZ0I7YUFDaEMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxXQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFFckosV0FBVyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbkYsT0FBTyxnQkFBZ0IsQ0FBQztRQUN6QixDQUFDO1FBRU8sc0JBQXNCLENBQUMsWUFBbUMsRUFBRSxnQkFBeUI7WUFDNUYsTUFBTSxPQUFPLEdBQWMsRUFBRSxDQUFDO1lBRTlCLG9CQUFvQjtZQUNwQixJQUFJLElBQUEsd0JBQWUsRUFBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RELE1BQU0sMkJBQTJCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxrREFBMkIsRUFBRSxrREFBMkIsQ0FBQyxFQUFFLEVBQUUsa0RBQTJCLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUMzTCxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBRUQsb0JBQW9CO1lBQ3BCLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDO1lBQ3JDLElBQUksWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDM0Isd0JBQXdCLEdBQUcsSUFBSSxDQUFDLENBQUMsd0NBQXdDO2dCQUMxRSxDQUFDO3FCQUFNLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNoQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsQ0FBQyxpQ0FBaUM7Z0JBQ25FLENBQUM7cUJBQU0sSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUM3Qix3QkFBd0IsR0FBRyxJQUFJLENBQUMsQ0FBQyx1Q0FBdUM7Z0JBQ3pFLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO2dCQUM5QixPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLDhCQUE0QixDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyw4QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3ZKLENBQUM7WUFFRCxxQ0FBcUM7WUFDckMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyw4QkFBNEIsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUksQ0FBQztRQUVPLFlBQVksQ0FBQyxZQUFtQyxFQUFFLGlCQUErQjtZQUN4RixJQUFJLFlBQVksQ0FBQyxRQUFRLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDdEMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYSxDQUFDLFlBQW1DO1lBQ3hELElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUxQyxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3ZGLElBQUksWUFBWSxDQUFDLFFBQVEsSUFBSSxJQUFBLHdCQUFlLEVBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUVsQixNQUFNLFlBQVksR0FBa0IsSUFBSSxLQUFNLFNBQVEsc0JBQVk7b0JBQzlDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBZTt3QkFFakQsYUFBYTt3QkFDYixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7d0JBRTVDLGtEQUFrRDt3QkFDbEQsSUFBSSxDQUFDLENBQUMsTUFBTSxZQUFZLDRCQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDM0QsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUN0QixDQUFDO29CQUNGLENBQUM7aUJBQ0QsRUFBRSxDQUFDO2dCQUVKLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2dCQUMvRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNoRCxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRWpDLE1BQU0sT0FBTyxHQUFtQjt3QkFDL0IsS0FBSyxFQUFFLElBQUksRUFBRyxpREFBaUQ7d0JBQy9ELFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQzt3QkFDaEIsR0FBRyxtQ0FBbUI7cUJBQ3RCLENBQUM7b0JBRUYsTUFBTSxlQUFlLEdBQUcsTUFBTSxZQUFZLDRCQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDakYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDekQsYUFBYSxDQUFDLHFCQUFxQixDQUFDOzRCQUNuQyxHQUFHLE9BQU87NEJBQ1YsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGtCQUFrQjs0QkFDNUMsT0FBTyxFQUFFLGVBQWU7NEJBQ3hCLFlBQVk7eUJBQ1osQ0FBQyxDQUFDLENBQUM7d0JBQ0osYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FDaEMsQ0FBQztvQkFFRixNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBRTVCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDL0MsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDUCxpQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQzNCLENBQUM7d0JBRUQsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxjQUFjLENBQUMsWUFBbUM7WUFFekQsMkNBQTJDO1lBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUVyQyxPQUFPO1lBQ1IsQ0FBQztZQUVELFdBQVc7WUFDWCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUMxQyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUMsQ0FBQztZQUVELGlCQUFpQjtpQkFDWixJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5RSxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUMzRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO2dCQUVELElBQUksT0FBTyxLQUFLLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2RCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU87aUJBQ0YsQ0FBQztnQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxRQUFrQjtZQUN4QyxRQUFRLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixLQUFLLHVCQUFRLENBQUMsT0FBTztvQkFDcEIsT0FBTyxrQkFBTyxDQUFDLE9BQU8sQ0FBQztnQkFDeEIsS0FBSyx1QkFBUSxDQUFDLEtBQUs7b0JBQ2xCLE9BQU8sa0JBQU8sQ0FBQyxLQUFLLENBQUM7WUFDdkIsQ0FBQztZQUNELE9BQU8sa0JBQU8sQ0FBQyxJQUFJLENBQUM7UUFDckIsQ0FBQztRQUVPLGtCQUFrQixDQUFDLE1BQWU7WUFDekMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV0RSxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDbEQsQ0FBQzs7SUFwUVcsb0VBQTRCOzJDQUE1Qiw0QkFBNEI7UUFhdEMsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsaUNBQW1CLENBQUE7T0FoQlQsNEJBQTRCLENBcVF4QyJ9