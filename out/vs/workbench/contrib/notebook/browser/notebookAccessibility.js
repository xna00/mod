/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, nls_1, strings_1, keybinding_1, accessibleView_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAccessibilityHelpText = getAccessibilityHelpText;
    exports.runAccessibilityHelpAction = runAccessibilityHelpAction;
    exports.showAccessibleOutput = showAccessibleOutput;
    function getAccessibilityHelpText(accessor) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const content = [];
        content.push((0, nls_1.localize)('notebook.overview', 'The notebook view is a collection of code and markdown cells. Code cells can be executed and will produce output directly below the cell.'));
        content.push(descriptionForCommand('notebook.cell.edit', (0, nls_1.localize)('notebook.cell.edit', 'The Edit Cell command ({0}) will focus on the cell input.'), (0, nls_1.localize)('notebook.cell.editNoKb', 'The Edit Cell command will focus on the cell input and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.cell.quitEdit', (0, nls_1.localize)('notebook.cell.quitEdit', 'The Quit Edit command ({0}) will set focus on the cell container. The default (Escape) key may need to be pressed twice first exit the virtual cursor if active.'), (0, nls_1.localize)('notebook.cell.quitEditNoKb', 'The Quit Edit command will set focus on the cell container and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.cell.focusInOutput', (0, nls_1.localize)('notebook.cell.focusInOutput', 'The Focus Output command ({0}) will set focus in the cell\'s output.'), (0, nls_1.localize)('notebook.cell.focusInOutputNoKb', 'The Quit Edit command will set focus in the cell\'s output and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.focusNextEditor', (0, nls_1.localize)('notebook.focusNextEditor', 'The Focus Next Cell Editor command ({0}) will set focus in the next cell\'s editor.'), (0, nls_1.localize)('notebook.focusNextEditorNoKb', 'The Focus Next Cell Editor command will set focus in the next cell\'s editor and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.focusPreviousEditor', (0, nls_1.localize)('notebook.focusPreviousEditor', 'The Focus Previous Cell Editor command ({0}) will set focus in the previous cell\'s editor.'), (0, nls_1.localize)('notebook.focusPreviousEditorNoKb', 'The Focus Previous Cell Editor command will set focus in the previous cell\'s editor and is currently not triggerable by a keybinding.'), keybindingService));
        content.push((0, nls_1.localize)('notebook.cellNavigation', 'The up and down arrows will also move focus between cells while focused on the outer cell container.'));
        content.push(descriptionForCommand('notebook.cell.executeAndFocusContainer', (0, nls_1.localize)('notebook.cell.executeAndFocusContainer', 'The Execute Cell command ({0}) executes the cell that currently has focus.'), (0, nls_1.localize)('notebook.cell.executeAndFocusContainerNoKb', 'The Execute Cell command executes the cell that currently has focus and is currently not triggerable by a keybinding.'), keybindingService));
        content.push((0, nls_1.localize)('notebook.cell.insertCodeCellBelowAndFocusContainer', 'The Insert Cell Above/Below commands will create new empty code cells'));
        content.push((0, nls_1.localize)('notebook.changeCellType', 'The Change Cell to Code/Markdown commands are used to switch between cell types.'));
        return content.join('\n\n');
    }
    function descriptionForCommand(commandId, msg, noKbMsg, keybindingService) {
        const kb = keybindingService.lookupKeybinding(commandId);
        if (kb) {
            return (0, strings_1.format)(msg, kb.getAriaLabel());
        }
        return (0, strings_1.format)(noKbMsg, commandId);
    }
    async function runAccessibilityHelpAction(accessor, editor) {
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const helpText = getAccessibilityHelpText(accessor);
        accessibleViewService.show({
            id: "notebook" /* AccessibleViewProviderId.Notebook */,
            verbositySettingKey: "accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */,
            provideContent: () => helpText,
            onClose: () => {
                editor.focus();
            },
            options: { type: "help" /* AccessibleViewType.Help */ }
        });
    }
    function showAccessibleOutput(accessibleViewService, editorService) {
        const activePane = editorService.activeEditorPane;
        const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(activePane);
        const notebookViewModel = notebookEditor?.getViewModel();
        const selections = notebookViewModel?.getSelections();
        const notebookDocument = notebookViewModel?.notebookDocument;
        if (!selections || !notebookDocument || !notebookEditor?.textModel) {
            return false;
        }
        const viewCell = notebookViewModel.viewCells[selections[0].start];
        let outputContent = '';
        const decoder = new TextDecoder();
        for (let i = 0; i < viewCell.outputsViewModels.length; i++) {
            const outputViewModel = viewCell.outputsViewModels[i];
            const outputTextModel = viewCell.model.outputs[i];
            const [mimeTypes, pick] = outputViewModel.resolveMimeTypes(notebookEditor.textModel, undefined);
            const mimeType = mimeTypes[pick].mimeType;
            let buffer = outputTextModel.outputs.find(output => output.mime === mimeType);
            if (!buffer || mimeType.startsWith('image')) {
                buffer = outputTextModel.outputs.find(output => !output.mime.startsWith('image'));
            }
            let text = `${mimeType}`; // default in case we can't get the text value for some reason.
            if (buffer) {
                const charLimit = 100_000;
                text = decoder.decode(buffer.data.slice(0, charLimit).buffer);
                if (buffer.data.byteLength > charLimit) {
                    text = text + '...(truncated)';
                }
                if (mimeType.endsWith('error')) {
                    text = text.replace(/\\u001b\[[0-9;]*m/gi, '').replaceAll('\\n', '\n');
                }
            }
            const index = viewCell.outputsViewModels.length > 1
                ? `Cell output ${i + 1} of ${viewCell.outputsViewModels.length}\n`
                : '';
            outputContent = outputContent.concat(`${index}${text}\n`);
        }
        if (!outputContent) {
            return false;
        }
        accessibleViewService.show({
            id: "notebook" /* AccessibleViewProviderId.Notebook */,
            verbositySettingKey: "accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */,
            provideContent() { return outputContent; },
            onClose() {
                notebookEditor?.setFocus(selections[0]);
                activePane?.focus();
            },
            options: { type: "view" /* AccessibleViewType.View */ }
        });
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tBY2Nlc3NpYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rQWNjZXNzaWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyw0REE0QkM7SUFVRCxnRUFZQztJQUVELG9EQTREQztJQWhIRCxTQUFnQix3QkFBd0IsQ0FBQyxRQUEwQjtRQUNsRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztRQUMzRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSwySUFBMkksQ0FBQyxDQUFDLENBQUM7UUFDekwsT0FBTyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsRUFDdEQsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsMkRBQTJELENBQUMsRUFDM0YsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsc0dBQXNHLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDakssT0FBTyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsRUFDMUQsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsa0tBQWtLLENBQUMsRUFDdE0sSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsOEdBQThHLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDN0ssT0FBTyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyw2QkFBNkIsRUFDL0QsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsc0VBQXNFLENBQUMsRUFDL0csSUFBQSxjQUFRLEVB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