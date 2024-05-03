/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/codicons", "vs/base/common/extpath", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/mergeEditor/browser/view/mergeEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, codicons_1, extpath_1, uri_1, language_1, nls_1, actions_1, clipboardService_1, environment_1, files_1, quickInput_1, mergeEditor_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenSelectionInTemporaryMergeEditor = exports.MergeEditorOpenContentsFromJSON = void 0;
    const MERGE_EDITOR_CATEGORY = (0, nls_1.localize2)('mergeEditor', 'Merge Editor (Dev)');
    class MergeEditorOpenContentsFromJSON extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.openContentsJson',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.openState', "Open Merge Editor State from JSON"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
            });
        }
        async run(accessor, args) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const languageService = accessor.get(language_1.ILanguageService);
            const env = accessor.get(environment_1.INativeEnvironmentService);
            const fileService = accessor.get(files_1.IFileService);
            if (!args) {
                args = {};
            }
            let content;
            if (!args.data) {
                const result = await quickInputService.input({
                    prompt: (0, nls_1.localize)('mergeEditor.enterJSON', 'Enter JSON'),
                    value: await clipboardService.readText(),
                });
                if (result === undefined) {
                    return;
                }
                content =
                    result !== ''
                        ? JSON.parse(result)
                        : { base: '', input1: '', input2: '', result: '', languageId: 'plaintext' };
            }
            else {
                content = args.data;
            }
            const targetDir = uri_1.URI.joinPath(env.tmpDir, (0, extpath_1.randomPath)());
            const extension = languageService.getExtensions(content.languageId)[0] || '';
            const baseUri = uri_1.URI.joinPath(targetDir, `/base${extension}`);
            const input1Uri = uri_1.URI.joinPath(targetDir, `/input1${extension}`);
            const input2Uri = uri_1.URI.joinPath(targetDir, `/input2${extension}`);
            const resultUri = uri_1.URI.joinPath(targetDir, `/result${extension}`);
            const initialResultUri = uri_1.URI.joinPath(targetDir, `/initialResult${extension}`);
            async function writeFile(uri, content) {
                await fileService.writeFile(uri, buffer_1.VSBuffer.fromString(content));
            }
            const shouldOpenInitial = await promptOpenInitial(quickInputService, args.resultState);
            await Promise.all([
                writeFile(baseUri, content.base),
                writeFile(input1Uri, content.input1),
                writeFile(input2Uri, content.input2),
                writeFile(resultUri, shouldOpenInitial ? (content.initialResult || '') : content.result),
                writeFile(initialResultUri, content.initialResult || ''),
            ]);
            const input = {
                base: { resource: baseUri },
                input1: { resource: input1Uri, label: 'Input 1', description: 'Input 1', detail: '(from JSON)' },
                input2: { resource: input2Uri, label: 'Input 2', description: 'Input 2', detail: '(from JSON)' },
                result: { resource: resultUri },
            };
            editorService.openEditor(input);
        }
    }
    exports.MergeEditorOpenContentsFromJSON = MergeEditorOpenContentsFromJSON;
    async function promptOpenInitial(quickInputService, resultStateOverride) {
        if (resultStateOverride) {
            return resultStateOverride === 'initial';
        }
        const result = await quickInputService.pick([{ label: 'result', result: false }, { label: 'initial result', result: true }], { canPickMany: false });
        return result?.result;
    }
    class MergeEditorAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                const vm = activeEditorPane.viewModel.get();
                if (!vm) {
                    return;
                }
                this.runWithViewModel(vm, accessor);
            }
        }
    }
    class OpenSelectionInTemporaryMergeEditor extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.dev.openSelectionInTemporaryMergeEditor',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.openSelectionInTemporaryMergeEditor', "Open Selection In Temporary Merge Editor"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
            });
        }
        async runWithViewModel(viewModel, accessor) {
            const rangesInBase = viewModel.selectionInBase.get()?.rangesInBase;
            if (!rangesInBase || rangesInBase.length === 0) {
                return;
            }
            const base = rangesInBase
                .map((r) => viewModel.model.base.getValueInRange(r))
                .join('\n');
            const input1 = rangesInBase
                .map((r) => viewModel.inputCodeEditorView1.editor.getModel().getValueInRange(viewModel.model.translateBaseRangeToInput(1, r)))
                .join('\n');
            const input2 = rangesInBase
                .map((r) => viewModel.inputCodeEditorView2.editor.getModel().getValueInRange(viewModel.model.translateBaseRangeToInput(2, r)))
                .join('\n');
            const result = rangesInBase
                .map((r) => viewModel.resultCodeEditorView.editor.getModel().getValueInRange(viewModel.model.translateBaseRangeToResult(r)))
                .join('\n');
            new MergeEditorOpenContentsFromJSON().run(accessor, {
                data: {
                    base,
                    input1,
                    input2,
                    result,
                    languageId: viewModel.resultCodeEditorView.editor.getModel().getLanguageId()
                }
            });
        }
    }
    exports.OpenSelectionInTemporaryMergeEditor = OpenSelectionInTemporaryMergeEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2Q29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2VsZWN0cm9uLXNhbmRib3gvZGV2Q29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFNLHFCQUFxQixHQUFxQixJQUFBLGVBQVMsRUFBQyxhQUFhLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUUvRixNQUFhLCtCQUFnQyxTQUFRLGlCQUFPO1FBQzNEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQ2hDLFFBQVEsRUFBRSxxQkFBcUI7Z0JBQy9CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxxQkFBcUIsRUFBRSxtQ0FBbUMsQ0FBQztnQkFDNUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsY0FBYztnQkFDNUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQTBFO1lBQy9HLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztZQUN2RCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUF5QixDQUFDLENBQUM7WUFDcEQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLElBQUksR0FBRyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsSUFBSSxPQUE0QixDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sTUFBTSxHQUFHLE1BQU0saUJBQWlCLENBQUMsS0FBSyxDQUFDO29CQUM1QyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsWUFBWSxDQUFDO29CQUN2RCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUU7aUJBQ3hDLENBQUMsQ0FBQztnQkFDSCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDMUIsT0FBTztnQkFDUixDQUFDO2dCQUNELE9BQU87b0JBQ04sTUFBTSxLQUFLLEVBQUU7d0JBQ1osQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO3dCQUNwQixDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUMvRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckIsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFBLG9CQUFVLEdBQUUsQ0FBQyxDQUFDO1lBRXpELE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUU3RSxNQUFNLE9BQU8sR0FBRyxTQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsVUFBVSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxVQUFVLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxnQkFBZ0IsR0FBRyxTQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUUvRSxLQUFLLFVBQVUsU0FBUyxDQUFDLEdBQVEsRUFBRSxPQUFlO2dCQUNqRCxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFdkYsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNqQixTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDcEMsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUNwQyxTQUFTLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ3hGLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQzthQUN4RCxDQUFDLENBQUM7WUFFSCxNQUFNLEtBQUssR0FBOEI7Z0JBQ3hDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUU7Z0JBQzNCLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7Z0JBQ2hHLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7Z0JBQ2hHLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7YUFDL0IsQ0FBQztZQUNGLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBeEVELDBFQXdFQztJQUVELEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxpQkFBcUMsRUFBRSxtQkFBMkM7UUFDbEgsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sbUJBQW1CLEtBQUssU0FBUyxDQUFDO1FBQzFDLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNySixPQUFPLE1BQU0sRUFBRSxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQUVELE1BQWUsaUJBQWtCLFNBQVEsaUJBQU87UUFDL0MsWUFBWSxJQUErQjtZQUMxQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDYixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQzFELElBQUksZ0JBQWdCLFlBQVkseUJBQVcsRUFBRSxDQUFDO2dCQUM3QyxNQUFNLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDVCxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQztLQUdEO0lBRUQsTUFBYSxtQ0FBb0MsU0FBUSxpQkFBaUI7UUFDekU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLCtDQUErQztnQkFDbkQsUUFBUSxFQUFFLHFCQUFxQjtnQkFDL0IsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLCtDQUErQyxFQUFFLDBDQUEwQyxDQUFDO2dCQUM3RyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxjQUFjO2dCQUM1QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsU0FBK0IsRUFBRSxRQUEwQjtZQUMxRixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxFQUFFLFlBQVksQ0FBQztZQUNuRSxJQUFJLENBQUMsWUFBWSxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsWUFBWTtpQkFDdkIsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FDVixTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQ25DLENBQUMsQ0FDRCxDQUNEO2lCQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUViLE1BQU0sTUFBTSxHQUFHLFlBQVk7aUJBQ3pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQ1YsU0FBUyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxlQUFlLENBQ2hFLFNBQVMsQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUMvQyxDQUNEO2lCQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUViLE1BQU0sTUFBTSxHQUFHLFlBQVk7aUJBQ3pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQ1YsU0FBUyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxlQUFlLENBQ2hFLFNBQVMsQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUMvQyxDQUNEO2lCQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUViLE1BQU0sTUFBTSxHQUFHLFlBQVk7aUJBQ3pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQ1YsU0FBUyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxlQUFlLENBQ2hFLFNBQVMsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQzdDLENBQ0Q7aUJBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWIsSUFBSSwrQkFBK0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7Z0JBQ25ELElBQUksRUFBRTtvQkFDTCxJQUFJO29CQUNKLE1BQU07b0JBQ04sTUFBTTtvQkFDTixNQUFNO29CQUNOLFVBQVUsRUFBRSxTQUFTLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGFBQWEsRUFBRTtpQkFDN0U7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUEzREQsa0ZBMkRDIn0=