/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/languages/language", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, lifecycle_1, mime_1, uri_1, utils_1, language_1, notebookCommon_1, notebookRange_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookCommon', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let disposables;
        let instantiationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        test('sortMimeTypes default orders', function () {
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder().sort([
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]), [
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder().sort([
                'application/json',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'application/javascript',
                'text/html',
                mime_1.Mimes.text,
                'image/png',
                'image/jpeg',
                'image/svg+xml'
            ]), [
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder().sort([
                mime_1.Mimes.markdown,
                'application/json',
                mime_1.Mimes.text,
                'image/jpeg',
                'application/javascript',
                'text/html',
                'image/png',
                'image/svg+xml'
            ]), [
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
            disposables.dispose();
        });
        test('sortMimeTypes user orders', function () {
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder([
                'image/png',
                mime_1.Mimes.text,
                mime_1.Mimes.markdown,
                'text/html',
                'application/json'
            ]).sort([
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]), [
                'image/png',
                mime_1.Mimes.text,
                mime_1.Mimes.markdown,
                'text/html',
                'application/json',
                'application/javascript',
                'image/svg+xml',
                'image/jpeg',
            ]);
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder([
                'application/json',
                'text/html',
                'text/html',
                mime_1.Mimes.markdown,
                'application/json'
            ]).sort([
                mime_1.Mimes.markdown,
                'application/json',
                mime_1.Mimes.text,
                'application/javascript',
                'text/html',
                'image/svg+xml',
                'image/jpeg',
                'image/png'
            ]), [
                'application/json',
                'text/html',
                mime_1.Mimes.markdown,
                'application/javascript',
                'image/svg+xml',
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
            disposables.dispose();
        });
        test('prioritizes mimetypes', () => {
            const m = new notebookCommon_1.MimeTypeDisplayOrder([
                mime_1.Mimes.markdown,
                'text/html',
                'application/json'
            ]);
            assert.deepStrictEqual(m.toArray(), [mime_1.Mimes.markdown, 'text/html', 'application/json']);
            // no-op if already in the right order
            m.prioritize('text/html', ['application/json']);
            assert.deepStrictEqual(m.toArray(), [mime_1.Mimes.markdown, 'text/html', 'application/json']);
            // sorts to highest priority
            m.prioritize('text/html', ['application/json', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/html', mime_1.Mimes.markdown, 'application/json']);
            // adds in new type
            m.prioritize('text/plain', ['application/json', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/plain', 'text/html', mime_1.Mimes.markdown, 'application/json']);
            // moves multiple, preserves order
            m.prioritize(mime_1.Mimes.markdown, ['text/plain', 'application/json', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/html', mime_1.Mimes.markdown, 'text/plain', 'application/json']);
            // deletes multiple
            m.prioritize('text/plain', ['text/plain', 'text/html', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/plain', 'text/html', mime_1.Mimes.markdown, 'application/json']);
            // handles multiple mimetypes, unknown mimetype
            const m2 = new notebookCommon_1.MimeTypeDisplayOrder(['a', 'b']);
            m2.prioritize('b', ['a', 'b', 'a', 'q']);
            assert.deepStrictEqual(m2.toArray(), ['b', 'a']);
            disposables.dispose();
        });
        test('sortMimeTypes glob', function () {
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder([
                'application/vnd-vega*',
                mime_1.Mimes.markdown,
                'text/html',
                'application/json'
            ]).sort([
                'application/json',
                'application/javascript',
                'text/html',
                'application/vnd-plot.json',
                'application/vnd-vega.json'
            ]), [
                'application/vnd-vega.json',
                'text/html',
                'application/json',
                'application/vnd-plot.json',
                'application/javascript',
            ], 'glob *');
            disposables.dispose();
        });
        test('diff cells', function () {
            const cells = [];
            for (let i = 0; i < 5; i++) {
                cells.push(disposables.add(new testNotebookEditor_1.TestCell('notebook', i, `var a = ${i};`, 'javascript', notebookCommon_1.CellKind.Code, [], languageService)));
            }
            assert.deepStrictEqual((0, notebookCommon_1.diff)(cells, [], (cell) => {
                return cells.indexOf(cell) > -1;
            }), [
                {
                    start: 0,
                    deleteCount: 5,
                    toInsert: []
                }
            ]);
            assert.deepStrictEqual((0, notebookCommon_1.diff)([], cells, (cell) => {
                return false;
            }), [
                {
                    start: 0,
                    deleteCount: 0,
                    toInsert: cells
                }
            ]);
            const cellA = disposables.add(new testNotebookEditor_1.TestCell('notebook', 6, 'var a = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService));
            const cellB = disposables.add(new testNotebookEditor_1.TestCell('notebook', 7, 'var a = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService));
            const modifiedCells = [
                cells[0],
                cells[1],
                cellA,
                cells[3],
                cellB,
                cells[4]
            ];
            const splices = (0, notebookCommon_1.diff)(cells, modifiedCells, (cell) => {
                return cells.indexOf(cell) > -1;
            });
            assert.deepStrictEqual(splices, [
                {
                    start: 2,
                    deleteCount: 1,
                    toInsert: [cellA]
                },
                {
                    start: 4,
                    deleteCount: 0,
                    toInsert: [cellB]
                }
            ]);
            disposables.dispose();
        });
    });
    suite('CellUri', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('parse, generate (file-scheme)', function () {
            const nb = uri_1.URI.parse('file:///bar/følder/file.nb');
            const id = 17;
            const data = notebookCommon_1.CellUri.generate(nb, id);
            const actual = notebookCommon_1.CellUri.parse(data);
            assert.ok(Boolean(actual));
            assert.strictEqual(actual?.handle, id);
            assert.strictEqual(actual?.notebook.toString(), nb.toString());
        });
        test('parse, generate (foo-scheme)', function () {
            const nb = uri_1.URI.parse('foo:///bar/følder/file.nb');
            const id = 17;
            const data = notebookCommon_1.CellUri.generate(nb, id);
            const actual = notebookCommon_1.CellUri.parse(data);
            assert.ok(Boolean(actual));
            assert.strictEqual(actual?.handle, id);
            assert.strictEqual(actual?.notebook.toString(), nb.toString());
        });
        test('stable order', function () {
            const nb = uri_1.URI.parse('foo:///bar/følder/file.nb');
            const handles = [1, 2, 9, 10, 88, 100, 666666, 7777777];
            const uris = handles.map(h => notebookCommon_1.CellUri.generate(nb, h)).sort();
            const strUris = uris.map(String).sort();
            const parsedUris = strUris.map(s => uri_1.URI.parse(s));
            const actual = parsedUris.map(u => notebookCommon_1.CellUri.parse(u)?.handle);
            assert.deepStrictEqual(actual, handles);
        });
    });
    suite('CellRange', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Cell range to index', function () {
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([]), []);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 0 }]), []);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 1 }]), [0]);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 2 }]), [0, 1]);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 2 }, { start: 2, end: 3 }]), [0, 1, 2]);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 2 }, { start: 3, end: 4 }]), [0, 1, 3]);
        });
        test('Cell index to range', function () {
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([]), []);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0]), [{ start: 0, end: 1 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0, 1]), [{ start: 0, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0, 1, 2]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0, 1, 3]), [{ start: 0, end: 2 }, { start: 3, end: 4 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([1, 0]), [{ start: 0, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([1, 2, 0]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([3, 1, 0]), [{ start: 0, end: 2 }, { start: 3, end: 4 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([9, 10]), [{ start: 9, end: 11 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([10, 9]), [{ start: 9, end: 11 }]);
        });
        test('Reduce ranges', function () {
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 1 }, { start: 1, end: 2 }]), [{ start: 0, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 2 }, { start: 1, end: 3 }]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 1, end: 3 }, { start: 0, end: 2 }]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 2 }, { start: 4, end: 5 }]), [{ start: 0, end: 2 }, { start: 4, end: 5 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([
                { start: 0, end: 1 },
                { start: 1, end: 2 },
                { start: 4, end: 6 }
            ]), [
                { start: 0, end: 2 },
                { start: 4, end: 6 }
            ]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([
                { start: 0, end: 1 },
                { start: 1, end: 3 },
                { start: 3, end: 4 }
            ]), [
                { start: 0, end: 4 }
            ]);
        });
        test('Reduce ranges 2, empty ranges', function () {
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 0 }, { start: 0, end: 0 }]), [{ start: 0, end: 0 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 0 }, { start: 1, end: 2 }]), [{ start: 1, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 2, end: 2 }]), [{ start: 2, end: 2 }]);
        });
    });
    suite('NotebookWorkingCopyTypeIdentifier', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('works', function () {
            const viewType = 'testViewType';
            const type = notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create('testViewType');
            assert.strictEqual(notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(type), viewType);
            assert.strictEqual(notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse('something'), undefined);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDb21tb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rQ29tbW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxlQUFpQyxDQUFDO1FBRXRDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQUcsSUFBQSw4Q0FBeUIsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUM5RCxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUU7WUFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLHFDQUFvQixFQUFFLENBQUMsSUFBSSxDQUNyRDtnQkFDQyxrQkFBa0I7Z0JBQ2xCLHdCQUF3QjtnQkFDeEIsV0FBVztnQkFDWCxlQUFlO2dCQUNmLFlBQUssQ0FBQyxLQUFLO2dCQUNYLFlBQUssQ0FBQyxRQUFRO2dCQUNkLFdBQVc7Z0JBQ1gsWUFBWTtnQkFDWixZQUFLLENBQUMsSUFBSTthQUNWLENBQUMsRUFDRjtnQkFDQyxrQkFBa0I7Z0JBQ2xCLHdCQUF3QjtnQkFDeEIsV0FBVztnQkFDWCxlQUFlO2dCQUNmLFlBQUssQ0FBQyxLQUFLO2dCQUNYLFlBQUssQ0FBQyxRQUFRO2dCQUNkLFdBQVc7Z0JB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QyxJQUFBLG1DQUFtQixFQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFtQixFQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQ0FBbUIsRUFBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFtQixFQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1lBQzNCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQ0FBbUIsRUFBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFtQixFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXJHLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQ0FBbUIsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFtQixFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFtQixFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVyRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQ0FBbUIsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3JCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxnQ0FBZ0IsRUFBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsZ0NBQWdCLEVBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFF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