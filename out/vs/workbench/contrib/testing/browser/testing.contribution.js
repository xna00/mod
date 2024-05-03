/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/fileConstants", "vs/workbench/contrib/testing/browser/codeCoverageDecorations", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testCoverageBars", "vs/workbench/contrib/testing/browser/testCoverageView", "vs/workbench/contrib/testing/browser/testingDecorations", "vs/workbench/contrib/testing/browser/testingExplorerView", "vs/workbench/contrib/testing/browser/testingOutputPeek", "vs/workbench/contrib/testing/browser/testingProgressUiService", "vs/workbench/contrib/testing/browser/testingViewPaneContainer", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testResultStorage", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testServiceImpl", "vs/workbench/contrib/testing/common/testingContentProvider", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingContinuousRunService", "vs/workbench/contrib/testing/common/testingDecorations", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/services/views/common/viewsService", "./testExplorerActions", "./testingConfigurationUi"], function (require, exports, editorExtensions_1, nls_1, actions_1, commands_1, configurationRegistry_1, contextkey_1, files_1, descriptors_1, extensions_1, opener_1, progress_1, platform_1, viewPaneContainer_1, contributions_1, views_1, fileConstants_1, codeCoverageDecorations_1, icons_1, testCoverageBars_1, testCoverageView_1, testingDecorations_1, testingExplorerView_1, testingOutputPeek_1, testingProgressUiService_1, testingViewPaneContainer_1, configuration_1, testCoverageService_1, testExplorerFilterState_1, testId_1, testProfileService_1, testResultService_1, testResultStorage_1, testService_1, testServiceImpl_1, testingContentProvider_1, testingContextKeys_1, testingContinuousRunService_1, testingDecorations_2, testingPeekOpener_1, viewsService_1, testExplorerActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(testService_1.ITestService, testServiceImpl_1.TestService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testResultStorage_1.ITestResultStorage, testResultStorage_1.TestResultStorage, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testProfileService_1.ITestProfileService, testProfileService_1.TestProfileService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testCoverageService_1.ITestCoverageService, testCoverageService_1.TestCoverageService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testingContinuousRunService_1.ITestingContinuousRunService, testingContinuousRunService_1.TestingContinuousRunService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testResultService_1.ITestResultService, testResultService_1.TestResultService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testExplorerFilterState_1.ITestExplorerFilterState, testExplorerFilterState_1.TestExplorerFilterState, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testingPeekOpener_1.ITestingPeekOpener, testingOutputPeek_1.TestingPeekOpener, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(testingDecorations_2.ITestingDecorationsService, testingDecorations_1.TestingDecorationService, 1 /* InstantiationType.Delayed */);
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: "workbench.view.extension.test" /* Testing.ViewletId */,
        title: (0, nls_1.localize2)('test', 'Testing'),
        ctorDescriptor: new descriptors_1.SyncDescriptor(testingViewPaneContainer_1.TestingViewPaneContainer),
        icon: icons_1.testingViewIcon,
        alwaysUseContainerInfo: true,
        order: 6,
        openCommandActionDescriptor: {
            id: "workbench.view.extension.test" /* Testing.ViewletId */,
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewTesting', comment: ['&& denotes a mnemonic'] }, "T&&esting"),
            // todo: coordinate with joh whether this is available
            // keybindings: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.US_SEMICOLON },
            order: 4,
        },
        hideIfEmpty: true,
    }, 0 /* ViewContainerLocation.Sidebar */);
    const testResultsViewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: "workbench.panel.testResults" /* Testing.ResultsPanelId */,
        title: (0, nls_1.localize2)('testResultsPanelName', "Test Results"),
        icon: icons_1.testingResultsIcon,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, ["workbench.panel.testResults" /* Testing.ResultsPanelId */, { mergeViewWithContainerWhenSingleView: true }]),
        hideIfEmpty: true,
        order: 3,
    }, 1 /* ViewContainerLocation.Panel */, { doNotRegisterOpenCommand: true });
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViews([{
            id: "workbench.panel.testResults.view" /* Testing.ResultsViewId */,
            name: (0, nls_1.localize2)('testResultsPanelName', "Test Results"),
            containerIcon: icons_1.testingResultsIcon,
            canToggleVisibility: false,
            canMoveView: true,
            when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testingOutputPeek_1.TestResultsView),
        }], testResultsViewContainer);
    viewsRegistry.registerViewWelcomeContent("workbench.view.testing" /* Testing.ExplorerViewId */, {
        content: (0, nls_1.localize)('noTestProvidersRegistered', "No tests have been found in this workspace yet."),
    });
    viewsRegistry.registerViewWelcomeContent("workbench.view.testing" /* Testing.ExplorerViewId */, {
        content: '[' + (0, nls_1.localize)('searchForAdditionalTestExtensions', "Install Additional Test Extensions...") + `](command:${"testing.searchForTestExtension" /* TestCommandId.SearchForTestExtension */})`,
        order: 10
    });
    viewsRegistry.registerViews([{
            id: "workbench.view.testing" /* Testing.ExplorerViewId */,
            name: (0, nls_1.localize2)('testExplorer', "Test Explorer"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testingExplorerView_1.TestingExplorerView),
            canToggleVisibility: true,
            canMoveView: true,
            weight: 80,
            order: -999,
            containerIcon: icons_1.testingViewIcon,
            when: contextkey_1.ContextKeyExpr.greater(testingContextKeys_1.TestingContextKeys.providerCount.key, 0),
        }, {
            id: "workbench.view.testCoverage" /* Testing.CoverageViewId */,
            name: (0, nls_1.localize2)('testCoverage', "Test Coverage"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testCoverageView_1.TestCoverageView),
            canToggleVisibility: true,
            canMoveView: true,
            weight: 80,
            order: -998,
            containerIcon: icons_1.testingViewIcon,
            when: testingContextKeys_1.TestingContextKeys.isTestCoverageOpen,
        }], viewContainer);
    testExplorerActions_1.allTestActions.forEach(actions_1.registerAction2);
    (0, actions_1.registerAction2)(testingOutputPeek_1.OpenMessageInEditorAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.GoToPreviousMessageAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.GoToNextMessageAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.CloseTestPeek);
    (0, actions_1.registerAction2)(testingOutputPeek_1.ToggleTestingPeekHistory);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingContentProvider_1.TestingContentProvider, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingOutputPeek_1.TestingPeekOpener, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingProgressUiService_1.TestingProgressTrigger, 4 /* LifecyclePhase.Eventually */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */, testingOutputPeek_1.TestingOutputPeekController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.testingDecorations" /* Testing.DecorationsContributionId */, testingDecorations_1.TestingDecorations, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.coverageDecorations" /* Testing.CoverageDecorationsContributionId */, codeCoverageDecorations_1.CodeCoverageDecorations, 3 /* EditorContributionInstantiation.Eventually */);
    commands_1.CommandsRegistry.registerCommand({
        id: '_revealTestInExplorer',
        handler: async (accessor, testId, focus) => {
            accessor.get(testExplorerFilterState_1.ITestExplorerFilterState).reveal.value = typeof testId === 'string' ? testId : testId.extId;
            accessor.get(viewsService_1.IViewsService).openView("workbench.view.testing" /* Testing.ExplorerViewId */, focus);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.peekTestError',
        handler: async (accessor, extId) => {
            const lookup = accessor.get(testResultService_1.ITestResultService).getStateById(extId);
            if (!lookup) {
                return false;
            }
            const [result, ownState] = lookup;
            const opener = accessor.get(testingPeekOpener_1.ITestingPeekOpener);
            if (opener.tryPeekFirstError(result, ownState)) { // fast path
                return true;
            }
            for (const test of result.tests) {
                if (testId_1.TestId.compare(ownState.item.extId, test.item.extId) === 2 /* TestPosition.IsChild */ && opener.tryPeekFirstError(result, test)) {
                    return true;
                }
            }
            return false;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.revealTest',
        handler: async (accessor, extId) => {
            const test = accessor.get(testService_1.ITestService).collection.getNodeById(extId);
            if (!test) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const fileService = accessor.get(files_1.IFileService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const { range, uri } = test.item;
            if (!uri) {
                return;
            }
            // If an editor has the file open, there are decorations. Try to adjust the
            // revealed range to those decorations (#133441).
            const position = accessor.get(testingDecorations_2.ITestingDecorationsService).getDecoratedTestPosition(uri, extId) || range?.getStartPosition();
            accessor.get(testExplorerFilterState_1.ITestExplorerFilterState).reveal.value = extId;
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).closeAllPeeks();
            let isFile = true;
            try {
                if (!(await fileService.stat(uri)).isFile) {
                    isFile = false;
                }
            }
            catch {
                // ignored
            }
            if (!isFile) {
                await commandService.executeCommand(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, uri);
                return;
            }
            await openerService.open(position
                ? uri.with({ fragment: `L${position.lineNumber}:${position.column}` })
                : uri);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.runTestsById',
        handler: async (accessor, group, ...testIds) => {
            const testService = accessor.get(testService_1.ITestService);
            await (0, testExplorerActions_1.discoverAndRunTests)(accessor.get(testService_1.ITestService).collection, accessor.get(progress_1.IProgressService), testIds, tests => testService.runTests({ group, tests }));
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(configuration_1.testingConfiguration);
    platform_1.Registry.as("workbench.registry.explorer.fileContributions" /* ExplorerExtensions.FileContributionRegistry */).register({
        create(insta, container) {
            return insta.createInstance(testCoverageBars_1.ExplorerTestCoverageBars, { compact: true, container });
        },
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90ZXN0aW5nLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtEaEcsSUFBQSw4QkFBaUIsRUFBQywwQkFBWSxFQUFFLDZCQUFXLG9DQUE0QixDQUFDO0lBQ3hFLElBQUEsOEJBQWlCLEVBQUMsc0NBQWtCLEVBQUUscUNBQWlCLG9DQUE0QixDQUFDO0lBQ3BGLElBQUEsOEJBQWlCLEVBQUMsd0NBQW1CLEVBQUUsdUNBQWtCLG9DQUE0QixDQUFDO0lBQ3RGLElBQUEsOEJBQWlCLEVBQUMsMENBQW9CLEVBQUUseUNBQW1CLG9DQUE0QixDQUFDO0lBQ3hGLElBQUEsOEJBQWlCLEVBQUMsMERBQTRCLEVBQUUseURBQTJCLG9DQUE0QixDQUFDO0lBQ3hHLElBQUEsOEJBQWlCLEVBQUMsc0NBQWtCLEVBQUUscUNBQWlCLG9DQUE0QixDQUFDO0lBQ3BGLElBQUEsOEJBQWlCLEVBQUMsa0RBQXdCLEVBQUUsaURBQXVCLG9DQUE0QixDQUFDO0lBQ2hHLElBQUEsOEJBQWlCLEVBQUMsc0NBQWtCLEVBQUUscUNBQWlCLG9DQUE0QixDQUFDO0lBQ3BGLElBQUEsOEJBQWlCLEVBQUMsK0NBQTBCLEVBQUUsNkNBQXdCLG9DQUE0QixDQUFDO0lBRW5HLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUEwQixrQkFBdUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO1FBQ2hJLEVBQUUseURBQW1CO1FBQ3JCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxNQUFNLEVBQUUsU0FBUyxDQUFDO1FBQ25DLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENB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