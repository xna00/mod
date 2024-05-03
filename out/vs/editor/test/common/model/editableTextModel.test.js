/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/model/mirrorTextModel", "vs/editor/test/common/model/editableTextModelTestUtils", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, mirrorTextModel_1, editableTextModelTestUtils_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorModel - EditableTextModel.applyEdits updates mightContainRTL', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testApplyEdits(original, edits, before, after) {
            const model = (0, testTextModel_1.createTextModel)(original.join('\n'));
            model.setEOL(0 /* EndOfLineSequence.LF */);
            assert.strictEqual(model.mightContainRTL(), before);
            model.applyEdits(edits);
            assert.strictEqual(model.mightContainRTL(), after);
            model.dispose();
        }
        function editOp(startLineNumber, startColumn, endLineNumber, endColumn, text) {
            return {
                range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
                text: text.join('\n')
            };
        }
        test('start with RTL, insert LTR', () => {
            testApplyEdits(['Hello,\nזוהי עובדה מבוססת שדעתו'], [editOp(1, 1, 1, 1, ['hello'])], true, true);
        });
        test('start with RTL, delete RTL', () => {
            testApplyEdits(['Hello,\nזוהי עובדה מבוססת שדעתו'], [editOp(1, 1, 10, 10, [''])], true, true);
        });
        test('start with RTL, insert RTL', () => {
            testApplyEdits(['Hello,\nזוהי עובדה מבוססת שדעתו'], [editOp(1, 1, 1, 1, ['هناك حقيقة مثبتة منذ زمن طويل'])], true, true);
        });
        test('start with LTR, insert LTR', () => {
            testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['hello'])], false, false);
        });
        test('start with LTR, insert RTL 1', () => {
            testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['هناك حقيقة مثبتة منذ زمن طويل'])], false, true);
        });
        test('start with LTR, insert RTL 2', () => {
            testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['זוהי עובדה מבוססת שדעתו'])], false, true);
        });
    });
    suite('EditorModel - EditableTextModel.applyEdits updates mightContainNonBasicASCII', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testApplyEdits(original, edits, before, after) {
            const model = (0, testTextModel_1.createTextModel)(original.join('\n'));
            model.setEOL(0 /* EndOfLineSequence.LF */);
            assert.strictEqual(model.mightContainNonBasicASCII(), before);
            model.applyEdits(edits);
            assert.strictEqual(model.mightContainNonBasicASCII(), after);
            model.dispose();
        }
        function editOp(startLineNumber, startColumn, endLineNumber, endColumn, text) {
            return {
                range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
                text: text.join('\n')
            };
        }
        test('start with NON-ASCII, insert ASCII', () => {
            testApplyEdits(['Hello,\nZürich'], [editOp(1, 1, 1, 1, ['hello', 'second line'])], true, true);
        });
        test('start with NON-ASCII, delete NON-ASCII', () => {
            testApplyEdits(['Hello,\nZürich'], [editOp(1, 1, 10, 10, [''])], true, true);
        });
        test('start with NON-ASCII, insert NON-ASCII', () => {
            testApplyEdits(['Hello,\nZürich'], [editOp(1, 1, 1, 1, ['Zürich'])], true, true);
        });
        test('start with ASCII, insert ASCII', () => {
            testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['hello', 'second line'])], false, false);
        });
        test('start with ASCII, insert NON-ASCII', () => {
            testApplyEdits(['Hello,\nworld!'], [editOp(1, 1, 1, 1, ['Zürich', 'Zürich'])], false, true);
        });
    });
    suite('EditorModel - EditableTextModel.applyEdits', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function editOp(startLineNumber, startColumn, endLineNumber, endColumn, text) {
            return {
                range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
                text: text.join('\n'),
                forceMoveMarkers: false
            };
        }
        test('high-low surrogates 1', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '📚some',
                'very nice',
                'text'
            ], [
                editOp(1, 2, 1, 2, ['a'])
            ], [
                'a📚some',
                'very nice',
                'text'
            ], 
            /*inputEditsAreInvalid*/ true);
        });
        test('high-low surrogates 2', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '📚some',
                'very nice',
                'text'
            ], [
                editOp(1, 2, 1, 3, ['a'])
            ], [
                'asome',
                'very nice',
                'text'
            ], 
            /*inputEditsAreInvalid*/ true);
        });
        test('high-low surrogates 3', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '📚some',
                'very nice',
                'text'
            ], [
                editOp(1, 1, 1, 2, ['a'])
            ], [
                'asome',
                'very nice',
                'text'
            ], 
            /*inputEditsAreInvalid*/ true);
        });
        test('high-low surrogates 4', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '📚some',
                'very nice',
                'text'
            ], [
                editOp(1, 1, 1, 3, ['a'])
            ], [
                'asome',
                'very nice',
                'text'
            ], 
            /*inputEditsAreInvalid*/ true);
        });
        test('Bug 19872: Undo is funky', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'something',
                ' A',
                '',
                ' B',
                'something else'
            ], [
                editOp(2, 1, 2, 2, ['']),
                editOp(3, 1, 4, 2, [''])
            ], [
                'something',
                'A',
                'B',
                'something else'
            ]);
        });
        test('Bug 19872: Undo is funky (2)', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'something',
                'A',
                'B',
                'something else'
            ], [
                editOp(2, 1, 2, 1, [' ']),
                editOp(3, 1, 3, 1, ['', ' '])
            ], [
                'something',
                ' A',
                '',
                ' B',
                'something else'
            ]);
        });
        test('insert empty text', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 1, [''])
            ], [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('last op is no-op', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 2, ['']),
                editOp(4, 1, 4, 1, [''])
            ], [
                'y First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert text without newline 1', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 1, ['foo '])
            ], [
                'foo My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert text without newline 2', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 3, 1, 3, [' foo'])
            ], [
                'My foo First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert one newline', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 4, 1, 4, ['', ''])
            ], [
                'My ',
                'First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert text with one newline', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 3, 1, 3, [' new line', 'No longer'])
            ], [
                'My new line',
                'No longer First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert text with two newlines', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 3, 1, 3, [' new line', 'One more line in the middle', 'No longer'])
            ], [
                'My new line',
                'One more line in the middle',
                'No longer First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert text with many newlines', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 3, 1, 3, ['', '', '', '', ''])
            ], [
                'My',
                '',
                '',
                '',
                ' First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('insert multiple newlines', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 3, 1, 3, ['', '', '', '', '']),
                editOp(3, 15, 3, 15, ['a', 'b'])
            ], [
                'My',
                '',
                '',
                '',
                ' First Line',
                '\t\tMy Second Line',
                '    Third Linea',
                'b',
                '',
                '1'
            ]);
        });
        test('delete empty text', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 1, [''])
            ], [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('delete text from one line', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 2, [''])
            ], [
                'y First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('delete text from one line 2', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 3, ['a'])
            ], [
                'a First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('delete all text from a line', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 1, 14, [''])
            ], [
                '',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('delete text from two lines', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 4, 2, 6, [''])
            ], [
                'My Second Line',
                '    Third Line',
                '',
                '1'
            ]);
        });
        test('delete text from many lines', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 4, 3, 5, [''])
            ], [
                'My Third Line',
                '',
                '1'
            ]);
        });
        test('delete everything', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '1'
            ], [
                editOp(1, 1, 5, 2, [''])
            ], [
                ''
            ]);
        });
        test('two unrelated edits', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], [
                editOp(2, 1, 2, 3, ['\t']),
                editOp(3, 1, 3, 5, [''])
            ], [
                'My First Line',
                '\tMy Second Line',
                'Third Line',
                '',
                '123'
            ]);
        });
        test('two edits on one line', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], [
                editOp(5, 3, 5, 7, ['']),
                editOp(5, 12, 5, 16, [''])
            ], [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ]);
        });
        test('many edits', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '{"x" : 1}'
            ], [
                editOp(1, 2, 1, 2, ['\n  ']),
                editOp(1, 5, 1, 6, ['']),
                editOp(1, 9, 1, 9, ['\n'])
            ], [
                '{',
                '  "x": 1',
                '}'
            ]);
        });
        test('many edits reversed', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '{',
                '  "x": 1',
                '}'
            ], [
                editOp(1, 2, 2, 3, ['']),
                editOp(2, 6, 2, 6, [' ']),
                editOp(2, 9, 3, 1, [''])
            ], [
                '{"x" : 1}'
            ]);
        });
        test('replacing newlines 1', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '{',
                '"a": true,',
                '',
                '"b": true',
                '}'
            ], [
                editOp(1, 2, 2, 1, ['', '\t']),
                editOp(2, 11, 4, 1, ['', '\t'])
            ], [
                '{',
                '\t"a": true,',
                '\t"b": true',
                '}'
            ]);
        });
        test('replacing newlines 2', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'some text',
                'some more text',
                'now comes an empty line',
                '',
                'after empty line',
                'and the last line'
            ], [
                editOp(1, 5, 3, 1, [' text', 'some more text', 'some more text']),
                editOp(3, 2, 4, 1, ['o more lines', 'asd', 'asd', 'asd']),
                editOp(5, 1, 5, 6, ['zzzzzzzz']),
                editOp(5, 11, 6, 16, ['1', '2', '3', '4'])
            ], [
                'some text',
                'some more text',
                'some more textno more lines',
                'asd',
                'asd',
                'asd',
                'zzzzzzzz empt1',
                '2',
                '3',
                '4ne'
            ]);
        });
        test('advanced 1', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                ' {       "d": [',
                '             null',
                '        ] /*comment*/',
                '        ,"e": /*comment*/ [null] }',
            ], [
                editOp(1, 1, 1, 2, ['']),
                editOp(1, 3, 1, 10, ['', '  ']),
                editOp(1, 16, 2, 14, ['', '    ']),
                editOp(2, 18, 3, 9, ['', '  ']),
                editOp(3, 22, 4, 9, ['']),
                editOp(4, 10, 4, 10, ['', '  ']),
                editOp(4, 28, 4, 28, ['', '    ']),
                editOp(4, 32, 4, 32, ['', '  ']),
                editOp(4, 33, 4, 34, ['', ''])
            ], [
                '{',
                '  "d": [',
                '    null',
                '  ] /*comment*/,',
                '  "e": /*comment*/ [',
                '    null',
                '  ]',
                '}',
            ]);
        });
        test('advanced simplified', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                '   abc',
                ' ,def'
            ], [
                editOp(1, 1, 1, 4, ['']),
                editOp(1, 7, 2, 2, ['']),
                editOp(2, 3, 2, 3, ['', ''])
            ], [
                'abc,',
                'def'
            ]);
        });
        test('issue #144', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'package caddy',
                '',
                'func main() {',
                '\tfmt.Println("Hello World! :)")',
                '}',
                ''
            ], [
                editOp(1, 1, 6, 1, [
                    'package caddy',
                    '',
                    'import "fmt"',
                    '',
                    'func main() {',
                    '\tfmt.Println("Hello World! :)")',
                    '}',
                    ''
                ])
            ], [
                'package caddy',
                '',
                'import "fmt"',
                '',
                'func main() {',
                '\tfmt.Println("Hello World! :)")',
                '}',
                ''
            ]);
        });
        test('issue #2586 Replacing selected end-of-line with newline locks up the document', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'something',
                'interesting'
            ], [
                editOp(1, 10, 2, 1, ['', ''])
            ], [
                'something',
                'interesting'
            ]);
        });
        test('issue #3980', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'class A {',
                '    someProperty = false;',
                '    someMethod() {',
                '    this.someMethod();',
                '    }',
                '}',
            ], [
                editOp(1, 8, 1, 9, ['', '']),
                editOp(3, 17, 3, 18, ['', '']),
                editOp(3, 18, 3, 18, ['    ']),
                editOp(4, 5, 4, 5, ['    ']),
            ], [
                'class A',
                '{',
                '    someProperty = false;',
                '    someMethod()',
                '    {',
                '        this.someMethod();',
                '    }',
                '}',
            ]);
        });
        function testApplyEditsFails(original, edits) {
            const model = (0, testTextModel_1.createTextModel)(original.join('\n'));
            let hasThrown = false;
            try {
                model.applyEdits(edits);
            }
            catch (err) {
                hasThrown = true;
            }
            assert.ok(hasThrown, 'expected model.applyEdits to fail.');
            model.dispose();
        }
        test('touching edits: two inserts at the same position', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'hello world'
            ], [
                editOp(1, 1, 1, 1, ['a']),
                editOp(1, 1, 1, 1, ['b']),
            ], [
                'abhello world'
            ]);
        });
        test('touching edits: insert and replace touching', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'hello world'
            ], [
                editOp(1, 1, 1, 1, ['b']),
                editOp(1, 1, 1, 3, ['ab']),
            ], [
                'babllo world'
            ]);
        });
        test('overlapping edits: two overlapping replaces', () => {
            testApplyEditsFails([
                'hello world'
            ], [
                editOp(1, 1, 1, 2, ['b']),
                editOp(1, 1, 1, 3, ['ab']),
            ]);
        });
        test('overlapping edits: two overlapping deletes', () => {
            testApplyEditsFails([
                'hello world'
            ], [
                editOp(1, 1, 1, 2, ['']),
                editOp(1, 1, 1, 3, ['']),
            ]);
        });
        test('touching edits: two touching replaces', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'hello world'
            ], [
                editOp(1, 1, 1, 2, ['H']),
                editOp(1, 2, 1, 3, ['E']),
            ], [
                'HEllo world'
            ]);
        });
        test('touching edits: two touching deletes', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'hello world'
            ], [
                editOp(1, 1, 1, 2, ['']),
                editOp(1, 2, 1, 3, ['']),
            ], [
                'llo world'
            ]);
        });
        test('touching edits: insert and replace', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'hello world'
            ], [
                editOp(1, 1, 1, 1, ['H']),
                editOp(1, 1, 1, 3, ['e']),
            ], [
                'Hello world'
            ]);
        });
        test('touching edits: replace and insert', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'hello world'
            ], [
                editOp(1, 1, 1, 3, ['H']),
                editOp(1, 3, 1, 3, ['e']),
            ], [
                'Hello world'
            ]);
        });
        test('change while emitting events 1', () => {
            let disposable;
            (0, editableTextModelTestUtils_1.assertSyncedModels)('Hello', (model, assertMirrorModels) => {
                model.applyEdits([{
                        range: new range_1.Range(1, 6, 1, 6),
                        text: ' world!',
                        // forceMoveMarkers: false
                    }]);
                assertMirrorModels();
            }, (model) => {
                let isFirstTime = true;
                disposable = model.onDidChangeContent(() => {
                    if (!isFirstTime) {
                        return;
                    }
                    isFirstTime = false;
                    model.applyEdits([{
                            range: new range_1.Range(1, 13, 1, 13),
                            text: ' How are you?',
                            // forceMoveMarkers: false
                        }]);
                });
            });
            disposable.dispose();
        });
        test('change while emitting events 2', () => {
            let disposable;
            (0, editableTextModelTestUtils_1.assertSyncedModels)('Hello', (model, assertMirrorModels) => {
                model.applyEdits([{
                        range: new range_1.Range(1, 6, 1, 6),
                        text: ' world!',
                        // forceMoveMarkers: false
                    }]);
                assertMirrorModels();
            }, (model) => {
                let isFirstTime = true;
                disposable = model.onDidChangeContent((e) => {
                    if (!isFirstTime) {
                        return;
                    }
                    isFirstTime = false;
                    model.applyEdits([{
                            range: new range_1.Range(1, 13, 1, 13),
                            text: ' How are you?',
                            // forceMoveMarkers: false
                        }]);
                });
            });
            disposable.dispose();
        });
        test('issue #1580: Changes in line endings are not correctly reflected in the extension host, leading to invalid offsets sent to external refactoring tools', () => {
            const model = (0, testTextModel_1.createTextModel)('Hello\nWorld!');
            assert.strictEqual(model.getEOL(), '\n');
            const mirrorModel2 = new mirrorTextModel_1.MirrorTextModel(null, model.getLinesContent(), model.getEOL(), model.getVersionId());
            let mirrorModel2PrevVersionId = model.getVersionId();
            const disposable = model.onDidChangeContent((e) => {
                const versionId = e.versionId;
                if (versionId < mirrorModel2PrevVersionId) {
                    console.warn('Model version id did not advance between edits (2)');
                }
                mirrorModel2PrevVersionId = versionId;
                mirrorModel2.onEvents(e);
            });
            const assertMirrorModels = () => {
                assert.strictEqual(mirrorModel2.getText(), model.getValue(), 'mirror model 2 text OK');
                assert.strictEqual(mirrorModel2.version, model.getVersionId(), 'mirror model 2 version OK');
            };
            model.setEOL(1 /* EndOfLineSequence.CRLF */);
            assertMirrorModels();
            disposable.dispose();
            model.dispose();
            mirrorModel2.dispose();
        });
        test('issue #47733: Undo mangles unicode characters', () => {
            const model = (0, testTextModel_1.createTextModel)('\'👁\'');
            model.applyEdits([
                { range: new range_1.Range(1, 1, 1, 1), text: '"' },
                { range: new range_1.Range(1, 2, 1, 2), text: '"' },
            ]);
            assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '"\'"👁\'');
            assert.deepStrictEqual(model.validateRange(new range_1.Range(1, 3, 1, 4)), new range_1.Range(1, 3, 1, 4));
            model.applyEdits([
                { range: new range_1.Range(1, 1, 1, 2), text: null },
                { range: new range_1.Range(1, 3, 1, 4), text: null },
            ]);
            assert.strictEqual(model.getValue(1 /* EndOfLinePreference.LF */), '\'👁\'');
            model.dispose();
        });
        test('issue #48741: Broken undo stack with move lines up with multiple cursors', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'line1',
                'line2',
                'line3',
                '',
            ].join('\n'));
            const undoEdits = model.applyEdits([
                { range: new range_1.Range(4, 1, 4, 1), text: 'line3', },
                { range: new range_1.Range(3, 1, 3, 6), text: null, },
                { range: new range_1.Range(2, 1, 3, 1), text: null, },
                { range: new range_1.Range(3, 6, 3, 6), text: '\nline2' }
            ], true);
            model.applyEdits(undoEdits);
            assert.deepStrictEqual(model.getValue(), 'line1\nline2\nline3\n');
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdGFibGVUZXh0TW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL2VkaXRhYmxlVGV4dE1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLG9FQUFvRSxFQUFFLEdBQUcsRUFBRTtRQUVoRixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxjQUFjLENBQUMsUUFBa0IsRUFBRSxLQUE2QixFQUFFLE1BQWUsRUFBRSxLQUFjO1lBQ3pHLE1BQU0sS0FBSyxHQUFHLElBQUEsK0JBQWUsRUFBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkQsS0FBSyxDQUFDLE1BQU0sOEJBQXNCLENBQUM7WUFFbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFcEQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVELFNBQVMsTUFBTSxDQUFDLGVBQXVCLEVBQUUsV0FBbUIsRUFBRSxhQUFxQixFQUFFLFNBQWlCLEVBQUUsSUFBYztZQUNySCxPQUFPO2dCQUNOLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxTQUFTLENBQUM7Z0JBQ3hFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUNyQixDQUFDO1FBQ0gsQ0FBQztRQUVE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