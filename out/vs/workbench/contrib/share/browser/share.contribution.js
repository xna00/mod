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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/htmlContent", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/editor", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/contextkeys", "vs/workbench/common/contributions", "vs/workbench/contrib/share/browser/shareService", "vs/workbench/contrib/share/common/share", "vs/workbench/services/editor/common/editorService", "vs/platform/progress/common/progress", "vs/editor/browser/services/codeEditorService", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/base/common/lifecycle", "vs/css!./share"], function (require, exports, cancellation_1, codicons_1, htmlContent_1, nls_1, actions_1, clipboardService_1, configuration_1, contextkey_1, editor_1, dialogs_1, extensions_1, notification_1, opener_1, platform_1, workspace_1, contextkeys_1, contributions_1, shareService_1, share_1, editorService_1, progress_1, codeEditorService_1, configurationRegistry_1, configuration_2, lifecycle_1) {
    "use strict";
    var ShareWorkbenchContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const targetMenus = [
        actions_1.MenuId.EditorContextShare,
        actions_1.MenuId.SCMResourceContextShare,
        actions_1.MenuId.OpenEditorsContextShare,
        actions_1.MenuId.EditorTitleContextShare,
        actions_1.MenuId.MenubarShare,
        // MenuId.EditorLineNumberContext, // todo@joyceerhl add share
        actions_1.MenuId.ExplorerContextShare
    ];
    let ShareWorkbenchContribution = class ShareWorkbenchContribution {
        static { ShareWorkbenchContribution_1 = this; }
        static { this.SHARE_ENABLED_SETTING = 'workbench.experimental.share.enabled'; }
        constructor(shareService, configurationService) {
            this.shareService = shareService;
            this.configurationService = configurationService;
            if (this.configurationService.getValue(ShareWorkbenchContribution_1.SHARE_ENABLED_SETTING)) {
                this.registerActions();
            }
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(ShareWorkbenchContribution_1.SHARE_ENABLED_SETTING)) {
                    const settingValue = this.configurationService.getValue(ShareWorkbenchContribution_1.SHARE_ENABLED_SETTING);
                    if (settingValue === true && this._disposables === undefined) {
                        this.registerActions();
                    }
                    else if (settingValue === false && this._disposables !== undefined) {
                        this._disposables?.clear();
                        this._disposables = undefined;
                    }
                }
            });
        }
        registerActions() {
            if (!this._disposables) {
                this._disposables = new lifecycle_1.DisposableStore();
            }
            this._disposables.add((0, actions_1.registerAction2)(class ShareAction extends actions_1.Action2 {
                static { this.ID = 'workbench.action.share'; }
                static { this.LABEL = (0, nls_1.localize2)('share', 'Share...'); }
                constructor() {
                    super({
                        id: ShareAction.ID,
                        title: ShareAction.LABEL,
                        f1: true,
                        icon: codicons_1.Codicon.linkExternal,
                        precondition: contextkey_1.ContextKeyExpr.and(shareService_1.ShareProviderCountContext.notEqualsTo(0), contextkeys_1.WorkspaceFolderCountContext.notEqualsTo(0)),
                        keybinding: {
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 49 /* KeyCode.KeyS */,
                        },
                        menu: [
                            { id: actions_1.MenuId.CommandCenter, order: 1000 }
                        ]
                    });
                }
                async run(accessor, ...args) {
                    const shareService = accessor.get(share_1.IShareService);
                    const activeEditor = accessor.get(editorService_1.IEditorService)?.activeEditor;
                    const resourceUri = (activeEditor && editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }))
                        ?? accessor.get(workspace_1.IWorkspaceContextService).getWorkspace().folders[0].uri;
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const urlService = accessor.get(opener_1.IOpenerService);
                    const progressService = accessor.get(progress_1.IProgressService);
                    const selection = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor()?.getSelection() ?? undefined;
                    const result = await progressService.withProgress({
                        location: 10 /* ProgressLocation.Window */,
                        detail: (0, nls_1.localize)('generating link', 'Generating link...')
                    }, async () => shareService.provideShare({ resourceUri, selection }, cancellation_1.CancellationToken.None));
                    if (result) {
                        const uriText = result.toString();
                        const isResultText = typeof result === 'string';
                        await clipboardService.writeText(uriText);
                        dialogService.prompt({
                            type: notification_1.Severity.Info,
                            message: isResultText ? (0, nls_1.localize)('shareTextSuccess', 'Copied text to clipboard!') : (0, nls_1.localize)('shareSuccess', 'Copied link to clipboard!'),
                            custom: {
                                icon: codicons_1.Codicon.check,
                                markdownDetails: [{
                                        markdown: new htmlContent_1.MarkdownString(`<div aria-label='${uriText}'>${uriText}</div>`, { supportHtml: true }),
                                        classes: [isResultText ? 'share-dialog-input-text' : 'share-dialog-input-link']
                                    }]
                            },
                            cancelButton: (0, nls_1.localize)('close', 'Close'),
                            buttons: isResultText ? [] : [{ label: (0, nls_1.localize)('open link', 'Open Link'), run: () => { urlService.open(result, { openExternal: true }); } }]
                        });
                    }
                }
            }));
            const actions = this.shareService.getShareActions();
            for (const menuId of targetMenus) {
                for (const action of actions) {
                    // todo@joyceerhl avoid duplicates
                    this._disposables.add(actions_1.MenuRegistry.appendMenuItem(menuId, action));
                }
            }
        }
    };
    ShareWorkbenchContribution = ShareWorkbenchContribution_1 = __decorate([
        __param(0, share_1.IShareService),
        __param(1, configuration_1.IConfigurationService)
    ], ShareWorkbenchContribution);
    (0, extensions_1.registerSingleton)(share_1.IShareService, shareService_1.ShareService, 1 /* InstantiationType.Delayed */);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(ShareWorkbenchContribution, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...configuration_2.workbenchConfigurationNodeBase,
        properties: {
            'workbench.experimental.share.enabled': {
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                markdownDescription: (0, nls_1.localize)('experimental.share.enabled', "Controls whether to render the Share action next to the command center when {0} is {1}.", '`#window.commandCenter#`', '`true`'),
                restricted: false,
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zaGFyZS9icm93c2VyL3NoYXJlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ2hHLE1BQU0sV0FBVyxHQUFHO1FBQ25CLGdCQUFNLENBQUMsa0JBQWtCO1FBQ3pCLGdCQUFNLENBQUMsdUJBQXVCO1FBQzlCLGdCQUFNLENBQUMsdUJBQXVCO1FBQzlCLGdCQUFNLENBQUMsdUJBQXVCO1FBQzlCLGdCQUFNLENBQUMsWUFBWTtRQUNuQiw4REFBOEQ7UUFDOUQsZ0JBQU0sQ0FBQyxvQkFBb0I7S0FDM0IsQ0FBQztJQUVGLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTBCOztpQkFDaEIsMEJBQXFCLEdBQUcsc0NBQXNDLEFBQXpDLENBQTBDO1FBSTlFLFlBQ2lDLFlBQTJCLEVBQ25CLG9CQUEyQztZQURuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNuQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRW5GLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSw0QkFBMEIsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ25HLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBQ0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0RCxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyw0QkFBMEIsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUM7b0JBQzlFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsNEJBQTBCLENBQUMscUJB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