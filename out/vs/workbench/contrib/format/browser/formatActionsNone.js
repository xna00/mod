/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/editor/common/services/languageFeatures"], function (require, exports, editorExtensions_1, editorContextKeys_1, nls, contextkey_1, commands_1, notification_1, extensions_1, dialogs_1, panecomposite_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function showExtensionQuery(paneCompositeService, query) {
        const viewlet = await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        if (viewlet) {
            (viewlet?.getViewPaneContainer()).search(query);
        }
    }
    (0, editorExtensions_1.registerEditorAction)(class FormatDocumentMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument.none',
                label: nls.localize('formatDocument.label.multiple', "Format Document"),
                alias: 'Format Document',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const model = editor.getModel();
            const formatterCount = languageFeaturesService.documentFormattingEditProvider.all(model).length;
            if (formatterCount > 1) {
                return commandService.executeCommand('editor.action.formatDocument.multiple');
            }
            else if (formatterCount === 1) {
                return commandService.executeCommand('editor.action.formatDocument');
            }
            else if (model.isTooLargeForSyncing()) {
                notificationService.warn(nls.localize('too.large', "This file cannot be formatted because it is too large"));
            }
            else {
                const langName = model.getLanguageId();
                const message = nls.localize('no.provider', "There is no formatter for '{0}' files installed.", langName);
                const { confirmed } = await dialogService.confirm({
                    message,
                    primaryButton: nls.localize({ key: 'install.formatter', comment: ['&& denotes a mnemonic'] }, "&&Install Formatter...")
                });
                if (confirmed) {
                    showExtensionQuery(paneCompositeService, `category:formatters ${langName}`);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0QWN0aW9uc05vbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2Zvcm1hdC9icm93c2VyL2Zvcm1hdEFjdGlvbnNOb25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxLQUFLLFVBQVUsa0JBQWtCLENBQUMsb0JBQStDLEVBQUUsS0FBYTtRQUMvRixNQUFNLE9BQU8sR0FBRyxNQUFNLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLHVCQUFVLHlDQUFpQyxJQUFJLENBQUMsQ0FBQztRQUM5RyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQW1DLENBQUEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakYsQ0FBQztJQUNGLENBQUM7SUFFRCxJQUFBLHVDQUFvQixFQUFDLE1BQU0sNEJBQTZCLFNBQVEsK0JBQVk7UUFFM0U7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLG1DQUFtQztnQkFDdkMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ3ZFLEtBQUssRUFBRSxpQkFBaUI7Z0JBQ3hCLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxxQ0FBaUIsQ0FBQyxRQUFRLEVBQUUscUNBQWlCLENBQUMsNkJBQTZCLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3pILE1BQU0sRUFBRTtvQkFDUCxNQUFNLEVBQUUscUNBQWlCLENBQUMsZUFBZTtvQkFDekMsT0FBTyxFQUFFLDhDQUF5Qix3QkFBZTtvQkFDakQsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLG1EQUE2Qix3QkFBZSxFQUFFO29CQUNoRSxNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztZQUNyRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUNBQXlCLENBQUMsQ0FBQztZQUNyRSxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQztZQUMvRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQztZQUV2RSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxjQUFjLEdBQUcsdUJBQXVCLENBQUMsOEJBQThCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUVoRyxJQUFJLGNBQWMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7WUFDL0UsQ0FBQztpQkFBTSxJQUFJLGNBQWMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDdEUsQ0FBQztpQkFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSx1REFBdUQsQ0FBQyxDQUFDLENBQUM7WUFDOUcsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsa0RBQWtELEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzFHLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxNQUFNLGFBQWEsQ0FBQyxPQUFPLENBQUM7b0JBQ2pELE9BQU87b0JBQ1AsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLHdCQUF3QixDQUFDO2lCQUN2SCxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixrQkFBa0IsQ0FBQyxvQkFBb0IsRUFBRSx1QkFBdUIsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDIn0=