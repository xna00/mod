/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/linkedText", "vs/base/common/map"], function (require, exports, notification_1, errorMessage_1, event_1, lifecycle_1, errors_1, actions_1, arrays_1, linkedText_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChoiceAction = exports.NotificationViewItem = exports.NotificationViewItemProgress = exports.NotificationViewItemContentChangeKind = exports.NotificationsModel = exports.NotificationHandle = exports.StatusMessageChangeType = exports.NotificationChangeType = void 0;
    exports.isNotificationViewItem = isNotificationViewItem;
    var NotificationChangeType;
    (function (NotificationChangeType) {
        /**
         * A notification was added.
         */
        NotificationChangeType[NotificationChangeType["ADD"] = 0] = "ADD";
        /**
         * A notification changed. Check `detail` property
         * on the event for additional information.
         */
        NotificationChangeType[NotificationChangeType["CHANGE"] = 1] = "CHANGE";
        /**
         * A notification expanded or collapsed.
         */
        NotificationChangeType[NotificationChangeType["EXPAND_COLLAPSE"] = 2] = "EXPAND_COLLAPSE";
        /**
         * A notification was removed.
         */
        NotificationChangeType[NotificationChangeType["REMOVE"] = 3] = "REMOVE";
    })(NotificationChangeType || (exports.NotificationChangeType = NotificationChangeType = {}));
    var StatusMessageChangeType;
    (function (StatusMessageChangeType) {
        StatusMessageChangeType[StatusMessageChangeType["ADD"] = 0] = "ADD";
        StatusMessageChangeType[StatusMessageChangeType["REMOVE"] = 1] = "REMOVE";
    })(StatusMessageChangeType || (exports.StatusMessageChangeType = StatusMessageChangeType = {}));
    class NotificationHandle extends lifecycle_1.Disposable {
        constructor(item, onClose) {
            super();
            this.item = item;
            this.onClose = onClose;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.registerListeners();
        }
        registerListeners() {
            // Visibility
            this._register(this.item.onDidChangeVisibility(visible => this._onDidChangeVisibility.fire(visible)));
            // Closing
            event_1.Event.once(this.item.onDidClose)(() => {
                this._onDidClose.fire();
                this.dispose();
            });
        }
        get progress() {
            return this.item.progress;
        }
        updateSeverity(severity) {
            this.item.updateSeverity(severity);
        }
        updateMessage(message) {
            this.item.updateMessage(message);
        }
        updateActions(actions) {
            this.item.updateActions(actions);
        }
        close() {
            this.onClose(this.item);
            this.dispose();
        }
    }
    exports.NotificationHandle = NotificationHandle;
    class NotificationsModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeNotification = this._register(new event_1.Emitter());
            this.onDidChangeNotification = this._onDidChangeNotification.event;
            this._onDidChangeStatusMessage = this._register(new event_1.Emitter());
            this.onDidChangeStatusMessage = this._onDidChangeStatusMessage.event;
            this._onDidChangeFilter = this._register(new event_1.Emitter());
            this.onDidChangeFilter = this._onDidChangeFilter.event;
            this._notifications = [];
            this.filter = {
                global: notification_1.NotificationsFilter.OFF,
                sources: new Map()
            };
        }
        static { this.NO_OP_NOTIFICATION = new notification_1.NoOpNotification(); }
        get notifications() { return this._notifications; }
        get statusMessage() { return this._statusMessage; }
        setFilter(filter) {
            let globalChanged = false;
            if (typeof filter.global === 'number') {
                globalChanged = this.filter.global !== filter.global;
                this.filter.global = filter.global;
            }
            let sourcesChanged = false;
            if (filter.sources) {
                sourcesChanged = !(0, map_1.mapsStrictEqualIgnoreOrder)(this.filter.sources, filter.sources);
                this.filter.sources = filter.sources;
            }
            if (globalChanged || sourcesChanged) {
                this._onDidChangeFilter.fire({
                    global: globalChanged ? filter.global : undefined,
                    sources: sourcesChanged ? filter.sources : undefined
                });
            }
        }
        addNotification(notification) {
            const item = this.createViewItem(notification);
            if (!item) {
                return NotificationsModel.NO_OP_NOTIFICATION; // return early if this is a no-op
            }
            // Deduplicate
            const duplicate = this.findNotification(item);
            duplicate?.close();
            // Add to list as first entry
            this._notifications.splice(0, 0, item);
            // Events
            this._onDidChangeNotification.fire({ item, index: 0, kind: 0 /* NotificationChangeType.ADD */ });
            // Wrap into handle
            return new NotificationHandle(item, item => this.onClose(item));
        }
        onClose(item) {
            const liveItem = this.findNotification(item);
            if (liveItem && liveItem !== item) {
                liveItem.close(); // item could have been replaced with another one, make sure to close the live item
            }
            else {
                item.close(); // otherwise just close the item that was passed in
            }
        }
        findNotification(item) {
            return this._notifications.find(notification => notification.equals(item));
        }
        createViewItem(notification) {
            const item = NotificationViewItem.create(notification, this.filter);
            if (!item) {
                return undefined;
            }
            // Item Events
            const fireNotificationChangeEvent = (kind, detail) => {
                const index = this._notifications.indexOf(item);
                if (index >= 0) {
                    this._onDidChangeNotification.fire({ item, index, kind, detail });
                }
            };
            const itemExpansionChangeListener = item.onDidChangeExpansion(() => fireNotificationChangeEvent(2 /* NotificationChangeType.EXPAND_COLLAPSE */));
            const itemContentChangeListener = item.onDidChangeContent(e => fireNotificationChangeEvent(1 /* NotificationChangeType.CHANGE */, e.kind));
            event_1.Event.once(item.onDidClose)(() => {
                itemExpansionChangeListener.dispose();
                itemContentChangeListener.dispose();
                const index = this._notifications.indexOf(item);
                if (index >= 0) {
                    this._notifications.splice(index, 1);
                    this._onDidChangeNotification.fire({ item, index, kind: 3 /* NotificationChangeType.REMOVE */ });
                }
            });
            return item;
        }
        showStatusMessage(message, options) {
            const item = StatusMessageViewItem.create(message, options);
            if (!item) {
                return lifecycle_1.Disposable.None;
            }
            // Remember as current status message and fire events
            this._statusMessage = item;
            this._onDidChangeStatusMessage.fire({ kind: 0 /* StatusMessageChangeType.ADD */, item });
            return (0, lifecycle_1.toDisposable)(() => {
                // Only reset status message if the item is still the one we had remembered
                if (this._statusMessage === item) {
                    this._statusMessage = undefined;
                    this._onDidChangeStatusMessage.fire({ kind: 1 /* StatusMessageChangeType.REMOVE */, item });
                }
            });
        }
    }
    exports.NotificationsModel = NotificationsModel;
    function isNotificationViewItem(obj) {
        return obj instanceof NotificationViewItem;
    }
    var NotificationViewItemContentChangeKind;
    (function (NotificationViewItemContentChangeKind) {
        NotificationViewItemContentChangeKind[NotificationViewItemContentChangeKind["SEVERITY"] = 0] = "SEVERITY";
        NotificationViewItemContentChangeKind[NotificationViewItemContentChangeKind["MESSAGE"] = 1] = "MESSAGE";
        NotificationViewItemContentChangeKind[NotificationViewItemContentChangeKind["ACTIONS"] = 2] = "ACTIONS";
        NotificationViewItemContentChangeKind[NotificationViewItemContentChangeKind["PROGRESS"] = 3] = "PROGRESS";
    })(NotificationViewItemContentChangeKind || (exports.NotificationViewItemContentChangeKind = NotificationViewItemContentChangeKind = {}));
    class NotificationViewItemProgress extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._state = Object.create(null);
        }
        get state() {
            return this._state;
        }
        infinite() {
            if (this._state.infinite) {
                return;
            }
            this._state.infinite = true;
            this._state.total = undefined;
            this._state.worked = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
        done() {
            if (this._state.done) {
                return;
            }
            this._state.done = true;
            this._state.infinite = undefined;
            this._state.total = undefined;
            this._state.worked = undefined;
            this._onDidChange.fire();
        }
        total(value) {
            if (this._state.total === value) {
                return;
            }
            this._state.total = value;
            this._state.infinite = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
        worked(value) {
            if (typeof this._state.worked === 'number') {
                this._state.worked += value;
            }
            else {
                this._state.worked = value;
            }
            this._state.infinite = undefined;
            this._state.done = undefined;
            this._onDidChange.fire();
        }
    }
    exports.NotificationViewItemProgress = NotificationViewItemProgress;
    class NotificationViewItem extends lifecycle_1.Disposable {
        static { this.MAX_MESSAGE_LENGTH = 1000; }
        static create(notification, filter) {
            if (!notification || !notification.message || (0, errors_1.isCancellationError)(notification.message)) {
                return undefined; // we need a message to show
            }
            let severity;
            if (typeof notification.severity === 'number') {
                severity = notification.severity;
            }
            else {
                severity = notification_1.Severity.Info;
            }
            const message = NotificationViewItem.parseNotificationMessage(notification.message);
            if (!message) {
                return undefined; // we need a message to show
            }
            let actions;
            if (notification.actions) {
                actions = notification.actions;
            }
            else if ((0, errorMessage_1.isErrorWithActions)(notification.message)) {
                actions = { primary: notification.message.actions };
            }
            let priority = notification.priority ?? notification_1.NotificationPriority.DEFAULT;
            if (priority === notification_1.NotificationPriority.DEFAULT && severity !== notification_1.Severity.Error) {
                if (filter.global === notification_1.NotificationsFilter.ERROR) {
                    priority = notification_1.NotificationPriority.SILENT; // filtered globally
                }
                else if ((0, notification_1.isNotificationSource)(notification.source) && filter.sources.get(notification.source.id) === notification_1.NotificationsFilter.ERROR) {
                    priority = notification_1.NotificationPriority.SILENT; // filtered by source
                }
            }
            return new NotificationViewItem(notification.id, severity, notification.sticky, priority, message, notification.source, notification.progress, actions);
        }
        static parseNotificationMessage(input) {
            let message;
            if (input instanceof Error) {
                message = (0, errorMessage_1.toErrorMessage)(input, false);
            }
            else if (typeof input === 'string') {
                message = input;
            }
            if (!message) {
                return undefined; // we need a message to show
            }
            const raw = message;
            // Make sure message is in the limits
            if (message.length > NotificationViewItem.MAX_MESSAGE_LENGTH) {
                message = `${message.substr(0, NotificationViewItem.MAX_MESSAGE_LENGTH)}...`;
            }
            // Remove newlines from messages as we do not support that and it makes link parsing hard
            message = message.replace(/(\r\n|\n|\r)/gm, ' ').trim();
            // Parse Links
            const linkedText = (0, linkedText_1.parseLinkedText)(message);
            return { raw, linkedText, original: input };
        }
        constructor(id, _severity, _sticky, _priority, _message, _source, progress, actions) {
            super();
            this.id = id;
            this._severity = _severity;
            this._sticky = _sticky;
            this._priority = _priority;
            this._message = _message;
            this._source = _source;
            this._visible = false;
            this._onDidChangeExpansion = this._register(new event_1.Emitter());
            this.onDidChangeExpansion = this._onDidChangeExpansion.event;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            if (progress) {
                this.setProgress(progress);
            }
            this.setActions(actions);
        }
        setProgress(progress) {
            if (progress.infinite) {
                this.progress.infinite();
            }
            else if (progress.total) {
                this.progress.total(progress.total);
                if (progress.worked) {
                    this.progress.worked(progress.worked);
                }
            }
        }
        setActions(actions = { primary: [], secondary: [] }) {
            this._actions = {
                primary: Array.isArray(actions.primary) ? actions.primary : [],
                secondary: Array.isArray(actions.secondary) ? actions.secondary : []
            };
            this._expanded = actions.primary && actions.primary.length > 0;
        }
        get canCollapse() {
            return !this.hasActions;
        }
        get expanded() {
            return !!this._expanded;
        }
        get severity() {
            return this._severity;
        }
        get sticky() {
            if (this._sticky) {
                return true; // explicitly sticky
            }
            const hasActions = this.hasActions;
            if ((hasActions && this._severity === notification_1.Severity.Error) || // notification errors with actions are sticky
                (!hasActions && this._expanded) || // notifications that got expanded are sticky
                (this._progress && !this._progress.state.done) // notifications with running progress are sticky
            ) {
                return true;
            }
            return false; // not sticky
        }
        get priority() {
            return this._priority;
        }
        get hasActions() {
            if (!this._actions) {
                return false;
            }
            if (!this._actions.primary) {
                return false;
            }
            return this._actions.primary.length > 0;
        }
        get hasProgress() {
            return !!this._progress;
        }
        get progress() {
            if (!this._progress) {
                this._progress = this._register(new NotificationViewItemProgress());
                this._register(this._progress.onDidChange(() => this._onDidChangeContent.fire({ kind: 3 /* NotificationViewItemContentChangeKind.PROGRESS */ })));
            }
            return this._progress;
        }
        get message() {
            return this._message;
        }
        get source() {
            return typeof this._source === 'string' ? this._source : (this._source ? this._source.label : undefined);
        }
        get sourceId() {
            return (this._source && typeof this._source !== 'string' && 'id' in this._source) ? this._source.id : undefined;
        }
        get actions() {
            return this._actions;
        }
        get visible() {
            return this._visible;
        }
        updateSeverity(severity) {
            if (severity === this._severity) {
                return;
            }
            this._severity = severity;
            this._onDidChangeContent.fire({ kind: 0 /* NotificationViewItemContentChangeKind.SEVERITY */ });
        }
        updateMessage(input) {
            const message = NotificationViewItem.parseNotificationMessage(input);
            if (!message || message.raw === this._message.raw) {
                return;
            }
            this._message = message;
            this._onDidChangeContent.fire({ kind: 1 /* NotificationViewItemContentChangeKind.MESSAGE */ });
        }
        updateActions(actions) {
            this.setActions(actions);
            this._onDidChangeContent.fire({ kind: 2 /* NotificationViewItemContentChangeKind.ACTIONS */ });
        }
        updateVisibility(visible) {
            if (this._visible !== visible) {
                this._visible = visible;
                this._onDidChangeVisibility.fire(visible);
            }
        }
        expand() {
            if (this._expanded || !this.canCollapse) {
                return;
            }
            this._expanded = true;
            this._onDidChangeExpansion.fire();
        }
        collapse(skipEvents) {
            if (!this._expanded || !this.canCollapse) {
                return;
            }
            this._expanded = false;
            if (!skipEvents) {
                this._onDidChangeExpansion.fire();
            }
        }
        toggle() {
            if (this._expanded) {
                this.collapse();
            }
            else {
                this.expand();
            }
        }
        close() {
            this._onDidClose.fire();
            this.dispose();
        }
        equals(other) {
            if (this.hasProgress || other.hasProgress) {
                return false;
            }
            if (typeof this.id === 'string' || typeof other.id === 'string') {
                return this.id === other.id;
            }
            if (typeof this._source === 'object') {
                if (this._source.label !== other.source || this._source.id !== other.sourceId) {
                    return false;
                }
            }
            else if (this._source !== other.source) {
                return false;
            }
            if (this._message.raw !== other.message.raw) {
                return false;
            }
            const primaryActions = (this._actions && this._actions.primary) || [];
            const otherPrimaryActions = (other.actions && other.actions.primary) || [];
            return (0, arrays_1.equals)(primaryActions, otherPrimaryActions, (action, otherAction) => (action.id + action.label) === (otherAction.id + otherAction.label));
        }
    }
    exports.NotificationViewItem = NotificationViewItem;
    class ChoiceAction extends actions_1.Action {
        constructor(id, choice) {
            super(id, choice.label, undefined, true, async () => {
                // Pass to runner
                choice.run();
                // Emit Event
                this._onDidRun.fire();
            });
            this._onDidRun = this._register(new event_1.Emitter());
            this.onDidRun = this._onDidRun.event;
            this._keepOpen = !!choice.keepOpen;
            this._menu = !choice.isSecondary && choice.menu ? choice.menu.map((c, index) => new ChoiceAction(`${id}.${index}`, c)) : undefined;
        }
        get menu() {
            return this._menu;
        }
        get keepOpen() {
            return this._keepOpen;
        }
    }
    exports.ChoiceAction = ChoiceAction;
    class StatusMessageViewItem {
        static create(notification, options) {
            if (!notification || (0, errors_1.isCancellationError)(notification)) {
                return undefined; // we need a message to show
            }
            let message;
            if (notification instanceof Error) {
                message = (0, errorMessage_1.toErrorMessage)(notification, false);
            }
            else if (typeof notification === 'string') {
                message = notification;
            }
            if (!message) {
                return undefined; // we need a message to show
            }
            return { message, options };
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9ub3RpZmljYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJVaEcsd0RBRUM7SUF0U0QsSUFBa0Isc0JBc0JqQjtJQXRCRCxXQUFrQixzQkFBc0I7UUFFdkM7O1dBRUc7UUFDSCxpRUFBRyxDQUFBO1FBRUg7OztXQUdHO1FBQ0gsdUVBQU0sQ0FBQTtRQUVOOztXQUVHO1FBQ0gseUZBQWUsQ0FBQTtRQUVmOztXQUVHO1FBQ0gsdUVBQU0sQ0FBQTtJQUNQLENBQUMsRUF0QmlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBc0J2QztJQTBCRCxJQUFrQix1QkFHakI7SUFIRCxXQUFrQix1QkFBdUI7UUFDeEMsbUVBQUcsQ0FBQTtRQUNILHlFQUFNLENBQUE7SUFDUCxDQUFDLEVBSGlCLHVCQUF1Qix1Q0FBdkIsdUJBQXVCLFFBR3hDO0lBb0JELE1BQWEsa0JBQW1CLFNBQVEsc0JBQVU7UUFRakQsWUFBNkIsSUFBMkIsRUFBbUIsT0FBOEM7WUFDeEgsS0FBSyxFQUFFLENBQUM7WUFEb0IsU0FBSSxHQUFKLElBQUksQ0FBdUI7WUFBbUIsWUFBTyxHQUFQLE9BQU8sQ0FBdUM7WUFOeEcsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMxRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFNUIsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDeEUsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUtsRSxJQUFJLENBQUMsaUJBQWlC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