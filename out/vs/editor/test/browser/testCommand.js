/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/base/common/lifecycle"], function (require, exports, assert, testCodeEditor_1, testTextModel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testCommand = testCommand;
    exports.getEditOperation = getEditOperation;
    function testCommand(lines, languageId, selection, commandFactory, expectedLines, expectedSelection, forceTokenization, prepare) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
        if (prepare) {
            instantiationService.invokeFunction(prepare, disposables);
        }
        const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, lines.join('\n'), languageId));
        const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model));
        const viewModel = editor.getViewModel();
        if (forceTokenization) {
            model.tokenization.forceTokenization(model.getLineCount());
        }
        viewModel.setSelections('tests', [selection]);
        const command = instantiationService.invokeFunction((accessor) => commandFactory(accessor, viewModel.getSelection()));
        viewModel.executeCommand(command, 'tests');
        assert.deepStrictEqual(model.getLinesContent(), expectedLines);
        const actualSelection = viewModel.getSelection();
        assert.deepStrictEqual(actualSelection.toString(), expectedSelection.toString());
        disposables.dispose();
    }
    /**
     * Extract edit operations if command `command` were to execute on model `model`
     */
    function getEditOperation(model, command) {
        const operations = [];
        const editOperationBuilder = {
            addEditOperation: (range, text, forceMoveMarkers = false) => {
                operations.push({
                    range: range,
                    text: text,
                    forceMoveMarkers: forceMoveMarkers
                });
            },
            addTrackedEditOperation: (range, text, forceMoveMarkers = false) => {
                operations.push({
                    range: range,
                    text: text,
                    forceMoveMarkers: forceMoveMarkers
                });
            },
            trackSelection: (selection) => {
                return '';
            }
        };
        command.getEditOperations(model, editOperationBuilder);
        return operations;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2Jyb3dzZXIvdGVzdENvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsa0NBa0NDO0lBS0QsNENBMEJDO0lBakVELFNBQWdCLFdBQVcsQ0FDMUIsS0FBZSxFQUNmLFVBQXlCLEVBQ3pCLFNBQW9CLEVBQ3BCLGNBQThFLEVBQzlFLGFBQXVCLEVBQ3ZCLGlCQUE0QixFQUM1QixpQkFBMkIsRUFDM0IsT0FBNEU7UUFFNUUsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLHlDQUF3QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ25FLElBQUksT0FBTyxFQUFFLENBQUM7WUFDYixvQkFBb0IsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsb0NBQW9CLEVBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSwwQ0FBeUIsRUFBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3ZGLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUcsQ0FBQztRQUV6QyxJQUFJLGlCQUFpQixFQUFFLENBQUM7WUFDdkIsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsU0FBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRTlDLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RILFNBQVMsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRS9ELE1BQU0sZUFBZSxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNqRCxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRWpGLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUFpQixFQUFFLE9BQWlCO1FBQ3BFLE1BQU0sVUFBVSxHQUEyQixFQUFFLENBQUM7UUFDOUMsTUFBTSxvQkFBb0IsR0FBMEI7WUFDbkQsZ0JBQWdCLEVBQUUsQ0FBQyxLQUFhLEVBQUUsSUFBWSxFQUFFLG1CQUE0QixLQUFLLEVBQUUsRUFBRTtnQkFDcEYsVUFBVSxDQUFDLElBQUksQ0FBQztvQkFDZixLQUFLLEVBQUUsS0FBSztvQkFDWixJQUFJLEVBQUUsSUFBSTtvQkFDVixnQkFBZ0IsRUFBRSxnQkFBZ0I7aUJBQ2xDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCx1QkFBdUIsRUFBRSxDQUFDLEtBQWEsRUFBRSxJQUFZLEVBQUUsbUJBQTRCLEtBQUssRUFBRSxFQUFFO2dCQUMzRixVQUFVLENBQUMsSUFBSSxDQUFDO29CQUNmLEtBQUssRUFBRSxLQUFLO29CQUNaLElBQUksRUFBRSxJQUFJO29CQUNWLGdCQUFnQixFQUFFLGdCQUFnQjtpQkFDbEMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUdELGNBQWMsRUFBRSxDQUFDLFNBQXFCLEVBQUUsRUFBRTtnQkFDekMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1NBQ0QsQ0FBQztRQUNGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUN2RCxPQUFPLFVBQVUsQ0FBQztJQUNuQixDQUFDIn0=