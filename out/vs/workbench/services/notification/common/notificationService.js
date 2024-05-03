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
define(["require", "exports", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/common/notifications", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/base/common/actions", "vs/platform/storage/common/storage"], function (require, exports, nls_1, notification_1, notifications_1, lifecycle_1, event_1, extensions_1, actions_1, storage_1) {
    "use strict";
    var NotificationService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationService = void 0;
    let NotificationService = class NotificationService extends lifecycle_1.Disposable {
        static { NotificationService_1 = this; }
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.model = this._register(new notifications_1.NotificationsModel());
            this._onDidAddNotification = this._register(new event_1.Emitter());
            this.onDidAddNotification = this._onDidAddNotification.event;
            this._onDidRemoveNotification = this._register(new event_1.Emitter());
            this.onDidRemoveNotification = this._onDidRemoveNotification.event;
            this._onDidChangeFilter = this._register(new event_1.Emitter());
            this.onDidChangeFilter = this._onDidChangeFilter.event;
            this.globalFilterEnabled = this.storageService.getBoolean(NotificationService_1.GLOBAL_FILTER_SETTINGS_KEY, -1 /* StorageScope.APPLICATION */, false);
            this.mapSourceToFilter = (() => {
                const map = new Map();
                for (const sourceFilter of this.storageService.getObject(NotificationService_1.PER_SOURCE_FILTER_SETTINGS_KEY, -1 /* StorageScope.APPLICATION */, [])) {
                    map.set(sourceFilter.id, sourceFilter);
                }
                return map;
            })();
            this.updateFilters();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => {
                switch (e.kind) {
                    case 0 /* NotificationChangeType.ADD */:
                    case 3 /* NotificationChangeType.REMOVE */: {
                        const source = typeof e.item.sourceId === 'string' && typeof e.item.source === 'string' ? { id: e.item.sourceId, label: e.item.source } : e.item.source;
                        const notification = {
                            message: e.item.message.original,
                            severity: e.item.severity,
                            source,
                            priority: e.item.priority
                        };
                        if (e.kind === 0 /* NotificationChangeType.ADD */) {
                            // Make sure to track sources for notifications by registering
                            // them with our do not disturb system which is backed by storage
                            if ((0, notification_1.isNotificationSource)(source)) {
                                if (!this.mapSourceToFilter.has(source.id)) {
                                    this.setFilter({ ...source, filter: notification_1.NotificationsFilter.OFF });
                                }
                                else {
                                    this.updateSourceFilter(source);
                                }
                            }
                            this._onDidAddNotification.fire(notification);
                        }
                        if (e.kind === 3 /* NotificationChangeType.REMOVE */) {
                            this._onDidRemoveNotification.fire(notification);
                        }
                        break;
                    }
                }
            }));
        }
        //#region Filters
        static { this.GLOBAL_FILTER_SETTINGS_KEY = 'notifications.doNotDisturbMode'; }
        static { this.PER_SOURCE_FILTER_SETTINGS_KEY = 'notifications.perSourceDoNotDisturbMode'; }
        setFilter(filter) {
            if (typeof filter === 'number') {
                if (this.globalFilterEnabled === (filter === notification_1.NotificationsFilter.ERROR)) {
                    return; // no change
                }
                // Store into model and persist
                this.globalFilterEnabled = filter === notification_1.NotificationsFilter.ERROR;
                this.storageService.store(NotificationService_1.GLOBAL_FILTER_SETTINGS_KEY, this.globalFilterEnabled, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                // Update model
                this.updateFilters();
                // Events
                this._onDidChangeFilter.fire();
            }
            else {
                const existing = this.mapSourceToFilter.get(filter.id);
                if (existing?.filter === filter.filter && existing.label === filter.label) {
                    return; // no change
                }
                // Store into model and persist
                this.mapSourceToFilter.set(filter.id, { id: filter.id, label: filter.label, filter: filter.filter });
                this.saveSourceFilters();
                // Update model
                this.updateFilters();
            }
        }
        getFilter(source) {
            if (source) {
                return this.mapSourceToFilter.get(source.id)?.filter ?? notification_1.NotificationsFilter.OFF;
            }
            return this.globalFilterEnabled ? notification_1.NotificationsFilter.ERROR : notification_1.NotificationsFilter.OFF;
        }
        updateSourceFilter(source) {
            const existing = this.mapSourceToFilter.get(source.id);
            if (!existing) {
                return; // nothing to do
            }
            // Store into model and persist
            if (existing.label !== source.label) {
                this.mapSourceToFilter.set(source.id, { id: source.id, label: source.label, filter: existing.filter });
                this.saveSourceFilters();
            }
        }
        saveSourceFilters() {
            this.storageService.store(NotificationService_1.PER_SOURCE_FILTER_SETTINGS_KEY, JSON.stringify([...this.mapSourceToFilter.values()]), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getFilters() {
            return [...this.mapSourceToFilter.values()];
        }
        updateFilters() {
            this.model.setFilter({
                global: this.globalFilterEnabled ? notification_1.NotificationsFilter.ERROR : notification_1.NotificationsFilter.OFF,
                sources: new Map([...this.mapSourceToFilter.values()].map(source => [source.id, source.filter]))
            });
        }
        removeFilter(sourceId) {
            if (this.mapSourceToFilter.delete(sourceId)) {
                // Persist
                this.saveSourceFilters();
                // Update model
                this.updateFilters();
            }
        }
        //#endregion
        info(message) {
            if (Array.isArray(message)) {
                for (const messageEntry of message) {
                    this.info(messageEntry);
                }
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            if (Array.isArray(message)) {
                for (const messageEntry of message) {
                    this.warn(messageEntry);
                }
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Warning, message });
        }
        error(message) {
            if (Array.isArray(message)) {
                for (const messageEntry of message) {
                    this.error(messageEntry);
                }
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Error, message });
        }
        notify(notification) {
            const toDispose = new lifecycle_1.DisposableStore();
            // Handle neverShowAgain option accordingly
            if (notification.neverShowAgain) {
                const scope = this.toStorageScope(notification.neverShowAgain);
                const id = notification.neverShowAgain.id;
                // If the user already picked to not show the notification
                // again, we return with a no-op notification here
                if (this.storageService.getBoolean(id, scope)) {
                    return new notification_1.NoOpNotification();
                }
                const neverShowAgainAction = toDispose.add(new actions_1.Action('workbench.notification.neverShowAgain', (0, nls_1.localize)('neverShowAgain', "Don't Show Again"), undefined, true, async () => {
                    // Close notification
                    handle.close();
                    // Remember choice
                    this.storageService.store(id, true, scope, 0 /* StorageTarget.USER */);
                }));
                // Insert as primary or secondary action
                const actions = {
                    primary: notification.actions?.primary || [],
                    secondary: notification.actions?.secondary || []
                };
                if (!notification.neverShowAgain.isSecondary) {
                    actions.primary = [neverShowAgainAction, ...actions.primary]; // action comes first
                }
                else {
                    actions.secondary = [...actions.secondary, neverShowAgainAction]; // actions comes last
                }
                notification.actions = actions;
            }
            // Show notification
            const handle = this.model.addNotification(notification);
            // Cleanup when notification gets disposed
            event_1.Event.once(handle.onDidClose)(() => toDispose.dispose());
            return handle;
        }
        toStorageScope(options) {
            switch (options.scope) {
                case notification_1.NeverShowAgainScope.APPLICATION:
                    return -1 /* StorageScope.APPLICATION */;
                case notification_1.NeverShowAgainScope.PROFILE:
                    return 0 /* StorageScope.PROFILE */;
                case notification_1.NeverShowAgainScope.WORKSPACE:
                    return 1 /* StorageScope.WORKSPACE */;
                default:
                    return -1 /* StorageScope.APPLICATION */;
            }
        }
        prompt(severity, message, choices, options) {
            const toDispose = new lifecycle_1.DisposableStore();
            // Handle neverShowAgain option accordingly
            if (options?.neverShowAgain) {
                const scope = this.toStorageScope(options.neverShowAgain);
                const id = options.neverShowAgain.id;
                // If the user already picked to not show the notification
                // again, we return with a no-op notification here
                if (this.storageService.getBoolean(id, scope)) {
                    return new notification_1.NoOpNotification();
                }
                const neverShowAgainChoice = {
                    label: (0, nls_1.localize)('neverShowAgain', "Don't Show Again"),
                    run: () => this.storageService.store(id, true, scope, 0 /* StorageTarget.USER */),
                    isSecondary: options.neverShowAgain.isSecondary
                };
                // Insert as primary or secondary action
                if (!options.neverShowAgain.isSecondary) {
                    choices = [neverShowAgainChoice, ...choices]; // action comes first
                }
                else {
                    choices = [...choices, neverShowAgainChoice]; // actions comes last
                }
            }
            let choiceClicked = false;
            // Convert choices into primary/secondary actions
            const primaryActions = [];
            const secondaryActions = [];
            choices.forEach((choice, index) => {
                const action = new notifications_1.ChoiceAction(`workbench.dialog.choice.${index}`, choice);
                if (!choice.isSecondary) {
                    primaryActions.push(action);
                }
                else {
                    secondaryActions.push(action);
                }
                // React to action being clicked
                toDispose.add(action.onDidRun(() => {
                    choiceClicked = true;
                    // Close notification unless we are told to keep open
                    if (!choice.keepOpen) {
                        handle.close();
                    }
                }));
                toDispose.add(action);
            });
            // Show notification with actions
            const actions = { primary: primaryActions, secondary: secondaryActions };
            const handle = this.notify({ severity, message, actions, sticky: options?.sticky, priority: options?.priority });
            event_1.Event.once(handle.onDidClose)(() => {
                // Cleanup when notification gets disposed
                toDispose.dispose();
                // Indicate cancellation to the outside if no action was executed
                if (options && typeof options.onCancel === 'function' && !choiceClicked) {
                    options.onCancel();
                }
            });
            return handle;
        }
        status(message, options) {
            return this.model.showStatusMessage(message, options);
        }
    };
    exports.NotificationService = NotificationService;
    exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], NotificationService);
    (0, extensions_1.registerSingleton)(notification_1.INotificationService, NotificationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL25vdGlmaWNhdGlvbi9jb21tb24vbm90aWZpY2F0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7O1FBWWxELFlBQ2tCLGNBQWdEO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBRjBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQVR6RCxVQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtDQUFrQixFQUFFLENBQUMsQ0FBQztZQUV6QywwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQixDQUFDLENBQUM7WUFDN0UseUJBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUVoRCw2QkFBd0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQixDQUFDLENBQUM7WUFDaEYsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQXdEdEQsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDakUsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUVuRCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxxQkFBbUIsQ0FBQywwQkFBMEIscUNBQTRCLEtBQUssQ0FBQyxDQUFDO1lBRTdILHNCQUFpQixHQUE0RCxDQUFDLEdBQUcsRUFBRTtnQkFDbkcsTUFB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