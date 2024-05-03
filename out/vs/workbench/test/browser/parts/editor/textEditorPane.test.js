/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/lifecycle", "vs/workbench/services/editor/browser/editorService", "vs/workbench/common/editor", "vs/base/common/async", "vs/workbench/browser/parts/editor/textEditor", "vs/editor/common/core/selection"], function (require, exports, assert, utils_1, editorService_1, workbenchTestServices_1, editorGroupsService_1, lifecycle_1, editorService_2, editor_1, async_1, textEditor_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextEditorPane', () => {
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        async function createServices() {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            return instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        }
        test('editor pane selection', async function () {
            const accessor = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            let pane = await accessor.editorService.openEditor({ resource });
            assert.ok(pane && (0, editor_1.isEditorPaneWithSelection)(pane));
            const onDidFireSelectionEventOfEditType = new async_1.DeferredPromise();
            disposables.add(pane.onDidChangeSelection(e => {
                if (e.reason === 3 /* EditorPaneSelectionChangeReason.EDIT */) {
                    onDidFireSelectionEventOfEditType.complete(e);
                }
            }));
            // Changing model reports selection change
            // of EDIT kind
            const model = disposables.add(await accessor.textFileService.files.resolve(resource));
            model.textEditorModel.setValue('Hello World');
            const event = await onDidFireSelectionEventOfEditType.p;
            assert.strictEqual(event.reason, 3 /* EditorPaneSelectionChangeReason.EDIT */);
            // getSelection() works and can be restored
            //
            // Note: this is a bit bogus because in tests our code editors have
            //       no view and no cursor can be set as such. So the selection
            //       will always report for the first line and column.
            pane.setSelection(new selection_1.Selection(1, 1, 1, 1), 2 /* EditorPaneSelectionChangeReason.USER */);
            const selection = pane.getSelection();
            assert.ok(selection);
            await pane.group.closeAllEditors();
            const options = selection.restore({});
            pane = await accessor.editorService.openEditor({ resource, options });
            assert.ok(pane && (0, editor_1.isEditorPaneWithSelection)(pane));
            const newSelection = pane.getSelection();
            assert.ok(newSelection);
            assert.strictEqual(newSelection.compare(selection), 1 /* EditorPaneSelectionCompareResult.IDENTICAL */);
            await model.revert();
            await pane.group.closeAllEditors();
        });
        test('TextEditorPaneSelection', function () {
            const sel1 = new textEditor_1.TextEditorPaneSelection(new selection_1.Selection(1, 1, 2, 2));
            const sel2 = new textEditor_1.TextEditorPaneSelection(new selection_1.Selection(5, 5, 6, 6));
            const sel3 = new textEditor_1.TextEditorPaneSelection(new selection_1.Selection(50, 50, 60, 60));
            const sel4 = { compare: () => { throw new Error(); }, restore: (options) => options };
            assert.strictEqual(sel1.compare(sel1), 1 /* EditorPaneSelectionCompareResult.IDENTICAL */);
            assert.strictEqual(sel1.compare(sel2), 2 /* EditorPaneSelectionCompareResult.SIMILAR */);
            assert.strictEqual(sel1.compare(sel3), 3 /* EditorPaneSelectionCompareResult.DIFFERENT */);
            assert.strictEqual(sel1.compare(sel4), 3 /* EditorPaneSelectionCompareResult.DIFFERENT */);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvclBhbmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvdGV4dEVkaXRvclBhbmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLDhDQUFzQixHQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLFVBQVUsY0FBYztZQUM1QixNQUFNLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRW5GLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSx3Q0FBZ0IsRUFBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN2RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFdEQsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkJBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXpELE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUFtQixDQUFDLENBQUM7UUFD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