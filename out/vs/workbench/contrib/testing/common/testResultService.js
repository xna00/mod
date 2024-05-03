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
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/async", "vs/base/common/event", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultStorage"], function (require, exports, arraysFind_1, async_1, event_1, functional_1, lifecycle_1, uuid_1, contextkey_1, instantiation_1, testingContextKeys_1, testProfileService_1, testResult_1, testResultStorage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestResultService = exports.ITestResultService = void 0;
    const isRunningTests = (service) => service.results.length > 0 && service.results[0].completedAt === undefined;
    exports.ITestResultService = (0, instantiation_1.createDecorator)('testResultService');
    let TestResultService = class TestResultService extends lifecycle_1.Disposable {
        /**
         * @inheritdoc
         */
        get results() {
            this.loadResults();
            return this._results;
        }
        constructor(contextKeyService, storage, testProfiles) {
            super();
            this.storage = storage;
            this.testProfiles = testProfiles;
            this.changeResultEmitter = this._register(new event_1.Emitter());
            this._results = [];
            this._resultsDisposables = [];
            this.testChangeEmitter = this._register(new event_1.Emitter());
            /**
             * @inheritdoc
             */
            this.onResultsChanged = this.changeResultEmitter.event;
            /**
             * @inheritdoc
             */
            this.onTestChanged = this.testChangeEmitter.event;
            this.loadResults = (0, functional_1.createSingleCallFunction)(() => this.storage.read().then(loaded => {
                for (let i = loaded.length - 1; i >= 0; i--) {
                    this.push(loaded[i]);
                }
            }));
            this.persistScheduler = new async_1.RunOnceScheduler(() => this.persistImmediately(), 500);
            this._register((0, lifecycle_1.toDisposable)(() => (0, lifecycle_1.dispose)(this._resultsDisposables)));
            this.isRunning = testingContextKeys_1.TestingContextKeys.isRunning.bindTo(contextKeyService);
            this.hasAnyResults = testingContextKeys_1.TestingContextKeys.hasAnyResults.bindTo(contextKeyService);
        }
        /**
         * @inheritdoc
         */
        getStateById(extId) {
            for (const result of this.results) {
                const lookup = result.getStateById(extId);
                if (lookup && lookup.computedState !== 0 /* TestResultState.Unset */) {
                    return [result, lookup];
                }
            }
            return undefined;
        }
        /**
         * @inheritdoc
         */
        createLiveResult(req) {
            if ('targets' in req) {
                const id = (0, uuid_1.generateUuid)();
                return this.push(new testResult_1.LiveTestResult(id, true, req));
            }
            let profile;
            if (req.profile) {
                const profiles = this.testProfiles.getControllerProfiles(req.controllerId);
                profile = profiles.find(c => c.profileId === req.profile.id);
            }
            const resolved = {
                isUiTriggered: false,
                targets: [],
                exclude: req.exclude,
                continuous: req.continuous,
            };
            if (profile) {
                resolved.targets.push({
                    profileGroup: profile.group,
                    profileId: profile.profileId,
                    controllerId: req.controllerId,
                    testIds: req.include,
                });
            }
            return this.push(new testResult_1.LiveTestResult(req.id, req.persist, resolved));
        }
        /**
         * @inheritdoc
         */
        push(result) {
            if (result.completedAt === undefined) {
                this.results.unshift(result);
            }
            else {
                const index = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(this.results, r => r.completedAt !== undefined && r.completedAt <= result.completedAt);
                this.results.splice(index, 0, result);
                this.persistScheduler.schedule();
            }
            this.hasAnyResults.set(true);
            if (this.results.length > testResultStorage_1.RETAIN_MAX_RESULTS) {
                this.results.pop();
                this._resultsDisposables.pop()?.dispose();
            }
            const ds = new lifecycle_1.DisposableStore();
            this._resultsDisposables.push(ds);
            if (result instanceof testResult_1.LiveTestResult) {
                ds.add(result);
                ds.add(result.onComplete(() => this.onComplete(result)));
                ds.add(result.onChange(this.testChangeEmitter.fire, this.testChangeEmitter));
                this.isRunning.set(true);
                this.changeResultEmitter.fire({ started: result });
            }
            else {
                this.changeResultEmitter.fire({ inserted: result });
                // If this is not a new result, go through each of its tests. For each
                // test for which the new result is the most recently inserted, fir
                // a change event so that UI updates.
                for (const item of result.tests) {
                    for (const otherResult of this.results) {
                        if (otherResult === result) {
                            this.testChangeEmitter.fire({ item, result, reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ });
                            break;
                        }
                        else if (otherResult.getStateById(item.item.extId) !== undefined) {
                            break;
                        }
                    }
                }
            }
            return result;
        }
        /**
         * @inheritdoc
         */
        getResult(id) {
            return this.results.find(r => r.id === id);
        }
        /**
         * @inheritdoc
         */
        clear() {
            const keep = [];
            const removed = [];
            for (const result of this.results) {
                if (result.completedAt !== undefined) {
                    removed.push(result);
                }
                else {
                    keep.push(result);
                }
            }
            this._results = keep;
            this.persistScheduler.schedule();
            if (keep.length === 0) {
                this.hasAnyResults.set(false);
            }
            this.changeResultEmitter.fire({ removed });
        }
        onComplete(result) {
            this.resort();
            this.updateIsRunning();
            this.persistScheduler.schedule();
            this.changeResultEmitter.fire({ completed: result });
        }
        resort() {
            this.results.sort((a, b) => (b.completedAt ?? Number.MAX_SAFE_INTEGER) - (a.completedAt ?? Number.MAX_SAFE_INTEGER));
        }
        updateIsRunning() {
            this.isRunning.set(isRunningTests(this));
        }
        async persistImmediately() {
            // ensure results are loaded before persisting to avoid deleting once
            // that we don't have yet.
            await this.loadResults();
            this.storage.persist(this.results);
        }
    };
    exports.TestResultService = TestResultService;
    exports.TestResultService = TestResultService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, testResultStorage_1.ITestResultStorage),
        __param(2, testProfileService_1.ITestProfileService)
    ], TestResultService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RSZXN1bHRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlFaEcsTUFBTSxjQUFjLEdBQUcsQ0FBQyxPQUEyQixFQUFFLEVBQUUsQ0FDdEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztJQUUvRCxRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBcUIsbUJBQW1CLENBQUMsQ0FBQztJQUVwRixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBT2hEOztXQUVHO1FBQ0gsSUFBVyxPQUFPO1lBQ2pCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQXNCRCxZQUNxQixpQkFBcUMsRUFDckMsT0FBNEMsRUFDM0MsWUFBa0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFINkIsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7WUFDMUIsaUJBQVksR0FBWixZQUFZLENBQXFCO1lBcENoRSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxQixDQUFDLENBQUM7WUFDdkUsYUFBUSxHQUFrQixFQUFFLENBQUM7WUFDcEIsd0JBQW1CLEdBQXNCLEVBQUUsQ0FBQztZQUNyRCxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF3QixDQUFDLENBQUM7WUFVaEY7O2VBRUc7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