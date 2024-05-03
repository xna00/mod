/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/codicons", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/mergeEditor/browser/view/mergeEditor", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, codicons_1, uri_1, language_1, nls_1, actions_1, clipboardService_1, dialogs_1, files_1, notification_1, quickInput_1, mergeEditor_1, mergeEditor_2, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorLoadContentsFromFolder = exports.MergeEditorSaveContentsToFolder = exports.MergeEditorCopyContentsToJSON = void 0;
    const MERGE_EDITOR_CATEGORY = (0, nls_1.localize2)('mergeEditor', 'Merge Editor (Dev)');
    class MergeEditorCopyContentsToJSON extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.copyContentsJson',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.copyState', "Copy Merge Editor State as JSON"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (!(activeEditorPane instanceof mergeEditor_1.MergeEditor)) {
                notificationService.info({
                    name: (0, nls_1.localize)('mergeEditor.name', 'Merge Editor'),
                    message: (0, nls_1.localize)('mergeEditor.noActiveMergeEditor', "No active merge editor")
                });
                return;
            }
            const model = activeEditorPane.model;
            if (!model) {
                return;
            }
            const contents = {
                languageId: model.resultTextModel.getLanguageId(),
                base: model.base.getValue(),
                input1: model.input1.textModel.getValue(),
                input2: model.input2.textModel.getValue(),
                result: model.resultTextModel.getValue(),
                initialResult: model.getInitialResultValue(),
            };
            const jsonStr = JSON.stringify(contents, undefined, 4);
            clipboardService.writeText(jsonStr);
            notificationService.info({
                name: (0, nls_1.localize)('mergeEditor.name', 'Merge Editor'),
                message: (0, nls_1.localize)('mergeEditor.successfullyCopiedMergeEditorContents', "Successfully copied merge editor state"),
            });
        }
    }
    exports.MergeEditorCopyContentsToJSON = MergeEditorCopyContentsToJSON;
    class MergeEditorSaveContentsToFolder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.saveContentsToFolder',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.saveContentsToFolder', "Save Merge Editor State to Folder"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        async run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const dialogService = accessor.get(dialogs_1.IFileDialogService);
            const fileService = accessor.get(files_1.IFileService);
            const languageService = accessor.get(language_1.ILanguageService);
            if (!(activeEditorPane instanceof mergeEditor_1.MergeEditor)) {
                notificationService.info({
                    name: (0, nls_1.localize)('mergeEditor.name', 'Merge Editor'),
                    message: (0, nls_1.localize)('mergeEditor.noActiveMergeEditor', "No active merge editor")
                });
                return;
            }
            const model = activeEditorPane.model;
            if (!model) {
                return;
            }
            const result = await dialogService.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                title: (0, nls_1.localize)('mergeEditor.selectFolderToSaveTo', 'Select folder to save to')
            });
            if (!result) {
                return;
            }
            const targetDir = result[0];
            const extension = languageService.getExtensions(model.resultTextModel.getLanguageId())[0] || '';
            async function write(fileName, source) {
                await fileService.writeFile(uri_1.URI.joinPath(targetDir, fileName + extension), buffer_1.VSBuffer.fromString(source), {});
            }
            await Promise.all([
                write('base', model.base.getValue()),
                write('input1', model.input1.textModel.getValue()),
                write('input2', model.input2.textModel.getValue()),
                write('result', model.resultTextModel.getValue()),
                write('initialResult', model.getInitialResultValue()),
            ]);
            notificationService.info({
                name: (0, nls_1.localize)('mergeEditor.name', 'Merge Editor'),
                message: (0, nls_1.localize)('mergeEditor.successfullySavedMergeEditorContentsToFolder', "Successfully saved merge editor state to folder"),
            });
        }
    }
    exports.MergeEditorSaveContentsToFolder = MergeEditorSaveContentsToFolder;
    class MergeEditorLoadContentsFromFolder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.loadContentsFromFolder',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.loadContentsFromFolder', "Load Merge Editor State from Folder"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true
            });
        }
        async run(accessor, args) {
            const dialogService = accessor.get(dialogs_1.IFileDialogService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            if (!args) {
                args = {};
            }
            let targetDir;
            if (!args.folderUri) {
                const result = await dialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    title: (0, nls_1.localize)('mergeEditor.selectFolderToSaveTo', 'Select folder to save to')
                });
                if (!result) {
                    return;
                }
                targetDir = result[0];
            }
            else {
                targetDir = args.folderUri;
            }
            const targetDirInfo = await fileService.resolve(targetDir);
            function findFile(name) {
                return targetDirInfo.children.find(c => c.name.startsWith(name))?.resource;
            }
            const shouldOpenInitial = await promptOpenInitial(quickInputService, args.resultState);
            const baseUri = findFile('base');
            const input1Uri = findFile('input1');
            const input2Uri = findFile('input2');
            const resultUri = findFile(shouldOpenInitial ? 'initialResult' : 'result');
            const input = {
                base: { resource: baseUri },
                input1: { resource: input1Uri, label: 'Input 1', description: 'Input 1', detail: '(from file)' },
                input2: { resource: input2Uri, label: 'Input 2', description: 'Input 2', detail: '(from file)' },
                result: { resource: resultUri },
            };
            editorService.openEditor(input);
        }
    }
    exports.MergeEditorLoadContentsFromFolder = MergeEditorLoadContentsFromFolder;
    async function promptOpenInitial(quickInputService, resultStateOverride) {
        if (resultStateOverride) {
            return resultStateOverride === 'initial';
        }
        const result = await quickInputService.pick([{ label: 'result', result: false }, { label: 'initial result', result: true }], { canPickMany: false });
        return result?.result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2Q29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvY29tbWFuZHMvZGV2Q29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxNQUFNLHFCQUFxQixHQUFxQixJQUFBLGVBQVMsRUFBQyxhQUFhLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUUvRixNQUFhLDZCQUE4QixTQUFRLGlCQUFPO1FBQ3pEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQ2hDLFFBQVEsRUFBRSxxQkFBcUI7Z0JBQy9CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxxQkFBcUIsRUFBRSxpQ0FBaUMsQ0FBQztnQkFDMUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsY0FBYztnQkFDNUIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDhCQUFnQjthQUM5QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxDQUFDLGdCQUFnQixZQUFZLHlCQUFXLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQ3hCLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxjQUFjLENBQUM7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