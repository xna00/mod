define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/contrib/linesOperations/browser/linesOperations", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, coreCommands_1, position_1, selection_1, linesOperations_1, testCodeEditor_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertSelection(editor, expected) {
        if (!Array.isArray(expected)) {
            expected = [expected];
        }
        assert.deepStrictEqual(editor.getSelections(), expected);
    }
    function executeAction(action, editor) {
        action.run(null, editor, undefined);
    }
    suite('Editor Contrib - Line Operations', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('SortLinesAscendingAction', () => {
            test('should sort selected lines in ascending order', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'omicron',
                    'beta',
                    'alpha'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const sortLinesAscendingAction = new linesOperations_1.SortLinesAscendingAction();
                    editor.setSelection(new selection_1.Selection(1, 1, 3, 5));
                    executeAction(sortLinesAscendingAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron'
                    ]);
                    assertSelection(editor, new selection_1.Selection(1, 1, 3, 7));
                });
            });
            test('should sort lines in ascending order', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'omicron',
                    'beta',
                    'alpha'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const sortLinesAscendingAction = new linesOperations_1.SortLinesAscendingAction();
                    executeAction(sortLinesAscendingAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron'
                    ]);
                });
            });
            test('should sort multiple selections in ascending order', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'omicron',
                    'beta',
                    'alpha',
                    '',
                    'omicron',
                    'beta',
                    'alpha'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const sortLinesAscendingAction = new linesOperations_1.SortLinesAscendingAction();
                    editor.setSelections([new selection_1.Selection(1, 1, 3, 5), new selection_1.Selection(5, 1, 7, 5)]);
                    executeAction(sortLinesAscendingAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron',
                        '',
                        'alpha',
                        'beta',
                        'omicron'
                    ]);
                    const expectedSelections = [
                        new selection_1.Selection(1, 1, 3, 7),
                        new selection_1.Selection(5, 1, 7, 7)
                    ];
                    editor.getSelections().forEach((actualSelection, index) => {
                        assert.deepStrictEqual(actualSelection.toString(), expectedSelections[index].toString());
                    });
                });
            });
        });
        suite('SortLinesDescendingAction', () => {
            test('should sort selected lines in descending order', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'alpha',
                    'beta',
                    'omicron'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const sortLinesDescendingAction = new linesOperations_1.SortLinesDescendingAction();
                    editor.setSelection(new selection_1.Selection(1, 1, 3, 7));
                    executeAction(sortLinesDescendingAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'omicron',
                        'beta',
                        'alpha'
                    ]);
                    assertSelection(editor, new selection_1.Selection(1, 1, 3, 5));
                });
            });
            test('should sort multiple selections in descending order', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'alpha',
                    'beta',
                    'omicron',
                    '',
                    'alpha',
                    'beta',
                    'omicron'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const sortLinesDescendingAction = new linesOperations_1.SortLinesDescendingAction();
                    editor.setSelections([new selection_1.Selection(1, 1, 3, 7), new selection_1.Selection(5, 1, 7, 7)]);
                    executeAction(sortLinesDescendingAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'omicron',
                        'beta',
                        'alpha',
                        '',
                        'omicron',
                        'beta',
                        'alpha'
                    ]);
                    const expectedSelections = [
                        new selection_1.Selection(1, 1, 3, 5),
                        new selection_1.Selection(5, 1, 7, 5)
                    ];
                    editor.getSelections().forEach((actualSelection, index) => {
                        assert.deepStrictEqual(actualSelection.toString(), expectedSelections[index].toString());
                    });
                });
            });
        });
        suite('DeleteDuplicateLinesAction', () => {
            test('should remove duplicate lines within selection', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'alpha',
                    'beta',
                    'beta',
                    'beta',
                    'alpha',
                    'omicron',
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteDuplicateLinesAction = new linesOperations_1.DeleteDuplicateLinesAction();
                    editor.setSelection(new selection_1.Selection(1, 3, 6, 4));
                    executeAction(deleteDuplicateLinesAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron',
                    ]);
                    assertSelection(editor, new selection_1.Selection(1, 1, 3, 7));
                });
            });
            test('should remove duplicate lines', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'alpha',
                    'beta',
                    'beta',
                    'beta',
                    'alpha',
                    'omicron',
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteDuplicateLinesAction = new linesOperations_1.DeleteDuplicateLinesAction();
                    executeAction(deleteDuplicateLinesAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron',
                    ]);
                    assert.ok(editor.getSelection().isEmpty());
                });
            });
            test('should remove duplicate lines in multiple selections', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'alpha',
                    'beta',
                    'beta',
                    'omicron',
                    '',
                    'alpha',
                    'alpha',
                    'beta'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteDuplicateLinesAction = new linesOperations_1.DeleteDuplicateLinesAction();
                    editor.setSelections([new selection_1.Selection(1, 2, 4, 3), new selection_1.Selection(6, 2, 8, 3)]);
                    executeAction(deleteDuplicateLinesAction, editor);
                    assert.deepStrictEqual(model.getLinesContent(), [
                        'alpha',
                        'beta',
                        'omicron',
                        '',
                        'alpha',
                        'beta'
                    ]);
                    const expectedSelections = [
                        new selection_1.Selection(1, 1, 3, 7),
                        new selection_1.Selection(5, 1, 6, 4)
                    ];
                    editor.getSelections().forEach((actualSelection, index) => {
                        assert.deepStrictEqual(actualSelection.toString(), expectedSelections[index].toString());
                    });
                });
            });
        });
        suite('DeleteAllLeftAction', () => {
            test('should delete to the left of the cursor', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'one',
                    'two',
                    'three'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'ne');
                    editor.setSelections([new selection_1.Selection(2, 2, 2, 2), new selection_1.Selection(3, 2, 3, 2)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(2), 'wo');
                    assert.strictEqual(model.getLineContent(3), 'hree');
                });
            });
            test('should jump to the previous line when on first column', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'one',
                    'two',
                    'three'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'onetwo');
                    editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 1, 2, 1)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLinesContent()[0], 'onetwothree');
                    assert.strictEqual(model.getLinesContent().length, 1);
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLinesContent()[0], 'onetwothree');
                });
            });
            test('should keep deleting lines in multi cursor mode', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hi my name is Carlos Matos',
                    'BCC',
                    'waso waso waso',
                    'my wife doesnt believe in me',
                    'nonononono',
                    'bitconneeeect'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    const beforeSecondWasoSelection = new selection_1.Selection(3, 5, 3, 5);
                    const endOfBCCSelection = new selection_1.Selection(2, 4, 2, 4);
                    const endOfNonono = new selection_1.Selection(5, 11, 5, 11);
                    editor.setSelections([beforeSecondWasoSelection, endOfBCCSelection, endOfNonono]);
                    executeAction(deleteAllLeftAction, editor);
                    let selections = editor.getSelections();
                    assert.strictEqual(model.getLineContent(2), '');
                    assert.strictEqual(model.getLineContent(3), ' waso waso');
                    assert.strictEqual(model.getLineContent(5), '');
                    assert.deepStrictEqual([
                        selections[0].startLineNumber,
                        selections[0].startColumn,
                        selections[0].endLineNumber,
                        selections[0].endColumn
                    ], [3, 1, 3, 1]);
                    assert.deepStrictEqual([
                        selections[1].startLineNumber,
                        selections[1].startColumn,
                        selections[1].endLineNumber,
                        selections[1].endColumn
                    ], [2, 1, 2, 1]);
                    assert.deepStrictEqual([
                        selections[2].startLineNumber,
                        selections[2].startColumn,
                        selections[2].endLineNumber,
                        selections[2].endColumn
                    ], [5, 1, 5, 1]);
                    executeAction(deleteAllLeftAction, editor);
                    selections = editor.getSelections();
                    assert.strictEqual(model.getLineContent(1), 'hi my name is Carlos Matos waso waso');
                    assert.strictEqual(selections.length, 2);
                    assert.deepStrictEqual([
                        selections[0].startLineNumber,
                        selections[0].startColumn,
                        selections[0].endLineNumber,
                        selections[0].endColumn
                    ], [1, 27, 1, 27]);
                    assert.deepStrictEqual([
                        selections[1].startLineNumber,
                        selections[1].startColumn,
                        selections[1].endLineNumber,
                        selections[1].endColumn
                    ], [2, 29, 2, 29]);
                });
            });
            test('should work in multi cursor mode', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world',
                    'hello world',
                    'hello',
                    'bonjour',
                    'hola',
                    'world',
                    'hello world',
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelections([new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 4, 1, 4)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'lo');
                    editor.setSelections([new selection_1.Selection(2, 2, 2, 2), new selection_1.Selection(2, 4, 2, 5)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(2), 'd');
                    editor.setSelections([new selection_1.Selection(3, 2, 3, 5), new selection_1.Selection(3, 7, 3, 7)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(3), 'world');
                    editor.setSelections([new selection_1.Selection(4, 3, 4, 3), new selection_1.Selection(4, 5, 5, 4)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(4), 'jour');
                    editor.setSelections([new selection_1.Selection(5, 3, 6, 3), new selection_1.Selection(6, 5, 7, 5), new selection_1.Selection(7, 7, 7, 7)]);
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(5), 'world');
                });
            });
            test('issue #36234: should push undo stop', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'one',
                    'two',
                    'three'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const deleteAllLeftAction = new linesOperations_1.DeleteAllLeftAction();
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'Typing some text here on line ' });
                    assert.strictEqual(model.getLineContent(1), 'Typing some text here on line one');
                    assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 31, 1, 31));
                    executeAction(deleteAllLeftAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'one');
                    assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 1, 1));
                    coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                    assert.strictEqual(model.getLineContent(1), 'Typing some text here on line one');
                    assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 31, 1, 31));
                });
            });
        });
        suite('JoinLinesAction', () => {
            test('should join lines and insert space if necessary', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world',
                    'hello ',
                    'world',
                    'hello		',
                    '	world',
                    'hello   ',
                    '	world',
                    '',
                    '',
                    'hello world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'hello world');
                    assertSelection(editor, new selection_1.Selection(1, 6, 1, 6));
                    editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(2), 'hello world');
                    assertSelection(editor, new selection_1.Selection(2, 7, 2, 7));
                    editor.setSelection(new selection_1.Selection(3, 2, 3, 2));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(3), 'hello world');
                    assertSelection(editor, new selection_1.Selection(3, 7, 3, 7));
                    editor.setSelection(new selection_1.Selection(4, 2, 5, 3));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(4), 'hello world');
                    assertSelection(editor, new selection_1.Selection(4, 2, 4, 8));
                    editor.setSelection(new selection_1.Selection(5, 1, 7, 3));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(5), 'hello world');
                    assertSelection(editor, new selection_1.Selection(5, 1, 5, 3));
                });
            });
            test('#50471 Join lines at the end of document', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'hello');
                    assert.strictEqual(model.getLineContent(2), 'world');
                    assertSelection(editor, new selection_1.Selection(2, 6, 2, 6));
                });
            });
            test('should work in multi cursor mode', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world',
                    'hello ',
                    'world',
                    'hello		',
                    '	world',
                    'hello   ',
                    '	world',
                    '',
                    '',
                    'hello world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelections([
                        /** primary cursor */
                        new selection_1.Selection(5, 2, 5, 2),
                        new selection_1.Selection(1, 2, 1, 2),
                        new selection_1.Selection(3, 2, 4, 2),
                        new selection_1.Selection(5, 4, 6, 3),
                        new selection_1.Selection(7, 5, 8, 4),
                        new selection_1.Selection(10, 1, 10, 1)
                    ]);
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLinesContent().join('\n'), 'hello world\nhello world\nhello world\nhello world\n\nhello world');
                    assertSelection(editor, [
                        /** primary cursor */
                        new selection_1.Selection(3, 4, 3, 8),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(2, 2, 2, 8),
                        new selection_1.Selection(4, 5, 4, 9),
                        new selection_1.Selection(6, 1, 6, 1)
                    ]);
                });
            });
            test('should push undo stop', function () {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const joinLinesAction = new linesOperations_1.JoinLinesAction();
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' my dear' });
                    assert.strictEqual(model.getLineContent(1), 'hello my dear');
                    assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 14));
                    executeAction(joinLinesAction, editor);
                    assert.strictEqual(model.getLineContent(1), 'hello my dear world');
                    assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 14));
                    coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                    assert.strictEqual(model.getLineContent(1), 'hello my dear');
                    assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 14));
                });
            });
        });
        test('transpose', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'hello world',
                '',
                '',
                '   ',
            ], {}, (editor) => {
                const model = editor.getModel();
                const transposeAction = new linesOperations_1.TransposeAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(1), 'hello world');
                assertSelection(editor, new selection_1.Selection(1, 2, 1, 2));
                editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(1), 'hell oworld');
                assertSelection(editor, new selection_1.Selection(1, 7, 1, 7));
                editor.setSelection(new selection_1.Selection(1, 12, 1, 12));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(1), 'hell oworl');
                assertSelection(editor, new selection_1.Selection(2, 2, 2, 2));
                editor.setSelection(new selection_1.Selection(3, 1, 3, 1));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(3), '');
                assertSelection(editor, new selection_1.Selection(4, 1, 4, 1));
                editor.setSelection(new selection_1.Selection(4, 2, 4, 2));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(4), '   ');
                assertSelection(editor, new selection_1.Selection(4, 3, 4, 3));
            });
            // fix #16633
            (0, testCodeEditor_1.withTestCodeEditor)([
                '',
                '',
                'hello',
                'world',
                '',
                'hello world',
                '',
                'hello world'
            ], {}, (editor) => {
                const model = editor.getModel();
                const transposeAction = new linesOperations_1.TransposeAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(2), '');
                assertSelection(editor, new selection_1.Selection(2, 1, 2, 1));
                editor.setSelection(new selection_1.Selection(3, 6, 3, 6));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(4), 'oworld');
                assertSelection(editor, new selection_1.Selection(4, 2, 4, 2));
                editor.setSelection(new selection_1.Selection(6, 12, 6, 12));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(7), 'd');
                assertSelection(editor, new selection_1.Selection(7, 2, 7, 2));
                editor.setSelection(new selection_1.Selection(8, 12, 8, 12));
                executeAction(transposeAction, editor);
                assert.strictEqual(model.getLineContent(8), 'hello world');
                assertSelection(editor, new selection_1.Selection(8, 12, 8, 12));
            });
        });
        test('toggle case', function () {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'hello world',
                'öçşğü',
                'parseHTMLString',
                'getElementById',
                'insertHTML',
                'PascalCase',
                'CSSSelectorsList',
                'iD',
                'tEST',
                'öçşÖÇŞğüĞÜ',
                'audioConverter.convertM4AToMP3();',
                'snake_case',
                'Capital_Snake_Case',
                `function helloWorld() {
				return someGlobalObject.printHelloWorld("en", "utf-8");
				}
				helloWorld();`.replace(/^\s+/gm, ''),
                `'JavaScript'`,
                'parseHTML4String',
                '_accessor: ServicesAccessor'
            ], {}, (editor) => {
                const model = editor.getModel();
                const uppercaseAction = new linesOperations_1.UpperCaseAction();
                const lowercaseAction = new linesOperations_1.LowerCaseAction();
                const titlecaseAction = new linesOperations_1.TitleCaseAction();
                const snakecaseAction = new linesOperations_1.SnakeCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                executeAction(uppercaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'HELLO WORLD');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 12));
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                executeAction(lowercaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'hello world');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 12));
                editor.setSelection(new selection_1.Selection(1, 3, 1, 3));
                executeAction(uppercaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'HELLO world');
                assertSelection(editor, new selection_1.Selection(1, 3, 1, 3));
                editor.setSelection(new selection_1.Selection(1, 4, 1, 4));
                executeAction(lowercaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'hello world');
                assertSelection(editor, new selection_1.Selection(1, 4, 1, 4));
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'Hello World');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 12));
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                executeAction(uppercaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'ÖÇŞĞÜ');
                assertSelection(editor, new selection_1.Selection(2, 1, 2, 6));
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                executeAction(lowercaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'öçşğü');
                assertSelection(editor, new selection_1.Selection(2, 1, 2, 6));
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'Öçşğü');
                assertSelection(editor, new selection_1.Selection(2, 1, 2, 6));
                editor.setSelection(new selection_1.Selection(3, 1, 3, 16));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(3), 'parse_html_string');
                assertSelection(editor, new selection_1.Selection(3, 1, 3, 18));
                editor.setSelection(new selection_1.Selection(4, 1, 4, 15));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(4), 'get_element_by_id');
                assertSelection(editor, new selection_1.Selection(4, 1, 4, 18));
                editor.setSelection(new selection_1.Selection(5, 1, 5, 11));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(5), 'insert_html');
                assertSelection(editor, new selection_1.Selection(5, 1, 5, 12));
                editor.setSelection(new selection_1.Selection(6, 1, 6, 11));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(6), 'pascal_case');
                assertSelection(editor, new selection_1.Selection(6, 1, 6, 12));
                editor.setSelection(new selection_1.Selection(7, 1, 7, 17));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(7), 'css_selectors_list');
                assertSelection(editor, new selection_1.Selection(7, 1, 7, 19));
                editor.setSelection(new selection_1.Selection(8, 1, 8, 3));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(8), 'i_d');
                assertSelection(editor, new selection_1.Selection(8, 1, 8, 4));
                editor.setSelection(new selection_1.Selection(9, 1, 9, 5));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(9), 't_est');
                assertSelection(editor, new selection_1.Selection(9, 1, 9, 6));
                editor.setSelection(new selection_1.Selection(10, 1, 10, 11));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(10), 'öçş_öç_şğü_ğü');
                assertSelection(editor, new selection_1.Selection(10, 1, 10, 14));
                editor.setSelection(new selection_1.Selection(11, 1, 11, 34));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(11), 'audio_converter.convert_m4a_to_mp3();');
                assertSelection(editor, new selection_1.Selection(11, 1, 11, 38));
                editor.setSelection(new selection_1.Selection(12, 1, 12, 11));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(12), 'snake_case');
                assertSelection(editor, new selection_1.Selection(12, 1, 12, 11));
                editor.setSelection(new selection_1.Selection(13, 1, 13, 19));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(13), 'capital_snake_case');
                assertSelection(editor, new selection_1.Selection(13, 1, 13, 19));
                editor.setSelection(new selection_1.Selection(14, 1, 17, 14));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getValueInRange(new selection_1.Selection(14, 1, 17, 15)), `function hello_world() {
					return some_global_object.print_hello_world("en", "utf-8");
				}
				hello_world();`.replace(/^\s+/gm, ''));
                assertSelection(editor, new selection_1.Selection(14, 1, 17, 15));
                editor.setSelection(new selection_1.Selection(18, 1, 18, 13));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(18), `'java_script'`);
                assertSelection(editor, new selection_1.Selection(18, 1, 18, 14));
                editor.setSelection(new selection_1.Selection(19, 1, 19, 17));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(19), 'parse_html4_string');
                assertSelection(editor, new selection_1.Selection(19, 1, 19, 19));
                editor.setSelection(new selection_1.Selection(20, 1, 20, 28));
                executeAction(snakecaseAction, editor);
                assert.strictEqual(model.getLineContent(20), '_accessor: services_accessor');
                assertSelection(editor, new selection_1.Selection(20, 1, 20, 29));
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                'foO baR BaZ',
                'foO\'baR\'BaZ',
                'foO[baR]BaZ',
                'foO`baR~BaZ',
                'foO^baR%BaZ',
                'foO$baR!BaZ',
                '\'physician\'s assistant\''
            ], {}, (editor) => {
                const model = editor.getModel();
                const titlecaseAction = new linesOperations_1.TitleCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'Foo Bar Baz');
                editor.setSelection(new selection_1.Selection(2, 1, 2, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'Foo\'bar\'baz');
                editor.setSelection(new selection_1.Selection(3, 1, 3, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(3), 'Foo[Bar]Baz');
                editor.setSelection(new selection_1.Selection(4, 1, 4, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(4), 'Foo`Bar~Baz');
                editor.setSelection(new selection_1.Selection(5, 1, 5, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(5), 'Foo^Bar%Baz');
                editor.setSelection(new selection_1.Selection(6, 1, 6, 12));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(6), 'Foo$Bar!Baz');
                editor.setSelection(new selection_1.Selection(7, 1, 7, 23));
                executeAction(titlecaseAction, editor);
                assert.strictEqual(model.getLineContent(7), '\'Physician\'s Assistant\'');
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                'camel from words',
                'from_snake_case',
                'from-kebab-case',
                'alreadyCamel',
                'ReTain_any_CAPitalization',
                'my_var.test_function()',
                'öçş_öç_şğü_ğü'
            ], {}, (editor) => {
                const model = editor.getModel();
                const camelcaseAction = new linesOperations_1.CamelCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 18));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'camelFromWords');
                editor.setSelection(new selection_1.Selection(2, 1, 2, 15));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'fromSnakeCase');
                editor.setSelection(new selection_1.Selection(3, 1, 3, 15));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(3), 'fromKebabCase');
                editor.setSelection(new selection_1.Selection(4, 1, 4, 12));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(4), 'alreadyCamel');
                editor.setSelection(new selection_1.Selection(5, 1, 5, 26));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(5), 'ReTainAnyCAPitalization');
                editor.setSelection(new selection_1.Selection(6, 1, 6, 23));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(6), 'myVar.testFunction()');
                editor.setSelection(new selection_1.Selection(7, 1, 7, 14));
                executeAction(camelcaseAction, editor);
                assert.strictEqual(model.getLineContent(7), 'öçşÖçŞğüĞü');
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                '',
                '   '
            ], {}, (editor) => {
                const model = editor.getModel();
                const uppercaseAction = new linesOperations_1.UpperCaseAction();
                const lowercaseAction = new linesOperations_1.LowerCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                executeAction(uppercaseAction, editor);
                assert.strictEqual(model.getLineContent(1), '');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 1));
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                executeAction(lowercaseAction, editor);
                assert.strictEqual(model.getLineContent(1), '');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 1));
                editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                executeAction(uppercaseAction, editor);
                assert.strictEqual(model.getLineContent(2), '   ');
                assertSelection(editor, new selection_1.Selection(2, 2, 2, 2));
                editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
                executeAction(lowercaseAction, editor);
                assert.strictEqual(model.getLineContent(2), '   ');
                assertSelection(editor, new selection_1.Selection(2, 2, 2, 2));
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                'hello world',
                'öçşğü',
                'parseHTMLString',
                'getElementById',
                'PascalCase',
                'öçşÖÇŞğüĞÜ',
                'audioConverter.convertM4AToMP3();',
                'Capital_Snake_Case',
                'parseHTML4String',
                '_accessor: ServicesAccessor',
                'Kebab-Case',
            ], {}, (editor) => {
                const model = editor.getModel();
                const kebabCaseAction = new linesOperations_1.KebabCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'hello world');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 12));
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'öçşğü');
                assertSelection(editor, new selection_1.Selection(2, 1, 2, 6));
                editor.setSelection(new selection_1.Selection(3, 1, 3, 16));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(3), 'parse-html-string');
                assertSelection(editor, new selection_1.Selection(3, 1, 3, 18));
                editor.setSelection(new selection_1.Selection(4, 1, 4, 15));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(4), 'get-element-by-id');
                assertSelection(editor, new selection_1.Selection(4, 1, 4, 18));
                editor.setSelection(new selection_1.Selection(5, 1, 5, 11));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(5), 'pascal-case');
                assertSelection(editor, new selection_1.Selection(5, 1, 5, 12));
                editor.setSelection(new selection_1.Selection(6, 1, 6, 11));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(6), 'öçş-öç-şğü-ğü');
                assertSelection(editor, new selection_1.Selection(6, 1, 6, 14));
                editor.setSelection(new selection_1.Selection(7, 1, 7, 34));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(7), 'audio-converter.convert-m4a-to-mp3();');
                assertSelection(editor, new selection_1.Selection(7, 1, 7, 38));
                editor.setSelection(new selection_1.Selection(8, 1, 8, 19));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(8), 'capital-snake-case');
                assertSelection(editor, new selection_1.Selection(8, 1, 8, 19));
                editor.setSelection(new selection_1.Selection(9, 1, 9, 17));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(9), 'parse-html4-string');
                assertSelection(editor, new selection_1.Selection(9, 1, 9, 19));
                editor.setSelection(new selection_1.Selection(10, 1, 10, 28));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(10), '_accessor: services-accessor');
                assertSelection(editor, new selection_1.Selection(10, 1, 10, 29));
                editor.setSelection(new selection_1.Selection(11, 1, 11, 11));
                executeAction(kebabCaseAction, editor);
                assert.strictEqual(model.getLineContent(11), 'kebab-case');
                assertSelection(editor, new selection_1.Selection(11, 1, 11, 11));
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                'hello world',
                'öçşğü',
                'parseHTMLString',
                'getElementById',
                'PascalCase',
                'öçşÖÇŞğüĞÜ',
                'audioConverter.convertM4AToMP3();',
                'Capital_Snake_Case',
                'parseHTML4String',
                'Kebab-Case',
            ], {}, (editor) => {
                const model = editor.getModel();
                const pascalCaseAction = new linesOperations_1.PascalCaseAction();
                editor.setSelection(new selection_1.Selection(1, 1, 1, 12));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(1), 'HelloWorld');
                assertSelection(editor, new selection_1.Selection(1, 1, 1, 11));
                editor.setSelection(new selection_1.Selection(2, 1, 2, 6));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(2), 'Öçşğü');
                assertSelection(editor, new selection_1.Selection(2, 1, 2, 6));
                editor.setSelection(new selection_1.Selection(3, 1, 3, 16));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(3), 'ParseHTMLString');
                assertSelection(editor, new selection_1.Selection(3, 1, 3, 16));
                editor.setSelection(new selection_1.Selection(4, 1, 4, 15));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(4), 'GetElementById');
                assertSelection(editor, new selection_1.Selection(4, 1, 4, 15));
                editor.setSelection(new selection_1.Selection(5, 1, 5, 11));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(5), 'PascalCase');
                assertSelection(editor, new selection_1.Selection(5, 1, 5, 11));
                editor.setSelection(new selection_1.Selection(6, 1, 6, 11));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(6), 'ÖçşÖÇŞğüĞÜ');
                assertSelection(editor, new selection_1.Selection(6, 1, 6, 11));
                editor.setSelection(new selection_1.Selection(7, 1, 7, 34));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(7), 'AudioConverter.ConvertM4AToMP3();');
                assertSelection(editor, new selection_1.Selection(7, 1, 7, 34));
                editor.setSelection(new selection_1.Selection(8, 1, 8, 19));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(8), 'CapitalSnakeCase');
                assertSelection(editor, new selection_1.Selection(8, 1, 8, 17));
                editor.setSelection(new selection_1.Selection(9, 1, 9, 17));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(9), 'ParseHTML4String');
                assertSelection(editor, new selection_1.Selection(9, 1, 9, 17));
                editor.setSelection(new selection_1.Selection(10, 1, 10, 11));
                executeAction(pascalCaseAction, editor);
                assert.strictEqual(model.getLineContent(10), 'KebabCase');
                assertSelection(editor, new selection_1.Selection(10, 1, 10, 10));
            });
        });
        suite('DeleteAllRightAction', () => {
            test('should be noop on empty', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([''], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                    editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 1, 1, 1)]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                });
            });
            test('should delete selected range', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelection(new selection_1.Selection(1, 2, 1, 5));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['ho', 'world']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 2, 1, 2)]);
                    editor.setSelection(new selection_1.Selection(1, 1, 2, 4));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['ld']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 3));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 1, 1, 1)]);
                });
            });
            test('should delete to the right of the cursor', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelection(new selection_1.Selection(1, 3, 1, 3));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['he', 'world']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 3, 1, 3)]);
                    editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['he', '']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(2, 1, 2, 1)]);
                });
            });
            test('should join two lines, if at the end of the line', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['helloworld']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['hello']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                    editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['hello']);
                    assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                });
            });
            test('should work with multiple cursors', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'there',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelections([
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(3, 4, 3, 4),
                    ]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['hethere', 'wor']);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['he', 'wor']);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['hewor']);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6)
                    ]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['he']);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3)
                    ]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['he']);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3)
                    ]);
                });
            });
            test('should work with undo/redo', () => {
                (0, testCodeEditor_1.withTestCodeEditor)([
                    'hello',
                    'there',
                    'world'
                ], {}, (editor) => {
                    const model = editor.getModel();
                    const action = new linesOperations_1.DeleteAllRightAction();
                    editor.setSelections([
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(3, 4, 3, 4),
                    ]);
                    executeAction(action, editor);
                    assert.deepStrictEqual(model.getLinesContent(), ['hethere', 'wor']);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                    coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(1, 6, 1, 6),
                        new selection_1.Selection(3, 4, 3, 4)
                    ]);
                    coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                    assert.deepStrictEqual(editor.getSelections(), [
                        new selection_1.Selection(1, 3, 1, 3),
                        new selection_1.Selection(2, 4, 2, 4)
                    ]);
                });
            });
        });
        test('InsertLineBeforeAction', () => {
            function testInsertLineBefore(lineNumber, column, callback) {
                const TEXT = [
                    'First line',
                    'Second line',
                    'Third line'
                ];
                (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                    editor.setPosition(new position_1.Position(lineNumber, column));
                    const insertLineBeforeAction = new linesOperations_1.InsertLineBeforeAction();
                    executeAction(insertLineBeforeAction, editor);
                    callback(editor.getModel(), viewModel);
                });
            }
            testInsertLineBefore(1, 3, (model, viewModel) => {
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(1, 1, 1, 1));
                assert.strictEqual(model.getLineContent(1), '');
                assert.strictEqual(model.getLineContent(2), 'First line');
                assert.strictEqual(model.getLineContent(3), 'Second line');
                assert.strictEqual(model.getLineContent(4), 'Third line');
            });
            testInsertLineBefore(2, 3, (model, viewModel) => {
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(2, 1, 2, 1));
                assert.strictEqual(model.getLineContent(1), 'First line');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), 'Second line');
                assert.strictEqual(model.getLineContent(4), 'Third line');
            });
            testInsertLineBefore(3, 3, (model, viewModel) => {
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(3, 1, 3, 1));
                assert.strictEqual(model.getLineContent(1), 'First line');
                assert.strictEqual(model.getLineContent(2), 'Second line');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), 'Third line');
            });
        });
        test('InsertLineAfterAction', () => {
            function testInsertLineAfter(lineNumber, column, callback) {
                const TEXT = [
                    'First line',
                    'Second line',
                    'Third line'
                ];
                (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                    editor.setPosition(new position_1.Position(lineNumber, column));
                    const insertLineAfterAction = new linesOperations_1.InsertLineAfterAction();
                    executeAction(insertLineAfterAction, editor);
                    callback(editor.getModel(), viewModel);
                });
            }
            testInsertLineAfter(1, 3, (model, viewModel) => {
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(2, 1, 2, 1));
                assert.strictEqual(model.getLineContent(1), 'First line');
                assert.strictEqual(model.getLineContent(2), '');
                assert.strictEqual(model.getLineContent(3), 'Second line');
                assert.strictEqual(model.getLineContent(4), 'Third line');
            });
            testInsertLineAfter(2, 3, (model, viewModel) => {
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(3, 1, 3, 1));
                assert.strictEqual(model.getLineContent(1), 'First line');
                assert.strictEqual(model.getLineContent(2), 'Second line');
                assert.strictEqual(model.getLineContent(3), '');
                assert.strictEqual(model.getLineContent(4), 'Third line');
            });
            testInsertLineAfter(3, 3, (model, viewModel) => {
                assert.deepStrictEqual(viewModel.getSelection(), new selection_1.Selection(4, 1, 4, 1));
                assert.strictEqual(model.getLineContent(1), 'First line');
                assert.strictEqual(model.getLineContent(2), 'Second line');
                assert.strictEqual(model.getLineContent(3), 'Third line');
                assert.strictEqual(model.getLineContent(4), '');
            });
        });
        test('Bug 18276:[editor] Indentation broken when selection is empty', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'function baz() {'
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor) => {
                const indentLinesAction = new linesOperations_1.IndentLinesAction();
                editor.setPosition(new position_1.Position(1, 2));
                executeAction(indentLinesAction, editor);
                assert.strictEqual(model.getLineContent(1), '\tfunction baz() {');
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 3, 1, 3));
                coreCommands_1.CoreEditingCommands.Tab.runEditorCommand(null, editor, null);
                assert.strictEqual(model.getLineContent(1), '\tf\tunction baz() {');
            });
            model.dispose();
        });
        test('issue #80736: Indenting while the cursor is at the start of a line of text causes the added spaces or tab to be selected', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'Some text'
            ].join('\n'), undefined, {
                insertSpaces: false,
            });
            (0, testCodeEditor_1.withTestCodeEditor)(model, {}, (editor) => {
                const indentLinesAction = new linesOperations_1.IndentLinesAction();
                editor.setPosition(new position_1.Position(1, 1));
                executeAction(indentLinesAction, editor);
                assert.strictEqual(model.getLineContent(1), '\tSome text');
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 2, 1, 2));
            });
            model.dispose();
        });
        test('Indenting on empty line should move cursor', () => {
            const model = (0, testTextModel_1.createTextModel)([
                ''
            ].join('\n'));
            (0, testCodeEditor_1.withTestCodeEditor)(model, { useTabStops: false }, (editor) => {
                const indentLinesAction = new linesOperations_1.IndentLinesAction();
                editor.setPosition(new position_1.Position(1, 1));
                executeAction(indentLinesAction, editor);
                assert.strictEqual(model.getLineContent(1), '    ');
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 5, 1, 5));
            });
            model.dispose();
        });
        test('issue #62112: Delete line does not work properly when multiple cursors are on line', () => {
            const TEXT = [
                'a',
                'foo boo',
                'too',
                'c',
            ];
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor) => {
                editor.setSelections([
                    new selection_1.Selection(2, 4, 2, 4),
                    new selection_1.Selection(2, 8, 2, 8),
                    new selection_1.Selection(3, 4, 3, 4),
                ]);
                const deleteLinesAction = new linesOperations_1.DeleteLinesAction();
                executeAction(deleteLinesAction, editor);
                assert.strictEqual(editor.getValue(), 'a\nc');
            });
        });
        function testDeleteLinesCommand(initialText, _initialSelections, resultingText, _resultingSelections) {
            const initialSelections = Array.isArray(_initialSelections) ? _initialSelections : [_initialSelections];
            const resultingSelections = Array.isArray(_resultingSelections) ? _resultingSelections : [_resultingSelections];
            (0, testCodeEditor_1.withTestCodeEditor)(initialText, {}, (editor) => {
                editor.setSelections(initialSelections);
                const deleteLinesAction = new linesOperations_1.DeleteLinesAction();
                executeAction(deleteLinesAction, editor);
                assert.strictEqual(editor.getValue(), resultingText.join('\n'));
                assert.deepStrictEqual(editor.getSelections(), resultingSelections);
            });
        }
        test('empty selection in middle of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3), [
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3));
        });
        test('empty selection at top of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5), [
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('empty selection at end of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 2, 5, 2), [
                'first',
                'second line',
                'third line',
                'fourth line'
            ], new selection_1.Selection(4, 2, 4, 2));
        });
        test('with selection in middle of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 3, 2, 2), [
                'first',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 2, 2, 2));
        });
        test('with selection at top of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 1, 5), [
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('with selection at end of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 2), [
                'first',
                'second line',
                'third line',
                'fourth line'
            ], new selection_1.Selection(4, 2, 4, 2));
        });
        test('with full line selection in middle of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 1, 2, 1), [
                'first',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 2, 1));
        });
        test('with full line selection at top of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 5), [
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('with full line selection at end of lines', function () {
            testDeleteLinesCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 1, 5, 2), [
                'first',
                'second line',
                'third line'
            ], new selection_1.Selection(3, 2, 3, 2));
        });
        test('multicursor 1', function () {
            testDeleteLinesCommand([
                'class P {',
                '',
                '    getA() {',
                '        if (true) {',
                '            return "a";',
                '        }',
                '    }',
                '',
                '    getB() {',
                '        if (true) {',
                '            return "b";',
                '        }',
                '    }',
                '',
                '    getC() {',
                '        if (true) {',
                '            return "c";',
                '        }',
                '    }',
                '}',
            ], [
                new selection_1.Selection(4, 1, 5, 1),
                new selection_1.Selection(10, 1, 11, 1),
                new selection_1.Selection(16, 1, 17, 1),
            ], [
                'class P {',
                '',
                '    getA() {',
                '            return "a";',
                '        }',
                '    }',
                '',
                '    getB() {',
                '            return "b";',
                '        }',
                '    }',
                '',
                '    getC() {',
                '            return "c";',
                '        }',
                '    }',
                '}',
            ], [
                new selection_1.Selection(4, 1, 4, 1),
                new selection_1.Selection(9, 1, 9, 1),
                new selection_1.Selection(14, 1, 14, 1),
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNPcGVyYXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2xpbmVzT3BlcmF0aW9ucy90ZXN0L2Jyb3dzZXIvbGluZXNPcGVyYXRpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBa0JBLFNBQVMsZUFBZSxDQUFDLE1BQW1CLEVBQUUsUUFBaUM7UUFDOUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUM5QixRQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBQ0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLE1BQW9CLEVBQUUsTUFBbUI7UUFDL0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxLQUFLLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1FBRTlDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLElBQUksQ0FBQywrQ0FBK0MsRUFBRTtnQkFDckQsSUFBQSxtQ0FBa0IsRUFDakI7b0JBQ0MsU0FBUztvQkFDVCxNQUFNO29CQUNOLE9BQU87aUJBQ1AsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtvQkFDakIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDO29CQUNqQyxNQUFNLHdCQUF3QixHQUFHLElBQUksMENBQXdCLEVBQUUsQ0FBQztvQkFFaEUsTUFBTSxDQUFDLFlBQVks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SUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXBELE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ2pGLGVBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXBELE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7Z0JBQ2hFLGVBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXBELE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7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