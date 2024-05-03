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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations"], function (require, exports, arrays_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, types_1, nls_1, configuration_1, extensionManagementUtil_1, extensionRecommendations_1, instantiation_1, notification_1, storage_1, telemetry_1, uriIdentity_1, userDataSync_1, extensionsActions_1, extensions_1, environmentService_1, extensionManagement_1, extensionRecommendations_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationNotificationService = void 0;
    const ignoreImportantExtensionRecommendationStorageKey = 'extensionsAssistant/importantRecommendationsIgnore';
    const donotShowWorkspaceRecommendationsStorageKey = 'extensionsAssistant/workspaceRecommendationsIgnore';
    class RecommendationsNotification extends lifecycle_1.Disposable {
        constructor(severity, message, choices, notificationService) {
            super();
            this.severity = severity;
            this.message = message;
            this.choices = choices;
            this.notificationService = notificationService;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.cancelled = false;
            this.onDidCloseDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.onDidChangeVisibilityDisposable = this._register(new lifecycle_1.MutableDisposable());
        }
        show() {
            if (!this.notificationHandle) {
                this.updateNotificationHandle(this.notificationService.prompt(this.severity, this.message, this.choices, { sticky: true, onCancel: () => this.cancelled = true }));
            }
        }
        hide() {
            if (this.notificationHandle) {
                this.onDidCloseDisposable.clear();
                this.notificationHandle.close();
                this.cancelled = false;
                this.updateNotificationHandle(this.notificationService.prompt(this.severity, this.message, this.choices, { priority: notification_1.NotificationPriority.SILENT, onCancel: () => this.cancelled = true }));
            }
        }
        isCancelled() {
            return this.cancelled;
        }
        updateNotificationHandle(notificationHandle) {
            this.onDidCloseDisposable.clear();
            this.onDidChangeVisibilityDisposable.clear();
            this.notificationHandle = notificationHandle;
            this.onDidCloseDisposable.value = this.notificationHandle.onDidClose(() => {
                this.onDidCloseDisposable.dispose();
                this.onDidChangeVisibilityDisposable.dispose();
                this._onDidClose.fire();
                this._onDidClose.dispose();
                this._onDidChangeVisibility.dispose();
            });
            this.onDidChangeVisibilityDisposable.value = this.notificationHandle.onDidChangeVisibility((e) => this._onDidChangeVisibility.fire(e));
        }
    }
    let ExtensionRecommendationNotificationService = class ExtensionRecommendationNotificationService extends lifecycle_1.Disposable {
        // Ignored Important Recommendations
        get ignoredRecommendations() {
            return (0, arrays_1.distinct)([...JSON.parse(this.storageService.get(ignoreImportantExtensionRecommendationStorageKey, 0 /* StorageScope.PROFILE */, '[]'))].map(i => i.toLowerCase()));
        }
        constructor(configurationService, storageService, notificationService, telemetryService, instantiationService, extensionsWorkbenchService, extensionManagementService, extensionEnablementService, extensionIgnoredRecommendationsService, userDataSyncEnablementService, workbenchEnvironmentService, uriIdentityService) {
            super();
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.instantiationService = instantiationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.uriIdentityService = uriIdentityService;
            this.recommendedExtensions = [];
            this.recommendationSources = [];
            this.pendingNotificaitons = [];
        }
        hasToIgnoreRecommendationNotifications() {
            const config = this.configurationService.getValue('extensions');
            return config.ignoreRecommendations || !!config.showRecommendationsOnlyOnDemand;
        }
        async promptImportantExtensionsInstallNotification(extensionRecommendations) {
            const ignoredRecommendations = [...this.extensionIgnoredRecommendationsService.ignoredRecommendations, ...this.ignoredRecommendations];
            const extensions = extensionRecommendations.extensions.filter(id => !ignoredRecommendations.includes(id));
            if (!extensions.length) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            return this.promptRecommendationsNotification({ ...extensionRecommendations, extensions }, {
                onDidInstallRecommendedExtensions: (extensions) => extensions.forEach(extension => this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'install', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(extensionRecommendations.source) })),
                onDidShowRecommendedExtensions: (extensions) => extensions.forEach(extension => this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'show', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(extensionRecommendations.source) })),
                onDidCancelRecommendedExtensions: (extensions) => extensions.forEach(extension => this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'cancelled', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(extensionRecommendations.source) })),
                onDidNeverShowRecommendedExtensionsAgain: (extensions) => {
                    for (const extension of extensions) {
                        this.addToImportantRecommendationsIgnore(extension.identifier.id);
                        this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'neverShowAgain', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(extensionRecommendations.source) });
                    }
                    this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('ignoreExtensionRecommendations', "Do you want to ignore all extension recommendations?"), [{
                            label: (0, nls_1.localize)('ignoreAll', "Yes, Ignore All"),
                            run: () => this.setIgnoreRecommendationsConfig(true)
                        }, {
                            label: (0, nls_1.localize)('no', "No"),
                            run: () => this.setIgnoreRecommendationsConfig(false)
                        }]);
                },
            });
        }
        async promptWorkspaceRecommendations(recommendations) {
            if (this.storageService.getBoolean(donotShowWorkspaceRecommendationsStorageKey, 1 /* StorageScope.WORKSPACE */, false)) {
                return;
            }
            let installed = await this.extensionManagementService.getInstalled();
            installed = installed.filter(l => this.extensionEnablementService.getEnablementState(l) !== 1 /* EnablementState.DisabledByExtensionKind */); // Filter extensions disabled by kind
            recommendations = recommendations.filter(recommendation => installed.every(local => (0, types_1.isString)(recommendation) ? !(0, extensionManagementUtil_1.areSameExtensions)({ id: recommendation }, local.identifier) : !this.uriIdentityService.extUri.isEqual(recommendation, local.location)));
            if (!recommendations.length) {
                return;
            }
            await this.promptRecommendationsNotification({ extensions: recommendations, source: 2 /* RecommendationSource.WORKSPACE */, name: (0, nls_1.localize)({ key: 'this repository', comment: ['this repository means the current repository that is opened'] }, "this repository") }, {
                onDidInstallRecommendedExtensions: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'install' }),
                onDidShowRecommendedExtensions: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'show' }),
                onDidCancelRecommendedExtensions: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'cancelled' }),
                onDidNeverShowRecommendedExtensionsAgain: () => {
                    this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'neverShowAgain' });
                    this.storageService.store(donotShowWorkspaceRecommendationsStorageKey, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                },
            });
        }
        async promptRecommendationsNotification({ extensions: extensionIds, source, name, searchValue }, recommendationsNotificationActions) {
            if (this.hasToIgnoreRecommendationNotifications()) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            // Do not show exe based recommendations in remote window
            if (source === 3 /* RecommendationSource.EXE */ && this.workbenchEnvironmentService.remoteAuthority) {
                return "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */;
            }
            // Ignore exe recommendation if the window
            // 		=> has shown an exe based recommendation already
            // 		=> or has shown any two recommendations already
            if (source === 3 /* RecommendationSource.EXE */ && (this.recommendationSources.includes(3 /* RecommendationSource.EXE */) || this.recommendationSources.length >= 2)) {
                return "toomany" /* RecommendationsNotificationResult.TooMany */;
            }
            this.recommendationSources.push(source);
            // Ignore exe recommendation if recommendations are already shown
            if (source === 3 /* RecommendationSource.EXE */ && extensionIds.every(id => (0, types_1.isString)(id) && this.recommendedExtensions.includes(id))) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            const extensions = await this.getInstallableExtensions(extensionIds);
            if (!extensions.length) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            this.recommendedExtensions = (0, arrays_1.distinct)([...this.recommendedExtensions, ...extensionIds.filter(types_1.isString)]);
            let extensionsMessage = '';
            if (extensions.length === 1) {
                extensionsMessage = (0, nls_1.localize)('extensionFromPublisher', "'{0}' extension from {1}", extensions[0].displayName, extensions[0].publisherDisplayName);
            }
            else {
                const publishers = [...extensions.reduce((result, extension) => result.add(extension.publisherDisplayName), new Set())];
                if (publishers.length > 2) {
                    extensionsMessage = (0, nls_1.localize)('extensionsFromMultiplePublishers', "extensions from {0}, {1} and others", publishers[0], publishers[1]);
                }
                else if (publishers.length === 2) {
                    extensionsMessage = (0, nls_1.localize)('extensionsFromPublishers', "extensions from {0} and {1}", publishers[0], publishers[1]);
                }
                else {
                    extensionsMessage = (0, nls_1.localize)('extensionsFromPublisher', "extensions from {0}", publishers[0]);
                }
            }
            let message = (0, nls_1.localize)('recommended', "Do you want to install the recommended {0} for {1}?", extensionsMessage, name);
            if (source === 3 /* RecommendationSource.EXE */) {
                message = (0, nls_1.localize)({ key: 'exeRecommended', comment: ['Placeholder string is the name of the software that is installed.'] }, "You have {0} installed on your system. Do you want to install the recommended {1} for it?", name, extensionsMessage);
            }
            if (!searchValue) {
                searchValue = source === 2 /* RecommendationSource.WORKSPACE */ ? '@recommended' : extensions.map(extensionId => `@id:${extensionId.identifier.id}`).join(' ');
            }
            const donotShowAgainLabel = source === 2 /* RecommendationSource.WORKSPACE */ ? (0, nls_1.localize)('donotShowAgain', "Don't Show Again for this Repository")
                : extensions.length > 1 ? (0, nls_1.localize)('donotShowAgainExtension', "Don't Show Again for these Extensions") : (0, nls_1.localize)('donotShowAgainExtensionSingle', "Don't Show Again for this Extension");
            return (0, async_1.raceCancellablePromises)([
                this._registerP(this.showRecommendationsNotification(extensions, message, searchValue, donotShowAgainLabel, source, recommendationsNotificationActions)),
                this._registerP(this.waitUntilRecommendationsAreInstalled(extensions))
            ]);
        }
        showRecommendationsNotification(extensions, message, searchValue, donotShowAgainLabel, source, { onDidInstallRecommendedExtensions, onDidShowRecommendedExtensions, onDidCancelRecommendedExtensions, onDidNeverShowRecommendedExtensionsAgain }) {
            return (0, async_1.createCancelablePromise)(async (token) => {
                let accepted = false;
                const choices = [];
                const installExtensions = async (isMachineScoped) => {
                    this.runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, searchValue));
                    onDidInstallRecommendedExtensions(extensions);
                    await async_1.Promises.settled([
                        async_1.Promises.settled(extensions.map(extension => this.extensionsWorkbenchService.open(extension, { pinned: true }))),
                        this.extensionManagementService.installGalleryExtensions(extensions.map(e => ({ extension: e.gallery, options: { isMachineScoped } })))
                    ]);
                };
                choices.push({
                    label: (0, nls_1.localize)('install', "Install"),
                    run: () => installExtensions(false),
                    menu: this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */) ? [{
                            label: (0, nls_1.localize)('install and do no sync', "Install (Do not sync)"),
                            run: () => installExtensions(true)
                        }] : undefined,
                });
                choices.push(...[{
                        label: (0, nls_1.localize)('show recommendations', "Show Recommendations"),
                        run: async () => {
                            onDidShowRecommendedExtensions(extensions);
                            for (const extension of extensions) {
                                this.extensionsWorkbenchService.open(extension, { pinned: true });
                            }
                            this.runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, searchValue));
                        }
                    }, {
                        label: donotShowAgainLabel,
                        isSecondary: true,
                        run: () => {
                            onDidNeverShowRecommendedExtensionsAgain(extensions);
                        }
                    }]);
                try {
                    accepted = await this.doShowRecommendationsNotification(notification_1.Severity.Info, message, choices, source, token);
                }
                catch (error) {
                    if (!(0, errors_1.isCancellationError)(error)) {
                        throw error;
                    }
                }
                if (accepted) {
                    return "reacted" /* RecommendationsNotificationResult.Accepted */;
                }
                else {
                    onDidCancelRecommendedExtensions(extensions);
                    return "cancelled" /* RecommendationsNotificationResult.Cancelled */;
                }
            });
        }
        waitUntilRecommendationsAreInstalled(extensions) {
            const installedExtensions = [];
            const disposables = new lifecycle_1.DisposableStore();
            return (0, async_1.createCancelablePromise)(async (token) => {
                disposables.add(token.onCancellationRequested(e => disposables.dispose()));
                return new Promise((c, e) => {
                    disposables.add(this.extensionManagementService.onInstallExtension(e => {
                        installedExtensions.push(e.identifier.id.toLowerCase());
                        if (extensions.every(e => installedExtensions.includes(e.identifier.id.toLowerCase()))) {
                            c("reacted" /* RecommendationsNotificationResult.Accepted */);
                        }
                    }));
                });
            });
        }
        /**
         * Show recommendations in Queue
         * At any time only one recommendation is shown
         * If a new recommendation comes in
         * 		=> If no recommendation is visible, show it immediately
         *		=> Otherwise, add to the pending queue
         * 			=> If it is not exe based and has higher or same priority as current, hide the current notification after showing it for 3s.
         * 			=> Otherwise wait until the current notification is hidden.
         */
        async doShowRecommendationsNotification(severity, message, choices, source, token) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const recommendationsNotification = disposables.add(new RecommendationsNotification(severity, message, choices, this.notificationService));
                disposables.add(event_1.Event.once(event_1.Event.filter(recommendationsNotification.onDidChangeVisibility, e => !e))(() => this.showNextNotification()));
                if (this.visibleNotification) {
                    const index = this.pendingNotificaitons.length;
                    disposables.add(token.onCancellationRequested(() => this.pendingNotificaitons.splice(index, 1)));
                    this.pendingNotificaitons.push({ recommendationsNotification, source, token });
                    if (source !== 3 /* RecommendationSource.EXE */ && source <= this.visibleNotification.source) {
                        this.hideVisibleNotification(3000);
                    }
                }
                else {
                    this.visibleNotification = { recommendationsNotification, source, from: Date.now() };
                    recommendationsNotification.show();
                }
                await (0, async_1.raceCancellation)(new Promise(c => disposables.add(event_1.Event.once(recommendationsNotification.onDidClose)(c))), token);
                return !recommendationsNotification.isCancelled();
            }
            finally {
                disposables.dispose();
            }
        }
        showNextNotification() {
            const index = this.getNextPendingNotificationIndex();
            const [nextNotificaiton] = index > -1 ? this.pendingNotificaitons.splice(index, 1) : [];
            // Show the next notification after a delay of 500ms (after the current notification is dismissed)
            (0, async_1.timeout)(nextNotificaiton ? 500 : 0)
                .then(() => {
                this.unsetVisibileNotification();
                if (nextNotificaiton) {
                    this.visibleNotification = { recommendationsNotification: nextNotificaiton.recommendationsNotification, source: nextNotificaiton.source, from: Date.now() };
                    nextNotificaiton.recommendationsNotification.show();
                }
            });
        }
        /**
         * Return the recent high priroity pending notification
         */
        getNextPendingNotificationIndex() {
            let index = this.pendingNotificaitons.length - 1;
            if (this.pendingNotificaitons.length) {
                for (let i = 0; i < this.pendingNotificaitons.length; i++) {
                    if (this.pendingNotificaitons[i].source <= this.pendingNotificaitons[index].source) {
                        index = i;
                    }
                }
            }
            return index;
        }
        hideVisibleNotification(timeInMillis) {
            if (this.visibleNotification && !this.hideVisibleNotificationPromise) {
                const visibleNotification = this.visibleNotification;
                this.hideVisibleNotificationPromise = (0, async_1.timeout)(Math.max(timeInMillis - (Date.now() - visibleNotification.from), 0));
                this.hideVisibleNotificationPromise.then(() => visibleNotification.recommendationsNotification.hide());
            }
        }
        unsetVisibileNotification() {
            this.hideVisibleNotificationPromise?.cancel();
            this.hideVisibleNotificationPromise = undefined;
            this.visibleNotification = undefined;
        }
        async getInstallableExtensions(recommendations) {
            const result = [];
            if (recommendations.length) {
                const galleryExtensions = [];
                const resourceExtensions = [];
                for (const recommendation of recommendations) {
                    if (typeof recommendation === 'string') {
                        galleryExtensions.push(recommendation);
                    }
                    else {
                        resourceExtensions.push(recommendation);
                    }
                }
                if (galleryExtensions.length) {
                    const extensions = await this.extensionsWorkbenchService.getExtensions(galleryExtensions.map(id => ({ id })), { source: 'install-recommendations' }, cancellation_1.CancellationToken.None);
                    for (const extension of extensions) {
                        if (extension.gallery && (await this.extensionManagementService.canInstall(extension.gallery))) {
                            result.push(extension);
                        }
                    }
                }
                if (resourceExtensions.length) {
                    const extensions = await this.extensionsWorkbenchService.getResourceExtensions(resourceExtensions, true);
                    result.push(...extensions);
                }
            }
            return result;
        }
        async runAction(action) {
            try {
                await action.run();
            }
            finally {
                if ((0, lifecycle_1.isDisposable)(action)) {
                    action.dispose();
                }
            }
        }
        addToImportantRecommendationsIgnore(id) {
            const importantRecommendationsIgnoreList = [...this.ignoredRecommendations];
            if (!importantRecommendationsIgnoreList.includes(id.toLowerCase())) {
                importantRecommendationsIgnoreList.push(id.toLowerCase());
                this.storageService.store(ignoreImportantExtensionRecommendationStorageKey, JSON.stringify(importantRecommendationsIgnoreList), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
        setIgnoreRecommendationsConfig(configVal) {
            this.configurationService.updateValue('extensions.ignoreRecommendations', configVal);
        }
        _registerP(o) {
            this._register((0, lifecycle_1.toDisposable)(() => o.cancel()));
            return o;
        }
    };
    exports.ExtensionRecommendationNotificationService = ExtensionRecommendationNotificationService;
    exports.ExtensionRecommendationNotificationService = ExtensionRecommendationNotificationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, storage_1.IStorageService),
        __param(2, notification_1.INotificationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(7, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(8, extensionRecommendations_2.IExtensionIgnoredRecommendationsService),
        __param(9, userDataSync_1.IUserDataSyncEnablementService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], ExtensionRecommendationNotificationService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25Ob3RpZmljYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25Ob3RpZmljYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlDaEcsTUFBTSxnREFBZ0QsR0FBRyxvREFBb0QsQ0FBQztJQUM5RyxNQUFNLDJDQUEyQyxHQUFHLG9EQUFvRCxDQUFDO0lBV3pHLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFXbkQsWUFDa0IsUUFBa0IsRUFDbEIsT0FBZSxFQUNmLE9BQXdCLEVBQ3hCLG1CQUF5QztZQUUxRCxLQUFLLEVBQUUsQ0FBQztZQUxTLGFBQVEsR0FBUixRQUFRLENBQVU7WUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBQ3hCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFibkQsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNqRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFckMsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDL0QsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUczRCxjQUFTLEdBQVksS0FBSyxDQUFDO1lBOEIzQix5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELG9DQUErQixH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