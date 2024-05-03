/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/diff/diff", "vs/base/common/mime", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/diff/eventDispatcher", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditor", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, buffer_1, diff_1, mime_1, utils_1, testConfigurationService_1, eventDispatcher_1, notebookDiffEditor_1, notebookCommon_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CellSequence {
        constructor(textModel) {
            this.textModel = textModel;
        }
        getElements() {
            const hashValue = new Int32Array(this.textModel.cells.length);
            for (let i = 0; i < this.textModel.cells.length; i++) {
                hashValue[i] = this.textModel.cells[i].getHashValue();
            }
            return hashValue;
        }
    }
    suite('NotebookCommon', () => {
        const configurationService = new testConfigurationService_1.TestConfigurationService();
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('diff different source', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
            ], [
                ['y', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                assert.strictEqual(diffResult.changes.length, 1);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 0,
                        originalLength: 1,
                        modifiedStart: 0,
                        modifiedLength: 1
                    }]);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 1);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'modified');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff different output', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([5])) }] }], { metadata: { collapsed: false }, executionOrder: 5 }],
                ['', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], [
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
                ['', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                assert.strictEqual(diffResult.changes.length, 1);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 0,
                        originalLength: 1,
                        modifiedStart: 0,
                        modifiedLength: 1
                    }]);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 2);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'modified');
                assert.strictEqual(diffViewModels.viewModels[1].type, 'unchanged');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff test small source', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['123456789', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], [
                ['987654321', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                assert.strictEqual(diffResult.changes.length, 1);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 0,
                        originalLength: 1,
                        modifiedStart: 0,
                        modifiedLength: 1
                    }]);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 1);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'modified');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff test data single cell', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                [[
                        '# This version has a bug\n',
                        'def mult(a, b):\n',
                        '    return a / b'
                    ].join(''), 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], [
                [[
                        'def mult(a, b):\n',
                        '    \'This version is debugged.\'\n',
                        '    return a * b'
                    ].join(''), 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                assert.strictEqual(diffResult.changes.length, 1);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 0,
                        originalLength: 1,
                        modifiedStart: 0,
                        modifiedLength: 1
                    }]);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 1);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'modified');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff foo/foe', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                [['def foe(x, y):\n', '    return x + y\n', 'foe(3, 2)'].join(''), 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([6])) }] }], { metadata: { collapsed: false }, executionOrder: 5 }],
                [['def foo(x, y):\n', '    return x * y\n', 'foo(1, 2)'].join(''), 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([2])) }] }], { metadata: { collapsed: false }, executionOrder: 6 }],
                ['', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], [
                [['def foo(x, y):\n', '    return x * y\n', 'foo(1, 2)'].join(''), 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([6])) }] }], { metadata: { collapsed: false }, executionOrder: 5 }],
                [['def foe(x, y):\n', '    return x + y\n', 'foe(3, 2)'].join(''), 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([2])) }] }], { metadata: { collapsed: false }, executionOrder: 6 }],
                ['', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 3);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'modified');
                assert.strictEqual(diffViewModels.viewModels[1].type, 'modified');
                assert.strictEqual(diffViewModels.viewModels[2].type, 'unchanged');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff markdown', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['This is a test notebook with only markdown cells', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['Lorem ipsum dolor sit amet', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['In other news', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], [
                ['This is a test notebook with markdown cells only', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['Lorem ipsum dolor sit amet', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['In the news', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 3);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'modified');
                assert.strictEqual(diffViewModels.viewModels[1].type, 'unchanged');
                assert.strictEqual(diffViewModels.viewModels[2].type, 'modified');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff insert', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], [
                ['var h = 8;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (model, disposables, accessor) => {
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffResult = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: {
                        changes: [{
                                originalStart: 0,
                                originalLength: 0,
                                modifiedStart: 0,
                                modifiedLength: 1
                            }],
                        quitEarly: false
                    }
                }, undefined);
                assert.strictEqual(diffResult.firstChangeIndex, 0);
                assert.strictEqual(diffResult.viewModels[0].type, 'insert');
                assert.strictEqual(diffResult.viewModels[1].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[2].type, 'unchanged');
                diffResult.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff insert 2', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var g = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], [
                ['var h = 8;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var g = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (model, disposables, accessor) => {
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffResult = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: {
                        changes: [{
                                originalStart: 0,
                                originalLength: 0,
                                modifiedStart: 0,
                                modifiedLength: 1
                            }, {
                                originalStart: 0,
                                originalLength: 6,
                                modifiedStart: 1,
                                modifiedLength: 6
                            }],
                        quitEarly: false
                    }
                }, undefined);
                assert.strictEqual(diffResult.firstChangeIndex, 0);
                assert.strictEqual(diffResult.viewModels[0].type, 'insert');
                assert.strictEqual(diffResult.viewModels[1].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[2].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[3].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[4].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[5].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[6].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[7].type, 'unchanged');
                diffResult.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff insert 3', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var g = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], [
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var h = 8;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var g = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (model, disposables, accessor) => {
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffResult = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: {
                        changes: [{
                                originalStart: 4,
                                originalLength: 0,
                                modifiedStart: 4,
                                modifiedLength: 1
                            }],
                        quitEarly: false
                    }
                }, undefined);
                // assert.strictEqual(diffResult.firstChangeIndex, 4);
                assert.strictEqual(diffResult.viewModels[0].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[1].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[2].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[3].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[4].type, 'insert');
                assert.strictEqual(diffResult.viewModels[5].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[6].type, 'unchanged');
                assert.strictEqual(diffResult.viewModels[7].type, 'unchanged');
                diffResult.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('LCS', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['# Description', 'markdown', notebookCommon_1.CellKind.Markup, [], { metadata: {} }],
                ['x = 3', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: true }, executionOrder: 1 }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 1 }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: false } }]
            ], [
                ['# Description', 'markdown', notebookCommon_1.CellKind.Markup, [], { metadata: {} }],
                ['x = 3', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: true }, executionOrder: 1 }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: false } }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 1 }]
            ], async (model) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 2,
                        originalLength: 0,
                        modifiedStart: 2,
                        modifiedLength: 1
                    }, {
                        originalStart: 3,
                        originalLength: 1,
                        modifiedStart: 4,
                        modifiedLength: 0
                    }]);
            });
        });
        test('LCS 2', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['# Description', 'markdown', notebookCommon_1.CellKind.Markup, [], { metadata: {} }],
                ['x = 3', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: true }, executionOrder: 1 }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 1 }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: false } }],
                ['x = 5', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([5])) }] }], {}],
            ], [
                ['# Description', 'markdown', notebookCommon_1.CellKind.Markup, [], { metadata: {} }],
                ['x = 3', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: true }, executionOrder: 1 }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [], { metadata: { collapsed: false } }],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 1 }],
                ['x = 5', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([5])) }] }], {}],
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (model) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                notebookDiffEditor_1.NotebookTextDiffEditor.prettyChanges(model, diffResult);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 2,
                        originalLength: 0,
                        modifiedStart: 2,
                        modifiedLength: 1
                    }, {
                        originalStart: 3,
                        originalLength: 1,
                        modifiedStart: 4,
                        modifiedLength: 0
                    }, {
                        originalStart: 5,
                        originalLength: 0,
                        modifiedStart: 5,
                        modifiedLength: 1
                    }, {
                        originalStart: 6,
                        originalLength: 1,
                        modifiedStart: 7,
                        modifiedLength: 0
                    }]);
            });
        });
        test('LCS 3', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var g = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], [
                ['var a = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var d = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var h = 8;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var e = 5;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var f = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var g = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (model) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                notebookDiffEditor_1.NotebookTextDiffEditor.prettyChanges(model, diffResult);
                assert.deepStrictEqual(diffResult.changes.map(change => ({
                    originalStart: change.originalStart,
                    originalLength: change.originalLength,
                    modifiedStart: change.modifiedStart,
                    modifiedLength: change.modifiedLength
                })), [{
                        originalStart: 4,
                        originalLength: 0,
                        modifiedStart: 4,
                        modifiedLength: 1
                    }]);
            });
        });
        test('diff output', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
                ['y', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([4])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
            ], [
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
                ['y', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([5])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 2);
                assert.strictEqual(diffViewModels.viewModels[0].type, 'unchanged');
                assert.strictEqual(diffViewModels.viewModels[0].checkIfOutputsModified(), false);
                assert.strictEqual(diffViewModels.viewModels[1].type, 'modified');
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
        test('diff output fast check', async () => {
            await (0, testNotebookEditor_1.withTestNotebookDiffModel)([
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
                ['y', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([4])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
            ], [
                ['x', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([3])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
                ['y', 'javascript', notebookCommon_1.CellKind.Code, [{ outputId: 'someOtherId', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.wrap(new Uint8Array([5])) }] }], { metadata: { collapsed: false }, executionOrder: 3 }],
            ], (model, disposables, accessor) => {
                const diff = new diff_1.LcsDiff(new CellSequence(model.original.notebook), new CellSequence(model.modified.notebook));
                const diffResult = diff.ComputeDiff(false);
                const eventDispatcher = disposables.add(new eventDispatcher_1.NotebookDiffEditorEventDispatcher());
                const diffViewModels = notebookDiffEditor_1.NotebookTextDiffEditor.computeDiff(accessor, configurationService, model, eventDispatcher, {
                    cellsDiff: diffResult
                }, undefined);
                assert.strictEqual(diffViewModels.viewModels.length, 2);
                assert.strictEqual(diffViewModels.viewModels[0].original.textModel.equal(diffViewModels.viewModels[0].modified.textModel), true);
                assert.strictEqual(diffViewModels.viewModels[1].original.textModel.equal(diffViewModels.viewModels[1].modified.textModel), false);
                diffViewModels.viewModels.forEach(vm => {
                    vm.original?.dispose();
                    vm.modified?.dispose();
                    vm.dispose();
                });
                model.original.notebook.dispose();
                model.modified.notebook.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0RpZmYudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxNQUFNLFlBQVk7UUFFakIsWUFBcUIsU0FBNkI7WUFBN0IsY0FBUyxHQUFULFNBQVMsQ0FBb0I7UUFDbEQsQ0FBQztRQUVELFdBQVc7WUFDVixNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RELFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2RCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixNQUFNLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztRQUM1RCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hDLE1BQU0sSUFBQSw4Q0FBeUIsRUFBQztnQkFDL0IsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsYUFBYSxF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QyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFO2dCQUNGLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUN6QyxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbURBQWlDLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRixNQUFNLFVBQVUsR0FBRywyQ0FBc0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUU7b0JBQzdHLFNBQVMsRUFBRTt3QkFDVixPQUFPLEVBQUUsQ0FBQztnQ0FDVCxhQUFhLEVBQUUsQ0FBQztnQ0FDaEIsY0FBYyxFQUFFLENBQUM7Z0NBQ2pCLGFBQWEsRUFBRSxDQUFDO2dDQUNoQixjQUFjLEVBQUUsQ0FBQzs2QkFDakIsRUFBRTtnQ0FDRixhQUFhLEVBQUUsQ0FBQztnQ0FDaEIsY0FBYyxFQUFFLENBQUM7Z0NBQ2pCLGFBQWEsRUFBRSxDQUFDO2dDQUNoQixjQUFjLEVBQUUsQ0FBQzs2QkFDakIsQ0FBQzt3QkFDRixTQUFTLEVBQUUsS0FBSztxQkFDaEI7aUJBQ0QsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFZCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFFL0QsVUFBVSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ2xDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBQ3ZCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBQ3ZCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQztnQkFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFF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RUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDcEUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hHLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxpQkFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDOUwsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO2FBQzFFLEVBQUU7Z0JBQ0YsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDcEUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hHLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxT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QUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUU7Z0JBQ0YsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNsQixNQUFNLElBQUksR0FBRyxJQUFJLGNBQU8sQ0FBQyxJQUFJLFlBQVks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