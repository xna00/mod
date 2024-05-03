/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/editor/common/editor", "vs/base/common/uri", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/modesRegistry", "vs/base/test/common/utils"], function (require, exports, assert, editor_1, uri_1, event_1, editor_2, workbenchTestServices_1, editorService_1, editorGroupsService_1, editorService_2, descriptors_1, fileEditorInput_1, async_1, files_1, lifecycle_1, mockKeybindingService_1, editorResolverService_1, sideBySideEditorInput_1, editorPlaceholder_1, testConfigurationService_1, configuration_1, modesRegistry_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorService', () => {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorService';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorService';
        const disposables = new lifecycle_1.DisposableStore();
        let testLocalInstantiationService = undefined;
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput), new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestSingletonFileEditorInput)], TEST_EDITOR_INPUT_ID));
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestSideBySideEditor)());
        });
        teardown(async () => {
            if (testLocalInstantiationService) {
                await (0, workbenchTestServices_1.workbenchTeardown)(testLocalInstantiationService);
                testLocalInstantiationService = undefined;
            }
            disposables.clear();
        });
        async function createEditorService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_1.EditorService, undefined));
            instantiationService.stub(editorService_2.IEditorService, editorService);
            testLocalInstantiationService = instantiationService;
            return [part, editorService, instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor)];
        }
        function createTestFileEditorInput(resource, typeId) {
            return disposables.add(new workbenchTestServices_1.TestFileEditorInput(resource, typeId));
        }
        test('openEditor() - basics', async () => {
            const [, service, accessor] = await createEditorService();
            await testOpenBasics(service, accessor.editorPaneService);
        });
        test('openEditor() - basics (scoped)', async () => {
            const [part, service, accessor] = await createEditorService();
            const scoped = service.createScoped('main', disposables);
            await part.whenReady;
            await testOpenBasics(scoped, accessor.editorPaneService);
        });
        async function testOpenBasics(editorService, editorPaneService) {
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventCounter = 0;
            disposables.add(editorService.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            }));
            let visibleEditorChangeEventCounter = 0;
            disposables.add(editorService.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            }));
            let willOpenEditorListenerCounter = 0;
            disposables.add(editorService.onWillOpenEditor(() => {
                willOpenEditorListenerCounter++;
            }));
            let didCloseEditorListenerCounter = 0;
            disposables.add(editorService.onDidCloseEditor(() => {
                didCloseEditorListenerCounter++;
            }));
            let willInstantiateEditorPaneListenerCounter = 0;
            disposables.add(editorPaneService.onWillInstantiateEditorPane(e => {
                if (e.typeId === TEST_EDITOR_ID) {
                    willInstantiateEditorPaneListenerCounter++;
                }
            }));
            // Open input
            let editor = await editorService.openEditor(input, { pinned: true });
            assert.strictEqual(editor?.getId(), TEST_EDITOR_ID);
            assert.strictEqual(editor, editorService.activeEditorPane);
            assert.strictEqual(1, editorService.count);
            assert.strictEqual(input, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].editor);
            assert.strictEqual(input, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].editor);
            assert.strictEqual(input, editorService.activeEditor);
            assert.strictEqual(editorService.visibleEditorPanes.length, 1);
            assert.strictEqual(editorService.visibleEditorPanes[0], editor);
            assert.ok(!editorService.activeTextEditorControl);
            assert.ok(!editorService.activeTextEditorLanguageId);
            assert.strictEqual(editorService.visibleTextEditorControls.length, 0);
            assert.strictEqual(editorService.isOpened(input), true);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: input.typeId, editorId: 'unknownTypeId' }), false);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: 'unknownTypeId', editorId: input.editorId }), false);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: 'unknownTypeId', editorId: 'unknownTypeId' }), false);
            assert.strictEqual(editorService.isVisible(input), true);
            assert.strictEqual(editorService.isVisible(otherInput), false);
            assert.strictEqual(willOpenEditorListenerCounter, 1);
            assert.strictEqual(activeEditorChangeEventCounter, 1);
            assert.strictEqual(visibleEditorChangeEventCounter, 1);
            assert.ok(editorPaneService.didInstantiateEditorPane(TEST_EDITOR_ID));
            assert.strictEqual(willInstantiateEditorPaneListenerCounter, 1);
            // Close input
            await editor?.group.closeEditor(input);
            assert.strictEqual(0, editorService.count);
            assert.strictEqual(0, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length);
            assert.strictEqual(0, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length);
            assert.strictEqual(didCloseEditorListenerCounter, 1);
            assert.strictEqual(activeEditorChangeEventCounter, 2);
            assert.strictEqual(visibleEditorChangeEventCounter, 2);
            assert.ok(input.gotDisposed);
            // Open again 2 inputs (disposed editors are ignored!)
            await editorService.openEditor(input, { pinned: true });
            assert.strictEqual(0, editorService.count);
            // Open again 2 inputs (recreate because disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            await editorService.openEditor(input, { pinned: true });
            editor = await editorService.openEditor(otherInput, { pinned: true });
            assert.strictEqual(2, editorService.count);
            assert.strictEqual(otherInput, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].editor);
            assert.strictEqual(input, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].editor);
            assert.strictEqual(input, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].editor);
            assert.strictEqual(otherInput, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1].editor);
            assert.strictEqual(editorService.visibleEditorPanes.length, 1);
            assert.strictEqual(editorService.isOpened(input), true);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(editorService.isOpened(otherInput), true);
            assert.strictEqual(editorService.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            assert.strictEqual(activeEditorChangeEventCounter, 4);
            assert.strictEqual(willOpenEditorListenerCounter, 3);
            assert.strictEqual(visibleEditorChangeEventCounter, 4);
            const stickyInput = createTestFileEditorInput(uri_1.URI.parse('my://resource3-basics'), TEST_EDITOR_INPUT_ID);
            await editorService.openEditor(stickyInput, { sticky: true });
            assert.strictEqual(3, editorService.count);
            const allSequentialEditors = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            assert.strictEqual(allSequentialEditors.length, 3);
            assert.strictEqual(stickyInput, allSequentialEditors[0].editor);
            assert.strictEqual(input, allSequentialEditors[1].editor);
            assert.strictEqual(otherInput, allSequentialEditors[2].editor);
            const sequentialEditorsExcludingSticky = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true });
            assert.strictEqual(sequentialEditorsExcludingSticky.length, 2);
            assert.strictEqual(input, sequentialEditorsExcludingSticky[0].editor);
            assert.strictEqual(otherInput, sequentialEditorsExcludingSticky[1].editor);
            const mruEditorsExcludingSticky = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true });
            assert.strictEqual(mruEditorsExcludingSticky.length, 2);
            assert.strictEqual(input, sequentialEditorsExcludingSticky[0].editor);
            assert.strictEqual(otherInput, sequentialEditorsExcludingSticky[1].editor);
        }
        test('openEditor() - multiple calls are cancelled and indicated as such', async () => {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventCounter = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            });
            let visibleEditorChangeEventCounter = 0;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            });
            const editorP1 = service.openEditor(input, { pinned: true });
            const editorP2 = service.openEditor(otherInput, { pinned: true });
            const editor1 = await editorP1;
            assert.strictEqual(editor1, undefined);
            const editor2 = await editorP2;
            assert.strictEqual(editor2?.input, otherInput);
            assert.strictEqual(activeEditorChangeEventCounter, 1);
            assert.strictEqual(visibleEditorChangeEventCounter, 1);
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('openEditor() - same input does not cancel previous one - https://github.com/microsoft/vscode/issues/136684', async () => {
            const [, service] = await createEditorService();
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let editorP1 = service.openEditor(input, { pinned: true });
            let editorP2 = service.openEditor(input, { pinned: true });
            let editor1 = await editorP1;
            assert.strictEqual(editor1?.input, input);
            let editor2 = await editorP2;
            assert.strictEqual(editor2?.input, input);
            assert.ok(editor2.group);
            await editor2.group.closeAllEditors();
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            const inputSame = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            editorP1 = service.openEditor(input, { pinned: true });
            editorP2 = service.openEditor(inputSame, { pinned: true });
            editor1 = await editorP1;
            assert.strictEqual(editor1?.input, input);
            editor2 = await editorP2;
            assert.strictEqual(editor2?.input, input);
        });
        test('openEditor() - singleton typed editors reveal instead of split', async () => {
            const [part, service] = await createEditorService();
            const input1 = disposables.add(new workbenchTestServices_1.TestSingletonFileEditorInput(uri_1.URI.parse('my://resource-basics1'), TEST_EDITOR_INPUT_ID));
            const input2 = disposables.add(new workbenchTestServices_1.TestSingletonFileEditorInput(uri_1.URI.parse('my://resource-basics2'), TEST_EDITOR_INPUT_ID));
            const input1Group = (await service.openEditor(input1, { pinned: true }))?.group;
            const input2Group = (await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP))?.group;
            assert.strictEqual(part.activeGroup, input2Group);
            await service.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup, input1Group);
        });
        test('openEditor() - locked groups', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input5 = { resource: uri_1.URI.parse('file://resource5-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input6 = { resource: uri_1.URI.parse('file://resource6-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input7 = { resource: uri_1.URI.parse('file://resource7-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const editor1 = await service.openEditor(input1, { pinned: true });
            const editor2 = await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP);
            const group1 = editor1?.group;
            assert.strictEqual(group1?.count, 1);
            const group2 = editor2?.group;
            assert.strictEqual(group2?.count, 1);
            group2.lock(true);
            part.activateGroup(group2.id);
            // Will open in group 1 because group 2 is locked
            await service.openEditor(input3, { pinned: true });
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group1.activeEditor?.resource?.toString(), input3.resource.toString());
            assert.strictEqual(group2.count, 1);
            // Will open in group 2 because group was provided
            await service.openEditor(input3, { pinned: true }, group2.id);
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group2.count, 2);
            assert.strictEqual(group2.activeEditor?.resource?.toString(), input3.resource.toString());
            // Will reveal editor in group 2 because it is contained
            await service.openEditor(input2, { pinned: true }, group2);
            await service.openEditor(input2, { pinned: true }, editorService_2.ACTIVE_GROUP);
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group2.count, 2);
            assert.strictEqual(group2.activeEditor?.resource?.toString(), input2.resource.toString());
            // Will open a new group because side group is locked
            part.activateGroup(group1.id);
            const editor3 = await service.openEditor(input4, { pinned: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.count, 3);
            const group3 = editor3?.group;
            assert.strictEqual(group3?.count, 1);
            // Will reveal editor in group 2 because it is contained
            await service.openEditor(input3, { pinned: true }, group2);
            part.activateGroup(group1.id);
            await service.openEditor(input3, { pinned: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.count, 3);
            // Will open a new group if all groups are locked
            group1.lock(true);
            group2.lock(true);
            group3.lock(true);
            part.activateGroup(group1.id);
            const editor5 = await service.openEditor(input5, { pinned: true });
            const group4 = editor5?.group;
            assert.strictEqual(group4?.count, 1);
            assert.strictEqual(group4.activeEditor?.resource?.toString(), input5.resource.toString());
            assert.strictEqual(part.count, 4);
            // Will open editor in most recently non-locked group
            group1.lock(false);
            group2.lock(false);
            group3.lock(false);
            group4.lock(false);
            part.activateGroup(group3.id);
            part.activateGroup(group2.id);
            part.activateGroup(group4.id);
            group4.lock(true);
            group2.lock(true);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            // Will find the right group where editor is already opened in when all groups are locked
            group1.lock(true);
            group2.lock(true);
            group3.lock(true);
            group4.lock(true);
            part.activateGroup(group1.id);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            part.activateGroup(group1.id);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            // Will reveal an opened editor in the active locked group
            await service.openEditor(input7, { pinned: true }, group3);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
        });
        test('locked groups - workbench.editor.revealIfOpen', async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('workbench', { 'editor': { 'revealIfOpen': true } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService(instantiationService);
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor(input1);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input1.resource.toString());
            await service.openEditor(input3);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input3.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('locked groups - revealIfVisible', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor({ ...input2, options: { ...input2.options, revealIfVisible: true } });
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input2.resource.toString());
            await service.openEditor({ ...input4, options: { ...input4.options, revealIfVisible: true } });
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input4.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('locked groups - revealIfOpened', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor({ ...input1, options: { ...input1.options, revealIfOpened: true } });
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input1.resource.toString());
            await service.openEditor({ ...input3, options: { ...input3.options, revealIfOpened: true } });
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input3.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('openEditor() - untyped, typed', () => {
            return testOpenEditors(false);
        });
        test('openEditors() - untyped, typed', () => {
            return testOpenEditors(true);
        });
        async function testOpenEditors(useOpenEditors) {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            let rootGroup = part.activeGroup;
            let editorFactoryCalled = 0;
            let untitledEditorFactoryCalled = 0;
            let diffEditorFactoryCalled = 0;
            let lastEditorFactoryEditor = undefined;
            let lastUntitledEditorFactoryEditor = undefined;
            let lastDiffEditorFactoryEditor = undefined;
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-override-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => {
                    editorFactoryCalled++;
                    lastEditorFactoryEditor = editor;
                    return { editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) };
                },
                createUntitledEditorInput: untitledEditor => {
                    untitledEditorFactoryCalled++;
                    lastUntitledEditorFactoryEditor = untitledEditor;
                    return { editor: createTestFileEditorInput(untitledEditor.resource ?? uri_1.URI.parse(`untitled://my-untitled-editor-${untitledEditorFactoryCalled}`), TEST_EDITOR_INPUT_ID) };
                },
                createDiffEditorInput: diffEditor => {
                    diffEditorFactoryCalled++;
                    lastDiffEditorFactoryEditor = diffEditor;
                    return { editor: createTestFileEditorInput(uri_1.URI.file(`diff-editor-${diffEditorFactoryCalled}`), TEST_EDITOR_INPUT_ID) };
                }
            }));
            async function resetTestState() {
                editorFactoryCalled = 0;
                untitledEditorFactoryCalled = 0;
                diffEditorFactoryCalled = 0;
                lastEditorFactoryEditor = undefined;
                lastUntitledEditorFactoryEditor = undefined;
                lastDiffEditorFactoryEditor = undefined;
                await (0, workbenchTestServices_1.workbenchTeardown)(accessor.instantiationService);
                rootGroup = part.activeGroup;
            }
            async function openEditor(editor, group) {
                if (useOpenEditors) {
                    // The type safety isn't super good here, so we assist with runtime checks
                    // Open editors expects untyped or editor input with options, you cannot pass a typed editor input
                    // without options
                    if (!(0, editor_2.isEditorInputWithOptions)(editor) && (0, editor_2.isEditorInput)(editor)) {
                        editor = { editor: editor, options: {} };
                    }
                    const panes = await service.openEditors([editor], group);
                    return panes[0];
                }
                if ((0, editor_2.isEditorInputWithOptions)(editor)) {
                    return service.openEditor(editor.editor, editor.options, group);
                }
                return service.openEditor(editor, group);
            }
            // untyped
            {
                // untyped resource editor, no options, no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests') };
                    const pane = await openEditor(untypedEditor);
                    let typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    // replaceEditors should work too
                    const untypedEditorReplacement = { resource: uri_1.URI.file('file-replaced.editor-service-override-tests') };
                    await service.replaceEditors([{
                            editor: typedEditor,
                            replacement: untypedEditorReplacement
                        }], rootGroup);
                    typedEditor = rootGroup.activeEditor;
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor?.resource?.toString(), untypedEditorReplacement.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 3);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditorReplacement);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override text), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor);
                    const typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(typedEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override text, sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true, override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, options (override default), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override: TEST_EDITOR_INPUT_ID), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(lastEditorFactoryEditor.options?.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, options (override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(lastEditorFactoryEditor.options?.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, no options, SIDE_GROUP
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests') };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override text), SIDE_GROUP
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Typed
            {
                // typed editor, no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor });
                    let typedInput = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditor.resource.toString());
                    // It's a typed editor input so the resolver should not have been called
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(typedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedInput);
                    // replaceEditors should work too
                    const typedEditorReplacement = createTestFileEditorInput(uri_1.URI.file('file-replaced.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    await service.replaceEditors([{
                            editor: typedEditor,
                            replacement: typedEditorReplacement
                        }], rootGroup);
                    typedInput = rootGroup.activeEditor;
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditorReplacement.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor });
                    const typedInput = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(typedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // typed editor, options (no override, sticky: true, preserveFocus: true), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, options (override default), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } });
                    assert.strictEqual(pane?.group, rootGroup);
                    // We shouldn't have resolved because it is a typed editor, even though we have an override specified
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (override: TEST_EDITOR_INPUT_ID), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { override: TEST_EDITOR_INPUT_ID } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (sticky: true, preserveFocus: true), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, options (override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, no options, SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (no override), SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Untyped untitled
            {
                // untyped untitled editor, no options, no group
                {
                    const untypedEditor = { resource: undefined, options: { override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped untitled editor, no options, SIDE_GROUP
                {
                    const untypedEditor = { resource: undefined, options: { override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped untitled editor with associated resource, no options, no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file-original.editor-service-override-tests').with({ scheme: 'untitled' }) };
                    const pane = await openEditor(untypedEditor);
                    const typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // untyped untitled editor, options (sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: undefined, options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor.options?.preserveFocus, true);
                    assert.strictEqual(lastUntitledEditorFactoryEditor.options?.sticky, true);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Untyped diff
            {
                // untyped diff editor, no options, no group
                {
                    const untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: { override: TEST_EDITOR_INPUT_ID }
                    };
                    const pane = await openEditor(untypedEditor);
                    const typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    await resetTestState();
                }
                // untyped diff editor, no options, SIDE_GROUP
                {
                    const untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: { override: TEST_EDITOR_INPUT_ID }
                    };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    await resetTestState();
                }
                // untyped diff editor, options (sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: {
                            override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true
                        }
                    };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor.options?.preserveFocus, true);
                    assert.strictEqual(lastDiffEditorFactoryEditor.options?.sticky, true);
                    await resetTestState();
                }
            }
            // typed editor, not registered
            {
                // no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // no options, SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // typed editor, not supporting `toUntyped`
            {
                // no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    typedEditor.disableToUntyped = true;
                    const pane = await openEditor({ editor: typedEditor });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // no options, SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    typedEditor.disableToUntyped = true;
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // openEditors with >1 editor
            if (useOpenEditors) {
                // mix of untyped and typed editors
                {
                    const untypedEditor1 = { resource: uri_1.URI.file('file1.editor-service-override-tests') };
                    const untypedEditor2 = { resource: uri_1.URI.file('file2.editor-service-override-tests') };
                    const untypedEditor3 = { editor: createTestFileEditorInput(uri_1.URI.file('file3.editor-service-override-tests'), TEST_EDITOR_INPUT_ID) };
                    const untypedEditor4 = { editor: createTestFileEditorInput(uri_1.URI.file('file4.editor-service-override-tests'), TEST_EDITOR_INPUT_ID) };
                    const untypedEditor5 = { resource: uri_1.URI.file('file5.editor-service-override-tests') };
                    const pane = (await service.openEditors([untypedEditor1, untypedEditor2, untypedEditor3, untypedEditor4, untypedEditor5]))[0];
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.strictEqual(pane?.group.count, 5);
                    // Only the untyped editors should have had factories called (3 untyped editors)
                    assert.strictEqual(editorFactoryCalled, 3);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // untyped default editor
            {
                // untyped default editor, options: revealIfVisible
                {
                    const untypedEditor1 = { resource: uri_1.URI.file('file-1'), options: { revealIfVisible: true, pinned: true } };
                    const untypedEditor2 = { resource: uri_1.URI.file('file-2'), options: { pinned: true } };
                    const rootPane = await openEditor(untypedEditor1);
                    const sidePane = await openEditor(untypedEditor2, editorService_2.SIDE_GROUP);
                    assert.strictEqual(rootPane?.group.count, 1);
                    assert.strictEqual(sidePane?.group.count, 1);
                    accessor.editorGroupService.activateGroup(sidePane.group);
                    await openEditor(untypedEditor1);
                    assert.strictEqual(rootPane?.group.count, 1);
                    assert.strictEqual(sidePane?.group.count, 1);
                    await resetTestState();
                }
                // untyped default editor, options: revealIfOpened
                {
                    const untypedEditor1 = { resource: uri_1.URI.file('file-1'), options: { revealIfOpened: true, pinned: true } };
                    const untypedEditor2 = { resource: uri_1.URI.file('file-2'), options: { pinned: true } };
                    const rootPane = await openEditor(untypedEditor1);
                    await openEditor(untypedEditor2);
                    assert.strictEqual(rootPane?.group.activeEditor?.resource?.toString(), untypedEditor2.resource.toString());
                    const sidePane = await openEditor(untypedEditor2, editorService_2.SIDE_GROUP);
                    assert.strictEqual(rootPane?.group.count, 2);
                    assert.strictEqual(sidePane?.group.count, 1);
                    accessor.editorGroupService.activateGroup(sidePane.group);
                    await openEditor(untypedEditor1);
                    assert.strictEqual(rootPane?.group.count, 2);
                    assert.strictEqual(sidePane?.group.count, 1);
                    await resetTestState();
                }
            }
        }
        test('openEditor() applies options if editor already opened', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-override-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            // Typed editor
            let pane = await service.openEditor(createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID));
            pane = await service.openEditor(createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID), { sticky: true, preserveFocus: true });
            assert.strictEqual(pane?.options?.sticky, true);
            assert.strictEqual(pane?.options?.preserveFocus, true);
            await pane.group.closeAllEditors();
            // Untyped editor (without registered editor)
            pane = await service.openEditor({ resource: uri_1.URI.file('resource-openEditors') });
            pane = await service.openEditor({ resource: uri_1.URI.file('resource-openEditors'), options: { sticky: true, preserveFocus: true } });
            assert.ok(pane instanceof workbenchTestServices_1.TestTextFileEditor);
            assert.strictEqual(pane?.options?.sticky, true);
            assert.strictEqual(pane?.options?.preserveFocus, true);
            // Untyped editor (with registered editor)
            pane = await service.openEditor({ resource: uri_1.URI.file('file.editor-service-override-tests') });
            pane = await service.openEditor({ resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true } });
            assert.strictEqual(pane?.options?.sticky, true);
            assert.strictEqual(pane?.options?.preserveFocus, true);
        });
        test('isOpen() with side by side editor', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('sideBySide', '', input, otherInput, service);
            const editor1 = await service.openEditor(sideBySideInput, { pinned: true });
            assert.strictEqual(part.activeGroup.count, 1);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            const editor2 = await service.openEditor(input, { pinned: true });
            assert.strictEqual(part.activeGroup.count, 2);
            assert.strictEqual(service.isOpened(input), true);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            await editor2?.group.closeEditor(input);
            assert.strictEqual(part.activeGroup.count, 1);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            await editor1?.group.closeEditor(sideBySideInput);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), false);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), false);
        });
        test('openEditors() / replaceEditors()', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const replaceInput = createTestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Replace editors
            await service.replaceEditors([{ editor: input, replacement: replaceInput }], part.activeGroup);
            assert.strictEqual(part.activeGroup.count, 2);
            assert.strictEqual(part.activeGroup.getIndexOfEditor(replaceInput), 0);
        });
        test('openEditors() handles workspace trust (typed editors)', async () => {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openEditors'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            const input4 = createTestFileEditorInput(uri_1.URI.parse('my://resource4-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('side by side', undefined, input3, input4, service);
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                // Trust: cancel
                let trustEditorUris = [];
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => {
                    trustEditorUris = uris;
                    return 3 /* WorkspaceTrustUriResponse.Cancel */;
                };
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 0);
                assert.strictEqual(trustEditorUris.length, 4);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input1.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input2.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input3.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input4.resource.toString()), true);
                // Trust: open in new window
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */;
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 0);
                // Trust: allow
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 1 /* WorkspaceTrustUriResponse.Open */;
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 3);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('openEditors() ignores trust when `validateTrust: false', async () => {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openEditors'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            const input4 = createTestFileEditorInput(uri_1.URI.parse('my://resource4-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('side by side', undefined, input3, input4, service);
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                // Trust: cancel
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 3 /* WorkspaceTrustUriResponse.Cancel */;
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }]);
                assert.strictEqual(part.activeGroup.count, 3);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('openEditors() extracts proper resources from untyped editors for workspace trust', async () => {
            const [, service, accessor] = await createEditorService();
            const input = { resource: uri_1.URI.file('resource-openEditors') };
            const otherInput = {
                original: { resource: uri_1.URI.parse('my://resource2-openEditors') },
                modified: { resource: uri_1.URI.parse('my://resource3-openEditors') }
            };
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                let trustEditorUris = [];
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => {
                    trustEditorUris = uris;
                    return oldHandler(uris);
                };
                await service.openEditors([input, otherInput], undefined, { validateTrust: true });
                assert.strictEqual(trustEditorUris.length, 3);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === otherInput.original.resource?.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === otherInput.modified.resource?.toString()), true);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('close editor does not dispose when editor opened in other group', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-close1'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            // Open input
            await service.openEditor(input, { pinned: true });
            await service.openEditor(input, { pinned: true }, rightGroup);
            const editors = service.editors;
            assert.strictEqual(editors.length, 2);
            assert.strictEqual(editors[0], input);
            assert.strictEqual(editors[1], input);
            // Close input
            await rootGroup.closeEditor(input);
            assert.strictEqual(input.isDisposed(), false);
            await rightGroup.closeEditor(input);
            assert.strictEqual(input.isDisposed(), true);
        });
        test('open to the side', async () => {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input1, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(part.count, 2);
            assert.strictEqual(editor?.group, part.groups[1]);
            assert.strictEqual(service.isVisible(input1), true);
            assert.strictEqual(service.isOpened(input1), true);
            // Open to the side uses existing neighbour group if any
            editor = await service.openEditor(input2, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(part.count, 2);
            assert.strictEqual(editor?.group, part.groups[1]);
            assert.strictEqual(service.isVisible(input2), true);
            assert.strictEqual(service.isOpened(input2), true);
        });
        test('editor group activation', async () => {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input2, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, editorService_2.SIDE_GROUP);
            const sideGroup = editor?.group;
            assert.strictEqual(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.PRESERVE }, rootGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, rootGroup);
            assert.strictEqual(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.PRESERVE }, sideGroup);
            assert.strictEqual(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.ACTIVATE }, sideGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
            part.arrangeGroups(1 /* GroupsArrangement.EXPAND */);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.RESTORE }, rootGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
        });
        test('inactive editor group does not activate when closing editor (#117686)', async () => {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            await service.openEditor(input2, { pinned: true }, rootGroup);
            const sideGroup = (await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP))?.group;
            assert.strictEqual(part.activeGroup, sideGroup);
            assert.notStrictEqual(rootGroup, sideGroup);
            part.arrangeGroups(1 /* GroupsArrangement.EXPAND */, part.activeGroup);
            await rootGroup.closeEditor(input2);
            assert.strictEqual(part.activeGroup, sideGroup);
            assert(!part.isGroupExpanded(rootGroup));
            assert(part.isGroupExpanded(part.activeGroup));
        });
        test('active editor change / visible editor change events', async function () {
            const [part, service] = await createEditorService();
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventFired = false;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventFired = true;
            });
            let visibleEditorChangeEventFired = false;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventFired = true;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.strictEqual(activeEditorChangeEventFired, expected, `Unexpected active editor change state (got ${activeEditorChangeEventFired}, expected ${expected})`);
                activeEditorChangeEventFired = false;
            }
            function assertVisibleEditorsChangedEvent(expected) {
                assert.strictEqual(visibleEditorChangeEventFired, expected, `Unexpected visible editors change state (got ${visibleEditorChangeEventFired}, expected ${expected})`);
                visibleEditorChangeEventFired = false;
            }
            async function closeEditorAndWaitForNextToOpen(group, input) {
                await group.closeEditor(input);
                await (0, async_1.timeout)(0); // closing an editor will not immediately open the next one, so we need to wait
            }
            // 1.) open, open same, open other, close
            let editor = await service.openEditor(input, { pinned: true });
            const group = editor?.group;
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            editor = await service.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 2.) open, open same (forced open) (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input, { forceReload: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, input);
            // 3.) open, open inactive, close (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 4.) open, open inactive, close inactive (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 5.) add group, remove group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            let rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            rightGroup.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            part.removeGroup(rightGroup);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 6.) open editor in inactive group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 7.) activate group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 8.) move editor (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.moveEditor(otherInput, group, { index: 0 });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 9.) close editor in inactive group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            // cleanup
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('editors change event', async function () {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            let editorsChangeEventCounter = 0;
            async function assertEditorsChangeEvent(fn, expected) {
                const p = event_1.Event.toPromise(service.onDidEditorsChange);
                await fn();
                await p;
                editorsChangeEventCounter++;
                assert.strictEqual(editorsChangeEventCounter, expected);
            }
            // open
            await assertEditorsChangeEvent(() => service.openEditor(input, { pinned: true }), 1);
            // open (other)
            await assertEditorsChangeEvent(() => service.openEditor(otherInput, { pinned: true }), 2);
            // close (inactive)
            await assertEditorsChangeEvent(() => rootGroup.closeEditor(input), 3);
            // close (active)
            await assertEditorsChangeEvent(() => rootGroup.closeEditor(otherInput), 4);
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            // open editors
            await assertEditorsChangeEvent(() => service.openEditors([{ editor: input, options: { pinned: true } }, { editor: otherInput, options: { pinned: true } }]), 5);
            // active editor change
            await assertEditorsChangeEvent(() => service.openEditor(otherInput), 6);
            // move editor (in group)
            await assertEditorsChangeEvent(() => service.openEditor(input, { pinned: true, index: 1 }), 7);
            const rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            await assertEditorsChangeEvent(async () => rootGroup.moveEditor(input, rightGroup), 8);
            // move group
            await assertEditorsChangeEvent(async () => part.moveGroup(rightGroup, rootGroup, 2 /* GroupDirection.LEFT */), 9);
        });
        test('two active editor change events when opening editor to the side', async function () {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEvents = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEvents++;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.strictEqual(activeEditorChangeEvents, expected, `Unexpected active editor change state (got ${activeEditorChangeEvents}, expected ${expected})`);
                activeEditorChangeEvents = 0;
            }
            await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(1);
            await service.openEditor(input, { pinned: true }, editorService_2.SIDE_GROUP);
            // we expect 2 active editor change events: one for the fact that the
            // active editor is now in the side group but also one for when the
            // editor has finished loading. we used to ignore that second change
            // event, however many listeners are interested on the active editor
            // when it has fully loaded (e.g. a model is set). as such, we cannot
            // simply ignore that second event from the editor service, even though
            // the actual editor input is the same
            assertActiveEditorChangedEvent(2);
            // cleanup
            activeEditorChangeListener.dispose();
        });
        test('activeTextEditorControl / activeTextEditorMode', async () => {
            const [, service] = await createEditorService();
            // Open untitled input
            const editor = await service.openEditor({ resource: undefined });
            assert.strictEqual(service.activeEditorPane, editor);
            assert.strictEqual(service.activeTextEditorControl, editor?.getControl());
            assert.strictEqual(service.activeTextEditorLanguageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
        });
        test('openEditor returns undefined when inactive', async function () {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-inactive'), TEST_EDITOR_INPUT_ID);
            const editor = await service.openEditor(input, { pinned: true });
            assert.ok(editor);
            const otherEditor = await service.openEditor(otherInput, { inactive: true });
            assert.ok(!otherEditor);
        });
        test('openEditor shows placeholder when opening fails', async function () {
            const [, service] = await createEditorService();
            const failingInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-failing'), TEST_EDITOR_INPUT_ID);
            failingInput.setFailToOpen();
            const failingEditor = await service.openEditor(failingInput);
            assert.ok(failingEditor instanceof editorPlaceholder_1.ErrorPlaceholderEditor);
        });
        test('openEditor shows placeholder when restoring fails', async function () {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            const failingInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-failing'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input, { pinned: true });
            await service.openEditor(failingInput, { inactive: true });
            failingInput.setFailToOpen();
            const failingEditor = await service.openEditor(failingInput);
            assert.ok(failingEditor instanceof editorPlaceholder_1.ErrorPlaceholderEditor);
        });
        test('save, saveAll, revertAll', async function () {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = true;
            const sameInput1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            sameInput1.dirty = true;
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            await service.openEditor(sameInput1, { pinned: true }, editorService_2.SIDE_GROUP);
            const res1 = await service.save({ groupId: rootGroup.id, editor: input1 });
            assert.strictEqual(res1.success, true);
            assert.strictEqual(res1.editors[0], input1);
            assert.strictEqual(input1.gotSaved, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const res2 = await service.save({ groupId: rootGroup.id, editor: input1 }, { saveAs: true });
            assert.strictEqual(res2.success, true);
            assert.strictEqual(res2.editors[0], input1);
            assert.strictEqual(input1.gotSavedAs, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const revertRes = await service.revertAll();
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const res3 = await service.saveAll();
            assert.strictEqual(res3.success, true);
            assert.strictEqual(res3.editors.length, 2);
            assert.strictEqual(input1.gotSaved, true);
            assert.strictEqual(input2.gotSaved, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input2.gotSaved = false;
            input2.gotSavedAs = false;
            input2.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            await service.saveAll({ saveAs: true });
            assert.strictEqual(input1.gotSavedAs, true);
            assert.strictEqual(input2.gotSavedAs, true);
            // services dedupes inputs automatically
            assert.strictEqual(sameInput1.gotSaved, false);
            assert.strictEqual(sameInput1.gotSavedAs, false);
            assert.strictEqual(sameInput1.gotReverted, false);
        });
        test('saveAll, revertAll (sticky editor)', async function () {
            const [, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = true;
            const sameInput1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            sameInput1.dirty = true;
            await service.openEditor(input1, { pinned: true, sticky: true });
            await service.openEditor(input2, { pinned: true });
            await service.openEditor(sameInput1, { pinned: true }, editorService_2.SIDE_GROUP);
            const revertRes = await service.revertAll({ excludeSticky: true });
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, false);
            assert.strictEqual(sameInput1.gotReverted, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            sameInput1.gotSaved = false;
            sameInput1.gotSavedAs = false;
            sameInput1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const saveRes = await service.saveAll({ excludeSticky: true });
            assert.strictEqual(saveRes.success, true);
            assert.strictEqual(saveRes.editors.length, 2);
            assert.strictEqual(input1.gotSaved, false);
            assert.strictEqual(input2.gotSaved, true);
            assert.strictEqual(sameInput1.gotSaved, true);
        });
        test('saveAll, revertAll untitled (exclude untitled)', async function () {
            await testSaveRevertUntitled({}, false, false);
            await testSaveRevertUntitled({ includeUntitled: false }, false, false);
        });
        test('saveAll, revertAll untitled (include untitled)', async function () {
            await testSaveRevertUntitled({ includeUntitled: true }, true, false);
            await testSaveRevertUntitled({ includeUntitled: { includeScratchpad: false } }, true, false);
        });
        test('saveAll, revertAll untitled (include scratchpad)', async function () {
            await testSaveRevertUntitled({ includeUntitled: { includeScratchpad: true } }, true, true);
        });
        async function testSaveRevertUntitled(options, expectUntitled, expectScratchpad) {
            const [, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const untitledInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            untitledInput.dirty = true;
            untitledInput.capabilities = 4 /* EditorInputCapabilities.Untitled */;
            const scratchpadInput = createTestFileEditorInput(uri_1.URI.parse('my://resource3'), TEST_EDITOR_INPUT_ID);
            scratchpadInput.modified = true;
            scratchpadInput.capabilities = 512 /* EditorInputCapabilities.Scratchpad */ | 4 /* EditorInputCapabilities.Untitled */;
            await service.openEditor(input1, { pinned: true, sticky: true });
            await service.openEditor(untitledInput, { pinned: true });
            await service.openEditor(scratchpadInput, { pinned: true });
            const revertRes = await service.revertAll(options);
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, true);
            assert.strictEqual(untitledInput.gotReverted, expectUntitled);
            assert.strictEqual(scratchpadInput.gotReverted, expectScratchpad);
            input1.gotSaved = false;
            untitledInput.gotSavedAs = false;
            scratchpadInput.gotReverted = false;
            input1.gotSaved = false;
            untitledInput.gotSavedAs = false;
            scratchpadInput.gotReverted = false;
            input1.dirty = true;
            untitledInput.dirty = true;
            scratchpadInput.modified = true;
            const saveRes = await service.saveAll(options);
            assert.strictEqual(saveRes.success, true);
            assert.strictEqual(saveRes.editors.length, expectScratchpad ? 3 : expectUntitled ? 2 : 1);
            assert.strictEqual(input1.gotSaved, true);
            assert.strictEqual(untitledInput.gotSaved, expectUntitled);
            assert.strictEqual(scratchpadInput.gotSaved, expectScratchpad);
        }
        test('file delete closes editor', async function () {
            return testFileDeleteEditorClose(false);
        });
        test('file delete leaves dirty editors open', function () {
            return testFileDeleteEditorClose(true);
        });
        async function testFileDeleteEditorClose(dirty) {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = dirty;
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = dirty;
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            assert.strictEqual(rootGroup.activeEditor, input2);
            const activeEditorChangePromise = awaitActiveEditorChange(service);
            accessor.fileService.fireAfterOperation(new files_1.FileOperationEvent(input2.resource, 1 /* FileOperation.DELETE */));
            if (!dirty) {
                await activeEditorChangePromise;
            }
            if (dirty) {
                assert.strictEqual(rootGroup.activeEditor, input2);
            }
            else {
                assert.strictEqual(rootGroup.activeEditor, input1);
            }
        }
        test('file move asks input to move', async function () {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            const movedInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input1.movedEditor = { editor: movedInput };
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            const activeEditorChangePromise = awaitActiveEditorChange(service);
            accessor.fileService.fireAfterOperation(new files_1.FileOperationEvent(input1.resource, 2 /* FileOperation.MOVE */, {
                resource: movedInput.resource,
                ctime: 0,
                etag: '',
                isDirectory: false,
                isFile: true,
                mtime: 0,
                name: 'resource2',
                size: 0,
                isSymbolicLink: false,
                readonly: false,
                locked: false,
                children: undefined
            }));
            await activeEditorChangePromise;
            assert.strictEqual(rootGroup.activeEditor, movedInput);
        });
        function awaitActiveEditorChange(editorService) {
            return event_1.Event.toPromise(event_1.Event.once(editorService.onDidActiveEditorChange));
        }
        test('file watcher gets installed for out of workspace files', async function () {
            const [, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://resource1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('file://resource2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            assert.strictEqual(accessor.fileService.watches.length, 1);
            assert.strictEqual(accessor.fileService.watches[0].toString(), input1.resource.toString());
            const editor = await service.openEditor(input2, { pinned: true });
            assert.strictEqual(accessor.fileService.watches.length, 1);
            assert.strictEqual(accessor.fileService.watches[0].toString(), input2.resource.toString());
            await editor?.group.closeAllEditors();
            assert.strictEqual(accessor.fileService.watches.length, 0);
        });
        test('activeEditorPane scopedContextKeyService', async function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({ contextKeyService: instantiationService => instantiationService.createInstance(mockKeybindingService_1.MockScopableContextKeyService) }, disposables);
            const [part, service] = await createEditorService(instantiationService);
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://resource1'), TEST_EDITOR_INPUT_ID);
            createTestFileEditorInput(uri_1.URI.parse('file://resource2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            const editorContextKeyService = service.activeEditorPane?.scopedContextKeyService;
            assert.ok(!!editorContextKeyService);
            assert.strictEqual(editorContextKeyService, part.activeGroup.activeEditorPane?.scopedContextKeyService);
        });
        test('editorResolverService - openEditor', async function () {
            const [, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: (editorInput) => {
                    editorCount++;
                    return ({ editor: textEditorService.createTextEditor(editorInput) });
                },
                createDiffEditorInput: diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) })
            });
            assert.strictEqual(editorCount, 0);
            const input1 = { resource: uri_1.URI.parse('file://test/path/resource1.txt') };
            const input2 = { resource: uri_1.URI.parse('file://test/path/resource1.md') };
            // Open editor input 1 and it shouln't trigger override as the glob doesn't match
            await service.openEditor(input1);
            assert.strictEqual(editorCount, 0);
            // Open editor input 2 and it should trigger override as the glob doesn match
            await service.openEditor(input2);
            assert.strictEqual(editorCount, 1);
            // Because we specify an override we shouldn't see it triggered even if it matches
            await service.openEditor({ ...input2, options: { override: 'default' } });
            assert.strictEqual(editorCount, 1);
            registrationDisposable.dispose();
        });
        test('editorResolverService - openEditors', async function () {
            const [, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: (editorInput) => {
                    editorCount++;
                    return ({ editor: textEditorService.createTextEditor(editorInput) });
                },
                createDiffEditorInput: diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) })
            });
            assert.strictEqual(editorCount, 0);
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource1.txt'), TEST_EDITOR_INPUT_ID).toUntyped();
            const input2 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource2.txt'), TEST_EDITOR_INPUT_ID).toUntyped();
            const input3 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource3.md'), TEST_EDITOR_INPUT_ID).toUntyped();
            const input4 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource4.md'), TEST_EDITOR_INPUT_ID).toUntyped();
            assert.ok(input1);
            assert.ok(input2);
            assert.ok(input3);
            assert.ok(input4);
            // Open editor inputs
            await service.openEditors([input1, input2, input3, input4]);
            // Only two matched the factory glob
            assert.strictEqual(editorCount, 2);
            registrationDisposable.dispose();
        });
        test('editorResolverService - replaceEditors', async function () {
            const [part, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: (editorInput) => {
                    editorCount++;
                    return ({ editor: textEditorService.createTextEditor(editorInput) });
                },
                createDiffEditorInput: diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) })
            });
            assert.strictEqual(editorCount, 0);
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource2.md'), TEST_EDITOR_INPUT_ID);
            const untypedInput1 = input1.toUntyped();
            assert.ok(untypedInput1);
            // Open editor input 1 and it shouldn't trigger because typed inputs aren't overriden
            await service.openEditor(input1);
            assert.strictEqual(editorCount, 0);
            await service.replaceEditors([{
                    editor: input1,
                    replacement: untypedInput1,
                }], part.activeGroup);
            assert.strictEqual(editorCount, 1);
            registrationDisposable.dispose();
        });
        test('closeEditor', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Close editor
            await service.closeEditor({ editor: input, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 1);
            await service.closeEditor({ editor: input, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 1);
            await service.closeEditor({ editor: otherInput, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 0);
            await service.closeEditor({ editor: otherInput, groupId: 999 });
            assert.strictEqual(part.activeGroup.count, 0);
        });
        test('closeEditors', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Close editors
            await service.closeEditors([{ editor: input, groupId: part.activeGroup.id }, { editor: otherInput, groupId: part.activeGroup.id }]);
            assert.strictEqual(part.activeGroup.count, 0);
        });
        test('findEditors (in group)', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Try using find editors for opened editors
            {
                const found1 = service.findEditors(input.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0], input);
                const found2 = service.findEditors(input, undefined, part.activeGroup);
                assert.strictEqual(found2, input);
            }
            {
                const found1 = service.findEditors(otherInput.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0], otherInput);
                const found2 = service.findEditors(otherInput, undefined, part.activeGroup);
                assert.strictEqual(found2, otherInput);
            }
            // Make sure we don't find non-opened editors
            {
                const found1 = service.findEditors(uri_1.URI.parse('my://no-such-resource'), undefined, part.activeGroup);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors({ resource: uri_1.URI.parse('my://no-such-resource'), typeId: '', editorId: TEST_EDITOR_INPUT_ID }, undefined, part.activeGroup);
                assert.strictEqual(found2, undefined);
            }
            // Make sure we don't find editors across groups
            {
                const newEditor = await service.openEditor(createTestFileEditorInput(uri_1.URI.parse('my://other-group-resource'), TEST_EDITOR_INPUT_ID), { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
                const found1 = service.findEditors(input.resource, undefined, newEditor.group.id);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input, undefined, newEditor.group.id);
                assert.strictEqual(found2, undefined);
            }
            // Check we don't find editors after closing them
            await part.activeGroup.closeAllEditors();
            {
                const found1 = service.findEditors(input.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input, undefined, part.activeGroup);
                assert.strictEqual(found2, undefined);
            }
        });
        test('findEditors (across groups)', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            const sideEditor = await service.openEditor(input, { pinned: true }, editorService_2.SIDE_GROUP);
            // Try using find editors for opened editors
            {
                const found1 = service.findEditors(input.resource);
                assert.strictEqual(found1.length, 2);
                assert.strictEqual(found1[0].editor, input);
                assert.strictEqual(found1[0].groupId, sideEditor?.group.id);
                assert.strictEqual(found1[1].editor, input);
                assert.strictEqual(found1[1].groupId, rootGroup.id);
                const found2 = service.findEditors(input);
                assert.strictEqual(found2.length, 2);
                assert.strictEqual(found2[0].editor, input);
                assert.strictEqual(found2[0].groupId, sideEditor?.group.id);
                assert.strictEqual(found2[1].editor, input);
                assert.strictEqual(found2[1].groupId, rootGroup.id);
            }
            {
                const found1 = service.findEditors(otherInput.resource);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0].editor, otherInput);
                assert.strictEqual(found1[0].groupId, rootGroup.id);
                const found2 = service.findEditors(otherInput);
                assert.strictEqual(found2.length, 1);
                assert.strictEqual(found2[0].editor, otherInput);
                assert.strictEqual(found2[0].groupId, rootGroup.id);
            }
            // Make sure we don't find non-opened editors
            {
                const found1 = service.findEditors(uri_1.URI.parse('my://no-such-resource'));
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors({ resource: uri_1.URI.parse('my://no-such-resource'), typeId: '', editorId: TEST_EDITOR_INPUT_ID });
                assert.strictEqual(found2.length, 0);
            }
            // Check we don't find editors after closing them
            await rootGroup.closeAllEditors();
            await sideEditor?.group.closeAllEditors();
            {
                const found1 = service.findEditors(input.resource);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input);
                assert.strictEqual(found2.length, 0);
            }
        });
        test('findEditors (support side by side via options)', async () => {
            const [, service] = await createEditorService();
            const secondaryInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-findEditors-secondary'), TEST_EDITOR_INPUT_ID);
            const primaryInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-findEditors-primary'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, secondaryInput, primaryInput, service);
            await service.openEditor(sideBySideInput, { pinned: true });
            let foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'));
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
        });
        test('side by side editor is not matching all other editors (https://github.com/microsoft/vscode/issues/132859)', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, input, input, service);
            const otherSideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, otherInput, otherInput, service);
            await service.openEditor(sideBySideInput, undefined, editorService_2.SIDE_GROUP);
            part.activateGroup(rootGroup);
            await service.openEditor(otherSideBySideInput, { revealIfOpened: true, revealIfVisible: true });
            assert.strictEqual(rootGroup.count, 1);
        });
        test('onDidCloseEditor indicates proper context when moving editor across groups', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            const sidegroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const events = [];
            disposables.add(service.onDidCloseEditor(e => {
                events.push(e);
            }));
            rootGroup.moveEditor(input1, sidegroup);
            assert.strictEqual(events[0].context, editor_2.EditorCloseContext.MOVE);
            await sidegroup.closeEditor(input1);
            assert.strictEqual(events[1].context, editor_2.EditorCloseContext.UNKNOWN);
        });
        test('onDidCloseEditor indicates proper context when replacing an editor', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            const events = [];
            disposables.add(service.onDidCloseEditor(e => {
                events.push(e);
            }));
            await rootGroup.replaceEditors([{ editor: input1, replacement: input2 }]);
            assert.strictEqual(events[0].context, editor_2.EditorCloseContext.REPLACE);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9lZGl0b3JTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE2QmhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLE1BQU0sY0FBYyxHQUFHLDhCQUE4QixDQUFDO1FBQ3RELE1BQU0sb0JBQW9CLEdBQUcsaUNBQWlDLENBQUM7UUFFL0QsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsSUFBSSw2QkFBNkIsR0FBMEMsU0FBUyxDQUFDO1FBRXJGLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsMENBQWtCLEVBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSw0QkFBYyxDQUFDLDJDQUFtQixDQUFDLEVBQUUsSUFBSSw0QkFBYyxDQUFDLG9EQUE0QixDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDdkssV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGtEQUEwQixHQUFFLENBQUMsQ0FBQztZQUM5QyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsb0RBQTRCLEdBQUUsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ25CLElBQUksNkJBQTZCLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxJQUFBLHlDQUFpQixFQUFDLDZCQUE2QixDQUFDLENBQUM7Z0JBQ3ZELDZCQUE2QixHQUFHLFNBQVMsQ0FBQztZQUMzQyxDQUFDO1lBRUQsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENB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QVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFMUYsd0RBQXdEO1lBQ3hELE1BQU0sT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0QsTUFBTSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSw0QkFBWSxDQUFDLENBQUM7WUFFakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUUxRixxREFBcUQ7WUFDckQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSwwQkFBVSxDQUFDLENBQUM7WUFDL0UsTUFB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TUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxSCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEksTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXhJLE1BQU0sT0FBTyxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU5QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxSCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEksTUFBTSxPQUFPLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUVsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFB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QyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN4QixNQUFNLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUMxQixNQUFNLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUUzQixNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNwQixNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNwQixVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUV4QixNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUU1QyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN4QixNQUFNLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUMxQixNQUFNLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUUzQixNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNwQixNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNwQixVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUV4QixNQUFNLFNBQVMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0s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Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFcEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUNELENBQUM7Z0JBQ0EsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxP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QyxDQUFDO1lBQ3BJLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3RJLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3RJLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3hJLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FB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