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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testResultService"], function (require, exports, lifecycle_1, nls_1, configuration_1, viewsService_1, configuration_2, testingStates_1, testResultService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTestProgressText = exports.collectTestStateCounts = exports.TestingProgressTrigger = void 0;
    /** Workbench contribution that triggers updates in the TestingProgressUi service */
    let TestingProgressTrigger = class TestingProgressTrigger extends lifecycle_1.Disposable {
        constructor(resultService, configurationService, viewsService) {
            super();
            this.configurationService = configurationService;
            this.viewsService = viewsService;
            this._register(resultService.onResultsChanged((e) => {
                if ('started' in e) {
                    this.attachAutoOpenForNewResults(e.started);
                }
            }));
        }
        attachAutoOpenForNewResults(result) {
            if (result.request.isUiTriggered === false) {
                return;
            }
            const cfg = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.openTesting" /* TestingConfigKeys.OpenTesting */);
            if (cfg === "neverOpen" /* AutoOpenTesting.NeverOpen */) {
                return;
            }
            if (cfg === "openExplorerOnTestStart" /* AutoOpenTesting.OpenExplorerOnTestStart */) {
                return this.openExplorerView();
            }
            if (cfg === "openOnTestStart" /* AutoOpenTesting.OpenOnTestStart */) {
                return this.openResultsView();
            }
            // open on failure
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(result.onComplete(() => disposable.dispose()));
            disposable.add(result.onChange(e => {
                if (e.reason === 1 /* TestResultItemChangeReason.OwnStateChange */ && (0, testingStates_1.isFailedState)(e.item.ownComputedState)) {
                    this.openResultsView();
                    disposable.dispose();
                }
            }));
        }
        openExplorerView() {
            this.viewsService.openView("workbench.view.testing" /* Testing.ExplorerViewId */, false);
        }
        openResultsView() {
            this.viewsService.openView("workbench.panel.testResults.view" /* Testing.ResultsViewId */, false);
        }
    };
    exports.TestingProgressTrigger = TestingProgressTrigger;
    exports.TestingProgressTrigger = TestingProgressTrigger = __decorate([
        __param(0, testResultService_1.ITestResultService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, viewsService_1.IViewsService)
    ], TestingProgressTrigger);
    const collectTestStateCounts = (isRunning, results) => {
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        let running = 0;
        let queued = 0;
        for (const result of results) {
            const count = result.counts;
            failed += count[6 /* TestResultState.Errored */] + count[4 /* TestResultState.Failed */];
            passed += count[3 /* TestResultState.Passed */];
            skipped += count[5 /* TestResultState.Skipped */];
            running += count[2 /* TestResultState.Running */];
            queued += count[1 /* TestResultState.Queued */];
        }
        return {
            isRunning,
            passed,
            failed,
            runSoFar: passed + failed,
            totalWillBeRun: passed + failed + queued + running,
            skipped,
        };
    };
    exports.collectTestStateCounts = collectTestStateCounts;
    const getTestProgressText = ({ isRunning, passed, runSoFar, totalWillBeRun, skipped, failed }) => {
        let percent = passed / runSoFar * 100;
        if (failed > 0) {
            // fix: prevent from rounding to 100 if there's any failed test
            percent = Math.min(percent, 99.9);
        }
        else if (runSoFar === 0) {
            percent = 0;
        }
        if (isRunning) {
            if (runSoFar === 0) {
                return (0, nls_1.localize)('testProgress.runningInitial', 'Running tests...');
            }
            else if (skipped === 0) {
                return (0, nls_1.localize)('testProgress.running', 'Running tests, {0}/{1} passed ({2}%)', passed, totalWillBeRun, percent.toPrecision(3));
            }
            else {
                return (0, nls_1.localize)('testProgressWithSkip.running', 'Running tests, {0}/{1} tests passed ({2}%, {3} skipped)', passed, totalWillBeRun, percent.toPrecision(3), skipped);
            }
        }
        else {
            if (skipped === 0) {
                return (0, nls_1.localize)('testProgress.completed', '{0}/{1} tests passed ({2}%)', passed, runSoFar, percent.toPrecision(3));
            }
            else {
                return (0, nls_1.localize)('testProgressWithSkip.completed', '{0}/{1} tests passed ({2}%, {3} skipped)', passed, runSoFar, percent.toPrecision(3), skipped);
            }
        }
    };
    exports.getTestProgressText = getTestProgressText;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1Byb2dyZXNzVWlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdGluZ1Byb2dyZXNzVWlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxvRkFBb0Y7SUFDN0UsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQUNyRCxZQUNxQixhQUFpQyxFQUNiLG9CQUEyQyxFQUNuRCxZQUEyQjtZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQUhnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ25ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBSTNELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELElBQUksU0FBUyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNwQixJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTywyQkFBMkIsQ0FBQyxNQUFzQjtZQUN6RCxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUM1QyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLElBQUEsdUNBQXVCLEVBQUMsSUFBSSxDQUFDLG9CQUFvQiw0REFBZ0MsQ0FBQztZQUM5RixJQUFJLEdBQUcsZ0RBQThCLEVBQUUsQ0FBQztnQkFDdkMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLEdBQUcsNEVBQTRDLEVBQUUsQ0FBQztnQkFDckQs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