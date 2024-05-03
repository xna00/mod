/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/test/common/utils", "vs/editor/common/languages/language", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, buffer_1, lifecycle_1, mime_1, utils_1, language_1, undoRedo_1, notebookTextModel_1, notebookCommon_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookTextModel', () => {
        let disposables;
        let instantiationService;
        let languageService;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
            instantiationService.spy(undoRedo_1.IUndoRedoService, 'pushElement');
        });
        suiteTeardown(() => disposables.dispose());
        test('insert', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _viewModel, ds) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 5, 'var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                    { editType: 1 /* CellEditType.Replace */, index: 3, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 6, 'var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 6);
                assert.strictEqual(textModel.cells[1].getValue(), 'var e = 5;');
                assert.strictEqual(textModel.cells[4].getValue(), 'var f = 6;');
            });
        });
        test('multiple inserts at same position', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _viewModel, ds) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 5, 'var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 6, 'var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 6);
                assert.strictEqual(textModel.cells[1].getValue(), 'var e = 5;');
                assert.strictEqual(textModel.cells[2].getValue(), 'var f = 6;');
            });
        });
        test('delete', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: [] },
                    { editType: 1 /* CellEditType.Replace */, index: 3, count: 1, cells: [] },
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells[0].getValue(), 'var a = 1;');
                assert.strictEqual(textModel.cells[1].getValue(), 'var c = 3;');
            });
        });
        test('delete + insert', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _viewModel, ds) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: [] },
                    { editType: 1 /* CellEditType.Replace */, index: 3, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 5, 'var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 4);
                assert.strictEqual(textModel.cells[0].getValue(), 'var a = 1;');
                assert.strictEqual(textModel.cells[2].getValue(), 'var e = 5;');
            });
        });
        test('delete + insert at same position', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _viewModel, ds) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: [] },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 5, 'var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 4);
                assert.strictEqual(textModel.cells[0].getValue(), 'var a = 1;');
                assert.strictEqual(textModel.cells[1].getValue(), 'var e = 5;');
                assert.strictEqual(textModel.cells[2].getValue(), 'var c = 3;');
            });
        });
        test('(replace) delete + insert at same position', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _viewModel, ds) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 5, 'var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 4);
                assert.strictEqual(textModel.cells[0].getValue(), 'var a = 1;');
                assert.strictEqual(textModel.cells[1].getValue(), 'var e = 5;');
                assert.strictEqual(textModel.cells[2].getValue(), 'var c = 3;');
            });
        });
        test('output', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                // invalid index 1
                assert.throws(() => {
                    textModel.applyEdits([{
                            index: Number.MAX_VALUE,
                            editType: 2 /* CellEditType.Output */,
                            outputs: []
                        }], true, undefined, () => undefined, undefined, true);
                });
                // invalid index 2
                assert.throws(() => {
                    textModel.applyEdits([{
                            index: -1,
                            editType: 2 /* CellEditType.Output */,
                            outputs: []
                        }], true, undefined, () => undefined, undefined, true);
                });
                textModel.applyEdits([{
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        outputs: [{
                                outputId: 'someId',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_Hello_') }]
                            }]
                    }], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].outputs.length, 1);
                // append
                textModel.applyEdits([{
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'someId2',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_Hello2_') }]
                            }]
                    }], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].outputs.length, 2);
                let [first, second] = textModel.cells[0].outputs;
                assert.strictEqual(first.outputId, 'someId');
                assert.strictEqual(second.outputId, 'someId2');
                // replace all
                textModel.applyEdits([{
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        outputs: [{
                                outputId: 'someId3',
                                outputs: [{ mime: mime_1.Mimes.text, data: (0, testNotebookEditor_1.valueBytesFromString)('Last, replaced output') }]
                            }]
                    }], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].outputs.length, 1);
                [first] = textModel.cells[0].outputs;
                assert.strictEqual(first.outputId, 'someId3');
            });
        });
        test('multiple append output in one position', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                // append
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('append 1') }]
                            }]
                    },
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append2',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('append 2') }]
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].outputs.length, 2);
                const [first, second] = textModel.cells[0].outputs;
                assert.strictEqual(first.outputId, 'append1');
                assert.strictEqual(second.outputId, 'append2');
            });
        });
        test('append to output created in same batch', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('append 1') }]
                            }]
                    },
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [{
                                mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('append 2')
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].outputs.length, 1, 'has 1 output');
                const [first] = textModel.cells[0].outputs;
                assert.strictEqual(first.outputId, 'append1');
                assert.strictEqual(first.outputs.length, 2, 'has 2 items');
            });
        });
        const stdOutMime = 'application/vnd.code.notebook.stdout';
        const stdErrMime = 'application/vnd.code.notebook.stderr';
        test('appending streaming outputs', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [{ mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 1') }]
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                const [output] = textModel.cells[0].outputs;
                assert.strictEqual(output.versionId, 0, 'initial output version should be 0');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [
                            { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 2') },
                            { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 3') }
                        ]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 1, 'version should bump per append');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [
                            { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 4') },
                            { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 5') }
                        ]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 2, 'version should bump per append');
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].outputs.length, 1, 'has 1 output');
                assert.strictEqual(output.outputId, 'append1');
                assert.strictEqual(output.outputs.length, 1, 'outputs are compressed');
                assert.strictEqual(output.outputs[0].data.toString(), 'append 1append 2append 3append 4append 5');
                assert.strictEqual(output.appendedSinceVersion(0, stdOutMime)?.toString(), 'append 2append 3append 4append 5');
                assert.strictEqual(output.appendedSinceVersion(1, stdOutMime)?.toString(), 'append 4append 5');
                assert.strictEqual(output.appendedSinceVersion(2, stdOutMime), undefined);
                assert.strictEqual(output.appendedSinceVersion(2, stdErrMime), undefined);
            });
        });
        test('replacing streaming outputs', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [{ mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 1') }]
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                const [output] = textModel.cells[0].outputs;
                assert.strictEqual(output.versionId, 0, 'initial output version should be 0');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [{
                                mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 2')
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 1, 'version should bump per append');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: false,
                        outputId: 'append1',
                        items: [{
                                mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('replace 3')
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 2, 'version should bump per replace');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [{
                                mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 4')
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 3, 'version should bump per append');
                assert.strictEqual(output.outputs[0].data.toString(), 'replace 3append 4');
                assert.strictEqual(output.appendedSinceVersion(0, stdOutMime), undefined, 'replacing output should clear out previous versioned output buffers');
                assert.strictEqual(output.appendedSinceVersion(1, stdOutMime), undefined, 'replacing output should clear out previous versioned output buffers');
                assert.strictEqual(output.appendedSinceVersion(2, stdOutMime)?.toString(), 'append 4');
            });
        });
        test('appending streaming outputs with move cursor compression', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [
                                    { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 1') },
                                    { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('\nappend 1') }
                                ]
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                const [output] = textModel.cells[0].outputs;
                assert.strictEqual(output.versionId, 0, 'initial output version should be 0');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [{
                                mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)(notebookCommon_1.MOVE_CURSOR_1_LINE_COMMAND + '\nappend 2')
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 1, 'version should bump per append');
                assert.strictEqual(output.outputs[0].data.toString(), 'append 1\nappend 2');
                assert.strictEqual(output.appendedSinceVersion(0, stdOutMime), undefined, 'compressing outputs should clear out previous versioned output buffers');
            });
        });
        test('appending streaming outputs with carraige return compression', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [
                                    { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('append 1') },
                                    { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('\nappend 1') }
                                ]
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                const [output] = textModel.cells[0].outputs;
                assert.strictEqual(output.versionId, 0, 'initial output version should be 0');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [{
                                mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('\rappend 2')
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 1, 'version should bump per append');
                assert.strictEqual(output.outputs[0].data.toString(), 'append 1\nappend 2');
                assert.strictEqual(output.appendedSinceVersion(0, stdOutMime), undefined, 'compressing outputs should clear out previous versioned output buffers');
            });
        });
        test('appending multiple different mime streaming outputs', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([
                    {
                        index: 0,
                        editType: 2 /* CellEditType.Output */,
                        append: true,
                        outputs: [{
                                outputId: 'append1',
                                outputs: [
                                    { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('stdout 1') },
                                    { mime: stdErrMime, data: (0, testNotebookEditor_1.valueBytesFromString)('stderr 1') }
                                ]
                            }]
                    }
                ], true, undefined, () => undefined, undefined, true);
                const [output] = textModel.cells[0].outputs;
                assert.strictEqual(output.versionId, 0, 'initial output version should be 0');
                textModel.applyEdits([
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        append: true,
                        outputId: 'append1',
                        items: [
                            { mime: stdOutMime, data: (0, testNotebookEditor_1.valueBytesFromString)('stdout 2') },
                            { mime: stdErrMime, data: (0, testNotebookEditor_1.valueBytesFromString)('stderr 2') }
                        ]
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(output.versionId, 1, 'version should bump per replace');
                assert.strictEqual(output.appendedSinceVersion(0, stdErrMime)?.toString(), 'stderr 2');
                assert.strictEqual(output.appendedSinceVersion(0, stdOutMime)?.toString(), 'stdout 2');
            });
        });
        test('metadata', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                // invalid index 1
                assert.throws(() => {
                    textModel.applyEdits([{
                            index: Number.MAX_VALUE,
                            editType: 3 /* CellEditType.Metadata */,
                            metadata: {}
                        }], true, undefined, () => undefined, undefined, true);
                });
                // invalid index 2
                assert.throws(() => {
                    textModel.applyEdits([{
                            index: -1,
                            editType: 3 /* CellEditType.Metadata */,
                            metadata: {}
                        }], true, undefined, () => undefined, undefined, true);
                });
                textModel.applyEdits([{
                        index: 0,
                        editType: 3 /* CellEditType.Metadata */,
                        metadata: { customProperty: 15 },
                    }], true, undefined, () => undefined, undefined, true);
                textModel.applyEdits([{
                        index: 0,
                        editType: 3 /* CellEditType.Metadata */,
                        metadata: {},
                    }], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].metadata.customProperty, undefined);
            });
        });
        test('partial metadata', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const textModel = editor.textModel;
                textModel.applyEdits([{
                        index: 0,
                        editType: 8 /* CellEditType.PartialMetadata */,
                        metadata: { customProperty: 15 },
                    }], true, undefined, () => undefined, undefined, true);
                textModel.applyEdits([{
                        index: 0,
                        editType: 8 /* CellEditType.PartialMetadata */,
                        metadata: {},
                    }], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(textModel.cells.length, 1);
                assert.strictEqual(textModel.cells[0].metadata.customProperty, 15);
            });
        });
        test('multiple inserts in one edit', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _viewModel, ds) => {
                const textModel = editor.textModel;
                let changeEvent = undefined;
                const eventListener = textModel.onDidChangeContent(e => {
                    changeEvent = e;
                });
                const willChangeEvents = [];
                const willChangeListener = textModel.onWillAddRemoveCells(e => {
                    willChangeEvents.push(e);
                });
                const version = textModel.versionId;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: [] },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 0, cells: [ds.add(new testNotebookEditor_1.TestCell(textModel.viewType, 5, 'var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService))] },
                ], true, undefined, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 0, end: 1 }] }), undefined, true);
                assert.strictEqual(textModel.cells.length, 4);
                assert.strictEqual(textModel.cells[0].getValue(), 'var a = 1;');
                assert.strictEqual(textModel.cells[1].getValue(), 'var e = 5;');
                assert.strictEqual(textModel.cells[2].getValue(), 'var c = 3;');
                assert.notStrictEqual(changeEvent, undefined);
                assert.strictEqual(changeEvent.rawEvents.length, 2);
                assert.deepStrictEqual(changeEvent.endSelectionState?.selections, [{ start: 0, end: 1 }]);
                assert.strictEqual(willChangeEvents.length, 2);
                assert.strictEqual(textModel.versionId, version + 1);
                eventListener.dispose();
                willChangeListener.dispose();
            });
        });
        test('insert and metadata change in one edit', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const textModel = editor.textModel;
                let changeEvent = undefined;
                const eventListener = textModel.onDidChangeContent(e => {
                    changeEvent = e;
                });
                const willChangeEvents = [];
                const willChangeListener = textModel.onWillAddRemoveCells(e => {
                    willChangeEvents.push(e);
                });
                const version = textModel.versionId;
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: [] },
                    {
                        index: 0,
                        editType: 3 /* CellEditType.Metadata */,
                        metadata: {},
                    }
                ], true, undefined, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 0, end: 1 }] }), undefined, true);
                assert.notStrictEqual(changeEvent, undefined);
                assert.strictEqual(changeEvent.rawEvents.length, 2);
                assert.deepStrictEqual(changeEvent.endSelectionState?.selections, [{ start: 0, end: 1 }]);
                assert.strictEqual(willChangeEvents.length, 1);
                assert.strictEqual(textModel.versionId, version + 1);
                eventListener.dispose();
                willChangeListener.dispose();
            });
        });
        test('Updating appending/updating output in Notebooks does not work as expected #117273', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                assert.strictEqual(model.cells.length, 1);
                assert.strictEqual(model.cells[0].outputs.length, 0);
                const success1 = model.applyEdits([{
                        editType: 2 /* CellEditType.Output */, index: 0, outputs: [
                            { outputId: 'out1', outputs: [{ mime: 'application/x.notebook.stream', data: buffer_1.VSBuffer.wrap(new Uint8Array([1])) }] }
                        ],
                        append: false
                    }], true, undefined, () => undefined, undefined, false);
                assert.ok(success1);
                assert.strictEqual(model.cells[0].outputs.length, 1);
                const success2 = model.applyEdits([{
                        editType: 2 /* CellEditType.Output */, index: 0, outputs: [
                            { outputId: 'out2', outputs: [{ mime: 'application/x.notebook.stream', data: buffer_1.VSBuffer.wrap(new Uint8Array([1])) }] }
                        ],
                        append: true
                    }], true, undefined, () => undefined, undefined, false);
                assert.ok(success2);
                assert.strictEqual(model.cells[0].outputs.length, 2);
            });
        });
        test('Clearing output of an empty notebook makes it dirty #119608', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, _, ds) => {
                const model = editor.textModel;
                let event;
                ds.add(model.onDidChangeContent(e => { event = e; }));
                {
                    // 1: add ouput -> event
                    const success = model.applyEdits([{
                            editType: 2 /* CellEditType.Output */, index: 0, outputs: [
                                { outputId: 'out1', outputs: [{ mime: 'application/x.notebook.stream', data: buffer_1.VSBuffer.wrap(new Uint8Array([1])) }] }
                            ],
                            append: false
                        }], true, undefined, () => undefined, undefined, false);
                    assert.ok(success);
                    assert.strictEqual(model.cells[0].outputs.length, 1);
                    assert.ok(event);
                }
                {
                    // 2: clear all output w/ output -> event
                    event = undefined;
                    const success = model.applyEdits([{
                            editType: 2 /* CellEditType.Output */,
                            index: 0,
                            outputs: [],
                            append: false
                        }, {
                            editType: 2 /* CellEditType.Output */,
                            index: 1,
                            outputs: [],
                            append: false
                        }], true, undefined, () => undefined, undefined, false);
                    assert.ok(success);
                    assert.ok(event);
                }
                {
                    // 2: clear all output wo/ output -> NO event
                    event = undefined;
                    const success = model.applyEdits([{
                            editType: 2 /* CellEditType.Output */,
                            index: 0,
                            outputs: [],
                            append: false
                        }, {
                            editType: 2 /* CellEditType.Output */,
                            index: 1,
                            outputs: [],
                            append: false
                        }], true, undefined, () => undefined, undefined, false);
                    assert.ok(success);
                    assert.ok(event === undefined);
                }
            });
        });
        test('Cell metadata/output change should update version id and alternative id #121807', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], async (editor, viewModel) => {
                assert.strictEqual(editor.textModel.versionId, 0);
                const firstAltVersion = '0_0,1;1,1';
                assert.strictEqual(editor.textModel.alternativeVersionId, firstAltVersion);
                editor.textModel.applyEdits([
                    {
                        index: 0,
                        editType: 3 /* CellEditType.Metadata */,
                        metadata: {
                            inputCollapsed: true
                        }
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(editor.textModel.versionId, 1);
                assert.notStrictEqual(editor.textModel.alternativeVersionId, firstAltVersion);
                const secondAltVersion = '1_0,1;1,1';
                assert.strictEqual(editor.textModel.alternativeVersionId, secondAltVersion);
                await viewModel.undo();
                assert.strictEqual(editor.textModel.versionId, 2);
                assert.strictEqual(editor.textModel.alternativeVersionId, firstAltVersion);
                await viewModel.redo();
                assert.strictEqual(editor.textModel.versionId, 3);
                assert.notStrictEqual(editor.textModel.alternativeVersionId, firstAltVersion);
                assert.strictEqual(editor.textModel.alternativeVersionId, secondAltVersion);
                editor.textModel.applyEdits([
                    {
                        index: 1,
                        editType: 3 /* CellEditType.Metadata */,
                        metadata: {
                            inputCollapsed: true
                        }
                    }
                ], true, undefined, () => undefined, undefined, true);
                assert.strictEqual(editor.textModel.versionId, 4);
                assert.strictEqual(editor.textModel.alternativeVersionId, '4_0,1;1,1');
                await viewModel.undo();
                assert.strictEqual(editor.textModel.versionId, 5);
                assert.strictEqual(editor.textModel.alternativeVersionId, secondAltVersion);
            });
        });
        test('Destructive sorting in _doApplyEdits #121994', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i42', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}]
            ], async (editor) => {
                const notebook = editor.textModel;
                assert.strictEqual(notebook.cells[0].outputs.length, 1);
                assert.strictEqual(notebook.cells[0].outputs[0].outputs.length, 1);
                assert.deepStrictEqual(notebook.cells[0].outputs[0].outputs[0].data, (0, testNotebookEditor_1.valueBytesFromString)('test'));
                const edits = [
                    {
                        editType: 2 /* CellEditType.Output */, handle: 0, outputs: []
                    },
                    {
                        editType: 2 /* CellEditType.Output */, handle: 0, append: true, outputs: [{
                                outputId: 'newOutput',
                                outputs: [{ mime: mime_1.Mimes.text, data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }, { mime: 'application/foo', data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }]
                            }]
                    }
                ];
                editor.textModel.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.strictEqual(notebook.cells[0].outputs.length, 1);
                assert.strictEqual(notebook.cells[0].outputs[0].outputs.length, 2);
            });
        });
        test('Destructive sorting in _doApplyEdits #121994. cell splice between output changes', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i42', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i43', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i44', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}]
            ], async (editor) => {
                const notebook = editor.textModel;
                const edits = [
                    {
                        editType: 2 /* CellEditType.Output */, index: 0, outputs: []
                    },
                    {
                        editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: []
                    },
                    {
                        editType: 2 /* CellEditType.Output */, index: 2, append: true, outputs: [{
                                outputId: 'newOutput',
                                outputs: [{ mime: mime_1.Mimes.text, data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }, { mime: 'application/foo', data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }]
                            }]
                    }
                ];
                editor.textModel.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.strictEqual(notebook.cells.length, 2);
                assert.strictEqual(notebook.cells[0].outputs.length, 0);
                assert.strictEqual(notebook.cells[1].outputs.length, 2);
                assert.strictEqual(notebook.cells[1].outputs[0].outputId, 'i44');
                assert.strictEqual(notebook.cells[1].outputs[1].outputId, 'newOutput');
            });
        });
        test('Destructive sorting in _doApplyEdits #121994. cell splice between output changes 2', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i42', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i43', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'i44', outputs: [{ mime: 'm/ime', data: (0, testNotebookEditor_1.valueBytesFromString)('test') }] }], {}]
            ], async (editor) => {
                const notebook = editor.textModel;
                const edits = [
                    {
                        editType: 2 /* CellEditType.Output */, index: 1, append: true, outputs: [{
                                outputId: 'newOutput',
                                outputs: [{ mime: mime_1.Mimes.text, data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }, { mime: 'application/foo', data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }]
                            }]
                    },
                    {
                        editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: []
                    },
                    {
                        editType: 2 /* CellEditType.Output */, index: 1, append: true, outputs: [{
                                outputId: 'newOutput2',
                                outputs: [{ mime: mime_1.Mimes.text, data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }, { mime: 'application/foo', data: (0, testNotebookEditor_1.valueBytesFromString)('cba') }]
                            }]
                    }
                ];
                editor.textModel.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.strictEqual(notebook.cells.length, 2);
                assert.strictEqual(notebook.cells[0].outputs.length, 1);
                assert.strictEqual(notebook.cells[1].outputs.length, 1);
                assert.strictEqual(notebook.cells[1].outputs[0].outputId, 'i44');
            });
        });
        test('Output edits splice', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                assert.strictEqual(model.cells.length, 1);
                assert.strictEqual(model.cells[0].outputs.length, 0);
                const success1 = model.applyEdits([{
                        editType: 2 /* CellEditType.Output */, index: 0, outputs: [
                            { outputId: 'out1', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('1') }] },
                            { outputId: 'out2', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('2') }] },
                            { outputId: 'out3', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('3') }] },
                            { outputId: 'out4', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('4') }] }
                        ],
                        append: false
                    }], true, undefined, () => undefined, undefined, false);
                assert.ok(success1);
                assert.strictEqual(model.cells[0].outputs.length, 4);
                const success2 = model.applyEdits([{
                        editType: 2 /* CellEditType.Output */, index: 0, outputs: [
                            { outputId: 'out1', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('1') }] },
                            { outputId: 'out5', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('5') }] },
                            { outputId: 'out3', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('3') }] },
                            { outputId: 'out6', outputs: [{ mime: 'application/x.notebook.stream', data: (0, testNotebookEditor_1.valueBytesFromString)('6') }] }
                        ],
                        append: false
                    }], true, undefined, () => undefined, undefined, false);
                assert.ok(success2);
                assert.strictEqual(model.cells[0].outputs.length, 4);
                assert.strictEqual(model.cells[0].outputs[0].outputId, 'out1');
                assert.strictEqual(model.cells[0].outputs[1].outputId, 'out5');
                assert.strictEqual(model.cells[0].outputs[2].outputId, 'out3');
                assert.strictEqual(model.cells[0].outputs[3].outputId, 'out6');
            });
        });
        test('computeEdits no insert', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ]);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} }
                ]);
            });
        });
        test('computeEdits cell content changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 2;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells },
                ]);
            });
        });
        test('computeEdits last cell content changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined },
                    { source: 'var b = 2;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: cells.slice(1) },
                ]);
            });
        });
        test('computeEdits first cell content changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 2;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: cells.slice(0, 1) },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: {} },
                ]);
            });
        });
        test('computeEdits middle cell content changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined },
                    { source: 'var b = 2;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined },
                    { source: 'var c = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: cells.slice(1, 2) },
                    { editType: 3 /* CellEditType.Metadata */, index: 2, metadata: {} },
                ]);
            });
        });
        test('computeEdits cell metadata changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: { name: 'foo' } },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: { name: 'foo' } },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: {} },
                ]);
            });
        });
        test('computeEdits cell language changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'typescript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: cells.slice(0, 1) },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: {} },
                ]);
            });
        });
        test('computeEdits cell kind changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Markup, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: cells.slice(1) },
                ]);
            });
        });
        test('computeEdits cell metadata & content changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: { name: 'foo' } },
                    { source: 'var b = 2;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: { name: 'bar' } }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: { name: 'foo' } },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 1, cells: cells.slice(1) }
                ]);
            });
        });
        test('computeEdits cell internal metadata changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined, internalMetadata: { executionOrder: 1 } },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: cells.slice(0, 1) },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: {} },
                ]);
            });
        });
        test('computeEdits cell insertion', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    { source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined, },
                    { source: 'var c = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: undefined, },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: { foo: 'bar' } }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} },
                    { editType: 1 /* CellEditType.Replace */, index: 1, count: 0, cells: cells.slice(1, 2) },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: { foo: 'bar' } },
                ]);
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 3);
                assert.equal(model.cells[1].getValue(), 'var c = 1;');
                assert.equal(model.cells[2].getValue(), 'var b = 1;');
                assert.deepStrictEqual(model.cells[2].metadata, { foo: 'bar' });
            });
        });
        test('computeEdits output changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    {
                        source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [{
                                outputId: 'someId',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_World_') }]
                            }], metadata: undefined,
                    },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: { foo: 'bar' } }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} },
                    {
                        editType: 2 /* CellEditType.Output */, index: 0, outputs: [{
                                outputId: 'someId',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_World_') }]
                            }], append: false
                    },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: { foo: 'bar' } },
                ]);
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 2);
                assert.strictEqual(model.cells[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputId, 'someId');
                assert.equal(model.cells[0].outputs[0].outputs[0].data.toString(), '_World_');
            });
        });
        test('computeEdits output items changed', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{
                            outputId: 'someId',
                            outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_Hello_') }]
                        }], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor) => {
                const model = editor.textModel;
                const cells = [
                    {
                        source: 'var a = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [{
                                outputId: 'someId',
                                outputs: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_World_') }]
                            }], metadata: undefined,
                    },
                    { source: 'var b = 1;', language: 'javascript', cellKind: notebookCommon_1.CellKind.Code, mime: undefined, outputs: [], metadata: { foo: 'bar' } }
                ];
                const edits = notebookTextModel_1.NotebookTextModel.computeEdits(model, cells);
                assert.deepStrictEqual(edits, [
                    { editType: 3 /* CellEditType.Metadata */, index: 0, metadata: {} },
                    { editType: 7 /* CellEditType.OutputItems */, outputId: 'someId', items: [{ mime: mime_1.Mimes.markdown, data: (0, testNotebookEditor_1.valueBytesFromString)('_World_') }], append: false },
                    { editType: 3 /* CellEditType.Metadata */, index: 1, metadata: { foo: 'bar' } },
                ]);
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 2);
                assert.strictEqual(model.cells[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputId, 'someId');
                assert.equal(model.cells[0].outputs[0].outputs[0].data.toString(), '_World_');
            });
        });
        test('Append multiple text/plain output items', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{
                            outputId: '1',
                            outputs: [{ mime: 'text/plain', data: (0, testNotebookEditor_1.valueBytesFromString)('foo') }]
                        }], {}]
            ], (editor) => {
                const model = editor.textModel;
                const edits = [
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        outputId: '1',
                        append: true,
                        items: [{ mime: 'text/plain', data: buffer_1.VSBuffer.fromString('bar') }, { mime: 'text/plain', data: buffer_1.VSBuffer.fromString('baz') }]
                    }
                ];
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 1);
                assert.equal(model.cells[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputs.length, 3);
                assert.equal(model.cells[0].outputs[0].outputs[0].mime, 'text/plain');
                assert.equal(model.cells[0].outputs[0].outputs[0].data.toString(), 'foo');
                assert.equal(model.cells[0].outputs[0].outputs[1].mime, 'text/plain');
                assert.equal(model.cells[0].outputs[0].outputs[1].data.toString(), 'bar');
                assert.equal(model.cells[0].outputs[0].outputs[2].mime, 'text/plain');
                assert.equal(model.cells[0].outputs[0].outputs[2].data.toString(), 'baz');
            });
        });
        test('Append multiple stdout stream output items to an output with another mime', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{
                            outputId: '1',
                            outputs: [{ mime: 'text/plain', data: (0, testNotebookEditor_1.valueBytesFromString)('foo') }]
                        }], {}]
            ], (editor) => {
                const model = editor.textModel;
                const edits = [
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        outputId: '1',
                        append: true,
                        items: [{ mime: 'application/vnd.code.notebook.stdout', data: buffer_1.VSBuffer.fromString('bar') }, { mime: 'application/vnd.code.notebook.stdout', data: buffer_1.VSBuffer.fromString('baz') }]
                    }
                ];
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 1);
                assert.equal(model.cells[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputs.length, 3);
                assert.equal(model.cells[0].outputs[0].outputs[0].mime, 'text/plain');
                assert.equal(model.cells[0].outputs[0].outputs[0].data.toString(), 'foo');
                assert.equal(model.cells[0].outputs[0].outputs[1].mime, 'application/vnd.code.notebook.stdout');
                assert.equal(model.cells[0].outputs[0].outputs[1].data.toString(), 'bar');
                assert.equal(model.cells[0].outputs[0].outputs[2].mime, 'application/vnd.code.notebook.stdout');
                assert.equal(model.cells[0].outputs[0].outputs[2].data.toString(), 'baz');
            });
        });
        test('Compress multiple stdout stream output items', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{
                            outputId: '1',
                            outputs: [{ mime: 'application/vnd.code.notebook.stdout', data: (0, testNotebookEditor_1.valueBytesFromString)('foo') }]
                        }], {}]
            ], (editor) => {
                const model = editor.textModel;
                const edits = [
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        outputId: '1',
                        append: true,
                        items: [{ mime: 'application/vnd.code.notebook.stdout', data: buffer_1.VSBuffer.fromString('bar') }, { mime: 'application/vnd.code.notebook.stdout', data: buffer_1.VSBuffer.fromString('baz') }]
                    }
                ];
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 1);
                assert.equal(model.cells[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputs[0].mime, 'application/vnd.code.notebook.stdout');
                assert.equal(model.cells[0].outputs[0].outputs[0].data.toString(), 'foobarbaz');
            });
        });
        test('Compress multiple stderr stream output items', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [{
                            outputId: '1',
                            outputs: [{ mime: 'application/vnd.code.notebook.stderr', data: (0, testNotebookEditor_1.valueBytesFromString)('foo') }]
                        }], {}]
            ], (editor) => {
                const model = editor.textModel;
                const edits = [
                    {
                        editType: 7 /* CellEditType.OutputItems */,
                        outputId: '1',
                        append: true,
                        items: [{ mime: 'application/vnd.code.notebook.stderr', data: buffer_1.VSBuffer.fromString('bar') }, { mime: 'application/vnd.code.notebook.stderr', data: buffer_1.VSBuffer.fromString('baz') }]
                    }
                ];
                model.applyEdits(edits, true, undefined, () => undefined, undefined, true);
                assert.equal(model.cells.length, 1);
                assert.equal(model.cells[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputs.length, 1);
                assert.equal(model.cells[0].outputs[0].outputs[0].mime, 'application/vnd.code.notebook.stderr');
                assert.equal(model.cells[0].outputs[0].outputs[0].data.toString(), 'foobarbaz');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tUZXh0TW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rVGV4dE1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUMvQixJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGVBQWlDLENBQUM7UUFFdEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQUcsSUFBQSw4Q0FBeUIsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUM5RCxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDN0Qsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO1FBRUgsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRTNDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSztZQUNuQixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUMxQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQixFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDNUssRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksNkJBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUU7aUJBQzVLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUV0RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUU5QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUs7WUFDOUMsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDMUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDbkMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEIsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksNkJBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzVLLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDZCQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO2lCQUM1SyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSztZQUNuQixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQixFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7b0JBQ2pFLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtpQkFDakUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRXRELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pFLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSztZQUM1QixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUMxQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQixFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7b0JBQ2pFLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDZCQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO2lCQUM1SyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLO1lBQzdDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQzFCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQ25DLFNBQVMsQ0FBQyxVQUFVLENBQUM7b0JBQ3BCLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtvQkFDakUsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksNkJBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUU7aUJBQzVLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUV0RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pFLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNENBQTRDLEVBQUUsS0FBSztZQUN2RCxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUMxQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQixFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtpQkFDNUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRXRELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSztZQUNuQixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUVuQyxrQkFBa0I7Z0JBQ2xCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO29CQUNsQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBQ3JCLEtBQUssRUFBRSxNQUFNLENBQUMsU0FBUzs0QkFDdkIsUUFBUSw2QkFBcUI7NEJBQzdCLE9BQU8sRUFBRSxFQUFFO3lCQUNYLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELENBQUMsQ0FBQyxDQUFDO2dCQUVILGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7b0JBQ2xCLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDckIsS0FBSyxFQUFFLENBQUMsQ0FBQzs0QkFDVCxRQUFRLDZCQUFxQjs0QkFDN0IsT0FBTyxFQUFFLEVBQUU7eUJBQ1gsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEQsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNyQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLDZCQUFxQjt3QkFDN0IsT0FBTyxFQUFFLENBQUM7Z0NBQ1QsUUFBUSxFQUFFLFFBQVE7Z0NBQ2xCLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzs2QkFDMUUsQ0FBQztxQkFDRixDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUV2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFekQsU0FBUztnQkFDVCxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3JCLEtBQUssRUFBRSxDQUFDO3dCQUNSLFFBQVEsNkJBQXFCO3dCQUM3QixNQUFNLEVBQUUsSUFBSTt3QkFDWixPQUFPLEVBQUUsQ0FBQztnQ0FDVCxRQUFRLEVBQUUsU0FBUztnQ0FDbkIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxVQUFVLENBQUMsRUFBRSxDQUFDOzZCQUMzRSxDQUFDO3FCQUNGLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRXZELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFL0MsY0FBYztnQkFDZCxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3JCLEtBQUssRUFBRSxDQUFDO3dCQUNSLFFBQVEsNkJBQXFCO3dCQUM3QixPQUFPLEVBQUUsQ0FBQztnQ0FDVCxRQUFRLEVBQUUsU0FBUztnQ0FDbkIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7NkJBQ3BGLENBQUM7cUJBQ0YsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELENBQUMsS0FBSyxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEtBQUs7WUFDbkQsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFFbkMsU0FBUztnQkFDVCxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLDZCQUFxQjt3QkFDN0IsTUFBTSxFQUFFLElBQUk7d0JBQ1osT0FBTyxFQUFFLENBQUM7Z0NBQ1QsUUFBUSxFQUFFLFNBQVM7Z0NBQ25CLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzs2QkFDM0UsQ0FBQztxQkFDRjtvQkFDRDt3QkFDQyxLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLDZCQUFxQjt3QkFDN0IsTUFBTSxFQUFFLElBQUk7d0JBQ1osT0FBTyxFQUFFLENBQUM7Z0NBQ1QsUUFBUSxFQUFFLFNBQVM7Z0NBQ25CLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzs2QkFDM0UsQ0FBQztxQkFDRjtpQkFDRCxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsS0FBSztZQUNuRCxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUVuQyxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLDZCQUFxQjt3QkFDN0IsTUFBTSxFQUFFLElBQUk7d0JBQ1osT0FBTyxFQUFFLENBQUM7Z0NBQ1QsUUFBUSxFQUFFLFNBQVM7Z0NBQ25CLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzs2QkFDM0UsQ0FBQztxQkFDRjtvQkFDRDt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osUUFBUSxFQUFFLFNBQVM7d0JBQ25CLEtBQUssRUFBRSxDQUFDO2dDQUNQLElBQUksRUFBRSxZQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQzs2QkFDNUQsQ0FBQztxQkFDRjtpQkFDRCxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDNUQsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFHLHNDQUFzQyxDQUFDO1FBQzFELE1BQU0sVUFBVSxHQUFHLHNDQUFzQyxDQUFDO1FBRTFELElBQUksQ0FBQyw2QkFBNkIsRUFBRSxLQUFLO1lBQ3hDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNWLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBRW5DLFNBQVMsQ0FBQyxVQUFVLENBQUM7b0JBQ3BCO3dCQUNDLEtBQUssRUFBRSxDQUFDO3dCQUNSLFFBQVEsNkJBQXFCO3dCQUM3QixNQUFNLEVBQUUsSUFBSTt3QkFDWixPQUFPLEVBQUUsQ0FBQztnQ0FDVCxRQUFRLEVBQUUsU0FBUztnQ0FDbkIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7NkJBQ3ZFLENBQUM7cUJBQ0Y7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUU5RSxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osUUFBUSxFQUFFLFNBQVM7d0JBQ25CLEtBQUssRUFBRTs0QkFDTixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUU7NEJBQzVELEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxVQUFVLENBQUMsRUFBRTt5QkFDNUQ7cUJBQ0Q7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztnQkFFMUUsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEI7d0JBQ0MsUUFBUSxrQ0FBMEI7d0JBQ2xDLE1BQU0sRUFBRSxJQUFJO3dCQUNaLFFBQVEsRUFBRSxTQUFTO3dCQUNuQixLQUFLLEVBQUU7NEJBQ04sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQyxFQUFFOzRCQUM1RCxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUU7eUJBQzVEO3FCQUNEO2lCQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7Z0JBRTFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7Z0JBQ2xHLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO2dCQUMvRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztnQkFDL0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxLQUFLO1lBQ3hDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNWLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBRW5DLFNBQVMsQ0FBQyxVQUFVLENBQUM7b0JBQ3BCO3dCQUNDLEtBQUssRUFBRSxDQUFDO3dCQUNSLFFBQVEsNkJBQXFCO3dCQUM3QixNQUFNLEVBQUUsSUFBSTt3QkFDWixPQUFPLEVBQUUsQ0FBQztnQ0FDVCxRQUFRLEVBQUUsU0FBUztnQ0FDbkIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7NkJBQ3ZFLENBQUM7cUJBQ0Y7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUU5RSxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osUUFBUSxFQUFFLFNBQVM7d0JBQ25CLEtBQUssRUFBRSxDQUFDO2dDQUNQLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDOzZCQUN4RCxDQUFDO3FCQUNGO2lCQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7Z0JBRTFFLFNBQVMsQ0FBQyxVQUFVLENBQUM7b0JBQ3BCO3dCQUNDLFFBQVEsa0NBQTBCO3dCQUNsQyxNQUFNLEVBQUUsS0FBSzt3QkFDYixRQUFRLEVBQUUsU0FBUzt3QkFDbkIsS0FBSyxFQUFFLENBQUM7Z0NBQ1AsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxXQUFXLENBQUM7NkJBQ3pELENBQUM7cUJBQ0Y7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztnQkFFM0UsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEI7d0JBQ0MsUUFBUSxrQ0FBMEI7d0JBQ2xDLE1BQU0sRUFBRSxJQUFJO3dCQUNaLFFBQVEsRUFBRSxTQUFTO3dCQUNuQixLQUFLLEVBQUUsQ0FBQztnQ0FDUCxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQzs2QkFDeEQsQ0FBQztxQkFDRjtpQkFBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO2dCQUUxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQ3ZFLHFFQUFxRSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQ3ZFLHFFQUFxRSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN4RixDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBEQUEwRCxFQUFFLEtBQUs7WUFFckUsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFFbkMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEI7d0JBQ0MsS0FBSyxFQUFFLENBQUM7d0JBQ1IsUUFBUSw2QkFBcUI7d0JBQzdCLE1BQU0sRUFBRSxJQUFJO3dCQUNaLE9BQU8sRUFBRSxDQUFDO2dDQUNULFFBQVEsRUFBRSxTQUFTO2dDQUNuQixPQUFPLEVBQUU7b0NBQ1IsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQyxFQUFFO29DQUM1RCxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsWUFBWSxDQUFDLEVBQUU7aUNBQUM7NkJBQ2hFLENBQUM7cUJBQ0Y7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUU5RSxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osUUFBUSxFQUFFLFNBQVM7d0JBQ25CLEtBQUssRUFBRSxDQUFDO2dDQUNQLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsMkNBQTBCLEdBQUcsWUFBWSxDQUFDOzZCQUN2RixDQUFDO3FCQUNGO2lCQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7Z0JBRTFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFDdkUsd0VBQXdFLENBQUMsQ0FBQztZQUM1RSxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhEQUE4RCxFQUFFLEtBQUs7WUFFekUsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFFbkMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEI7d0JBQ0MsS0FBSyxFQUFFLENBQUM7d0JBQ1IsUUFBUSw2QkFBcUI7d0JBQzdCLE1BQU0sRUFBRSxJQUFJO3dCQUNaLE9BQU8sRUFBRSxDQUFDO2dDQUNULFFBQVEsRUFBRSxTQUFTO2dDQUNuQixPQUFPLEVBQUU7b0NBQ1IsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQyxFQUFFO29DQUM1RCxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsWUFBWSxDQUFDLEVBQUU7aUNBQUM7NkJBQ2hFLENBQUM7cUJBQ0Y7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUU5RSxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osUUFBUSxFQUFFLFNBQVM7d0JBQ25CLEtBQUssRUFBRSxDQUFDO2dDQUNQLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsWUFBWSxDQUFDOzZCQUMxRCxDQUFDO3FCQUNGO2lCQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7Z0JBRTFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFDdkUsd0VBQXdFLENBQUMsQ0FBQztZQUM1RSxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFEQUFxRCxFQUFFLEtBQUs7WUFDaEUsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFFbkMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEI7d0JBQ0MsS0FBSyxFQUFFLENBQUM7d0JBQ1IsUUFBUSw2QkFBcUI7d0JBQzdCLE1BQU0sRUFBRSxJQUFJO3dCQUNaLE9BQU8sRUFBRSxDQUFDO2dDQUNULFFBQVEsRUFBRSxTQUFTO2dDQUNuQixPQUFPLEVBQUU7b0NBQ1IsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFVBQVUsQ0FBQyxFQUFFO29DQUM1RCxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUU7aUNBQzVEOzZCQUNELENBQUM7cUJBQ0Y7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUU5RSxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUNwQjt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osUUFBUSxFQUFFLFNBQVM7d0JBQ25CLEtBQUssRUFBRTs0QkFDTixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsVUFBVSxDQUFDLEVBQUU7NEJBQzVELEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxVQUFVLENBQUMsRUFBRTt5QkFDNUQ7cUJBQ0Q7aUJBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztnQkFFM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDeEYsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSztZQUNyQixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUVuQyxrQkFBa0I7Z0JBQ2xCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO29CQUNsQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBQ3JCLEtBQUssRUFBRSxNQUFNLENBQUMsU0FBUzs0QkFDdkIsUUFBUSwrQkFBdUI7NEJBQy9CLFFBQVEsRUFBRSxFQUFFO3lCQUNaLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELENBQUMsQ0FBQyxDQUFDO2dCQUVILGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7b0JBQ2xCLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDckIsS0FBSyxFQUFFLENBQUMsQ0FBQzs0QkFDVCxRQUFRLCtCQUF1Qjs0QkFDL0IsUUFBUSxFQUFFLEVBQUU7eUJBQ1osQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEQsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNyQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLCtCQUF1Qjt3QkFDL0IsUUFBUSxFQUFFLEVBQUUsY0FBYyxFQUFFLEVBQUUsRUFBRTtxQkFDaEMsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdkQsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNyQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLCtCQUF1Qjt3QkFDL0IsUUFBUSxFQUFFLEVBQUU7cUJBQ1osQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxLQUFLO1lBQzdCLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNWLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBRW5DLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDckIsS0FBSyxFQUFFLENBQUM7d0JBQ1IsUUFBUSxzQ0FBOEI7d0JBQ3RDLFFBQVEsRUFBRSxFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUU7cUJBQ2hDLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRXZELFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDckIsS0FBSyxFQUFFLENBQUM7d0JBQ1IsUUFBUSxzQ0FBOEI7d0JBQ3RDLFFBQVEsRUFBRSxFQUFFO3FCQUNaLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRXZELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsS0FBSztZQUN6QyxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUMxQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxJQUFJLFdBQVcsR0FBOEMsU0FBUyxDQUFDO2dCQUN2RSxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3RELFdBQVcsR0FBRyxDQUFDLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxDQUFDO2dCQUNILE1BQU0sZ0JBQWdCLEdBQTBDLEVBQUUsQ0FBQztnQkFDbkUsTUFBTSxrQkFBa0IsR0FBRyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdELGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztnQkFFcEMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEIsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO29CQUNqRSxFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtpQkFDNUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsbUNBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVsSixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUVoRSxNQUFNLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFZLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsS0FBSztZQUNuRCxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxJQUFJLFdBQVcsR0FBOEMsU0FBUyxDQUFDO2dCQUN2RSxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3RELFdBQVcsR0FBRyxDQUFDLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxDQUFDO2dCQUNILE1BQU0sZ0JBQWdCLEdBQTBDLEVBQUUsQ0FBQztnQkFDbkUsTUFBTSxrQkFBa0IsR0FBRyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdELGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztnQkFFcEMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDcEIsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO29CQUNqRTt3QkFDQyxLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLCtCQUF1Qjt3QkFDL0IsUUFBUSxFQUFFLEVBQUU7cUJBQ1o7aUJBQ0QsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsbUNBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVsSixNQUFNLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFZLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsbUZBQW1GLEVBQUUsS0FBSztZQUM5RixNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUUvQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FDaEMsQ0FBQzt3QkFDQSxRQUFRLDZCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFOzRCQUNqRCxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTt5QkFDcEg7d0JBQ0QsTUFBTSxFQUFFLEtBQUs7cUJBQ2IsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQ3RELENBQUM7Z0JBRUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQ2hDLENBQUM7d0JBQ0EsUUFBUSw2QkFBcUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRTs0QkFDakQsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLCtCQUErQixFQUFFLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7eUJBQ3BIO3dCQUNELE1BQU0sRUFBRSxJQUFJO3FCQUNaLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUN0RCxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkRBQTZELEVBQUUsS0FBSztZQUN4RSxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDcEIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFFL0IsSUFBSSxLQUFnRCxDQUFDO2dCQUVyRCxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV0RCxDQUFDO29CQUNBLHdCQUF3QjtvQkFDeEIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FDL0IsQ0FBQzs0QkFDQSxRQUFRLDZCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFO2dDQUNqRCxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLGlCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTs2QkFDcEg7NEJBQ0QsTUFBTSxFQUFFLEtBQUs7eUJBQ2IsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQ3RELENBQUM7b0JBRUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JELE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQsQ0FBQztvQkFDQSx5Q0FBeUM7b0JBQ3pDLEtBQUssR0FBRyxTQUFTLENBQUM7b0JBQ2xCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQy9CLENBQUM7NEJBQ0EsUUFBUSw2QkFBcUI7NEJBQzdCLEtBQUssRUFBRSxDQUFDOzRCQUNSLE9BQU8sRUFBRSxFQUFFOzRCQUNYLE1BQU0sRUFBRSxLQUFLO3lCQUNiLEVBQUU7NEJBQ0YsUUFBUSw2QkFBcUI7NEJBQzdCLEtBQUssRUFBRSxDQUFDOzRCQUNSLE9BQU8sRUFBRSxFQUFFOzRCQUNYLE1BQU0sRUFBRSxLQUFLO3lCQUNiLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUN0RCxDQUFDO29CQUNGLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ25CLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQsQ0FBQztvQkFDQSw2Q0FBNkM7b0JBQzdDLEtBQUssR0FBRyxTQUFTLENBQUM7b0JBQ2xCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQy9CLENBQUM7NEJBQ0EsUUFBUSw2QkFBcUI7NEJBQzdCLEtBQUssRUFBRSxDQUFDOzRCQUNSLE9BQU8sRUFBRSxFQUFFOzRCQUNYLE1BQU0sRUFBRSxLQUFLO3lCQUNiLEVBQUU7NEJBQ0YsUUFBUSw2QkFBcUI7NEJBQzdCLEtBQUssRUFBRSxDQUFDOzRCQUNSLE9BQU8sRUFBRSxFQUFFOzRCQUNYLE1BQU0sRUFBRSxLQUFLO3lCQUNiLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUN0RCxDQUFDO29CQUVGLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ25CLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRkFBaUYsRUFBRSxLQUFLO1lBQzVGLE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDOUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQzNFLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO29CQUMzQjt3QkFDQyxLQUFLLEVBQUUsQ0FBQzt3QkFDUixRQUFRLCtCQUF1Qjt3QkFDL0IsUUFBUSxFQUFFOzRCQUNULGNBQWMsRUFBRSxJQUFJO3lCQUNwQjtxQkFDRDtpQkFDRCxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUM5RSxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBRTVFLE1BQU0sU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBRTNFLE1BQU0sU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUU1RSxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztvQkFDM0I7d0JBQ0MsS0FBSyxFQUFFLENBQUM7d0JBQ1IsUUFBUSwrQkFBdUI7d0JBQy9CLFFBQVEsRUFBRTs0QkFDVCxjQUFjLEVBQUUsSUFBSTt5QkFDcEI7cUJBQ0Q7aUJBQ0QsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFFdkUsTUFBTSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRTdFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSztZQUN6RCxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDeEksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBRW5CLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBRWxDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBRW5HLE1BQU0sS0FBSyxHQUF5QjtvQkFDbkM7d0JBQ0MsUUFBUSw2QkFBcUIsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFO3FCQUNyRDtvQkFDRDt3QkFDQyxRQUFRLDZCQUFxQixFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQztnQ0FDakUsUUFBUSxFQUFFLFdBQVc7Z0NBQ3JCLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDOzZCQUNsSSxDQUFDO3FCQUNGO2lCQUNELENBQUM7Z0JBRUYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFdEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtGQUFrRixFQUFFLEtBQUs7WUFDN0YsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4SSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4SSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ3hJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNuQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUVsQyxNQUFNLEtBQUssR0FBeUI7b0JBQ25DO3dCQUNDLFFBQVEsNkJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRTtxQkFDcEQ7b0JBQ0Q7d0JBQ0MsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUU7cUJBQzdEO29CQUNEO3dCQUNDLFFBQVEsNkJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUNoRSxRQUFRLEVBQUUsV0FBVztnQ0FDckIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7NkJBQ2xJLENBQUM7cUJBQ0Y7aUJBQ0QsQ0FBQztnQkFFRixNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUV0RixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN4RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9GQUFvRixFQUFFLEtBQUs7WUFDL0YsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4SSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4SSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ3hJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNuQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUVsQyxNQUFNLEtBQUssR0FBeUI7b0JBQ25DO3dCQUNDLFFBQVEsNkJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUNoRSxRQUFRLEVBQUUsV0FBVztnQ0FDckIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7NkJBQ2xJLENBQUM7cUJBQ0Y7b0JBQ0Q7d0JBQ0MsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUU7cUJBQzdEO29CQUNEO3dCQUNDLFFBQVEsNkJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUNoRSxRQUFRLEVBQUUsWUFBWTtnQ0FDdEIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7NkJBQ2xJLENBQUM7cUJBQ0Y7aUJBQ0QsQ0FBQztnQkFFRixNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUV0RixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsS0FBSztZQUNoQyxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUUvQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FDaEMsQ0FBQzt3QkFDQSxRQUFRLDZCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFOzRCQUNqRCxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFOzRCQUMzRyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFOzRCQUMzRyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFOzRCQUMzRyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO3lCQUMzRzt3QkFDRCxNQUFNLEVBQUUsS0FBSztxQkFDYixDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FDdEQsQ0FBQztnQkFFRixNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FDaEMsQ0FBQzt3QkFDQSxRQUFRLDZCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFOzRCQUNqRCxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFOzRCQUMzRyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFOzRCQUMzRyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFOzRCQUMzRyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO3lCQUMzRzt3QkFDRCxNQUFNLEVBQUUsS0FBSztxQkFDYixDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FDdEQsQ0FBQztnQkFFRixNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRSxLQUFLO1lBQ25DLE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHLHFDQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7b0JBQ25ELEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtpQkFDNUgsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFO29CQUM3QixFQUFFLFFBQVEsK0JBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO2lCQUMzRCxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUs7WUFDOUMsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUc7b0JBQ2IsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO2lCQUM1SCxDQUFDO2dCQUNGLE1BQU0sS0FBSyxHQUFHLHFDQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTNELE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFO29CQUM3QixFQUFFLFFBQVEsOEJBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtpQkFDN0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLO1lBQ25ELE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUMvQixNQUFNLEtBQUssR0FBRztvQkFDYixFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7b0JBQzVILEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtpQkFDNUgsQ0FBQztnQkFDRixNQUFNLEtBQUssR0FBRyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxRQUFRLCtCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtvQkFDM0QsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtpQkFDN0UsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLO1lBQ3BELE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUMvQixNQUFNLEtBQUssR0FBRztvQkFDYixFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7b0JBQzVILEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtpQkFDNUgsQ0FBQztnQkFDRixNQUFNLEtBQUssR0FBRyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQ2hGLEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7aUJBQzNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsS0FBSztZQUNyRCxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHO29CQUNiLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtvQkFDNUgsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO29CQUM1SCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7aUJBQzVILENBQUM7Z0JBQ0YsTUFBTSxLQUFLLEdBQUcscUNBQWlCLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUU7b0JBQzdCLEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7b0JBQzNELEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNoRixFQUFFLFFBQVEsK0JBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO2lCQUMzRCxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEtBQUs7WUFDL0MsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHO29CQUNiLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUNsSSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7aUJBQzVILENBQUM7Z0JBQ0YsTUFBTSxLQUFLLEdBQUcscUNBQWlCLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUU7b0JBQzdCLEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtvQkFDeEUsRUFBRSxRQUFRLCtCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtpQkFDM0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLO1lBQy9DLE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUMvQixNQUFNLEtBQUssR0FBRztvQkFDYixFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7b0JBQzVILEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtpQkFDNUgsQ0FBQztnQkFDRixNQUFNLEtBQUssR0FBRyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQ2hGLEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7aUJBQzNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsS0FBSztZQUMzQyxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUc7b0JBQ2IsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO29CQUM1SCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7aUJBQzlILENBQUM7Z0JBQ0YsTUFBTSxLQUFLLEdBQUcscUNBQWlCLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUU7b0JBQzdCLEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7b0JBQzNELEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7aUJBQzdFLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSztZQUN6RCxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUc7b0JBQ2IsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ2xJLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2lCQUNsSSxDQUFDO2dCQUNGLE1BQU0sS0FBSyxHQUFHLHFDQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTNELE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFO29CQUM3QixFQUFFLFFBQVEsK0JBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3hFLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7aUJBQzdFLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsS0FBSztZQUN4RCxNQUFNLElBQUEscUNBQWdCLEVBQUM7Z0JBQ3RCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUc7b0JBQ2IsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNySyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7aUJBQzVILENBQUM7Z0JBQ0YsTUFBTSxLQUFLLEdBQUcscUNBQWlCLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUU7b0JBQzdCLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNoRixFQUFFLFFBQVEsK0JBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO2lCQUMzRCxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUs7WUFDeEMsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHO29CQUNiLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsR0FBRztvQkFDN0gsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHO29CQUM3SCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtpQkFDakksQ0FBQztnQkFDRixNQUFNLEtBQUssR0FBRyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxRQUFRLCtCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtvQkFDM0QsRUFBRSxRQUFRLDhCQUFzQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQ2hGLEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtpQkFDdkUsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUs7WUFDeEMsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHO29CQUNiO3dCQUNDLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQ0FDakcsUUFBUSxFQUFFLFFBQVE7Z0NBQ2xCLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzs2QkFDMUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTO3FCQUN2QjtvQkFDRCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtpQkFDakksQ0FBQztnQkFDRixNQUFNLEtBQUssR0FBRyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxRQUFRLCtCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtvQkFDM0Q7d0JBQ0MsUUFBUSw2QkFBcUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dDQUNsRCxRQUFRLEVBQUUsUUFBUTtnQ0FDbEIsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxTQUFTLENBQUMsRUFBRSxDQUFDOzZCQUMxRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUs7cUJBQ2pCO29CQUNELEVBQUUsUUFBUSwrQkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtpQkFDdkUsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLO1lBQzlDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQzVDLFFBQVEsRUFBRSxRQUFROzRCQUNsQixPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7eUJBQzFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1AsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHO29CQUNiO3dCQUNDLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQ0FDakcsUUFBUSxFQUFFLFFBQVE7Z0NBQ2xCLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUEseUNBQW9CLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzs2QkFDMUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTO3FCQUN2QjtvQkFDRCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtpQkFDakksQ0FBQztnQkFDRixNQUFNLEtBQUssR0FBRyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxRQUFRLCtCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtvQkFDM0QsRUFBRSxRQUFRLGtDQUEwQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtvQkFDbkosRUFBRSxRQUFRLCtCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO2lCQUN2RSxDQUFDLENBQUM7Z0JBRUgsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEtBQUs7WUFDcEQsTUFBTSxJQUFBLHFDQUFnQixFQUFDO2dCQUN0QixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDNUMsUUFBUSxFQUFFLEdBQUc7NEJBQ2IsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFBLHlDQUFvQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7eUJBQ3BFLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDUCxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQXlCO29CQUNuQzt3QkFDQyxRQUFRLGtDQUEwQjt3QkFDbEMsUUFBUSxFQUFFLEdBQUc7d0JBQ2IsTUFBTSxFQUFFLElBQUk7d0JBQ1osS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztxQkFDM0g7aUJBQ0QsQ0FBQztnQkFDRixLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQywyRUFBMkUsRUFBRSxLQUFLO1lBQ3RGLE1BQU0sSUFBQSxxQ0FBZ0IsRUFBQztnQkFDdEIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQzVDLFFBQVEsRUFBRSxHQUFHOzRCQUNiLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBQSx5Q0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO3lCQUNwRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ1AsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUF5QjtvQkFDbkM7d0JBQ0MsUUFBUSxrQ0FBMEI7d0JBQ2xDLFFBQVEsRUFBRSxHQUFHO3dCQUNiLE1BQU0sRUFBRSxJQUFJO3dCQUNaLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLHNDQUFzQyxFQUFFLElBQUksRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLHNDQUFzQyxFQUFFLElBQUksRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO3FCQUMvSztpQkFDRCxDQUFDO2dCQUNGLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUNoRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUNoRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFDSixD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