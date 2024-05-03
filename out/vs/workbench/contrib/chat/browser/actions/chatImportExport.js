/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/resources", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, resources_1, nls_1, actions_1, dialogs_1, files_1, chatActions_1, chat_1, chatEditorInput_1, chatContextKeys_1, chatModel_1, chatService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatExportActions = registerChatExportActions;
    const defaultFileName = 'chat.json';
    const filters = [{ name: (0, nls_1.localize)('chat.file.label', "Chat Session"), extensions: ['json'] }];
    function registerChatExportActions() {
        (0, actions_1.registerAction2)(class ExportChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.export',
                    category: chatActions_1.CHAT_CATEGORY,
                    title: {
                        value: (0, nls_1.localize)('chat.export.label', "Export Session") + '...',
                        original: 'Export Session...'
                    },
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                const fileService = accessor.get(files_1.IFileService);
                const chatService = accessor.get(chatService_1.IChatService);
                const widget = widgetService.lastFocusedWidget;
                if (!widget || !widget.viewModel) {
                    return;
                }
                const defaultUri = (0, resources_1.joinPath)(await fileDialogService.defaultFilePath(), defaultFileName);
                const result = await fileDialogService.showSaveDialog({
                    defaultUri,
                    filters
                });
                if (!result) {
                    return;
                }
                const model = chatService.getSession(widget.viewModel.sessionId);
                if (!model) {
                    return;
                }
                // Using toJSON on the model
                const content = buffer_1.VSBuffer.fromString(JSON.stringify(model.toExport(), undefined, 2));
                await fileService.writeFile(result, content);
            }
        });
        (0, actions_1.registerAction2)(class ImportChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.import',
                    title: {
                        value: (0, nls_1.localize)('chat.import.label', "Import Session") + '...',
                        original: 'Import Session...'
                    },
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                const fileService = accessor.get(files_1.IFileService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const defaultUri = (0, resources_1.joinPath)(await fileDialogService.defaultFilePath(), defaultFileName);
                const result = await fileDialogService.showOpenDialog({
                    defaultUri,
                    canSelectFiles: true,
                    filters
                });
                if (!result) {
                    return;
                }
                const content = await fileService.readFile(result[0]);
                try {
                    const data = JSON.parse(content.value.toString());
                    if (!(0, chatModel_1.isExportableSessionData)(data)) {
                        throw new Error('Invalid chat session data');
                    }
                    await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { data }, pinned: true } });
                }
                catch (err) {
                    throw err;
                }
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEltcG9ydEV4cG9ydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdEltcG9ydEV4cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsOERBc0ZDO0lBekZELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQztJQUNwQyxNQUFNLE9BQU8sR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUU5RixTQUFnQix5QkFBeUI7UUFDeEMsSUFBQSx5QkFBZSxFQUFDLE1BQU0sZ0JBQWlCLFNBQVEsaUJBQU87WUFDckQ7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSw4QkFBOEI7b0JBQ2xDLFFBQVEsRUFBRSwyQkFBYTtvQkFDdkIsS0FBSyxFQUFFO3dCQUNOLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUs7d0JBQzlELFFBQVEsRUFBRSxtQkFBbUI7cUJBQzdCO29CQUNELFlBQVksRUFBRSx5Q0FBdUI7b0JBQ3JDLEVBQUUsRUFBRSxJQUFJO2lCQUNSLENBQUMsQ0FBQztZQUNKLENBQUM7WUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO2dCQUNuRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFrQixDQUFDLENBQUM7Z0JBQ3ZELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBa0IsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLFdBQVcsR0FB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