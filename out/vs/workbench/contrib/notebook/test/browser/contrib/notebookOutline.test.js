/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/platform/theme/common/themeService", "vs/base/test/common/mock", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/base/test/common/utils"], function (require, exports, assert, testNotebookEditor_1, themeService_1, mock_1, event_1, editorService_1, markers_1, markerService_1, notebookCommon_1, lifecycle_1, notebookOutline_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Outline', function () {
        let disposables;
        let instantiationService;
        teardown(() => disposables.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.set(editorService_1.IEditorService, new class extends (0, mock_1.mock)() {
            });
            instantiationService.set(markers_1.IMarkerService, disposables.add(new markerService_1.MarkerService()));
            instantiationService.set(themeService_1.IThemeService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidFileIconThemeChange = event_1.Event.None;
                }
                getFileIconTheme() {
                    return { hasFileIcons: true, hasFolderIcons: true, hidesExplorerArrows: false };
                }
            });
        });
        function withNotebookOutline(cells, callback) {
            return (0, testNotebookEditor_1.withTestNotebook)(cells, (editor) => {
                if (!editor.hasModel()) {
                    assert.ok(false, 'MUST have active text editor');
                }
                const outline = instantiationService.createInstance(notebookOutline_1.NotebookCellOutline, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.onDidChangeModel = event_1.Event.None;
                    }
                    getControl() {
                        return editor;
                    }
                }, 1 /* OutlineTarget.OutlinePane */);
                disposables.add(outline);
                return callback(outline, editor);
            });
        }
        test('basic', async function () {
            await withNotebookOutline([], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements(), []);
            });
        });
        test('special characters in heading', async function () {
            await withNotebookOutline([
                ['# Hellö & Hällo', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, 'Hellö & Hällo');
            });
            await withNotebookOutline([
                ['# bo<i>ld</i>', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, 'bold');
            });
        });
        test('Notebook falsely detects "empty cells"', async function () {
            await withNotebookOutline([
                ['  的时代   ', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, '的时代');
            });
            await withNotebookOutline([
                ['   ', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, 'empty cell');
            });
            await withNotebookOutline([
                ['+++++[]{}--)(0  ', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, '+++++[]{}--)(0');
            });
            await withNotebookOutline([
                ['+++++[]{}--)(0 Hello **&^ ', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, '+++++[]{}--)(0 Hello **&^');
            });
            await withNotebookOutline([
                ['!@#$\n Überschrïft', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, '!@#$');
            });
        });
        test('Heading text defines entry label', async function () {
            return await withNotebookOutline([
                ['foo\n # h1', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 1);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, 'h1');
            });
        });
        test('Notebook outline ignores markdown headings #115200', async function () {
            await withNotebookOutline([
                ['## h2 \n# h1', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 2);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, 'h2');
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[1].label, 'h1');
            });
            await withNotebookOutline([
                ['## h2', 'md', notebookCommon_1.CellKind.Markup],
                ['# h1', 'md', notebookCommon_1.CellKind.Markup]
            ], outline => {
                assert.ok(outline instanceof notebookOutline_1.NotebookCellOutline);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements().length, 2);
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[0].label, 'h2');
                assert.deepStrictEqual(outline.config.quickPickDataSource.getQuickPickElements()[1].label, 'h1');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9jb250cmliL25vdGVib29rT3V0bGluZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxLQUFLLENBQUMsa0JBQWtCLEVBQUU7UUFFekIsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFFbkQsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXRDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLG9CQUFvQixHQUFHLElBQUEsOENBQXlCLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUQsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDhCQUFjLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWtCO2FBQUksQ0FBQyxDQUFDO1lBQ3ZGLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx3QkFBYyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9FLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyw0QkFBYSxFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFpQjtnQkFBbkM7O29CQUNsQyw2QkFBd0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO2dCQUloRCxDQUFDO2dCQUhTLGdCQUFnQjtvQkFDeEIsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxtQkFB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