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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/services/issue/common/issue", "vs/platform/commands/common/commands", "vs/workbench/contrib/issue/common/issue.contribution", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/action/common/actionCommonCategories", "vs/platform/environment/common/environment", "vs/platform/dialogs/common/dialogs", "vs/platform/native/common/native", "vs/platform/progress/common/progress", "vs/platform/issue/common/issue", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/issue/browser/issueQuickAccess"], function (require, exports, nls_1, actions_1, issue_1, commands_1, issue_contribution_1, productService_1, platform_1, contributions_1, actionCommonCategories_1, environment_1, dialogs_1, native_1, progress_1, issue_2, configuration_1, quickAccess_1, issueQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Issue Contribution
    let NativeIssueContribution = class NativeIssueContribution extends issue_contribution_1.BaseIssueContribution {
        constructor(productService, configurationService) {
            super(productService, configurationService);
            if (productService.reportIssueUrl) {
                this._register((0, actions_1.registerAction2)(ReportPerformanceIssueUsingReporterAction));
            }
            let disposable;
            const registerQuickAccessProvider = () => {
                disposable = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
                    ctor: issueQuickAccess_1.IssueQuickAccess,
                    prefix: issueQuickAccess_1.IssueQuickAccess.PREFIX,
                    contextKey: 'inReportIssuePicker',
                    placeholder: (0, nls_1.localize)('tasksQuickAccessPlaceholder', "Type the name of an extension to report on."),
                    helpEntries: [{
                            description: (0, nls_1.localize)('openIssueReporter', "Open Issue Reporter"),
                            commandId: 'workbench.action.openIssueReporter'
                        }]
                });
            };
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (!configurationService.getValue('extensions.experimental.issueQuickAccess') && disposable) {
                    disposable.dispose();
                    disposable = undefined;
                }
                else if (!disposable) {
                    registerQuickAccessProvider();
                }
            }));
            if (configurationService.getValue('extensions.experimental.issueQuickAccess')) {
                registerQuickAccessProvider();
            }
        }
    };
    NativeIssueContribution = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService)
    ], NativeIssueContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NativeIssueContribution, 3 /* LifecyclePhase.Restored */);
    class ReportPerformanceIssueUsingReporterAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.reportPerformanceIssueUsingReporter'; }
        constructor() {
            super({
                id: ReportPerformanceIssueUsingReporterAction.ID,
                title: (0, nls_1.localize2)({ key: 'reportPerformanceIssue', comment: [`Here, 'issue' means problem or bug`] }, "Report Performance Issue..."),
                category: actionCommonCategories_1.Categories.Help,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            return issueService.openReporter({ issueType: 1 /* IssueType.PerformanceIssue */ });
        }
    }
    //#endregion
    //#region Commands
    class OpenProcessExplorer extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openProcessExplorer'; }
        constructor() {
            super({
                id: OpenProcessExplorer.ID,
                title: (0, nls_1.localize2)('openProcessExplorer', 'Open Process Explorer'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            return issueService.openProcessExplorer();
        }
    }
    (0, actions_1.registerAction2)(OpenProcessExplorer);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
        group: '5_tools',
        command: {
            id: OpenProcessExplorer.ID,
            title: (0, nls_1.localize)({ key: 'miOpenProcessExplorerer', comment: ['&& denotes a mnemonic'] }, "Open &&Process Explorer")
        },
        order: 2
    });
    class StopTracing extends actions_1.Action2 {
        static { this.ID = 'workbench.action.stopTracing'; }
        constructor() {
            super({
                id: StopTracing.ID,
                title: (0, nls_1.localize2)('stopTracing', 'Stop Tracing'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_2.IIssueMainService);
            const environmentService = accessor.get(environment_1.INativeEnvironmentService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const progressService = accessor.get(progress_1.IProgressService);
            if (!environmentService.args.trace) {
                const { confirmed } = await dialogService.confirm({
                    message: (0, nls_1.localize)('stopTracing.message', "Tracing requires to launch with a '--trace' argument"),
                    primaryButton: (0, nls_1.localize)({ key: 'stopTracing.button', comment: ['&& denotes a mnemonic'] }, "&&Relaunch and Enable Tracing"),
                });
                if (confirmed) {
                    return nativeHostService.relaunch({ addArgs: ['--trace'] });
                }
            }
            await progressService.withProgress({
                location: 20 /* ProgressLocation.Dialog */,
                title: (0, nls_1.localize)('stopTracing.title', "Creating trace file..."),
                cancellable: false,
                detail: (0, nls_1.localize)('stopTracing.detail', "This can take up to one minute to complete.")
            }, () => issueService.stopTracing());
        }
    }
    (0, actions_1.registerAction2)(StopTracing);
    commands_1.CommandsRegistry.registerCommand('_issues.getSystemStatus', (accessor) => {
        return accessor.get(issue_2.IIssueMainService).getSystemStatus();
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pc3N1ZS9lbGVjdHJvbi1zYW5kYm94L2lzc3VlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQXdCaEcsNEJBQTRCO0lBRTVCLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsMENBQXFCO1FBRTFELFlBQ2tCLGNBQStCLEVBQ3pCLG9CQUEyQztZQUVsRSxLQUFLLENBQUMsY0FBYyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFNUMsSUFBSSxjQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx5QkFBZSxFQUFDLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBRUQsSUFBSSxVQUFtQyxDQUFDO1lBRXhDLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxFQUFFO2dCQUN4QyxVQUFVLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXVCLHdCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDLDJCQUEyQixDQUFDO29CQUM3RyxJQUFJLEVBQUUsbUNBQWdCO29CQUN0QixNQUFNLEVBQUUsbUNBQWdCLENBQUMsTUFBTTtvQkFDL0IsVUFBVSxFQUFFLHFCQUFxQjtvQkFDakMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLDZDQUE2QyxDQUFDO29CQUNuRyxXQUFXLEVBQUUsQ0FBQzs0QkFDYixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUscUJBQXFCLENBQUM7NEJBQ2pFLFNBQVMsRUFBRSxvQ0FBb0M7eUJBQy9DLENBQUM7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0osQ0FB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