/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/selection", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, selection_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Controller', () => {
        test('issue #23913: Greater than 1000+ multi cursor typing replacement text appears inverted, lines begin to drop off selection', function () {
            this.timeout(10000);
            const LINE_CNT = 2000;
            const text = [];
            for (let i = 0; i < LINE_CNT; i++) {
                text[i] = 'asd';
            }
            (0, testCodeEditor_1.withTestCodeEditor)(text, {}, (editor, viewModel) => {
                const model = editor.getModel();
                const selections = [];
                for (let i = 0; i < LINE_CNT; i++) {
                    selections[i] = new selection_1.Selection(i + 1, 1, i + 1, 1);
                }
                viewModel.setSelections('test', selections);
                viewModel.type('n', 'keyboard');
                viewModel.type('n', 'keyboard');
                for (let i = 0; i < LINE_CNT; i++) {
                    assert.strictEqual(model.getLineContent(i + 1), 'nnasd', 'line #' + (i + 1));
                }
                assert.strictEqual(viewModel.getSelections().length, LINE_CNT);
                assert.strictEqual(viewModel.getSelections()[LINE_CNT - 1].startLineNumber, LINE_CNT);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmludGVncmF0aW9uVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9jb250cm9sbGVyL2N1cnNvci5pbnRlZ3JhdGlvblRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFJLENBQUMsMkhBQTJILEVBQUU7WUFDakksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFFdEIsTUFBTSxJQUFJLEdBQWEsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBRUQsSUFBQSxtQ0FBa0IsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNsRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRWhDLE1BQU0sVUFBVSxHQUFnQixFQUFFLENBQUM7Z0JBQ25DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDbkMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUkscUJBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxDQUFDO2dCQUNELFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUU1QyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRWhDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlFLENBQUM7Z0JBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9