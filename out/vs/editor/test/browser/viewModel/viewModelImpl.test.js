/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/viewEventHandler", "vs/editor/test/browser/viewModel/testViewModel"], function (require, exports, assert, utils_1, position_1, range_1, viewEventHandler_1, testViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ViewModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #21073: SplitLinesCollection: attempt to access a \'newer\' model', () => {
            const text = [''];
            const opts = {
                lineNumbersMinChars: 1
            };
            (0, testViewModel_1.testViewModel)(text, opts, (viewModel, model) => {
                assert.strictEqual(viewModel.getLineCount(), 1);
                viewModel.setViewport(1, 1, 1);
                model.applyEdits([{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: [
                            'line01',
                            'line02',
                            'line03',
                            'line04',
                            'line05',
                            'line06',
                            'line07',
                            'line08',
                            'line09',
                            'line10',
                        ].join('\n')
                    }]);
                assert.strictEqual(viewModel.getLineCount(), 10);
            });
        });
        test('issue #44805: SplitLinesCollection: attempt to access a \'newer\' model', () => {
            const text = [''];
            (0, testViewModel_1.testViewModel)(text, {}, (viewModel, model) => {
                assert.strictEqual(viewModel.getLineCount(), 1);
                model.pushEditOperations([], [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: '\ninsert1'
                    }], () => ([]));
                model.pushEditOperations([], [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: '\ninsert2'
                    }], () => ([]));
                model.pushEditOperations([], [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: '\ninsert3'
                    }], () => ([]));
                const viewLineCount = [];
                viewLineCount.push(viewModel.getLineCount());
                const eventHandler = new class extends viewEventHandler_1.ViewEventHandler {
                    handleEvents(events) {
                        // Access the view model
                        viewLineCount.push(viewModel.getLineCount());
                    }
                };
                viewModel.addViewEventHandler(eventHandler);
                model.undo();
                viewLineCount.push(viewModel.getLineCount());
                assert.deepStrictEqual(viewLineCount, [4, 1, 1, 1, 1]);
                viewModel.removeViewEventHandler(eventHandler);
                eventHandler.dispose();
            });
        });
        test('issue #44805: No visible lines via API call', () => {
            const text = [
                'line1',
                'line2',
                'line3'
            ];
            (0, testViewModel_1.testViewModel)(text, {}, (viewModel, model) => {
                assert.strictEqual(viewModel.getLineCount(), 3);
                viewModel.setHiddenAreas([new range_1.Range(1, 1, 3, 1)]);
                assert.ok(viewModel.getVisibleRanges() !== null);
            });
        });
        test('issue #44805: No visible lines via undoing', () => {
            const text = [
                ''
            ];
            (0, testViewModel_1.testViewModel)(text, {}, (viewModel, model) => {
                assert.strictEqual(viewModel.getLineCount(), 1);
                model.pushEditOperations([], [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: 'line1\nline2\nline3'
                    }], () => ([]));
                viewModel.setHiddenAreas([new range_1.Range(1, 1, 1, 1)]);
                assert.strictEqual(viewModel.getLineCount(), 2);
                model.undo();
                assert.ok(viewModel.getVisibleRanges() !== null);
            });
        });
        function assertGetPlainTextToCopy(text, ranges, emptySelectionClipboard, expected) {
            (0, testViewModel_1.testViewModel)(text, {}, (viewModel, model) => {
                const actual = viewModel.getPlainTextToCopy(ranges, emptySelectionClipboard, false);
                assert.deepStrictEqual(actual, expected);
            });
        }
        const USUAL_TEXT = [
            '',
            'line2',
            'line3',
            'line4',
            ''
        ];
        test('getPlainTextToCopy 0/1', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 2)
            ], false, '');
        });
        test('getPlainTextToCopy 0/1 - emptySelectionClipboard', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 2)
            ], true, 'line2\n');
        });
        test('getPlainTextToCopy 1/1', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 6)
            ], false, 'ine2');
        });
        test('getPlainTextToCopy 1/1 - emptySelectionClipboard', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 6)
            ], true, 'ine2');
        });
        test('getPlainTextToCopy 0/2', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 2),
                new range_1.Range(3, 2, 3, 2),
            ], false, '');
        });
        test('getPlainTextToCopy 0/2 - emptySelectionClipboard', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 2),
                new range_1.Range(3, 2, 3, 2),
            ], true, 'line2\nline3\n');
        });
        test('getPlainTextToCopy 1/2', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 6),
                new range_1.Range(3, 2, 3, 2),
            ], false, 'ine2');
        });
        test('getPlainTextToCopy 1/2 - emptySelectionClipboard', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 6),
                new range_1.Range(3, 2, 3, 2),
            ], true, ['ine2', 'line3']);
        });
        test('getPlainTextToCopy 2/2', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 6),
                new range_1.Range(3, 2, 3, 6),
            ], false, ['ine2', 'ine3']);
        });
        test('getPlainTextToCopy 2/2 reversed', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(3, 2, 3, 6),
                new range_1.Range(2, 2, 2, 6),
            ], false, ['ine2', 'ine3']);
        });
        test('getPlainTextToCopy 0/3 - emptySelectionClipboard', () => {
            assertGetPlainTextToCopy(USUAL_TEXT, [
                new range_1.Range(2, 2, 2, 2),
                new range_1.Range(2, 3, 2, 3),
                new range_1.Range(3, 2, 3, 2),
            ], true, 'line2\nline3\n');
        });
        test('issue #22688 - always use CRLF for clipboard on Windows', () => {
            (0, testViewModel_1.testViewModel)(USUAL_TEXT, {}, (viewModel, model) => {
                model.setEOL(0 /* EndOfLineSequence.LF */);
                const actual = viewModel.getPlainTextToCopy([new range_1.Range(2, 1, 5, 1)], true, true);
                assert.deepStrictEqual(actual, 'line2\r\nline3\r\nline4\r\n');
            });
        });
        test('issue #40926: Incorrect spacing when inserting new line after multiple folded blocks of code', () => {
            (0, testViewModel_1.testViewModel)([
                'foo = {',
                '    foobar: function() {',
                '        this.foobar();',
                '    },',
                '    foobar: function() {',
                '        this.foobar();',
                '    },',
                '    foobar: function() {',
                '        this.foobar();',
                '    },',
                '}',
            ], {}, (viewModel, model) => {
                viewModel.setHiddenAreas([
                    new range_1.Range(3, 1, 3, 1),
                    new range_1.Range(6, 1, 6, 1),
                    new range_1.Range(9, 1, 9, 1),
                ]);
                model.applyEdits([
                    { range: new range_1.Range(4, 7, 4, 7), text: '\n    ' },
                    { range: new range_1.Range(7, 7, 7, 7), text: '\n    ' },
                    { range: new range_1.Range(10, 7, 10, 7), text: '\n    ' }
                ]);
                assert.strictEqual(viewModel.getLineCount(), 11);
            });
        });
        test('normalizePosition with multiple touching injected text', () => {
            (0, testViewModel_1.testViewModel)([
                'just some text'
            ], {}, (viewModel, model) => {
                model.deltaDecorations([], [
                    {
                        range: new range_1.Range(1, 8, 1, 8),
                        options: {
                            description: 'test',
                            before: {
                                content: 'bar'
                            },
                            showIfCollapsed: true
                        }
                    },
                    {
                        range: new range_1.Range(1, 8, 1, 8),
                        options: {
                            description: 'test',
                            before: {
                                content: 'bz'
                            },
                            showIfCollapsed: true
                        }
                    },
                ]);
                // just sobarbzme text
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 8), 2 /* PositionAffinity.None */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 9), 2 /* PositionAffinity.None */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 11), 2 /* PositionAffinity.None */), new position_1.Position(1, 11));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 12), 2 /* PositionAffinity.None */), new position_1.Position(1, 11));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 13), 2 /* PositionAffinity.None */), new position_1.Position(1, 13));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 8), 0 /* PositionAffinity.Left */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 9), 0 /* PositionAffinity.Left */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 11), 0 /* PositionAffinity.Left */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 12), 0 /* PositionAffinity.Left */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 13), 0 /* PositionAffinity.Left */), new position_1.Position(1, 8));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 8), 1 /* PositionAffinity.Right */), new position_1.Position(1, 13));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 9), 1 /* PositionAffinity.Right */), new position_1.Position(1, 13));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 11), 1 /* PositionAffinity.Right */), new position_1.Position(1, 13));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 12), 1 /* PositionAffinity.Right */), new position_1.Position(1, 13));
                assert.deepStrictEqual(viewModel.normalizePosition(new position_1.Position(1, 13), 1 /* PositionAffinity.Right */), new position_1.Position(1, 13));
            });
        });
        test('issue #193262: Incorrect implementation of modifyPosition', () => {
            (0, testViewModel_1.testViewModel)([
                'just some text'
            ], {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 5
            }, (viewModel, model) => {
                assert.deepStrictEqual(new position_1.Position(3, 1), viewModel.modifyPosition(new position_1.Position(3, 2), -1));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsSW1wbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL3ZpZXdNb2RlbC92aWV3TW9kZWxJbXBsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFFdkIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx5RUFBeUUsRUFBRSxHQUFHLEVBQUU7WUFDcEYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixNQUFNLElBQUksR0FBRztnQkFDWixtQkFBbUIsRUFBRSxDQUFDO2FBQ3RCLENBQUM7WUFDRixJQUFBLDZCQUFhLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWhELFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFL0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNqQixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM1QixJQUFJLEVBQUU7NEJBQ0wsUUFBUTs0QkFDUixRQUFROzRCQUNSLFFBQVE7NEJBQ1IsUUFBUTs0QkFDUixRQUFROzRCQUNSLFFBQVE7NEJBQ1IsUUFBUTs0QkFDUixRQUFROzRCQUNSLFFBQVE7NEJBQ1IsUUFBUTt5QkFDUixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7cUJBQ1osQ0FBQyxDQUFDLENBQUM7Z0JBRUosTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5RUFBeUUsRUFBRSxHQUFHLEVBQUU7WUFDcEYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixJQUFBLDZCQUFhLEVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWhELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0IsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDNUIsSUFBSSxFQUFFLFdBQVc7cUJBQ2pCLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWhCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0IsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDNUIsSUFBSSxFQUFFLFdBQVc7cUJBQ2pCLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWhCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0IsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDNUIsSUFBSSxFQUFFLFdBQVc7cUJBQ2pCLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWhCLE1BQU0sYUFBYSxHQUFhLEVBQUUsQ0FBQztnQkFFbkMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxLQUFNLFNBQVEsbUNBQWdCO29CQUM3QyxZQUFZLENBQUMsTUFBbUI7d0JBQ3hDLHdCQUF3Qjt3QkFDeEIsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDOUMsQ0FBQztpQkFDRCxDQUFDO2dCQUNGLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDNUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNiLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBRTdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZELFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDL0MsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1lBQ3hELE1BQU0sSUFBSSxHQUFHO2dCQUNaLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2FBQ1AsQ0FBQztZQUNGLElBQUEsNkJBQWEsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEQsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLElBQUksR0FBRztnQkFDWixFQUFFO2FBQ0YsQ0FBQztZQUNGLElBQUEsNkJBQWEsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFaEQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUM3QixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM1QixJQUFJLEVBQUUscUJBQXFCO3FCQUMzQixDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVoQixTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFaEQsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsd0JBQXdCLENBQUMsSUFBYyxFQUFFLE1BQWUsRUFBRSx1QkFBZ0MsRUFBRSxRQUEyQjtZQUMvSCxJQUFBLDZCQUFhLEVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDNUMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDcEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQUc7WUFDbEIsRUFBRTtZQUNGLE9BQU87WUFDUCxPQUFPO1lBQ1AsT0FBTztZQUNQLEVBQUU7U0FDRixDQUFDO1FBRUYsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNuQyx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQixFQUNELEtBQUssRUFDTCxFQUFFLENBQ0YsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUM3RCx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQixFQUNELElBQUksRUFDSixTQUFTLENBQ1QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNuQyx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQixFQUNELEtBQUssRUFDTCxNQUFNLENBQ04sQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUM3RCx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQixFQUNELElBQUksRUFDSixNQUFNLENBQ04sQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNuQyx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckIsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3JCLEVBQ0QsS0FBSyxFQUNMLEVBQUUsQ0FDRixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzdELHdCQUF3QixDQUN2QixVQUFVLEVBQ1Y7Z0JBQ0MsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDckIsRUFDRCxJQUFJLEVBQ0osZ0JBQWdCLENBQ2hCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7WUFDbkMsd0JBQXdCLENBQ3ZCLFVBQVUsRUFDVjtnQkFDQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3JCLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQixFQUNELEtBQUssRUFDTCxNQUFNLENBQ04sQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUM3RCx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckIsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3JCLEVBQ0QsSUFBSSxFQUNKLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUNqQixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1lBQ25DLHdCQUF3QixDQUN2QixVQUFVLEVBQ1Y7Z0JBQ0MsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDckIsRUFDRCxLQUFLLEVBQ0wsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQ2hCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7WUFDNUMsd0JBQXdCLENBQ3ZCLFVBQVUsRUFDVjtnQkFDQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3JCLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQixFQUNELEtBQUssRUFDTCxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FDaEIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUM3RCx3QkFBd0IsQ0FDdkIsVUFBVSxFQUNWO2dCQUNDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckIsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDckIsRUFDRCxJQUFJLEVBQ0osZ0JBQWdCLENBQ2hCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7WUFDcEUsSUFBQSw2QkFBYSxFQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ2xELEtBQUssQ0FBQyxNQUFNLDhCQUFzQixDQUFDO2dCQUNuQyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDakYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhGQUE4RixFQUFFLEdBQUcsRUFBRTtZQUN6RyxJQUFBLDZCQUFhLEVBQ1o7Z0JBQ0MsU0FBUztnQkFDVCwwQkFBMEI7Z0JBQzFCLHdCQUF3QjtnQkFDeEIsUUFBUTtnQkFDUiwwQkFBMEI7Z0JBQzFCLHdCQUF3QjtnQkFDeEIsUUFBUTtnQkFDUiwwQkFBMEI7Z0JBQzFCLHdCQUF3QjtnQkFDeEIsUUFBUTtnQkFDUixHQUFHO2FBQ0gsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQzNCLFNBQVMsQ0FBQyxjQUFjLENBQUM7b0JBQ3hCLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDckIsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3JCLENBQUMsQ0FBQztnQkFFSCxLQUFLLENBQUMsVUFBVSxDQUFDO29CQUNoQixFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO29CQUNoRCxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO29CQUNoRCxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO2lCQUNsRCxDQUFDLENBQUM7Z0JBRUgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3REFBd0QsRUFBRSxHQUFHLEVBQUU7WUFDbkUsSUFBQSw2QkFBYSxFQUNaO2dCQUNDLGdCQUFnQjthQUNoQixFQUNELEVBQUUsRUFDRixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDcEIsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRTtvQkFDMUI7d0JBQ0MsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDNUIsT0FBTyxFQUFFOzRCQUNSLFdBQVcsRUFBRSxNQUFNOzRCQUNuQixNQUFNLEVBQUU7Z0NBQ1AsT0FBTyxFQUFFLEtBQUs7NkJBQ2Q7NEJBQ0QsZUFBZSxFQUFFLElBQUk7eUJBQ3JCO3FCQUNEO29CQUNEO3dCQUNDLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzVCLE9BQU8sRUFBRTs0QkFDUixXQUFXLEVBQUUsTUFBTTs0QkFDbkIsTUFBTSxFQUFFO2dDQUNQLE9BQU8sRUFBRSxJQUFJOzZCQUNiOzRCQUNELGVBQWUsRUFBRSxJQUFJO3lCQUNyQjtxQkFDRDtpQkFDRCxDQUFDLENBQUM7Z0JBRUgsc0JBQXNCO2dCQUV0QixNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxnQ0FBd0IsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ILE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdDQUF3QixFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZ0NBQXdCLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNySCxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxnQ0FBd0IsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JILE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGdDQUF3QixFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsZ0NBQXdCLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuSCxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxnQ0FBd0IsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ILE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGdDQUF3QixFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZ0NBQXdCLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwSCxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxnQ0FBd0IsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXBILE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlDQUF5QixFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsaUNBQXlCLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNySCxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQ0FBeUIsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RILE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGlDQUF5QixFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsaUNBQXlCLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZILENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkRBQTJELEVBQUUsR0FBRyxFQUFFO1lBQ3RFLElBQUEsNkJBQWEsRUFDWjtnQkFDQyxnQkFBZ0I7YUFDaEIsRUFDRDtnQkFDQyxRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixjQUFjLEVBQUUsQ0FBQzthQUNqQixFQUNELENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNwQixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNsQixTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDaEQsQ0FBQztZQUNILENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9