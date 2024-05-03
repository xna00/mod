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
define(["require", "exports", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/product/common/productService", "vs/workbench/services/issue/common/issue", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle"], function (require, exports, nls_1, actionCommonCategories_1, actions_1, commands_1, productService_1, issue_1, configuration_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseIssueContribution = void 0;
    const OpenIssueReporterActionId = 'workbench.action.openIssueReporter';
    const OpenIssueReporterApiId = 'vscode.openIssueReporter';
    const OpenIssueReporterCommandMetadata = {
        description: 'Open the issue reporter and optionally prefill part of the form.',
        args: [
            {
                name: 'options',
                description: 'Data to use to prefill the issue reporter with.',
                isOptional: true,
                schema: {
                    oneOf: [
                        {
                            type: 'string',
                            description: 'The extension id to preselect.'
                        },
                        {
                            type: 'object',
                            properties: {
                                extensionId: {
                                    type: 'string'
                                },
                                issueTitle: {
                                    type: 'string'
                                },
                                issueBody: {
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            },
        ]
    };
    let BaseIssueContribution = class BaseIssueContribution extends lifecycle_1.Disposable {
        constructor(productService, configurationService) {
            super();
            if (!productService.reportIssueUrl) {
                return;
            }
            this._register(commands_1.CommandsRegistry.registerCommand({
                id: OpenIssueReporterActionId,
                handler: function (accessor, args) {
                    const data = typeof args === 'string'
                        ? { extensionId: args }
                        : Array.isArray(args)
                            ? { extensionId: args[0] }
                            : args ?? {};
                    return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
                },
                metadata: OpenIssueReporterCommandMetadata
            }));
            this._register(commands_1.CommandsRegistry.registerCommand({
                id: OpenIssueReporterApiId,
                handler: function (accessor, args) {
                    const data = typeof args === 'string'
                        ? { extensionId: args }
                        : Array.isArray(args)
                            ? { extensionId: args[0] }
                            : args ?? {};
                    return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
                },
                metadata: OpenIssueReporterCommandMetadata
            }));
            const reportIssue = {
                id: OpenIssueReporterActionId,
                title: (0, nls_1.localize2)({ key: 'reportIssueInEnglish', comment: ['Translate this to "Report Issue in English" in all languages please!'] }, "Report Issue..."),
                category: actionCommonCategories_1.Categories.Help
            };
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: reportIssue }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
                group: '3_feedback',
                command: {
                    id: OpenIssueReporterActionId,
                    title: (0, nls_1.localize)({ key: 'miReportIssue', comment: ['&& denotes a mnemonic', 'Translate this to "Report Issue in English" in all languages please!'] }, "Report &&Issue")
                },
                order: 3
            }));
        }
    };
    exports.BaseIssueContribution = BaseIssueContribution;
    exports.BaseIssueContribution = BaseIssueContribution = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService)
    ], BaseIssueContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pc3N1ZS9jb21tb24vaXNzdWUuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxNQUFNLHlCQUF5QixHQUFHLG9DQUFvQyxDQUFDO0lBQ3ZFLE1BQU0sc0JBQXNCLEdBQUcsMEJBQTBCLENBQUM7SUFFMUQsTUFBTSxnQ0FBZ0MsR0FBcUI7UUFDMUQsV0FBVyxFQUFFLGtFQUFrRTtRQUMvRSxJQUFJLEVBQUU7WUFDTDtnQkFDQyxJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsTUFBTSxFQUFFO29CQUNQLEtBQUssRUFBRTt3QkFDTjs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsZ0NBQWdDO3lCQUM3Qzt3QkFDRDs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUU7Z0NBQ1gsV0FBVyxFQUFFO29DQUNaLElBQUksRUFBRSxRQUFRO2lDQUNkO2dDQUNELFVBQVUsRUFBRTtvQ0FDWCxJQUFJLEVBQUUsUUFBUTtpQ0FDZDtnQ0FDRCxTQUFTLEVBQUU7b0NBQ1YsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7NkJBQ0Q7eUJBRUQ7cUJBQ0Q7aUJBQ0Q7YUFDRDtTQUNEO0tBQ0QsQ0FBQztJQVNLLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFDcEQsWUFDa0IsY0FBK0IsRUFDekIsb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDcEMsT0FBTztZQUNS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