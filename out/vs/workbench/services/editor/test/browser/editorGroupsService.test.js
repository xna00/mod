/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/editor", "vs/base/common/uri", "vs/platform/instantiation/common/descriptors", "vs/base/common/lifecycle", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/test/common/utils"], function (require, exports, assert, workbenchTestServices_1, editorGroupsService_1, editor_1, uri_1, descriptors_1, lifecycle_1, mockKeybindingService_1, testConfigurationService_1, configuration_1, sideBySideEditorInput_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorGroupsService', () => {
        const TEST_EDITOR_ID = 'MyFileEditorForEditorGroupService';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorGroupService';
        const disposables = new lifecycle_1.DisposableStore();
        let testLocalInstantiationService = undefined;
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput), new descriptors_1.SyncDescriptor(sideBySideEditorInput_1.SideBySideEditorInput)], TEST_EDITOR_INPUT_ID));
        });
        teardown(async () => {
            if (testLocalInstantiationService) {
                await (0, workbenchTestServices_1.workbenchTeardown)(testLocalInstantiationService);
                testLocalInstantiationService = undefined;
            }
            disposables.clear();
        });
        async function createPart(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            testLocalInstantiationService = instantiationService;
            return [part, instantiationService];
        }
        function createTestFileEditorInput(resource, typeId) {
            return disposables.add(new workbenchTestServices_1.TestFileEditorInput(resource, typeId));
        }
        test('groups basics', async function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({ contextKeyService: instantiationService => instantiationService.createInstance(mockKeybindingService_1.MockScopableContextKeyService) }, disposables);
            const [part] = await createPart(instantiationService);
            let activeGroupModelChangeCounter = 0;
            const activeGroupModelChangeListener = part.onDidChangeActiveGroup(() => {
                activeGroupModelChangeCounter++;
            });
            let groupAddedCounter = 0;
            const groupAddedListener = part.onDidAddGroup(() => {
                groupAddedCounter++;
            });
            let groupRemovedCounter = 0;
            const groupRemovedListener = part.onDidRemoveGroup(() => {
                groupRemovedCounter++;
            });
            let groupMovedCounter = 0;
            const groupMovedListener = part.onDidMoveGroup(() => {
                groupMovedCounter++;
            });
            // always a root group
            const rootGroup = part.groups[0];
            assert.strictEqual((0, editorGroupsService_1.isEditorGroup)(rootGroup), true);
            assert.strictEqual(part.groups.length, 1);
            assert.strictEqual(part.count, 1);
            assert.strictEqual(rootGroup, part.getGroup(rootGroup.id));
            assert.ok(part.activeGroup === rootGroup);
            assert.strictEqual(rootGroup.label, 'Group 1');
            let mru = part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru.length, 1);
            assert.strictEqual(mru[0], rootGroup);
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            assert.strictEqual(rightGroup, part.getGroup(rightGroup.id));
            assert.strictEqual(groupAddedCounter, 1);
            assert.strictEqual(part.groups.length, 2);
            assert.strictEqual(part.count, 2);
            assert.ok(part.activeGroup === rootGroup);
            assert.strictEqual(rootGroup.label, 'Group 1');
            assert.strictEqual(rightGroup.label, 'Group 2');
            mru = part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru.length, 2);
            assert.strictEqual(mru[0], rootGroup);
            assert.strictEqual(mru[1], rightGroup);
            assert.strictEqual(activeGroupModelChangeCounter, 0);
            let rootGroupActiveChangeCounter = 0;
            const rootGroupModelChangeListener = rootGroup.onDidModelChange(e => {
                if (e.kind === 0 /* GroupModelChangeKind.GROUP_ACTIVE */) {
                    rootGroupActiveChangeCounter++;
                }
            });
            let rightGroupActiveChangeCounter = 0;
            const rightGroupModelChangeListener = rightGroup.onDidModelChange(e => {
                if (e.kind === 0 /* GroupModelChangeKind.GROUP_ACTIVE */) {
                    rightGroupActiveChangeCounter++;
                }
            });
            part.activateGroup(rightGroup);
            assert.ok(part.activeGroup === rightGroup);
            assert.strictEqual(activeGroupModelChangeCounter, 1);
            assert.strictEqual(rootGroupActiveChangeCounter, 1);
            assert.strictEqual(rightGroupActiveChangeCounter, 1);
            rootGroupModelChangeListener.dispose();
            rightGroupModelChangeListener.dispose();
            mru = part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru.length, 2);
            assert.strictEqual(mru[0], rightGroup);
            assert.strictEqual(mru[1], rootGroup);
            const downGroup = part.addGroup(rightGroup, 1 /* GroupDirection.DOWN */);
            let didDispose = false;
            disposables.add(downGroup.onWillDispose(() => {
                didDispose = true;
            }));
            assert.strictEqual(groupAddedCounter, 2);
            assert.strictEqual(part.groups.length, 3);
            assert.ok(part.activeGroup === rightGroup);
            assert.ok(!downGroup.activeEditorPane);
            assert.strictEqual(rootGroup.label, 'Group 1');
            assert.strictEqual(rightGroup.label, 'Group 2');
            assert.strictEqual(downGroup.label, 'Group 3');
            mru = part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru.length, 3);
            assert.strictEqual(mru[0], rightGroup);
            assert.strictEqual(mru[1], rootGroup);
            assert.strictEqual(mru[2], downGroup);
            const gridOrder = part.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            assert.strictEqual(gridOrder.length, 3);
            assert.strictEqual(gridOrder[0], rootGroup);
            assert.strictEqual(gridOrder[0].index, 0);
            assert.strictEqual(gridOrder[1], rightGroup);
            assert.strictEqual(gridOrder[1].index, 1);
            assert.strictEqual(gridOrder[2], downGroup);
            assert.strictEqual(gridOrder[2].index, 2);
            part.moveGroup(downGroup, rightGroup, 1 /* GroupDirection.DOWN */);
            assert.strictEqual(groupMovedCounter, 1);
            part.removeGroup(downGroup);
            assert.ok(!part.getGroup(downGroup.id));
            assert.ok(!part.hasGroup(downGroup.id));
            assert.strictEqual(didDispose, true);
            assert.strictEqual(groupRemovedCounter, 1);
            assert.strictEqual(part.groups.length, 2);
            assert.ok(part.activeGroup === rightGroup);
            assert.strictEqual(rootGroup.label, 'Group 1');
            assert.strictEqual(rightGroup.label, 'Group 2');
            mru = part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru.length, 2);
            assert.strictEqual(mru[0], rightGroup);
            assert.strictEqual(mru[1], rootGroup);
            const rightGroupContextKeyService = part.activeGroup.scopedContextKeyService;
            const rootGroupContextKeyService = rootGroup.scopedContextKeyService;
            assert.ok(rightGroupContextKeyService);
            assert.ok(rootGroupContextKeyService);
            assert.ok(rightGroupContextKeyService !== rootGroupContextKeyService);
            part.removeGroup(rightGroup);
            assert.strictEqual(groupRemovedCounter, 2);
            assert.strictEqual(part.groups.length, 1);
            assert.ok(part.activeGroup === rootGroup);
            mru = part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru.length, 1);
            assert.strictEqual(mru[0], rootGroup);
            part.removeGroup(rootGroup); // cannot remove root group
            assert.strictEqual(part.groups.length, 1);
            assert.strictEqual(groupRemovedCounter, 2);
            assert.ok(part.activeGroup === rootGroup);
            part.setGroupOrientation(part.orientation === 0 /* GroupOrientation.HORIZONTAL */ ? 1 /* GroupOrientation.VERTICAL */ : 0 /* GroupOrientation.HORIZONTAL */);
            activeGroupModelChangeListener.dispose();
            groupAddedListener.dispose();
            groupRemovedListener.dispose();
            groupMovedListener.dispose();
        });
        test('sideGroup', async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({ contextKeyService: instantiationService => instantiationService.createInstance(mockKeybindingService_1.MockScopableContextKeyService) }, disposables);
            const [part] = await createPart(instantiationService);
            const rootGroup = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await rootGroup.openEditor(input1, { pinned: true });
            await part.sideGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(part.count, 2);
            part.activateGroup(rootGroup);
            await part.sideGroup.openEditor(input3, { pinned: true });
            assert.strictEqual(part.count, 2);
        });
        test('save & restore state', async function () {
            const [part, instantiationService] = await createPart();
            const rootGroup = part.groups[0];
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const downGroup = part.addGroup(rightGroup, 1 /* GroupDirection.DOWN */);
            const rootGroupInput = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            await rootGroup.openEditor(rootGroupInput, { pinned: true });
            const rightGroupInput = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await rightGroup.openEditor(rightGroupInput, { pinned: true });
            assert.strictEqual(part.groups.length, 3);
            part.testSaveState();
            part.dispose();
            const [restoredPart] = await createPart(instantiationService);
            assert.strictEqual(restoredPart.groups.length, 3);
            assert.ok(restoredPart.getGroup(rootGroup.id));
            assert.ok(restoredPart.hasGroup(rootGroup.id));
            assert.ok(restoredPart.getGroup(rightGroup.id));
            assert.ok(restoredPart.hasGroup(rightGroup.id));
            assert.ok(restoredPart.getGroup(downGroup.id));
            assert.ok(restoredPart.hasGroup(downGroup.id));
            restoredPart.clearState();
        });
        test('groups index / labels', async function () {
            const [part] = await createPart();
            const rootGroup = part.groups[0];
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const downGroup = part.addGroup(rightGroup, 1 /* GroupDirection.DOWN */);
            let groupIndexChangedCounter = 0;
            const groupIndexChangedListener = part.onDidChangeGroupIndex(() => {
                groupIndexChangedCounter++;
            });
            let indexChangeCounter = 0;
            const labelChangeListener = downGroup.onDidModelChange(e => {
                if (e.kind === 1 /* GroupModelChangeKind.GROUP_INDEX */) {
                    indexChangeCounter++;
                }
            });
            assert.strictEqual(rootGroup.index, 0);
            assert.strictEqual(rightGroup.index, 1);
            assert.strictEqual(downGroup.index, 2);
            assert.strictEqual(rootGroup.label, 'Group 1');
            assert.strictEqual(rightGroup.label, 'Group 2');
            assert.strictEqual(downGroup.label, 'Group 3');
            part.removeGroup(rightGroup);
            assert.strictEqual(rootGroup.index, 0);
            assert.strictEqual(downGroup.index, 1);
            assert.strictEqual(rootGroup.label, 'Group 1');
            assert.strictEqual(downGroup.label, 'Group 2');
            assert.strictEqual(indexChangeCounter, 1);
            assert.strictEqual(groupIndexChangedCounter, 1);
            part.moveGroup(downGroup, rootGroup, 0 /* GroupDirection.UP */);
            assert.strictEqual(downGroup.index, 0);
            assert.strictEqual(rootGroup.index, 1);
            assert.strictEqual(downGroup.label, 'Group 1');
            assert.strictEqual(rootGroup.label, 'Group 2');
            assert.strictEqual(indexChangeCounter, 2);
            assert.strictEqual(groupIndexChangedCounter, 3);
            const newFirstGroup = part.addGroup(downGroup, 0 /* GroupDirection.UP */);
            assert.strictEqual(newFirstGroup.index, 0);
            assert.strictEqual(downGroup.index, 1);
            assert.strictEqual(rootGroup.index, 2);
            assert.strictEqual(newFirstGroup.label, 'Group 1');
            assert.strictEqual(downGroup.label, 'Group 2');
            assert.strictEqual(rootGroup.label, 'Group 3');
            assert.strictEqual(indexChangeCounter, 3);
            assert.strictEqual(groupIndexChangedCounter, 6);
            labelChangeListener.dispose();
            groupIndexChangedListener.dispose();
        });
        test('groups label', async function () {
            const [part] = await createPart();
            const rootGroup = part.groups[0];
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            let partLabelChangedCounter = 0;
            const groupIndexChangedListener = part.onDidChangeGroupLabel(() => {
                partLabelChangedCounter++;
            });
            let rootGroupLabelChangeCounter = 0;
            const rootGroupLabelChangeListener = rootGroup.onDidModelChange(e => {
                if (e.kind === 2 /* GroupModelChangeKind.GROUP_LABEL */) {
                    rootGroupLabelChangeCounter++;
                }
            });
            let rightGroupLabelChangeCounter = 0;
            const rightGroupLabelChangeListener = rightGroup.onDidModelChange(e => {
                if (e.kind === 2 /* GroupModelChangeKind.GROUP_LABEL */) {
                    rightGroupLabelChangeCounter++;
                }
            });
            assert.strictEqual(rootGroup.label, 'Group 1');
            assert.strictEqual(rightGroup.label, 'Group 2');
            part.notifyGroupsLabelChange('Window 2');
            assert.strictEqual(rootGroup.label, 'Window 2: Group 1');
            assert.strictEqual(rightGroup.label, 'Window 2: Group 2');
            assert.strictEqual(rootGroupLabelChangeCounter, 1);
            assert.strictEqual(rightGroupLabelChangeCounter, 1);
            assert.strictEqual(partLabelChangedCounter, 2);
            part.notifyGroupsLabelChange('Window 3');
            assert.strictEqual(rootGroup.label, 'Window 3: Group 1');
            assert.strictEqual(rightGroup.label, 'Window 3: Group 2');
            assert.strictEqual(rootGroupLabelChangeCounter, 2);
            assert.strictEqual(rightGroupLabelChangeCounter, 2);
            assert.strictEqual(partLabelChangedCounter, 4);
            rootGroupLabelChangeListener.dispose();
            rightGroupLabelChangeListener.dispose();
            groupIndexChangedListener.dispose();
        });
        test('copy/merge groups', async () => {
            const [part] = await createPart();
            let groupAddedCounter = 0;
            const groupAddedListener = part.onDidAddGroup(() => {
                groupAddedCounter++;
            });
            let groupRemovedCounter = 0;
            const groupRemovedListener = part.onDidRemoveGroup(() => {
                groupRemovedCounter++;
            });
            const rootGroup = part.groups[0];
            let rootGroupDisposed = false;
            const disposeListener = rootGroup.onWillDispose(() => {
                rootGroupDisposed = true;
            });
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            await rootGroup.openEditor(input, { pinned: true });
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rightGroup);
            const downGroup = part.copyGroup(rootGroup, rightGroup, 1 /* GroupDirection.DOWN */);
            assert.strictEqual(groupAddedCounter, 2);
            assert.strictEqual(downGroup.count, 1);
            assert.ok(downGroup.activeEditor instanceof workbenchTestServices_1.TestFileEditorInput);
            part.mergeGroup(rootGroup, rightGroup, { mode: 0 /* MergeGroupMode.COPY_EDITORS */ });
            assert.strictEqual(rightGroup.count, 1);
            assert.ok(rightGroup.activeEditor instanceof workbenchTestServices_1.TestFileEditorInput);
            part.mergeGroup(rootGroup, rightGroup, { mode: 1 /* MergeGroupMode.MOVE_EDITORS */ });
            assert.strictEqual(rootGroup.count, 0);
            part.mergeGroup(rootGroup, downGroup);
            assert.strictEqual(groupRemovedCounter, 1);
            assert.strictEqual(rootGroupDisposed, true);
            groupAddedListener.dispose();
            groupRemovedListener.dispose();
            disposeListener.dispose();
            part.dispose();
        });
        test('merge all groups', async () => {
            const [part] = await createPart();
            const rootGroup = part.groups[0];
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await rootGroup.openEditor(input1, { pinned: true });
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            await rightGroup.openEditor(input2, { pinned: true });
            const downGroup = part.copyGroup(rootGroup, rightGroup, 1 /* GroupDirection.DOWN */);
            await downGroup.openEditor(input3, { pinned: true });
            part.activateGroup(rootGroup);
            assert.strictEqual(rootGroup.count, 1);
            const result = part.mergeAllGroups(part.activeGroup);
            assert.strictEqual(result.id, rootGroup.id);
            assert.strictEqual(rootGroup.count, 3);
            part.dispose();
        });
        test('whenReady / whenRestored', async () => {
            const [part] = await createPart();
            await part.whenReady;
            assert.strictEqual(part.isReady, true);
            await part.whenRestored;
        });
        test('options', async () => {
            const [part] = await createPart();
            let oldOptions;
            let newOptions;
            disposables.add(part.onDidChangeEditorPartOptions(event => {
                oldOptions = event.oldPartOptions;
                newOptions = event.newPartOptions;
            }));
            const currentOptions = part.partOptions;
            assert.ok(currentOptions);
            disposables.add(part.enforcePartOptions({ showTabs: 'single' }));
            assert.strictEqual(part.partOptions.showTabs, 'single');
            assert.strictEqual(newOptions.showTabs, 'single');
            assert.strictEqual(oldOptions, currentOptions);
        });
        test('editor basics', async function () {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            let activeEditorChangeCounter = 0;
            let editorDidOpenCounter = 0;
            const editorOpenEvents = [];
            let editorCloseCounter = 0;
            const editorCloseEvents = [];
            let editorPinCounter = 0;
            let editorStickyCounter = 0;
            let editorCapabilitiesCounter = 0;
            const editorGroupModelChangeListener = group.onDidModelChange(e => {
                if (e.kind === 4 /* GroupModelChangeKind.EDITOR_OPEN */) {
                    assert.ok(e.editor);
                    editorDidOpenCounter++;
                    editorOpenEvents.push(e);
                }
                else if (e.kind === 10 /* GroupModelChangeKind.EDITOR_PIN */) {
                    assert.ok(e.editor);
                    editorPinCounter++;
                }
                else if (e.kind === 12 /* GroupModelChangeKind.EDITOR_STICKY */) {
                    assert.ok(e.editor);
                    editorStickyCounter++;
                }
                else if (e.kind === 9 /* GroupModelChangeKind.EDITOR_CAPABILITIES */) {
                    assert.ok(e.editor);
                    editorCapabilitiesCounter++;
                }
                else if (e.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */) {
                    assert.ok(e.editor);
                    editorCloseCounter++;
                    editorCloseEvents.push(e);
                }
            });
            const activeEditorChangeListener = group.onDidActiveEditorChange(e => {
                assert.ok(e.editor);
                activeEditorChangeCounter++;
            });
            let editorCloseCounter1 = 0;
            const editorCloseListener = group.onDidCloseEditor(() => {
                editorCloseCounter1++;
            });
            let editorWillCloseCounter = 0;
            const editorWillCloseListener = group.onWillCloseEditor(() => {
                editorWillCloseCounter++;
            });
            let editorDidCloseCounter = 0;
            const editorDidCloseListener = group.onDidCloseEditor(() => {
                editorDidCloseCounter++;
            });
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputInactive, { inactive: true });
            assert.strictEqual(group.isActive(input), true);
            assert.strictEqual(group.isActive(inputInactive), false);
            assert.strictEqual(group.contains(input), true);
            assert.strictEqual(group.contains(inputInactive), true);
            assert.strictEqual(group.isEmpty, false);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(editorCapabilitiesCounter, 0);
            assert.strictEqual(editorDidOpenCounter, 2);
            assert.strictEqual(editorOpenEvents[0].editorIndex, 0);
            assert.strictEqual(editorOpenEvents[1].editorIndex, 1);
            assert.strictEqual(editorOpenEvents[0].editor, input);
            assert.strictEqual(editorOpenEvents[1].editor, inputInactive);
            assert.strictEqual(activeEditorChangeCounter, 1);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            assert.strictEqual(group.getIndexOfEditor(input), 0);
            assert.strictEqual(group.getIndexOfEditor(inputInactive), 1);
            assert.strictEqual(group.isFirst(input), true);
            assert.strictEqual(group.isFirst(inputInactive), false);
            assert.strictEqual(group.isLast(input), false);
            assert.strictEqual(group.isLast(inputInactive), true);
            input.capabilities = 16 /* EditorInputCapabilities.RequiresTrust */;
            assert.strictEqual(editorCapabilitiesCounter, 1);
            inputInactive.capabilities = 8 /* EditorInputCapabilities.Singleton */;
            assert.strictEqual(editorCapabilitiesCounter, 2);
            assert.strictEqual(group.previewEditor, inputInactive);
            assert.strictEqual(group.isPinned(inputInactive), false);
            group.pinEditor(inputInactive);
            assert.strictEqual(editorPinCounter, 1);
            assert.strictEqual(group.isPinned(inputInactive), true);
            assert.ok(!group.previewEditor);
            assert.strictEqual(group.activeEditor, input);
            assert.strictEqual(group.activeEditorPane?.getId(), TEST_EDITOR_ID);
            assert.strictEqual(group.count, 2);
            const mru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru[0], input);
            assert.strictEqual(mru[1], inputInactive);
            await group.openEditor(inputInactive);
            assert.strictEqual(activeEditorChangeCounter, 2);
            assert.strictEqual(group.activeEditor, inputInactive);
            await group.openEditor(input);
            const closed = await group.closeEditor(inputInactive);
            assert.strictEqual(closed, true);
            assert.strictEqual(activeEditorChangeCounter, 3);
            assert.strictEqual(editorCloseCounter, 1);
            assert.strictEqual(editorCloseEvents[0].editorIndex, 1);
            assert.strictEqual(editorCloseEvents[0].editor, inputInactive);
            assert.strictEqual(editorCloseCounter1, 1);
            assert.strictEqual(editorWillCloseCounter, 1);
            assert.strictEqual(editorDidCloseCounter, 1);
            assert.ok(inputInactive.gotDisposed);
            assert.strictEqual(group.activeEditor, input);
            assert.strictEqual(editorStickyCounter, 0);
            group.stickEditor(input);
            assert.strictEqual(editorStickyCounter, 1);
            group.unstickEditor(input);
            assert.strictEqual(editorStickyCounter, 2);
            editorCloseListener.dispose();
            editorWillCloseListener.dispose();
            editorDidCloseListener.dispose();
            activeEditorChangeListener.dispose();
            editorGroupModelChangeListener.dispose();
        });
        test('openEditors / closeEditors', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input, options: { pinned: true } },
                { editor: inputInactive }
            ]);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            await group.closeEditors([input, inputInactive]);
            assert.ok(input.gotDisposed);
            assert.ok(inputInactive.gotDisposed);
            assert.strictEqual(group.isEmpty, true);
        });
        test('closeEditor - dirty editor handling', async () => {
            const [part, instantiationService] = await createPart();
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            const group = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            input.dirty = true;
            await group.openEditor(input);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            let closed = await group.closeEditor(input);
            assert.strictEqual(closed, false);
            assert.ok(!input.gotDisposed);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            closed = await group.closeEditor(input);
            assert.strictEqual(closed, true);
            assert.ok(input.gotDisposed);
        });
        test('closeEditor (one, opened in multiple groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            await rightGroup.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            let closed = await rightGroup.closeEditor(input);
            assert.strictEqual(closed, true);
            assert.ok(!input.gotDisposed);
            closed = await group.closeEditor(input);
            assert.strictEqual(closed, true);
            assert.ok(input.gotDisposed);
        });
        test('closeEditors - dirty editor handling', async () => {
            const [part, instantiationService] = await createPart();
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            let closeResult = false;
            const group = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input1);
            await group.openEditor(input2);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            closeResult = await group.closeEditors([input1, input2]);
            assert.strictEqual(closeResult, false);
            assert.ok(!input1.gotDisposed);
            assert.ok(!input2.gotDisposed);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            closeResult = await group.closeEditors([input1, input2]);
            assert.strictEqual(closeResult, true);
            assert.ok(input1.gotDisposed);
            assert.ok(input2.gotDisposed);
        });
        test('closeEditors (except one)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ except: input2 });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), input2);
        });
        test('closeEditors (except one, sticky editor)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true, sticky: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ except: input2, excludeSticky: true });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            await group.closeEditors({ except: input2 });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.stickyCount, 0);
            assert.strictEqual(group.getEditorByIndex(0), input2);
        });
        test('closeEditors (saved only)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ savedOnly: true });
            assert.strictEqual(group.count, 0);
        });
        test('closeEditors (saved only, sticky editor)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true, sticky: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ savedOnly: true, excludeSticky: true });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            await group.closeEditors({ savedOnly: true });
            assert.strictEqual(group.count, 0);
        });
        test('closeEditors (direction: right)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ direction: 1 /* CloseDirection.RIGHT */, except: input2 });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
        });
        test('closeEditors (direction: right, sticky editor)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true, sticky: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ direction: 1 /* CloseDirection.RIGHT */, except: input2, excludeSticky: true });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            await group.closeEditors({ direction: 1 /* CloseDirection.RIGHT */, except: input2 });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
        });
        test('closeEditors (direction: left)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ direction: 0 /* CloseDirection.LEFT */, except: input2 });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input2);
            assert.strictEqual(group.getEditorByIndex(1), input3);
        });
        test('closeEditors (direction: left, sticky editor)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input1, options: { pinned: true, sticky: true } },
                { editor: input2, options: { pinned: true } },
                { editor: input3 }
            ]);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ direction: 0 /* CloseDirection.LEFT */, except: input2, excludeSticky: true });
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            await group.closeEditors({ direction: 0 /* CloseDirection.LEFT */, except: input2 });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input2);
            assert.strictEqual(group.getEditorByIndex(1), input3);
        });
        test('closeAllEditors', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input, options: { pinned: true } },
                { editor: inputInactive }
            ]);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            await group.closeAllEditors();
            assert.strictEqual(group.isEmpty, true);
        });
        test('closeAllEditors - dirty editor handling', async () => {
            const [part, instantiationService] = await createPart();
            let closeResult = true;
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            const group = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input1);
            await group.openEditor(input2);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            closeResult = await group.closeAllEditors();
            assert.strictEqual(closeResult, false);
            assert.ok(!input1.gotDisposed);
            assert.ok(!input2.gotDisposed);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            closeResult = await group.closeAllEditors();
            assert.strictEqual(closeResult, true);
            assert.ok(input1.gotDisposed);
            assert.ok(input2.gotDisposed);
        });
        test('closeAllEditors (sticky editor)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([
                { editor: input, options: { pinned: true, sticky: true } },
                { editor: inputInactive }
            ]);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.stickyCount, 1);
            await group.closeAllEditors({ excludeSticky: true });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.getEditorByIndex(0), input);
            await group.closeAllEditors();
            assert.strictEqual(group.isEmpty, true);
        });
        test('moveEditor (same group)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            const moveEvents = [];
            const editorGroupModelChangeListener = group.onDidModelChange(e => {
                if (e.kind === 6 /* GroupModelChangeKind.EDITOR_MOVE */) {
                    assert.ok(e.editor);
                    moveEvents.push(e);
                }
            });
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            group.moveEditor(inputInactive, group, { index: 0 });
            assert.strictEqual(moveEvents.length, 1);
            assert.strictEqual(moveEvents[0].editorIndex, 0);
            assert.strictEqual(moveEvents[0].oldEditorIndex, 1);
            assert.strictEqual(moveEvents[0].editor, inputInactive);
            assert.strictEqual(group.getEditorByIndex(0), inputInactive);
            assert.strictEqual(group.getEditorByIndex(1), input);
            const res = group.moveEditors([{ editor: inputInactive, options: { index: 1 } }], group);
            assert.strictEqual(res, true);
            assert.strictEqual(moveEvents.length, 2);
            assert.strictEqual(moveEvents[1].editorIndex, 1);
            assert.strictEqual(moveEvents[1].oldEditorIndex, 0);
            assert.strictEqual(moveEvents[1].editor, inputInactive);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            editorGroupModelChangeListener.dispose();
        });
        test('moveEditor (across groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            group.moveEditor(inputInactive, rightGroup, { index: 0 });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(rightGroup.count, 1);
            assert.strictEqual(rightGroup.getEditorByIndex(0), inputInactive);
        });
        test('moveEditors (across groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input1, options: { pinned: true } }, { editor: input2, options: { pinned: true } }, { editor: input3, options: { pinned: true } }]);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            group.moveEditors([{ editor: input2 }, { editor: input3 }], rightGroup);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(rightGroup.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(rightGroup.getEditorByIndex(0), input2);
            assert.strictEqual(rightGroup.getEditorByIndex(1), input3);
        });
        test('copyEditor (across groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            group.copyEditor(inputInactive, rightGroup, { index: 0 });
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.getEditorByIndex(0), input);
            assert.strictEqual(group.getEditorByIndex(1), inputInactive);
            assert.strictEqual(rightGroup.count, 1);
            assert.strictEqual(rightGroup.getEditorByIndex(0), inputInactive);
        });
        test('copyEditors (across groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input1, options: { pinned: true } }, { editor: input2, options: { pinned: true } }, { editor: input3, options: { pinned: true } }]);
            assert.strictEqual(group.getEditorByIndex(0), input1);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input3);
            group.copyEditors([{ editor: input1 }, { editor: input2 }, { editor: input3 }], rightGroup);
            [group, rightGroup].forEach(group => {
                assert.strictEqual(group.getEditorByIndex(0), input1);
                assert.strictEqual(group.getEditorByIndex(1), input2);
                assert.strictEqual(group.getEditorByIndex(2), input3);
            });
        });
        test('replaceEditors', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), input);
            await group.replaceEditors([{ editor: input, replacement: inputInactive }]);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), inputInactive);
        });
        test('replaceEditors - dirty editor handling', async () => {
            const [part, instantiationService] = await createPart();
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            const group = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input1);
            assert.strictEqual(group.activeEditor, input1);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            await group.replaceEditors([{ editor: input1, replacement: input2 }]);
            assert.strictEqual(group.activeEditor, input1);
            assert.ok(!input1.gotDisposed);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            await group.replaceEditors([{ editor: input1, replacement: input2 }]);
            assert.strictEqual(group.activeEditor, input2);
            assert.ok(input1.gotDisposed);
        });
        test('replaceEditors - forceReplaceDirty flag', async () => {
            const [part, instantiationService] = await createPart();
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            const group = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input1);
            assert.strictEqual(group.activeEditor, input1);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            await group.replaceEditors([{ editor: input1, replacement: input2, forceReplaceDirty: false }]);
            assert.strictEqual(group.activeEditor, input1);
            assert.ok(!input1.gotDisposed);
            await group.replaceEditors([{ editor: input1, replacement: input2, forceReplaceDirty: true }]);
            assert.strictEqual(group.activeEditor, input2);
            assert.ok(input1.gotDisposed);
        });
        test('replaceEditors - proper index handling', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            const input4 = createTestFileEditorInput(uri_1.URI.file('foo/bar4'), TEST_EDITOR_INPUT_ID);
            const input5 = createTestFileEditorInput(uri_1.URI.file('foo/bar5'), TEST_EDITOR_INPUT_ID);
            const input6 = createTestFileEditorInput(uri_1.URI.file('foo/bar6'), TEST_EDITOR_INPUT_ID);
            const input7 = createTestFileEditorInput(uri_1.URI.file('foo/bar7'), TEST_EDITOR_INPUT_ID);
            const input8 = createTestFileEditorInput(uri_1.URI.file('foo/bar8'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input1, { pinned: true });
            await group.openEditor(input2, { pinned: true });
            await group.openEditor(input3, { pinned: true });
            await group.openEditor(input4, { pinned: true });
            await group.openEditor(input5, { pinned: true });
            await group.replaceEditors([
                { editor: input1, replacement: input6 },
                { editor: input3, replacement: input7 },
                { editor: input5, replacement: input8 }
            ]);
            assert.strictEqual(group.getEditorByIndex(0), input6);
            assert.strictEqual(group.getEditorByIndex(1), input2);
            assert.strictEqual(group.getEditorByIndex(2), input7);
            assert.strictEqual(group.getEditorByIndex(3), input4);
            assert.strictEqual(group.getEditorByIndex(4), input8);
        });
        test('replaceEditors - should be able to replace when side by side editor is involved with same input side by side', async () => {
            const [part, instantiationService] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, input, input);
            await group.openEditor(input);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), input);
            await group.replaceEditors([{ editor: input, replacement: sideBySideInput }]);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), sideBySideInput);
            await group.replaceEditors([{ editor: sideBySideInput, replacement: input }]);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditorByIndex(0), input);
        });
        test('find editors', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            const group2 = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            assert.strictEqual(group.isEmpty, true);
            const input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), `${TEST_EDITOR_INPUT_ID}-1`);
            const input3 = createTestFileEditorInput(uri_1.URI.file('foo/bar3'), TEST_EDITOR_INPUT_ID);
            const input4 = createTestFileEditorInput(uri_1.URI.file('foo/bar4'), TEST_EDITOR_INPUT_ID);
            const input5 = createTestFileEditorInput(uri_1.URI.file('foo/bar4'), `${TEST_EDITOR_INPUT_ID}-1`);
            await group.openEditor(input1, { pinned: true });
            await group.openEditor(input2, { pinned: true });
            await group.openEditor(input3, { pinned: true });
            await group.openEditor(input4, { pinned: true });
            await group2.openEditor(input5, { pinned: true });
            let foundEditors = group.findEditors(uri_1.URI.file('foo/bar1'));
            assert.strictEqual(foundEditors.length, 2);
            foundEditors = group2.findEditors(uri_1.URI.file('foo/bar4'));
            assert.strictEqual(foundEditors.length, 1);
        });
        test('find editors (side by side support)', async () => {
            const [part, instantiationService] = await createPart();
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const secondaryInput = createTestFileEditorInput(uri_1.URI.file('foo/bar-secondary'), TEST_EDITOR_INPUT_ID);
            const primaryInput = createTestFileEditorInput(uri_1.URI.file('foo/bar-primary'), `${TEST_EDITOR_INPUT_ID}-1`);
            const sideBySideEditor = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, secondaryInput, primaryInput, accessor.editorService);
            await group.openEditor(sideBySideEditor, { pinned: true });
            let foundEditors = group.findEditors(uri_1.URI.file('foo/bar-secondary'));
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = group.findEditors(uri_1.URI.file('foo/bar-secondary'), { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = group.findEditors(uri_1.URI.file('foo/bar-primary'), { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = group.findEditors(uri_1.URI.file('foo/bar-secondary'), { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = group.findEditors(uri_1.URI.file('foo/bar-primary'), { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = group.findEditors(uri_1.URI.file('foo/bar-secondary'), { supportSideBySide: editor_1.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = group.findEditors(uri_1.URI.file('foo/bar-primary'), { supportSideBySide: editor_1.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
        });
        test('find neighbour group (left/right)', async function () {
            const [part] = await createPart();
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            assert.strictEqual(rightGroup, part.findGroup({ direction: 3 /* GroupDirection.RIGHT */ }, rootGroup));
            assert.strictEqual(rootGroup, part.findGroup({ direction: 2 /* GroupDirection.LEFT */ }, rightGroup));
        });
        test('find neighbour group (up/down)', async function () {
            const [part] = await createPart();
            const rootGroup = part.activeGroup;
            const downGroup = part.addGroup(rootGroup, 1 /* GroupDirection.DOWN */);
            assert.strictEqual(downGroup, part.findGroup({ direction: 1 /* GroupDirection.DOWN */ }, rootGroup));
            assert.strictEqual(rootGroup, part.findGroup({ direction: 0 /* GroupDirection.UP */ }, downGroup));
        });
        test('find group by location (left/right)', async function () {
            const [part] = await createPart();
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const downGroup = part.addGroup(rightGroup, 1 /* GroupDirection.DOWN */);
            assert.strictEqual(rootGroup, part.findGroup({ location: 0 /* GroupLocation.FIRST */ }));
            assert.strictEqual(downGroup, part.findGroup({ location: 1 /* GroupLocation.LAST */ }));
            assert.strictEqual(rightGroup, part.findGroup({ location: 2 /* GroupLocation.NEXT */ }, rootGroup));
            assert.strictEqual(rootGroup, part.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, rightGroup));
            assert.strictEqual(downGroup, part.findGroup({ location: 2 /* GroupLocation.NEXT */ }, rightGroup));
            assert.strictEqual(rightGroup, part.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, downGroup));
        });
        test('applyLayout (2x2)', async function () {
            const [part] = await createPart();
            part.applyLayout({ groups: [{ groups: [{}, {}] }, { groups: [{}, {}] }], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
            assert.strictEqual(part.groups.length, 4);
        });
        test('getLayout', async function () {
            const [part] = await createPart();
            // 2x2
            part.applyLayout({ groups: [{ groups: [{}, {}] }, { groups: [{}, {}] }], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
            let layout = part.getLayout();
            assert.strictEqual(layout.orientation, 0 /* GroupOrientation.HORIZONTAL */);
            assert.strictEqual(layout.groups.length, 2);
            assert.strictEqual(layout.groups[0].groups.length, 2);
            assert.strictEqual(layout.groups[1].groups.length, 2);
            // 3 columns
            part.applyLayout({ groups: [{}, {}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
            layout = part.getLayout();
            assert.strictEqual(layout.orientation, 1 /* GroupOrientation.VERTICAL */);
            assert.strictEqual(layout.groups.length, 3);
            assert.ok(typeof layout.groups[0].size === 'number');
            assert.ok(typeof layout.groups[1].size === 'number');
            assert.ok(typeof layout.groups[2].size === 'number');
        });
        test('centeredLayout', async function () {
            const [part] = await createPart();
            part.centerLayout(true);
            assert.strictEqual(part.isLayoutCentered(), true);
        });
        test('sticky editors', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.stickyCount, 0);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true }).length, 0);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputInactive, { inactive: true });
            assert.strictEqual(group.stickyCount, 0);
            assert.strictEqual(group.isSticky(input), false);
            assert.strictEqual(group.isSticky(inputInactive), false);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 2);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true }).length, 2);
            group.stickEditor(input);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(input), true);
            assert.strictEqual(group.isSticky(inputInactive), false);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true }).length, 1);
            group.unstickEditor(input);
            assert.strictEqual(group.stickyCount, 0);
            assert.strictEqual(group.isSticky(input), false);
            assert.strictEqual(group.isSticky(inputInactive), false);
            assert.strictEqual(group.getIndexOfEditor(input), 0);
            assert.strictEqual(group.getIndexOfEditor(inputInactive), 1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 2);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true }).length, 2);
            let editorMoveCounter = 0;
            const editorGroupModelChangeListener = group.onDidModelChange(e => {
                if (e.kind === 6 /* GroupModelChangeKind.EDITOR_MOVE */) {
                    assert.ok(e.editor);
                    editorMoveCounter++;
                }
            });
            group.stickEditor(inputInactive);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(input), false);
            assert.strictEqual(group.isSticky(inputInactive), true);
            assert.strictEqual(group.getIndexOfEditor(input), 1);
            assert.strictEqual(group.getIndexOfEditor(inputInactive), 0);
            assert.strictEqual(editorMoveCounter, 1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true }).length, 1);
            const inputSticky = createTestFileEditorInput(uri_1.URI.file('foo/bar/sticky'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(inputSticky, { sticky: true });
            assert.strictEqual(group.stickyCount, 2);
            assert.strictEqual(group.isSticky(input), false);
            assert.strictEqual(group.isSticky(inputInactive), true);
            assert.strictEqual(group.isSticky(inputSticky), true);
            assert.strictEqual(group.getIndexOfEditor(inputInactive), 0);
            assert.strictEqual(group.getIndexOfEditor(inputSticky), 1);
            assert.strictEqual(group.getIndexOfEditor(input), 2);
            await group.openEditor(input, { sticky: true });
            assert.strictEqual(group.stickyCount, 3);
            assert.strictEqual(group.isSticky(input), true);
            assert.strictEqual(group.isSticky(inputInactive), true);
            assert.strictEqual(group.isSticky(inputSticky), true);
            assert.strictEqual(group.getIndexOfEditor(inputInactive), 0);
            assert.strictEqual(group.getIndexOfEditor(inputSticky), 1);
            assert.strictEqual(group.getIndexOfEditor(input), 2);
            editorGroupModelChangeListener.dispose();
        });
        test('sticky: true wins over index', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.stickyCount, 0);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            const inputSticky = createTestFileEditorInput(uri_1.URI.file('foo/bar/sticky'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputInactive, { inactive: true });
            await group.openEditor(inputSticky, { sticky: true, index: 2 });
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(inputSticky), true);
            assert.strictEqual(group.getIndexOfEditor(input), 1);
            assert.strictEqual(group.getIndexOfEditor(inputInactive), 2);
            assert.strictEqual(group.getIndexOfEditor(inputSticky), 0);
        });
        test('moveEditor with context (across groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            const thirdInput = createTestFileEditorInput(uri_1.URI.file('foo/bar/third'), TEST_EDITOR_INPUT_ID);
            let leftFiredCount = 0;
            const leftGroupListener = group.onWillMoveEditor(() => {
                leftFiredCount++;
            });
            let rightFiredCount = 0;
            const rightGroupListener = rightGroup.onWillMoveEditor(() => {
                rightFiredCount++;
            });
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }, { editor: thirdInput }]);
            assert.strictEqual(leftFiredCount, 0);
            assert.strictEqual(rightFiredCount, 0);
            let result = group.moveEditor(input, rightGroup);
            assert.strictEqual(result, true);
            assert.strictEqual(leftFiredCount, 1);
            assert.strictEqual(rightFiredCount, 0);
            result = group.moveEditor(inputInactive, rightGroup);
            assert.strictEqual(result, true);
            assert.strictEqual(leftFiredCount, 2);
            assert.strictEqual(rightFiredCount, 0);
            result = rightGroup.moveEditor(inputInactive, group);
            assert.strictEqual(result, true);
            assert.strictEqual(leftFiredCount, 2);
            assert.strictEqual(rightFiredCount, 1);
            leftGroupListener.dispose();
            rightGroupListener.dispose();
        });
        test('moveEditor disabled', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            const thirdInput = createTestFileEditorInput(uri_1.URI.file('foo/bar/third'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }, { editor: thirdInput }]);
            input.setMoveDisabled('disabled');
            const result = group.moveEditor(input, rightGroup);
            assert.strictEqual(result, false);
            assert.strictEqual(group.count, 3);
        });
        test('onWillOpenEditor', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const secondInput = createTestFileEditorInput(uri_1.URI.file('foo/bar/second'), TEST_EDITOR_INPUT_ID);
            const thirdInput = createTestFileEditorInput(uri_1.URI.file('foo/bar/third'), TEST_EDITOR_INPUT_ID);
            let leftFiredCount = 0;
            const leftGroupListener = group.onWillOpenEditor(() => {
                leftFiredCount++;
            });
            let rightFiredCount = 0;
            const rightGroupListener = rightGroup.onWillOpenEditor(() => {
                rightFiredCount++;
            });
            await group.openEditor(input);
            assert.strictEqual(leftFiredCount, 1);
            assert.strictEqual(rightFiredCount, 0);
            rightGroup.openEditor(secondInput);
            assert.strictEqual(leftFiredCount, 1);
            assert.strictEqual(rightFiredCount, 1);
            group.openEditor(thirdInput);
            assert.strictEqual(leftFiredCount, 2);
            assert.strictEqual(rightFiredCount, 1);
            // Ensure move fires the open event too
            rightGroup.moveEditor(secondInput, group);
            assert.strictEqual(leftFiredCount, 3);
            assert.strictEqual(rightFiredCount, 1);
            leftGroupListener.dispose();
            rightGroupListener.dispose();
        });
        test('copyEditor with context (across groups)', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            let firedCount = 0;
            const moveListener = group.onWillMoveEditor(() => firedCount++);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputInactive = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditors([{ editor: input, options: { pinned: true } }, { editor: inputInactive }]);
            assert.strictEqual(firedCount, 0);
            group.copyEditor(inputInactive, rightGroup, { index: 0 });
            assert.strictEqual(firedCount, 0);
            moveListener.dispose();
        });
        test('locked groups - basics', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            let leftFiredCountFromPart = 0;
            let rightFiredCountFromPart = 0;
            const partListener = part.onDidChangeGroupLocked(g => {
                if (g === group) {
                    leftFiredCountFromPart++;
                }
                else if (g === rightGroup) {
                    rightFiredCountFromPart++;
                }
            });
            let leftFiredCountFromGroup = 0;
            const leftGroupListener = group.onDidModelChange(e => {
                if (e.kind === 3 /* GroupModelChangeKind.GROUP_LOCKED */) {
                    leftFiredCountFromGroup++;
                }
            });
            let rightFiredCountFromGroup = 0;
            const rightGroupListener = rightGroup.onDidModelChange(e => {
                if (e.kind === 3 /* GroupModelChangeKind.GROUP_LOCKED */) {
                    rightFiredCountFromGroup++;
                }
            });
            rightGroup.lock(true);
            rightGroup.lock(true);
            assert.strictEqual(leftFiredCountFromGroup, 0);
            assert.strictEqual(leftFiredCountFromPart, 0);
            assert.strictEqual(rightFiredCountFromGroup, 1);
            assert.strictEqual(rightFiredCountFromPart, 1);
            rightGroup.lock(false);
            rightGroup.lock(false);
            assert.strictEqual(leftFiredCountFromGroup, 0);
            assert.strictEqual(leftFiredCountFromPart, 0);
            assert.strictEqual(rightFiredCountFromGroup, 2);
            assert.strictEqual(rightFiredCountFromPart, 2);
            group.lock(true);
            group.lock(true);
            assert.strictEqual(leftFiredCountFromGroup, 1);
            assert.strictEqual(leftFiredCountFromPart, 1);
            assert.strictEqual(rightFiredCountFromGroup, 2);
            assert.strictEqual(rightFiredCountFromPart, 2);
            group.lock(false);
            group.lock(false);
            assert.strictEqual(leftFiredCountFromGroup, 2);
            assert.strictEqual(leftFiredCountFromPart, 2);
            assert.strictEqual(rightFiredCountFromGroup, 2);
            assert.strictEqual(rightFiredCountFromPart, 2);
            partListener.dispose();
            leftGroupListener.dispose();
            rightGroupListener.dispose();
        });
        test('locked groups - single group is can be locked', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            group.lock(true);
            assert.strictEqual(group.isLocked, true);
            const rightGroup = part.addGroup(group, 3 /* GroupDirection.RIGHT */);
            rightGroup.lock(true);
            assert.strictEqual(rightGroup.isLocked, true);
            part.removeGroup(group);
            assert.strictEqual(rightGroup.isLocked, true);
            const rightGroup2 = part.addGroup(rightGroup, 3 /* GroupDirection.RIGHT */);
            rightGroup.lock(true);
            rightGroup2.lock(true);
            assert.strictEqual(rightGroup.isLocked, true);
            assert.strictEqual(rightGroup2.isLocked, true);
            part.removeGroup(rightGroup2);
            assert.strictEqual(rightGroup.isLocked, true);
        });
        test('locked groups - auto locking via setting', async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('workbench', { 'editor': { 'autoLockGroups': { 'testEditorInputForEditorGroupService': true } } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            const [part] = await createPart(instantiationService);
            const rootGroup = part.activeGroup;
            let rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            let input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            let input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            // First editor opens in right group: Locked=true
            await rightGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(rightGroup.isLocked, true);
            // Second editors opens in now unlocked right group: Locked=false
            rightGroup.lock(false);
            await rightGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(rightGroup.isLocked, false);
            //First editor opens in root group without other groups being opened: Locked=false
            await rightGroup.closeAllEditors();
            part.removeGroup(rightGroup);
            await rootGroup.closeAllEditors();
            input1 = createTestFileEditorInput(uri_1.URI.file('foo/bar1'), TEST_EDITOR_INPUT_ID);
            input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await rootGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(rootGroup.isLocked, false);
            rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            assert.strictEqual(rootGroup.isLocked, false);
            const leftGroup = part.addGroup(rootGroup, 2 /* GroupDirection.LEFT */);
            assert.strictEqual(rootGroup.isLocked, false);
            part.removeGroup(leftGroup);
            assert.strictEqual(rootGroup.isLocked, false);
        });
        test('maximize editor group', async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const [part] = await createPart(instantiationService);
            const rootGroup = part.activeGroup;
            const editorPartSize = part.getSize(rootGroup);
            // If there is only one group, it should not be considered maximized
            assert.strictEqual(part.hasMaximizedGroup(), false);
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const rightBottomGroup = part.addGroup(rightGroup, 1 /* GroupDirection.DOWN */);
            const sizeRootGroup = part.getSize(rootGroup);
            const sizeRightGroup = part.getSize(rightGroup);
            const sizeRightBottomGroup = part.getSize(rightBottomGroup);
            let maximizedValue;
            const maxiizeGroupEventDisposable = part.onDidChangeGroupMaximized((maximized) => {
                maximizedValue = maximized;
            });
            assert.strictEqual(part.hasMaximizedGroup(), false);
            part.arrangeGroups(0 /* GroupsArrangement.MAXIMIZE */, rootGroup);
            assert.strictEqual(part.hasMaximizedGroup(), true);
            // getSize()
            assert.deepStrictEqual(part.getSize(rootGroup), editorPartSize);
            assert.deepStrictEqual(part.getSize(rightGroup), { width: 0, height: 0 });
            assert.deepStrictEqual(part.getSize(rightBottomGroup), { width: 0, height: 0 });
            assert.deepStrictEqual(maximizedValue, true);
            part.toggleMaximizeGroup();
            assert.strictEqual(part.hasMaximizedGroup(), false);
            // Size is restored
            assert.deepStrictEqual(part.getSize(rootGroup), sizeRootGroup);
            assert.deepStrictEqual(part.getSize(rightGroup), sizeRightGroup);
            assert.deepStrictEqual(part.getSize(rightBottomGroup), sizeRightBottomGroup);
            assert.deepStrictEqual(maximizedValue, false);
            maxiizeGroupEventDisposable.dispose();
        });
        test('transient editors - basics', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputTransient = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputTransient, { transient: true });
            assert.strictEqual(group.isTransient(input), false);
            assert.strictEqual(group.isTransient(inputTransient), true);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputTransient, { transient: true });
            assert.strictEqual(group.isTransient(inputTransient), true);
            await group.openEditor(inputTransient, { transient: false });
            assert.strictEqual(group.isTransient(inputTransient), false);
            await group.openEditor(inputTransient, { transient: true });
            assert.strictEqual(group.isTransient(inputTransient), false); // cannot make a non-transient editor transient when already opened
        });
        test('transient editors - pinning clears transient', async () => {
            const [part] = await createPart();
            const group = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const inputTransient = createTestFileEditorInput(uri_1.URI.file('foo/bar/inactive'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputTransient, { transient: true });
            assert.strictEqual(group.isTransient(input), false);
            assert.strictEqual(group.isTransient(inputTransient), true);
            await group.openEditor(input, { pinned: true });
            await group.openEditor(inputTransient, { pinned: true, transient: true });
            assert.strictEqual(group.isTransient(inputTransient), false);
        });
        test('transient editors - overrides enablePreview setting', async function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('workbench', { 'editor': { 'enablePreview': false } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            const [part] = await createPart(instantiationService);
            const group = part.activeGroup;
            assert.strictEqual(group.isEmpty, true);
            const input = createTestFileEditorInput(uri_1.URI.file('foo/bar'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.file('foo/bar2'), TEST_EDITOR_INPUT_ID);
            await group.openEditor(input, { pinned: false });
            assert.strictEqual(group.isPinned(input), true);
            await group.openEditor(input2, { transient: true });
            assert.strictEqual(group.isPinned(input2), false);
            group.focus();
            assert.strictEqual(group.isPinned(input2), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBzU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9lZGl0b3JHcm91cHNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsTUFBTSxjQUFjLEdBQUcsbUNBQW1DLENBQUM7UUFDM0QsTUFBTSxvQkFBb0IsR0FBRyxzQ0FBc0MsQ0FBQztRQUVwRSxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxJQUFJLDZCQUE2QixHQUEwQyxTQUFTLENBQUM7UUFFckYsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSwwQ0FBa0IsRUFBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLDRCQUFjLENBQUMsMkNBQW1CLENBQUMsRUFBRSxJQUFJLDRCQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUNqSyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNuQixJQUFJLDZCQUE2QixFQUFFLENBQUM7Z0JBQ25DLE1BQU0sSUFBQSx5Q0FBaUIsRUFBQyw2QkFBNkIsQ0FBQyxDQUFDO2dCQUN2RCw2QkFBNkIsR0FBRyxTQUFTLENBQUM7WUFDM0MsQ0FBQztZQUVELFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssVUFBVSxVQUFVLENBQUMsb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDO1lBQ3JH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QU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxVQUFVLDhCQUFzQixDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1B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QUFDO1lBRTNDLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDbkgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNDLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDakgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNDLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDN0csTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNDLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDM0csTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUs7WUFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sVUFBVSxFQUFFLENBQUM7WUFDbEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNuQyxNQUFNLFVBQVUsR0FB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