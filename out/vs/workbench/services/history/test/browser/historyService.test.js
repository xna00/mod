/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/history/browser/historyService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/browser/editorService", "vs/base/common/lifecycle", "vs/workbench/services/history/common/history", "vs/base/common/async", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/platform/files/common/files", "vs/base/common/platform", "vs/editor/common/core/selection", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration"], function (require, exports, assert, utils_1, uri_1, workbenchTestServices_1, descriptors_1, editorGroupsService_1, historyService_1, editorService_1, editorService_2, lifecycle_1, history_1, async_1, event_1, editor_1, editorInput_1, files_1, platform_1, selection_1, testConfigurationService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('HistoryService', function () {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorHistory';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForHistoyService';
        async function createServices(scope = 0 /* GoScope.DEFAULT */) {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            if (scope === 1 /* GoScope.EDITOR_GROUP */) {
                configurationService.setUserConfiguration('workbench.editor.navigationScope', 'editorGroup');
            }
            else if (scope === 2 /* GoScope.EDITOR */) {
                configurationService.setUserConfiguration('workbench.editor.navigationScope', 'editor');
            }
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            const historyService = disposables.add(instantiationService.createInstance(historyService_1.HistoryService));
            instantiationService.stub(history_1.IHistoryService, historyService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            return [part, historyService, editorService, accessor.textFileService, instantiationService, configurationService];
        }
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput)]));
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        test('back / forward: basics', async () => {
            const [part, historyService] = await createServices();
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await historyService.goForward();
            assert.strictEqual(part.activeGroup.activeEditor, input2);
        });
        test('back / forward: is editor group aware', async function () {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/other.html');
            const pane1 = await editorService.openEditor({ resource, options: { pinned: true } });
            const pane2 = await editorService.openEditor({ resource, options: { pinned: true } }, editorService_1.SIDE_GROUP);
            // [index.txt] | [>index.txt<]
            assert.notStrictEqual(pane1, pane2);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } }, pane2?.group);
            // [index.txt] | [index.txt] [>other.html<]
            await historyService.goBack();
            // [index.txt] | [>index.txt<] [other.html]
            assert.strictEqual(part.activeGroup.id, pane2?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource.toString());
            await historyService.goBack();
            // [>index.txt<] | [index.txt] [other.html]
            assert.strictEqual(part.activeGroup.id, pane1?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource.toString());
            await historyService.goForward();
            // [index.txt] | [>index.txt<] [other.html]
            assert.strictEqual(part.activeGroup.id, pane2?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource.toString());
            await historyService.goForward();
            // [index.txt] | [index.txt] [>other.html<]
            assert.strictEqual(part.activeGroup.id, pane2?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), otherResource.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: in-editor text selection changes (user)', async function () {
            const [, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(1, 2, 1, 2));
            await setTextSelection(historyService, pane, new selection_1.Selection(15, 1, 15, 1)); // will be merged and dropped
            await setTextSelection(historyService, pane, new selection_1.Selection(16, 1, 16, 1)); // will be merged and dropped
            await setTextSelection(historyService, pane, new selection_1.Selection(17, 1, 17, 1));
            await setTextSelection(historyService, pane, new selection_1.Selection(30, 5, 30, 8));
            await setTextSelection(historyService, pane, new selection_1.Selection(40, 1, 40, 1));
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(30, 5, 30, 8), pane);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(17, 1, 17, 1), pane);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(1, 2, 1, 2), pane);
            await historyService.goForward(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(17, 1, 17, 1), pane);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: in-editor text selection changes (navigation)', async function () {
            const [, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10)); // this is our starting point
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 4 /* EditorPaneSelectionChangeReason.NAVIGATION */); // this is our first target definition
            await setTextSelection(historyService, pane, new selection_1.Selection(120, 8, 120, 18), 4 /* EditorPaneSelectionChangeReason.NAVIGATION */); // this is our second target definition
            await setTextSelection(historyService, pane, new selection_1.Selection(300, 3, 300, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(500, 3, 500, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(200, 3, 200, 20)); // unrelated user navigation
            await historyService.goBack(2 /* GoFilter.NAVIGATION */); // this should reveal the last navigation entry because we are not at it currently
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goForward(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: in-editor text selection changes (jump)', async function () {
            const [, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10), 2 /* EditorPaneSelectionChangeReason.USER */);
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 5 /* EditorPaneSelectionChangeReason.JUMP */);
            await setTextSelection(historyService, pane, new selection_1.Selection(120, 8, 120, 18), 5 /* EditorPaneSelectionChangeReason.JUMP */);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane);
            await historyService.goForward(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goLast(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: selection changes with JUMP or NAVIGATION source are not merged (#143833)', async function () {
            const [, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10), 2 /* EditorPaneSelectionChangeReason.USER */);
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 5 /* EditorPaneSelectionChangeReason.JUMP */);
            await setTextSelection(historyService, pane, new selection_1.Selection(6, 3, 6, 20), 4 /* EditorPaneSelectionChangeReason.NAVIGATION */);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: edit selection changes', async function () {
            const [, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10));
            await setTextSelection(historyService, pane, new selection_1.Selection(50, 3, 50, 20), 3 /* EditorPaneSelectionChangeReason.EDIT */);
            await setTextSelection(historyService, pane, new selection_1.Selection(300, 3, 300, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(500, 3, 500, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(200, 3, 200, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 3 /* EditorPaneSelectionChangeReason.EDIT */);
            await setTextSelection(historyService, pane, new selection_1.Selection(200, 3, 200, 20)); // unrelated user navigation
            await historyService.goBack(1 /* GoFilter.EDITS */); // this should reveal the last navigation entry because we are not at it currently
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(1 /* GoFilter.EDITS */);
            assertTextSelection(new selection_1.Selection(50, 3, 50, 20), pane);
            await historyService.goForward(1 /* GoFilter.EDITS */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        async function setTextSelection(historyService, pane, selection, reason = 2 /* EditorPaneSelectionChangeReason.USER */) {
            const promise = event_1.Event.toPromise(historyService.onDidChangeEditorNavigationStack);
            pane.setSelection(selection, reason);
            await promise;
        }
        function assertTextSelection(expected, pane) {
            const options = pane.options;
            if (!options) {
                assert.fail('EditorPane has no selection');
            }
            assert.strictEqual(options.selection?.startLineNumber, expected.startLineNumber);
            assert.strictEqual(options.selection?.startColumn, expected.startColumn);
            assert.strictEqual(options.selection?.endLineNumber, expected.endLineNumber);
            assert.strictEqual(options.selection?.endColumn, expected.endColumn);
        }
        test('back / forward: tracks editor moves across groups', async function () {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const pane1 = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            // [one.txt] [>two.html<]
            const sideGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            // [one.txt] [>two.html<] | <empty>
            const editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            pane1?.group.moveEditor(pane1.input, sideGroup);
            await editorChangePromise;
            // [one.txt] | [>two.html<]
            await historyService.goBack();
            // [>one.txt<] | [two.html]
            assert.strictEqual(part.activeGroup.id, pane1?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource1.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: tracks group removals', async function () {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const pane1 = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            const pane2 = await editorService.openEditor({ resource: resource2, options: { pinned: true } }, editorService_1.SIDE_GROUP);
            // [one.txt] | [>two.html<]
            assert.notStrictEqual(pane1, pane2);
            await pane1?.group.closeAllEditors();
            // [>two.html<]
            await historyService.goBack();
            // [>two.html<]
            assert.strictEqual(part.activeGroup.id, pane2?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource2.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: editor navigation stack - navigation', async function () {
            const [, , editorService, , instantiationService] = await createServices();
            const stack = instantiationService.createInstance(historyService_1.EditorNavigationStack, 0 /* GoFilter.NONE */, 0 /* GoScope.DEFAULT */);
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/index.html');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            let changed = false;
            disposables.add(stack.onDidChange(() => changed = true));
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoForward(), false);
            assert.strictEqual(stack.canGoLast(), false);
            // Opening our first editor emits change event
            stack.notifyNavigation(pane, { reason: 2 /* EditorPaneSelectionChangeReason.USER */ });
            assert.strictEqual(changed, true);
            changed = false;
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoLast(), true);
            // Opening same editor is not treated as new history stop
            stack.notifyNavigation(pane, { reason: 2 /* EditorPaneSelectionChangeReason.USER */ });
            assert.strictEqual(stack.canGoBack(), false);
            // Opening different editor allows to go back
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane, { reason: 2 /* EditorPaneSelectionChangeReason.USER */ });
            assert.strictEqual(changed, true);
            changed = false;
            assert.strictEqual(stack.canGoBack(), true);
            await stack.goBack();
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoForward(), true);
            assert.strictEqual(stack.canGoLast(), true);
            await stack.goForward();
            assert.strictEqual(stack.canGoBack(), true);
            assert.strictEqual(stack.canGoForward(), false);
            await stack.goPrevious();
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoForward(), true);
            await stack.goPrevious();
            assert.strictEqual(stack.canGoBack(), true);
            assert.strictEqual(stack.canGoForward(), false);
            await stack.goBack();
            await stack.goLast();
            assert.strictEqual(stack.canGoBack(), true);
            assert.strictEqual(stack.canGoForward(), false);
            stack.dispose();
            assert.strictEqual(stack.canGoBack(), false);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: editor navigation stack - mutations', async function () {
            const [, , editorService, , instantiationService] = await createServices();
            const stack = disposables.add(instantiationService.createInstance(historyService_1.EditorNavigationStack, 0 /* GoFilter.NONE */, 0 /* GoScope.DEFAULT */));
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/index.html');
            const unrelatedResource = utils_1.toResource.call(this, '/path/unrelated.html');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Clear
            assert.strictEqual(stack.canGoBack(), true);
            stack.clear();
            assert.strictEqual(stack.canGoBack(), false);
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove unrelated resource does not cause any harm (via internal event)
            await stack.goBack();
            assert.strictEqual(stack.canGoForward(), true);
            stack.remove(new files_1.FileOperationEvent(unrelatedResource, 1 /* FileOperation.DELETE */));
            assert.strictEqual(stack.canGoForward(), true);
            // Remove (via internal event)
            await stack.goForward();
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(new files_1.FileOperationEvent(resource, 1 /* FileOperation.DELETE */));
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via external event)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(new files_1.FileChangesEvent([{ resource, type: 2 /* FileChangeType.DELETED */ }], !platform_1.isLinux));
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via editor)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(pane.input);
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via group)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(pane.group.id);
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Move
            const stat = {
                ctime: 0,
                etag: '',
                mtime: 0,
                isDirectory: false,
                isFile: true,
                isSymbolicLink: false,
                name: 'other.txt',
                readonly: false,
                locked: false,
                size: 0,
                resource: utils_1.toResource.call(this, '/path/other.txt'),
                children: undefined
            };
            stack.move(new files_1.FileOperationEvent(resource, 2 /* FileOperation.MOVE */, stat));
            await stack.goBack();
            assert.strictEqual(pane?.input?.resource?.toString(), stat.resource.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: editor group scope', async function () {
            const [part, historyService, editorService, , instantiationService] = await createServices(1 /* GoScope.EDITOR_GROUP */);
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const resource3 = utils_1.toResource.call(this, '/path/three.html');
            const pane1 = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            await editorService.openEditor({ resource: resource3, options: { pinned: true } });
            // [one.txt] [two.html] [>three.html<]
            const sideGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            // [one.txt] [two.html] [>three.html<] | <empty>
            const pane2 = await editorService.openEditor({ resource: resource1, options: { pinned: true } }, sideGroup);
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            await editorService.openEditor({ resource: resource3, options: { pinned: true } });
            // [one.txt] [two.html] [>three.html<] | [one.txt] [two.html] [>three.html<]
            await historyService.goBack();
            await historyService.goBack();
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.id, pane2?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource1.toString());
            // [one.txt] [two.html] [>three.html<] | [>one.txt<] [two.html] [three.html]
            await editorService.openEditor({ resource: resource3, options: { pinned: true } }, pane1?.group);
            await historyService.goBack();
            await historyService.goBack();
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.id, pane1?.group.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource1.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('back / forward: editor  scope', async function () {
            const [part, historyService, editorService, , instantiationService] = await createServices(2 /* GoScope.EDITOR */);
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const pane = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10));
            await setTextSelection(historyService, pane, new selection_1.Selection(50, 3, 50, 20));
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(12, 2, 12, 10));
            await setTextSelection(historyService, pane, new selection_1.Selection(150, 3, 150, 20));
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(12, 2, 12, 10), pane);
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(12, 2, 12, 10), pane); // no change
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource2.toString());
            await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane);
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane); // no change
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), resource1.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('go to last edit location', async function () {
            const [, historyService, editorService, textFileService, instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/index.html');
            await editorService.openEditor({ resource });
            const model = await textFileService.files.resolve(resource);
            model.textEditorModel.setValue('Hello World');
            await (0, async_1.timeout)(10); // history debounces change events
            await editorService.openEditor({ resource: otherResource });
            const onDidActiveEditorChange = new async_1.DeferredPromise();
            disposables.add(editorService.onDidActiveEditorChange(e => {
                onDidActiveEditorChange.complete(e);
            }));
            historyService.goLast(1 /* GoFilter.EDITS */);
            await onDidActiveEditorChange.p;
            assert.strictEqual(editorService.activeEditor?.resource?.toString(), resource.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('reopen closed editor', async function () {
            const [, historyService, editorService, , instantiationService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource });
            await pane?.group.closeAllEditors();
            const onDidActiveEditorChange = new async_1.DeferredPromise();
            disposables.add(editorService.onDidActiveEditorChange(e => {
                onDidActiveEditorChange.complete(e);
            }));
            historyService.reopenLastClosedEditor();
            await onDidActiveEditorChange.p;
            assert.strictEqual(editorService.activeEditor?.resource?.toString(), resource.toString());
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('getHistory', async () => {
            class TestFileEditorInputWithUntyped extends workbenchTestServices_1.TestFileEditorInput {
                toUntyped() {
                    return {
                        resource: this.resource,
                        options: {
                            override: 'testOverride'
                        }
                    };
                }
            }
            const [part, historyService, , , instantiationService, configurationService] = await createServices();
            configurationService.setUserConfiguration('search.exclude', '{ "**/node_modules/**": true }');
            let history = historyService.getHistory();
            assert.strictEqual(history.length, 0);
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1/node_modules/test.txt'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input1, { pinned: true });
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input2, { pinned: true });
            const input3 = disposables.add(new TestFileEditorInputWithUntyped(uri_1.URI.parse('foo://bar3'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input3, { pinned: true });
            const input4 = disposables.add(new TestFileEditorInputWithUntyped(uri_1.URI.file('bar4'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input4, { pinned: true });
            history = historyService.getHistory();
            assert.strictEqual(history.length, 4);
            // first entry is untyped because it implements `toUntyped` and has a supported scheme
            assert.strictEqual((0, editor_1.isResourceEditorInput)(history[0]) && !(history[0] instanceof editorInput_1.EditorInput), true);
            assert.strictEqual(history[0].options?.override, 'testOverride');
            // second entry is not untyped even though it implements `toUntyped` but has unsupported scheme
            assert.strictEqual(history[1] instanceof editorInput_1.EditorInput, true);
            assert.strictEqual(history[2] instanceof editorInput_1.EditorInput, true);
            assert.strictEqual(history[3] instanceof editorInput_1.EditorInput, true);
            historyService.removeFromHistory(input2);
            history = historyService.getHistory();
            assert.strictEqual(history.length, 3);
            assert.strictEqual(history[0].resource?.toString(), input4.resource.toString());
            input1.dispose(); // disposing the editor will apply `search.exclude` rules
            history = historyService.getHistory();
            assert.strictEqual(history.length, 2);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('getLastActiveFile', async () => {
            const [part, historyService] = await createServices();
            assert.ok(!historyService.getLastActiveFile('foo'));
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input1, { pinned: true });
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(historyService.getLastActiveFile('foo')?.toString(), input2.resource.toString());
            assert.strictEqual(historyService.getLastActiveFile('foo', 'bar2')?.toString(), input2.resource.toString());
            assert.strictEqual(historyService.getLastActiveFile('foo', 'bar1')?.toString(), input1.resource.toString());
        });
        test('open next/previous recently used editor (single group)', async () => {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID));
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await part.activeGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor(part.activeGroup.id);
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor(part.activeGroup.id);
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('open next/previous recently used editor (multi group)', async () => {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const rootGroup = part.activeGroup;
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID));
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            const sideGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            await rootGroup.openEditor(input1, { pinned: true });
            await sideGroup.openEditor(input2, { pinned: true });
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(rootGroup.activeEditor, input1);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup, sideGroup);
            assert.strictEqual(sideGroup.activeEditor, input2);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('open next/previous recently is reset when other input opens', async () => {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID));
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            const input3 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar3'), TEST_EDITOR_INPUT_ID));
            const input4 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar4'), TEST_EDITOR_INPUT_ID));
            await part.activeGroup.openEditor(input1, { pinned: true });
            await part.activeGroup.openEditor(input2, { pinned: true });
            await part.activeGroup.openEditor(input3, { pinned: true });
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            await (0, async_1.timeout)(0);
            await part.activeGroup.openEditor(input4, { pinned: true });
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input4);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        test('transient editors suspends editor change tracking', async () => {
            const [part, historyService, editorService, , instantiationService] = await createServices();
            const input1 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID));
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID));
            const input3 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar3'), TEST_EDITOR_INPUT_ID));
            const input4 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar4'), TEST_EDITOR_INPUT_ID));
            const input5 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar5'), TEST_EDITOR_INPUT_ID));
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            await part.activeGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await editorChangePromise;
            await part.activeGroup.openEditor(input2, { transient: true });
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            await part.activeGroup.openEditor(input3, { transient: true });
            assert.strictEqual(part.activeGroup.activeEditor, input3);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange)
                .then(() => event_1.Event.toPromise(editorService.onDidActiveEditorChange));
            await part.activeGroup.openEditor(input4, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input4);
            await part.activeGroup.openEditor(input5, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input5);
            // stack should be [input1, input4, input5]
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.activeEditor, input4);
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await historyService.goForward();
            assert.strictEqual(part.activeGroup.activeEditor, input4);
            await historyService.goForward();
            assert.strictEqual(part.activeGroup.activeEditor, input5);
            return (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2hpc3RvcnkvdGVzdC9icm93c2VyL2hpc3RvcnlTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0QmhHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtRQUV2QixNQUFNLGNBQWMsR0FBRyw4QkFBOEIsQ0FBQztRQUN0RCxNQUFNLG9CQUFvQixHQUFHLGlDQUFpQyxDQUFDO1FBRS9ELEtBQUssVUFBVSxjQUFjLENBQUMsS0FBSywwQkFBa0I7WUFDcEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVuRixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsd0NBQWdCLEVBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDBDQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXRELE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZCQUFhLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUV6RCxNQUFNLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUM1RCxJQUFJLEtBQUssaUNBQXlCLEVBQUUsQ0FBQztnQkFDcEMsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDOUYsQ0FBQztpQkFBTSxJQUFJLEtBQUssMkJBQW1CLEVBQUUsQ0FBQztnQkFDckMsb0JB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Q0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFNUMsTUFBTSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsTUFBTSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDekIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFL0MsTUFBTSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDekIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsTUFBTSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckIsTUFBTSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFF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QUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFMUQsSUFBSSxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2pGLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzFDLE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzdFLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQzVDLE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzdFLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdELE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzdFLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxPQUFPLElBQUEseUNBQWlCLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN4RSxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsQUFBRCxFQUFHLG9CQUFvQixDQUFDLEdBQUcsTUFBTSxjQUFjLEVBQUUsQ0FBQztZQUM3RixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBRW5DLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQ0FBbUIsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMkNBQW1CLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFFdkcsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLCtCQUF1QixDQUFDO1lBRWpFLE1BQU0sU0FBUyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNyRCxNQUFNLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFckQsSUFBSSxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2pGLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzFDLE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVuRCxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzdFLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQzVDLE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVuRCxPQUFPLElBQUEseUNBQWlCLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5RSxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsQUFBRCxFQUFHLG9CQUFvQixDQUFDLEdBQUcsTUFBTSxjQUFjLEVBQUUsQ0FBQztZQUU3RixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMkNBQW1CLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDdkcsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJDQUFtQixDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQ0FBbUIsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMkNBQW1CLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFFdkcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFNUQsSUFBSSxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2pGLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzFDLE1BQU0sbUJBQW1CLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFNUQsbUJBQW1CLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM3RSxjQUFjLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUMxQyxNQUFNLG1CQUFtQixDQUFDO1lBQzFCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFMUQsbUJBQW1CLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM3RSxjQUFjLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUM1QyxNQUFNLG1CQUFtQixDQUFDO1lBQzFCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFMUQsT0FBTyxJQUFBLHlDQUFpQixFQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDcEUsTUFBTSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLEFBQUQsRUFBRyxvQkFBb0IsQ0FBQyxHQUFHLE1BQU0sY0FBYyxFQUFFLENBQUM7WUFFN0YsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJDQUFtQixDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQ0FBbUIsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMkNBQW1CLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDdkcsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJDQUFtQixDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQ0FBbUIsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUV2RyxJQUFJLG1CQUFtQixHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDakYsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFELE1BQU0sbUJBQW1CLENBQUM7WUFFMUIsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxtQkFBbUIsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQztpQkFDMUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUVyRSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUQsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTFELDJDQUEyQztZQUMzQyxNQUFNLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFELE1BQU0sY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUQsTUFBTSxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDOUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUxRCxNQUFNLGNBQWMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFELE1BQU0sY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFMUQsT0FBTyxJQUFBLHlDQUFpQixFQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==