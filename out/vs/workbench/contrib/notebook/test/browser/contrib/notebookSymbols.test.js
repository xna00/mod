/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineEntryFactory"], function (require, exports, assert, cancellation_1, mock_1, utils_1, notebookOutlineEntryFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Symbols', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const symbolsPerTextModel = {};
        function setSymbolsForTextModel(symbols, textmodelId = 'textId') {
            symbolsPerTextModel[textmodelId] = symbols;
        }
        const executionService = new class extends (0, mock_1.mock)() {
            getCellExecution() { return undefined; }
        };
        class OutlineModelStub {
            constructor(textId) {
                this.textId = textId;
            }
            getTopLevelSymbols() {
                return symbolsPerTextModel[this.textId];
            }
        }
        const outlineModelService = new class extends (0, mock_1.mock)() {
            getOrCreate(model, arg1) {
                const outline = new OutlineModelStub(model.id);
                return Promise.resolve(outline);
            }
            getDebounceValue(arg0) {
                return 0;
            }
        };
        function createCellViewModel(version = 1, textmodelId = 'textId') {
            return {
                textBuffer: {
                    getLineCount() { return 0; }
                },
                getText() {
                    return '# code';
                },
                model: {
                    textModel: {
                        id: textmodelId,
                        getVersionId() { return version; }
                    }
                },
                resolveTextModel() {
                    return this.model.textModel;
                },
            };
        }
        test('Cell without symbols cache', function () {
            setSymbolsForTextModel([{ name: 'var', range: {} }]);
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const entries = entryFactory.getOutlineEntries(createCellViewModel(), 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries.length, 1, 'no entries created');
            assert.equal(entries[0].label, '# code', 'entry should fall back to first line of cell');
        });
        test('Cell with simple symbols', async function () {
            setSymbolsForTextModel([{ name: 'var1', range: {} }, { name: 'var2', range: {} }]);
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const cell = createCellViewModel();
            await entryFactory.cacheSymbols(cell, outlineModelService, cancellation_1.CancellationToken.None);
            const entries = entryFactory.getOutlineEntries(cell, 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries.length, 2, 'wrong number of outline entries');
            assert.equal(entries[0].label, 'var1');
            // 6 levels for markdown, all code symbols are greater than the max markdown level
            assert.equal(entries[0].level, 8);
            assert.equal(entries[0].index, 0);
            assert.equal(entries[1].label, 'var2');
            assert.equal(entries[1].level, 8);
            assert.equal(entries[1].index, 1);
        });
        test('Cell with nested symbols', async function () {
            setSymbolsForTextModel([
                { name: 'root1', range: {}, children: [{ name: 'nested1', range: {} }, { name: 'nested2', range: {} }] },
                { name: 'root2', range: {}, children: [{ name: 'nested1', range: {} }] }
            ]);
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const cell = createCellViewModel();
            await entryFactory.cacheSymbols(cell, outlineModelService, cancellation_1.CancellationToken.None);
            const entries = entryFactory.getOutlineEntries(createCellViewModel(), 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries.length, 5, 'wrong number of outline entries');
            assert.equal(entries[0].label, 'root1');
            assert.equal(entries[0].level, 8);
            assert.equal(entries[1].label, 'nested1');
            assert.equal(entries[1].level, 9);
            assert.equal(entries[2].label, 'nested2');
            assert.equal(entries[2].level, 9);
            assert.equal(entries[3].label, 'root2');
            assert.equal(entries[3].level, 8);
            assert.equal(entries[4].label, 'nested1');
            assert.equal(entries[4].level, 9);
        });
        test('Multiple Cells with symbols', async function () {
            setSymbolsForTextModel([{ name: 'var1', range: {} }], '$1');
            setSymbolsForTextModel([{ name: 'var2', range: {} }], '$2');
            const entryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(executionService);
            const cell1 = createCellViewModel(1, '$1');
            const cell2 = createCellViewModel(1, '$2');
            await entryFactory.cacheSymbols(cell1, outlineModelService, cancellation_1.CancellationToken.None);
            await entryFactory.cacheSymbols(cell2, outlineModelService, cancellation_1.CancellationToken.None);
            const entries1 = entryFactory.getOutlineEntries(createCellViewModel(1, '$1'), 4 /* OutlineTarget.QuickPick */, 0);
            const entries2 = entryFactory.getOutlineEntries(createCellViewModel(1, '$2'), 4 /* OutlineTarget.QuickPick */, 0);
            assert.equal(entries1.length, 1, 'wrong number of outline entries');
            assert.equal(entries1[0].label, 'var1');
            assert.equal(entries2.length, 1, 'wrong number of outline entries');
            assert.equal(entries2[0].label, 'var2');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTeW1ib2xzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9jb250cmliL25vdGVib29rU3ltYm9scy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRTtRQUN6QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFHMUMsTUFBTSxtQkFBbUIsR0FBaUMsRUFBRSxDQUFDO1FBQzdELFNBQVMsc0JBQXNCLENBQUMsT0FBcUIsRUFBRSxXQUFXLEdBQUcsUUFBUTtZQUM1RSxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDNUMsQ0FBQztRQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWtDO1lBQ3ZFLGdCQUFnQixLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztTQUNqRCxDQUFDO1FBRUYsTUFBTSxnQkFBZ0I7WUFDckIsWUFBb0IsTUFBYztnQkFBZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQUksQ0FBQztZQUV2QyxrQkFBa0I7Z0JBQ2pCLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUM7U0FDRDtRQUNELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXdCO1lBQ2hFLFdBQVcsQ0FBQyxLQUFpQixFQUFFLElBQVM7Z0JBQ2hELE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBNEIsQ0FBQztnQkFDMUUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLENB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