/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/wordOperations/browser/wordOperations", "vs/editor/contrib/wordOperations/test/browser/wordTestUtils", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, coreCommands_1, position_1, selection_1, language_1, languageConfigurationRegistry_1, wordOperations_1, wordTestUtils_1, testCodeEditor_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WordOperations', () => {
        const _cursorWordStartLeft = new wordOperations_1.CursorWordStartLeft();
        const _cursorWordEndLeft = new wordOperations_1.CursorWordEndLeft();
        const _cursorWordLeft = new wordOperations_1.CursorWordLeft();
        const _cursorWordStartLeftSelect = new wordOperations_1.CursorWordStartLeftSelect();
        const _cursorWordEndLeftSelect = new wordOperations_1.CursorWordEndLeftSelect();
        const _cursorWordLeftSelect = new wordOperations_1.CursorWordLeftSelect();
        const _cursorWordStartRight = new wordOperations_1.CursorWordStartRight();
        const _cursorWordEndRight = new wordOperations_1.CursorWordEndRight();
        const _cursorWordRight = new wordOperations_1.CursorWordRight();
        const _cursorWordStartRightSelect = new wordOperations_1.CursorWordStartRightSelect();
        const _cursorWordEndRightSelect = new wordOperations_1.CursorWordEndRightSelect();
        const _cursorWordRightSelect = new wordOperations_1.CursorWordRightSelect();
        const _cursorWordAccessibilityLeft = new wordOperations_1.CursorWordAccessibilityLeft();
        const _cursorWordAccessibilityLeftSelect = new wordOperations_1.CursorWordAccessibilityLeftSelect();
        const _cursorWordAccessibilityRight = new wordOperations_1.CursorWordAccessibilityRight();
        const _cursorWordAccessibilityRightSelect = new wordOperations_1.CursorWordAccessibilityRightSelect();
        const _deleteWordLeft = new wordOperations_1.DeleteWordLeft();
        const _deleteWordStartLeft = new wordOperations_1.DeleteWordStartLeft();
        const _deleteWordEndLeft = new wordOperations_1.DeleteWordEndLeft();
        const _deleteWordRight = new wordOperations_1.DeleteWordRight();
        const _deleteWordStartRight = new wordOperations_1.DeleteWordStartRight();
        const _deleteWordEndRight = new wordOperations_1.DeleteWordEndRight();
        const _deleteInsideWord = new wordOperations_1.DeleteInsideWord();
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function runEditorCommand(editor, command) {
            instantiationService.invokeFunction((accessor) => {
                command.runEditorCommand(accessor, editor, null);
            });
        }
        function cursorWordLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordLeftSelect : _cursorWordLeft);
        }
        function cursorWordAccessibilityLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordAccessibilityLeft : _cursorWordAccessibilityLeftSelect);
        }
        function cursorWordAccessibilityRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordAccessibilityRightSelect : _cursorWordAccessibilityRight);
        }
        function cursorWordStartLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordStartLeftSelect : _cursorWordStartLeft);
        }
        function cursorWordEndLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordEndLeftSelect : _cursorWordEndLeft);
        }
        function cursorWordRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordRightSelect : _cursorWordRight);
        }
        function moveWordEndRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordEndRightSelect : _cursorWordEndRight);
        }
        function moveWordStartRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordStartRightSelect : _cursorWordStartRight);
        }
        function deleteWordLeft(editor) {
            runEditorCommand(editor, _deleteWordLeft);
        }
        function deleteWordStartLeft(editor) {
            runEditorCommand(editor, _deleteWordStartLeft);
        }
        function deleteWordEndLeft(editor) {
            runEditorCommand(editor, _deleteWordEndLeft);
        }
        function deleteWordRight(editor) {
            runEditorCommand(editor, _deleteWordRight);
        }
        function deleteWordStartRight(editor) {
            runEditorCommand(editor, _deleteWordStartRight);
        }
        function deleteWordEndRight(editor) {
            runEditorCommand(editor, _deleteWordEndRight);
        }
        function deleteInsideWord(editor) {
            _deleteInsideWord.run(null, editor, null);
        }
        test('cursorWordLeft - simple', () => {
            const EXPECTED = [
                '|    \t|My |First |Line\t ',
                '|\t|My |Second |Line',
                '|    |Third |Line🐶',
                '|',
                '|1',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordLeft - with selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor) => {
                editor.setPosition(new position_1.Position(5, 2));
                cursorWordLeft(editor, true);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(5, 2, 5, 1));
            });
        });
        test('cursorWordLeft - issue #832', () => {
            const EXPECTED = ['|   |/* |Just |some   |more   |text |a|+= |3 |+|5-|3 |+ |7 |*/  '].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordLeft - issue #48046: Word selection doesn\'t work as usual', () => {
            const EXPECTED = [
                '|deep.|object.|property',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 21), ed => cursorWordLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordLeft - Recognize words', () => {
            const EXPECTED = [
                '|/* |これ|は|テスト|です |/*',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordLeft(ed, true), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)), {
                wordSegmenterLocales: 'ja'
            });
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordLeft - Does not recognize words', () => {
            const EXPECTED = [
                '|/* |これはテストです |/*',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordLeft(ed, true), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)), {
                wordSegmenterLocales: ''
            });
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordLeftSelect - issue #74369: cursorWordLeft and cursorWordLeftSelect do not behave consistently', () => {
            const EXPECTED = [
                '|this.|is.|a.|test',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 15), ed => cursorWordLeft(ed, true), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordStartLeft', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['|   |/* |Just |some   |more   |text |a|+= |3 |+|5|-|3 |+ |7 |*/  '].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordStartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordStartLeft - issue #51119: regression makes VS compatibility impossible', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['|this|.|is|.|a|.|test'].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordStartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #51275 - cursorWordStartLeft does not push undo/redo stack element', () => {
            function type(viewModel, text) {
                for (let i = 0; i < text.length; i++) {
                    viewModel.type(text.charAt(i), 'keyboard');
                }
            }
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                type(viewModel, 'foo bar baz');
                assert.strictEqual(editor.getValue(), 'foo bar baz');
                cursorWordStartLeft(editor);
                cursorWordStartLeft(editor);
                type(viewModel, 'q');
                assert.strictEqual(editor.getValue(), 'foo qbar baz');
                coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                assert.strictEqual(editor.getValue(), 'foo bar baz');
            });
        });
        test('cursorWordEndLeft', () => {
            const EXPECTED = ['|   /*| Just| some|   more|   text| a|+=| 3| +|5|-|3| +| 7| */|  '].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordEndLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordRight - simple', () => {
            const EXPECTED = [
                '    \tMy| First| Line|\t |',
                '\tMy| Second| Line|',
                '    Third| Line🐶|',
                '|',
                '1|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(5, 2)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordRight - selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                editor.setPosition(new position_1.Position(1, 1));
                cursorWordRight(editor, true);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 1, 8));
            });
        });
        test('cursorWordRight - issue #832', () => {
            const EXPECTED = [
                '   /*| Just| some|   more|   text| a|+=| 3| +5|-3| +| 7| */|  |',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordRight - issue #41199', () => {
            const EXPECTED = [
                'console|.log|(err|)|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 17)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordRight - Recognize words', () => {
            const EXPECTED = [
                '/*| これ|は|テスト|です|/*|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 14)), {
                wordSegmenterLocales: 'ja'
            });
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordRight - Does not recognize words', () => {
            const EXPECTED = [
                '/*| これはテストです|/*|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 14)), {
                wordSegmenterLocales: ''
            });
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('moveWordEndRight', () => {
            const EXPECTED = [
                '   /*| Just| some|   more|   text| a|+=| 3| +5|-3| +| 7| */|  |',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => moveWordEndRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('moveWordStartRight', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = [
                '   |/* |Just |some   |more   |text |a|+= |3 |+|5|-|3 |+ |7 |*/  |',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => moveWordStartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #51119: cursorWordStartRight regression makes VS compatibility impossible', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['this|.|is|.|a|.|test|'].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => moveWordStartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 15)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #64810: cursorWordStartRight skips first word after newline', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['Hello |World|', '|Hei |mailman|'].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => moveWordStartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(2, 12)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordAccessibilityLeft', () => {
            const EXPECTED = ['|   /* |Just |some   |more   |text |a+= |3 +|5-|3 + |7 */  '].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordAccessibilityLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordAccessibilityRight', () => {
            const EXPECTED = ['   /* |Just |some   |more   |text |a+= |3 +|5-|3 + |7 */  |'].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordAccessibilityRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordLeft for non-empty selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setSelection(new selection_1.Selection(3, 7, 3, 9));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(3), '    Thd Line🐶');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(3, 7));
            });
        });
        test('deleteWordLeft for cursor at beginning of document', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 1));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(1), '    \tMy First Line\t ');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 1));
            });
        });
        test('deleteWordLeft for cursor at end of whitespace', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(3, 11));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(3), '    Line🐶');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(3, 5));
            });
        });
        test('deleteWordLeft for cursor just behind a word', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 11));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(2), '\tMy  Line');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(2, 5));
            });
        });
        test('deleteWordLeft for cursor inside of a word', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 12));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(1), '    \tMy st Line\t ');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            });
        });
        test('deleteWordRight for non-empty selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setSelection(new selection_1.Selection(3, 7, 3, 9));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(3), '    Thd Line🐶');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(3, 7));
            });
        });
        test('deleteWordRight for cursor at end of document', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(5, 3));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(5), '1');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(5, 2));
            });
        });
        test('deleteWordRight for cursor at beggining of whitespace', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(3, 1));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(3), 'Third Line🐶');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(3, 1));
            });
        });
        test('deleteWordRight for cursor just before a word', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 5));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(2), '\tMy  Line');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(2, 5));
            });
        });
        test('deleteWordRight for cursor inside of a word', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 11));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(1), '    \tMy Fi Line\t ');
                assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 11));
            });
        });
        test('deleteWordLeft - issue #832', () => {
            const EXPECTED = [
                '|   |/* |Just |some |text |a|+= |3 |+|5 |*/|  ',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 10000), ed => deleteWordLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordStartLeft', () => {
            const EXPECTED = [
                '|   |/* |Just |some |text |a|+= |3 |+|5 |*/  ',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 10000), ed => deleteWordStartLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordEndLeft', () => {
            const EXPECTED = [
                '|   /*| Just| some| text| a|+=| 3| +|5| */|  ',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 10000), ed => deleteWordEndLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordLeft - issue #24947', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                '{',
                '}'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(1), '{}');
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                '{',
                '}'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordStartLeft(editor);
                assert.strictEqual(model.getLineContent(1), '{}');
            });
            (0, testCodeEditor_1.withTestCodeEditor)([
                '{',
                '}'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordEndLeft(editor);
                assert.strictEqual(model.getLineContent(1), '{}');
            });
        });
        test('deleteWordRight - issue #832', () => {
            const EXPECTED = '   |/*| Just| some| text| a|+=| 3| +|5|-|3| */|  |';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => deleteWordRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordRight - issue #3882', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'public void Add( int x,',
                '                 int y )'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 24));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(1), 'public void Add( int x,int y )', '001');
            });
        });
        test('deleteWordStartRight - issue #3882', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'public void Add( int x,',
                '                 int y )'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 24));
                deleteWordStartRight(editor);
                assert.strictEqual(model.getLineContent(1), 'public void Add( int x,int y )', '001');
            });
        });
        test('deleteWordEndRight - issue #3882', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'public void Add( int x,',
                '                 int y )'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 24));
                deleteWordEndRight(editor);
                assert.strictEqual(model.getLineContent(1), 'public void Add( int x,int y )', '001');
            });
        });
        test('deleteWordStartRight', () => {
            const EXPECTED = '   |/* |Just |some |text |a|+= |3 |+|5|-|3 |*/  |';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => deleteWordStartRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordEndRight', () => {
            const EXPECTED = '   /*| Just| some| text| a|+=| 3| +|5|-|3| */|  |';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => deleteWordEndRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordRight - issue #3882 (1): Ctrl+Delete removing entire line when used at the end of line', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'A line with text.',
                '   And another one'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 18));
                deleteWordRight(editor);
                assert.strictEqual(model.getLineContent(1), 'A line with text.And another one', '001');
            });
        });
        test('deleteWordLeft - issue #3882 (2): Ctrl+Delete removing entire line when used at the end of line', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'A line with text.',
                '   And another one'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordLeft(editor);
                assert.strictEqual(model.getLineContent(1), 'A line with text.   And another one', '001');
            });
        });
        test('deleteWordLeft - issue #91855: Matching (quote, bracket, paren) doesn\'t get deleted when hitting Ctrl+Backspace', () => {
            const languageId = 'myTestMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                autoClosingPairs: [
                    { open: '\"', close: '\"' }
                ]
            }));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'a ""', languageId));
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model, { autoClosingDelete: 'always' }));
            editor.setPosition(new position_1.Position(1, 4));
            deleteWordLeft(editor);
            assert.strictEqual(model.getLineContent(1), 'a ');
        });
        test('deleteInsideWord - empty line', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'Line1',
                '',
                'Line2'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'Line1\nLine2');
            });
        });
        test('deleteInsideWord - in whitespace 1', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'Just  some text.'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 6));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'Justsome text.');
            });
        });
        test('deleteInsideWord - in whitespace 2', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'Just     some text.'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 6));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'Justsome text.');
            });
        });
        test('deleteInsideWord - in whitespace 3', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'Just     "some text.'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 6));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'Just"some text.');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '"some text.');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'some text.');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'text.');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '.');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
            });
        });
        test('deleteInsideWord - in non-words', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'x=3+4+5+6'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 7));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'x=3+45+6');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'x=3++6');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'x=36');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'x=');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'x');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
            });
        });
        test('deleteInsideWord - in words 1', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'This is interesting'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 7));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'This interesting');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'This');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
            });
        });
        test('deleteInsideWord - in words 2', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'This  is  interesting'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 7));
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'This  interesting');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), 'This');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
                deleteInsideWord(editor);
                assert.strictEqual(model.getValue(), '');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZE9wZXJhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvd29yZE9wZXJhdGlvbnMvdGVzdC9icm93c2VyL3dvcmRPcGVyYXRpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFFNUIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG9DQUFtQixFQUFFLENBQUM7UUFDdkQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLGtDQUFpQixFQUFFLENBQUM7UUFDbkQsTUFBTSxlQUFlLEdBQUcsSUFBSSwrQkFBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLDBDQUF5QixFQUFFLENBQUM7UUFDbkUsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLHdDQUF1QixFQUFFLENBQUM7UUFDL0QsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHFDQUFvQixFQUFFLENBQUM7UUFDekQsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHFDQUFvQixFQUFFLENBQUM7UUFDekQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLG1DQUFrQixFQUFFLENBQUM7UUFDckQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdDQUFlLEVBQUUsQ0FBQztRQUMvQyxNQUFNLDJCQUEyQixHQUFHLElBQUksMkNBQTBCLEVBQUUsQ0FBQztRQUNyRSxNQUFNLHlCQUF5QixHQUFHLElBQUkseUNBQXdCLEVBQUUsQ0FBQztRQUNqRSxNQUFNLHNCQUFzQixHQUFHLElBQUksc0NBQXFCLEVBQUUsQ0FBQztRQUMzRCxNQUFNLDRCQUE0QixHQUFHLElBQUksNENBQTJCLEVBQUUsQ0FBQztRQUN2RSxNQUFNLGtDQUFrQyxHQUFHLElBQUksa0RBQWlDLEVBQUUs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