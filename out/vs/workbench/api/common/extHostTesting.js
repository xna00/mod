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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/functional", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uuid", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTestItem", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, async_1, buffer_1, cancellation_1, event_1, functional_1, hash_1, lifecycle_1, types_1, uuid_1, log_1, extHost_protocol_1, extHostRpcService_1, extHostTestItem_1, Convert, extHostTypes_1, testId_1, testItemCollection_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestRunProfileImpl = exports.TestRunDto = exports.TestRunCoordinator = exports.ExtHostTesting = void 0;
    let ExtHostTesting = class ExtHostTesting extends lifecycle_1.Disposable {
        constructor(rpc, logService, commands, editors) {
            super();
            this.editors = editors;
            this.resultsChangedEmitter = this._register(new event_1.Emitter());
            this.controllers = new Map();
            this.defaultProfilesChangedEmitter = this._register(new event_1.Emitter());
            this.onResultsChanged = this.resultsChangedEmitter.event;
            this.results = [];
            this.proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadTesting);
            this.observer = new TestObservers(this.proxy);
            this.runTracker = new TestRunCoordinator(this.proxy, logService);
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    switch (arg?.$mid) {
                        case 16 /* MarshalledId.TestItemContext */: {
                            const cast = arg;
                            const targetTest = cast.tests[cast.tests.length - 1].item.extId;
                            const controller = this.controllers.get(testId_1.TestId.root(targetTest));
                            return controller?.collection.tree.get(targetTest)?.actual ?? (0, extHostTestItem_1.toItemFromContext)(arg);
                        }
                        case 18 /* MarshalledId.TestMessageMenuArgs */: {
                            const { test, message } = arg;
                            const extId = test.item.extId;
                            return {
                                test: this.controllers.get(testId_1.TestId.root(extId))?.collection.tree.get(extId)?.actual
                                    ?? (0, extHostTestItem_1.toItemFromContext)({ $mid: 16 /* MarshalledId.TestItemContext */, tests: [test] }),
                                message: Convert.TestMessage.to(message),
                            };
                        }
                        default: return arg;
                    }
                }
            });
            commands.registerCommand(false, 'testing.getExplorerSelection', async () => {
                const inner = await commands.executeCommand("_testing.getExplorerSelection" /* TestCommandId.GetExplorerSelection */);
                const lookup = (i) => {
                    const controller = this.controllers.get(testId_1.TestId.root(i));
                    if (!controller) {
                        return undefined;
                    }
                    return testId_1.TestId.isRoot(i) ? controller.controller : controller.collection.tree.get(i)?.actual;
                };
                return {
                    include: inner?.include.map(lookup).filter(types_1.isDefined) || [],
                    exclude: inner?.exclude.map(lookup).filter(types_1.isDefined) || [],
                };
            });
        }
        /**
         * Implements vscode.test.registerTestProvider
         */
        createTestController(extension, controllerId, label, refreshHandler) {
            if (this.controllers.has(controllerId)) {
                throw new Error(`Attempt to insert a duplicate controller with ID "${controllerId}"`);
            }
            const disposable = new lifecycle_1.DisposableStore();
            const collection = disposable.add(new extHostTestItem_1.ExtHostTestItemCollection(controllerId, label, this.editors));
            collection.root.label = label;
            const profiles = new Map();
            const activeProfiles = new Set();
            const proxy = this.proxy;
            const controller = {
                items: collection.root.children,
                get label() {
                    return label;
                },
                set label(value) {
                    label = value;
                    collection.root.label = value;
                    proxy.$updateController(controllerId, { label });
                },
                get refreshHandler() {
                    return refreshHandler;
                },
                set refreshHandler(value) {
                    refreshHandler = value;
                    proxy.$updateController(controllerId, { canRefresh: !!value });
                },
                get id() {
                    return controllerId;
                },
                createRunProfile: (label, group, runHandler, isDefault, tag, supportsContinuousRun) => {
                    // Derive the profile ID from a hash so that the same profile will tend
                    // to have the same hashes, allowing re-run requests to work across reloads.
                    let profileId = (0, hash_1.hash)(label);
                    while (profiles.has(profileId)) {
                        profileId++;
                    }
                    return new TestRunProfileImpl(this.proxy, profiles, activeProfiles, this.defaultProfilesChangedEmitter.event, controllerId, profileId, label, group, runHandler, isDefault, tag, supportsContinuousRun);
                },
                createTestItem(id, label, uri) {
                    return new extHostTestItem_1.TestItemImpl(controllerId, id, label, uri);
                },
                createTestRun: (request, name, persist = true) => {
                    return this.runTracker.createTestRun(controllerId, collection, request, name, persist);
                },
                invalidateTestResults: items => {
                    if (items === undefined) {
                        this.proxy.$markTestRetired(undefined);
                    }
                    else {
                        const itemsArr = items instanceof Array ? items : [items];
                        this.proxy.$markTestRetired(itemsArr.map(i => testId_1.TestId.fromExtHostTestItem(i, controllerId).toString()));
                    }
                },
                set resolveHandler(fn) {
                    collection.resolveHandler = fn;
                },
                get resolveHandler() {
                    return collection.resolveHandler;
                },
                dispose: () => {
                    disposable.dispose();
                },
            };
            proxy.$registerTestController(controllerId, label, !!refreshHandler);
            disposable.add((0, lifecycle_1.toDisposable)(() => proxy.$unregisterTestController(controllerId)));
            const info = { controller, collection, profiles, extension, activeProfiles };
            this.controllers.set(controllerId, info);
            disposable.add((0, lifecycle_1.toDisposable)(() => this.controllers.delete(controllerId)));
            disposable.add(collection.onDidGenerateDiff(diff => proxy.$publishDiff(controllerId, diff.map(testTypes_1.TestsDiffOp.serialize))));
            return controller;
        }
        /**
         * Implements vscode.test.createTestObserver
         */
        createTestObserver() {
            return this.observer.checkout();
        }
        /**
         * Implements vscode.test.runTests
         */
        async runTests(req, token = cancellation_1.CancellationToken.None) {
            const profile = tryGetProfileFromTestRunReq(req);
            if (!profile) {
                throw new Error('The request passed to `vscode.test.runTests` must include a profile');
            }
            const controller = this.controllers.get(profile.controllerId);
            if (!controller) {
                throw new Error('Controller not found');
            }
            await this.proxy.$runTests({
                isUiTriggered: false,
                targets: [{
                        testIds: req.include?.map(t => testId_1.TestId.fromExtHostTestItem(t, controller.collection.root.id).toString()) ?? [controller.collection.root.id],
                        profileGroup: profileGroupToBitset[profile.kind],
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                    }],
                exclude: req.exclude?.map(t => t.id),
            }, token);
        }
        /**
         * @inheritdoc
         */
        $syncTests() {
            for (const { collection } of this.controllers.values()) {
                collection.flushDiff();
            }
            return Promise.resolve();
        }
        /**
         * @inheritdoc
         */
        async $getCoverageDetails(coverageId, token) {
            const details = await this.runTracker.getCoverageDetails(coverageId, token);
            return details?.map(Convert.TestCoverage.fromDetails);
        }
        /**
         * @inheritdoc
         */
        async $disposeRun(runId) {
            this.runTracker.disposeTestRun(runId);
        }
        /** @inheritdoc */
        $configureRunProfile(controllerId, profileId) {
            this.controllers.get(controllerId)?.profiles.get(profileId)?.configureHandler?.();
        }
        /** @inheritdoc */
        $setDefaultRunProfiles(profiles) {
            const evt = new Map();
            for (const [controllerId, profileIds] of Object.entries(profiles)) {
                const ctrl = this.controllers.get(controllerId);
                if (!ctrl) {
                    continue;
                }
                const changes = new Map();
                const added = profileIds.filter(id => !ctrl.activeProfiles.has(id));
                const removed = [...ctrl.activeProfiles].filter(id => !profileIds.includes(id));
                for (const id of added) {
                    changes.set(id, true);
                    ctrl.activeProfiles.add(id);
                }
                for (const id of removed) {
                    changes.set(id, false);
                    ctrl.activeProfiles.delete(id);
                }
                if (changes.size) {
                    evt.set(controllerId, changes);
                }
            }
            this.defaultProfilesChangedEmitter.fire(evt);
        }
        /** @inheritdoc */
        async $refreshTests(controllerId, token) {
            await this.controllers.get(controllerId)?.controller.refreshHandler?.(token);
        }
        /**
         * Updates test results shown to extensions.
         * @override
         */
        $publishTestResults(results) {
            this.results = Object.freeze(results
                .map(Convert.TestResults.to)
                .concat(this.results)
                .sort((a, b) => b.completedAt - a.completedAt)
                .slice(0, 32));
            this.resultsChangedEmitter.fire();
        }
        /**
         * Expands the nodes in the test tree. If levels is less than zero, it will
         * be treated as infinite.
         */
        async $expandTest(testId, levels) {
            const collection = this.controllers.get(testId_1.TestId.fromString(testId).controllerId)?.collection;
            if (collection) {
                await collection.expand(testId, levels < 0 ? Infinity : levels);
                collection.flushDiff();
            }
        }
        /**
         * Receives a test update from the main thread. Called (eventually) whenever
         * tests change.
         */
        $acceptDiff(diff) {
            this.observer.applyDiff(diff.map(d => testTypes_1.TestsDiffOp.deserialize({ asCanonicalUri: u => u }, d)));
        }
        /**
         * Runs tests with the given set of IDs. Allows for test from multiple
         * providers to be run.
         * @inheritdoc
         */
        async $runControllerTests(reqs, token) {
            return Promise.all(reqs.map(req => this.runControllerTestRequest(req, false, token)));
        }
        /**
         * Starts continuous test runs with the given set of IDs. Allows for test from
         * multiple providers to be run.
         * @inheritdoc
         */
        async $startContinuousRun(reqs, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            const res = await Promise.all(reqs.map(req => this.runControllerTestRequest(req, true, cts.token)));
            // avoid returning until cancellation is requested, otherwise ipc disposes of the token
            if (!token.isCancellationRequested && !res.some(r => r.error)) {
                await new Promise(r => token.onCancellationRequested(r));
            }
            cts.dispose(true);
            return res;
        }
        async runControllerTestRequest(req, isContinuous, token) {
            const lookup = this.controllers.get(req.controllerId);
            if (!lookup) {
                return {};
            }
            const { collection, profiles } = lookup;
            const profile = profiles.get(req.profileId);
            if (!profile) {
                return {};
            }
            const includeTests = req.testIds
                .map((testId) => collection.tree.get(testId))
                .filter(types_1.isDefined);
            const excludeTests = req.excludeExtIds
                .map(id => lookup.collection.tree.get(id))
                .filter(types_1.isDefined)
                .filter(exclude => includeTests.some(include => include.fullId.compare(exclude.fullId) === 2 /* TestPosition.IsChild */));
            if (!includeTests.length) {
                return {};
            }
            const publicReq = new extHostTypes_1.TestRunRequest(includeTests.some(i => i.actual instanceof extHostTestItem_1.TestItemRootImpl) ? undefined : includeTests.map(t => t.actual), excludeTests.map(t => t.actual), profile, isContinuous);
            const tracker = (0, testTypes_1.isStartControllerTests)(req) && this.runTracker.prepareForMainThreadTestRun(publicReq, TestRunDto.fromInternal(req, lookup.collection), profile, token);
            try {
                await profile.runHandler(publicReq, token);
                return {};
            }
            catch (e) {
                return { error: String(e) };
            }
            finally {
                if (tracker) {
                    if (tracker.hasRunningTasks && !token.isCancellationRequested) {
                        await event_1.Event.toPromise(tracker.onEnd);
                    }
                }
            }
        }
        /**
         * Cancels an ongoing test run.
         */
        $cancelExtensionTestRun(runId) {
            if (runId === undefined) {
                this.runTracker.cancelAllRuns();
            }
            else {
                this.runTracker.cancelRunById(runId);
            }
        }
    };
    exports.ExtHostTesting = ExtHostTesting;
    exports.ExtHostTesting = ExtHostTesting = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostTesting);
    // Deadline after being requested by a user that a test run is forcibly cancelled.
    const RUN_CANCEL_DEADLINE = 10_000;
    var TestRunTrackerState;
    (function (TestRunTrackerState) {
        // Default state
        TestRunTrackerState[TestRunTrackerState["Running"] = 0] = "Running";
        // Cancellation is requested, but the run is still going.
        TestRunTrackerState[TestRunTrackerState["Cancelling"] = 1] = "Cancelling";
        // All tasks have ended
        TestRunTrackerState[TestRunTrackerState["Ended"] = 2] = "Ended";
    })(TestRunTrackerState || (TestRunTrackerState = {}));
    class TestRunTracker extends lifecycle_1.Disposable {
        /**
         * Gets whether there are any tests running.
         */
        get hasRunningTasks() {
            return this.running > 0;
        }
        /**
         * Gets the run ID.
         */
        get id() {
            return this.dto.id;
        }
        constructor(dto, proxy, logService, profile, parentToken) {
            super();
            this.dto = dto;
            this.proxy = proxy;
            this.logService = logService;
            this.profile = profile;
            this.state = 0 /* TestRunTrackerState.Running */;
            this.running = 0;
            this.tasks = new Map();
            this.sharedTestIds = new Set();
            this.endEmitter = this._register(new event_1.Emitter());
            this.publishedCoverage = new Map();
            /**
             * Fires when a test ends, and no more tests are left running.
             */
            this.onEnd = this.endEmitter.event;
            this.cts = this._register(new cancellation_1.CancellationTokenSource(parentToken));
            const forciblyEnd = this._register(new async_1.RunOnceScheduler(() => this.forciblyEndTasks(), RUN_CANCEL_DEADLINE));
            this._register(this.cts.token.onCancellationRequested(() => forciblyEnd.schedule()));
            const didDisposeEmitter = new event_1.Emitter();
            this.onDidDispose = didDisposeEmitter.event;
            this._register((0, lifecycle_1.toDisposable)(() => {
                didDisposeEmitter.fire();
                didDisposeEmitter.dispose();
            }));
        }
        /** Requests cancellation of the run. On the second call, forces cancellation. */
        cancel() {
            if (this.state === 0 /* TestRunTrackerState.Running */) {
                this.cts.cancel();
                this.state = 1 /* TestRunTrackerState.Cancelling */;
            }
            else if (this.state === 1 /* TestRunTrackerState.Cancelling */) {
                this.forciblyEndTasks();
            }
        }
        /** Gets details for a previously-emitted coverage object. */
        getCoverageDetails(id, token) {
            const [, taskId, covId] = testId_1.TestId.fromString(id).path; /** runId, taskId, URI */
            const obj = this.publishedCoverage.get(covId);
            if (!obj) {
                return [];
            }
            if (obj.backCompatResolve) {
                return obj.backCompatResolve(token);
            }
            const task = this.tasks.get(taskId);
            if (!task) {
                throw new Error('unreachable: run task was not found');
            }
            return this.profile?.loadDetailedCoverage?.(task.run, obj.coverage, token) ?? [];
        }
        /** Creates the public test run interface to give to extensions. */
        createRun(name) {
            const runId = this.dto.id;
            const ctrlId = this.dto.controllerId;
            const taskId = (0, uuid_1.generateUuid)();
            const guardTestMutation = (fn) => (test, ...args) => {
                if (ended) {
                    this.logService.warn(`Setting the state of test "${test.id}" is a no-op after the run ends.`);
                    return;
                }
                if (!this.dto.isIncluded(test)) {
                    return;
                }
                this.ensureTestIsKnown(test);
                fn(test, ...args);
            };
            const appendMessages = (test, messages) => {
                const converted = messages instanceof Array
                    ? messages.map(Convert.TestMessage.from)
                    : [Convert.TestMessage.from(messages)];
                if (test.uri && test.range) {
                    const defaultLocation = { range: Convert.Range.from(test.range), uri: test.uri };
                    for (const message of converted) {
                        message.location = message.location || defaultLocation;
                    }
                }
                this.proxy.$appendTestMessagesInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), converted);
            };
            const addCoverage = (coverage, backCompatResolve) => {
                const uriStr = coverage.uri.toString();
                const id = new testId_1.TestId([runId, taskId, uriStr]).toString();
                this.publishedCoverage.set(uriStr, { coverage, backCompatResolve });
                this.proxy.$appendCoverage(runId, taskId, Convert.TestCoverage.fromFile(id, coverage));
            };
            let ended = false;
            let coverageProvider;
            const run = {
                isPersisted: this.dto.isPersisted,
                token: this.cts.token,
                name,
                onDidDispose: this.onDidDispose,
                // todo@connor4312: back compat
                get coverageProvider() {
                    return coverageProvider;
                },
                // todo@connor4312: back compat
                set coverageProvider(provider) {
                    coverageProvider = provider;
                    if (provider) {
                        Promise.resolve(provider.provideFileCoverage(cancellation_1.CancellationToken.None)).then(coverage => {
                            coverage?.forEach(c => addCoverage(c, provider.resolveFileCoverage && (async (token) => {
                                const r = await provider.resolveFileCoverage(c, token);
                                return (r || c).detailedCoverage;
                            })));
                        });
                    }
                },
                addCoverage,
                //#region state mutation
                enqueued: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 1 /* TestResultState.Queued */);
                }),
                skipped: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 5 /* TestResultState.Skipped */);
                }),
                started: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 2 /* TestResultState.Running */);
                }),
                errored: guardTestMutation((test, messages, duration) => {
                    appendMessages(test, messages);
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 6 /* TestResultState.Errored */, duration);
                }),
                failed: guardTestMutation((test, messages, duration) => {
                    appendMessages(test, messages);
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 4 /* TestResultState.Failed */, duration);
                }),
                passed: guardTestMutation((test, duration) => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, this.dto.controllerId).toString(), 3 /* TestResultState.Passed */, duration);
                }),
                //#endregion
                appendOutput: (output, location, test) => {
                    if (ended) {
                        return;
                    }
                    if (test) {
                        if (this.dto.isIncluded(test)) {
                            this.ensureTestIsKnown(test);
                        }
                        else {
                            test = undefined;
                        }
                    }
                    this.proxy.$appendOutputToRun(runId, taskId, buffer_1.VSBuffer.fromString(output), location && Convert.location.from(location), test && testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString());
                },
                end: () => {
                    if (ended) {
                        return;
                    }
                    ended = true;
                    this.proxy.$finishedTestRunTask(runId, taskId);
                    if (!--this.running) {
                        this.markEnded();
                    }
                }
            };
            this.running++;
            this.tasks.set(taskId, { run });
            this.proxy.$startedTestRunTask(runId, { id: taskId, name, running: true });
            return run;
        }
        forciblyEndTasks() {
            for (const { run } of this.tasks.values()) {
                run.end();
            }
        }
        markEnded() {
            if (this.state !== 2 /* TestRunTrackerState.Ended */) {
                this.state = 2 /* TestRunTrackerState.Ended */;
                this.endEmitter.fire();
            }
        }
        ensureTestIsKnown(test) {
            if (!(test instanceof extHostTestItem_1.TestItemImpl)) {
                throw new testItemCollection_1.InvalidTestItemError(test.id);
            }
            if (this.sharedTestIds.has(testId_1.TestId.fromExtHostTestItem(test, this.dto.controllerId).toString())) {
                return;
            }
            const chain = [];
            const root = this.dto.colllection.root;
            while (true) {
                const converted = Convert.TestItem.from(test);
                chain.unshift(converted);
                if (this.sharedTestIds.has(converted.extId)) {
                    break;
                }
                this.sharedTestIds.add(converted.extId);
                if (test === root) {
                    break;
                }
                test = test.parent || root;
            }
            this.proxy.$addTestsToRun(this.dto.controllerId, this.dto.id, chain);
        }
        dispose() {
            this.markEnded();
            super.dispose();
        }
    }
    /**
     * Queues runs for a single extension and provides the currently-executing
     * run so that `createTestRun` can be properly correlated.
     */
    class TestRunCoordinator {
        get trackers() {
            return this.tracked.values();
        }
        constructor(proxy, logService) {
            this.proxy = proxy;
            this.logService = logService;
            this.tracked = new Map();
            this.trackedById = new Map();
        }
        /**
         * Gets a coverage report for a given run and task ID.
         */
        getCoverageDetails(id, token) {
            const runId = testId_1.TestId.root(id);
            return this.trackedById.get(runId)?.getCoverageDetails(id, token) || [];
        }
        /**
         * Disposes the test run, called when the main thread is no longer interested
         * in associated data.
         */
        disposeTestRun(runId) {
            this.trackedById.get(runId)?.dispose();
            this.trackedById.delete(runId);
            for (const [req, { id }] of this.tracked) {
                if (id === runId) {
                    this.tracked.delete(req);
                }
            }
        }
        /**
         * Registers a request as being invoked by the main thread, so
         * `$startedExtensionTestRun` is not invoked. The run must eventually
         * be cancelled manually.
         */
        prepareForMainThreadTestRun(req, dto, profile, token) {
            return this.getTracker(req, dto, profile, token);
        }
        /**
         * Cancels an existing test run via its cancellation token.
         */
        cancelRunById(runId) {
            this.trackedById.get(runId)?.cancel();
        }
        /**
         * Cancels an existing test run via its cancellation token.
         */
        cancelAllRuns() {
            for (const tracker of this.tracked.values()) {
                tracker.cancel();
            }
        }
        /**
         * Implements the public `createTestRun` API.
         */
        createTestRun(controllerId, collection, request, name, persist) {
            const existing = this.tracked.get(request);
            if (existing) {
                return existing.createRun(name);
            }
            // If there is not an existing tracked extension for the request, start
            // a new, detached session.
            const dto = TestRunDto.fromPublic(controllerId, collection, request, persist);
            const profile = tryGetProfileFromTestRunReq(request);
            this.proxy.$startedExtensionTestRun({
                controllerId,
                continuous: !!request.continuous,
                profile: profile && { group: profileGroupToBitset[profile.kind], id: profile.profileId },
                exclude: request.exclude?.map(t => testId_1.TestId.fromExtHostTestItem(t, collection.root.id).toString()) ?? [],
                id: dto.id,
                include: request.include?.map(t => testId_1.TestId.fromExtHostTestItem(t, collection.root.id).toString()) ?? [collection.root.id],
                persist
            });
            const tracker = this.getTracker(request, dto, request.profile);
            event_1.Event.once(tracker.onEnd)(() => {
                this.proxy.$finishedExtensionTestRun(dto.id);
            });
            return tracker.createRun(name);
        }
        getTracker(req, dto, profile, token) {
            const tracker = new TestRunTracker(dto, this.proxy, this.logService, profile, token);
            this.tracked.set(req, tracker);
            this.trackedById.set(tracker.id, tracker);
            return tracker;
        }
    }
    exports.TestRunCoordinator = TestRunCoordinator;
    const tryGetProfileFromTestRunReq = (request) => {
        if (!request.profile) {
            return undefined;
        }
        if (!(request.profile instanceof TestRunProfileImpl)) {
            throw new Error(`TestRunRequest.profile is not an instance created from TestController.createRunProfile`);
        }
        return request.profile;
    };
    class TestRunDto {
        static fromPublic(controllerId, collection, request, persist) {
            return new TestRunDto(controllerId, (0, uuid_1.generateUuid)(), request.include?.map(t => testId_1.TestId.fromExtHostTestItem(t, controllerId).toString()) ?? [controllerId], request.exclude?.map(t => testId_1.TestId.fromExtHostTestItem(t, controllerId).toString()) ?? [], persist, collection);
        }
        static fromInternal(request, collection) {
            return new TestRunDto(request.controllerId, request.runId, request.testIds, request.excludeExtIds, true, collection);
        }
        constructor(controllerId, id, include, exclude, isPersisted, colllection) {
            this.controllerId = controllerId;
            this.id = id;
            this.isPersisted = isPersisted;
            this.colllection = colllection;
            this.includePrefix = include.map(id => id + "\0" /* TestIdPathParts.Delimiter */);
            this.excludePrefix = exclude.map(id => id + "\0" /* TestIdPathParts.Delimiter */);
        }
        isIncluded(test) {
            const id = testId_1.TestId.fromExtHostTestItem(test, this.controllerId).toString() + "\0" /* TestIdPathParts.Delimiter */;
            for (const prefix of this.excludePrefix) {
                if (id === prefix || id.startsWith(prefix)) {
                    return false;
                }
            }
            for (const prefix of this.includePrefix) {
                if (id === prefix || id.startsWith(prefix)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.TestRunDto = TestRunDto;
    class MirroredChangeCollector {
        get isEmpty() {
            return this.added.size === 0 && this.removed.size === 0 && this.updated.size === 0;
        }
        constructor(emitter) {
            this.emitter = emitter;
            this.added = new Set();
            this.updated = new Set();
            this.removed = new Set();
            this.alreadyRemoved = new Set();
        }
        /**
         * @inheritdoc
         */
        add(node) {
            this.added.add(node);
        }
        /**
         * @inheritdoc
         */
        update(node) {
            Object.assign(node.revived, Convert.TestItem.toPlain(node.item));
            if (!this.added.has(node)) {
                this.updated.add(node);
            }
        }
        /**
         * @inheritdoc
         */
        remove(node) {
            if (this.added.has(node)) {
                this.added.delete(node);
                return;
            }
            this.updated.delete(node);
            const parentId = testId_1.TestId.parentId(node.item.extId);
            if (parentId && this.alreadyRemoved.has(parentId.toString())) {
                this.alreadyRemoved.add(node.item.extId);
                return;
            }
            this.removed.add(node);
        }
        /**
         * @inheritdoc
         */
        getChangeEvent() {
            const { added, updated, removed } = this;
            return {
                get added() { return [...added].map(n => n.revived); },
                get updated() { return [...updated].map(n => n.revived); },
                get removed() { return [...removed].map(n => n.revived); },
            };
        }
        complete() {
            if (!this.isEmpty) {
                this.emitter.fire(this.getChangeEvent());
            }
        }
    }
    /**
     * Maintains tests in this extension host sent from the main thread.
     * @private
     */
    class MirroredTestCollection extends testTypes_1.AbstractIncrementalTestCollection {
        constructor() {
            super(...arguments);
            this.changeEmitter = new event_1.Emitter();
            /**
             * Change emitter that fires with the same semantics as `TestObserver.onDidChangeTests`.
             */
            this.onDidChangeTests = this.changeEmitter.event;
        }
        /**
         * Gets a list of root test items.
         */
        get rootTests() {
            return this.roots;
        }
        /**
         *
         * If the test ID exists, returns its underlying ID.
         */
        getMirroredTestDataById(itemId) {
            return this.items.get(itemId);
        }
        /**
         * If the test item is a mirrored test item, returns its underlying ID.
         */
        getMirroredTestDataByReference(item) {
            return this.items.get(item.id);
        }
        /**
         * @override
         */
        createItem(item, parent) {
            return {
                ...item,
                // todo@connor4312: make this work well again with children
                revived: Convert.TestItem.toPlain(item.item),
                depth: parent ? parent.depth + 1 : 0,
                children: new Set(),
            };
        }
        /**
         * @override
         */
        createChangeCollector() {
            return new MirroredChangeCollector(this.changeEmitter);
        }
    }
    class TestObservers {
        constructor(proxy) {
            this.proxy = proxy;
        }
        checkout() {
            if (!this.current) {
                this.current = this.createObserverData();
            }
            const current = this.current;
            current.observers++;
            return {
                onDidChangeTest: current.tests.onDidChangeTests,
                get tests() { return [...current.tests.rootTests].map(t => t.revived); },
                dispose: (0, functional_1.createSingleCallFunction)(() => {
                    if (--current.observers === 0) {
                        this.proxy.$unsubscribeFromDiffs();
                        this.current = undefined;
                    }
                }),
            };
        }
        /**
         * Gets the internal test data by its reference.
         */
        getMirroredTestDataByReference(ref) {
            return this.current?.tests.getMirroredTestDataByReference(ref);
        }
        /**
         * Applies test diffs to the current set of observed tests.
         */
        applyDiff(diff) {
            this.current?.tests.apply(diff);
        }
        createObserverData() {
            const tests = new MirroredTestCollection({ asCanonicalUri: u => u });
            this.proxy.$subscribeToDiffs();
            return { observers: 0, tests, };
        }
    }
    const updateProfile = (impl, proxy, initial, update) => {
        if (initial) {
            Object.assign(initial, update);
        }
        else {
            proxy.$updateTestRunConfig(impl.controllerId, impl.profileId, update);
        }
    };
    class TestRunProfileImpl {
        #proxy;
        #activeProfiles;
        #onDidChangeDefaultProfiles;
        #initialPublish;
        #profiles;
        get label() {
            return this._label;
        }
        set label(label) {
            if (label !== this._label) {
                this._label = label;
                updateProfile(this, this.#proxy, this.#initialPublish, { label });
            }
        }
        get supportsContinuousRun() {
            return this._supportsContinuousRun;
        }
        set supportsContinuousRun(supports) {
            if (supports !== this._supportsContinuousRun) {
                this._supportsContinuousRun = supports;
                updateProfile(this, this.#proxy, this.#initialPublish, { supportsContinuousRun: supports });
            }
        }
        get isDefault() {
            return this.#activeProfiles.has(this.profileId);
        }
        set isDefault(isDefault) {
            if (isDefault !== this.isDefault) {
                // #activeProfiles is synced from the main thread, so we can make
                // provisional changes here that will get confirmed momentarily
                if (isDefault) {
                    this.#activeProfiles.add(this.profileId);
                }
                else {
                    this.#activeProfiles.delete(this.profileId);
                }
                updateProfile(this, this.#proxy, this.#initialPublish, { isDefault });
            }
        }
        get tag() {
            return this._tag;
        }
        set tag(tag) {
            if (tag?.id !== this._tag?.id) {
                this._tag = tag;
                updateProfile(this, this.#proxy, this.#initialPublish, {
                    tag: tag ? Convert.TestTag.namespace(this.controllerId, tag.id) : null,
                });
            }
        }
        get configureHandler() {
            return this._configureHandler;
        }
        set configureHandler(handler) {
            if (handler !== this._configureHandler) {
                this._configureHandler = handler;
                updateProfile(this, this.#proxy, this.#initialPublish, { hasConfigurationHandler: !!handler });
            }
        }
        get onDidChangeDefault() {
            return event_1.Event.chain(this.#onDidChangeDefaultProfiles, $ => $
                .map(ev => ev.get(this.controllerId)?.get(this.profileId))
                .filter(types_1.isDefined));
        }
        constructor(proxy, profiles, activeProfiles, onDidChangeActiveProfiles, controllerId, profileId, _label, kind, runHandler, _isDefault = false, _tag = undefined, _supportsContinuousRun = false) {
            this.controllerId = controllerId;
            this.profileId = profileId;
            this._label = _label;
            this.kind = kind;
            this.runHandler = runHandler;
            this._tag = _tag;
            this._supportsContinuousRun = _supportsContinuousRun;
            this.#proxy = proxy;
            this.#profiles = profiles;
            this.#activeProfiles = activeProfiles;
            this.#onDidChangeDefaultProfiles = onDidChangeActiveProfiles;
            profiles.set(profileId, this);
            const groupBitset = profileGroupToBitset[kind];
            if (typeof groupBitset !== 'number') {
                throw new Error(`Unknown TestRunProfile.group ${kind}`);
            }
            if (_isDefault) {
                activeProfiles.add(profileId);
            }
            this.#initialPublish = {
                profileId: profileId,
                controllerId,
                tag: _tag ? Convert.TestTag.namespace(this.controllerId, _tag.id) : null,
                label: _label,
                group: groupBitset,
                isDefault: _isDefault,
                hasConfigurationHandler: false,
                supportsContinuousRun: _supportsContinuousRun,
            };
            // we send the initial profile publish out on the next microtask so that
            // initially setting the isDefault value doesn't overwrite a user-configured value
            queueMicrotask(() => {
                if (this.#initialPublish) {
                    this.#proxy.$publishTestRunProfile(this.#initialPublish);
                    this.#initialPublish = undefined;
                }
            });
        }
        dispose() {
            if (this.#profiles?.delete(this.profileId)) {
                this.#profiles = undefined;
                this.#proxy.$removeTestProfile(this.controllerId, this.profileId);
            }
            this.#initialPublish = undefined;
        }
    }
    exports.TestRunProfileImpl = TestRunProfileImpl;
    const profileGroupToBitset = {
        [extHostTypes_1.TestRunProfileKind.Coverage]: 8 /* TestRunProfileBitset.Coverage */,
        [extHostTypes_1.TestRunProfileKind.Debug]: 4 /* TestRunProfileBitset.Debug */,
        [extHostTypes_1.TestRunProfileKind.Run]: 2 /* TestRunProfileBitset.Run */,
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlc3RpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUZXN0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVDekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBVzdDLFlBQ3FCLEdBQXVCLEVBQzlCLFVBQXVCLEVBQ3BDLFFBQXlCLEVBQ1IsT0FBbUM7WUFFcEQsS0FBSyxFQUFFLENBQUM7WUFGUyxZQUFPLEdBQVAsT0FBTyxDQUE0QjtZQWRwQywwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMxRCxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUE4QyxDQUFDO1lBSXRFLGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZCLENBQUMsQ0FBQztZQUVuRyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBQ3BELFlBQU8sR0FBd0MsRUFBRSxDQUFDO1lBU3hELElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFakUsUUFBUSxDQUFDLHlCQUF5QixDQUFDO2dCQUNsQyxlQUFlLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQ3RCLFFBQVEsR0FBRyxF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