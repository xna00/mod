/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/iterator", "vs/base/common/keyCodes", "vs/base/common/types", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/iconRegistry", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/contextkeys", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingContinuousRunService", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/views/common/viewsService"], function (require, exports, arrays_1, codicons_1, iterator_1, keyCodes_1, types_1, codeEditorService_1, embeddedCodeEditorWidget_1, position_1, range_1, editorContextKeys_1, messageController_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, notification_1, progress_1, quickInput_1, iconRegistry_1, uriIdentity_1, viewPane_1, contextkeys_1, extensions_1, index_1, icons, configuration_2, constants_1, testCoverageService_1, testId_1, testProfileService_1, testResultService_1, testService_1, testingContextKeys_1, testingContinuousRunService_1, testingPeekOpener_1, testingStates_1, editorService_1, panecomposite_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.allTestActions = exports.OpenCoverage = exports.CleareCoverage = exports.CancelTestRefreshAction = exports.RefreshTestsAction = exports.ToggleInlineTestOutput = exports.OpenOutputPeek = exports.SearchForTestExtension = exports.CoverageLastRun = exports.DebugLastRun = exports.ReRunLastRun = exports.DebugFailedTests = exports.ReRunFailedTests = exports.discoverAndRunTests = exports.CoverageCurrentFile = exports.DebugCurrentFile = exports.RunCurrentFile = exports.CoverageAtCursor = exports.DebugAtCursor = exports.RunAtCursor = exports.GoToTest = exports.ClearTestResultsAction = exports.CollapseAllAction = exports.ShowMostRecentOutputAction = exports.TestingSortByDurationAction = exports.TestingSortByLocationAction = exports.TestingSortByStatusAction = exports.TestingViewAsTreeAction = exports.TestingViewAsListAction = exports.CancelTestRunAction = exports.CoverageAllAction = exports.DebugAllAction = exports.RunAllAction = exports.CoverageSelectedAction = exports.DebugSelectedAction = exports.RunSelectedAction = exports.GetExplorerSelection = exports.GetSelectedProfiles = exports.ConfigureTestProfilesAction = exports.ContinuousRunUsingProfileTestAction = exports.ContinuousRunTestAction = exports.SelectDefaultTestProfiles = exports.RunAction = exports.RunUsingProfileAction = exports.CoverageAction = exports.DebugAction = exports.UnhideAllTestsAction = exports.UnhideTestAction = exports.HideTestAction = void 0;
    const category = actionCommonCategories_1.Categories.Test;
    var ActionOrder;
    (function (ActionOrder) {
        // Navigation:
        ActionOrder[ActionOrder["Refresh"] = 10] = "Refresh";
        ActionOrder[ActionOrder["Run"] = 11] = "Run";
        ActionOrder[ActionOrder["Debug"] = 12] = "Debug";
        ActionOrder[ActionOrder["Coverage"] = 13] = "Coverage";
        ActionOrder[ActionOrder["RunContinuous"] = 14] = "RunContinuous";
        ActionOrder[ActionOrder["RunUsing"] = 15] = "RunUsing";
        // Submenu:
        ActionOrder[ActionOrder["Collapse"] = 16] = "Collapse";
        ActionOrder[ActionOrder["ClearResults"] = 17] = "ClearResults";
        ActionOrder[ActionOrder["DisplayMode"] = 18] = "DisplayMode";
        ActionOrder[ActionOrder["Sort"] = 19] = "Sort";
        ActionOrder[ActionOrder["GoToTest"] = 20] = "GoToTest";
        ActionOrder[ActionOrder["HideTest"] = 21] = "HideTest";
        ActionOrder[ActionOrder["ContinuousRunTest"] = 2147483647] = "ContinuousRunTest";
    })(ActionOrder || (ActionOrder = {}));
    const hasAnyTestProvider = contextkey_1.ContextKeyGreaterExpr.create(testingContextKeys_1.TestingContextKeys.providerCount.key, 0);
    const LABEL_RUN_TESTS = (0, nls_1.localize2)('runSelectedTests', "Run Tests");
    const LABEL_DEBUG_TESTS = (0, nls_1.localize2)('debugSelectedTests', "Debug Tests");
    const LABEL_COVERAGE_TESTS = (0, nls_1.localize2)('coverageSelectedTests', "Run Tests with Coverage");
    class HideTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.hideTest" /* TestCommandId.HideTestAction */,
                title: (0, nls_1.localize)('hideTest', 'Hide Test'),
                menu: {
                    id: actions_1.MenuId.TestItem,
                    group: 'builtin@2',
                    when: testingContextKeys_1.TestingContextKeys.testItemIsHidden.isEqualTo(false)
                },
            });
        }
        run(accessor, ...elements) {
            const service = accessor.get(testService_1.ITestService);
            for (const element of elements) {
                service.excluded.toggle(element.test, true);
            }
            return Promise.resolve();
        }
    }
    exports.HideTestAction = HideTestAction;
    class UnhideTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.unhideTest" /* TestCommandId.UnhideTestAction */,
                title: (0, nls_1.localize)('unhideTest', 'Unhide Test'),
                menu: {
                    id: actions_1.MenuId.TestItem,
                    order: 21 /* ActionOrder.HideTest */,
                    when: testingContextKeys_1.TestingContextKeys.testItemIsHidden.isEqualTo(true)
                },
            });
        }
        run(accessor, ...elements) {
            const service = accessor.get(testService_1.ITestService);
            for (const element of elements) {
                if (element instanceof index_1.TestItemTreeElement) {
                    service.excluded.toggle(element.test, false);
                }
            }
            return Promise.resolve();
        }
    }
    exports.UnhideTestAction = UnhideTestAction;
    class UnhideAllTestsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.unhideAllTests" /* TestCommandId.UnhideAllTestsAction */,
                title: (0, nls_1.localize)('unhideAllTests', 'Unhide All Tests'),
            });
        }
        run(accessor) {
            const service = accessor.get(testService_1.ITestService);
            service.excluded.clear();
            return Promise.resolve();
        }
    }
    exports.UnhideAllTestsAction = UnhideAllTestsAction;
    const testItemInlineAndInContext = (order, when) => [
        {
            id: actions_1.MenuId.TestItem,
            group: 'inline',
            order,
            when,
        }, {
            id: actions_1.MenuId.TestItem,
            group: 'builtin@1',
            order,
            when,
        }
    ];
    class RunVisibleAction extends viewPane_1.ViewAction {
        constructor(bitset, desc) {
            super({
                ...desc,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
            });
            this.bitset = bitset;
        }
        /**
         * @override
         */
        runInView(accessor, view, ...elements) {
            const { include, exclude } = view.getTreeIncludeExclude(elements.map(e => e.test));
            return accessor.get(testService_1.ITestService).runTests({
                tests: include,
                exclude,
                group: this.bitset,
            });
        }
    }
    class DebugAction extends RunVisibleAction {
        constructor() {
            super(4 /* TestRunProfileBitset.Debug */, {
                id: "testing.debug" /* TestCommandId.DebugAction */,
                title: (0, nls_1.localize)('debug test', 'Debug Test'),
                icon: icons.testingDebugIcon,
                menu: testItemInlineAndInContext(12 /* ActionOrder.Debug */, testingContextKeys_1.TestingContextKeys.hasDebuggableTests.isEqualTo(true)),
            });
        }
    }
    exports.DebugAction = DebugAction;
    class CoverageAction extends RunVisibleAction {
        constructor() {
            super(8 /* TestRunProfileBitset.Coverage */, {
                id: "testing.coverage" /* TestCommandId.RunWithCoverageAction */,
                title: (0, nls_1.localize)('run with cover test', 'Run Test with Coverage'),
                icon: icons.testingCoverageIcon,
                menu: testItemInlineAndInContext(13 /* ActionOrder.Coverage */, testingContextKeys_1.TestingContextKeys.hasCoverableTests.isEqualTo(true)),
            });
        }
    }
    exports.CoverageAction = CoverageAction;
    class RunUsingProfileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.runUsing" /* TestCommandId.RunUsingProfileAction */,
                title: (0, nls_1.localize)('testing.runUsing', 'Execute Using Profile...'),
                icon: icons.testingDebugIcon,
                menu: {
                    id: actions_1.MenuId.TestItem,
                    order: 15 /* ActionOrder.RunUsing */,
                    group: 'builtin@2',
                    when: testingContextKeys_1.TestingContextKeys.hasNonDefaultProfile.isEqualTo(true),
                },
            });
        }
        async run(acessor, ...elements) {
            const commandService = acessor.get(commands_1.ICommandService);
            const testService = acessor.get(testService_1.ITestService);
            const profile = await commandService.executeCommand('vscode.pickTestProfile', {
                onlyForTest: elements[0].test,
            });
            if (!profile) {
                return;
            }
            testService.runResolvedTests({
                targets: [{
                        profileGroup: profile.group,
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                        testIds: elements.filter(t => (0, testProfileService_1.canUseProfileWithTest)(profile, t.test)).map(t => t.test.item.extId)
                    }]
            });
        }
    }
    exports.RunUsingProfileAction = RunUsingProfileAction;
    class RunAction extends RunVisibleAction {
        constructor() {
            super(2 /* TestRunProfileBitset.Run */, {
                id: "testing.run" /* TestCommandId.RunAction */,
                title: (0, nls_1.localize)('run test', 'Run Test'),
                icon: icons.testingRunIcon,
                menu: testItemInlineAndInContext(11 /* ActionOrder.Run */, testingContextKeys_1.TestingContextKeys.hasRunnableTests.isEqualTo(true)),
            });
        }
    }
    exports.RunAction = RunAction;
    class SelectDefaultTestProfiles extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.selectDefaultTestProfiles" /* TestCommandId.SelectDefaultTestProfiles */,
                title: (0, nls_1.localize)('testing.selectDefaultTestProfiles', 'Select Default Profile'),
                icon: icons.testingUpdateProfiles,
                category,
            });
        }
        async run(acessor, onlyGroup) {
            const commands = acessor.get(commands_1.ICommandService);
            const testProfileService = acessor.get(testProfileService_1.ITestProfileService);
            const profiles = await commands.executeCommand('vscode.pickMultipleTestProfiles', {
                showConfigureButtons: false,
                selected: testProfileService.getGroupDefaultProfiles(onlyGroup),
                onlyGroup,
            });
            if (profiles?.length) {
                testProfileService.setGroupDefaultProfiles(onlyGroup, profiles);
            }
        }
    }
    exports.SelectDefaultTestProfiles = SelectDefaultTestProfiles;
    class ContinuousRunTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.toggleContinuousRunForTest" /* TestCommandId.ToggleContinousRunForTest */,
                title: (0, nls_1.localize)('testing.toggleContinuousRunOn', 'Turn on Continuous Run'),
                icon: icons.testingTurnContinuousRunOn,
                precondition: contextkey_1.ContextKeyExpr.or(testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isParentRunningContinuously.isEqualTo(false)),
                toggled: {
                    condition: testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(true),
                    icon: icons.testingContinuousIsOn,
                    title: (0, nls_1.localize)('testing.toggleContinuousRunOff', 'Turn off Continuous Run'),
                },
                menu: testItemInlineAndInContext(2147483647 /* ActionOrder.ContinuousRunTest */, testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true)),
            });
        }
        async run(accessor, ...elements) {
            const crService = accessor.get(testingContinuousRunService_1.ITestingContinuousRunService);
            for (const element of elements) {
                const id = element.test.item.extId;
                if (crService.isSpecificallyEnabledFor(id)) {
                    crService.stop(id);
                    continue;
                }
                crService.start(2 /* TestRunProfileBitset.Run */, id);
            }
        }
    }
    exports.ContinuousRunTestAction = ContinuousRunTestAction;
    class ContinuousRunUsingProfileTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.continuousRunUsingForTest" /* TestCommandId.ContinousRunUsingForTest */,
                title: (0, nls_1.localize)('testing.startContinuousRunUsing', 'Start Continous Run Using...'),
                icon: icons.testingDebugIcon,
                menu: [
                    {
                        id: actions_1.MenuId.TestItem,
                        order: 14 /* ActionOrder.RunContinuous */,
                        group: 'builtin@2',
                        when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(false))
                    }
                ],
            });
        }
        async run(accessor, ...elements) {
            const crService = accessor.get(testingContinuousRunService_1.ITestingContinuousRunService);
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            for (const element of elements) {
                const selected = await selectContinuousRunProfiles(crService, notificationService, quickInputService, [{ profiles: profileService.getControllerProfiles(element.test.controllerId) }]);
                if (selected.length) {
                    crService.start(selected, element.test.item.extId);
                }
            }
        }
    }
    exports.ContinuousRunUsingProfileTestAction = ContinuousRunUsingProfileTestAction;
    class ConfigureTestProfilesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.configureProfile" /* TestCommandId.ConfigureTestProfilesAction */,
                title: (0, nls_1.localize2)('testing.configureProfile', "Configure Test Profiles"),
                icon: icons.testingUpdateProfiles,
                f1: true,
                category,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasConfigurableProfile.isEqualTo(true),
                },
            });
        }
        async run(acessor, onlyGroup) {
            const commands = acessor.get(commands_1.ICommandService);
            const testProfileService = acessor.get(testProfileService_1.ITestProfileService);
            const profile = await commands.executeCommand('vscode.pickTestProfile', {
                placeholder: (0, nls_1.localize)('configureProfile', 'Select a profile to update'),
                showConfigureButtons: false,
                onlyConfigurable: true,
                onlyGroup,
            });
            if (profile) {
                testProfileService.configure(profile.controllerId, profile.profileId);
            }
        }
    }
    exports.ConfigureTestProfilesAction = ConfigureTestProfilesAction;
    const continuousMenus = (whenIsContinuousOn) => [
        {
            id: actions_1.MenuId.ViewTitle,
            group: 'navigation',
            order: 15 /* ActionOrder.RunUsing */,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isContinuousModeOn.isEqualTo(whenIsContinuousOn)),
        },
        {
            id: actions_1.MenuId.CommandPalette,
            when: testingContextKeys_1.TestingContextKeys.supportsContinuousRun.isEqualTo(true),
        },
    ];
    class StopContinuousRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.stopContinuousRun" /* TestCommandId.StopContinousRun */,
                title: (0, nls_1.localize2)('testing.stopContinuous', 'Stop Continuous Run'),
                category,
                icon: icons.testingTurnContinuousRunOff,
                menu: continuousMenus(true),
            });
        }
        run(accessor) {
            accessor.get(testingContinuousRunService_1.ITestingContinuousRunService).stop();
        }
    }
    function selectContinuousRunProfiles(crs, notificationService, quickInputService, profilesToPickFrom) {
        const items = [];
        for (const { controller, profiles } of profilesToPickFrom) {
            for (const profile of profiles) {
                if (profile.supportsContinuousRun) {
                    items.push({
                        label: profile.label || controller?.label.value || '',
                        description: controller?.label.value,
                        profile,
                    });
                }
            }
        }
        if (items.length === 0) {
            notificationService.info((0, nls_1.localize)('testing.noProfiles', 'No test continuous run-enabled profiles were found'));
            return Promise.resolve([]);
        }
        // special case: don't bother to quick a pickpick if there's only a single profile
        if (items.length === 1) {
            return Promise.resolve([items[0].profile]);
        }
        const qpItems = [];
        const selectedItems = [];
        const lastRun = crs.lastRunProfileIds;
        items.sort((a, b) => a.profile.group - b.profile.group
            || a.profile.controllerId.localeCompare(b.profile.controllerId)
            || a.label.localeCompare(b.label));
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (i === 0 || items[i - 1].profile.group !== item.profile.group) {
                qpItems.push({ type: 'separator', label: constants_1.testConfigurationGroupNames[item.profile.group] });
            }
            qpItems.push(item);
            if (lastRun.has(item.profile.profileId)) {
                selectedItems.push(item);
            }
        }
        const quickpick = quickInputService.createQuickPick();
        quickpick.title = (0, nls_1.localize)('testing.selectContinuousProfiles', 'Select profiles to run when files change:');
        quickpick.canSelectMany = true;
        quickpick.items = qpItems;
        quickpick.selectedItems = selectedItems;
        quickpick.show();
        return new Promise((resolve, reject) => {
            quickpick.onDidAccept(() => {
                resolve(quickpick.selectedItems.map(i => i.profile));
                quickpick.dispose();
            });
            quickpick.onDidHide(() => {
                resolve([]);
                quickpick.dispose();
            });
        });
    }
    class StartContinuousRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.startContinuousRun" /* TestCommandId.StartContinousRun */,
                title: (0, nls_1.localize2)('testing.startContinuous', "Start Continuous Run"),
                category,
                icon: icons.testingTurnContinuousRunOn,
                menu: continuousMenus(false),
            });
        }
        async run(accessor, ...args) {
            const crs = accessor.get(testingContinuousRunService_1.ITestingContinuousRunService);
            const selected = await selectContinuousRunProfiles(crs, accessor.get(notification_1.INotificationService), accessor.get(quickInput_1.IQuickInputService), accessor.get(testProfileService_1.ITestProfileService).all());
            if (selected.length) {
                crs.start(selected);
            }
        }
    }
    class ExecuteSelectedAction extends viewPane_1.ViewAction {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        order: group === 2 /* TestRunProfileBitset.Run */
                            ? 11 /* ActionOrder.Run */
                            : group === 4 /* TestRunProfileBitset.Debug */
                                ? 12 /* ActionOrder.Debug */
                                : 13 /* ActionOrder.Coverage */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.isRunning.isEqualTo(false), testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true))
                    }],
                category,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
            });
            this.group = group;
        }
        /**
         * @override
         */
        runInView(accessor, view) {
            const { include, exclude } = view.getTreeIncludeExclude();
            return accessor.get(testService_1.ITestService).runTests({ tests: include, exclude, group: this.group });
        }
    }
    class GetSelectedProfiles extends actions_1.Action2 {
        constructor() {
            super({ id: "testing.getSelectedProfiles" /* TestCommandId.GetSelectedProfiles */, title: (0, nls_1.localize)('getSelectedProfiles', 'Get Selected Profiles') });
        }
        /**
         * @override
         */
        run(accessor) {
            const profiles = accessor.get(testProfileService_1.ITestProfileService);
            return [
                ...profiles.getGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */),
                ...profiles.getGroupDefaultProfiles(4 /* TestRunProfileBitset.Debug */),
                ...profiles.getGroupDefaultProfiles(8 /* TestRunProfileBitset.Coverage */),
            ].map(p => ({
                controllerId: p.controllerId,
                label: p.label,
                kind: p.group & 8 /* TestRunProfileBitset.Coverage */
                    ? 3 /* ExtTestRunProfileKind.Coverage */
                    : p.group & 4 /* TestRunProfileBitset.Debug */
                        ? 2 /* ExtTestRunProfileKind.Debug */
                        : 1 /* ExtTestRunProfileKind.Run */,
            }));
        }
    }
    exports.GetSelectedProfiles = GetSelectedProfiles;
    class GetExplorerSelection extends viewPane_1.ViewAction {
        constructor() {
            super({ id: "_testing.getExplorerSelection" /* TestCommandId.GetExplorerSelection */, title: (0, nls_1.localize)('getExplorerSelection', 'Get Explorer Selection'), viewId: "workbench.view.testing" /* Testing.ExplorerViewId */ });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            const { include, exclude } = view.getTreeIncludeExclude(undefined, undefined, 'selected');
            const mapper = (i) => i.item.extId;
            return { include: include.map(mapper), exclude: exclude.map(mapper) };
        }
    }
    exports.GetExplorerSelection = GetExplorerSelection;
    class RunSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.runSelected" /* TestCommandId.RunSelectedAction */,
                title: LABEL_RUN_TESTS,
                icon: icons.testingRunAllIcon,
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunSelectedAction = RunSelectedAction;
    class DebugSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.debugSelected" /* TestCommandId.DebugSelectedAction */,
                title: LABEL_DEBUG_TESTS,
                icon: icons.testingDebugAllIcon,
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugSelectedAction = DebugSelectedAction;
    class CoverageSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.coverageSelected" /* TestCommandId.CoverageSelectedAction */,
                title: LABEL_COVERAGE_TESTS,
                icon: icons.testingCoverageAllIcon,
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    exports.CoverageSelectedAction = CoverageSelectedAction;
    const showDiscoveringWhile = (progress, task) => {
        return progress.withProgress({
            location: 10 /* ProgressLocation.Window */,
            title: (0, nls_1.localize)('discoveringTests', 'Discovering Tests'),
        }, () => task);
    };
    class RunOrDebugAllTestsAction extends actions_1.Action2 {
        constructor(options, group, noTestsFoundError) {
            super({
                ...options,
                category,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                    }]
            });
            this.group = group;
            this.noTestsFoundError = noTestsFoundError;
        }
        async run(accessor) {
            const testService = accessor.get(testService_1.ITestService);
            const notifications = accessor.get(notification_1.INotificationService);
            const roots = [...testService.collection.rootItems];
            if (!roots.length) {
                notifications.info(this.noTestsFoundError);
                return;
            }
            await testService.runTests({ tests: roots, group: this.group });
        }
    }
    class RunAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.runAll" /* TestCommandId.RunAllAction */,
                title: (0, nls_1.localize)('runAllTests', 'Run All Tests'),
                icon: icons.testingRunAllIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 31 /* KeyCode.KeyA */),
                },
            }, 2 /* TestRunProfileBitset.Run */, (0, nls_1.localize)('noTestProvider', 'No tests found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.RunAllAction = RunAllAction;
    class DebugAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.debugAll" /* TestCommandId.DebugAllAction */,
                title: (0, nls_1.localize)('debugAllTests', 'Debug All Tests'),
                icon: icons.testingDebugIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */),
                },
            }, 4 /* TestRunProfileBitset.Debug */, (0, nls_1.localize)('noDebugTestProvider', 'No debuggable tests found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.DebugAllAction = DebugAllAction;
    class CoverageAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.coverageAll" /* TestCommandId.RunAllWithCoverageAction */,
                title: (0, nls_1.localize)('runAllWithCoverage', 'Run All Tests with Coverage'),
                icon: icons.testingCoverageIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */),
                },
            }, 8 /* TestRunProfileBitset.Coverage */, (0, nls_1.localize)('noCoverageTestProvider', 'No tests with coverage runners found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.CoverageAllAction = CoverageAllAction;
    class CancelTestRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.cancelRun" /* TestCommandId.CancelTestRunAction */,
                title: (0, nls_1.localize2)('testing.cancelRun', 'Cancel Test Run'),
                icon: icons.testingCancelIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */),
                },
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 11 /* ActionOrder.Run */,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), contextkey_1.ContextKeyExpr.equals(testingContextKeys_1.TestingContextKeys.isRunning.serialize(), true))
                }
            });
        }
        /**
         * @override
         */
        async run(accessor) {
            const resultService = accessor.get(testResultService_1.ITestResultService);
            const testService = accessor.get(testService_1.ITestService);
            for (const run of resultService.results) {
                if (!run.completedAt) {
                    testService.cancelTestRun(run.id);
                }
            }
        }
    }
    exports.CancelTestRunAction = CancelTestRunAction;
    class TestingViewAsListAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.viewAsList" /* TestCommandId.TestingViewAsListAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.viewAsList', 'View as List'),
                toggled: testingContextKeys_1.TestingContextKeys.viewMode.isEqualTo("list" /* TestExplorerViewMode.List */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 18 /* ActionOrder.DisplayMode */,
                    group: 'viewAs',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewMode = "list" /* TestExplorerViewMode.List */;
        }
    }
    exports.TestingViewAsListAction = TestingViewAsListAction;
    class TestingViewAsTreeAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.viewAsTree" /* TestCommandId.TestingViewAsTreeAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.viewAsTree', 'View as Tree'),
                toggled: testingContextKeys_1.TestingContextKeys.viewMode.isEqualTo("true" /* TestExplorerViewMode.Tree */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 18 /* ActionOrder.DisplayMode */,
                    group: 'viewAs',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewMode = "true" /* TestExplorerViewMode.Tree */;
        }
    }
    exports.TestingViewAsTreeAction = TestingViewAsTreeAction;
    class TestingSortByStatusAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByStatus" /* TestCommandId.TestingSortByStatusAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.sortByStatus', 'Sort by Status'),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("status" /* TestExplorerViewSorting.ByStatus */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "status" /* TestExplorerViewSorting.ByStatus */;
        }
    }
    exports.TestingSortByStatusAction = TestingSortByStatusAction;
    class TestingSortByLocationAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByLocation" /* TestCommandId.TestingSortByLocationAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.sortByLocation', 'Sort by Location'),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("location" /* TestExplorerViewSorting.ByLocation */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "location" /* TestExplorerViewSorting.ByLocation */;
        }
    }
    exports.TestingSortByLocationAction = TestingSortByLocationAction;
    class TestingSortByDurationAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByDuration" /* TestCommandId.TestingSortByDurationAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.sortByDuration', 'Sort by Duration'),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("duration" /* TestExplorerViewSorting.ByDuration */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "duration" /* TestExplorerViewSorting.ByDuration */;
        }
    }
    exports.TestingSortByDurationAction = TestingSortByDurationAction;
    class ShowMostRecentOutputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.showMostRecentOutput" /* TestCommandId.ShowMostRecentOutputAction */,
                title: (0, nls_1.localize2)('testing.showMostRecentOutput', 'Show Output'),
                category,
                icon: codicons_1.Codicon.terminal,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */),
                },
                precondition: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        order: 16 /* ActionOrder.Collapse */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */),
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true)
                    }]
            });
        }
        async run(accessor) {
            const viewService = accessor.get(viewsService_1.IViewsService);
            const testView = await viewService.openView("workbench.panel.testResults.view" /* Testing.ResultsViewId */, true);
            testView?.showLatestRun();
        }
    }
    exports.ShowMostRecentOutputAction = ShowMostRecentOutputAction;
    class CollapseAllAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.collapseAll" /* TestCommandId.CollapseAllAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize2)('testing.collapseAll', 'Collapse All Tests'),
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 16 /* ActionOrder.Collapse */,
                    group: 'displayAction',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.collapseAll();
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
    class ClearTestResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.clearTestResults" /* TestCommandId.ClearTestResultsAction */,
                title: (0, nls_1.localize2)('testing.clearResults', 'Clear All Results'),
                category,
                icon: codicons_1.Codicon.clearAll,
                menu: [{
                        id: actions_1.MenuId.TestPeekTitle,
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        order: 17 /* ActionOrder.ClearResults */,
                        group: 'displayAction',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        order: 17 /* ActionOrder.ClearResults */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.panel.testResults.view" /* Testing.ResultsViewId */)
                    }],
            });
        }
        /**
         * @override
         */
        run(accessor) {
            accessor.get(testResultService_1.ITestResultService).clear();
        }
    }
    exports.ClearTestResultsAction = ClearTestResultsAction;
    class GoToTest extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.editFocusedTest" /* TestCommandId.GoToTest */,
                title: (0, nls_1.localize2)('testing.editFocusedTest', 'Go to Test'),
                icon: codicons_1.Codicon.goToFile,
                menu: testItemInlineAndInContext(20 /* ActionOrder.GoToTest */, testingContextKeys_1.TestingContextKeys.testItemHasUri.isEqualTo(true)),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
                    when: contextkeys_1.FocusedViewContext.isEqualTo("workbench.view.testing" /* Testing.ExplorerViewId */),
                    primary: 3 /* KeyCode.Enter */ | 512 /* KeyMod.Alt */,
                },
            });
        }
        async run(accessor, element, preserveFocus) {
            if (!element) {
                const view = accessor.get(viewsService_1.IViewsService).getActiveViewWithId("workbench.view.testing" /* Testing.ExplorerViewId */);
                element = view?.focusedTreeElements[0];
            }
            if (element && element instanceof index_1.TestItemTreeElement) {
                accessor.get(commands_1.ICommandService).executeCommand('vscode.revealTest', element.test.item.extId, preserveFocus);
            }
        }
    }
    exports.GoToTest = GoToTest;
    class ExecuteTestAtCursor extends actions_1.Action2 {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: hasAnyTestProvider,
                    }, {
                        id: actions_1.MenuId.EditorContext,
                        group: 'testing',
                        order: group === 2 /* TestRunProfileBitset.Run */ ? 11 /* ActionOrder.Run */ : 12 /* ActionOrder.Debug */,
                        when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.activeEditorHasTests, testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group]),
                    }]
            });
            this.group = group;
        }
        /**
         * @override
         */
        async run(accessor) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            let editor = codeEditorService.getActiveCodeEditor();
            if (!activeEditorPane || !editor) {
                return;
            }
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                editor = editor.getParentEditor();
            }
            const position = editor?.getPosition();
            const model = editor?.getModel();
            if (!position || !model || !('uri' in model)) {
                return;
            }
            const testService = accessor.get(testService_1.ITestService);
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            const progressService = accessor.get(progress_1.IProgressService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            let bestNodes = [];
            let bestRange;
            let bestNodesBefore = [];
            let bestRangeBefore;
            const saveBeforeTest = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */);
            if (saveBeforeTest) {
                await editorService.save({ editor: activeEditorPane.input, groupId: activeEditorPane.group.id });
                await testService.syncTests();
            }
            // testsInFile will descend in the test tree. We assume that as we go
            // deeper, ranges get more specific. We'll want to run all tests whose
            // range is equal to the most specific range we find (see #133519)
            //
            // If we don't find any test whose range contains the position, we pick
            // the closest one before the position. Again, if we find several tests
            // whose range is equal to the closest one, we run them all.
            await showDiscoveringWhile(progressService, (async () => {
                for await (const test of (0, testService_1.testsInFile)(testService, uriIdentityService, model.uri)) {
                    if (!test.item.range || !(profileService.capabilitiesForTest(test) & this.group)) {
                        continue;
                    }
                    const irange = range_1.Range.lift(test.item.range);
                    if (irange.containsPosition(position)) {
                        if (bestRange && range_1.Range.equalsRange(test.item.range, bestRange)) {
                            // check that a parent isn't already included (#180760)
                            if (!bestNodes.some(b => testId_1.TestId.isChild(b.item.extId, test.item.extId))) {
                                bestNodes.push(test);
                            }
                        }
                        else {
                            bestRange = irange;
                            bestNodes = [test];
                        }
                    }
                    else if (position_1.Position.isBefore(irange.getStartPosition(), position)) {
                        if (!bestRangeBefore || bestRangeBefore.getStartPosition().isBefore(irange.getStartPosition())) {
                            bestRangeBefore = irange;
                            bestNodesBefore = [test];
                        }
                        else if (irange.equalsRange(bestRangeBefore) && !bestNodesBefore.some(b => testId_1.TestId.isChild(b.item.extId, test.item.extId))) {
                            bestNodesBefore.push(test);
                        }
                    }
                }
            })());
            const testsToRun = bestNodes.length ? bestNodes : bestNodesBefore;
            if (testsToRun.length) {
                await testService.runTests({
                    group: this.group,
                    tests: bestNodes.length ? bestNodes : bestNodesBefore,
                });
            }
            else if (editor) {
                messageController_1.MessageController.get(editor)?.showMessage((0, nls_1.localize)('noTestsAtCursor', "No tests found here"), position);
            }
        }
    }
    class RunAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.runAtCursor" /* TestCommandId.RunAtCursor */,
                title: (0, nls_1.localize2)('testing.runAtCursor', 'Run Test at Cursor'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 33 /* KeyCode.KeyC */),
                },
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunAtCursor = RunAtCursor;
    class DebugAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.debugAtCursor" /* TestCommandId.DebugAtCursor */,
                title: (0, nls_1.localize2)('testing.debugAtCursor', 'Debug Test at Cursor'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                },
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugAtCursor = DebugAtCursor;
    class CoverageAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.coverageAtCursor" /* TestCommandId.CoverageAtCursor */,
                title: (0, nls_1.localize2)('testing.coverageAtCursor', 'Run Test at Cursor with Coverage'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */),
                },
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    exports.CoverageAtCursor = CoverageAtCursor;
    class ExecuteTestsUnderUriAction extends actions_1.Action2 {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.ExplorerContext,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                        group: '6.5_testing',
                        order: (group === 2 /* TestRunProfileBitset.Run */ ? 11 /* ActionOrder.Run */ : 12 /* ActionOrder.Debug */) + 0.1,
                    }],
            });
            this.group = group;
        }
        async run(accessor, uri) {
            const testService = accessor.get(testService_1.ITestService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const tests = await iterator_1.Iterable.asyncToArray((0, testService_1.testsUnderUri)(testService, accessor.get(uriIdentity_1.IUriIdentityService), uri));
            if (!tests.length) {
                notificationService.notify({ message: (0, nls_1.localize)('noTests', 'No tests found in the selected file or folder'), severity: notification_1.Severity.Info });
                return;
            }
            return testService.runTests({ tests, group: this.group });
        }
    }
    class RunTestsUnderUri extends ExecuteTestsUnderUriAction {
        constructor() {
            super({
                id: "testing.run.uri" /* TestCommandId.RunByUri */,
                title: LABEL_RUN_TESTS,
                category,
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    class DebugTestsUnderUri extends ExecuteTestsUnderUriAction {
        constructor() {
            super({
                id: "testing.debug.uri" /* TestCommandId.DebugByUri */,
                title: LABEL_DEBUG_TESTS,
                category,
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    class CoverageTestsUnderUri extends ExecuteTestsUnderUriAction {
        constructor() {
            super({
                id: "testing.coverage.uri" /* TestCommandId.CoverageByUri */,
                title: LABEL_COVERAGE_TESTS,
                category,
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    class ExecuteTestsInCurrentFile extends actions_1.Action2 {
        constructor(options, group) {
            super({
                ...options,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                    }, {
                        id: actions_1.MenuId.EditorContext,
                        group: 'testing',
                        // add 0.1 to be after the "at cursor" commands
                        order: (group === 2 /* TestRunProfileBitset.Run */ ? 11 /* ActionOrder.Run */ : 12 /* ActionOrder.Debug */) + 0.1,
                        when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.activeEditorHasTests, testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group]),
                    }],
            });
            this.group = group;
        }
        /**
         * @override
         */
        run(accessor) {
            let editor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor();
            if (!editor) {
                return;
            }
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                editor = editor.getParentEditor();
            }
            const position = editor?.getPosition();
            const model = editor?.getModel();
            if (!position || !model || !('uri' in model)) {
                return;
            }
            const testService = accessor.get(testService_1.ITestService);
            const demandedUri = model.uri.toString();
            // Iterate through the entire collection and run any tests that are in the
            // uri. See #138007.
            const queue = [testService.collection.rootIds];
            const discovered = [];
            while (queue.length) {
                for (const id of queue.pop()) {
                    const node = testService.collection.getNodeById(id);
                    if (node.item.uri?.toString() === demandedUri) {
                        discovered.push(node);
                    }
                    else {
                        queue.push(node.children);
                    }
                }
            }
            if (discovered.length) {
                return testService.runTests({
                    tests: discovered,
                    group: this.group,
                });
            }
            if (editor) {
                messageController_1.MessageController.get(editor)?.showMessage((0, nls_1.localize)('noTestsInFile', "No tests found in this file"), position);
            }
            return undefined;
        }
    }
    class RunCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.runCurrentFile" /* TestCommandId.RunCurrentFile */,
                title: (0, nls_1.localize2)('testing.runCurrentFile', 'Run Tests in Current File'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 36 /* KeyCode.KeyF */),
                },
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunCurrentFile = RunCurrentFile;
    class DebugCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.debugCurrentFile" /* TestCommandId.DebugCurrentFile */,
                title: (0, nls_1.localize2)('testing.debugCurrentFile', 'Debug Tests in Current File'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */),
                },
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugCurrentFile = DebugCurrentFile;
    class CoverageCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.coverageCurrentFile" /* TestCommandId.CoverageCurrentFile */,
                title: (0, nls_1.localize2)('testing.coverageCurrentFile', 'Run Tests with Coverage in Current File'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */),
                },
            }, 8 /* TestRunProfileBitset.Coverage */);
        }
    }
    exports.CoverageCurrentFile = CoverageCurrentFile;
    const discoverAndRunTests = async (collection, progress, ids, runTests) => {
        const todo = Promise.all(ids.map(p => (0, testService_1.expandAndGetTestById)(collection, p)));
        const tests = (await showDiscoveringWhile(progress, todo)).filter(types_1.isDefined);
        return tests.length ? await runTests(tests) : undefined;
    };
    exports.discoverAndRunTests = discoverAndRunTests;
    class RunOrDebugExtsByPath extends actions_1.Action2 {
        /**
         * @override
         */
        async run(accessor, ...args) {
            const testService = accessor.get(testService_1.ITestService);
            await (0, exports.discoverAndRunTests)(accessor.get(testService_1.ITestService).collection, accessor.get(progress_1.IProgressService), [...this.getTestExtIdsToRun(accessor, ...args)], tests => this.runTest(testService, tests));
        }
    }
    class RunOrDebugFailedTests extends RunOrDebugExtsByPath {
        constructor(options) {
            super({
                ...options,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: hasAnyTestProvider,
                },
            });
        }
        /**
         * @inheritdoc
         */
        getTestExtIdsToRun(accessor) {
            const { results } = accessor.get(testResultService_1.ITestResultService);
            const ids = new Set();
            for (let i = results.length - 1; i >= 0; i--) {
                const resultSet = results[i];
                for (const test of resultSet.tests) {
                    if ((0, testingStates_1.isFailedState)(test.ownComputedState)) {
                        ids.add(test.item.extId);
                    }
                    else {
                        ids.delete(test.item.extId);
                    }
                }
            }
            return ids;
        }
    }
    class RunOrDebugLastRun extends RunOrDebugExtsByPath {
        constructor(options) {
            super({
                ...options,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(hasAnyTestProvider, testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true)),
                },
            });
        }
        /**
         * @inheritdoc
         */
        *getTestExtIdsToRun(accessor, runId) {
            const resultService = accessor.get(testResultService_1.ITestResultService);
            const lastResult = runId ? resultService.results.find(r => r.id === runId) : resultService.results[0];
            if (!lastResult) {
                return;
            }
            for (const test of lastResult.request.targets) {
                for (const testId of test.testIds) {
                    yield testId;
                }
            }
        }
    }
    class ReRunFailedTests extends RunOrDebugFailedTests {
        constructor() {
            super({
                id: "testing.reRunFailTests" /* TestCommandId.ReRunFailedTests */,
                title: (0, nls_1.localize2)('testing.reRunFailTests', 'Rerun Failed Tests'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 35 /* KeyCode.KeyE */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 2 /* TestRunProfileBitset.Run */,
                tests: internalTests,
            });
        }
    }
    exports.ReRunFailedTests = ReRunFailedTests;
    class DebugFailedTests extends RunOrDebugFailedTests {
        constructor() {
            super({
                id: "testing.debugFailTests" /* TestCommandId.DebugFailedTests */,
                title: (0, nls_1.localize2)('testing.debugFailTests', 'Debug Failed Tests'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 4 /* TestRunProfileBitset.Debug */,
                tests: internalTests,
            });
        }
    }
    exports.DebugFailedTests = DebugFailedTests;
    class ReRunLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.reRunLastRun" /* TestCommandId.ReRunLastRun */,
                title: (0, nls_1.localize2)('testing.reRunLastRun', 'Rerun Last Run'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 2 /* TestRunProfileBitset.Run */,
                tests: internalTests,
            });
        }
    }
    exports.ReRunLastRun = ReRunLastRun;
    class DebugLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.debugLastRun" /* TestCommandId.DebugLastRun */,
                title: (0, nls_1.localize2)('testing.debugLastRun', 'Debug Last Run'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 4 /* TestRunProfileBitset.Debug */,
                tests: internalTests,
            });
        }
    }
    exports.DebugLastRun = DebugLastRun;
    class CoverageLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.coverageLastRun" /* TestCommandId.CoverageLastRun */,
                title: (0, nls_1.localize2)('testing.coverageLastRun', 'Rerun Last Run with Coverage'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 8 /* TestRunProfileBitset.Coverage */,
                tests: internalTests,
            });
        }
    }
    exports.CoverageLastRun = CoverageLastRun;
    class SearchForTestExtension extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.searchForTestExtension" /* TestCommandId.SearchForTestExtension */,
                title: (0, nls_1.localize2)('testing.searchForTestExtension', 'Search for Test Extension'),
            });
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = (await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))?.getViewPaneContainer();
            viewlet.search('@category:"testing"');
            viewlet.focus();
        }
    }
    exports.SearchForTestExtension = SearchForTestExtension;
    class OpenOutputPeek extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.openOutputPeek" /* TestCommandId.OpenOutputPeek */,
                title: (0, nls_1.localize2)('testing.openOutputPeek', 'Peek Output'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */),
                },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                },
            });
        }
        async run(accessor) {
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).open();
        }
    }
    exports.OpenOutputPeek = OpenOutputPeek;
    class ToggleInlineTestOutput extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.toggleInlineTestOutput" /* TestCommandId.ToggleInlineTestOutput */,
                title: (0, nls_1.localize2)('testing.toggleInlineTestOutput', 'Toggle Inline Test Output'),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                },
            });
        }
        async run(accessor) {
            const testService = accessor.get(testService_1.ITestService);
            testService.showInlineOutput.value = !testService.showInlineOutput.value;
        }
    }
    exports.ToggleInlineTestOutput = ToggleInlineTestOutput;
    const refreshMenus = (whenIsRefreshing) => [
        {
            id: actions_1.MenuId.TestItem,
            group: 'inline',
            order: 10 /* ActionOrder.Refresh */,
            when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isRefreshingTests.isEqualTo(whenIsRefreshing)),
        },
        {
            id: actions_1.MenuId.ViewTitle,
            group: 'navigation',
            order: 10 /* ActionOrder.Refresh */,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isRefreshingTests.isEqualTo(whenIsRefreshing)),
        },
        {
            id: actions_1.MenuId.CommandPalette,
            when: testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true),
        },
    ];
    class RefreshTestsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.refreshTests" /* TestCommandId.RefreshTestsAction */,
                title: (0, nls_1.localize2)('testing.refreshTests', 'Refresh Tests'),
                category,
                icon: icons.testingRefreshTests,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */),
                    when: testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true),
                },
                menu: refreshMenus(false),
            });
        }
        async run(accessor, ...elements) {
            const testService = accessor.get(testService_1.ITestService);
            const progressService = accessor.get(progress_1.IProgressService);
            const controllerIds = (0, arrays_1.distinct)(elements.filter(types_1.isDefined).map(e => e.test.controllerId));
            return progressService.withProgress({ location: "workbench.view.extension.test" /* Testing.ViewletId */ }, async () => {
                if (controllerIds.length) {
                    await Promise.all(controllerIds.map(id => testService.refreshTests(id)));
                }
                else {
                    await testService.refreshTests();
                }
            });
        }
    }
    exports.RefreshTestsAction = RefreshTestsAction;
    class CancelTestRefreshAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.cancelTestRefresh" /* TestCommandId.CancelTestRefreshAction */,
                title: (0, nls_1.localize2)('testing.cancelTestRefresh', 'Cancel Test Refresh'),
                category,
                icon: icons.testingCancelRefreshTests,
                menu: refreshMenus(true),
            });
        }
        async run(accessor) {
            accessor.get(testService_1.ITestService).cancelRefreshTests();
        }
    }
    exports.CancelTestRefreshAction = CancelTestRefreshAction;
    class CleareCoverage extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.coverage.close" /* TestCommandId.CoverageClear */,
                title: (0, nls_1.localize2)('testing.clearCoverage', 'Clear Coverage'),
                icon: iconRegistry_1.widgetClose,
                category,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 10 /* ActionOrder.Refresh */,
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testCoverage" /* Testing.CoverageViewId */)
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.isTestCoverageOpen.isEqualTo(true),
                    }]
            });
        }
        run(accessor) {
            accessor.get(testCoverageService_1.ITestCoverageService).closeCoverage();
        }
    }
    exports.CleareCoverage = CleareCoverage;
    class OpenCoverage extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.openCoverage" /* TestCommandId.OpenCoverage */,
                title: (0, nls_1.localize2)('testing.openCoverage', 'Open Coverage'),
                category,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                    }]
            });
        }
        run(accessor) {
            const results = accessor.get(testResultService_1.ITestResultService).results;
            const task = results.length && results[0].tasks.find(r => r.coverage);
            if (!task) {
                const notificationService = accessor.get(notification_1.INotificationService);
                notificationService.info((0, nls_1.localize)('testing.noCoverage', 'No coverage information available on the last test run.'));
                return;
            }
            accessor.get(testCoverageService_1.ITestCoverageService).openCoverage(task, true);
        }
    }
    exports.OpenCoverage = OpenCoverage;
    exports.allTestActions = [
        CancelTestRefreshAction,
        CancelTestRunAction,
        ClearTestResultsAction,
        CleareCoverage,
        CollapseAllAction,
        ConfigureTestProfilesAction,
        ContinuousRunTestAction,
        ContinuousRunUsingProfileTestAction,
        CoverageAction,
        CoverageAllAction,
        CoverageAtCursor,
        CoverageCurrentFile,
        CoverageLastRun,
        CoverageSelectedAction,
        CoverageTestsUnderUri,
        DebugAction,
        DebugAllAction,
        DebugAtCursor,
        DebugCurrentFile,
        DebugFailedTests,
        DebugLastRun,
        DebugSelectedAction,
        DebugTestsUnderUri,
        GetExplorerSelection,
        GetSelectedProfiles,
        GoToTest,
        HideTestAction,
        OpenCoverage,
        OpenOutputPeek,
        RefreshTestsAction,
        ReRunFailedTests,
        ReRunLastRun,
        RunAction,
        RunAllAction,
        RunAtCursor,
        RunCurrentFile,
        RunSelectedAction,
        RunTestsUnderUri,
        RunUsingProfileAction,
        SearchForTestExtension,
        SelectDefaultTestProfiles,
        ShowMostRecentOutputAction,
        StartContinuousRunAction,
        StopContinuousRunAction,
        TestingSortByDurationAction,
        TestingSortByLocationAction,
        TestingSortByStatusAction,
        TestingViewAsListAction,
        TestingViewAsTreeAction,
        ToggleInlineTestOutput,
        UnhideAllTestsAction,
        UnhideTestAction,
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4cGxvcmVyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9icm93c2VyL3Rlc3RFeHBsb3JlckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0RoRyxNQUFNLFFBQVEsR0FBRyxtQ0FBVSxDQUFDLElBQUksQ0FBQztJQUVqQyxJQUFXLFdBaUJWO0lBakJELFdBQVcsV0FBVztRQUNyQixjQUFjO1FBQ2Qsb0RBQVksQ0FBQTtRQUNaLDRDQUFHLENBQUE7UUFDSCxnREFBSyxDQUFBO1FBQ0wsc0RBQVEsQ0FBQTtRQUNSLGdFQUFhLENBQUE7UUFDYixzREFBUSxDQUFBO1FBRVIsV0FBVztRQUNYLHNEQUFRLENBQUE7UUFDUiw4REFBWSxDQUFBO1FBQ1osNERBQVcsQ0FBQTtRQUNYLDhDQUFJLENBQUE7UUFDSixzREFBUSxDQUFBO1FBQ1Isc0RBQVEsQ0FBQTtRQUNSLGdGQUE0QixDQUFBO0lBQzdCLENBQUMsRUFqQlUsV0FBVyxLQUFYLFdBQVcsUUFpQnJCO0lBRUQsTUFBTSxrQkFBa0IsR0FBRyxrQ0FBcUIsQ0FBQyxNQUFNLENBQUMsdUNBQWtCLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVqRyxNQUFNLGVBQWUsR0FBRyxJQUFBLGVBQVMsRUFBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNuRSxNQUFNLGlCQUFpQixHQUFHLElBQUEsZUFBUyxFQUFDLG9CQUFvQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3pFLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxlQUFTLEVBQUMsdUJBQXVCLEVBQUUseUJBQXlCLENBQUMsQ0FBQztJQUUzRixNQUFhLGNBQWUsU0FBUSxpQkFBTztRQUMxQztZQUND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