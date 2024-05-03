/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/observable", "vs/nls"], function (require, exports, observable_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.observeTestingConfiguration = exports.getTestingConfiguration = exports.testingConfiguration = exports.TestingDisplayedCoveragePercent = exports.TestingCountBadge = exports.DefaultGutterClickAction = exports.AutoOpenPeekViewWhen = exports.AutoOpenTesting = exports.TestingConfigKeys = void 0;
    var TestingConfigKeys;
    (function (TestingConfigKeys) {
        TestingConfigKeys["AutoRunDelay"] = "testing.autoRun.delay";
        TestingConfigKeys["AutoOpenPeekView"] = "testing.automaticallyOpenPeekView";
        TestingConfigKeys["AutoOpenPeekViewDuringContinuousRun"] = "testing.automaticallyOpenPeekViewDuringAutoRun";
        TestingConfigKeys["OpenTesting"] = "testing.openTesting";
        TestingConfigKeys["FollowRunningTest"] = "testing.followRunningTest";
        TestingConfigKeys["DefaultGutterClickAction"] = "testing.defaultGutterClickAction";
        TestingConfigKeys["GutterEnabled"] = "testing.gutterEnabled";
        TestingConfigKeys["SaveBeforeTest"] = "testing.saveBeforeTest";
        TestingConfigKeys["AlwaysRevealTestOnStateChange"] = "testing.alwaysRevealTestOnStateChange";
        TestingConfigKeys["CountBadge"] = "testing.countBadge";
        TestingConfigKeys["ShowAllMessages"] = "testing.showAllMessages";
        TestingConfigKeys["CoveragePercent"] = "testing.displayedCoveragePercent";
        TestingConfigKeys["ShowCoverageInExplorer"] = "testing.showCoverageInExplorer";
        TestingConfigKeys["CoverageBarThresholds"] = "testing.coverageBarThresholds";
    })(TestingConfigKeys || (exports.TestingConfigKeys = TestingConfigKeys = {}));
    var AutoOpenTesting;
    (function (AutoOpenTesting) {
        AutoOpenTesting["NeverOpen"] = "neverOpen";
        AutoOpenTesting["OpenOnTestStart"] = "openOnTestStart";
        AutoOpenTesting["OpenOnTestFailure"] = "openOnTestFailure";
        AutoOpenTesting["OpenExplorerOnTestStart"] = "openExplorerOnTestStart";
    })(AutoOpenTesting || (exports.AutoOpenTesting = AutoOpenTesting = {}));
    var AutoOpenPeekViewWhen;
    (function (AutoOpenPeekViewWhen) {
        AutoOpenPeekViewWhen["FailureVisible"] = "failureInVisibleDocument";
        AutoOpenPeekViewWhen["FailureAnywhere"] = "failureAnywhere";
        AutoOpenPeekViewWhen["Never"] = "never";
    })(AutoOpenPeekViewWhen || (exports.AutoOpenPeekViewWhen = AutoOpenPeekViewWhen = {}));
    var DefaultGutterClickAction;
    (function (DefaultGutterClickAction) {
        DefaultGutterClickAction["Run"] = "run";
        DefaultGutterClickAction["Debug"] = "debug";
        DefaultGutterClickAction["Coverage"] = "runWithCoverage";
        DefaultGutterClickAction["ContextMenu"] = "contextMenu";
    })(DefaultGutterClickAction || (exports.DefaultGutterClickAction = DefaultGutterClickAction = {}));
    var TestingCountBadge;
    (function (TestingCountBadge) {
        TestingCountBadge["Failed"] = "failed";
        TestingCountBadge["Off"] = "off";
        TestingCountBadge["Passed"] = "passed";
        TestingCountBadge["Skipped"] = "skipped";
    })(TestingCountBadge || (exports.TestingCountBadge = TestingCountBadge = {}));
    var TestingDisplayedCoveragePercent;
    (function (TestingDisplayedCoveragePercent) {
        TestingDisplayedCoveragePercent["TotalCoverage"] = "totalCoverage";
        TestingDisplayedCoveragePercent["Statement"] = "statement";
        TestingDisplayedCoveragePercent["Minimum"] = "minimum";
    })(TestingDisplayedCoveragePercent || (exports.TestingDisplayedCoveragePercent = TestingDisplayedCoveragePercent = {}));
    exports.testingConfiguration = {
        id: 'testing',
        order: 21,
        title: (0, nls_1.localize)('testConfigurationTitle', "Testing"),
        type: 'object',
        properties: {
            ["testing.autoRun.delay" /* TestingConfigKeys.AutoRunDelay */]: {
                type: 'integer',
                minimum: 0,
                description: (0, nls_1.localize)('testing.autoRun.delay', "How long to wait, in milliseconds, after a test is marked as outdated and starting a new run."),
                default: 1000,
            },
            ["testing.automaticallyOpenPeekView" /* TestingConfigKeys.AutoOpenPeekView */]: {
                description: (0, nls_1.localize)('testing.automaticallyOpenPeekView', "Configures when the error Peek view is automatically opened."),
                enum: [
                    "failureAnywhere" /* AutoOpenPeekViewWhen.FailureAnywhere */,
                    "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */,
                    "never" /* AutoOpenPeekViewWhen.Never */,
                ],
                default: "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */,
                enumDescriptions: [
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.failureAnywhere', "Open automatically no matter where the failure is."),
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.failureInVisibleDocument', "Open automatically when a test fails in a visible document."),
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.never', "Never automatically open."),
                ],
            },
            ["testing.showAllMessages" /* TestingConfigKeys.ShowAllMessages */]: {
                description: (0, nls_1.localize)('testing.showAllMessages', "Controls whether to show messages from all test runs."),
                type: 'boolean',
                default: false,
            },
            ["testing.automaticallyOpenPeekViewDuringAutoRun" /* TestingConfigKeys.AutoOpenPeekViewDuringContinuousRun */]: {
                description: (0, nls_1.localize)('testing.automaticallyOpenPeekViewDuringContinuousRun', "Controls whether to automatically open the Peek view during continuous run mode."),
                type: 'boolean',
                default: false,
            },
            ["testing.countBadge" /* TestingConfigKeys.CountBadge */]: {
                description: (0, nls_1.localize)('testing.countBadge', 'Controls the count badge on the Testing icon on the Activity Bar.'),
                enum: [
                    "failed" /* TestingCountBadge.Failed */,
                    "off" /* TestingCountBadge.Off */,
                    "passed" /* TestingCountBadge.Passed */,
                    "skipped" /* TestingCountBadge.Skipped */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.countBadge.failed', 'Show the number of failed tests'),
                    (0, nls_1.localize)('testing.countBadge.off', 'Disable the testing count badge'),
                    (0, nls_1.localize)('testing.countBadge.passed', 'Show the number of passed tests'),
                    (0, nls_1.localize)('testing.countBadge.skipped', 'Show the number of skipped tests'),
                ],
                default: "failed" /* TestingCountBadge.Failed */,
            },
            ["testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */]: {
                description: (0, nls_1.localize)('testing.followRunningTest', 'Controls whether the running test should be followed in the Test Explorer view.'),
                type: 'boolean',
                default: true,
            },
            ["testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */]: {
                description: (0, nls_1.localize)('testing.defaultGutterClickAction', 'Controls the action to take when left-clicking on a test decoration in the gutter.'),
                enum: [
                    "run" /* DefaultGutterClickAction.Run */,
                    "debug" /* DefaultGutterClickAction.Debug */,
                    "runWithCoverage" /* DefaultGutterClickAction.Coverage */,
                    "contextMenu" /* DefaultGutterClickAction.ContextMenu */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.defaultGutterClickAction.run', 'Run the test.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.debug', 'Debug the test.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.coverage', 'Run the test with coverage.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.contextMenu', 'Open the context menu for more options.'),
                ],
                default: "run" /* DefaultGutterClickAction.Run */,
            },
            ["testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */]: {
                description: (0, nls_1.localize)('testing.gutterEnabled', 'Controls whether test decorations are shown in the editor gutter.'),
                type: 'boolean',
                default: true,
            },
            ["testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */]: {
                description: (0, nls_1.localize)('testing.saveBeforeTest', 'Control whether save all dirty editors before running a test.'),
                type: 'boolean',
                default: true,
            },
            ["testing.openTesting" /* TestingConfigKeys.OpenTesting */]: {
                enum: [
                    "neverOpen" /* AutoOpenTesting.NeverOpen */,
                    "openOnTestStart" /* AutoOpenTesting.OpenOnTestStart */,
                    "openOnTestFailure" /* AutoOpenTesting.OpenOnTestFailure */,
                    "openExplorerOnTestStart" /* AutoOpenTesting.OpenExplorerOnTestStart */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.openTesting.neverOpen', 'Never automatically open the testing views'),
                    (0, nls_1.localize)('testing.openTesting.openOnTestStart', 'Open the test results view when tests start'),
                    (0, nls_1.localize)('testing.openTesting.openOnTestFailure', 'Open the test result view on any test failure'),
                    (0, nls_1.localize)('testing.openTesting.openExplorerOnTestStart', 'Open the test explorer when tests start'),
                ],
                default: 'openOnTestStart',
                description: (0, nls_1.localize)('testing.openTesting', "Controls when the testing view should open.")
            },
            ["testing.alwaysRevealTestOnStateChange" /* TestingConfigKeys.AlwaysRevealTestOnStateChange */]: {
                markdownDescription: (0, nls_1.localize)('testing.alwaysRevealTestOnStateChange', "Always reveal the executed test when `#testing.followRunningTest#` is on. If this setting is turned off, only failed tests will be revealed."),
                type: 'boolean',
                default: false,
            },
            ["testing.showCoverageInExplorer" /* TestingConfigKeys.ShowCoverageInExplorer */]: {
                description: (0, nls_1.localize)('testing.ShowCoverageInExplorer', "Whether test coverage should be down in the File Explorer view."),
                type: 'boolean',
                default: true,
            },
            ["testing.displayedCoveragePercent" /* TestingConfigKeys.CoveragePercent */]: {
                markdownDescription: (0, nls_1.localize)('testing.displayedCoveragePercent', "Configures what percentage is displayed by default for test coverage."),
                default: "totalCoverage" /* TestingDisplayedCoveragePercent.TotalCoverage */,
                enum: [
                    "totalCoverage" /* TestingDisplayedCoveragePercent.TotalCoverage */,
                    "statement" /* TestingDisplayedCoveragePercent.Statement */,
                    "minimum" /* TestingDisplayedCoveragePercent.Minimum */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.displayedCoveragePercent.totalCoverage', 'A calculation of the combined statement, function, and branch coverage.'),
                    (0, nls_1.localize)('testing.displayedCoveragePercent.statement', 'The statement coverage.'),
                    (0, nls_1.localize)('testing.displayedCoveragePercent.minimum', 'The minimum of statement, function, and branch coverage.'),
                ],
            },
            ["testing.coverageBarThresholds" /* TestingConfigKeys.CoverageBarThresholds */]: {
                markdownDescription: (0, nls_1.localize)('testing.coverageBarThresholds', "Configures the colors used for percentages in test coverage bars."),
                default: { red: 0, yellow: 60, green: 90 },
                properties: {
                    red: { type: 'number', minimum: 0, maximum: 100, default: 0 },
                    yellow: { type: 'number', minimum: 0, maximum: 100, default: 60 },
                    green: { type: 'number', minimum: 0, maximum: 100, default: 90 },
                },
            },
        }
    };
    const getTestingConfiguration = (config, key) => config.getValue(key);
    exports.getTestingConfiguration = getTestingConfiguration;
    const observeTestingConfiguration = (config, key) => (0, observable_1.observableFromEvent)(config.onDidChangeConfiguration, () => (0, exports.getTestingConfiguration)(config, key));
    exports.observeTestingConfiguration = observeTestingConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vY29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsSUFBa0IsaUJBZWpCO0lBZkQsV0FBa0IsaUJBQWlCO1FBQ2xDLDJEQUFzQyxDQUFBO1FBQ3RDLDJFQUFzRCxDQUFBO1FBQ3RELDJHQUFzRixDQUFBO1FBQ3RGLHdEQUFtQyxDQUFBO1FBQ25DLG9FQUErQyxDQUFBO1FBQy9DLGtGQUE2RCxDQUFBO1FBQzdELDREQUF1QyxDQUFBO1FBQ3ZDLDhEQUF5QyxDQUFBO1FBQ3pDLDRGQUF1RSxDQUFBO1FBQ3ZFLHNEQUFpQyxDQUFBO1FBQ2pDLGdFQUEyQyxDQUFBO1FBQzNDLHlFQUFvRCxDQUFBO1FBQ3BELDhFQUF5RCxDQUFBO1FBQ3pELDRFQUF1RCxDQUFBO0lBQ3hELENBQUMsRUFmaUIsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFlbEM7SUFFRCxJQUFrQixlQUtqQjtJQUxELFdBQWtCLGVBQWU7UUFDaEMsMENBQXVCLENBQUE7UUFDdkIsc0RBQW1DLENBQUE7UUFDbkMsMERBQXVDLENBQUE7UUFDdkMsc0VBQW1ELENBQUE7SUFDcEQsQ0FBQyxFQUxpQixlQUFlLCtCQUFmLGVBQWUsUUFLaEM7SUFFRCxJQUFrQixvQkFJakI7SUFKRCxXQUFrQixvQkFBb0I7UUFDckMsbUVBQTJDLENBQUE7UUFDM0MsMkRBQW1DLENBQUE7UUFDbkMsdUNBQWUsQ0FBQTtJQUNoQixDQUFDLEVBSmlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSXJDO0lBRUQsSUFBa0Isd0JBS2pCO0lBTEQsV0FBa0Isd0JBQXdCO1FBQ3pDLHVDQUFXLENBQUE7UUFDWCwyQ0FBZSxDQUFBO1FB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