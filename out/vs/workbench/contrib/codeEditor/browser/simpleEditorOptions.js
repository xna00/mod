/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/editor/browser/editorExtensions"], function (require, exports, contextmenu_1, snippetController2_1, suggestController_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSimpleEditorOptions = getSimpleEditorOptions;
    exports.getSimpleCodeEditorWidgetOptions = getSimpleCodeEditorWidgetOptions;
    function getSimpleEditorOptions(configurationService) {
        return {
            wordWrap: 'on',
            overviewRulerLanes: 0,
            glyphMargin: false,
            lineNumbers: 'off',
            folding: false,
            selectOnLineNumbers: false,
            hideCursorInOverviewRuler: true,
            selectionHighlight: false,
            scrollbar: {
                horizontal: 'hidden'
            },
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            fixedOverflowWidgets: true,
            acceptSuggestionOnEnter: 'smart',
            dragAndDrop: false,
            revealHorizontalRightPadding: 5,
            minimap: {
                enabled: false
            },
            guides: {
                indentation: false
            },
            accessibilitySupport: configurationService.getValue('editor.accessibilitySupport'),
            cursorBlinking: configurationService.getValue('editor.cursorBlinking')
        };
    }
    function getSimpleCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: true,
            contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                menuPreventer_1.MenuPreventer.ID,
                selectionClipboard_1.SelectionClipboardContributionID,
                contextmenu_1.ContextMenuController.ID,
                suggestController_1.SuggestController.ID,
                snippetController2_1.SnippetController2.ID,
                tabCompletion_1.TabCompletionController.ID,
            ])
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlRWRpdG9yT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3NpbXBsZUVkaXRvck9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsd0RBOEJDO0lBRUQsNEVBWUM7SUE1Q0QsU0FBZ0Isc0JBQXNCLENBQUMsb0JBQTJDO1FBQ2pGLE9BQU87WUFDTixRQUFRLEVBQUUsSUFBSTtZQUNkLGtCQUFrQixFQUFFLENBQUM7WUFDckIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsT0FBTyxFQUFFLEtBQUs7WUFDZCxtQkFBbUIsRUFBRSxLQUFLO1lBQzFCLHlCQUF5QixFQUFFLElBQUk7WUFDL0Isa0JBQWtCLEVBQUUsS0FBSztZQUN6QixTQUFTLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLFFBQVE7YUFDcEI7WUFDRCxvQkFBb0IsRUFBRSxDQUFDO1lBQ3ZCLG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsb0JBQW9CLEVBQUUsS0FBSztZQUMzQixtQkFBbUIsRUFBRSxNQUFNO1lBQzNCLG9CQUFvQixFQUFFLElBQUk7WUFDMUIsdUJBQXVCLEVBQUUsT0FBTztZQUNoQyxXQUFXLEVBQUUsS0FBSztZQUNsQiw0QkFBNEIsRUFBRSxDQUFDO1lBQy9CLE9BQU8sRUFBRTtnQkFDUixPQUFPLEVBQUUsS0FBSzthQUNkO1lBQ0QsTUFBTSxFQUFFO2dCQUNQLFdBQVcsRUFBRSxLQUFLO2FBQ2xCO1lBQ0Qsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUMsUUFBUSxDQUF3Qiw2QkFBNkIsQ0FBQztZQUN6RyxjQUFjLEVBQUUsb0JBQW9CLENBQUMsUUFBUSxDQUFvRCx1QkFBdUIsQ0FBQztTQUN6SCxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQWdCLGdDQUFnQztRQUMvQyxPQUFPO1lBQ04sY0FBYyxFQUFFLElBQUk7WUFDcEIsYUFBYSxFQUFFLDJDQUF3QixDQUFDLDBCQUEwQixDQUFDO2dCQUNsRSw2QkFBYSxDQUFDLEVBQUU7Z0JBQ2hCLHFEQUFnQztnQkFDaEMsbUNBQXFCLENBQUMsRUFBRTtnQkFDeEIscUNBQWlCLENBQUMsRUFBRTtnQkFDcEIsdUNBQWtCLENBQUMsRUFBRTtnQkFDckIsdUNBQXVCLENBQUMsRUFBRTthQUMxQixDQUFDO1NBQ0YsQ0FBQztJQUNILENBQUMifQ==