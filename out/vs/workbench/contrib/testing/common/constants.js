/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iconLabels", "vs/nls"], function (require, exports, iconLabels_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCommandId = exports.testConfigurationGroupNames = exports.labelForTestInState = exports.TestExplorerViewSorting = exports.TestExplorerViewMode = exports.Testing = void 0;
    var Testing;
    (function (Testing) {
        // marked as "extension" so that any existing test extensions are assigned to it.
        Testing["ViewletId"] = "workbench.view.extension.test";
        Testing["ExplorerViewId"] = "workbench.view.testing";
        Testing["OutputPeekContributionId"] = "editor.contrib.testingOutputPeek";
        Testing["DecorationsContributionId"] = "editor.contrib.testingDecorations";
        Testing["CoverageDecorationsContributionId"] = "editor.contrib.coverageDecorations";
        Testing["CoverageViewId"] = "workbench.view.testCoverage";
        Testing["ResultsPanelId"] = "workbench.panel.testResults";
        Testing["ResultsViewId"] = "workbench.panel.testResults.view";
        Testing["MessageLanguageId"] = "vscodeInternalTestMessage";
    })(Testing || (exports.Testing = Testing = {}));
    var TestExplorerViewMode;
    (function (TestExplorerViewMode) {
        TestExplorerViewMode["List"] = "list";
        TestExplorerViewMode["Tree"] = "true";
    })(TestExplorerViewMode || (exports.TestExplorerViewMode = TestExplorerViewMode = {}));
    var TestExplorerViewSorting;
    (function (TestExplorerViewSorting) {
        TestExplorerViewSorting["ByLocation"] = "location";
        TestExplorerViewSorting["ByStatus"] = "status";
        TestExplorerViewSorting["ByDuration"] = "duration";
    })(TestExplorerViewSorting || (exports.TestExplorerViewSorting = TestExplorerViewSorting = {}));
    const testStateNames = {
        [6 /* TestResultState.Errored */]: (0, nls_1.localize)('testState.errored', 'Errored'),
        [4 /* TestResultState.Failed */]: (0, nls_1.localize)('testState.failed', 'Failed'),
        [3 /* TestResultState.Passed */]: (0, nls_1.localize)('testState.passed', 'Passed'),
        [1 /* TestResultState.Queued */]: (0, nls_1.localize)('testState.queued', 'Queued'),
        [2 /* TestResultState.Running */]: (0, nls_1.localize)('testState.running', 'Running'),
        [5 /* TestResultState.Skipped */]: (0, nls_1.localize)('testState.skipped', 'Skipped'),
        [0 /* TestResultState.Unset */]: (0, nls_1.localize)('testState.unset', 'Not yet run'),
    };
    const labelForTestInState = (label, state) => (0, nls_1.localize)({
        key: 'testing.treeElementLabel',
        comment: ['label then the unit tests state, for example "Addition Tests (Running)"'],
    }, '{0} ({1})', (0, iconLabels_1.stripIcons)(label), testStateNames[state]);
    exports.labelForTestInState = labelForTestInState;
    exports.testConfigurationGroupNames = {
        [4 /* TestRunProfileBitset.Debug */]: (0, nls_1.localize)('testGroup.debug', 'Debug'),
        [2 /* TestRunProfileBitset.Run */]: (0, nls_1.localize)('testGroup.run', 'Run'),
        [8 /* TestRunProfileBitset.Coverage */]: (0, nls_1.localize)('testGroup.coverage', 'Coverage'),
    };
    var TestCommandId;
    (function (TestCommandId) {
        TestCommandId["CancelTestRefreshAction"] = "testing.cancelTestRefresh";
        TestCommandId["CancelTestRunAction"] = "testing.cancelRun";
        TestCommandId["ClearTestResultsAction"] = "testing.clearTestResults";
        TestCommandId["CollapseAllAction"] = "testing.collapseAll";
        TestCommandId["ConfigureTestProfilesAction"] = "testing.configureProfile";
        TestCommandId["ContinousRunUsingForTest"] = "testing.continuousRunUsingForTest";
        TestCommandId["CoverageAtCursor"] = "testing.coverageAtCursor";
        TestCommandId["CoverageByUri"] = "testing.coverage.uri";
        TestCommandId["CoverageViewChangeSorting"] = "testing.coverageViewChangeSorting";
        TestCommandId["CoverageClear"] = "testing.coverage.close";
        TestCommandId["CoverageCurrentFile"] = "testing.coverageCurrentFile";
        TestCommandId["CoverageLastRun"] = "testing.coverageLastRun";
        TestCommandId["CoverageSelectedAction"] = "testing.coverageSelected";
        TestCommandId["DebugAction"] = "testing.debug";
        TestCommandId["DebugAllAction"] = "testing.debugAll";
        TestCommandId["DebugAtCursor"] = "testing.debugAtCursor";
        TestCommandId["DebugByUri"] = "testing.debug.uri";
        TestCommandId["DebugCurrentFile"] = "testing.debugCurrentFile";
        TestCommandId["DebugFailedTests"] = "testing.debugFailTests";
        TestCommandId["DebugLastRun"] = "testing.debugLastRun";
        TestCommandId["DebugSelectedAction"] = "testing.debugSelected";
        TestCommandId["FilterAction"] = "workbench.actions.treeView.testExplorer.filter";
        TestCommandId["GetExplorerSelection"] = "_testing.getExplorerSelection";
        TestCommandId["GetSelectedProfiles"] = "testing.getSelectedProfiles";
        TestCommandId["GoToTest"] = "testing.editFocusedTest";
        TestCommandId["HideTestAction"] = "testing.hideTest";
        TestCommandId["OpenOutputPeek"] = "testing.openOutputPeek";
        TestCommandId["OpenCoverage"] = "testing.openCoverage";
        TestCommandId["RefreshTestsAction"] = "testing.refreshTests";
        TestCommandId["ReRunFailedTests"] = "testing.reRunFailTests";
        TestCommandId["ReRunLastRun"] = "testing.reRunLastRun";
        TestCommandId["RunAction"] = "testing.run";
        TestCommandId["RunAllAction"] = "testing.runAll";
        TestCommandId["RunAllWithCoverageAction"] = "testing.coverageAll";
        TestCommandId["RunAtCursor"] = "testing.runAtCursor";
        TestCommandId["RunByUri"] = "testing.run.uri";
        TestCommandId["RunCurrentFile"] = "testing.runCurrentFile";
        TestCommandId["RunSelectedAction"] = "testing.runSelected";
        TestCommandId["RunUsingProfileAction"] = "testing.runUsing";
        TestCommandId["RunWithCoverageAction"] = "testing.coverage";
        TestCommandId["SearchForTestExtension"] = "testing.searchForTestExtension";
        TestCommandId["SelectDefaultTestProfiles"] = "testing.selectDefaultTestProfiles";
        TestCommandId["ShowMostRecentOutputAction"] = "testing.showMostRecentOutput";
        TestCommandId["StartContinousRun"] = "testing.startContinuousRun";
        TestCommandId["StopContinousRun"] = "testing.stopContinuousRun";
        TestCommandId["TestingSortByDurationAction"] = "testing.sortByDuration";
        TestCommandId["TestingSortByLocationAction"] = "testing.sortByLocation";
        TestCommandId["TestingSortByStatusAction"] = "testing.sortByStatus";
        TestCommandId["TestingViewAsListAction"] = "testing.viewAsList";
        TestCommandId["TestingViewAsTreeAction"] = "testing.viewAsTree";
        TestCommandId["ToggleContinousRunForTest"] = "testing.toggleContinuousRunForTest";
        TestCommandId["ToggleInlineTestOutput"] = "testing.toggleInlineTestOutput";
        TestCommandId["UnhideAllTestsAction"] = "testing.unhideAllTests";
        TestCommandId["UnhideTestAction"] = "testing.unhideTest";
    })(TestCommandId || (exports.TestCommandId = TestCommandId = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLElBQWtCLE9BYWpCO0lBYkQsV0FBa0IsT0FBTztRQUN4QixpRkFBaUY7UUFDakYsc0RBQTJDLENBQUE7UUFDM0Msb0RBQXlDLENBQUE7UUFDekMsd0VBQTZELENBQUE7UUFDN0QsMEVBQStELENBQUE7UUFDL0QsbUZBQXdFLENBQUE7UUFDeEUseURBQThDLENBQUE7UUFFOUMseURBQThDLENBQUE7UUFDOUMsNkRBQWtELENBQUE7UUFFbEQsMERBQStDLENBQUE7SUFDaEQsQ0FBQyxFQWJpQixPQUFPLHVCQUFQLE9BQU8sUUFheEI7SUFFRCxJQUFrQixvQkFHakI7SUFIRCxXQUFrQixvQkFBb0I7UUFDckMscUNBQWEsQ0FBQTtRQUNiLHFDQUFhLENBQUE7SUFDZCxDQUFDLEVBSGlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBR3JDO0lBRUQsSUFBa0IsdUJBSWpCO0lBSkQsV0FBa0IsdUJBQXVCO1FBQ3hDLGtEQUF1QixDQUFBO1FBQ3ZCLDhDQUFtQixDQUFBO1FBQ25CLGtEQUF1QixDQUFBO0lBQ3hCLENBQUMsRUFKaUIsdUJBQXVCLHVDQUF2Qix1QkFBdUIsUUFJeEM7SUFFRCxNQUFNLGNBQWMsR0FBdUM7UUFDMUQsaUNBQXlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDO1FBQ25FLGdDQUF3QixFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQztRQUNoRSxnQ0FBd0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUM7UUFDaEUsZ0NBQXdCLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDO1FBQ2hFLGlDQUF5QixFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLFNBQVMsQ0FBQztRQUNuRSxpQ0FBeUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxTQUFTLENBQUM7UUFDbkUsK0JBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDO0tBQ25FLENBQUM7SUFFSyxNQUFNLG1CQUFtQixHQUFHLENBQUMsS0FBYSxFQUFFLEtBQXNCLEVBQUUsRUFBRSxDQUFDLElBQUEsY0FBUSxFQUFDO1FBQ3RGLEdBQUcsRUFBRSwwQkFBMEI7UUFDL0IsT0FBTyxFQUFFLENBQUMseUVBQXlFLENBQUM7S0FDcEYsRUFBRSxXQUFXLEVBQUUsSUFBQSx1QkFBVSxFQUFDLEtBQUssQ0FBQyxFQUFFLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBSDdDLFFBQUEsbUJBQW1CLHVCQUcwQjtJQUU3QyxRQUFBLDJCQUEyQixHQUE4RDtRQUNyRyxvQ0FBNEIsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUM7UUFDbEUsa0NBQTBCLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQztRQUM1RCx1Q0FBK0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxVQUFVLENBQUM7S0FDM0UsQ0FBQztJQUVGLElBQWtCLGFBdURqQjtJQXZERCxXQUFrQixhQUFhO1FBQzlCLHNFQUFxRCxDQUFBO1FBQ3JELDBEQUF5QyxDQUFBO1FBQ3pDLG9FQUFtRCxDQUFBO1FBQ25ELDBEQUF5QyxDQUFBO1FBQ3pDLHlFQUF3RCxDQUFBO1FBQ3hELCtFQUE4RCxDQUFBO1FBQzlELDhEQUE2QyxDQUFBO1FBQzdDLHVEQUFzQyxDQUFBO1FBQ3RDLGdGQUErRCxDQUFBO1FBQy9ELHlEQUF3QyxDQUFBO1FBQ3hDLG9FQUFtRCxDQUFBO1FBQ25ELDREQUEyQyxDQUFBO1FBQzNDLG9FQUFtRCxDQUFBO1FBQ25ELDhDQUE2QixDQUFBO1FBQzdCLG9EQUFtQyxDQUFBO1FBQ25DLHdEQUF1QyxDQUFBO1FBQ3ZDLGlEQUFnQyxDQUFBO1FBQ2hDLDhEQUE2QyxDQUFBO1FBQzdDLDREQUEyQyxDQUFBO1FBQzNDLHNEQUFxQyxDQUFBO1FBQ3JDLDhEQUE2QyxDQUFBO1FBQzdDLGdGQUErRCxDQUFBO1FBQy9ELHVFQUFzRCxDQUFBO1FBQ3RELG9FQUFtRCxDQUFBO1FBQ25ELHFEQUFvQyxDQUFBO1FBQ3BDLG9EQUFtQyxDQUFBO1FBQ25DLDBEQUF5QyxDQUFBO1FBQ3pDLHNEQUFxQyxDQUFBO1FBQ3JDLDREQUEyQyxDQUFBO1FBQzNDLDREQUEyQyxDQUFBO1FBQzNDLHNEQUFxQyxDQUFBO1FBQ3JDLDBDQUF5QixDQUFBO1FBQ3pCLGdEQUErQixDQUFBO1FBQy9CLGlFQUFnRCxDQUFBO1FBQ2hELG9EQUFtQyxDQUFBO1FBQ25DLDZDQUE0QixDQUFBO1FBQzVCLDBEQUF5QyxDQUFBO1FBQ3pDLDBEQUF5QyxDQUFBO1FBQ3pDLDJEQUEwQyxDQUFBO1FBQzFDLDJEQUEwQyxDQUFBO1FBQzFDLDBFQUF5RCxDQUFBO1FBQ3pELGdGQUErRCxDQUFBO1FBQy9ELDRFQUEyRCxDQUFBO1FBQzNELGlFQUFnRCxDQUFBO1FBQ2hELCtEQUE4QyxDQUFBO1FBQzlDLHVFQUFzRCxDQUFBO1FBQ3RELHVFQUFzRCxDQUFBO1FBQ3RELG1FQUFrRCxDQUFBO1FBQ2xELCtEQUE4QyxDQUFBO1FBQzlDLCtEQUE4QyxDQUFBO1FBQzlDLGlGQUFnRSxDQUFBO1FBQ2hFLDBFQUF5RCxDQUFBO1FBQ3pELGdFQUErQyxDQUFBO1FBQy9DLHdEQUF1QyxDQUFBO0lBQ3hDLENBQUMsRUF2RGlCLGFBQWEsNkJBQWIsYUFBYSxRQXVEOUIifQ==