/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/model/textModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, coreCommands_1, editOperation_1, position_1, range_1, selection_1, languages_1, language_1, languageConfiguration_1, languageConfigurationRegistry_1, nullTokenize_1, textModel_1, testCodeEditor_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- utils
    function moveTo(editor, viewModel, lineNumber, column, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.MoveToSelect.runCoreEditorCommand(viewModel, {
                position: new position_1.Position(lineNumber, column)
            });
        }
        else {
            coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, {
                position: new position_1.Position(lineNumber, column)
            });
        }
    }
    function moveLeft(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorLeftSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorLeft.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveRight(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorRightSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorRight.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveDown(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorDownSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorDown.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveUp(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorUpSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorUp.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToBeginningOfLine(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorHomeSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorHome.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToEndOfLine(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorEndSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorEnd.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToBeginningOfBuffer(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorTopSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorTop.runCoreEditorCommand(viewModel, {});
        }
    }
    function moveToEndOfBuffer(editor, viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorBottomSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorBottom.runCoreEditorCommand(viewModel, {});
        }
    }
    function assertCursor(viewModel, what) {
        let selections;
        if (what instanceof position_1.Position) {
            selections = [new selection_1.Selection(what.lineNumber, what.column, what.lineNumber, what.column)];
        }
        else if (what instanceof selection_1.Selection) {
            selections = [what];
        }
        else {
            selections = what;
        }
        const actual = viewModel.getSelections().map(s => s.toString());
        const expected = selections.map(s => s.toString());
        assert.deepStrictEqual(actual, expected);
    }
    suite('Editor Controller - Cursor', () => {
        const LINE1 = '    \tMy First Line\t ';
        const LINE2 = '\tMy Second Line';
        const LINE3 = '    Third Line🐶';
        const LINE4 = '';
        const LINE5 = '1';
        const TEXT = LINE1 + '\r\n' +
            LINE2 + '\n' +
            LINE3 + '\n' +
            LINE4 + '\r\n' +
            LINE5;
        function runTest(callback) {
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                callback(editor, viewModel);
            });
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('cursor initialized', () => {
            runTest((editor, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        // --------- absolute move
        test('no move', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2);
                assertCursor(viewModel, new position_1.Position(1, 2));
            });
        });
        test('move in selection mode', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 1, 2));
            });
        });
        test('move beyond line end', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 25);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move empty line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 4, 20);
                assertCursor(viewModel, new position_1.Position(4, 1));
            });
        });
        test('move one char line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 20);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        test('selection down', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
            });
        });
        test('move and then select', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 3);
                assertCursor(viewModel, new position_1.Position(2, 3));
                moveTo(editor, viewModel, 2, 15, true);
                assertCursor(viewModel, new selection_1.Selection(2, 3, 2, 15));
                moveTo(editor, viewModel, 1, 2, true);
                assertCursor(viewModel, new selection_1.Selection(2, 3, 1, 2));
            });
        });
        // --------- move left
        test('move left on top left position', () => {
            runTest((editor, viewModel) => {
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move left', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                assertCursor(viewModel, new position_1.Position(1, 3));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 2));
            });
        });
        test('move left with surrogate pair', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 17);
                assertCursor(viewModel, new position_1.Position(3, 17));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 15));
            });
        });
        test('move left goes to previous row', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                assertCursor(viewModel, new position_1.Position(2, 1));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 21));
            });
        });
        test('move left selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                assertCursor(viewModel, new position_1.Position(2, 1));
                moveLeft(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(2, 1, 1, 21));
            });
        });
        // --------- move right
        test('move right on bottom right position', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 2);
                assertCursor(viewModel, new position_1.Position(5, 2));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        test('move right', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                assertCursor(viewModel, new position_1.Position(1, 3));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 4));
            });
        });
        test('move right with surrogate pair', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 15);
                assertCursor(viewModel, new position_1.Position(3, 15));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 17));
            });
        });
        test('move right goes to next row', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 21);
                assertCursor(viewModel, new position_1.Position(1, 21));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
            });
        });
        test('move right selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 21);
                assertCursor(viewModel, new position_1.Position(1, 21));
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 21, 2, 1));
            });
        });
        // --------- move down
        test('move down', () => {
            runTest((editor, viewModel) => {
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        test('move down with selection', () => {
            runTest((editor, viewModel) => {
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 3, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 4, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 5, 1));
                moveDown(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 5, 2));
            });
        });
        test('move down with tabs', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                assertCursor(viewModel, new position_1.Position(1, 5));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
            });
        });
        // --------- move up
        test('move up', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 5);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 5));
            });
        });
        test('move up with selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 5);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveUp(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 2, 2));
                moveUp(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 1, 5));
            });
        });
        test('move up and down with tabs', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                assertCursor(viewModel, new position_1.Position(1, 5));
                moveDown(editor, viewModel);
                moveDown(editor, viewModel);
                moveDown(editor, viewModel);
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 5));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 5));
            });
        });
        test('move up and down with end of lines starting from a long one', () => {
            runTest((editor, viewModel) => {
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, LINE2.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, LINE3.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, LINE4.length + 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
                moveUp(editor, viewModel);
                moveUp(editor, viewModel);
                moveUp(editor, viewModel);
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('issue #44465: cursor position not correct when move', () => {
            runTest((editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                // going once up on the first line remembers the offset visual columns
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 2));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 5));
                // going twice up on the first line discards the offset visual columns
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
            });
        });
        test('issue #144041: Cursor up/down works', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'Word1 Word2 Word3 Word4',
                'Word5 Word6 Word7 Word8',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, { wrappingIndent: 'indent', wordWrap: 'wordWrapColumn', wordWrapColumn: 20 }, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                const cursorPositions = [];
                function reportCursorPosition() {
                    cursorPositions.push(viewModel.getCursorStates()[0].viewState.position.toString());
                }
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                assert.deepStrictEqual(cursorPositions, [
                    '(1,1)',
                    '(2,5)',
                    '(3,1)',
                    '(4,5)',
                    '(4,10)',
                    '(3,1)',
                    '(2,5)',
                    '(1,1)',
                    '(1,1)',
                ]);
            });
            model.dispose();
        });
        test('issue #140195: Cursor up/down makes progress', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'Word1 Word2 Word3 Word4',
                'Word5 Word6 Word7 Word8',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, { wrappingIndent: 'indent', wordWrap: 'wordWrapColumn', wordWrapColumn: 20 }, (editor, viewModel) => {
                editor.changeDecorations((changeAccessor) => {
                    changeAccessor.deltaDecorations([], [
                        {
                            range: new range_1.Range(1, 22, 1, 22),
                            options: {
                                showIfCollapsed: true,
                                description: 'test',
                                after: {
                                    content: 'some very very very very very very very very long text',
                                }
                            }
                        }
                    ]);
                });
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                const cursorPositions = [];
                function reportCursorPosition() {
                    cursorPositions.push(viewModel.getCursorStates()[0].viewState.position.toString());
                }
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, editor, null);
                reportCursorPosition();
                assert.deepStrictEqual(cursorPositions, [
                    '(1,1)',
                    '(2,5)',
                    '(5,19)',
                    '(6,1)',
                    '(7,5)',
                    '(6,1)',
                    '(2,8)',
                    '(1,1)',
                    '(1,1)',
                ]);
            });
            model.dispose();
        });
        // --------- move to beginning of line
        test('move to beginning of line', () => {
            runTest((editor, viewModel) => {
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 6));
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of line from within line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 6));
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of line from whitespace at beginning of line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2);
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 6));
                moveToBeginningOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of line from within line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveToBeginningOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 6));
                moveToBeginningOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 1));
            });
        });
        test('move to beginning of line with selection multiline forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('move to beginning of line with selection multiline backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 1, 8, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
            });
        });
        test('move to beginning of line with selection single line forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 2);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('move to beginning of line with selection single line backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 3, 2, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('issue #15401: "End" key is behaving weird when text is selected part 1', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 3, 5));
            });
        });
        test('issue #17011: Shift+home/end now go to the end of the selection start\'s line, not the selection\'s end', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 8);
                moveTo(editor, viewModel, 3, 9, true);
                moveToBeginningOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 3, 5));
            });
        });
        // --------- move to end of line
        test('move to end of line', () => {
            runTest((editor, viewModel) => {
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move to end of line from within line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 6);
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move to end of line from whitespace at end of line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 20);
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, LINE1.length + 1));
            });
        });
        test('move to end of line from within line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 6);
                moveToEndOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, LINE1.length + 1));
                moveToEndOfLine(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, LINE1.length + 1));
            });
        });
        test('move to end of line with selection multiline forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1);
                moveTo(editor, viewModel, 3, 9, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        test('move to end of line with selection multiline backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 1, 1, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(1, 21, 1, 21));
            });
        });
        test('move to end of line with selection single line forward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 1);
                moveTo(editor, viewModel, 3, 9, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        test('move to end of line with selection single line backward', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 9);
                moveTo(editor, viewModel, 3, 1, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        test('issue #15401: "End" key is behaving weird when text is selected part 2', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1);
                moveTo(editor, viewModel, 3, 9, true);
                moveToEndOfLine(editor, viewModel, false);
                assertCursor(viewModel, new selection_1.Selection(3, 17, 3, 17));
            });
        });
        // --------- move to beginning of buffer
        test('move to beginning of buffer', () => {
            runTest((editor, viewModel) => {
                moveToBeginningOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of buffer from within first line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                moveToBeginningOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of buffer from within another line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToBeginningOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('move to beginning of buffer from within first line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 1, 3);
                moveToBeginningOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 1));
            });
        });
        test('move to beginning of buffer from within another line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToBeginningOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 1, 1));
            });
        });
        // --------- move to end of buffer
        test('move to end of buffer', () => {
            runTest((editor, viewModel) => {
                moveToEndOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within last line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 1);
                moveToEndOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within another line', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToEndOfBuffer(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within last line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 5, 1);
                moveToEndOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, LINE5.length + 1));
            });
        });
        test('move to end of buffer from within another line selection', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                moveToEndOfBuffer(editor, viewModel, true);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 5, LINE5.length + 1));
            });
        });
        // --------- misc
        test('select all', () => {
            runTest((editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.SelectAll.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, new selection_1.Selection(1, 1, 5, LINE5.length + 1));
            });
        });
        // --------- eventing
        test('no move doesn\'t trigger event', () => {
            runTest((editor, viewModel) => {
                const disposable = viewModel.onEvent((e) => {
                    assert.ok(false, 'was not expecting event');
                });
                moveTo(editor, viewModel, 1, 1);
                disposable.dispose();
            });
        });
        test('move eventing', () => {
            runTest((editor, viewModel) => {
                let events = 0;
                const disposable = viewModel.onEvent((e) => {
                    if (e.kind === 6 /* OutgoingViewModelEventKind.CursorStateChanged */) {
                        events++;
                        assert.deepStrictEqual(e.selections, [new selection_1.Selection(1, 2, 1, 2)]);
                    }
                });
                moveTo(editor, viewModel, 1, 2);
                assert.strictEqual(events, 1, 'receives 1 event');
                disposable.dispose();
            });
        });
        test('move in selection mode eventing', () => {
            runTest((editor, viewModel) => {
                let events = 0;
                const disposable = viewModel.onEvent((e) => {
                    if (e.kind === 6 /* OutgoingViewModelEventKind.CursorStateChanged */) {
                        events++;
                        assert.deepStrictEqual(e.selections, [new selection_1.Selection(1, 1, 1, 2)]);
                    }
                });
                moveTo(editor, viewModel, 1, 2, true);
                assert.strictEqual(events, 1, 'receives 1 event');
                disposable.dispose();
            });
        });
        // --------- state save & restore
        test('saveState & restoreState', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 1, true);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
                const savedState = JSON.stringify(viewModel.saveCursorState());
                moveTo(editor, viewModel, 1, 1, false);
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.restoreCursorState(JSON.parse(savedState));
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 1));
            });
        });
        // --------- updating cursor
        test('Independent model edit 1', () => {
            runTest((editor, viewModel) => {
                moveTo(editor, viewModel, 2, 16, true);
                editor.getModel().applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(2, 1, 2, 2))]);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 2, 15));
            });
        });
        test('column select 1', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '\tprivate compute(a:number): boolean {',
                '\t\tif (a + 3 === 0 || a + 5 === 0) {',
                '\t\t\treturn false;',
                '\t\t}',
                '\t}'
            ], {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new position_1.Position(1, 7));
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(4, 4),
                    viewPosition: new position_1.Position(4, 4),
                    mouseColumn: 15,
                    doColumnSelect: true
                });
                const expectedSelections = [
                    new selection_1.Selection(1, 7, 1, 12),
                    new selection_1.Selection(2, 4, 2, 9),
                    new selection_1.Selection(3, 3, 3, 6),
                    new selection_1.Selection(4, 4, 4, 4),
                ];
                assertCursor(viewModel, expectedSelections);
            });
        });
        test('grapheme breaking', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'abcabc',
                'ãããããã',
                '辻󠄀辻󠄀辻󠄀',
                'பு',
            ], {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 1, 2, 1)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 3));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 1));
                viewModel.setSelections('test', [new selection_1.Selection(3, 1, 3, 1)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 4));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 1));
                viewModel.setSelections('test', [new selection_1.Selection(4, 1, 4, 1)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 3));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(4, 1));
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 5));
                moveDown(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(3, 4));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(2, 5));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new position_1.Position(1, 3));
            });
        });
        test('issue #4905 - column select is biased to the right', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'var gulp = require("gulp");',
                'var path = require("path");',
                'var rimraf = require("rimraf");',
                'var isarray = require("isarray");',
                'var merge = require("merge-stream");',
                'var concat = require("gulp-concat");',
                'var newer = require("gulp-newer");',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 4, false);
                assertCursor(viewModel, new position_1.Position(1, 4));
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(4, 1),
                    viewPosition: new position_1.Position(4, 1),
                    mouseColumn: 1,
                    doColumnSelect: true
                });
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 1),
                    new selection_1.Selection(2, 4, 2, 1),
                    new selection_1.Selection(3, 4, 3, 1),
                    new selection_1.Selection(4, 4, 4, 1),
                ]);
            });
        });
        test('issue #20087: column select with mouse', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" Key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SoMEKEy" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" valuE="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="00X"/>',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 10, 10, false);
                assertCursor(viewModel, new position_1.Position(10, 10));
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(1, 1),
                    viewPosition: new position_1.Position(1, 1),
                    mouseColumn: 1,
                    doColumnSelect: true
                });
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 1),
                    new selection_1.Selection(9, 10, 9, 1),
                    new selection_1.Selection(8, 10, 8, 1),
                    new selection_1.Selection(7, 10, 7, 1),
                    new selection_1.Selection(6, 10, 6, 1),
                    new selection_1.Selection(5, 10, 5, 1),
                    new selection_1.Selection(4, 10, 4, 1),
                    new selection_1.Selection(3, 10, 3, 1),
                    new selection_1.Selection(2, 10, 2, 1),
                    new selection_1.Selection(1, 10, 1, 1),
                ]);
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: new position_1.Position(1, 1),
                    viewPosition: new position_1.Position(1, 1),
                    mouseColumn: 1,
                    doColumnSelect: true
                });
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 1),
                    new selection_1.Selection(9, 10, 9, 1),
                    new selection_1.Selection(8, 10, 8, 1),
                    new selection_1.Selection(7, 10, 7, 1),
                    new selection_1.Selection(6, 10, 6, 1),
                    new selection_1.Selection(5, 10, 5, 1),
                    new selection_1.Selection(4, 10, 4, 1),
                    new selection_1.Selection(3, 10, 3, 1),
                    new selection_1.Selection(2, 10, 2, 1),
                    new selection_1.Selection(1, 10, 1, 1),
                ]);
            });
        });
        test('issue #20087: column select with keyboard', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" Key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SoMEKEy" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" valuE="000"/>',
                '<property id="SomeThing" key="SomeKey" value="000"/>',
                '<property id="SomeThing" key="SomeKey" value="00X"/>',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 10, 10, false);
                assertCursor(viewModel, new position_1.Position(10, 10));
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 8)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectUp.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9),
                    new selection_1.Selection(9, 10, 9, 9),
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(10, 10, 10, 9)
                ]);
            });
        });
        test('issue #118062: Column selection cannot select first position of a line', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'hello world',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 2, false);
                assertCursor(viewModel, new position_1.Position(1, 2));
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 2, 1, 1)
                ]);
            });
        });
        test('column select with keyboard', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'var gulp = require("gulp");',
                'var path = require("path");',
                'var rimraf = require("rimraf");',
                'var isarray = require("isarray");',
                'var merge = require("merge-stream");',
                'var concat = require("gulp-concat");',
                'var newer = require("gulp-newer");',
            ].join('\n'), {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 4, false);
                assertCursor(viewModel, new position_1.Position(1, 4));
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5),
                    new selection_1.Selection(2, 4, 2, 5)
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5),
                    new selection_1.Selection(2, 4, 2, 5),
                    new selection_1.Selection(3, 4, 3, 5),
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectDown.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 5),
                    new selection_1.Selection(2, 4, 2, 5),
                    new selection_1.Selection(3, 4, 3, 5),
                    new selection_1.Selection(4, 4, 4, 5),
                    new selection_1.Selection(5, 4, 5, 5),
                    new selection_1.Selection(6, 4, 6, 5),
                    new selection_1.Selection(7, 4, 7, 5),
                ]);
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 6),
                    new selection_1.Selection(2, 4, 2, 6),
                    new selection_1.Selection(3, 4, 3, 6),
                    new selection_1.Selection(4, 4, 4, 6),
                    new selection_1.Selection(5, 4, 5, 6),
                    new selection_1.Selection(6, 4, 6, 6),
                    new selection_1.Selection(7, 4, 7, 6),
                ]);
                // 10 times
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 16),
                    new selection_1.Selection(2, 4, 2, 16),
                    new selection_1.Selection(3, 4, 3, 16),
                    new selection_1.Selection(4, 4, 4, 16),
                    new selection_1.Selection(5, 4, 5, 16),
                    new selection_1.Selection(6, 4, 6, 16),
                    new selection_1.Selection(7, 4, 7, 16),
                ]);
                // 10 times
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 26),
                    new selection_1.Selection(2, 4, 2, 26),
                    new selection_1.Selection(3, 4, 3, 26),
                    new selection_1.Selection(4, 4, 4, 26),
                    new selection_1.Selection(5, 4, 5, 26),
                    new selection_1.Selection(6, 4, 6, 26),
                    new selection_1.Selection(7, 4, 7, 26),
                ]);
                // 2 times => reaching the ending of lines 1 and 2
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 28),
                    new selection_1.Selection(4, 4, 4, 28),
                    new selection_1.Selection(5, 4, 5, 28),
                    new selection_1.Selection(6, 4, 6, 28),
                    new selection_1.Selection(7, 4, 7, 28),
                ]);
                // 4 times => reaching the ending of line 3
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 32),
                    new selection_1.Selection(5, 4, 5, 32),
                    new selection_1.Selection(6, 4, 6, 32),
                    new selection_1.Selection(7, 4, 7, 32),
                ]);
                // 2 times => reaching the ending of line 4
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 34),
                    new selection_1.Selection(6, 4, 6, 34),
                    new selection_1.Selection(7, 4, 7, 34),
                ]);
                // 1 time => reaching the ending of line 7
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 35),
                    new selection_1.Selection(6, 4, 6, 35),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // 3 times => reaching the ending of lines 5 & 6
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 37),
                    new selection_1.Selection(6, 4, 6, 37),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // cannot go anywhere anymore
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 37),
                    new selection_1.Selection(6, 4, 6, 37),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // cannot go anywhere anymore even if we insist
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectRight.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 37),
                    new selection_1.Selection(6, 4, 6, 37),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
                // can easily go back
                coreCommands_1.CoreNavigationCommands.CursorColumnSelectLeft.runCoreEditorCommand(viewModel, {});
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 28),
                    new selection_1.Selection(2, 4, 2, 28),
                    new selection_1.Selection(3, 4, 3, 32),
                    new selection_1.Selection(4, 4, 4, 34),
                    new selection_1.Selection(5, 4, 5, 36),
                    new selection_1.Selection(6, 4, 6, 36),
                    new selection_1.Selection(7, 4, 7, 35),
                ]);
            });
        });
        test('setSelection / setPosition with source', () => {
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    return new languages_1.EncodedTokenizationResult(new Uint32Array(0), state);
                }
            };
            const LANGUAGE_ID = 'modelModeTest1';
            const languageRegistration = languages_1.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            const model = (0, testTextModel_1.createTextModel)('Just text', LANGUAGE_ID);
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor1, cursor1) => {
                let event = undefined;
                const disposable = editor1.onDidChangeCursorPosition(e => {
                    event = e;
                });
                editor1.setSelection(new range_1.Range(1, 2, 1, 3), 'navigation');
                assert.strictEqual(event.source, 'navigation');
                event = undefined;
                editor1.setPosition(new position_1.Position(1, 2), 'navigation');
                assert.strictEqual(event.source, 'navigation');
                disposable.dispose();
            });
            languageRegistration.dispose();
            model.dispose();
        });
    });
    suite('Editor Controller', () => {
        const surroundingLanguageId = 'surroundingLanguage';
        const indentRulesLanguageId = 'indentRulesLanguage';
        const electricCharLanguageId = 'electricCharLanguage';
        const autoClosingLanguageId = 'autoClosingLanguage';
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: surroundingLanguageId }));
            disposables.add(languageConfigurationService.register(surroundingLanguageId, {
                autoClosingPairs: [{ open: '(', close: ')' }]
            }));
            setupIndentRulesLanguage(indentRulesLanguageId, {
                decreaseIndentPattern: /^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
                increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
                indentNextLinePattern: /^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$)/,
                unIndentedLinePattern: /^(?!.*([;{}]|\S:)\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!.*(\{[^}"']*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$))/
            });
            disposables.add(languageService.registerLanguage({ id: electricCharLanguageId }));
            disposables.add(languageConfigurationService.register(electricCharLanguageId, {
                __electricCharacterSupport: {
                    docComment: { open: '/**', close: ' */' }
                },
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ]
            }));
            setupAutoClosingLanguage();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function setupOnEnterLanguage(indentAction) {
            const onEnterLanguageId = 'onEnterMode';
            disposables.add(languageService.registerLanguage({ id: onEnterLanguageId }));
            disposables.add(languageConfigurationService.register(onEnterLanguageId, {
                onEnterRules: [{
                        beforeText: /.*/,
                        action: {
                            indentAction: indentAction
                        }
                    }]
            }));
            return onEnterLanguageId;
        }
        function setupIndentRulesLanguage(languageId, indentationRules) {
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                indentationRules: indentationRules
            }));
            return languageId;
        }
        function setupAutoClosingLanguage() {
            disposables.add(languageService.registerLanguage({ id: autoClosingLanguageId }));
            disposables.add(languageConfigurationService.register(autoClosingLanguageId, {
                comments: {
                    blockComment: ['/*', '*/']
                },
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: '`', close: '`', notIn: ['string', 'comment'] },
                    { open: '/**', close: ' */', notIn: ['string'] },
                    { open: 'begin', close: 'end', notIn: ['string'] }
                ],
                __electricCharacterSupport: {
                    docComment: { open: '/**', close: ' */' }
                }
            }));
        }
        function setupAutoClosingLanguageTokenization() {
            class BaseState {
                constructor(parent = null) {
                    this.parent = parent;
                }
                clone() { return this; }
                equals(other) {
                    if (!(other instanceof BaseState)) {
                        return false;
                    }
                    if (!this.parent && !other.parent) {
                        return true;
                    }
                    if (!this.parent || !other.parent) {
                        return false;
                    }
                    return this.parent.equals(other.parent);
                }
            }
            class StringState {
                constructor(char, parentState) {
                    this.char = char;
                    this.parentState = parentState;
                }
                clone() { return this; }
                equals(other) { return other instanceof StringState && this.char === other.char && this.parentState.equals(other.parentState); }
            }
            class BlockCommentState {
                constructor(parentState) {
                    this.parentState = parentState;
                }
                clone() { return this; }
                equals(other) { return other instanceof StringState && this.parentState.equals(other.parentState); }
            }
            const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(autoClosingLanguageId);
            disposables.add(languages_1.TokenizationRegistry.register(autoClosingLanguageId, {
                getInitialState: () => new BaseState(),
                tokenize: undefined,
                tokenizeEncoded: function (line, hasEOL, _state) {
                    let state = _state;
                    const tokens = [];
                    const generateToken = (length, type, newState) => {
                        if (tokens.length > 0 && tokens[tokens.length - 1].type === type) {
                            // grow last tokens
                            tokens[tokens.length - 1].length += length;
                        }
                        else {
                            tokens.push({ length, type });
                        }
                        line = line.substring(length);
                        if (newState) {
                            state = newState;
                        }
                    };
                    while (line.length > 0) {
                        advance();
                    }
                    const result = new Uint32Array(tokens.length * 2);
                    let startIndex = 0;
                    for (let i = 0; i < tokens.length; i++) {
                        result[2 * i] = startIndex;
                        result[2 * i + 1] = ((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                            | (tokens[i].type << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */));
                        startIndex += tokens[i].length;
                    }
                    return new languages_1.EncodedTokenizationResult(result, state);
                    function advance() {
                        if (state instanceof BaseState) {
                            const m1 = line.match(/^[^'"`{}/]+/g);
                            if (m1) {
                                return generateToken(m1[0].length, 0 /* StandardTokenType.Other */);
                            }
                            if (/^['"`]/.test(line)) {
                                return generateToken(1, 2 /* StandardTokenType.String */, new StringState(line.charAt(0), state));
                            }
                            if (/^{/.test(line)) {
                                return generateToken(1, 0 /* StandardTokenType.Other */, new BaseState(state));
                            }
                            if (/^}/.test(line)) {
                                return generateToken(1, 0 /* StandardTokenType.Other */, state.parent || new BaseState());
                            }
                            if (/^\/\//.test(line)) {
                                return generateToken(line.length, 1 /* StandardTokenType.Comment */, state);
                            }
                            if (/^\/\*/.test(line)) {
                                return generateToken(2, 1 /* StandardTokenType.Comment */, new BlockCommentState(state));
                            }
                            return generateToken(1, 0 /* StandardTokenType.Other */, state);
                        }
                        else if (state instanceof StringState) {
                            const m1 = line.match(/^[^\\'"`\$]+/g);
                            if (m1) {
                                return generateToken(m1[0].length, 2 /* StandardTokenType.String */);
                            }
                            if (/^\\/.test(line)) {
                                return generateToken(2, 2 /* StandardTokenType.String */);
                            }
                            if (line.charAt(0) === state.char) {
                                return generateToken(1, 2 /* StandardTokenType.String */, state.parentState);
                            }
                            if (/^\$\{/.test(line)) {
                                return generateToken(2, 0 /* StandardTokenType.Other */, new BaseState(state));
                            }
                            return generateToken(1, 0 /* StandardTokenType.Other */, state);
                        }
                        else if (state instanceof BlockCommentState) {
                            const m1 = line.match(/^[^*]+/g);
                            if (m1) {
                                return generateToken(m1[0].length, 2 /* StandardTokenType.String */);
                            }
                            if (/^\*\//.test(line)) {
                                return generateToken(2, 1 /* StandardTokenType.Comment */, state.parentState);
                            }
                            return generateToken(1, 0 /* StandardTokenType.Other */, state);
                        }
                        else {
                            throw new Error(`unknown state`);
                        }
                    }
                }
            }));
        }
        function setAutoClosingLanguageEnabledSet(chars) {
            disposables.add(languageConfigurationService.register(autoClosingLanguageId, {
                autoCloseBefore: chars,
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: '`', close: '`', notIn: ['string', 'comment'] },
                    { open: '/**', close: ' */', notIn: ['string'] }
                ],
            }));
        }
        function createTextModel(text, languageId = null, options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, uri = null) {
            return disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId, options, uri));
        }
        function withTestCodeEditor(text, options, callback) {
            let model;
            if (typeof text === 'string') {
                model = createTextModel(text);
            }
            else if (Array.isArray(text)) {
                model = createTextModel(text.join('\n'));
            }
            else {
                model = text;
            }
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model, options));
            const viewModel = editor.getViewModel();
            viewModel.setHasFocus(true);
            callback(editor, viewModel);
        }
        function usingCursor(opts, callback) {
            const model = createTextModel(opts.text.join('\n'), opts.languageId, opts.modelOpts);
            const editorOptions = opts.editorOpts || {};
            withTestCodeEditor(model, editorOptions, (editor, viewModel) => {
                callback(editor, model, viewModel);
            });
        }
        let AutoClosingColumnType;
        (function (AutoClosingColumnType) {
            AutoClosingColumnType[AutoClosingColumnType["Normal"] = 0] = "Normal";
            AutoClosingColumnType[AutoClosingColumnType["Special1"] = 1] = "Special1";
            AutoClosingColumnType[AutoClosingColumnType["Special2"] = 2] = "Special2";
        })(AutoClosingColumnType || (AutoClosingColumnType = {}));
        function extractAutoClosingSpecialColumns(maxColumn, annotatedLine) {
            const result = [];
            for (let j = 1; j <= maxColumn; j++) {
                result[j] = 0 /* AutoClosingColumnType.Normal */;
            }
            let column = 1;
            for (let j = 0; j < annotatedLine.length; j++) {
                if (annotatedLine.charAt(j) === '|') {
                    result[column] = 1 /* AutoClosingColumnType.Special1 */;
                }
                else if (annotatedLine.charAt(j) === '!') {
                    result[column] = 2 /* AutoClosingColumnType.Special2 */;
                }
                else {
                    column++;
                }
            }
            return result;
        }
        function assertType(editor, model, viewModel, lineNumber, column, chr, expectedInsert, message) {
            const lineContent = model.getLineContent(lineNumber);
            const expected = lineContent.substr(0, column - 1) + expectedInsert + lineContent.substr(column - 1);
            moveTo(editor, viewModel, lineNumber, column);
            viewModel.type(chr, 'keyboard');
            assert.deepStrictEqual(model.getLineContent(lineNumber), expected, message);
            model.undo();
        }
        test('issue microsoft/monaco-editor#443: Indentation of a single row deletes selected text in some cases', () => {
            const model = createTextModel([
                'Hello world!',
                'another line'
            ].join('\n'), undefined, {
                insertSpaces: false
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 13)]);
                // Check that indenting maintains the selection start at column 1
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 1, 1, 14));
            });
        });
        test('Bug 9121: Auto indent + undo + redo is funky', () => {
            const model = createTextModel([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
                trimAutoWhitespace: false
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n', 'assert1');
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t', 'assert2');
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\t', 'assert3');
                viewModel.type('x');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\tx', 'assert4');
                coreCommands_1.CoreNavigationCommands.CursorLeft.runCoreEditorCommand(viewModel, {});
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\tx', 'assert5');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\nx', 'assert6');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\tx', 'assert7');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert8');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert9');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert10');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\nx', 'assert11');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\n\tx', 'assert12');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t\nx', 'assert13');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert14');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert15');
            });
        });
        test('issue #23539: Setting model EOL isn\'t undoable', () => {
            withTestCodeEditor([
                'Hello',
                'world'
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                assertCursor(viewModel, new position_1.Position(1, 1));
                model.setEOL(0 /* EndOfLineSequence.LF */);
                assert.strictEqual(model.getValue(), 'Hello\nworld');
                model.pushEOL(1 /* EndOfLineSequence.CRLF */);
                assert.strictEqual(model.getValue(), 'Hello\r\nworld');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'Hello\nworld');
            });
        });
        test('issue #47733: Undo mangles unicode characters', () => {
            const languageId = 'myMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                surroundingPairs: [{ open: '%', close: '%' }]
            }));
            const model = createTextModel('\'👁\'', languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelection(new selection_1.Selection(1, 1, 1, 2));
                viewModel.type('%', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '%\'%👁\'', 'assert1');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\'👁\'', 'assert2');
            });
        });
        test('issue #46208: Allow empty selections in the undo/redo stack', () => {
            const model = createTextModel('');
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.type('Hello', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type('world', 'keyboard');
                viewModel.type(' ', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'Hello world ');
                assertCursor(viewModel, new position_1.Position(1, 13));
                moveLeft(editor, viewModel);
                moveRight(editor, viewModel);
                model.pushEditOperations([], [editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 12, 1, 13), '')], () => []);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world ');
                assertCursor(viewModel, new selection_1.Selection(1, 13, 1, 13));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello');
                assertCursor(viewModel, new position_1.Position(1, 6));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '');
                assertCursor(viewModel, new position_1.Position(1, 1));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello');
                assertCursor(viewModel, new position_1.Position(1, 6));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world ');
                assertCursor(viewModel, new position_1.Position(1, 13));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'Hello world');
                assertCursor(viewModel, new position_1.Position(1, 12));
            });
        });
        test('bug #16815:Shift+Tab doesn\'t go back to tabstop', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.IndentOutdent);
            const model = createTextModel([
                '     function baz() {'
            ].join('\n'), languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 6, false);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
                coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    function baz() {');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
            });
        });
        test('Bug #18293:[regression][editor] Can\'t outdent whitespace line', () => {
            const model = createTextModel([
                '      '
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    ');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
            });
        });
        test('issue #95591: Unindenting moves cursor to beginning of line', () => {
            const model = createTextModel([
                '        '
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 9, false);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    ');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
            });
        });
        test('Bug #16657: [editor] Tab on empty line of zero indentation moves cursor to position (1,1)', () => {
            const model = createTextModel([
                'function baz() {',
                '\tfunction hello() { // something here',
                '\t',
                '',
                '\t}',
                '}',
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 7, 1, false);
                assertCursor(viewModel, new selection_1.Selection(7, 1, 7, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(7), '\t');
                assertCursor(viewModel, new selection_1.Selection(7, 2, 7, 2));
            });
        });
        test('bug #16740: [editor] Cut line doesn\'t quite cut the last line', () => {
            // Part 1 => there is text on the last line
            withTestCodeEditor([
                'asdasd',
                'qwerty'
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                moveTo(editor, viewModel, 2, 1, false);
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), 'asdasd');
            });
            // Part 2 => there is no text on the last line
            withTestCodeEditor([
                'asdasd',
                ''
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                moveTo(editor, viewModel, 2, 1, false);
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), 'asdasd');
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), '');
            });
        });
        test('issue #128602: When cutting multiple lines (ctrl x), the last line will not be erased', () => {
            withTestCodeEditor([
                'a1',
                'a2',
                'a3'
            ], {}, (editor, viewModel) => {
                const model = editor.getModel();
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 1),
                    new selection_1.Selection(2, 1, 2, 1),
                    new selection_1.Selection(3, 1, 3, 1),
                ]);
                viewModel.cut('keyboard');
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), '');
            });
        });
        test('Bug #11476: Double bracket surrounding + undo is broken', () => {
            usingCursor({
                text: [
                    'hello'
                ],
                languageId: surroundingLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 3, false);
                moveTo(editor, viewModel, 1, 5, true);
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 5));
                viewModel.type('(', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(1, 4, 1, 6));
                viewModel.type('(', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 7));
            });
        });
        test('issue #1140: Backspace stops prematurely', () => {
            const model = createTextModel([
                'function baz() {',
                '  return 1;',
                '};'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                moveTo(editor, viewModel, 1, 14, true);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 1, 14));
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assertCursor(viewModel, new selection_1.Selection(1, 14, 1, 14));
                assert.strictEqual(model.getLineCount(), 1);
                assert.strictEqual(model.getLineContent(1), 'function baz(;');
            });
        });
        test('issue #10212: Pasting entire line does not replace selection', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2'
                ],
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1, false);
                moveTo(editor, viewModel, 2, 6, true);
                viewModel.paste('line1\n', true);
                assert.strictEqual(model.getLineContent(1), 'line1');
                assert.strictEqual(model.getLineContent(2), 'line1');
                assert.strictEqual(model.getLineContent(3), '');
            });
        });
        test('issue #74722: Pasting whole line does not replace selection', () => {
            usingCursor({
                text: [
                    'line1',
                    'line sel 2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 6, 2, 9)]);
                viewModel.paste('line1\n', true);
                assert.strictEqual(model.getLineContent(1), 'line1');
                assert.strictEqual(model.getLineContent(2), 'line line1');
                assert.strictEqual(model.getLineContent(3), ' 2');
                assert.strictEqual(model.getLineContent(4), 'line3');
            });
        });
        test('issue #4996: Multiple cursor paste pastes contents of all cursors', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1)]);
                viewModel.paste('a\nb\nc\nd', false, [
                    'a\nb',
                    'c\nd'
                ]);
                assert.strictEqual(model.getValue(), [
                    'a',
                    'bline1',
                    'c',
                    'dline2',
                    'line3'
                ].join('\n'));
            });
        });
        test('issue #16155: Paste into multiple cursors has edge case when number of lines equals number of cursors - 1', () => {
            usingCursor({
                text: [
                    'test',
                    'test',
                    'test',
                    'test'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                ]);
                viewModel.paste('aaa\nbbb\nccc\n', false, null);
                assert.strictEqual(model.getValue(), [
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                    'aaa',
                    'bbb',
                    'ccc',
                    '',
                ].join('\n'));
            });
        });
        test('issue #43722: Multiline paste doesn\'t work anymore', () => {
            usingCursor({
                text: [
                    'test',
                    'test',
                    'test',
                    'test'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 5),
                    new selection_1.Selection(2, 1, 2, 5),
                    new selection_1.Selection(3, 1, 3, 5),
                    new selection_1.Selection(4, 1, 4, 5),
                ]);
                viewModel.paste('aaa\r\nbbb\r\nccc\r\nddd\r\n', false, null);
                assert.strictEqual(model.getValue(), [
                    'aaa',
                    'bbb',
                    'ccc',
                    'ddd',
                ].join('\n'));
            });
        });
        test('issue #46440: (1) Pasting a multi-line selection pastes entire selection into every insertion point', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1), new selection_1.Selection(3, 1, 3, 1)]);
                viewModel.paste('a\nb\nc', false, null);
                assert.strictEqual(model.getValue(), [
                    'aline1',
                    'bline2',
                    'cline3'
                ].join('\n'));
            });
        });
        test('issue #46440: (2) Pasting a multi-line selection pastes entire selection into every insertion point', () => {
            usingCursor({
                text: [
                    'line1',
                    'line2',
                    'line3'
                ],
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1), new selection_1.Selection(3, 1, 3, 1)]);
                viewModel.paste('a\nb\nc\n', false, null);
                assert.strictEqual(model.getValue(), [
                    'aline1',
                    'bline2',
                    'cline3'
                ].join('\n'));
            });
        });
        test('issue #3071: Investigate why undo stack gets corrupted', () => {
            const model = createTextModel([
                'some lines',
                'and more lines',
                'just some text',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 1, false);
                moveTo(editor, viewModel, 3, 4, true);
                let isFirst = true;
                const disposable = model.onDidChangeContent(() => {
                    if (isFirst) {
                        isFirst = false;
                        viewModel.type('\t', 'keyboard');
                    }
                });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    '\t just some text'
                ].join('\n'), '001');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    '    some lines',
                    '    and more lines',
                    '    just some text',
                ].join('\n'), '002');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    'some lines',
                    'and more lines',
                    'just some text',
                ].join('\n'), '003');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    'some lines',
                    'and more lines',
                    'just some text',
                ].join('\n'), '004');
                disposable.dispose();
            });
        });
        test('issue #12950: Cannot Double Click To Insert Emoji Using OSX Emoji Panel', () => {
            usingCursor({
                text: [
                    'some lines',
                    'and more lines',
                    'just some text',
                ],
                languageId: null
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 1, false);
                viewModel.type('😍', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'some lines',
                    'and more lines',
                    '😍just some text',
                ].join('\n'));
            });
        });
        test('issue #3463: pressing tab adds spaces, but not as many as for a tab', () => {
            const model = createTextModel([
                'function a() {',
                '\tvar a = {',
                '\t\tx: 3',
                '\t};',
                '}',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(3), '\t    \tx: 3');
            });
        });
        test('issue #4312: trying to type a tab character over a sequence of spaces results in unexpected behaviour', () => {
            const model = createTextModel([
                'var foo = 123;       // this is a comment',
                'var bar = 4;       // another comment'
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 15, false);
                moveTo(editor, viewModel, 1, 22, true);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'var foo = 123;\t// this is a comment');
            });
        });
        test('issue #832: word right', () => {
            usingCursor({
                text: [
                    '   /* Just some   more   text a+= 3 +5-3 + 7 */  '
                ],
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 1, false);
                function assertWordRight(col, expectedCol) {
                    const args = {
                        position: {
                            lineNumber: 1,
                            column: col
                        }
                    };
                    if (col === 1) {
                        coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(viewModel, args);
                    }
                    else {
                        coreCommands_1.CoreNavigationCommands.WordSelectDrag.runCoreEditorCommand(viewModel, args);
                    }
                    assert.strictEqual(viewModel.getSelection().startColumn, 1, 'TEST FOR ' + col);
                    assert.strictEqual(viewModel.getSelection().endColumn, expectedCol, 'TEST FOR ' + col);
                }
                assertWordRight(1, '   '.length + 1);
                assertWordRight(2, '   '.length + 1);
                assertWordRight(3, '   '.length + 1);
                assertWordRight(4, '   '.length + 1);
                assertWordRight(5, '   /'.length + 1);
                assertWordRight(6, '   /*'.length + 1);
                assertWordRight(7, '   /* '.length + 1);
                assertWordRight(8, '   /* Just'.length + 1);
                assertWordRight(9, '   /* Just'.length + 1);
                assertWordRight(10, '   /* Just'.length + 1);
                assertWordRight(11, '   /* Just'.length + 1);
                assertWordRight(12, '   /* Just '.length + 1);
                assertWordRight(13, '   /* Just some'.length + 1);
                assertWordRight(14, '   /* Just some'.length + 1);
                assertWordRight(15, '   /* Just some'.length + 1);
                assertWordRight(16, '   /* Just some'.length + 1);
                assertWordRight(17, '   /* Just some '.length + 1);
                assertWordRight(18, '   /* Just some  '.length + 1);
                assertWordRight(19, '   /* Just some   '.length + 1);
                assertWordRight(20, '   /* Just some   more'.length + 1);
                assertWordRight(21, '   /* Just some   more'.length + 1);
                assertWordRight(22, '   /* Just some   more'.length + 1);
                assertWordRight(23, '   /* Just some   more'.length + 1);
                assertWordRight(24, '   /* Just some   more '.length + 1);
                assertWordRight(25, '   /* Just some   more  '.length + 1);
                assertWordRight(26, '   /* Just some   more   '.length + 1);
                assertWordRight(27, '   /* Just some   more   text'.length + 1);
                assertWordRight(28, '   /* Just some   more   text'.length + 1);
                assertWordRight(29, '   /* Just some   more   text'.length + 1);
                assertWordRight(30, '   /* Just some   more   text'.length + 1);
                assertWordRight(31, '   /* Just some   more   text '.length + 1);
                assertWordRight(32, '   /* Just some   more   text a'.length + 1);
                assertWordRight(33, '   /* Just some   more   text a+'.length + 1);
                assertWordRight(34, '   /* Just some   more   text a+='.length + 1);
                assertWordRight(35, '   /* Just some   more   text a+= '.length + 1);
                assertWordRight(36, '   /* Just some   more   text a+= 3'.length + 1);
                assertWordRight(37, '   /* Just some   more   text a+= 3 '.length + 1);
                assertWordRight(38, '   /* Just some   more   text a+= 3 +'.length + 1);
                assertWordRight(39, '   /* Just some   more   text a+= 3 +5'.length + 1);
                assertWordRight(40, '   /* Just some   more   text a+= 3 +5-'.length + 1);
                assertWordRight(41, '   /* Just some   more   text a+= 3 +5-3'.length + 1);
                assertWordRight(42, '   /* Just some   more   text a+= 3 +5-3 '.length + 1);
                assertWordRight(43, '   /* Just some   more   text a+= 3 +5-3 +'.length + 1);
                assertWordRight(44, '   /* Just some   more   text a+= 3 +5-3 + '.length + 1);
                assertWordRight(45, '   /* Just some   more   text a+= 3 +5-3 + 7'.length + 1);
                assertWordRight(46, '   /* Just some   more   text a+= 3 +5-3 + 7 '.length + 1);
                assertWordRight(47, '   /* Just some   more   text a+= 3 +5-3 + 7 *'.length + 1);
                assertWordRight(48, '   /* Just some   more   text a+= 3 +5-3 + 7 */'.length + 1);
                assertWordRight(49, '   /* Just some   more   text a+= 3 +5-3 + 7 */ '.length + 1);
                assertWordRight(50, '   /* Just some   more   text a+= 3 +5-3 + 7 */  '.length + 1);
            });
        });
        test('issue #33788: Wrong cursor position when double click to select a word', () => {
            const model = createTextModel([
                'Just some text'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 8) });
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 6, 1, 10));
                coreCommands_1.CoreNavigationCommands.WordSelectDrag.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 8) });
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 6, 1, 10));
            });
        });
        test('issue #12887: Double-click highlighting separating white space', () => {
            const model = createTextModel([
                'abc def'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 5) });
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 5, 1, 8));
            });
        });
        test('issue #9675: Undo/Redo adds a stop in between CHN Characters', () => {
            withTestCodeEditor([], {}, (editor, viewModel) => {
                const model = editor.getModel();
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Typing sennsei in Japanese - Hiragana
                viewModel.type('ｓ', 'keyboard');
                viewModel.compositionType('せ', 1, 0, 0);
                viewModel.compositionType('せｎ', 1, 0, 0);
                viewModel.compositionType('せん', 2, 0, 0);
                viewModel.compositionType('せんｓ', 2, 0, 0);
                viewModel.compositionType('せんせ', 3, 0, 0);
                viewModel.compositionType('せんせ', 3, 0, 0);
                viewModel.compositionType('せんせい', 3, 0, 0);
                viewModel.compositionType('せんせい', 4, 0, 0);
                viewModel.compositionType('せんせい', 4, 0, 0);
                viewModel.compositionType('せんせい', 4, 0, 0);
                assert.strictEqual(model.getLineContent(1), 'せんせい');
                assertCursor(viewModel, new position_1.Position(1, 5));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '');
                assertCursor(viewModel, new position_1.Position(1, 1));
            });
        });
        test('issue #23983: Calling model.setEOL does not reset cursor position', () => {
            usingCursor({
                text: [
                    'first line',
                    'second line'
                ]
            }, (editor, model, viewModel) => {
                model.setEOL(1 /* EndOfLineSequence.CRLF */);
                viewModel.setSelections('test', [new selection_1.Selection(2, 2, 2, 2)]);
                model.setEOL(0 /* EndOfLineSequence.LF */);
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
            });
        });
        test('issue #23983: Calling model.setValue() resets cursor position', () => {
            usingCursor({
                text: [
                    'first line',
                    'second line'
                ]
            }, (editor, model, viewModel) => {
                model.setEOL(1 /* EndOfLineSequence.CRLF */);
                viewModel.setSelections('test', [new selection_1.Selection(2, 2, 2, 2)]);
                model.setValue([
                    'different first line',
                    'different second line',
                    'new third line'
                ].join('\n'));
                assertCursor(viewModel, new selection_1.Selection(1, 1, 1, 1));
            });
        });
        test('issue #36740: wordwrap creates an extra step / character at the wrapping point', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    'Lorem ipsum ',
                    'dolor sit amet ',
                    'consectetur ',
                    'adipiscing elit',
                ].join('')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 16 }, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 7, 1, 7)]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 10, 1, 10));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 11, 1, 11));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 13, 1, 13));
                // moving to view line 2
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 14, 1, 14));
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 13, 1, 13));
                // moving back to view line 1
                moveLeft(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
            });
        });
        test('issue #110376: multiple selections with wordwrap behave differently', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    'just a sentence. just a ',
                    'sentence. just a sentence.',
                ].join('')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 25 }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 16),
                    new selection_1.Selection(1, 18, 1, 33),
                    new selection_1.Selection(1, 35, 1, 50),
                ]);
                moveLeft(editor, viewModel);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                    new selection_1.Selection(1, 18, 1, 18),
                    new selection_1.Selection(1, 35, 1, 35),
                ]);
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 16),
                    new selection_1.Selection(1, 18, 1, 33),
                    new selection_1.Selection(1, 35, 1, 50),
                ]);
                moveRight(editor, viewModel);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 16, 1, 16),
                    new selection_1.Selection(1, 33, 1, 33),
                    new selection_1.Selection(1, 50, 1, 50),
                ]);
            });
        });
        test('issue #98320: Multi-Cursor, Wrap lines and cursorSelectRight ==> cursors out of sync', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    'lorem_ipsum-1993x11x13',
                    'dolor_sit_amet-1998x04x27',
                    'consectetur-2007x10x08',
                    'adipiscing-2012x07x27',
                    'elit-2015x02x27',
                ].join('\n')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 16 }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 13, 1, 13),
                    new selection_1.Selection(2, 16, 2, 16),
                    new selection_1.Selection(3, 13, 3, 13),
                    new selection_1.Selection(4, 12, 4, 12),
                    new selection_1.Selection(5, 6, 5, 6),
                ]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 13),
                    new selection_1.Selection(2, 16, 2, 16),
                    new selection_1.Selection(3, 13, 3, 13),
                    new selection_1.Selection(4, 12, 4, 12),
                    new selection_1.Selection(5, 6, 5, 6),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 14),
                    new selection_1.Selection(2, 16, 2, 17),
                    new selection_1.Selection(3, 13, 3, 14),
                    new selection_1.Selection(4, 12, 4, 13),
                    new selection_1.Selection(5, 6, 5, 7),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 15),
                    new selection_1.Selection(2, 16, 2, 18),
                    new selection_1.Selection(3, 13, 3, 15),
                    new selection_1.Selection(4, 12, 4, 14),
                    new selection_1.Selection(5, 6, 5, 8),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 16),
                    new selection_1.Selection(2, 16, 2, 19),
                    new selection_1.Selection(3, 13, 3, 16),
                    new selection_1.Selection(4, 12, 4, 15),
                    new selection_1.Selection(5, 6, 5, 9),
                ]);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 13, 1, 17),
                    new selection_1.Selection(2, 16, 2, 20),
                    new selection_1.Selection(3, 13, 3, 17),
                    new selection_1.Selection(4, 12, 4, 16),
                    new selection_1.Selection(5, 6, 5, 10),
                ]);
            });
        });
        test('issue #41573 - delete across multiple lines does not shrink the selection when word wraps', () => {
            withTestCodeEditor([
                'Authorization: \'Bearer pHKRfCTFSnGxs6akKlb9ddIXcca0sIUSZJutPHYqz7vEeHdMTMh0SGN0IGU3a0n59DXjTLRsj5EJ2u33qLNIFi9fk5XF8pK39PndLYUZhPt4QvHGLScgSkK0L4gwzkzMloTQPpKhqiikiIOvyNNSpd2o8j29NnOmdTUOKi9DVt74PD2ohKxyOrWZ6oZprTkb3eKajcpnS0LABKfaw2rmv4\','
            ].join('\n'), { wordWrap: 'wordWrapColumn', wordWrapColumn: 100 }, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 43, false);
                moveTo(editor, viewModel, 1, 147, true);
                assertCursor(viewModel, new selection_1.Selection(1, 43, 1, 147));
                editor.getModel().applyEdits([{
                        range: new range_1.Range(1, 1, 1, 43),
                        text: ''
                    }]);
                assertCursor(viewModel, new selection_1.Selection(1, 1, 1, 105));
            });
        });
        test('issue #22717: Moving text cursor cause an incorrect position in Chinese', () => {
            // a single model line => 4 view lines
            withTestCodeEditor([
                [
                    '一二三四五六七八九十',
                    '12345678901234567890',
                ].join('\n')
            ], {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                moveDown(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(2, 10, 2, 10));
                moveRight(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(2, 11, 2, 11));
                moveUp(editor, viewModel);
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
            });
        });
        test('issue #112301: new stickyTabStops feature interferes with word wrap', () => {
            withTestCodeEditor([
                [
                    'function hello() {',
                    '        console.log(`this is a long console message`)',
                    '}',
                ].join('\n')
            ], { wordWrap: 'wordWrapColumn', wordWrapColumn: 32, stickyTabStops: true }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(2, 31, 2, 31)
                ]);
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 32));
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 33));
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 34));
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 33));
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 32));
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, new position_1.Position(2, 31));
            });
        });
        test('issue #44805: Should not be able to undo in readonly editor', () => {
            const model = createTextModel([
                ''
            ].join('\n'));
            withTestCodeEditor(model, { readOnly: true }, (editor, viewModel) => {
                model.pushEditOperations([new selection_1.Selection(1, 1, 1, 1)], [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: 'Hello world!'
                    }], () => [new selection_1.Selection(1, 1, 1, 1)]);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'Hello world!');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'Hello world!');
            });
        });
        test('issue #46314: ViewModel is out of sync with Model!', () => {
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    return new languages_1.EncodedTokenizationResult(new Uint32Array(0), state);
                }
            };
            const LANGUAGE_ID = 'modelModeTest1';
            const languageRegistration = languages_1.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            const model = createTextModel('Just text', LANGUAGE_ID);
            withTestCodeEditor(model, {}, (editor1, cursor1) => {
                withTestCodeEditor(model, {}, (editor2, cursor2) => {
                    const disposable = editor1.onDidChangeCursorPosition(() => {
                        model.tokenization.tokenizeIfCheap(1);
                    });
                    model.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: '-' }]);
                    disposable.dispose();
                });
            });
            languageRegistration.dispose();
            model.dispose();
        });
        test('issue #37967: problem replacing consecutive characters', () => {
            const model = createTextModel([
                'const a = "foo";',
                'const b = ""'
            ].join('\n'));
            withTestCodeEditor(model, { multiCursorMergeOverlapping: false }, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 12, 1, 12),
                    new selection_1.Selection(1, 16, 1, 16),
                    new selection_1.Selection(2, 12, 2, 12),
                    new selection_1.Selection(2, 13, 2, 13),
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 11, 1, 11),
                    new selection_1.Selection(1, 14, 1, 14),
                    new selection_1.Selection(2, 11, 2, 11),
                    new selection_1.Selection(2, 11, 2, 11),
                ]);
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'const a = \'foo\';');
                assert.strictEqual(model.getLineContent(2), 'const b = \'\'');
            });
        });
        test('issue #15761: Cursor doesn\'t move in a redo operation', () => {
            const model = createTextModel([
                'hello'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 4, 1, 4)
                ]);
                editor.executeEdits('test', [{
                        range: new range_1.Range(1, 1, 1, 1),
                        text: '*',
                        forceMoveMarkers: true
                    }]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 5, 1, 5),
                ]);
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 4, 1, 4),
                ]);
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 5, 1, 5),
                ]);
            });
        });
        test('issue #42783: API Calls with Undo Leave Cursor in Wrong Position', () => {
            const model = createTextModel([
                'ab'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 1, 1, 1)
                ]);
                editor.executeEdits('test', [{
                        range: new range_1.Range(1, 1, 1, 3),
                        text: ''
                    }]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                ]);
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                ]);
                editor.executeEdits('test', [{
                        range: new range_1.Range(1, 1, 1, 2),
                        text: ''
                    }]);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 1, 1, 1),
                ]);
            });
        });
        test('issue #85712: Paste line moves cursor to start of current line rather than start of next line', () => {
            const model = createTextModel([
                'abc123',
                ''
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(2, 1, 2, 1)
                ]);
                viewModel.paste('something\n', true);
                assert.strictEqual(model.getValue(), [
                    'abc123',
                    'something',
                    ''
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(3, 1));
            });
        });
        test('issue #84897: Left delete behavior in some languages is changed', () => {
            const model = createTextModel([
                'สวัสดี'
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 7, 1, 7)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัสด');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวั');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สว');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #122914: Left delete behavior in some languages is changed (useTabStops: false)', () => {
            const model = createTextModel([
                'สวัสดี'
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 7, 1, 7)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัสด');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวัส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สวั');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'สว');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ส');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #99629: Emoji modifiers in text treated separately when using backspace', () => {
            const model = createTextModel([
                '👶🏾'
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                const len = model.getValueLength();
                editor.setSelections([
                    new selection_1.Selection(1, 1 + len, 1, 1 + len)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #99629: Emoji modifiers in text treated separately when using backspace (ZWJ sequence)', () => {
            const model = createTextModel([
                '👨‍👩🏽‍👧‍👦'
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                const len = model.getValueLength();
                editor.setSelections([
                    new selection_1.Selection(1, 1 + len, 1, 1 + len)
                ]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '👨‍👩🏽‍👧');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '👨‍👩🏽');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '👨');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '');
            });
        });
        test('issue #105730: move left behaves differently for multiple cursors', () => {
            const model = createTextModel('asdfghjkl, asdfghjkl, asdfghjkl, ');
            withTestCodeEditor(model, {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 24
            }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 10, 1, 12),
                    new selection_1.Selection(1, 21, 1, 23),
                    new selection_1.Selection(1, 32, 1, 34)
                ]);
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 10, 1, 10),
                    new selection_1.Selection(1, 21, 1, 21),
                    new selection_1.Selection(1, 32, 1, 32)
                ]);
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 10, 1, 12),
                    new selection_1.Selection(1, 21, 1, 23),
                    new selection_1.Selection(1, 32, 1, 34)
                ]);
                moveLeft(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 10, 1, 11),
                    new selection_1.Selection(1, 21, 1, 22),
                    new selection_1.Selection(1, 32, 1, 33)
                ]);
            });
        });
        test('issue #105730: move right should always skip wrap point', () => {
            const model = createTextModel('asdfghjkl, asdfghjkl, asdfghjkl, \nasdfghjkl,');
            withTestCodeEditor(model, {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 24
            }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 22, 1, 22)
                ]);
                moveRight(editor, viewModel, false);
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 24, 1, 24),
                ]);
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 22, 1, 22)
                ]);
                moveRight(editor, viewModel, true);
                moveRight(editor, viewModel, true);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 22, 1, 24),
                ]);
            });
        });
        test('issue #123178: sticky tab in consecutive wrapped lines', () => {
            const model = createTextModel('    aaaa        aaaa', undefined, { tabSize: 4 });
            withTestCodeEditor(model, {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 8,
                stickyTabStops: true,
            }, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 9, 1, 9)
                ]);
                moveRight(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 10, 1, 10),
                ]);
                moveLeft(editor, viewModel, false);
                assertCursor(viewModel, [
                    new selection_1.Selection(1, 9, 1, 9),
                ]);
            });
        });
        test('Cursor honors insertSpaces configuration on new line', () => {
            usingCursor({
                text: [
                    '    \tMy First Line\t ',
                    '\tMy Second Line',
                    '    Third Line',
                    '',
                    '1'
                ]
            }, (editor, model, viewModel) => {
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(1, 21), source: 'keyboard' });
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    \tMy First Line\t ');
                assert.strictEqual(model.getLineContent(2), '        ');
            });
        });
        test('Cursor honors insertSpaces configuration on tab', () => {
            const model = createTextModel([
                '    \tMy First Line\t ',
                'My Second Line123',
                '    Third Line',
                '',
                '1'
            ].join('\n'), undefined, {
                tabSize: 13,
                indentSize: 13,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                // Tab on column 1
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 1) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '             My Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 2
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 2) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'M            y Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 3
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 3) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My            Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 4
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 4) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My           Second Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 5
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 5) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My S         econd Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 5
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 5) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My S         econd Line123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 13
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 13) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My Second Li ne123');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                // Tab on column 14
                assert.strictEqual(model.getLineContent(2), 'My Second Line123');
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, { position: new position_1.Position(2, 14) });
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'My Second Lin             e123');
            });
        });
        test('Enter auto-indents with insertSpaces setting 1', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.Indent);
            usingCursor({
                text: [
                    '\thello'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(2 /* EndOfLinePreference.CRLF */), '\thello\r\n        ');
            });
        });
        test('Enter auto-indents with insertSpaces setting 2', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.None);
            usingCursor({
                text: [
                    '\thello'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(2 /* EndOfLinePreference.CRLF */), '\thello\r\n    ');
            });
        });
        test('Enter auto-indents with insertSpaces setting 3', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.IndentOutdent);
            usingCursor({
                text: [
                    '\thell()'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 7, false);
                assertCursor(viewModel, new selection_1.Selection(1, 7, 1, 7));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(2 /* EndOfLinePreference.CRLF */), '\thell(\r\n        \r\n    )');
            });
        });
        test('issue #148256: Pressing Enter creates line with bad indent with insertSpaces: true', () => {
            usingCursor({
                text: [
                    '  \t'
                ],
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 4, false);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), '  \t\n    ');
            });
        });
        test('issue #148256: Pressing Enter creates line with bad indent with insertSpaces: false', () => {
            usingCursor({
                text: [
                    '  \t'
                ]
            }, (editor, model, viewModel) => {
                model.updateOptions({
                    insertSpaces: false
                });
                moveTo(editor, viewModel, 1, 4, false);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), '  \t\n\t');
            });
        });
        test('removeAutoWhitespace off', () => {
            usingCursor({
                text: [
                    '    some  line abc  '
                ],
                modelOpts: {
                    trimAutoWhitespace: false
                }
            }, (editor, model, viewModel) => {
                // Move cursor to the end, verify that we do not trim whitespaces if line has values
                moveTo(editor, viewModel, 1, model.getLineContent(1).length + 1);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '    ');
                // Try to enter again, we should trimmed previous line
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '    ');
            });
        });
        test('removeAutoWhitespace on: removes only whitespace the cursor added 1', () => {
            usingCursor({
                text: [
                    '    '
                ]
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, model.getLineContent(1).length + 1);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '    ');
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '    ');
            });
        });
        test('issue #115033: indent and appendText', () => {
            const languageId = 'onEnterMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                onEnterRules: [{
                        beforeText: /.*/,
                        action: {
                            indentAction: languageConfiguration_1.IndentAction.Indent,
                            appendText: 'x'
                        }
                    }]
            }));
            usingCursor({
                text: [
                    'text'
                ],
                languageId: languageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'text');
                assert.strictEqual(model.getLineContent(2), '    x');
                assertCursor(viewModel, new position_1.Position(2, 6));
            });
        });
        test('issue #6862: Editor removes auto inserted indentation when formatting on type', () => {
            const languageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.IndentOutdent);
            usingCursor({
                text: [
                    'function foo (params: string) {}'
                ],
                languageId: languageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 32);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'function foo (params: string) {');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '}');
                class TestCommand {
                    constructor() {
                        this._selectionId = null;
                    }
                    getEditOperations(model, builder) {
                        builder.addEditOperation(new range_1.Range(1, 13, 1, 14), '');
                        this._selectionId = builder.trackSelection(viewModel.getSelection());
                    }
                    computeCursorState(model, helper) {
                        return helper.getTrackedSelection(this._selectionId);
                    }
                }
                viewModel.executeCommand(new TestCommand(), 'autoFormat');
                assert.strictEqual(model.getLineContent(1), 'function foo(params: string) {');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '}');
            });
        });
        test('removeAutoWhitespace on: removes only whitespace the cursor added 2', () => {
            const languageId = 'testLang';
            const registration = languageService.registerLanguage({ id: languageId });
            const model = createTextModel([
                '    if (a) {',
                '        ',
                '',
                '',
                '    }'
            ].join('\n'), languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 1);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '    ');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '    }');
                moveTo(editor, viewModel, 4, 1);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '    ');
                assert.strictEqual(model.getLineContent(5), '    }');
                moveTo(editor, viewModel, 5, model.getLineMaxColumn(5));
                viewModel.type('something', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '    }something');
            });
            registration.dispose();
        });
        test('removeAutoWhitespace on: test 1', () => {
            const model = createTextModel([
                '    some  line abc  '
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                // Move cursor to the end, verify that we do not trim whitespaces if line has values
                moveTo(editor, viewModel, 1, model.getLineContent(1).length + 1);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '    ');
                // Try to enter again, we should trimmed previous line
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '    ');
                // More whitespaces
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '        ');
                // Enter and verify that trimmed again
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '        ');
                // Trimmed if we will keep only text
                moveTo(editor, viewModel, 1, 5);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '    some  line abc  ');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '');
                // Trimmed if we will keep only text by selection
                moveTo(editor, viewModel, 2, 5);
                moveTo(editor, viewModel, 3, 1, true);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.strictEqual(model.getLineContent(2), '    ');
                assert.strictEqual(model.getLineContent(3), '    ');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '');
            });
        });
        test('issue #15118: remove auto whitespace when pasting entire line', () => {
            const model = createTextModel([
                '    function f() {',
                '        // I\'m gonna copy this line',
                '        return 3;',
                '    }',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, model.getLineMaxColumn(3));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '    function f() {',
                    '        // I\'m gonna copy this line',
                    '        return 3;',
                    '        ',
                    '    }',
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(4, model.getLineMaxColumn(4)));
                viewModel.paste('        // I\'m gonna copy this line\n', true);
                assert.strictEqual(model.getValue(), [
                    '    function f() {',
                    '        // I\'m gonna copy this line',
                    '        return 3;',
                    '        // I\'m gonna copy this line',
                    '',
                    '    }',
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(5, 1));
            });
        });
        test('issue #40695: maintain cursor position when copying lines using ctrl+c, ctrl+v', () => {
            const model = createTextModel([
                '    function f() {',
                '        // I\'m gonna copy this line',
                '        // Another line',
                '        return 3;',
                '    }',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([new selection_1.Selection(4, 10, 4, 10)]);
                viewModel.paste('        // I\'m gonna copy this line\n', true);
                assert.strictEqual(model.getValue(), [
                    '    function f() {',
                    '        // I\'m gonna copy this line',
                    '        // Another line',
                    '        // I\'m gonna copy this line',
                    '        return 3;',
                    '    }',
                ].join('\n'));
                assertCursor(viewModel, new position_1.Position(5, 10));
            });
        });
        test('UseTabStops is off', () => {
            const model = createTextModel([
                '    x',
                '        a    ',
                '    '
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: false }, (editor, viewModel) => {
                // DeleteLeft removes just one whitespace
                moveTo(editor, viewModel, 2, 9);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '       a    ');
            });
        });
        test('Backspace removes whitespaces with tab size', () => {
            const model = createTextModel([
                ' \t \t     x',
                '        a    ',
                '    '
            ].join('\n'));
            withTestCodeEditor(model, { useTabStops: true }, (editor, viewModel) => {
                // DeleteLeft does not remove tab size, because some text exists before
                moveTo(editor, viewModel, 2, model.getLineContent(2).length + 1);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '        a   ');
                // DeleteLeft removes tab size = 4
                moveTo(editor, viewModel, 2, 9);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '    a   ');
                // DeleteLeft removes tab size = 4
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'a   ');
                // Undo DeleteLeft - get us back to original indentation
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '        a   ');
                // Nothing is broken when cursor is in (1,1)
                moveTo(editor, viewModel, 1, 1);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \t \t     x');
                // DeleteLeft stops at tab stops even in mixed whitespace case
                moveTo(editor, viewModel, 1, 10);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \t \t    x');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \t \tx');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), ' \tx');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'x');
                // DeleteLeft on last line
                moveTo(editor, viewModel, 3, model.getLineContent(3).length + 1);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(3), '');
                // DeleteLeft with removing new line symbol
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x\n        a   ');
                // In case of selection DeleteLeft only deletes selected text
                moveTo(editor, viewModel, 2, 3);
                moveTo(editor, viewModel, 2, 4, true);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '       a   ');
            });
        });
        test('PR #5423: Auto indent + undo + redo is funky', () => {
            const model = createTextModel([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n', 'assert1');
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\t', 'assert2');
                viewModel.type('y', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty', 'assert2');
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\t', 'assert3');
                viewModel.type('x');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\tx', 'assert4');
                coreCommands_1.CoreNavigationCommands.CursorLeft.runCoreEditorCommand(viewModel, {});
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\tx', 'assert5');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\nx', 'assert6');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\tyx', 'assert7');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\tx', 'assert8');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert9');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert10');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert11');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\nx', 'assert12');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\n\tx', 'assert13');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\n\ty\nx', 'assert14');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\nx', 'assert15');
                coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'x', 'assert16');
            });
        });
        test('issue #90973: Undo brings back model alternative version', () => {
            const model = createTextModel([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                const beforeVersion = model.getVersionId();
                const beforeAltVersion = model.getAlternativeVersionId();
                viewModel.type('Hello', 'keyboard');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                const afterVersion = model.getVersionId();
                const afterAltVersion = model.getAlternativeVersionId();
                assert.notStrictEqual(beforeVersion, afterVersion);
                assert.strictEqual(beforeAltVersion, afterAltVersion);
            });
        });
        test('Enter honors increaseIndentPattern', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                moveTo(editor, viewModel, 3, 13, false);
                assertCursor(viewModel, new selection_1.Selection(3, 13, 3, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
            });
        });
        test('Type honors decreaseIndentPattern', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\t'
                ],
                languageId: indentRulesLanguageId,
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 2, false);
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                viewModel.type('}', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                assert.strictEqual(model.getLineContent(2), '}', '001');
            });
        });
        test('Enter honors unIndentedLinePattern', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\t\t\treturn true'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 15, false);
                assertCursor(viewModel, new selection_1.Selection(2, 15, 2, 15));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
            });
        });
        test('Enter honors indentNextLinePattern', () => {
            usingCursor({
                text: [
                    'if (true)',
                    '\treturn true;',
                    'if (true)',
                    '\t\t\t\treturn true'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 14, false);
                assertCursor(viewModel, new selection_1.Selection(2, 14, 2, 14));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(3, 1, 3, 1));
                moveTo(editor, viewModel, 5, 16, false);
                assertCursor(viewModel, new selection_1.Selection(5, 16, 5, 16));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(6, 2, 6, 2));
            });
        });
        test('Enter honors indentNextLinePattern 2', () => {
            const model = createTextModel([
                'if (true)',
                '\tif (true)'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 2, 11, false);
                assertCursor(viewModel, new selection_1.Selection(2, 11, 2, 11));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('console.log();', 'keyboard');
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
            });
        });
        test('Enter honors intential indent', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    'return true;',
                    '}}'
                ],
                languageId: indentRulesLanguageId,
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 13, false);
                assertCursor(viewModel, new selection_1.Selection(3, 13, 3, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                assert.strictEqual(model.getLineContent(3), 'return true;', '001');
            });
        });
        test('Enter supports selection 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 4, 3, false);
                moveTo(editor, viewModel, 4, 4, true);
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 4));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, 1));
                assert.strictEqual(model.getLineContent(4), '\t}', '001');
            });
        });
        test('Enter supports selection 2', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 12, false);
                moveTo(editor, viewModel, 2, 13, true);
                assertCursor(viewModel, new selection_1.Selection(2, 12, 2, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
            });
        });
        test('Enter honors tabSize and insertSpaces 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {'
                ],
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(2, 5, 2, 5));
                model.tokenization.forceTokenization(model.getLineCount());
                moveTo(editor, viewModel, 3, 13, false);
                assertCursor(viewModel, new selection_1.Selection(3, 13, 3, 13));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 9, 4, 9));
            });
        });
        test('Enter honors tabSize and insertSpaces 2', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '    if (true) {'
                ],
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 5, 2, 5));
                moveTo(editor, viewModel, 3, 16, false);
                assertCursor(viewModel, new selection_1.Selection(3, 16, 3, 16));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '    if (true) {');
                assertCursor(viewModel, new selection_1.Selection(4, 9, 4, 9));
            });
        });
        test('Enter honors tabSize and insertSpaces 3', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '    if (true) {'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 12, false);
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                moveTo(editor, viewModel, 3, 16, false);
                assertCursor(viewModel, new selection_1.Selection(3, 16, 3, 16));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '    if (true) {');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
            });
        });
        test('Enter supports intentional indentation', () => {
            usingCursor({
                text: [
                    '\tif (true) {',
                    '\t\tswitch(true) {',
                    '\t\t\tcase true:',
                    '\t\t\t\tbreak;',
                    '\t\t}',
                    '\t}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 5, 4, false);
                assertCursor(viewModel, new selection_1.Selection(5, 4, 5, 4));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(5), '\t\t}');
                assertCursor(viewModel, new selection_1.Selection(6, 3, 6, 3));
            });
        });
        test('Enter should not adjust cursor position when press enter in the middle of a line 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 9, false);
                assertCursor(viewModel, new selection_1.Selection(3, 9, 3, 9));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '\t\t true;', '001');
            });
        });
        test('Enter should not adjust cursor position when press enter in the middle of a line 2', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3, false);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '\t\treturn true;', '001');
            });
        });
        test('Enter should not adjust cursor position when press enter in the middle of a line 3', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '    return true;',
                    '  }a}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 11, false);
                assertCursor(viewModel, new selection_1.Selection(3, 11, 3, 11));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 5, 4, 5));
                assert.strictEqual(model.getLineContent(4), '     true;', '001');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 1', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\tif (true) {',
                    '\t\treturn true;',
                    '\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                assert.strictEqual(model.getLineContent(4), '\t\treturn true;', '001');
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, 1));
                assert.strictEqual(model.getLineContent(5), '\t\treturn true;', '002');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 2', () => {
            usingCursor({
                text: [
                    '\tif (true) {',
                    '\t\tif (true) {',
                    '\t    \treturn true;',
                    '\t\t}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 4, false);
                assertCursor(viewModel, new selection_1.Selection(3, 4, 3, 4));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '\t\t\treturn true;', '001');
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 1, 5, 1));
                assert.strictEqual(model.getLineContent(5), '\t\t\treturn true;', '002');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 3', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '    return true;',
                    '}a}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                assert.strictEqual(model.getLineContent(4), '    return true;', '001');
                moveTo(editor, viewModel, 4, 3, false);
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 3, 5, 3));
                assert.strictEqual(model.getLineContent(5), '    return true;', '002');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 4', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '\t  return true;',
                    '}a}',
                    '',
                    'if (true) {',
                    '  if (true) {',
                    '\t  return true;',
                    '}a}'
                ],
                languageId: indentRulesLanguageId,
                modelOpts: {
                    tabSize: 2,
                    indentSize: 2
                }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3, false);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 4, 4, 4));
                assert.strictEqual(model.getLineContent(4), '    return true;', '001');
                moveTo(editor, viewModel, 9, 4, false);
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(10, 5, 10, 5));
                assert.strictEqual(model.getLineContent(10), '    return true;', '001');
            });
        });
        test('Enter should adjust cursor position when press enter in the middle of leading whitespaces 5', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '  if (true) {',
                    '    return true;',
                    '    return true;',
                    ''
                ],
                languageId: indentRulesLanguageId,
                modelOpts: { tabSize: 2 }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 5, false);
                moveTo(editor, viewModel, 4, 3, true);
                assertCursor(viewModel, new selection_1.Selection(3, 5, 4, 3));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                assert.strictEqual(model.getLineContent(4), '    return true;', '001');
            });
        });
        test('issue microsoft/monaco-editor#108 part 1/2: Auto indentation on Enter with selection is half broken', () => {
            usingCursor({
                text: [
                    'function baz() {',
                    '\tvar x = 1;',
                    '\t\t\t\t\t\t\treturn x;',
                    '}'
                ],
                modelOpts: {
                    insertSpaces: false,
                },
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 8, false);
                moveTo(editor, viewModel, 2, 12, true);
                assertCursor(viewModel, new selection_1.Selection(3, 8, 2, 12));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '\treturn x;');
                assertCursor(viewModel, new position_1.Position(3, 2));
            });
        });
        test('issue microsoft/monaco-editor#108 part 2/2: Auto indentation on Enter with selection is half broken', () => {
            usingCursor({
                text: [
                    'function baz() {',
                    '\tvar x = 1;',
                    '\t\t\t\t\t\t\treturn x;',
                    '}'
                ],
                modelOpts: {
                    insertSpaces: false,
                },
                languageId: indentRulesLanguageId,
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 12, false);
                moveTo(editor, viewModel, 3, 8, true);
                assertCursor(viewModel, new selection_1.Selection(2, 12, 3, 8));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(3), '\treturn x;');
                assertCursor(viewModel, new position_1.Position(3, 2));
            });
        });
        test('onEnter works if there are no indentation rules', () => {
            usingCursor({
                text: [
                    '<?',
                    '\tif (true) {',
                    '\t\techo $hi;',
                    '\t\techo $bye;',
                    '\t}',
                    '?>'
                ],
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 5, 3, false);
                assertCursor(viewModel, new selection_1.Selection(5, 3, 5, 3));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getLineContent(6), '\t');
                assertCursor(viewModel, new selection_1.Selection(6, 2, 6, 2));
                assert.strictEqual(model.getLineContent(5), '\t}');
            });
        });
        test('onEnter works if there are no indentation rules 2', () => {
            usingCursor({
                text: [
                    '	if (5)',
                    '		return 5;',
                    '	'
                ],
                modelOpts: { insertSpaces: false }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 2, false);
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                viewModel.type('\n', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                assert.strictEqual(model.getLineContent(4), '\t');
            });
        });
        test('bug #16543: Tab should indent to correct indentation spot immediately', () => {
            const model = createTextModel([
                'function baz() {',
                '\tfunction hello() { // something here',
                '\t',
                '',
                '\t}',
                '}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t');
            });
        });
        test('bug #2938 (1): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '\t',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 2, false);
                assertCursor(viewModel, new selection_1.Selection(4, 2, 4, 2));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t');
            });
        });
        test('bug #2938 (2): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '    ',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 1, false);
                assertCursor(viewModel, new selection_1.Selection(4, 1, 4, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t');
            });
        });
        test('bug #2938 (3): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '\t\t\t',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 3, false);
                assertCursor(viewModel, new selection_1.Selection(4, 3, 4, 3));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t\t');
            });
        });
        test('bug #2938 (4): When pressing Tab on white-space only lines, indent straight to the right spot (similar to empty lines)', () => {
            const model = createTextModel([
                '\tfunction baz() {',
                '\t\tfunction hello() { // something here',
                '\t\t',
                '\t\t\t\t',
                '\t\t}',
                '\t}'
            ].join('\n'), indentRulesLanguageId, {
                insertSpaces: false,
            });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 4, false);
                assertCursor(viewModel, new selection_1.Selection(4, 4, 4, 4));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(4), '\t\t\t\t\t');
            });
        });
        test('bug #31015: When pressing Tab on lines and Enter rules are avail, indent straight to the right spotTab', () => {
            const onEnterLanguageId = setupOnEnterLanguage(languageConfiguration_1.IndentAction.Indent);
            const model = createTextModel([
                '    if (a) {',
                '        ',
                '',
                '',
                '    }'
            ].join('\n'), onEnterLanguageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 1);
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '    if (a) {');
                assert.strictEqual(model.getLineContent(2), '        ');
                assert.strictEqual(model.getLineContent(3), '        ');
                assert.strictEqual(model.getLineContent(4), '');
                assert.strictEqual(model.getLineContent(5), '    }');
            });
        });
        test('type honors indentation rules: ruby keywords', () => {
            const rubyLanguageId = setupIndentRulesLanguage('ruby', {
                increaseIndentPattern: /^\s*((begin|class|def|else|elsif|ensure|for|if|module|rescue|unless|until|when|while)|(.*\sdo\b))\b[^\{;]*$/,
                decreaseIndentPattern: /^\s*([}\]]([,)]?\s*(#|$)|\.[a-zA-Z_]\w*\b)|(end|rescue|ensure|else|elsif|when)\b)/
            });
            const model = createTextModel([
                'class Greeter',
                '  def initialize(name)',
                '    @name = name',
                '    en'
            ].join('\n'), rubyLanguageId);
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 4, 7, false);
                assertCursor(viewModel, new selection_1.Selection(4, 7, 4, 7));
                viewModel.type('d', 'keyboard');
                assert.strictEqual(model.getLineContent(4), '  end');
            });
        });
        test('Auto indent on type: increaseIndentPattern has higher priority than decreaseIndent when inheriting', () => {
            usingCursor({
                text: [
                    '\tif (true) {',
                    '\t\tconsole.log();',
                    '\t} else if {',
                    '\t\tconsole.log()',
                    '\t}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 5, 3, false);
                assertCursor(viewModel, new selection_1.Selection(5, 3, 5, 3));
                viewModel.type('e', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(5, 4, 5, 4));
                assert.strictEqual(model.getLineContent(5), '\t}e', 'This line should not decrease indent');
            });
        });
        test('type honors users indentation adjustment', () => {
            usingCursor({
                text: [
                    '\tif (true ||',
                    '\t ) {',
                    '\t}',
                    'if (true ||',
                    ') {',
                    '}'
                ],
                languageId: indentRulesLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 3, false);
                assertCursor(viewModel, new selection_1.Selection(2, 3, 2, 3));
                viewModel.type(' ', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(2, 4, 2, 4));
                assert.strictEqual(model.getLineContent(2), '\t  ) {', 'This line should not decrease indent');
            });
        });
        test('bug 29972: if a line is line comment, open bracket should not indent next line', () => {
            usingCursor({
                text: [
                    'if (true) {',
                    '\t// {',
                    '\t\t'
                ],
                languageId: indentRulesLanguageId,
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3, false);
                assertCursor(viewModel, new selection_1.Selection(3, 3, 3, 3));
                viewModel.type('}', 'keyboard');
                assertCursor(viewModel, new selection_1.Selection(3, 2, 3, 2));
                assert.strictEqual(model.getLineContent(3), '}');
            });
        });
        test('issue #38261: TAB key results in bizarre indentation in C++ mode ', () => {
            const languageId = 'indentRulesMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
                indentationRules: {
                    increaseIndentPattern: new RegExp("(^.*\\{[^}]*$)"),
                    decreaseIndentPattern: new RegExp("^\\s*\\}")
                }
            }));
            const model = createTextModel([
                'int main() {',
                '  return 0;',
                '}',
                '',
                'bool Foo::bar(const string &a,',
                '              const string &b) {',
                '  foo();',
                '',
                ')',
            ].join('\n'), languageId, {
                tabSize: 2,
                indentSize: 2
            });
            withTestCodeEditor(model, { autoIndent: 'advanced' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 8, 1, false);
                assertCursor(viewModel, new selection_1.Selection(8, 1, 8, 1));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), [
                    'int main() {',
                    '  return 0;',
                    '}',
                    '',
                    'bool Foo::bar(const string &a,',
                    '              const string &b) {',
                    '  foo();',
                    '  ',
                    ')',
                ].join('\n'));
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(8, 3, 8, 3));
            });
        });
        test('issue #57197: indent rules regex should be stateless', () => {
            const languageId = setupIndentRulesLanguage('lang', {
                decreaseIndentPattern: /^\s*}$/gm,
                increaseIndentPattern: /^(?![^\S\n]*(?!--|––|——)(?:[-❍❑■⬜□☐▪▫–—≡→›✘xX✔✓☑+]|\[[ xX+-]?\])\s[^\n]*)[^\S\n]*(.+:)[^\S\n]*(?:(?=@[^\s*~(]+(?::\/\/[^\s*~(:]+)?(?:\([^)]*\))?)|$)/gm,
            });
            usingCursor({
                text: [
                    'Project:',
                ],
                languageId: languageId,
                modelOpts: { insertSpaces: false },
                editorOpts: { autoIndent: 'full' }
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 9, false);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
                moveTo(editor, viewModel, 1, 9, false);
                assertCursor(viewModel, new selection_1.Selection(1, 9, 1, 9));
                viewModel.type('\n', 'keyboard');
                model.tokenization.forceTokenization(model.getLineCount());
                assertCursor(viewModel, new selection_1.Selection(2, 2, 2, 2));
            });
        });
        test('typing in json', () => {
            const languageId = 'indentRulesMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
                indentationRules: {
                    increaseIndentPattern: new RegExp("({+(?=([^\"]*\"[^\"]*\")*[^\"}]*$))|(\\[+(?=([^\"]*\"[^\"]*\")*[^\"\\]]*$))"),
                    decreaseIndentPattern: new RegExp("^\\s*[}\\]],?\\s*$")
                }
            }));
            const model = createTextModel([
                '{',
                '  "scripts: {"',
                '    "watch": "a {"',
                '    "build{": "b"',
                '    "tasks": []',
                '    "tasks": ["a"]',
                '  "}"',
                '"}"'
            ].join('\n'), languageId, {
                tabSize: 2,
                indentSize: 2
            });
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 3, 19, false);
                assertCursor(viewModel, new selection_1.Selection(3, 19, 3, 19));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(4), '    ');
                moveTo(editor, viewModel, 5, 18, false);
                assertCursor(viewModel, new selection_1.Selection(5, 18, 5, 18));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(6), '    ');
                moveTo(editor, viewModel, 7, 15, false);
                assertCursor(viewModel, new selection_1.Selection(7, 15, 7, 15));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(8), '      ');
                assert.deepStrictEqual(model.getLineContent(9), '    ]');
                moveTo(editor, viewModel, 10, 18, false);
                assertCursor(viewModel, new selection_1.Selection(10, 18, 10, 18));
                viewModel.type('\n', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(11), '    ]');
            });
        });
        test('issue #111128: Multicursor `Enter` issue with indentation', () => {
            const model = createTextModel('    let a, b, c;', indentRulesLanguageId, { detectIndentation: false, insertSpaces: false, tabSize: 4 });
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 11, 1, 11),
                    new selection_1.Selection(1, 14, 1, 14),
                ]);
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), '    let a,\n\t b,\n\t c;');
            });
        });
        test('issue #122714: tabSize=1 prevent typing a string matching decreaseIndentPattern in an empty file', () => {
            const latextLanguageId = setupIndentRulesLanguage('latex', {
                increaseIndentPattern: new RegExp('\\\\begin{(?!document)([^}]*)}(?!.*\\\\end{\\1})'),
                decreaseIndentPattern: new RegExp('^\\s*\\\\end{(?!document)')
            });
            const model = createTextModel('\\end', latextLanguageId, { tabSize: 1 });
            withTestCodeEditor(model, { autoIndent: 'full' }, (editor, viewModel) => {
                moveTo(editor, viewModel, 1, 5, false);
                assertCursor(viewModel, new selection_1.Selection(1, 5, 1, 5));
                viewModel.type('{', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '\\end{}');
            });
        });
        test('ElectricCharacter - does nothing if no electric char', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    ''
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '*');
            });
        });
        test('ElectricCharacter - indents in order to match bracket', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    ''
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }');
            });
        });
        test('ElectricCharacter - unindents in order to match bracket', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '    '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 5);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }');
            });
        });
        test('ElectricCharacter - matches with correct bracket', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '    if (b) {',
                    '    }',
                    '    '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 4, 1);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(4), '  }    ');
            });
        });
        test('ElectricCharacter - does nothing if bracket does not match', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '    if (b) {',
                    '    }',
                    '  }  '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 4, 6);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(4), '  }  }');
            });
        });
        test('ElectricCharacter - matches bracket even in line with content', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '// hello'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 1);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }// hello');
            });
        });
        test('ElectricCharacter - is no-op if bracket is lined up', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '  '
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 3);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  }');
            });
        });
        test('ElectricCharacter - is no-op if there is non-whitespace text before', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    'a'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 2);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), 'a}');
            });
        });
        test('ElectricCharacter - is no-op if pairs are all matched before', () => {
            usingCursor({
                text: [
                    'foo(() => {',
                    '  ( 1 + 2 ) ',
                    '})'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 13);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  ( 1 + 2 ) *');
            });
        });
        test('ElectricCharacter - is no-op if matching bracket is on the same line', () => {
            usingCursor({
                text: [
                    '(div',
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 1, 5);
                let changeText = null;
                const disposable = model.onDidChangeContent(e => {
                    changeText = e.changes[0].text;
                });
                viewModel.type(')', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(1), '(div)');
                assert.deepStrictEqual(changeText, ')');
                disposable.dispose();
            });
        });
        test('ElectricCharacter - is no-op if the line has other content', () => {
            usingCursor({
                text: [
                    'Math.max(',
                    '\t2',
                    '\t3'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 3, 3);
                viewModel.type(')', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(3), '\t3)');
            });
        });
        test('ElectricCharacter - appends text', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '/*'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 3);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '/** */');
            });
        });
        test('ElectricCharacter - appends text 2', () => {
            usingCursor({
                text: [
                    '  if (a) {',
                    '  /*'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 5);
                viewModel.type('*', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '  /** */');
            });
        });
        test('ElectricCharacter - issue #23711: Replacing selected text with )]} fails to delete old text with backwards-dragged selection', () => {
            usingCursor({
                text: [
                    '{',
                    'word'
                ],
                languageId: electricCharLanguageId
            }, (editor, model, viewModel) => {
                moveTo(editor, viewModel, 2, 5);
                moveTo(editor, viewModel, 2, 1, true);
                viewModel.type('}', 'keyboard');
                assert.deepStrictEqual(model.getLineContent(2), '}');
            });
        });
        test('issue #61070: backtick (`) should auto-close after a word character', () => {
            usingCursor({
                text: ['const markup = highlight'],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                model.tokenization.forceTokenization(1);
                assertType(editor, model, viewModel, 1, 25, '`', '``', `auto closes \` @ (1, 25)`);
            });
        });
        test('issue #132912: quotes should not auto-close if they are closing a string', () => {
            setupAutoClosingLanguageTokenization();
            const model = createTextModel('const t2 = `something ${t1}', autoClosingLanguageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                const model = viewModel.model;
                model.tokenization.forceTokenization(1);
                assertType(editor, model, viewModel, 1, 28, '`', '`', `does not auto close \` @ (1, 28)`);
            });
        });
        test('autoClosingPairs - open parens: default', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var| a| |=| [|]|;|',
                    'var| b| |=| |`asd|`|;|',
                    'var| c| |=| |\'asd|\'|;|',
                    'var| d| |=| |"asd|"|;|',
                    'var| e| |=| /*3*/|	3|;|',
                    'var| f| |=| /**| 3| */3|;|',
                    'var| g| |=| (3+5|)|;|',
                    'var| h| |=| {| a|:| |\'value|\'| |}|;|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - open parens: whitespace', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'beforeWhitespace'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var| a| =| [|];|',
                    'var| b| =| `asd`;|',
                    'var| c| =| \'asd\';|',
                    'var| d| =| "asd";|',
                    'var| e| =| /*3*/|	3;|',
                    'var| f| =| /**| 3| */3;|',
                    'var| g| =| (3+5|);|',
                    'var| h| =| {| a:| \'value\'| |};|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - open parens disabled/enabled open quotes enabled/disabled', () => {
            usingCursor({
                text: [
                    'var a = [];',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'beforeWhitespace',
                    autoClosingQuotes: 'never'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var| a| =| [|];|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                        assertType(editor, model, viewModel, lineNumber, column, '\'', '\'', `does not auto close @ (${lineNumber}, ${column})`);
                    }
                }
            });
            usingCursor({
                text: [
                    'var b = [];',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'never',
                    autoClosingQuotes: 'beforeWhitespace'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var b =| [|];|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'\'', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                        assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                    }
                }
            });
        });
        test('autoClosingPairs - configurable open parens', () => {
            setAutoClosingLanguageEnabledSet('abc');
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'languageDefined'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'v|ar |a = [|];|',
                    'v|ar |b = `|asd`;|',
                    'v|ar |c = \'|asd\';|',
                    'v|ar d = "|asd";|',
                    'v|ar e = /*3*/	3;|',
                    'v|ar f = /** 3| */3;|',
                    'v|ar g = (3+5|);|',
                    'v|ar h = { |a: \'v|alue\' |};|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - auto-pairing can be disabled', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingBrackets: 'never',
                    autoClosingQuotes: 'never'
                }
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '()', `auto closes @ (${lineNumber}, ${column})`);
                            assertType(editor, model, viewModel, lineNumber, column, '"', '""', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '(', '(', `does not auto close @ (${lineNumber}, ${column})`);
                            assertType(editor, model, viewModel, lineNumber, column, '"', '"', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - auto wrapping is configurable', () => {
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                    new selection_1.Selection(1, 9, 1, 12),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '`var` a = `asd`');
                // type a (
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '`(var)` a = `(asd)`');
            });
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoSurround: 'never'
                }
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '` a = asd');
            });
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoSurround: 'quotes'
                }
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '`var` a = asd');
                // type a (
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '`(` a = asd');
            });
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoSurround: 'brackets'
                }
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 1, 1, 4),
                ]);
                // type a (
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '(var) a = asd');
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), '(`) a = asd');
            });
        });
        test('autoClosingPairs - quote', () => {
            usingCursor({
                text: [
                    'var a = [];',
                    'var b = `asd`;',
                    'var c = \'asd\';',
                    'var d = "asd";',
                    'var e = /*3*/	3;',
                    'var f = /** 3 */3;',
                    'var g = (3+5);',
                    'var h = { a: \'value\' };',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                const autoClosePositions = [
                    'var a |=| [|]|;|',
                    'var b |=| `asd`|;|',
                    'var c |=| \'asd\'|;|',
                    'var d |=| "asd"|;|',
                    'var e |=| /*3*/|	3;|',
                    'var f |=| /**| 3 */3;|',
                    'var g |=| (3+5)|;|',
                    'var h |=| {| a:| \'value\'| |}|;|',
                ];
                for (let i = 0, len = autoClosePositions.length; i < len; i++) {
                    const lineNumber = i + 1;
                    const autoCloseColumns = extractAutoClosingSpecialColumns(model.getLineMaxColumn(lineNumber), autoClosePositions[i]);
                    for (let column = 1; column < autoCloseColumns.length; column++) {
                        model.tokenization.forceTokenization(lineNumber);
                        if (autoCloseColumns[column] === 1 /* AutoClosingColumnType.Special1 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'\'', `auto closes @ (${lineNumber}, ${column})`);
                        }
                        else if (autoCloseColumns[column] === 2 /* AutoClosingColumnType.Special2 */) {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '', `over types @ (${lineNumber}, ${column})`);
                        }
                        else {
                            assertType(editor, model, viewModel, lineNumber, column, '\'', '\'', `does not auto close @ (${lineNumber}, ${column})`);
                        }
                    }
                }
            });
        });
        test('autoClosingPairs - multi-character autoclose', () => {
            usingCursor({
                text: [
                    '',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                model.setValue('begi');
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                viewModel.type('n', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'beginend');
                model.setValue('/*');
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '/** */');
            });
        });
        test('autoClosingPairs - doc comments can be turned off', () => {
            usingCursor({
                text: [
                    '',
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingComments: 'never'
                }
            }, (editor, model, viewModel) => {
                model.setValue('/*');
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '/**');
            });
        });
        test('issue #72177: multi-character autoclose with conflicting patterns', () => {
            const languageId = 'autoClosingModeMultiChar';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '(', close: ')' },
                    { open: '(*', close: '*)' },
                    { open: '<@', close: '@>' },
                    { open: '<@@', close: '@@>' },
                ],
            }));
            usingCursor({
                text: [
                    '',
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '()');
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '(**)', `doesn't add entire close when already closed substring is there`);
                model.setValue('(');
                viewModel.setSelections('test', [new selection_1.Selection(1, 2, 1, 2)]);
                viewModel.type('*', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '(**)', `does add entire close if not already there`);
                model.setValue('');
                viewModel.type('<@', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<@@>');
                viewModel.type('@', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<@@@@>', `autocloses when before multi-character closing brace`);
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<@@()@@>', `autocloses when before multi-character closing brace`);
            });
        });
        test('issue #55314: Do not auto-close when ending with open', () => {
            const languageId = 'myElectricMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: 'B\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: '`', close: '`', notIn: ['string', 'comment'] },
                    { open: '/**', close: ' */', notIn: ['string'] }
                ],
            }));
            usingCursor({
                text: [
                    'little goat',
                    'little LAMB',
                    'little sheep',
                    'Big LAMB'
                ],
                languageId: languageId
            }, (editor, model, viewModel) => {
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 1, 4, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 2, 4, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 3, 4, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 4, 2, '"', '"', `does not double quote when ending with open`);
                model.tokenization.forceTokenization(model.getLineCount());
                assertType(editor, model, viewModel, 4, 3, '"', '"', `does not double quote when ending with open`);
            });
        });
        test('issue #27937: Trying to add an item to the front of a list is cumbersome', () => {
            usingCursor({
                text: [
                    'var arr = ["b", "c"];'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertType(editor, model, viewModel, 1, 12, '"', '"', `does not over type and will not auto close`);
            });
        });
        test('issue #25658 - Do not auto-close single/double quotes after word characters', () => {
            usingCursor({
                text: [
                    '',
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                function typeCharacters(viewModel, chars) {
                    for (let i = 0, len = chars.length; i < len; i++) {
                        viewModel.type(chars[i], 'keyboard');
                    }
                }
                // First gif
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste1 = teste\' ok');
                assert.strictEqual(model.getLineContent(1), 'teste1 = teste\' ok');
                viewModel.setSelections('test', [new selection_1.Selection(1, 1000, 1, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste2 = teste \'ok');
                assert.strictEqual(model.getLineContent(2), 'teste2 = teste \'ok\'');
                viewModel.setSelections('test', [new selection_1.Selection(2, 1000, 2, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste3 = teste" ok');
                assert.strictEqual(model.getLineContent(3), 'teste3 = teste" ok');
                viewModel.setSelections('test', [new selection_1.Selection(3, 1000, 3, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste4 = teste "ok');
                assert.strictEqual(model.getLineContent(4), 'teste4 = teste "ok"');
                // Second gif
                viewModel.setSelections('test', [new selection_1.Selection(4, 1000, 4, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste \'');
                assert.strictEqual(model.getLineContent(5), 'teste \'\'');
                viewModel.setSelections('test', [new selection_1.Selection(5, 1000, 5, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste "');
                assert.strictEqual(model.getLineContent(6), 'teste ""');
                viewModel.setSelections('test', [new selection_1.Selection(6, 1000, 6, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste\'');
                assert.strictEqual(model.getLineContent(7), 'teste\'');
                viewModel.setSelections('test', [new selection_1.Selection(7, 1000, 7, 1000)]);
                typeCharacters(viewModel, '\n');
                model.tokenization.forceTokenization(model.getLineCount());
                typeCharacters(viewModel, 'teste"');
                assert.strictEqual(model.getLineContent(8), 'teste"');
            });
        });
        test('issue #37315 - overtypes only those characters that it inserted', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type('asd', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(asd)');
                // overtype!
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(asd)');
                // do not overtype!
                viewModel.setSelections('test', [new selection_1.Selection(2, 4, 2, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'y=());');
            });
        });
        test('issue #37315 - stops overtyping once cursor leaves area', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=())');
            });
        });
        test('issue #37315 - it overtypes only once', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(1, 4, 1, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=())');
            });
        });
        test('issue #37315 - it can remember multiple auto-closed instances', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(())');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(())');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(())');
            });
        });
        test('issue #118270 - auto closing deletes only those characters that it inserted', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type('asd', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=(asd)');
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'x=()');
                // delete closing char!
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'x=');
                // do not delete closing char!
                viewModel.setSelections('test', [new selection_1.Selection(2, 4, 2, 4)]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'y=);');
            });
        });
        test('issue #78527 - does not close quote on odd count', () => {
            usingCursor({
                text: [
                    'std::cout << \'"\' << entryMap'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 29, 1, 29)]);
                viewModel.type('[', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap[]');
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap[""]');
                viewModel.type('a', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap["a"]');
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap["a"]');
                viewModel.type(']', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'std::cout << \'"\' << entryMap["a"]');
            });
        });
        test('issue #85983 - editor.autoClosingBrackets: beforeWhitespace is incorrect for Python', () => {
            const languageId = 'pythonMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '\"', close: '\"', notIn: ['string'] },
                    { open: 'r\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'R\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'u\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'U\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'f\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'F\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'b\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: 'B\"', close: '\"', notIn: ['string', 'comment'] },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'r\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'R\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'u\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'U\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'f\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'F\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'b\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: 'B\'', close: '\'', notIn: ['string', 'comment'] },
                    { open: '`', close: '`', notIn: ['string'] }
                ],
            }));
            usingCursor({
                text: [
                    'foo\'hello\''
                ],
                editorOpts: {
                    autoClosingBrackets: 'beforeWhitespace'
                },
                languageId: languageId
            }, (editor, model, viewModel) => {
                assertType(editor, model, viewModel, 1, 4, '(', '(', `does not auto close @ (1, 4)`);
            });
        });
        test('issue #78975 - Parentheses swallowing does not work when parentheses are inserted by autocomplete', () => {
            usingCursor({
                text: [
                    '<div id'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 8, 1, 8)]);
                viewModel.executeEdits('snippet', [{ range: new range_1.Range(1, 6, 1, 8), text: 'id=""' }], () => [new selection_1.Selection(1, 10, 1, 10)]);
                assert.strictEqual(model.getLineContent(1), '<div id=""');
                viewModel.type('a', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<div id="a"');
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getLineContent(1), '<div id="a"');
            });
        });
        test('issue #78833 - Add config to use old brackets/quotes overtyping', () => {
            usingCursor({
                text: [
                    '',
                    'y=();'
                ],
                languageId: autoClosingLanguageId,
                editorOpts: {
                    autoClosingOvertype: 'always'
                }
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                viewModel.type('x=(', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(1, 4, 1, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'x=()');
                viewModel.setSelections('test', [new selection_1.Selection(2, 4, 2, 4)]);
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'y=();');
            });
        });
        test('issue #15825: accents on mac US intl keyboard', () => {
            usingCursor({
                text: [],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Typing ` + e on the mac US intl kb layout
                viewModel.startComposition();
                viewModel.type('`', 'keyboard');
                viewModel.compositionType('è', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), 'è');
            });
        });
        test('issue #90016: allow accents on mac US intl keyboard to surround selection', () => {
            usingCursor({
                text: [
                    'test'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 5)]);
                // Typing ` + e on the mac US intl kb layout
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'test\'');
            });
        });
        test('issue #53357: Over typing ignores characters after backslash', () => {
            usingCursor({
                text: [
                    'console.log();'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 13, 1, 13)]);
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'\');');
                viewModel.type('it', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'it\');');
                viewModel.type('\\', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'it\\\');');
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getValue(), 'console.log(\'it\\\'\');');
            });
        });
        test('issue #84998: Overtyping Brackets doesn\'t work after backslash', () => {
            usingCursor({
                text: [
                    ''
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                viewModel.type('\\', 'keyboard');
                assert.strictEqual(model.getValue(), '\\');
                viewModel.type('(', 'keyboard');
                assert.strictEqual(model.getValue(), '\\()');
                viewModel.type('abc', 'keyboard');
                assert.strictEqual(model.getValue(), '\\(abc)');
                viewModel.type('\\', 'keyboard');
                assert.strictEqual(model.getValue(), '\\(abc\\)');
                viewModel.type(')', 'keyboard');
                assert.strictEqual(model.getValue(), '\\(abc\\)');
            });
        });
        test('issue #2773: Accents (´`¨^, others?) are inserted in the wrong position (Mac)', () => {
            usingCursor({
                text: [
                    'hello',
                    'world'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Typing ` and pressing shift+down on the mac US intl kb layout
                // Here we're just replaying what the cursor gets
                viewModel.startComposition();
                viewModel.type('`', 'keyboard');
                moveDown(editor, viewModel, true);
                viewModel.compositionType('`', 1, 0, 0, 'keyboard');
                viewModel.compositionType('`', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '`hello\nworld');
                assertCursor(viewModel, new selection_1.Selection(1, 2, 2, 2));
            });
        });
        test('issue #26820: auto close quotes when not used as accents', () => {
            usingCursor({
                text: [
                    ''
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // on the mac US intl kb layout
                // Typing ' + space
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'\'');
                // Typing one more ' + space
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'\'');
                // Typing ' as a closing tag
                model.setValue('\'abc');
                viewModel.setSelections('test', [new selection_1.Selection(1, 5, 1, 5)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'abc\'');
                // quotes before the newly added character are all paired.
                model.setValue('\'abc\'def ');
                viewModel.setSelections('test', [new selection_1.Selection(1, 10, 1, 10)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '\'abc\'def \'\'');
                // No auto closing if there is non-whitespace character after the cursor
                model.setValue('abc');
                viewModel.setSelections('test', [new selection_1.Selection(1, 1, 1, 1)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                // No auto closing if it's after a word.
                model.setValue('abc');
                viewModel.setSelections('test', [new selection_1.Selection(1, 4, 1, 4)]);
                viewModel.startComposition();
                viewModel.type('\'', 'keyboard');
                viewModel.compositionType('\'', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), 'abc\'');
            });
        });
        test('issue #144690: Quotes do not overtype when using US Intl PC keyboard layout', () => {
            usingCursor({
                text: [
                    ''
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                assertCursor(viewModel, new position_1.Position(1, 1));
                // Pressing ' + ' + ;
                viewModel.startComposition();
                viewModel.type(`'`, 'keyboard');
                viewModel.compositionType(`'`, 1, 0, 0, 'keyboard');
                viewModel.compositionType(`'`, 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                viewModel.startComposition();
                viewModel.type(`'`, 'keyboard');
                viewModel.compositionType(`';`, 1, 0, 0, 'keyboard');
                viewModel.compositionType(`';`, 2, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), `'';`);
            });
        });
        test('issue #144693: Typing a quote using US Intl PC keyboard layout always surrounds words', () => {
            usingCursor({
                text: [
                    'const hello = 3;'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 7, 1, 12)]);
                // Pressing ' + e
                viewModel.startComposition();
                viewModel.type(`'`, 'keyboard');
                viewModel.compositionType(`é`, 1, 0, 0, 'keyboard');
                viewModel.compositionType(`é`, 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), `const é = 3;`);
            });
        });
        test('issue #82701: auto close does not execute when IME is canceled via backspace', () => {
            usingCursor({
                text: [
                    '{}'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 2, 1, 2)]);
                // Typing a + backspace
                viewModel.startComposition();
                viewModel.type('a', 'keyboard');
                viewModel.compositionType('', 1, 0, 0, 'keyboard');
                viewModel.endComposition('keyboard');
                assert.strictEqual(model.getValue(), '{}');
            });
        });
        test('issue #20891: All cursors should do the same thing', () => {
            usingCursor({
                text: [
                    'var a = asd'
                ],
                languageId: autoClosingLanguageId
            }, (editor, model, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 9, 1, 9),
                    new selection_1.Selection(1, 12, 1, 12),
                ]);
                // type a `
                viewModel.type('`', 'keyboard');
                assert.strictEqual(model.getValue(), 'var a = `asd`');
            });
        });
        test('issue #41825: Special handling of quotes in surrounding pairs', () => {
            const languageId = 'myMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                surroundingPairs: [
                    { open: '"', close: '"' },
                    { open: '\'', close: '\'' },
                ]
            }));
            const model = createTextModel('var x = \'hi\';', languageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                editor.setSelections([
                    new selection_1.Selection(1, 9, 1, 10),
                    new selection_1.Selection(1, 12, 1, 13)
                ]);
                viewModel.type('"', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'var x = "hi";', 'assert1');
                editor.setSelections([
                    new selection_1.Selection(1, 9, 1, 10),
                    new selection_1.Selection(1, 12, 1, 13)
                ]);
                viewModel.type('\'', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'var x = \'hi\';', 'assert2');
            });
        });
        test('All cursors should do the same thing when deleting left', () => {
            const model = createTextModel([
                'var a = ()'
            ].join('\n'), autoClosingLanguageId);
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(1, 4, 1, 4),
                    new selection_1.Selection(1, 10, 1, 10),
                ]);
                // delete left
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'va a = )');
            });
        });
        test('issue #7100: Mouse word selection is strange when non-word character is at the end of line', () => {
            const model = createTextModel([
                'before.a',
                'before',
                'hello:',
                'there:',
                'this is strange:',
                'here',
                'it',
                'is',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runEditorCommand(null, editor, {
                    position: new position_1.Position(3, 7)
                });
                assertCursor(viewModel, new selection_1.Selection(3, 7, 3, 7));
                coreCommands_1.CoreNavigationCommands.WordSelectDrag.runEditorCommand(null, editor, {
                    position: new position_1.Position(4, 7)
                });
                assertCursor(viewModel, new selection_1.Selection(3, 7, 4, 7));
            });
        });
        test('issue #112039: shift-continuing a double/triple-click and drag selection does not remember its starting mode', () => {
            const model = createTextModel([
                'just some text',
                'and another line',
                'and another one',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.WordSelect.runEditorCommand(null, editor, {
                    position: new position_1.Position(2, 6)
                });
                coreCommands_1.CoreNavigationCommands.MoveToSelect.runEditorCommand(null, editor, {
                    position: new position_1.Position(1, 8),
                });
                assertCursor(viewModel, new selection_1.Selection(2, 12, 1, 6));
            });
        });
        test('issue #158236: Shift click selection does not work on line number indicator', () => {
            const model = createTextModel([
                'just some text',
                'and another line',
                'and another one',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor, viewModel) => {
                coreCommands_1.CoreNavigationCommands.MoveTo.runEditorCommand(null, editor, {
                    position: new position_1.Position(3, 5)
                });
                coreCommands_1.CoreNavigationCommands.LineSelectDrag.runEditorCommand(null, editor, {
                    position: new position_1.Position(2, 1)
                });
                assertCursor(viewModel, new selection_1.Selection(3, 5, 2, 1));
            });
        });
        test('issue #111513: Text gets automatically selected when typing at the same location in another editor', () => {
            const model = createTextModel([
                'just',
                '',
                'some text',
            ].join('\n'));
            withTestCodeEditor(model, {}, (editor1, viewModel1) => {
                editor1.setSelections([
                    new selection_1.Selection(2, 1, 2, 1)
                ]);
                withTestCodeEditor(model, {}, (editor2, viewModel2) => {
                    editor2.setSelections([
                        new selection_1.Selection(2, 1, 2, 1)
                    ]);
                    viewModel2.type('e', 'keyboard');
                    assertCursor(viewModel2, new position_1.Position(2, 2));
                    assertCursor(viewModel1, new position_1.Position(2, 2));
                });
            });
        });
    });
    suite('Undo stops', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('there is an undo stop between typing and deleting left', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A fir line');
                assertCursor(viewModel, new selection_1.Selection(1, 6, 1, 6));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A  line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('there is an undo stop between typing and deleting right', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A firstine');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A  line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting left and typing', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 8, 2, 8)]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                viewModel.type('Second', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'Second line');
                assertCursor(viewModel, new selection_1.Selection(2, 7, 2, 7));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 8, 2, 8));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting left and deleting right', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 8, 2, 8)]);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), '');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), ' line');
                assertCursor(viewModel, new selection_1.Selection(2, 1, 2, 1));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 8, 2, 8));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting right and typing', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 9, 2, 9)]);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                viewModel.type('text', 'keyboard');
                assert.strictEqual(model.getLineContent(2), 'Another text');
                assertCursor(viewModel, new selection_1.Selection(2, 13, 2, 13));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
            });
            model.dispose();
        });
        test('there is an undo stop between deleting right and deleting left', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(2, 9, 2, 9)]);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'An');
                assertCursor(viewModel, new selection_1.Selection(2, 3, 2, 3));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another ');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(2), 'Another line');
                assertCursor(viewModel, new selection_1.Selection(2, 9, 2, 9));
            });
            model.dispose();
        });
        test('inserts undo stop when typing space', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first and interesting', 'keyboard');
                assert.strictEqual(model.getLineContent(1), 'A first and interesting line');
                assertCursor(viewModel, new selection_1.Selection(1, 24, 1, 24));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first and line');
                assertCursor(viewModel, new selection_1.Selection(1, 12, 1, 12));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A first line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), 'A  line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('can undo typing and EOL change in one undo stop', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'A  line',
                'Another line',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [new selection_1.Selection(1, 3, 1, 3)]);
                viewModel.type('first', 'keyboard');
                assert.strictEqual(model.getValue(), 'A first line\nAnother line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                model.pushEOL(1 /* EndOfLineSequence.CRLF */);
                assert.strictEqual(model.getValue(), 'A first line\r\nAnother line');
                assertCursor(viewModel, new selection_1.Selection(1, 8, 1, 8));
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'A  line\nAnother line');
                assertCursor(viewModel, new selection_1.Selection(1, 3, 1, 3));
            });
            model.dispose();
        });
        test('issue #93585: Undo multi cursor edit corrupts document', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'hello world',
                'hello world',
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.setSelections('test', [
                    new selection_1.Selection(2, 7, 2, 12),
                    new selection_1.Selection(1, 7, 1, 12),
                ]);
                viewModel.type('no', 'keyboard');
                assert.strictEqual(model.getValue(), 'hello no\nhello no');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(), 'hello world\nhello world');
            });
            model.dispose();
        });
        test('there is a single undo stop for consecutive whitespaces', () => {
            const model = (0, testTextModel_1.createTextModel)([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.type('a', 'keyboard');
                viewModel.type('b', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type('c', 'keyboard');
                viewModel.type('d', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab  cd', 'assert1');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab  ', 'assert2');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab', 'assert3');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '', 'assert4');
            });
            model.dispose();
        });
        test('there is no undo stop after a single whitespace', () => {
            const model = (0, testTextModel_1.createTextModel)([
                ''
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor, viewModel) => {
                viewModel.type('a', 'keyboard');
                viewModel.type('b', 'keyboard');
                viewModel.type(' ', 'keyboard');
                viewModel.type('c', 'keyboard');
                viewModel.type('d', 'keyboard');
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab cd', 'assert1');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), 'ab', 'assert3');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '', 'assert4');
            });
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2Jyb3dzZXIvY29udHJvbGxlci9jdXJzb3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTRCaEcsa0JBQWtCO0lBRWxCLFNBQVMsTUFBTSxDQUFDLE1BQXVCLEVBQUUsU0FBb0IsRUFBRSxVQUFrQixFQUFFLE1BQWMsRUFBRSxrQkFBMkIsS0FBSztRQUNsSSxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLHFDQUFzQixDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUU7Z0JBQ25FLFFBQVEsRUFBRSxJQUFJLG1CQUFRLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQzthQUMxQyxDQUFDLENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNQLHFDQUFzQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUU7Z0JBQzdELFFBQVEsRUFBRSxJQUFJLG1CQUFRLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQzthQUMxQyxDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsUUFBUSxDQUFDLE1BQXVCLEVBQUUsU0FBb0IsRUFBRSxrQkFBMkIsS0FBSztRQUNoRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLHFDQUFzQixDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3RSxDQUFDO2FBQU0sQ0FBQztZQUNQLHFDQUFzQixDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxNQUF1QixFQUFFLFNBQW9CLEVBQUUs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Q3ZDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzFCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzFCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkRBQTZELEVBQUUsR0FBRyxFQUFFO1lBQ3hFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDN0IsZUFBZSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDbkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsZUFBZSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDbkMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxD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LGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQixZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7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Q0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRCxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFNUMsa0NBQW1CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxD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LEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDekIsQ0FBQyxDQUFDO2dCQUNILFlBQVksQ0FBQyxTQUFTLEVBQUU7b0JBQ3ZCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3pCLENBQUMsQ0FBQztnQkFFSCxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkMsWUFBWSxDQUFDLFNBQVMsRUFBRTtvQkFDdkIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUs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RUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUN6RCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7b0JBQzFELEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUMxRCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVB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