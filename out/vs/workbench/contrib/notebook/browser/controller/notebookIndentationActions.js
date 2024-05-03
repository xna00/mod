/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, lifecycle_1, bulkEditService_1, range_1, resolverService_1, actions_1, configuration_1, log_1, quickInput_1, notebookEditorService_1, notebookCommon_1, notebookEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookIndentationToTabsAction = exports.NotebookIndentationToSpacesAction = exports.NotebookChangeTabDisplaySize = exports.NotebookIndentUsingSpaces = exports.NotebookIndentUsingTabs = void 0;
    class NotebookIndentUsingTabs extends actions_1.Action2 {
        static { this.ID = 'notebook.action.indentUsingTabs'; }
        constructor() {
            super({
                id: NotebookIndentUsingTabs.ID,
                title: nls.localize('indentUsingTabs', "Indent Using Tabs"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            changeNotebookIndentation(accessor, false, false);
        }
    }
    exports.NotebookIndentUsingTabs = NotebookIndentUsingTabs;
    class NotebookIndentUsingSpaces extends actions_1.Action2 {
        static { this.ID = 'notebook.action.indentUsingSpaces'; }
        constructor() {
            super({
                id: NotebookIndentUsingSpaces.ID,
                title: nls.localize('indentUsingSpaces', "Indent Using Spaces"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            changeNotebookIndentation(accessor, true, false);
        }
    }
    exports.NotebookIndentUsingSpaces = NotebookIndentUsingSpaces;
    class NotebookChangeTabDisplaySize extends actions_1.Action2 {
        static { this.ID = 'notebook.action.changeTabDisplaySize'; }
        constructor() {
            super({
                id: NotebookChangeTabDisplaySize.ID,
                title: nls.localize('changeTabDisplaySize', "Change Tab Display Size"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            changeNotebookIndentation(accessor, true, true);
        }
    }
    exports.NotebookChangeTabDisplaySize = NotebookChangeTabDisplaySize;
    class NotebookIndentationToSpacesAction extends actions_1.Action2 {
        static { this.ID = 'notebook.action.convertIndentationToSpaces'; }
        constructor() {
            super({
                id: NotebookIndentationToSpacesAction.ID,
                title: nls.localize('convertIndentationToSpaces', "Convert Indentation to Spaces"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            convertNotebookIndentation(accessor, true);
        }
    }
    exports.NotebookIndentationToSpacesAction = NotebookIndentationToSpacesAction;
    class NotebookIndentationToTabsAction extends actions_1.Action2 {
        static { this.ID = 'notebook.action.convertIndentationToTabs'; }
        constructor() {
            super({
                id: NotebookIndentationToTabsAction.ID,
                title: nls.localize('convertIndentationToTabs', "Convert Indentation to Tabs"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            convertNotebookIndentation(accessor, false);
        }
    }
    exports.NotebookIndentationToTabsAction = NotebookIndentationToTabsAction;
    function changeNotebookIndentation(accessor, insertSpaces, displaySizeOnly) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        // keep this check here to pop on non-notebook actions
        const activeInput = editorService.activeEditorPane?.input;
        const isNotebook = (0, notebookEditorInput_1.isNotebookEditorInput)(activeInput);
        if (!isNotebook) {
            return;
        }
        // get notebook editor to access all codeEditors
        const notebookEditor = notebookEditorService.retrieveExistingWidgetFromURI(activeInput.resource)?.value;
        if (!notebookEditor) {
            return;
        }
        const picks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
            id: n.toString(),
            label: n.toString(),
        }));
        // store the initial values of the configuration
        const initialConfig = configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
        const initialInsertSpaces = initialConfig['editor.insertSpaces'];
        // remove the initial values from the configuration
        delete initialConfig['editor.indentSize'];
        delete initialConfig['editor.tabSize'];
        delete initialConfig['editor.insertSpaces'];
        setTimeout(() => {
            quickInputService.pick(picks, { placeHolder: nls.localize({ key: 'selectTabWidth', comment: ['Tab corresponds to the tab key'] }, "Select Tab Size for Current File") }).then(pick => {
                if (pick) {
                    const pickedVal = parseInt(pick.label, 10);
                    if (displaySizeOnly) {
                        configurationService.updateValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations, {
                            ...initialConfig,
                            'editor.tabSize': pickedVal,
                            'editor.indentSize': pickedVal,
                            'editor.insertSpaces': initialInsertSpaces
                        });
                    }
                    else {
                        configurationService.updateValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations, {
                            ...initialConfig,
                            'editor.tabSize': pickedVal,
                            'editor.indentSize': pickedVal,
                            'editor.insertSpaces': insertSpaces
                        });
                    }
                }
            });
        }, 50 /* quick input is sensitive to being opened so soon after another */);
    }
    function convertNotebookIndentation(accessor, tabsToSpaces) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const logService = accessor.get(log_1.ILogService);
        const textModelService = accessor.get(resolverService_1.ITextModelService);
        const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
        const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
        // keep this check here to pop on non-notebook
        const activeInput = editorService.activeEditorPane?.input;
        const isNotebook = (0, notebookEditorInput_1.isNotebookEditorInput)(activeInput);
        if (!isNotebook) {
            return;
        }
        // get notebook editor to access all codeEditors
        const notebookTextModel = notebookEditorService.retrieveExistingWidgetFromURI(activeInput.resource)?.value?.textModel;
        if (!notebookTextModel) {
            return;
        }
        const disposable = new lifecycle_1.DisposableStore();
        try {
            Promise.all(notebookTextModel.cells.map(async (cell) => {
                const ref = await textModelService.createModelReference(cell.uri);
                disposable.add(ref);
                const textEditorModel = ref.object.textEditorModel;
                const modelOpts = cell.textModel?.getOptions();
                if (!modelOpts) {
                    return;
                }
                const edits = getIndentationEditOperations(textEditorModel, modelOpts.tabSize, tabsToSpaces);
                bulkEditService.apply(edits, { label: nls.localize('convertIndentation', "Convert Indentation"), code: 'undoredo.convertIndentation', });
            })).then(() => {
                // store the initial values of the configuration
                const initialConfig = configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
                const initialIndentSize = initialConfig['editor.indentSize'];
                const initialTabSize = initialConfig['editor.tabSize'];
                // remove the initial values from the configuration
                delete initialConfig['editor.indentSize'];
                delete initialConfig['editor.tabSize'];
                delete initialConfig['editor.insertSpaces'];
                configurationService.updateValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations, {
                    ...initialConfig,
                    'editor.tabSize': initialTabSize,
                    'editor.indentSize': initialIndentSize,
                    'editor.insertSpaces': tabsToSpaces
                });
                disposable.dispose();
            });
        }
        catch {
            logService.error('Failed to convert indentation to spaces for notebook cells.');
        }
    }
    function getIndentationEditOperations(model, tabSize, tabsToSpaces) {
        if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
            // Model is empty
            return [];
        }
        let spaces = '';
        for (let i = 0; i < tabSize; i++) {
            spaces += ' ';
        }
        const spacesRegExp = new RegExp(spaces, 'gi');
        const edits = [];
        for (let lineNumber = 1, lineCount = model.getLineCount(); lineNumber <= lineCount; lineNumber++) {
            let lastIndentationColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            if (lastIndentationColumn === 0) {
                lastIndentationColumn = model.getLineMaxColumn(lineNumber);
            }
            if (lastIndentationColumn === 1) {
                continue;
            }
            const originalIndentationRange = new range_1.Range(lineNumber, 1, lineNumber, lastIndentationColumn);
            const originalIndentation = model.getValueInRange(originalIndentationRange);
            const newIndentation = (tabsToSpaces
                ? originalIndentation.replace(/\t/ig, spaces)
                : originalIndentation.replace(spacesRegExp, '\t'));
            edits.push(new bulkEditService_1.ResourceTextEdit(model.uri, { range: originalIndentationRange, text: newIndentation }));
        }
        return edits;
    }
    (0, actions_1.registerAction2)(NotebookIndentUsingSpaces);
    (0, actions_1.registerAction2)(NotebookIndentUsingTabs);
    (0, actions_1.registerAction2)(NotebookChangeTabDisplaySize);
    (0, actions_1.registerAction2)(NotebookIndentationToSpacesAction);
    (0, actions_1.registerAction2)(NotebookIndentationToTabsAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tJbmRlbnRhdGlvbkFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9ub3RlYm9va0luZGVudGF0aW9uQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQWEsdUJBQXdCLFNBQVEsaUJBQU87aUJBQzVCLE9BQUUsR0FBRyxpQ0FBaUMsQ0FBQztRQUU5RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtnQkFDOUIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUM7Z0JBQzNELFlBQVksRUFBRSxTQUFTO2FBQ3ZCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDdEQseUJBQXlCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRCxDQUFDOztJQWJGLDBEQWNDO0lBRUQsTUFBYSx5QkFBMEIsU0FBUSxpQkFBTztpQkFDOUIsT0FBRSxHQUFHLG1DQUFtQyxDQUFDO1FBRWhFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx5QkFBeUIsQ0FBQyxFQUFFO2dCQUNoQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBQztnQkFDL0QsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUN0RCx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFD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