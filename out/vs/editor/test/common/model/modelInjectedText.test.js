/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/textModelEvents", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, editOperation_1, range_1, textModelEvents_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Model - Injected Text Events', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Basic', () => {
            const thisModel = store.add((0, testTextModel_1.createTextModel)('First Line\nSecond Line'));
            const recordedChanges = new Array();
            store.add(thisModel.onDidChangeContentOrInjectedText((e) => {
                const changes = (e instanceof textModelEvents_1.InternalModelContentChangeEvent ? e.rawContentChangedEvent.changes : e.changes);
                for (const change of changes) {
                    recordedChanges.push(mapChange(change));
                }
            }));
            // Initial decoration
            let decorations = thisModel.deltaDecorations([], [{
                    options: {
                        after: { content: 'injected1' },
                        description: 'test1',
                        showIfCollapsed: true
                    },
                    range: new range_1.Range(1, 1, 1, 1),
                }]);
            assert.deepStrictEqual(recordedChanges.splice(0), [
                {
                    kind: 'lineChanged',
                    line: '[injected1]First Line',
                    lineNumber: 1,
                }
            ]);
            // Decoration change
            decorations = thisModel.deltaDecorations(decorations, [{
                    options: {
                        after: { content: 'injected1' },
                        description: 'test1',
                        showIfCollapsed: true
                    },
                    range: new range_1.Range(2, 1, 2, 1),
                }, {
                    options: {
                        after: { content: 'injected2' },
                        description: 'test2',
                        showIfCollapsed: true
                    },
                    range: new range_1.Range(2, 2, 2, 2),
                }]);
            assert.deepStrictEqual(recordedChanges.splice(0), [
                {
                    kind: 'lineChanged',
                    line: 'First Line',
                    lineNumber: 1,
                },
                {
                    kind: 'lineChanged',
                    line: '[injected1]S[injected2]econd Line',
                    lineNumber: 2,
                }
            ]);
            // Simple Insert
            thisModel.applyEdits([editOperation_1.EditOperation.replace(new range_1.Range(2, 2, 2, 2), 'Hello')]);
            assert.deepStrictEqual(recordedChanges.splice(0), [
                {
                    kind: 'lineChanged',
                    line: '[injected1]SHello[injected2]econd Line',
                    lineNumber: 2,
                }
            ]);
            // Multi-Line Insert
            thisModel.pushEditOperations(null, [editOperation_1.EditOperation.replace(new range_1.Range(2, 2, 2, 2), '\n\n\n')], null);
            assert.deepStrictEqual(thisModel.getAllDecorations(undefined).map(d => ({ description: d.options.description, range: d.range.toString() })), [{
                    'description': 'test1',
                    'range': '[2,1 -> 2,1]'
                },
                {
                    'description': 'test2',
                    'range': '[2,2 -> 5,6]'
                }]);
            assert.deepStrictEqual(recordedChanges.splice(0), [
                {
                    kind: 'lineChanged',
                    line: '[injected1]S',
                    lineNumber: 2,
                },
                {
                    fromLineNumber: 3,
                    kind: 'linesInserted',
                    lines: [
                        '',
                        '',
                        'Hello[injected2]econd Line',
                    ]
                }
            ]);
            // Multi-Line Replace
            thisModel.pushEditOperations(null, [editOperation_1.EditOperation.replace(new range_1.Range(3, 1, 5, 1), '\n\n\n\n\n\n\n\n\n\n\n\n\n')], null);
            assert.deepStrictEqual(recordedChanges.splice(0), [
                {
                    'kind': 'lineChanged',
                    'line': '',
                    'lineNumber': 5,
                },
                {
                    'kind': 'lineChanged',
                    'line': '',
                    'lineNumber': 4,
                },
                {
                    'kind': 'lineChanged',
                    'line': '',
                    'lineNumber': 3,
                },
                {
                    'fromLineNumber': 6,
                    'kind': 'linesInserted',
                    'lines': [
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        'Hello[injected2]econd Line',
                    ]
                }
            ]);
            // Multi-Line Replace undo
            assert.strictEqual(thisModel.undo(), undefined);
            assert.deepStrictEqual(recordedChanges.splice(0), [
                {
                    kind: 'lineChanged',
                    line: '[injected1]SHello[injected2]econd Line',
                    lineNumber: 2,
                },
                {
                    kind: 'linesDeleted',
                }
            ]);
        });
    });
    function mapChange(change) {
        if (change.changeType === 2 /* RawContentChangedType.LineChanged */) {
            (change.injectedText || []).every(e => {
                assert.deepStrictEqual(e.lineNumber, change.lineNumber);
            });
            return {
                kind: 'lineChanged',
                line: getDetail(change.detail, change.injectedText),
                lineNumber: change.lineNumber,
            };
        }
        else if (change.changeType === 4 /* RawContentChangedType.LinesInserted */) {
            return {
                kind: 'linesInserted',
                lines: change.detail.map((e, idx) => getDetail(e, change.injectedTexts[idx])),
                fromLineNumber: change.fromLineNumber
            };
        }
        else if (change.changeType === 3 /* RawContentChangedType.LinesDeleted */) {
            return {
                kind: 'linesDeleted',
            };
        }
        else if (change.changeType === 5 /* RawContentChangedType.EOLChanged */) {
            return {
                kind: 'eolChanged'
            };
        }
        else if (change.changeType === 1 /* RawContentChangedType.Flush */) {
            return {
                kind: 'flush'
            };
        }
        return { kind: 'unknown' };
    }
    function getDetail(line, injectedTexts) {
        return textModelEvents_1.LineInjectedText.applyInjectedText(line, (injectedTexts || []).map(t => t.withText(`[${t.options.content}]`)));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxJbmplY3RlZFRleHQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL21vZGVsSW5qZWN0ZWRUZXh0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtRQUNqRCxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbEIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLCtCQUFlLEVBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sZUFBZSxHQUFHLElBQUksS0FBSyxFQUFXLENBQUM7WUFFN0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDMUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFlBQVksaURBQStCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUcsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDOUIsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixxQkFBcUI7WUFDckIsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNqRCxPQUFPLEVBQUU7d0JBQ1IsS0FBSyxFQUFFLEVB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