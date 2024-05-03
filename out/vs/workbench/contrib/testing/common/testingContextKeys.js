/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingContextKeys = void 0;
    var TestingContextKeys;
    (function (TestingContextKeys) {
        TestingContextKeys.providerCount = new contextkey_1.RawContextKey('testing.providerCount', 0);
        TestingContextKeys.canRefreshTests = new contextkey_1.RawContextKey('testing.canRefresh', false, { type: 'boolean', description: (0, nls_1.localize)('testing.canRefresh', 'Indicates whether any test controller has an attached refresh handler.') });
        TestingContextKeys.isRefreshingTests = new contextkey_1.RawContextKey('testing.isRefreshing', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isRefreshing', 'Indicates whether any test controller is currently refreshing tests.') });
        TestingContextKeys.isContinuousModeOn = new contextkey_1.RawContextKey('testing.isContinuousModeOn', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isContinuousModeOn', 'Indicates whether continuous test mode is on.') });
        TestingContextKeys.hasDebuggableTests = new contextkey_1.RawContextKey('testing.hasDebuggableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasDebuggableTests', 'Indicates whether any test controller has registered a debug configuration') });
        TestingContextKeys.hasRunnableTests = new contextkey_1.RawContextKey('testing.hasRunnableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasRunnableTests', 'Indicates whether any test controller has registered a run configuration') });
        TestingContextKeys.hasCoverableTests = new contextkey_1.RawContextKey('testing.hasCoverableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasCoverableTests', 'Indicates whether any test controller has registered a coverage configuration') });
        TestingContextKeys.hasNonDefaultProfile = new contextkey_1.RawContextKey('testing.hasNonDefaultProfile', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasNonDefaultConfig', 'Indicates whether any test controller has registered a non-default configuration') });
        TestingContextKeys.hasConfigurableProfile = new contextkey_1.RawContextKey('testing.hasConfigurableProfile', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasConfigurableConfig', 'Indicates whether any test configuration can be configured') });
        TestingContextKeys.supportsContinuousRun = new contextkey_1.RawContextKey('testing.supportsContinuousRun', false, { type: 'boolean', description: (0, nls_1.localize)('testing.supportsContinuousRun', 'Indicates whether continous test running is supported') });
        TestingContextKeys.isParentRunningContinuously = new contextkey_1.RawContextKey('testing.isParentRunningContinuously', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isParentRunningContinuously', 'Indicates whether the parent of a test is continuously running, set in the menu context of test items') });
        TestingContextKeys.activeEditorHasTests = new contextkey_1.RawContextKey('testing.activeEditorHasTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.activeEditorHasTests', 'Indicates whether any tests are present in the current editor') });
        TestingContextKeys.isTestCoverageOpen = new contextkey_1.RawContextKey('testing.isTestCoverageOpen', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isTestCoverageOpen', 'Indicates whether a test coverage report is open') });
        TestingContextKeys.capabilityToContextKey = {
            [2 /* TestRunProfileBitset.Run */]: TestingContextKeys.hasRunnableTests,
            [8 /* TestRunProfileBitset.Coverage */]: TestingContextKeys.hasCoverableTests,
            [4 /* TestRunProfileBitset.Debug */]: TestingContextKeys.hasDebuggableTests,
            [16 /* TestRunProfileBitset.HasNonDefaultProfile */]: TestingContextKeys.hasNonDefaultProfile,
            [32 /* TestRunProfileBitset.HasConfigurable */]: TestingContextKeys.hasConfigurableProfile,
            [64 /* TestRunProfileBitset.SupportsContinuousRun */]: TestingContextKeys.supportsContinuousRun,
        };
        TestingContextKeys.hasAnyResults = new contextkey_1.RawContextKey('testing.hasAnyResults', false);
        TestingContextKeys.viewMode = new contextkey_1.RawContextKey('testing.explorerViewMode', "list" /* TestExplorerViewMode.List */);
        TestingContextKeys.viewSorting = new contextkey_1.RawContextKey('testing.explorerViewSorting', "location" /* TestExplorerViewSorting.ByLocation */);
        TestingContextKeys.isRunning = new contextkey_1.RawContextKey('testing.isRunning', false);
        TestingContextKeys.isInPeek = new contextkey_1.RawContextKey('testing.isInPeek', false);
        TestingContextKeys.isPeekVisible = new contextkey_1.RawContextKey('testing.isPeekVisible', false);
        TestingContextKeys.peekItemType = new contextkey_1.RawContextKey('peekItemType', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.peekItemType', 'Type of the item in the output peek view. Either a "test", "message", "task", or "result".'),
        });
        TestingContextKeys.controllerId = new contextkey_1.RawContextKey('controllerId', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.controllerId', 'Controller ID of the current test item')
        });
        TestingContextKeys.testItemExtId = new contextkey_1.RawContextKey('testId', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testId', 'ID of the current test item, set when creating or opening menus on test items')
        });
        TestingContextKeys.testItemHasUri = new contextkey_1.RawContextKey('testing.testItemHasUri', false, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testItemHasUri', 'Boolean indicating whether the test item has a URI defined')
        });
        TestingContextKeys.testItemIsHidden = new contextkey_1.RawContextKey('testing.testItemIsHidden', false, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testItemIsHidden', 'Boolean indicating whether the test item is hidden')
        });
        TestingContextKeys.testMessageContext = new contextkey_1.RawContextKey('testMessage', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testMessage', 'Value set in `testMessage.contextValue`, available in editor/content and testing/message/context')
        });
        TestingContextKeys.testResultOutdated = new contextkey_1.RawContextKey('testResultOutdated', undefined, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testResultOutdated', 'Value available in editor/content and testing/message/context when the result is outdated')
        });
        TestingContextKeys.testResultState = new contextkey_1.RawContextKey('testResultState', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testResultState', 'Value available testing/item/result indicating the state of the item.')
        });
    })(TestingContextKeys || (exports.TestingContextKeys = TestingContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbnRleHRLZXlzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0aW5nQ29udGV4dEtleXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLElBQWlCLGtCQUFrQixDQStEbEM7SUEvREQsV0FBaUIsa0JBQWtCO1FBQ3JCLGdDQUFhLEdBQUcsSUFBSSwwQkFBYSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlELGtDQUFlLEdBQUcsSUFBSSwwQkFBYSxDQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHdFQUF3RSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdNLG9DQUFpQixHQUFHLElBQUksMEJBQWEsQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxzRUFBc0UsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqTixxQ0FBa0IsR0FBRyxJQUFJLDBCQUFhLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsK0NBQStDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdk0scUNBQWtCLEdBQUcsSUFBSSwwQkFBYSxDQUFDLDRCQUE0QixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLDRFQUE0RSxDQUFDLEVB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