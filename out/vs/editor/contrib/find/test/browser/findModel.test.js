/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/contrib/find/browser/findModel", "vs/editor/contrib/find/browser/findState", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, lifecycle_1, utils_1, coreCommands_1, position_1, range_1, selection_1, pieceTreeTextBufferBuilder_1, findModel_1, findState_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FindModel', () => {
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function findTest(testName, callback) {
            test(testName, () => {
                const textArr = [
                    '// my cool header',
                    '#include "cool.h"',
                    '#include <iostream>',
                    '',
                    'int main() {',
                    '    cout << "hello world, Hello!" << endl;',
                    '    cout << "hello world again" << endl;',
                    '    cout << "Hello world again" << endl;',
                    '    cout << "helloworld again" << endl;',
                    '}',
                    '// blablablaciao',
                    ''
                ];
                (0, testCodeEditor_1.withTestCodeEditor)(textArr, {}, (editor) => callback(editor));
                const text = textArr.join('\n');
                const ptBuilder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
                ptBuilder.acceptChunk(text.substr(0, 94));
                ptBuilder.acceptChunk(text.substr(94, 101));
                ptBuilder.acceptChunk(text.substr(195, 59));
                const factory = ptBuilder.finish();
                (0, testCodeEditor_1.withTestCodeEditor)(factory, {}, (editor) => callback(editor));
            });
        }
        function fromRange(rng) {
            return [rng.startLineNumber, rng.startColumn, rng.endLineNumber, rng.endColumn];
        }
        function _getFindState(editor) {
            const model = editor.getModel();
            const currentFindMatches = [];
            const allFindMatches = [];
            for (const dec of model.getAllDecorations()) {
                if (dec.options.className === 'currentFindMatch') {
                    currentFindMatches.push(dec.range);
                    allFindMatches.push(dec.range);
                }
                else if (dec.options.className === 'findMatch') {
                    allFindMatches.push(dec.range);
                }
            }
            currentFindMatches.sort(range_1.Range.compareRangesUsingStarts);
            allFindMatches.sort(range_1.Range.compareRangesUsingStarts);
            return {
                highlighted: currentFindMatches.map(fromRange),
                findDecorations: allFindMatches.map(fromRange)
            };
        }
        function assertFindState(editor, cursor, highlighted, findDecorations) {
            assert.deepStrictEqual(fromRange(editor.getSelection()), cursor, 'cursor');
            const expectedState = {
                highlighted: highlighted ? [highlighted] : [],
                findDecorations: findDecorations
            };
            assert.deepStrictEqual(_getFindState(editor), expectedState, 'state');
        }
        findTest('incremental find from beginning of file', (editor) => {
            editor.setPosition({ lineNumber: 1, column: 1 });
            const findState = disposables.add(new findState_1.FindReplaceState());
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            // simulate typing the search string
            findState.change({ searchString: 'H' }, true);
            assertFindState(editor, [1, 12, 1, 13], [1, 12, 1, 13], [
                [1, 12, 1, 13],
                [2, 16, 2, 17],
                [6, 14, 6, 15],
                [6, 27, 6, 28],
                [7, 14, 7, 15],
                [8, 14, 8, 15],
                [9, 14, 9, 15]
            ]);
            // simulate typing the search string
            findState.change({ searchString: 'He' }, true);
            assertFindState(editor, [1, 12, 1, 14], [1, 12, 1, 14], [
                [1, 12, 1, 14],
                [6, 14, 6, 16],
                [6, 27, 6, 29],
                [7, 14, 7, 16],
                [8, 14, 8, 16],
                [9, 14, 9, 16]
            ]);
            // simulate typing the search string
            findState.change({ searchString: 'Hello' }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            // simulate toggling on `matchCase`
            findState.change({ matchCase: true }, true);
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 27, 6, 32],
                [8, 14, 8, 19]
            ]);
            // simulate typing the search string
            findState.change({ searchString: 'hello' }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19]
            ]);
            // simulate toggling on `wholeWord`
            findState.change({ wholeWord: true }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19]
            ]);
            // simulate toggling off `matchCase`
            findState.change({ matchCase: false }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            // simulate toggling off `wholeWord`
            findState.change({ wholeWord: false }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            // simulate adding a search scope
            findState.change({ searchScope: [new range_1.Range(8, 1, 10, 1)] }, true);
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            // simulate removing the search scope
            findState.change({ searchScope: null }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model removes its decorations', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assert.strictEqual(findState.matchesCount, 5);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findModel.dispose();
            findState.dispose();
            assertFindState(editor, [1, 1, 1, 1], null, []);
        });
        findTest('find model updates state matchesCount', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assert.strictEqual(findState.matchesCount, 5);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findState.change({ searchString: 'helloo' }, false);
            assert.strictEqual(findState.matchesCount, 0);
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model reacts to position change', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            editor.trigger('mouse', coreCommands_1.CoreNavigationCommands.MoveTo.id, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findState.change({ searchString: 'Hello' }, true);
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next stays in scope', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true, searchScope: [new range_1.Range(7, 1, 9, 1)] }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('multi-selection find model next stays in scope (overlap)', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true, searchScope: [new range_1.Range(7, 1, 8, 2), new range_1.Range(8, 1, 9, 1)] }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('multi-selection find model next stays in scope', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', matchCase: true, wholeWord: false, searchScope: [new range_1.Range(6, 1, 7, 38), new range_1.Range(9, 3, 9, 38)] }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                // `matchCase: false` would
                // find this match as well:
                // [6, 27, 6, 32],
                [7, 14, 7, 19],
                // `wholeWord: true` would
                // exclude this match:
                [9, 14, 9, 19],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [9, 14, 9, 19], [9, 14, 9, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model prev', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model prev stays in scope', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true, searchScope: [new range_1.Range(7, 1, 9, 1)] }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next/prev with no matches', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'helloo', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.moveToNextMatch();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.moveToPrevMatch();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next/prev respects cursor position', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            editor.trigger('mouse', coreCommands_1.CoreNavigationCommands.MoveTo.id, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find ^', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '^', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1],
                [6, 1, 6, 1],
                [7, 1, 7, 1],
                [8, 1, 8, 1],
                [9, 1, 9, 1],
                [10, 1, 10, 1],
                [11, 1, 11, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 1, 2, 1], [2, 1, 2, 1], [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1],
                [6, 1, 6, 1],
                [7, 1, 7, 1],
                [8, 1, 8, 1],
                [9, 1, 9, 1],
                [10, 1, 10, 1],
                [11, 1, 11, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [3, 1, 3, 1], [3, 1, 3, 1], [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1],
                [6, 1, 6, 1],
                [7, 1, 7, 1],
                [8, 1, 8, 1],
                [9, 1, 9, 1],
                [10, 1, 10, 1],
                [11, 1, 11, 1],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find $', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '$', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [1, 18, 1, 18], [1, 18, 1, 18], [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 18, 2, 18], [2, 18, 2, 18], [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [3, 20, 3, 20], [3, 20, 3, 20], [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find next ^$', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '^$', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [4, 1, 4, 1], [4, 1, 4, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [4, 1, 4, 1], [4, 1, 4, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find .*', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '.*', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find next ^.*$', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '^.*$', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [1, 1, 1, 18], [1, 1, 1, 18], [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 1, 2, 18], [2, 1, 2, 18], [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find prev ^.*$', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '^.*$', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [11, 1, 11, 17], [11, 1, 11, 17], [
                [1, 1, 1, 18],
                [2, 1, 2, 18],
                [3, 1, 3, 20],
                [4, 1, 4, 1],
                [5, 1, 5, 13],
                [6, 1, 6, 43],
                [7, 1, 7, 41],
                [8, 1, 8, 41],
                [9, 1, 9, 40],
                [10, 1, 10, 2],
                [11, 1, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find prev ^$', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '^$', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [4, 1, 4, 1], [4, 1, 4, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace hello', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            editor.trigger('mouse', coreCommands_1.CoreNavigationCommands.MoveTo.id, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello world, hi!" << endl;');
            findModel.replace();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 16, 6, 16], null, []);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hi world, hi!" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace bla', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'bla', replaceString: 'ciao' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            findModel.replace();
            assertFindState(editor, [11, 4, 11, 7], [11, 4, 11, 7], [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(11), '// blablablaciao');
            findModel.replace();
            assertFindState(editor, [11, 8, 11, 11], [11, 8, 11, 11], [
                [11, 8, 11, 11],
                [11, 11, 11, 14]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(11), '// ciaoblablaciao');
            findModel.replace();
            assertFindState(editor, [11, 12, 11, 15], [11, 12, 11, 15], [
                [11, 12, 11, 15]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(11), '// ciaociaoblaciao');
            findModel.replace();
            assertFindState(editor, [11, 16, 11, 16], null, []);
            assert.strictEqual(editor.getModel().getLineContent(11), '// ciaociaociaociao');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll hello', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            editor.trigger('mouse', coreCommands_1.CoreNavigationCommands.MoveTo.id, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replaceAll();
            assertFindState(editor, [6, 17, 6, 17], null, []);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hi world, hi!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll two spaces with one space', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '  ', replaceString: ' ' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 1, 6, 3],
                [6, 3, 6, 5],
                [7, 1, 7, 3],
                [7, 3, 7, 5],
                [8, 1, 8, 3],
                [8, 3, 8, 5],
                [9, 1, 9, 3],
                [9, 3, 9, 5]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 1, 6, 3],
                [7, 1, 7, 3],
                [8, 1, 8, 3],
                [9, 1, 9, 3]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '  cout << "hello world, Hello!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '  cout << "hello world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '  cout << "Hello world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(9), '  cout << "helloworld again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll bla', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'bla', replaceString: 'ciao' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            assert.strictEqual(editor.getModel().getLineContent(11), '// ciaociaociaociao');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll bla with \\t\\n', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'bla', replaceString: '<\\n\\t>', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            assert.strictEqual(editor.getModel().getLineContent(11), '// <');
            assert.strictEqual(editor.getModel().getLineContent(12), '\t><');
            assert.strictEqual(editor.getModel().getLineContent(13), '\t><');
            assert.strictEqual(editor.getModel().getLineContent(14), '\t>ciao');
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #3516: "replace all" moves page/cursor/focus/scroll to the place of the last replacement', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'include', replaceString: 'bar' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [2, 2, 2, 9],
                [3, 2, 3, 9]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            assert.strictEqual(editor.getModel().getLineContent(2), '#bar "cool.h"');
            assert.strictEqual(editor.getModel().getLineContent(3), '#bar <iostream>');
            findModel.dispose();
            findState.dispose();
        });
        findTest('listens to model content changes', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            editor.getModel().setValue('hello\nhi');
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('selectAllMatches', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.selectAllMatches();
            assert.deepStrictEqual(editor.getSelections().map(s => s.toString()), [
                new selection_1.Selection(6, 14, 6, 19),
                new selection_1.Selection(6, 27, 6, 32),
                new selection_1.Selection(7, 14, 7, 19),
                new selection_1.Selection(8, 14, 8, 19)
            ].map(s => s.toString()));
            assertFindState(editor, [6, 14, 6, 19], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #14143 selectAllMatches should maintain primary cursor if feasible', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            editor.setSelection(new range_1.Range(7, 14, 7, 19));
            findModel.selectAllMatches();
            assert.deepStrictEqual(editor.getSelections().map(s => s.toString()), [
                new selection_1.Selection(7, 14, 7, 19),
                new selection_1.Selection(6, 14, 6, 19),
                new selection_1.Selection(6, 27, 6, 32),
                new selection_1.Selection(8, 14, 8, 19)
            ].map(s => s.toString()));
            assert.deepStrictEqual(editor.getSelection().toString(), new selection_1.Selection(7, 14, 7, 19).toString());
            assertFindState(editor, [7, 14, 7, 19], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #1914: NPE when there is only one find match', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'cool.h' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [2, 11, 2, 17]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 11, 2, 17], [2, 11, 2, 17], [
                [2, 11, 2, 17]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 11, 2, 17], [2, 11, 2, 17], [
                [2, 11, 2, 17]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace when search string has look ahed regex', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello(?=\\sworld)', replaceString: 'hi', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.replace();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hi world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            findModel.replace();
            assertFindState(editor, [8, 16, 8, 16], null, []);
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace when search string has look ahed regex and cursor is at the last find match', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello(?=\\sworld)', replaceString: 'hi', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            editor.trigger('mouse', coreCommands_1.CoreNavigationCommands.MoveTo.id, {
                position: new position_1.Position(8, 14)
            });
            assertFindState(editor, [8, 14, 8, 14], null, [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.replace();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "Hello world again" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
            ]);
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            findModel.replace();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hi world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [7, 16, 7, 16], null, []);
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll when search string has look ahed regex', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello(?=\\sworld)', replaceString: 'hi', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.replaceAll();
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hi world, Hello!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace when search string has look ahed regex and replace string has capturing groups', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hel(lo)(?=\\sworld)', replaceString: 'hi$1', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.replace();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hilo world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [8, 14, 8, 19]
            ]);
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hilo world again" << endl;');
            findModel.replace();
            assertFindState(editor, [8, 18, 8, 18], null, []);
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "hilo world again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll when search string has look ahed regex and replace string has capturing groups', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'wo(rl)d(?=.*;$)', replaceString: 'gi$1', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 20, 6, 25],
                [7, 20, 7, 25],
                [8, 20, 8, 25],
                [9, 19, 9, 24]
            ]);
            findModel.replaceAll();
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello girl, Hello!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hello girl again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "Hello girl again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(9), '    cout << "hellogirl again" << endl;');
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll when search string is multiline and has look ahed regex and replace string has capturing groups', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'wo(rl)d(.*;\\n)(?=.*hello)', replaceString: 'gi$1$2', isRegex: true, matchCase: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 20, 7, 1],
                [8, 20, 9, 1]
            ]);
            findModel.replaceAll();
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hello girl, Hello!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "Hello girl again" << endl;');
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll preserving case', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: 'goodbye', isRegex: false, matchCase: false, preserveCase: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19],
            ]);
            findModel.replaceAll();
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "goodbye world, Goodbye!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "goodbye world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << "Goodbye world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(9), '    cout << "goodbyeworld again" << endl;');
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #18711 replaceAll with empty string', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', replaceString: '', wholeWord: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << " world, !" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << " world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(8), '    cout << " world again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #32522 replaceAll with ^ on more than 1000 matches', (editor) => {
            let initialText = '';
            for (let i = 0; i < 1100; i++) {
                initialText += 'line' + i + '\n';
            }
            editor.getModel().setValue(initialText);
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: '^', replaceString: 'a ', isRegex: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            findModel.replaceAll();
            let expectedText = '';
            for (let i = 0; i < 1100; i++) {
                expectedText += 'a line' + i + '\n';
            }
            expectedText += 'a ';
            assert.strictEqual(editor.getModel().getValue(), expectedText);
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #19740 Find and replace capture group/backreference inserts `undefined` instead of empty string', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello(z)?', replaceString: 'hi$1', isRegex: true, matchCase: true }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            assert.strictEqual(editor.getModel().getLineContent(6), '    cout << "hi world, Hello!" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            assert.strictEqual(editor.getModel().getLineContent(9), '    cout << "hiworld again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #27083. search scope works even if it is a single line', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', wholeWord: true, searchScope: [new range_1.Range(7, 1, 8, 1)] }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assertFindState(editor, [1, 1, 1, 1], null, [
                [7, 14, 7, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #3516: Control behavior of "Next" operations (not looping back to beginning)', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello', loop: false }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assert.strictEqual(findState.matchesCount, 5);
            // Test next operations
            assert.strictEqual(findState.matchesPosition, 0);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), false);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 2);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 3);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 4);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 5);
            assert.strictEqual(findState.canNavigateForward(), false);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 5);
            assert.strictEqual(findState.canNavigateForward(), false);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 5);
            assert.strictEqual(findState.canNavigateForward(), false);
            assert.strictEqual(findState.canNavigateBack(), true);
            // Test previous operations
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 4);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 3);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 2);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), false);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), false);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), false);
        });
        findTest('issue #3516: Control behavior of "Next" operations (looping back to beginning)', (editor) => {
            const findState = disposables.add(new findState_1.FindReplaceState());
            findState.change({ searchString: 'hello' }, false);
            const findModel = disposables.add(new findModel_1.FindModelBoundToEditorModel(editor, findState));
            assert.strictEqual(findState.matchesCount, 5);
            // Test next operations
            assert.strictEqual(findState.matchesPosition, 0);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 2);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 3);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 4);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 5);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToNextMatch();
            assert.strictEqual(findState.matchesPosition, 2);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            // Test previous operations
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 5);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 4);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 3);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 2);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
            findModel.moveToPrevMatch();
            assert.strictEqual(findState.matchesPosition, 1);
            assert.strictEqual(findState.canNavigateForward(), true);
            assert.strictEqual(findState.canNavigateBack(), true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZpbmQvdGVzdC9icm93c2VyL2ZpbmRNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBRXZCLElBQUksV0FBNEIsQ0FBQztRQUVqQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLFFBQVEsQ0FBQyxRQUFnQixFQUFFLFFBQTZDO1lBQ2hGLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO2dCQUNuQixNQUFNLE9BQU8sR0FBRztvQkFDZixtQkFBbUI7b0JBQ25CLG1CQUFtQjtvQkFDbkIscUJBQXFCO29CQUNyQixFQUFFO29CQUNGLGNBQWM7b0JBQ2QsNENBQTRDO29CQUM1QywwQ0FBMEM7b0JBQzFDLDBDQUEwQztvQkFDMUMseUNBQXlDO29CQUN6QyxHQUFHO29CQUNILGtCQUFrQjtvQkFDbEIsRUFBRTtpQkFDRixDQUFDO2dCQUNGLElBQUEsbUNBQWtCLEVBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUVuRixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLFNBQVMs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LENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsb0NBQW9DO1lBQ3BDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEQsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixtQ0FBbUM7WUFDbkMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJ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QUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDckQsTUFBTSxTQUFTLEdBQUcs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SSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxnREFBZ0QsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3JFLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNySixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQTJCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSjtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCwyQkFBMkI7Z0JBQzNCLDJCQUEyQjtnQkFDM0Isa0JBQWtCO2dCQUNsQixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCwwQkFBMEI7Z0JBQzFCLHNCQUFzQjtnQkFDdEIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDdEMsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUEyQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDckQsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQTJCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSjtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM1QixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM1QixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM1QixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFD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LEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQzdCLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM1QixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDWixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDZCxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDbkMsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0QsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUEyQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQ2Q7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQzlCLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDYixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNiO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDYixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNiO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUNmO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLE9BQU8sRUFB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LENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLDRDQUE0QyxDQUFDLENBQUM7WUFFdkcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHlDQUF5QyxDQUFDLENBQUM7WUFFcEcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7WUFFbEcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7WUFFbEcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxJQUFJLEVBQ0osRUFBRSxDQUNGLENBQUM7WUFDRixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztZQUVqRyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2xDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNmLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ2hCLENBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFDZDtnQkFDQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDZixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNoQixDQUNELENBQUM7WUFDRixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUU5RSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQ2Y7Z0JBQ0MsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2YsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDaEIsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFL0UsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDaEIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDaEI7Z0JBQ0MsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDaEIsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFaEYsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDaEIsSUFBSSxFQUNKLEVBQUUsQ0FDRixDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFFakYsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3ZDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekYsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUEyQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxxQ0FBc0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFO2dCQUN6RCxRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDN0IsQ0FBQyxDQUFDO1lBQ0gsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkLElBQUksRUFDSjtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO1lBRXZHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN2QixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsSUFBSSxFQUNKLEVBQUUsQ0FDRixDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHNDQUFzQyxDQUFDLENBQUM7WUFDakcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7WUFDbEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7WUFFbEcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQzNELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ1osQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3ZCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDWixDQUNELENBQUM7WUFDRixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsMENBQTBDLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztZQUNuRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztZQUNuRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztZQUVsRyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGdCQUFnQixFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDckMsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEUsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUEyQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2YsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDaEIsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3ZCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0osRUFBRSxDQUNGLENBQUM7WUFDRixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUVqRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLDRCQUE0QixFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDakQsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzRixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQTJCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSjtnQkFDQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDZixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNoQixDQUNELENBQUM7WUFFRixTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDdkIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSixFQUFFLENBQ0YsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVyRSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGdHQUFnRyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDckgsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0UsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUEyQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDWixJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDWixDQUNELENBQUM7WUFFRixTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDdkIsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSixFQUFFLENBQ0YsQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUU1RSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDdkQsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQTJCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSjtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekMsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSixFQUFFLENBQ0YsQ0FBQztZQUVGLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUN2QyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksNEJBQWdCLEVBQUUsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ1osSUFBSSxFQUNKO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFFN0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDM0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTFCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxJQUFJLEVBQ0o7Z0JBQ0MsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDZCxDQUNELENBQUM7WUFFRixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLDBFQUEwRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDL0YsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUFnQixFQUFFLENBQUMsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQTJCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsZUFBZSxDQUNkLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNaLElBQUksRUFDSjtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUVGLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU3QyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUU3QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRTtnQkFDdEUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUMzQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFMUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FB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QUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXBCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLDRDQUE0QyxDQUFDLENBQUM7WUFFdkcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLGVBQWUsQ0FDZCxNQUFNLEVBQ04sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUNkO2dCQUNDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ2QsQ0FDRCxDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFF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QUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO1lBRXZHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO1lBRXRHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixlQUFlLENBQ2QsTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDZDtnQkFDQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzthQUNkLENBQ0QsQ0FBQztZQUNGLE1BQU0sQ0FB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