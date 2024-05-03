/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, utils_1, coreCommands_1, position_1, range_1, cursorMoveCommands_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Cursor move command test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const TEXT = [
            '    \tMy First Line\t ',
            '\tMy Second Line',
            '    Third Line🐶',
            '',
            '1'
        ].join('\n');
        function executeTest(callback) {
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                callback(editor, viewModel);
            });
        }
        test('move left should move to left character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveLeft(viewModel);
                cursorEqual(viewModel, 1, 7);
            });
        });
        test('move left should move to left by n characters', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveLeft(viewModel, 3);
                cursorEqual(viewModel, 1, 5);
            });
        });
        test('move left should move to left by half line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveLeft(viewModel, 1, cursorMoveCommands_1.CursorMove.RawUnit.HalfLine);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move left moves to previous line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 2, 3);
                moveLeft(viewModel, 10);
                cursorEqual(viewModel, 1, 21);
            });
        });
        test('move right should move to right character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 5);
                moveRight(viewModel);
                cursorEqual(viewModel, 1, 6);
            });
        });
        test('move right should move to right by n characters', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 2);
                moveRight(viewModel, 6);
                cursorEqual(viewModel, 1, 8);
            });
        });
        test('move right should move to right by half line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 4);
                moveRight(viewModel, 1, cursorMoveCommands_1.CursorMove.RawUnit.HalfLine);
                cursorEqual(viewModel, 1, 14);
            });
        });
        test('move right moves to next line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveRight(viewModel, 100);
                cursorEqual(viewModel, 2, 1);
            });
        });
        test('move to first character of line from middle', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveToLineStart(viewModel);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move to first character of line from first non white space character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 6);
                moveToLineStart(viewModel);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move to first character of line from first character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 1);
                moveToLineStart(viewModel);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move to first non white space character of line from middle', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveToLineFirstNonWhitespaceCharacter(viewModel);
                cursorEqual(viewModel, 1, 6);
            });
        });
        test('move to first non white space character of line from first non white space character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 6);
                moveToLineFirstNonWhitespaceCharacter(viewModel);
                cursorEqual(viewModel, 1, 6);
            });
        });
        test('move to first non white space character of line from first character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 1);
                moveToLineFirstNonWhitespaceCharacter(viewModel);
                cursorEqual(viewModel, 1, 6);
            });
        });
        test('move to end of line from middle', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveToLineEnd(viewModel);
                cursorEqual(viewModel, 1, 21);
            });
        });
        test('move to end of line from last non white space character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 19);
                moveToLineEnd(viewModel);
                cursorEqual(viewModel, 1, 21);
            });
        });
        test('move to end of line from line end', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 21);
                moveToLineEnd(viewModel);
                cursorEqual(viewModel, 1, 21);
            });
        });
        test('move to last non white space character from middle', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveToLineLastNonWhitespaceCharacter(viewModel);
                cursorEqual(viewModel, 1, 19);
            });
        });
        test('move to last non white space character from last non white space character', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 19);
                moveToLineLastNonWhitespaceCharacter(viewModel);
                cursorEqual(viewModel, 1, 19);
            });
        });
        test('move to last non white space character from line end', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 21);
                moveToLineLastNonWhitespaceCharacter(viewModel);
                cursorEqual(viewModel, 1, 19);
            });
        });
        test('move to center of line not from center', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 8);
                moveToLineCenter(viewModel);
                cursorEqual(viewModel, 1, 11);
            });
        });
        test('move to center of line from center', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 11);
                moveToLineCenter(viewModel);
                cursorEqual(viewModel, 1, 11);
            });
        });
        test('move to center of line from start', () => {
            executeTest((editor, viewModel) => {
                moveToLineStart(viewModel);
                moveToLineCenter(viewModel);
                cursorEqual(viewModel, 1, 11);
            });
        });
        test('move to center of line from end', () => {
            executeTest((editor, viewModel) => {
                moveToLineEnd(viewModel);
                moveToLineCenter(viewModel);
                cursorEqual(viewModel, 1, 11);
            });
        });
        test('move up by cursor move command', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 3, 5);
                cursorEqual(viewModel, 3, 5);
                moveUp(viewModel, 2);
                cursorEqual(viewModel, 1, 5);
                moveUp(viewModel, 1);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move up by model line cursor move command', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 3, 5);
                cursorEqual(viewModel, 3, 5);
                moveUpByModelLine(viewModel, 2);
                cursorEqual(viewModel, 1, 5);
                moveUpByModelLine(viewModel, 1);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move down by model line cursor move command', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 3, 5);
                cursorEqual(viewModel, 3, 5);
                moveDownByModelLine(viewModel, 2);
                cursorEqual(viewModel, 5, 2);
                moveDownByModelLine(viewModel, 1);
                cursorEqual(viewModel, 5, 2);
            });
        });
        test('move up with selection by cursor move command', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 3, 5);
                cursorEqual(viewModel, 3, 5);
                moveUp(viewModel, 1, true);
                cursorEqual(viewModel, 2, 2, 3, 5);
                moveUp(viewModel, 1, true);
                cursorEqual(viewModel, 1, 5, 3, 5);
            });
        });
        test('move up and down with tabs by cursor move command', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 1, 5);
                cursorEqual(viewModel, 1, 5);
                moveDown(viewModel, 4);
                cursorEqual(viewModel, 5, 2);
                moveUp(viewModel, 1);
                cursorEqual(viewModel, 4, 1);
                moveUp(viewModel, 1);
                cursorEqual(viewModel, 3, 5);
                moveUp(viewModel, 1);
                cursorEqual(viewModel, 2, 2);
                moveUp(viewModel, 1);
                cursorEqual(viewModel, 1, 5);
            });
        });
        test('move up and down with end of lines starting from a long one by cursor move command', () => {
            executeTest((editor, viewModel) => {
                moveToEndOfLine(viewModel);
                cursorEqual(viewModel, 1, 21);
                moveToEndOfLine(viewModel);
                cursorEqual(viewModel, 1, 21);
                moveDown(viewModel, 2);
                cursorEqual(viewModel, 3, 17);
                moveDown(viewModel, 1);
                cursorEqual(viewModel, 4, 1);
                moveDown(viewModel, 1);
                cursorEqual(viewModel, 5, 2);
                moveUp(viewModel, 4);
                cursorEqual(viewModel, 1, 21);
            });
        });
        test('move to view top line moves to first visible line if it is first line', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(1, 1, 10, 1);
                moveTo(viewModel, 2, 2);
                moveToTop(viewModel);
                cursorEqual(viewModel, 1, 6);
            });
        });
        test('move to view top line moves to top visible line when first line is not visible', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(2, 1, 10, 1);
                moveTo(viewModel, 4, 1);
                moveToTop(viewModel);
                cursorEqual(viewModel, 2, 2);
            });
        });
        test('move to view top line moves to nth line from top', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(1, 1, 10, 1);
                moveTo(viewModel, 4, 1);
                moveToTop(viewModel, 3);
                cursorEqual(viewModel, 3, 5);
            });
        });
        test('move to view top line moves to last line if n is greater than last visible line number', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(1, 1, 3, 1);
                moveTo(viewModel, 2, 2);
                moveToTop(viewModel, 4);
                cursorEqual(viewModel, 3, 5);
            });
        });
        test('move to view center line moves to the center line', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(3, 1, 3, 1);
                moveTo(viewModel, 2, 2);
                moveToCenter(viewModel);
                cursorEqual(viewModel, 3, 5);
            });
        });
        test('move to view bottom line moves to last visible line if it is last line', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(1, 1, 5, 1);
                moveTo(viewModel, 2, 2);
                moveToBottom(viewModel);
                cursorEqual(viewModel, 5, 1);
            });
        });
        test('move to view bottom line moves to last visible line when last line is not visible', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(2, 1, 3, 1);
                moveTo(viewModel, 2, 2);
                moveToBottom(viewModel);
                cursorEqual(viewModel, 3, 5);
            });
        });
        test('move to view bottom line moves to nth line from bottom', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(1, 1, 5, 1);
                moveTo(viewModel, 4, 1);
                moveToBottom(viewModel, 3);
                cursorEqual(viewModel, 3, 5);
            });
        });
        test('move to view bottom line moves to first line if n is lesser than first visible line number', () => {
            executeTest((editor, viewModel) => {
                viewModel.getCompletelyVisibleViewRange = () => new range_1.Range(2, 1, 5, 1);
                moveTo(viewModel, 4, 1);
                moveToBottom(viewModel, 5);
                cursorEqual(viewModel, 2, 2);
            });
        });
    });
    suite('Cursor move by blankline test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const TEXT = [
            '    \tMy First Line\t ',
            '\tMy Second Line',
            '    Third Line🐶',
            '',
            '1',
            '2',
            '3',
            '',
            '         ',
            'a',
            'b',
        ].join('\n');
        function executeTest(callback) {
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                callback(editor, viewModel);
            });
        }
        test('move down should move to start of next blank line', () => {
            executeTest((editor, viewModel) => {
                moveDownByBlankLine(viewModel, false);
                cursorEqual(viewModel, 4, 1);
            });
        });
        test('move up should move to start of previous blank line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 7, 1);
                moveUpByBlankLine(viewModel, false);
                cursorEqual(viewModel, 4, 1);
            });
        });
        test('move down should skip over whitespace if already on blank line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 8, 1);
                moveDownByBlankLine(viewModel, false);
                cursorEqual(viewModel, 11, 1);
            });
        });
        test('move up should skip over whitespace if already on blank line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 9, 1);
                moveUpByBlankLine(viewModel, false);
                cursorEqual(viewModel, 4, 1);
            });
        });
        test('move up should go to first column of first line if not empty', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 2, 1);
                moveUpByBlankLine(viewModel, false);
                cursorEqual(viewModel, 1, 1);
            });
        });
        test('move down should go to first column of last line if not empty', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 10, 1);
                moveDownByBlankLine(viewModel, false);
                cursorEqual(viewModel, 11, 1);
            });
        });
        test('select down should select to start of next blank line', () => {
            executeTest((editor, viewModel) => {
                moveDownByBlankLine(viewModel, true);
                selectionEqual(viewModel.getSelection(), 4, 1, 1, 1);
            });
        });
        test('select up should select to start of previous blank line', () => {
            executeTest((editor, viewModel) => {
                moveTo(viewModel, 7, 1);
                moveUpByBlankLine(viewModel, true);
                selectionEqual(viewModel.getSelection(), 4, 1, 7, 1);
            });
        });
    });
    // Move command
    function move(viewModel, args) {
        coreCommands_1.CoreNavigationCommands.CursorMove.runCoreEditorCommand(viewModel, args);
    }
    function moveToLineStart(viewModel) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.WrappedLineStart });
    }
    function moveToLineFirstNonWhitespaceCharacter(viewModel) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.WrappedLineFirstNonWhitespaceCharacter });
    }
    function moveToLineCenter(viewModel) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.WrappedLineColumnCenter });
    }
    function moveToLineEnd(viewModel) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.WrappedLineEnd });
    }
    function moveToLineLastNonWhitespaceCharacter(viewModel) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.WrappedLineLastNonWhitespaceCharacter });
    }
    function moveLeft(viewModel, value, by, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.Left, by: by, value: value, select: select });
    }
    function moveRight(viewModel, value, by, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.Right, by: by, value: value, select: select });
    }
    function moveUp(viewModel, noOfLines = 1, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.Up, by: cursorMoveCommands_1.CursorMove.RawUnit.WrappedLine, value: noOfLines, select: select });
    }
    function moveUpByBlankLine(viewModel, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.PrevBlankLine, by: cursorMoveCommands_1.CursorMove.RawUnit.WrappedLine, select: select });
    }
    function moveUpByModelLine(viewModel, noOfLines = 1, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.Up, value: noOfLines, select: select });
    }
    function moveDown(viewModel, noOfLines = 1, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.Down, by: cursorMoveCommands_1.CursorMove.RawUnit.WrappedLine, value: noOfLines, select: select });
    }
    function moveDownByBlankLine(viewModel, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.NextBlankLine, by: cursorMoveCommands_1.CursorMove.RawUnit.WrappedLine, select: select });
    }
    function moveDownByModelLine(viewModel, noOfLines = 1, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.Down, value: noOfLines, select: select });
    }
    function moveToTop(viewModel, noOfLines = 1, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.ViewPortTop, value: noOfLines, select: select });
    }
    function moveToCenter(viewModel, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.ViewPortCenter, select: select });
    }
    function moveToBottom(viewModel, noOfLines = 1, select) {
        move(viewModel, { to: cursorMoveCommands_1.CursorMove.RawDirection.ViewPortBottom, value: noOfLines, select: select });
    }
    function cursorEqual(viewModel, posLineNumber, posColumn, selLineNumber = posLineNumber, selColumn = posColumn) {
        positionEqual(viewModel.getPosition(), posLineNumber, posColumn);
        selectionEqual(viewModel.getSelection(), posLineNumber, posColumn, selLineNumber, selColumn);
    }
    function positionEqual(position, lineNumber, column) {
        assert.deepStrictEqual(position, new position_1.Position(lineNumber, column), 'position equal');
    }
    function selectionEqual(selection, posLineNumber, posColumn, selLineNumber, selColumn) {
        assert.deepStrictEqual({
            selectionStartLineNumber: selection.selectionStartLineNumber,
            selectionStartColumn: selection.selectionStartColumn,
            positionLineNumber: selection.positionLineNumber,
            positionColumn: selection.positionColumn
        }, {
            selectionStartLineNumber: selLineNumber,
            selectionStartColumn: selColumn,
            positionLineNumber: posLineNumber,
            positionColumn: posColumn
        }, 'selection equal');
    }
    function moveTo(viewModel, lineNumber, column, inSelectionMode = false) {
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
    function moveToEndOfLine(viewModel, inSelectionMode = false) {
        if (inSelectionMode) {
            coreCommands_1.CoreNavigationCommands.CursorEndSelect.runCoreEditorCommand(viewModel, {});
        }
        else {
            coreCommands_1.CoreNavigationCommands.CursorEnd.runCoreEditorCommand(viewModel, {});
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yTW92ZUNvbW1hbmQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9jb250cm9sbGVyL2N1cnNvck1vdmVDb21tYW5kLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUV0QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxJQUFJLEdBQUc7WUFDWix3QkFBd0I7WUFDeEIsa0JBQWtCO1lBQ2xCLGtCQUFrQjtZQUNsQixFQUFFO1lBQ0YsR0FBRztTQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWIsU0FBUyxXQUFXLENBQUMsUUFBaUU7WUFDckYsSUFBQSxtQ0FBa0IsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNsRCxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7WUFDcEQsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNqQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEIsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNwQixXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtZQUMxRCxXQUFXLENBQUMs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