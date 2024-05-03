/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, utils_1, editOperation_1, position_1, range_1, selection_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testCommand(lines, selections, edits, expectedLines, expectedSelections) {
        (0, testCodeEditor_1.withTestCodeEditor)(lines, {}, (editor, viewModel) => {
            const model = editor.getModel();
            viewModel.setSelections('tests', selections);
            model.applyEdits(edits);
            assert.deepStrictEqual(model.getLinesContent(), expectedLines);
            const actualSelections = viewModel.getSelections();
            assert.deepStrictEqual(actualSelections.map(s => s.toString()), expectedSelections.map(s => s.toString()));
        });
    }
    suite('Editor Side Editing - collapsed selection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('replace at selection', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 1)], [
                editOperation_1.EditOperation.replace(new selection_1.Selection(1, 1, 1, 1), 'something ')
            ], [
                'something first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 11, 1, 11)]);
        });
        test('replace at selection 2', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 6)], [
                editOperation_1.EditOperation.replace(new selection_1.Selection(1, 1, 1, 6), 'something')
            ], [
                'something',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 10)]);
        });
        test('insert at selection', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 1)], [
                editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'something ')
            ], [
                'something first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 11, 1, 11)]);
        });
        test('insert at selection sitting on max column', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 6, 1, 6)], [
                editOperation_1.EditOperation.insert(new position_1.Position(1, 6), ' something\nnew ')
            ], [
                'first something',
                'new ',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(2, 5, 2, 5)]);
        });
        test('issue #3994: replace on top of selection', () => {
            testCommand([
                '$obj = New-Object "system.col"'
            ], [new selection_1.Selection(1, 30, 1, 30)], [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 19, 1, 31), '"System.Collections"')
            ], [
                '$obj = New-Object "System.Collections"'
            ], [new selection_1.Selection(1, 39, 1, 39)]);
        });
        test('issue #15267: Suggestion that adds a line - cursor goes to the wrong line ', () => {
            testCommand([
                'package main',
                '',
                'import (',
                '	"fmt"',
                ')',
                '',
                'func main(',
                '	fmt.Println(strings.Con)',
                '}'
            ], [new selection_1.Selection(8, 25, 8, 25)], [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(5, 1, 5, 1), '\t\"strings\"\n')
            ], [
                'package main',
                '',
                'import (',
                '	"fmt"',
                '	"strings"',
                ')',
                '',
                'func main(',
                '	fmt.Println(strings.Con)',
                '}'
            ], [new selection_1.Selection(9, 25, 9, 25)]);
        });
        test('issue #15236: Selections broke after deleting text using vscode.TextEditor.edit ', () => {
            testCommand([
                'foofoofoo, foofoofoo, bar'
            ], [new selection_1.Selection(1, 1, 1, 10), new selection_1.Selection(1, 12, 1, 21)], [
                editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 10), ''),
                editOperation_1.EditOperation.replace(new range_1.Range(1, 12, 1, 21), ''),
            ], [
                ', , bar'
            ], [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 3, 1, 3)]);
        });
    });
    suite('SideEditing', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const LINES = [
            'My First Line',
            'My Second Line',
            'Third Line'
        ];
        function _runTest(selection, editRange, editText, editForceMoveMarkers, expected, msg) {
            (0, testCodeEditor_1.withTestCodeEditor)(LINES.join('\n'), {}, (editor, viewModel) => {
                viewModel.setSelections('tests', [selection]);
                editor.getModel().applyEdits([{
                        range: editRange,
                        text: editText,
                        forceMoveMarkers: editForceMoveMarkers
                    }]);
                const actual = viewModel.getSelection();
                assert.deepStrictEqual(actual.toString(), expected.toString(), msg);
            });
        }
        function runTest(selection, editRange, editText, expected) {
            const sel1 = new selection_1.Selection(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            _runTest(sel1, editRange, editText, false, expected[0][0], '0-0-regular-no-force');
            _runTest(sel1, editRange, editText, true, expected[1][0], '1-0-regular-force');
            // RTL selection
            const sel2 = new selection_1.Selection(selection.endLineNumber, selection.endColumn, selection.startLineNumber, selection.startColumn);
            _runTest(sel2, editRange, editText, false, expected[0][1], '0-1-inverse-no-force');
            _runTest(sel2, editRange, editText, true, expected[1][1], '1-1-inverse-force');
        }
        suite('insert', () => {
            suite('collapsed sel', () => {
                test('before', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 3), 'xx', [
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('equal', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 4), 'xx', [
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('after', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 5), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('before', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 3), 'xx', [
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 4), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('inside', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 5), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                    ]);
                });
                test('end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 9), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                    ]);
                });
                test('after', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 10), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
        suite('delete', () => {
            suite('collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 1, 1, 3), '', [
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 2, 1, 4), '', [
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 5), '', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start >= range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 6), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 7), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 1, 1, 3), '', [
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 2, 1, 4), '', [
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                    ]);
                });
                test('edit.start < range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 5), '', [
                        [new selection_1.Selection(1, 3, 1, 7), new selection_1.Selection(1, 7, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 7), new selection_1.Selection(1, 7, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 9), '', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 10), '', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start == range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 6), '', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                    ]);
                });
                test('edit.start == range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 9), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start == range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 10), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 7), '', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 9), '', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 10), '', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                    ]);
                });
                test('edit.start == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 11), '', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 11), '', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
        suite('replace short', () => {
            suite('collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 1, 1, 3), 'c', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 2, 1, 4), 'c', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 5), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start >= range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 6), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 5), new selection_1.Selection(1, 5, 1, 5)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 7), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 1, 1, 3), 'c', [
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 2, 1, 4), 'c', [
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 5), 'c', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                    ]);
                });
                test('edit.start < range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 9), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 10), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start == range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 6), 'c', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 8), new selection_1.Selection(1, 8, 1, 5)],
                    ]);
                });
                test('edit.start == range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 9), 'c', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 5), new selection_1.Selection(1, 5, 1, 5)],
                    ]);
                });
                test('edit.start == range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 10), 'c', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 5), new selection_1.Selection(1, 5, 1, 5)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 7), 'c', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 9), 'c', [
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 10), 'c', [
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                    ]);
                });
                test('edit.start == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 11), 'c', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 10), new selection_1.Selection(1, 10, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 11), 'c', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
        suite('replace long', () => {
            suite('collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 1, 1, 3), 'cccc', [
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 2, 1, 4), 'cccc', [
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 5), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 7, 1, 7)],
                    ]);
                });
                test('edit.start >= range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 6), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(1, 8, 1, 8)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 7), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 1, 1, 3), 'cccc', [
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 2, 1, 4), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('edit.start < range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 5), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 11), new selection_1.Selection(1, 11, 1, 7)],
                    ]);
                });
                test('edit.start < range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 9), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 7, 1, 7)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 10), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 7, 1, 7)],
                    ]);
                });
                test('edit.start == range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 6), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 11), new selection_1.Selection(1, 11, 1, 8)],
                    ]);
                });
                test('edit.start == range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 9), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(1, 8, 1, 8)],
                    ]);
                });
                test('edit.start == range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 10), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(1, 8, 1, 8)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 7), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 9), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 10), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
                test('edit.start == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 11), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 13), new selection_1.Selection(1, 13, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 11), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZUVkaXRpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9jb21tYW5kcy9zaWRlRWRpdGluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLFNBQVMsV0FBVyxDQUFDLEtBQWUsRUFBRSxVQUF1QixFQUFFLEtBQTZCLEVBQUUsYUFBdUIsRUFBRSxrQkFBK0I7UUFDckosSUFBQSxtQ0FBa0IsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ25ELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQztZQUVqQyxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU3QyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXhCLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRS9ELE1BQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU1RyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxLQUFLLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1FBRXZELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENB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QUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQ3pCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtvQkFDcEMsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQ3pCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtvQkFDN0QsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQ3pCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtvQkFDcEMsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQ3pCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxD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RSxHQUFHLEVBQUU7b0JBQy9ELE9BQU8sQ0FDTixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDckIsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUN6Qjt3QkFDQyxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3RELENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDdEQsQ0FDRCxDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxtREFBbUQsRUFBRSxHQUFHLEVBQUU7b0JBQzlELE9BQU8sQ0FDTixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDckIsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUMxQjt3QkFDQyxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3RELENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMs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QyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtvQkFDcEMsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtvQkFDN0QsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtvQkFDOUQsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtvQkFDN0QsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQzNCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtvQkFDOUQsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsRUFBRTtvQkFDL0QsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtvQkFDOUQsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQzNCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLDRFQUE0RSxFQUFFLEdBQUcsRUFBRTtvQkFDdkYsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLDZFQUE2RSxFQUFFLEdBQUcsRUFBRTtvQkFDeEYsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQzFCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLDRFQUE0RSxFQUFFLEdBQUcsRUFBRTtvQkFDdkYsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQzNCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEQsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN0RCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtvQkFDcEMsT0FBTyxDQUNOLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQzNCO3dCQUNDLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxF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