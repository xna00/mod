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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExclusions", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/testing/common/configuration", "vs/base/common/types", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, arrays_1, cancellation_1, event_1, iterator_1, lifecycle_1, nls_1, contextkey_1, instantiation_1, notification_1, storage_1, workspaceTrust_1, mainThreadTestCollection_1, observableValue_1, storedValue_1, testExclusions_1, testId_1, testingContextKeys_1, testProfileService_1, testResultService_1, editorService_1, configuration_1, configuration_2, types_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestService = void 0;
    let TestService = class TestService extends lifecycle_1.Disposable {
        constructor(contextKeyService, instantiationService, uriIdentityService, storage, editorService, testProfiles, notificationService, configurationService, testResults, workspaceTrustRequestService) {
            super();
            this.uriIdentityService = uriIdentityService;
            this.storage = storage;
            this.editorService = editorService;
            this.testProfiles = testProfiles;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.testResults = testResults;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.testControllers = new Map();
            this.cancelExtensionTestRunEmitter = new event_1.Emitter();
            this.willProcessDiffEmitter = new event_1.Emitter();
            this.didProcessDiffEmitter = new event_1.Emitter();
            this.testRefreshCancellations = new Set();
            /**
             * Cancellation for runs requested by the user being managed by the UI.
             * Test runs initiated by extensions are not included here.
             */
            this.uiRunningTests = new Map();
            /**
             * @inheritdoc
             */
            this.onWillProcessDiff = this.willProcessDiffEmitter.event;
            /**
             * @inheritdoc
             */
            this.onDidProcessDiff = this.didProcessDiffEmitter.event;
            /**
             * @inheritdoc
             */
            this.onDidCancelTestRun = this.cancelExtensionTestRunEmitter.event;
            /**
             * @inheritdoc
             */
            this.collection = new mainThreadTestCollection_1.MainThreadTestCollection(this.uriIdentityService, this.expandTest.bind(this));
            /**
             * @inheritdoc
             */
            this.showInlineOutput = observableValue_1.MutableObservableValue.stored(this._register(new storedValue_1.StoredValue({
                key: 'inlineTestOutputVisible',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 0 /* StorageTarget.USER */
            }, this.storage)), true);
            this.excluded = instantiationService.createInstance(testExclusions_1.TestExclusions);
            this.providerCount = testingContextKeys_1.TestingContextKeys.providerCount.bindTo(contextKeyService);
            this.canRefreshTests = testingContextKeys_1.TestingContextKeys.canRefreshTests.bindTo(contextKeyService);
            this.isRefreshingTests = testingContextKeys_1.TestingContextKeys.isRefreshingTests.bindTo(contextKeyService);
            this.activeEditorHasTests = testingContextKeys_1.TestingContextKeys.activeEditorHasTests.bindTo(contextKeyService);
            this._register(editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
        }
        /**
         * @inheritdoc
         */
        async expandTest(id, levels) {
            await this.testControllers.get(testId_1.TestId.fromString(id).controllerId)?.expandTest(id, levels);
        }
        /**
         * @inheritdoc
         */
        cancelTestRun(runId) {
            this.cancelExtensionTestRunEmitter.fire({ runId });
            if (runId === undefined) {
                for (const runCts of this.uiRunningTests.values()) {
                    runCts.cancel();
                }
            }
            else {
                this.uiRunningTests.get(runId)?.cancel();
            }
        }
        /**
         * @inheritdoc
         */
        async runTests(req, token = cancellation_1.CancellationToken.None) {
            const resolved = {
                targets: [],
                exclude: req.exclude?.map(t => t.item.extId),
                continuous: req.continuous,
            };
            // First, try to run the tests using the default run profiles...
            for (const profile of this.testProfiles.getGroupDefaultProfiles(req.group)) {
                const testIds = req.tests.filter(t => (0, testProfileService_1.canUseProfileWithTest)(profile, t)).map(t => t.item.extId);
                if (testIds.length) {
                    resolved.targets.push({
                        testIds: testIds,
                        profileGroup: profile.group,
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                    });
                }
            }
            // If no tests are covered by the defaults, just use whatever the defaults
            // for their controller are. This can happen if the user chose specific
            // profiles for the run button, but then asked to run a single test from the
            // explorer or decoration. We shouldn't no-op.
            if (resolved.targets.length === 0) {
                for (const byController of (0, arrays_1.groupBy)(req.tests, (a, b) => a.controllerId === b.controllerId ? 0 : 1)) {
                    const profiles = this.testProfiles.getControllerProfiles(byController[0].controllerId);
                    const withControllers = byController.map(test => ({
                        profile: profiles.find(p => p.group === req.group && (0, testProfileService_1.canUseProfileWithTest)(p, test)),
                        test,
                    }));
                    for (const byProfile of (0, arrays_1.groupBy)(withControllers, (a, b) => a.profile === b.profile ? 0 : 1)) {
                        const profile = byProfile[0].profile;
                        if (profile) {
                            resolved.targets.push({
                                testIds: byProfile.map(t => t.test.item.extId),
                                profileGroup: req.group,
                                profileId: profile.profileId,
                                controllerId: profile.controllerId,
                            });
                        }
                    }
                }
            }
            return this.runResolvedTests(resolved, token);
        }
        /** @inheritdoc */
        async startContinuousRun(req, token) {
            if (!req.exclude) {
                req.exclude = [...this.excluded.all];
            }
            const trust = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                message: (0, nls_1.localize)('testTrust', "Running tests may execute code in your workspace."),
            });
            if (!trust) {
                return;
            }
            const byController = (0, arrays_1.groupBy)(req.targets, (a, b) => a.controllerId.localeCompare(b.controllerId));
            const requests = byController.map(group => this.testControllers.get(group[0].controllerId)?.startContinuousRun(group.map(controlReq => ({
                excludeExtIds: req.exclude.filter(t => !controlReq.testIds.includes(t)),
                profileId: controlReq.profileId,
                controllerId: controlReq.controllerId,
                testIds: controlReq.testIds,
            })), token).then(result => {
                const errs = result.map(r => r.error).filter(types_1.isDefined);
                if (errs.length) {
                    this.notificationService.error((0, nls_1.localize)('testError', 'An error occurred attempting to run tests: {0}', errs.join(' ')));
                }
            }));
            await Promise.all(requests);
        }
        /**
         * @inheritdoc
         */
        async runResolvedTests(req, token = cancellation_1.CancellationToken.None) {
            if (!req.exclude) {
                req.exclude = [...this.excluded.all];
            }
            const result = this.testResults.createLiveResult(req);
            const trust = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                message: (0, nls_1.localize)('testTrust', "Running tests may execute code in your workspace."),
            });
            if (!trust) {
                result.markComplete();
                return result;
            }
            try {
                const cancelSource = new cancellation_1.CancellationTokenSource(token);
                this.uiRunningTests.set(result.id, cancelSource);
                const byController = (0, arrays_1.groupBy)(req.targets, (a, b) => a.controllerId.localeCompare(b.controllerId));
                const requests = byController.map(group => this.testControllers.get(group[0].controllerId)?.runTests(group.map(controlReq => ({
                    runId: result.id,
                    excludeExtIds: req.exclude.filter(t => !controlReq.testIds.includes(t)),
                    profileId: controlReq.profileId,
                    controllerId: controlReq.controllerId,
                    testIds: controlReq.testIds,
                })), cancelSource.token).then(result => {
                    const errs = result.map(r => r.error).filter(types_1.isDefined);
                    if (errs.length) {
                        this.notificationService.error((0, nls_1.localize)('testError', 'An error occurred attempting to run tests: {0}', errs.join(' ')));
                    }
                }));
                await this.saveAllBeforeTest(req);
                await Promise.all(requests);
                return result;
            }
            finally {
                this.uiRunningTests.delete(result.id);
                result.markComplete();
            }
        }
        /**
         * @inheritdoc
         */
        publishDiff(_controllerId, diff) {
            this.willProcessDiffEmitter.fire(diff);
            this.collection.apply(diff);
            this.updateEditorContextKeys();
            this.didProcessDiffEmitter.fire(diff);
        }
        /**
         * @inheritdoc
         */
        getTestController(id) {
            return this.testControllers.get(id);
        }
        /**
         * @inheritdoc
         */
        async syncTests() {
            const cts = new cancellation_1.CancellationTokenSource();
            try {
                await Promise.all([...this.testControllers.values()].map(c => c.syncTests(cts.token)));
            }
            finally {
                cts.dispose(true);
            }
        }
        /**
         * @inheritdoc
         */
        async refreshTests(controllerId) {
            const cts = new cancellation_1.CancellationTokenSource();
            this.testRefreshCancellations.add(cts);
            this.isRefreshingTests.set(true);
            try {
                if (controllerId) {
                    await this.testControllers.get(controllerId)?.refreshTests(cts.token);
                }
                else {
                    await Promise.all([...this.testControllers.values()].map(c => c.refreshTests(cts.token)));
                }
            }
            finally {
                this.testRefreshCancellations.delete(cts);
                this.isRefreshingTests.set(this.testRefreshCancellations.size > 0);
                cts.dispose(true);
            }
        }
        /**
         * @inheritdoc
         */
        cancelRefreshTests() {
            for (const cts of this.testRefreshCancellations) {
                cts.cancel();
            }
            this.testRefreshCancellations.clear();
            this.isRefreshingTests.set(false);
        }
        /**
         * @inheritdoc
         */
        registerTestController(id, controller) {
            this.testControllers.set(id, controller);
            this.providerCount.set(this.testControllers.size);
            this.updateCanRefresh();
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add((0, lifecycle_1.toDisposable)(() => {
                const diff = [];
                for (const root of this.collection.rootItems) {
                    if (root.controllerId === id) {
                        diff.push({ op: 3 /* TestDiffOpType.Remove */, itemId: root.item.extId });
                    }
                }
                this.publishDiff(id, diff);
                if (this.testControllers.delete(id)) {
                    this.providerCount.set(this.testControllers.size);
                    this.updateCanRefresh();
                }
            }));
            disposable.add(controller.canRefresh.onDidChange(this.updateCanRefresh, this));
            return disposable;
        }
        updateEditorContextKeys() {
            const uri = this.editorService.activeEditor?.resource;
            if (uri) {
                this.activeEditorHasTests.set(!iterator_1.Iterable.isEmpty(this.collection.getNodeByUrl(uri)));
            }
            else {
                this.activeEditorHasTests.set(false);
            }
        }
        async saveAllBeforeTest(req, configurationService = this.configurationService, editorService = this.editorService) {
            if (req.isUiTriggered === false) {
                return;
            }
            const saveBeforeTest = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */);
            if (saveBeforeTest) {
                await editorService.saveAll();
            }
            return;
        }
        updateCanRefresh() {
            this.canRefreshTests.set(iterator_1.Iterable.some(this.testControllers.values(), t => t.canRefresh.value));
        }
    };
    exports.TestService = TestService;
    exports.TestService = TestService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, storage_1.IStorageService),
        __param(4, editorService_1.IEditorService),
        __param(5, testProfileService_1.ITestProfileService),
        __param(6, notification_1.INotificationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testResultService_1.ITestResultService),
        __param(9, workspaceTrust_1.IWorkspaceTrustRequestService)
    ], TestService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0U2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJ6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsc0JBQVU7UUFxRDFDLFlBQ3FCLGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDN0Msa0JBQXdELEVBQzVELE9BQXlDLEVBQzFDLGFBQThDLEVBQ3pDLFlBQWtELEVBQ2pELG1CQUEwRCxFQUN6RCxvQkFBNEQsRUFDL0QsV0FBZ0QsRUFDckMsNEJBQTRFO1lBRTNHLEtBQUssRUFBRSxDQUFDO1lBVDhCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDM0MsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7WUFDekIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3hCLGlCQUFZLEdBQVosWUFBWSxDQUFxQjtZQUNoQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQW9CO1lBQ3BCLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUE3RHBHLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7WUFFdEQsa0NBQTZCLEdBQUcsSUFBSSxlQUFPLEVBQWlDLENBQUM7WUFDN0UsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQWEsQ0FBQztZQUNsRCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBYSxDQUFDO1lBQ2pELDZCQUF3QixHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBTS9FOzs7ZUFHRztZQUNjLG1CQUFjLEdBQUcsSUFBSSxHQUFH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