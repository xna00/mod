/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/selection"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, codeEditorService_1, coreCommands_1, position_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleColumnSelectionAction = void 0;
    class ToggleColumnSelectionAction extends actions_1.Action2 {
        static { this.ID = 'editor.action.toggleColumnSelection'; }
        constructor() {
            super({
                id: ToggleColumnSelectionAction.ID,
                title: {
                    ...(0, nls_1.localize2)('toggleColumnSelection', "Toggle Column Selection Mode"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miColumnSelection', comment: ['&& denotes a mnemonic'] }, "Column &&Selection Mode"),
                },
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.columnSelection', true),
                menu: {
                    id: actions_1.MenuId.MenubarSelectionMenu,
                    group: '4_config',
                    order: 2
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const oldValue = configurationService.getValue('editor.columnSelection');
            const codeEditor = this._getCodeEditor(codeEditorService);
            await configurationService.updateValue('editor.columnSelection', !oldValue);
            const newValue = configurationService.getValue('editor.columnSelection');
            if (!codeEditor || codeEditor !== this._getCodeEditor(codeEditorService) || oldValue === newValue || !codeEditor.hasModel() || typeof oldValue !== 'boolean' || typeof newValue !== 'boolean') {
                return;
            }
            const viewModel = codeEditor._getViewModel();
            if (codeEditor.getOption(22 /* EditorOption.columnSelection */)) {
                const selection = codeEditor.getSelection();
                const modelSelectionStart = new position_1.Position(selection.selectionStartLineNumber, selection.selectionStartColumn);
                const viewSelectionStart = viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelSelectionStart);
                const modelPosition = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, {
                    position: modelSelectionStart,
                    viewPosition: viewSelectionStart
                });
                const visibleColumn = viewModel.cursorConfig.visibleColumnFromColumn(viewModel, viewPosition);
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: modelPosition,
                    viewPosition: viewPosition,
                    doColumnSelect: true,
                    mouseColumn: visibleColumn + 1
                });
            }
            else {
                const columnSelectData = viewModel.getCursorColumnSelectData();
                const fromViewColumn = viewModel.cursorConfig.columnFromVisibleColumn(viewModel, columnSelectData.fromViewLineNumber, columnSelectData.fromViewVisualColumn);
                const fromPosition = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(columnSelectData.fromViewLineNumber, fromViewColumn));
                const toViewColumn = viewModel.cursorConfig.columnFromVisibleColumn(viewModel, columnSelectData.toViewLineNumber, columnSelectData.toViewVisualColumn);
                const toPosition = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(columnSelectData.toViewLineNumber, toViewColumn));
                codeEditor.setSelection(new selection_1.Selection(fromPosition.lineNumber, fromPosition.column, toPosition.lineNumber, toPosition.column));
            }
        }
        _getCodeEditor(codeEditorService) {
            const codeEditor = codeEditorService.getFocusedCodeEditor();
            if (codeEditor) {
                return codeEditor;
            }
            return codeEditorService.getActiveCodeEditor();
        }
    }
    exports.ToggleColumnSelectionAction = ToggleColumnSelectionAction;
    (0, actions_1.registerAction2)(ToggleColumnSelectionAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlQ29sdW1uU2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2Jyb3dzZXIvdG9nZ2xlQ29sdW1uU2VsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLDJCQUE0QixTQUFRLGlCQUFPO2lCQUV2QyxPQUFFLEdBQUcscUNBQXFDLENBQUM7UUFFM0Q7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDJCQUEyQixDQUFDLEVBQUU7Z0JBQ2xDLEtBQUssRUFBRTtvQkFDTixHQUFHLElBQUEsZUFBUyxFQUFDLHVCQUF1QixFQUFFLDhCQUE4QixDQUFDO29CQUNyRSxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLHlCQUF5QixDQUFDO2lCQUNwSDtnQkFDRCxFQUFFLEVBQUUsSUFBSTtnQkFDUixPQUFPLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsK0JBQStCLEVBQUUsSUFBSSxDQUFDO2dCQUNyRSxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsb0JBQW9CO29CQUMvQixLQUFLLEVBQUUsVUFBVTtvQkFDakIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUM1QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQztZQUUzRCxNQUFN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