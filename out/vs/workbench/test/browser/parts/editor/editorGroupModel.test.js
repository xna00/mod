/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/common/editor", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/workspace/common/workspace", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/common/editor/diffEditorInput", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/resources", "vs/base/test/common/utils"], function (require, exports, assert, editorGroupModel_1, editor_1, uri_1, workbenchTestServices_1, testConfigurationService_1, instantiationServiceMock_1, configuration_1, lifecycle_1, workspace_1, platform_1, telemetry_1, telemetryUtils_1, diffEditorInput_1, storage_1, lifecycle_2, workbenchTestServices_2, editorInput_1, sideBySideEditorInput_1, resources_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorGroupModel', () => {
        let testInstService;
        suiteTeardown(() => {
            testInstService?.dispose();
            testInstService = undefined;
        });
        function inst() {
            if (!testInstService) {
                testInstService = new instantiationServiceMock_1.TestInstantiationService();
            }
            const inst = testInstService;
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(lifecycle_1.ILifecycleService, disposables.add(new workbenchTestServices_1.TestLifecycleService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right', focusRecentEditorAfterClose: true } });
            inst.stub(configuration_1.IConfigurationService, config);
            return inst;
        }
        function createEditorGroupModel(serialized) {
            const group = disposables.add(inst().createInstance(editorGroupModel_1.EditorGroupModel, serialized));
            disposables.add((0, lifecycle_2.toDisposable)(() => {
                for (const editor of group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    group.closeEditor(editor);
                }
            }));
            return group;
        }
        function closeAllEditors(group) {
            for (const editor of group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)) {
                group.closeEditor(editor, undefined, false);
            }
        }
        function closeEditors(group, except, direction) {
            const index = group.indexOf(except);
            if (index === -1) {
                return; // not found
            }
            // Close to the left
            if (direction === 0 /* CloseDirection.LEFT */) {
                for (let i = index - 1; i >= 0; i--) {
                    group.closeEditor(group.getEditorByIndex(i));
                }
            }
            // Close to the right
            else if (direction === 1 /* CloseDirection.RIGHT */) {
                for (let i = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length - 1; i > index; i--) {
                    group.closeEditor(group.getEditorByIndex(i));
                }
            }
            // Both directions
            else {
                group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).filter(editor => !editor.matches(except)).forEach(editor => group.closeEditor(editor));
            }
        }
        function groupListener(group) {
            const groupEvents = {
                active: [],
                index: [],
                label: [],
                locked: [],
                opened: [],
                closed: [],
                activated: [],
                pinned: [],
                unpinned: [],
                sticky: [],
                unsticky: [],
                moved: [],
                disposed: []
            };
            disposables.add(group.onDidModelChange(e => {
                if (e.kind === 3 /* GroupModelChangeKind.GROUP_LOCKED */) {
                    groupEvents.locked.push(group.id);
                    return;
                }
                else if (e.kind === 0 /* GroupModelChangeKind.GROUP_ACTIVE */) {
                    groupEvents.active.push(group.id);
                    return;
                }
                else if (e.kind === 1 /* GroupModelChangeKind.GROUP_INDEX */) {
                    groupEvents.index.push(group.id);
                    return;
                }
                else if (e.kind === 2 /* GroupModelChangeKind.GROUP_LABEL */) {
                    groupEvents.label.push(group.id);
                    return;
                }
                if (!e.editor) {
                    return;
                }
                switch (e.kind) {
                    case 4 /* GroupModelChangeKind.EDITOR_OPEN */:
                        if ((0, editorGroupModel_1.isGroupEditorOpenEvent)(e)) {
                            groupEvents.opened.push(e);
                        }
                        break;
                    case 5 /* GroupModelChangeKind.EDITOR_CLOSE */:
                        if ((0, editorGroupModel_1.isGroupEditorCloseEvent)(e)) {
                            groupEvents.closed.push(e);
                        }
                        break;
                    case 7 /* GroupModelChangeKind.EDITOR_ACTIVE */:
                        if ((0, editorGroupModel_1.isGroupEditorChangeEvent)(e)) {
                            groupEvents.activated.push(e);
                        }
                        break;
                    case 10 /* GroupModelChangeKind.EDITOR_PIN */:
                        if ((0, editorGroupModel_1.isGroupEditorChangeEvent)(e)) {
                            group.isPinned(e.editor) ? groupEvents.pinned.push(e) : groupEvents.unpinned.push(e);
                        }
                        break;
                    case 12 /* GroupModelChangeKind.EDITOR_STICKY */:
                        if ((0, editorGroupModel_1.isGroupEditorChangeEvent)(e)) {
                            group.isSticky(e.editor) ? groupEvents.sticky.push(e) : groupEvents.unsticky.push(e);
                        }
                        break;
                    case 6 /* GroupModelChangeKind.EDITOR_MOVE */:
                        if ((0, editorGroupModel_1.isGroupEditorMoveEvent)(e)) {
                            groupEvents.moved.push(e);
                        }
                        break;
                    case 14 /* GroupModelChangeKind.EDITOR_WILL_DISPOSE */:
                        if ((0, editorGroupModel_1.isGroupEditorChangeEvent)(e)) {
                            groupEvents.disposed.push(e);
                        }
                        break;
                }
            }));
            return groupEvents;
        }
        let index = 0;
        class TestEditorInput extends editorInput_1.EditorInput {
            constructor(id) {
                super();
                this.id = id;
                this.resource = undefined;
            }
            get typeId() { return 'testEditorInputForGroups'; }
            async resolve() { return null; }
            matches(other) {
                return other && this.id === other.id && other instanceof TestEditorInput;
            }
            setDirty() {
                this._onDidChangeDirty.fire();
            }
            setLabel() {
                this._onDidChangeLabel.fire();
            }
        }
        class NonSerializableTestEditorInput extends editorInput_1.EditorInput {
            constructor(id) {
                super();
                this.id = id;
                this.resource = undefined;
            }
            get typeId() { return 'testEditorInputForGroups-nonSerializable'; }
            async resolve() { return null; }
            matches(other) {
                return other && this.id === other.id && other instanceof NonSerializableTestEditorInput;
            }
        }
        class TestFileEditorInput extends editorInput_1.EditorInput {
            constructor(id, resource) {
                super();
                this.id = id;
                this.resource = resource;
                this.preferredResource = this.resource;
            }
            get typeId() { return 'testFileEditorInputForGroups'; }
            get editorId() { return this.id; }
            async resolve() { return null; }
            setPreferredName(name) { }
            setPreferredDescription(description) { }
            setPreferredResource(resource) { }
            async setEncoding(encoding) { }
            getEncoding() { return undefined; }
            setPreferredEncoding(encoding) { }
            setForceOpenAsBinary() { }
            setPreferredContents(contents) { }
            setLanguageId(languageId) { }
            setPreferredLanguageId(languageId) { }
            isResolved() { return false; }
            matches(other) {
                if (super.matches(other)) {
                    return true;
                }
                if (other instanceof TestFileEditorInput) {
                    return (0, resources_1.isEqual)(other.resource, this.resource);
                }
                return false;
            }
        }
        function input(id = String(index++), nonSerializable, resource) {
            if (resource) {
                return disposables.add(new TestFileEditorInput(id, resource));
            }
            return nonSerializable ? disposables.add(new NonSerializableTestEditorInput(id)) : disposables.add(new TestEditorInput(id));
        }
        class TestEditorInputSerializer {
            static { this.disableSerialize = false; }
            static { this.disableDeserialize = false; }
            canSerialize(editorInput) {
                return true;
            }
            serialize(editorInput) {
                if (TestEditorInputSerializer.disableSerialize) {
                    return undefined;
                }
                const testEditorInput = editorInput;
                const testInput = {
                    id: testEditorInput.id
                };
                return JSON.stringify(testInput);
            }
            deserialize(instantiationService, serializedEditorInput) {
                if (TestEditorInputSerializer.disableDeserialize) {
                    return undefined;
                }
                const testInput = JSON.parse(serializedEditorInput);
                return disposables.add(new TestEditorInput(testInput.id));
            }
        }
        const disposables = new lifecycle_2.DisposableStore();
        setup(() => {
            TestEditorInputSerializer.disableSerialize = false;
            TestEditorInputSerializer.disableDeserialize = false;
            disposables.add(platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer('testEditorInputForGroups', TestEditorInputSerializer));
        });
        teardown(() => {
            disposables.clear();
            index = 1;
        });
        test('Clone Group', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            // Pinned and Active
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            // Sticky
            group.stick(input2);
            assert.ok(group.isSticky(input2));
            // Locked
            assert.strictEqual(group.isLocked, false);
            group.lock(true);
            assert.strictEqual(group.isLocked, true);
            const clone = disposables.add(group.clone());
            assert.notStrictEqual(group.id, clone.id);
            assert.strictEqual(clone.count, 3);
            assert.strictEqual(clone.isLocked, false); // locking does not clone over
            let didEditorLabelChange = false;
            const toDispose = clone.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    didEditorLabelChange = true;
                }
            });
            input1.setLabel();
            assert.ok(didEditorLabelChange);
            assert.strictEqual(clone.isPinned(input1), true);
            assert.strictEqual(clone.isActive(input1), false);
            assert.strictEqual(clone.isSticky(input1), false);
            assert.strictEqual(clone.isPinned(input2), true);
            assert.strictEqual(clone.isActive(input2), false);
            assert.strictEqual(clone.isSticky(input2), true);
            assert.strictEqual(clone.isPinned(input3), false);
            assert.strictEqual(clone.isActive(input3), true);
            assert.strictEqual(clone.isSticky(input3), false);
            toDispose.dispose();
        });
        test('isActive - untyped', () => {
            const group = createEditorGroupModel();
            const input = disposables.add(new TestFileEditorInput('testInput', uri_1.URI.file('fake')));
            const input2 = disposables.add(new TestFileEditorInput('testInput2', uri_1.URI.file('fake2')));
            const untypedInput = { resource: uri_1.URI.file('/fake'), options: { override: 'testInput' } };
            const untypedNonActiveInput = { resource: uri_1.URI.file('/fake2'), options: { override: 'testInput2' } };
            group.openEditor(input, { pinned: true, active: true });
            group.openEditor(input2, { active: false });
            assert.ok(group.isActive(input));
            assert.ok(group.isActive(untypedInput));
            assert.ok(!group.isActive(untypedNonActiveInput));
        });
        test('openEditor - prefers existing side by side editor if same', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const group = createEditorGroupModel();
            const input1 = disposables.add(new TestFileEditorInput('testInput', uri_1.URI.file('fake1')));
            const input2 = disposables.add(new TestFileEditorInput('testInput', uri_1.URI.file('fake2')));
            const sideBySideInputSame = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, input1, input1);
            const sideBySideInputDifferent = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, input1, input2);
            let res = group.openEditor(sideBySideInputSame, { pinned: true, active: true });
            assert.strictEqual(res.editor, sideBySideInputSame);
            assert.strictEqual(res.isNew, true);
            res = group.openEditor(input1, { pinned: true, active: true, supportSideBySide: editor_1.SideBySideEditor.BOTH });
            assert.strictEqual(res.editor, sideBySideInputSame);
            assert.strictEqual(res.isNew, false);
            group.closeEditor(sideBySideInputSame);
            res = group.openEditor(sideBySideInputDifferent, { pinned: true, active: true });
            assert.strictEqual(res.editor, sideBySideInputDifferent);
            assert.strictEqual(res.isNew, true);
            res = group.openEditor(input1, { pinned: true, active: true });
            assert.strictEqual(res.editor, input1);
            assert.strictEqual(res.isNew, true);
        });
        test('indexOf() - prefers direct matching editor over side by side matching one', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const group = createEditorGroupModel();
            const input1 = disposables.add(new TestFileEditorInput('testInput', uri_1.URI.file('fake1')));
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, input1, input1);
            group.openEditor(sideBySideInput, { pinned: true, active: true });
            assert.strictEqual(group.indexOf(sideBySideInput), 0);
            assert.strictEqual(group.indexOf(input1), -1);
            assert.strictEqual(group.indexOf(input1, undefined, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), 0);
            assert.strictEqual(group.indexOf(input1, undefined, { supportSideBySide: editor_1.SideBySideEditor.ANY }), 0);
            group.openEditor(input1, { pinned: true, active: true });
            assert.strictEqual(group.indexOf(input1), 1);
            assert.strictEqual(group.indexOf(input1, undefined, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), 1);
            assert.strictEqual(group.indexOf(input1, undefined, { supportSideBySide: editor_1.SideBySideEditor.ANY }), 1);
        });
        test('contains() - untyped', function () {
            const group = createEditorGroupModel();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const input1 = input('input1', false, uri_1.URI.file('/input1'));
            const input2 = input('input2', false, uri_1.URI.file('/input2'));
            const untypedInput1 = { resource: uri_1.URI.file('/input1'), options: { override: 'input1' } };
            const untypedInput2 = { resource: uri_1.URI.file('/input2'), options: { override: 'input2' } };
            const diffInput1 = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input1, input2, undefined);
            const diffInput2 = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input2, input1, undefined);
            const untypedDiffInput1 = {
                original: untypedInput1,
                modified: untypedInput2
            };
            const untypedDiffInput2 = {
                original: untypedInput2,
                modified: untypedInput1
            };
            const sideBySideInputSame = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', undefined, input1, input1);
            const sideBySideInputDifferent = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', undefined, input1, input2);
            const untypedSideBySideInputSame = {
                primary: untypedInput1,
                secondary: untypedInput1
            };
            const untypedSideBySideInputDifferent = {
                primary: untypedInput2,
                secondary: untypedInput1
            };
            group.openEditor(input1, { pinned: true, active: true });
            assert.strictEqual(group.contains(untypedInput1), true);
            assert.strictEqual(group.contains(untypedInput1, { strictEquals: true }), false);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), true);
            assert.strictEqual(group.contains(untypedInput2), false);
            assert.strictEqual(group.contains(untypedInput2, { strictEquals: true }), false);
            assert.strictEqual(group.contains(untypedInput2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), false);
            assert.strictEqual(group.contains(untypedInput2, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), false);
            assert.strictEqual(group.contains(untypedDiffInput1), false);
            assert.strictEqual(group.contains(untypedDiffInput2), false);
            group.openEditor(input2, { pinned: true, active: true });
            assert.strictEqual(group.contains(untypedInput1), true);
            assert.strictEqual(group.contains(untypedInput2), true);
            assert.strictEqual(group.contains(untypedDiffInput1), false);
            assert.strictEqual(group.contains(untypedDiffInput2), false);
            group.openEditor(diffInput1, { pinned: true, active: true });
            assert.strictEqual(group.contains(untypedInput1), true);
            assert.strictEqual(group.contains(untypedInput2), true);
            assert.strictEqual(group.contains(untypedDiffInput1), true);
            assert.strictEqual(group.contains(untypedDiffInput2), false);
            group.openEditor(diffInput2, { pinned: true, active: true });
            assert.strictEqual(group.contains(untypedInput1), true);
            assert.strictEqual(group.contains(untypedInput2), true);
            assert.strictEqual(group.contains(untypedDiffInput1), true);
            assert.strictEqual(group.contains(untypedDiffInput2), true);
            group.closeEditor(input1);
            assert.strictEqual(group.contains(untypedInput1), false);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), false);
            assert.strictEqual(group.contains(untypedInput2), true);
            assert.strictEqual(group.contains(untypedDiffInput1), true);
            assert.strictEqual(group.contains(untypedDiffInput2), true);
            group.closeEditor(input2);
            assert.strictEqual(group.contains(untypedInput1), false);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedInput2), false);
            assert.strictEqual(group.contains(untypedInput2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedDiffInput1), true);
            assert.strictEqual(group.contains(untypedDiffInput2), true);
            group.closeEditor(diffInput1);
            assert.strictEqual(group.contains(untypedInput1), false);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedInput2), false);
            assert.strictEqual(group.contains(untypedInput2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedDiffInput1), false);
            assert.strictEqual(group.contains(untypedDiffInput2), true);
            group.closeEditor(diffInput2);
            assert.strictEqual(group.contains(untypedInput1), false);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), false);
            assert.strictEqual(group.contains(untypedInput2), false);
            assert.strictEqual(group.contains(untypedInput2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), false);
            assert.strictEqual(group.contains(untypedDiffInput1), false);
            assert.strictEqual(group.contains(untypedDiffInput2), false);
            assert.strictEqual(group.count, 0);
            group.openEditor(sideBySideInputSame, { pinned: true, active: true });
            assert.strictEqual(group.contains(untypedSideBySideInputSame), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY, strictEquals: true }), false);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.BOTH, strictEquals: true }), false);
            group.closeEditor(sideBySideInputSame);
            assert.strictEqual(group.count, 0);
            group.openEditor(sideBySideInputDifferent, { pinned: true, active: true });
            assert.strictEqual(group.contains(untypedSideBySideInputDifferent), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(untypedInput1, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), false);
        });
        test('contains()', () => {
            const group = createEditorGroupModel();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const input1 = input();
            const input2 = input();
            const diffInput1 = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input1, input2, undefined);
            const diffInput2 = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input2, input1, undefined);
            const sideBySideInputSame = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', undefined, input1, input1);
            const sideBySideInputDifferent = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', undefined, input1, input2);
            group.openEditor(input1, { pinned: true, active: true });
            assert.strictEqual(group.contains(input1), true);
            assert.strictEqual(group.contains(input1, { strictEquals: true }), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(input2), false);
            assert.strictEqual(group.contains(input2, { strictEquals: true }), false);
            assert.strictEqual(group.contains(input2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), false);
            assert.strictEqual(group.contains(diffInput1), false);
            assert.strictEqual(group.contains(diffInput2), false);
            group.openEditor(input2, { pinned: true, active: true });
            assert.strictEqual(group.contains(input1), true);
            assert.strictEqual(group.contains(input2), true);
            assert.strictEqual(group.contains(diffInput1), false);
            assert.strictEqual(group.contains(diffInput2), false);
            group.openEditor(diffInput1, { pinned: true, active: true });
            assert.strictEqual(group.contains(input1), true);
            assert.strictEqual(group.contains(input2), true);
            assert.strictEqual(group.contains(diffInput1), true);
            assert.strictEqual(group.contains(diffInput2), false);
            group.openEditor(diffInput2, { pinned: true, active: true });
            assert.strictEqual(group.contains(input1), true);
            assert.strictEqual(group.contains(input2), true);
            assert.strictEqual(group.contains(diffInput1), true);
            assert.strictEqual(group.contains(diffInput2), true);
            group.closeEditor(input1);
            assert.strictEqual(group.contains(input1), false);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(input2), true);
            assert.strictEqual(group.contains(diffInput1), true);
            assert.strictEqual(group.contains(diffInput2), true);
            group.closeEditor(input2);
            assert.strictEqual(group.contains(input1), false);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(input2), false);
            assert.strictEqual(group.contains(input2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(diffInput1), true);
            assert.strictEqual(group.contains(diffInput2), true);
            group.closeEditor(diffInput1);
            assert.strictEqual(group.contains(input1), false);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(input2), false);
            assert.strictEqual(group.contains(input2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(diffInput1), false);
            assert.strictEqual(group.contains(diffInput2), true);
            group.closeEditor(diffInput2);
            assert.strictEqual(group.contains(input1), false);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), false);
            assert.strictEqual(group.contains(input2), false);
            assert.strictEqual(group.contains(input2, { supportSideBySide: editor_1.SideBySideEditor.ANY }), false);
            assert.strictEqual(group.contains(diffInput1), false);
            assert.strictEqual(group.contains(diffInput2), false);
            const input3 = input(undefined, true, uri_1.URI.parse('foo://bar'));
            const input4 = input(undefined, true, uri_1.URI.parse('foo://barsomething'));
            group.openEditor(input3, { pinned: true, active: true });
            assert.strictEqual(group.contains(input4), false);
            assert.strictEqual(group.contains(input3), true);
            group.closeEditor(input3);
            assert.strictEqual(group.contains(input3), false);
            assert.strictEqual(group.count, 0);
            group.openEditor(sideBySideInputSame, { pinned: true, active: true });
            assert.strictEqual(group.contains(sideBySideInputSame), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY, strictEquals: true }), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.BOTH, strictEquals: true }), true);
            group.closeEditor(sideBySideInputSame);
            assert.strictEqual(group.count, 0);
            group.openEditor(sideBySideInputDifferent, { pinned: true, active: true });
            assert.strictEqual(group.contains(sideBySideInputDifferent), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY }), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.ANY, strictEquals: true }), true);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.BOTH }), false);
            assert.strictEqual(group.contains(input1, { supportSideBySide: editor_1.SideBySideEditor.BOTH, strictEquals: true }), false);
        });
        test('group serialization', function () {
            inst().invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            // Case 1: inputs can be serialized and deserialized
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            let deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 3);
            assert.strictEqual(deserialized.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 3);
            assert.strictEqual(deserialized.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 3);
            assert.strictEqual(deserialized.isPinned(input1), true);
            assert.strictEqual(deserialized.isPinned(input2), true);
            assert.strictEqual(deserialized.isPinned(input3), false);
            assert.strictEqual(deserialized.isActive(input3), true);
            // Case 2: inputs cannot be serialized
            TestEditorInputSerializer.disableSerialize = true;
            deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 0);
            assert.strictEqual(deserialized.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(deserialized.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            // Case 3: inputs cannot be deserialized
            TestEditorInputSerializer.disableSerialize = false;
            TestEditorInputSerializer.disableDeserialize = true;
            deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 0);
            assert.strictEqual(deserialized.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(deserialized.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
        });
        test('group serialization (sticky editor)', function () {
            inst().invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            // Case 1: inputs can be serialized and deserialized
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            group.stick(input2);
            assert.ok(group.isSticky(input2));
            let deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 3);
            assert.strictEqual(deserialized.isPinned(input1), true);
            assert.strictEqual(deserialized.isActive(input1), false);
            assert.strictEqual(deserialized.isSticky(input1), false);
            assert.strictEqual(deserialized.isPinned(input2), true);
            assert.strictEqual(deserialized.isActive(input2), false);
            assert.strictEqual(deserialized.isSticky(input2), true);
            assert.strictEqual(deserialized.isPinned(input3), false);
            assert.strictEqual(deserialized.isActive(input3), true);
            assert.strictEqual(deserialized.isSticky(input3), false);
            // Case 2: inputs cannot be serialized
            TestEditorInputSerializer.disableSerialize = true;
            deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 0);
            assert.strictEqual(deserialized.stickyCount, 0);
            assert.strictEqual(deserialized.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(deserialized.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            // Case 3: inputs cannot be deserialized
            TestEditorInputSerializer.disableSerialize = false;
            TestEditorInputSerializer.disableDeserialize = true;
            deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 0);
            assert.strictEqual(deserialized.stickyCount, 0);
            assert.strictEqual(deserialized.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(deserialized.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
        });
        test('group serialization (locked group)', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            assert.strictEqual(events.locked.length, 0);
            group.lock(true);
            group.lock(true);
            assert.strictEqual(events.locked.length, 1);
            group.lock(false);
            group.lock(false);
            assert.strictEqual(events.locked.length, 2);
        });
        test('locked group', function () {
            const group = createEditorGroupModel();
            group.lock(true);
            let deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 0);
            assert.strictEqual(deserialized.isLocked, true);
            group.lock(false);
            deserialized = createEditorGroupModel(group.serialize());
            assert.strictEqual(group.id, deserialized.id);
            assert.strictEqual(deserialized.count, 0);
            assert.strictEqual(deserialized.isLocked, false);
        });
        test('index', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            assert.strictEqual(events.index.length, 0);
            group.setIndex(4);
            assert.strictEqual(events.index.length, 1);
        });
        test('label', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            assert.strictEqual(events.label.length, 0);
            group.setLabel('Window 1');
            assert.strictEqual(events.label.length, 1);
        });
        test('active', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            assert.strictEqual(events.active.length, 0);
            group.setActive(undefined);
            assert.strictEqual(events.active.length, 1);
        });
        test('One Editor', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            // Active && Pinned
            const input1 = input();
            const { editor: openedEditor, isNew } = group.openEditor(input1, { active: true, pinned: true });
            assert.strictEqual(openedEditor, input1);
            assert.strictEqual(isNew, true);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(group.findEditor(input1)[0], input1);
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.isActive(input1), true);
            assert.strictEqual(group.isPinned(input1), true);
            assert.strictEqual(group.isPinned(0), true);
            assert.strictEqual(group.isFirst(input1), true);
            assert.strictEqual(group.isLast(input1), true);
            assert.strictEqual(events.opened[0].editor, input1);
            assert.strictEqual(events.opened[0].editorIndex, 0);
            assert.strictEqual(events.activated[0].editor, input1);
            assert.strictEqual(events.activated[0].editorIndex, 0);
            const index = group.indexOf(input1);
            assert.strictEqual(group.findEditor(input1)[1], index);
            let event = group.closeEditor(input1, editor_1.EditorCloseContext.UNPIN);
            assert.strictEqual(event?.editor, input1);
            assert.strictEqual(event?.editorIndex, index);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(group.isFirst(input1), false);
            assert.strictEqual(group.isLast(input1), false);
            assert.strictEqual(events.closed[0].editor, input1);
            assert.strictEqual(events.closed[0].editorIndex, 0);
            assert.strictEqual(events.closed[0].context === editor_1.EditorCloseContext.UNPIN, true);
            // Active && Preview
            const input2 = input();
            group.openEditor(input2, { active: true, pinned: false });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(group.activeEditor, input2);
            assert.strictEqual(group.isActive(input2), true);
            assert.strictEqual(group.isPinned(input2), false);
            assert.strictEqual(group.isPinned(0), false);
            assert.strictEqual(events.opened[1].editor, input2);
            assert.strictEqual(events.opened[1].editorIndex, 0);
            assert.strictEqual(events.activated[1].editor, input2);
            assert.strictEqual(events.activated[1].editorIndex, 0);
            group.closeEditor(input2);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(events.closed[1].editor, input2);
            assert.strictEqual(events.closed[1].editorIndex, 0);
            assert.strictEqual(events.closed[1].context === editor_1.EditorCloseContext.REPLACE, false);
            event = group.closeEditor(input2);
            assert.ok(!event);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(events.closed[1].editor, input2);
            // Nonactive && Pinned => gets active because its first editor
            const input3 = input();
            group.openEditor(input3, { active: false, pinned: true });
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.isActive(input3), true);
            assert.strictEqual(group.isPinned(input3), true);
            assert.strictEqual(group.isPinned(0), true);
            assert.strictEqual(events.opened[2].editor, input3);
            assert.strictEqual(events.activated[2].editor, input3);
            group.closeEditor(input3);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(events.closed[2].editor, input3);
            assert.strictEqual(events.opened[2].editor, input3);
            assert.strictEqual(events.activated[2].editor, input3);
            group.closeEditor(input3);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(events.closed[2].editor, input3);
            // Nonactive && Preview => gets active because its first editor
            const input4 = input();
            group.openEditor(input4);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(group.activeEditor, input4);
            assert.strictEqual(group.isActive(input4), true);
            assert.strictEqual(group.isPinned(input4), false);
            assert.strictEqual(group.isPinned(0), false);
            assert.strictEqual(events.opened[3].editor, input4);
            assert.strictEqual(events.activated[3].editor, input4);
            group.closeEditor(input4);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(events.closed[3].editor, input4);
        });
        test('Multiple Editors - Pinned and Active', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            const input1 = input('1');
            const input1Copy = input('1');
            const input2 = input('2');
            const input3 = input('3');
            // Pinned and Active
            let openedEditorResult = group.openEditor(input1, { pinned: true, active: true });
            assert.strictEqual(openedEditorResult.editor, input1);
            assert.strictEqual(openedEditorResult.isNew, true);
            openedEditorResult = group.openEditor(input1Copy, { pinned: true, active: true }); // opening copy of editor should still return existing one
            assert.strictEqual(openedEditorResult.editor, input1);
            assert.strictEqual(openedEditorResult.isNew, false);
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: true, active: true });
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 3);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.isActive(input1), false);
            assert.strictEqual(group.isPinned(input1), true);
            assert.strictEqual(group.isActive(input2), false);
            assert.strictEqual(group.isPinned(input2), true);
            assert.strictEqual(group.isActive(input3), true);
            assert.strictEqual(group.isPinned(input3), true);
            assert.strictEqual(group.isFirst(input1), true);
            assert.strictEqual(group.isFirst(input2), false);
            assert.strictEqual(group.isFirst(input3), false);
            assert.strictEqual(group.isLast(input1), false);
            assert.strictEqual(group.isLast(input2), false);
            assert.strictEqual(group.isLast(input3), true);
            assert.strictEqual(events.opened[0].editor, input1);
            assert.strictEqual(events.opened[1].editor, input2);
            assert.strictEqual(events.opened[2].editor, input3);
            assert.strictEqual(events.activated[0].editor, input1);
            assert.strictEqual(events.activated[0].editorIndex, 0);
            assert.strictEqual(events.activated[1].editor, input2);
            assert.strictEqual(events.activated[1].editorIndex, 1);
            assert.strictEqual(events.activated[2].editor, input3);
            assert.strictEqual(events.activated[2].editorIndex, 2);
            const mru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru[0], input3);
            assert.strictEqual(mru[1], input2);
            assert.strictEqual(mru[2], input1);
            // Add some tests where a matching input is used
            // and verify that events carry the original input
            const sameInput1 = input('1');
            group.openEditor(sameInput1, { pinned: true, active: true });
            assert.strictEqual(events.activated[3].editor, input1);
            assert.strictEqual(events.activated[3].editorIndex, 0);
            group.unpin(sameInput1);
            assert.strictEqual(events.unpinned[0].editor, input1);
            assert.strictEqual(events.unpinned[0].editorIndex, 0);
            group.pin(sameInput1);
            assert.strictEqual(events.pinned[0].editor, input1);
            assert.strictEqual(events.pinned[0].editorIndex, 0);
            group.stick(sameInput1);
            assert.strictEqual(events.sticky[0].editor, input1);
            assert.strictEqual(events.sticky[0].editorIndex, 0);
            group.unstick(sameInput1);
            assert.strictEqual(events.unsticky[0].editor, input1);
            assert.strictEqual(events.unsticky[0].editorIndex, 0);
            group.moveEditor(sameInput1, 1);
            assert.strictEqual(events.moved[0].editor, input1);
            assert.strictEqual(events.moved[0].oldEditorIndex, 0);
            assert.strictEqual(events.moved[0].editorIndex, 1);
            group.closeEditor(sameInput1);
            assert.strictEqual(events.closed[0].editor, input1);
            assert.strictEqual(events.closed[0].editorIndex, 1);
            closeAllEditors(group);
            assert.strictEqual(events.closed.length, 3);
            assert.strictEqual(group.count, 0);
        });
        test('Multiple Editors - Preview editor moves to the side of the active one', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            group.openEditor(input1, { pinned: false, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: true, active: true });
            assert.strictEqual(input3, group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2]);
            const input4 = input();
            group.openEditor(input4, { pinned: false, active: true }); // this should cause the preview editor to move after input3
            assert.strictEqual(input4, group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2]);
        });
        test('Multiple Editors - Pinned and Active (DEFAULT_OPEN_EDITOR_DIRECTION = Direction.LEFT)', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(lifecycle_1.ILifecycleService, disposables.add(new workbenchTestServices_1.TestLifecycleService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            inst.stub(configuration_1.IConfigurationService, config);
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'left' } });
            const group = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, undefined));
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            // Pinned and Active
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: true, active: true });
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], input1);
            closeAllEditors(group);
            assert.strictEqual(events.closed.length, 3);
            assert.strictEqual(group.count, 0);
            inst.dispose();
        });
        test('Multiple Editors - Pinned and Not Active', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            // Pinned and Active
            group.openEditor(input1, { pinned: true });
            group.openEditor(input2, { pinned: true });
            group.openEditor(input3, { pinned: true });
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 3);
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.isActive(input1), true);
            assert.strictEqual(group.isPinned(input1), true);
            assert.strictEqual(group.isPinned(0), true);
            assert.strictEqual(group.isActive(input2), false);
            assert.strictEqual(group.isPinned(input2), true);
            assert.strictEqual(group.isPinned(1), true);
            assert.strictEqual(group.isActive(input3), false);
            assert.strictEqual(group.isPinned(input3), true);
            assert.strictEqual(group.isPinned(2), true);
            assert.strictEqual(group.isPinned(input3), true);
            const mru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru[0], input1);
            assert.strictEqual(mru[1], input3);
            assert.strictEqual(mru[2], input2);
        });
        test('Multiple Editors - Preview gets overwritten', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            // Non active, preview
            group.openEditor(input1); // becomes active, preview
            group.openEditor(input2); // overwrites preview
            group.openEditor(input3); // overwrites preview
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.isActive(input3), true);
            assert.strictEqual(group.isPinned(input3), false);
            assert.strictEqual(!group.isPinned(input3), true);
            assert.strictEqual(events.opened[0].editor, input1);
            assert.strictEqual(events.opened[1].editor, input2);
            assert.strictEqual(events.opened[2].editor, input3);
            assert.strictEqual(events.closed[0].editor, input1);
            assert.strictEqual(events.closed[1].editor, input2);
            assert.strictEqual(events.closed[0].context === editor_1.EditorCloseContext.REPLACE, true);
            assert.strictEqual(events.closed[1].context === editor_1.EditorCloseContext.REPLACE, true);
            const mru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru[0], input3);
            assert.strictEqual(mru.length, 1);
        });
        test('Multiple Editors - set active', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            assert.strictEqual(group.activeEditor, input3);
            let mru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru[0], input3);
            assert.strictEqual(mru[1], input2);
            assert.strictEqual(mru[2], input1);
            group.setActive(input3);
            assert.strictEqual(events.activated.length, 3);
            group.setActive(input1);
            assert.strictEqual(events.activated[3].editor, input1);
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.isActive(input1), true);
            assert.strictEqual(group.isActive(input2), false);
            assert.strictEqual(group.isActive(input3), false);
            mru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mru[0], input1);
            assert.strictEqual(mru[1], input3);
            assert.strictEqual(mru[2], input2);
        });
        test('Multiple Editors - pin and unpin', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 3);
            group.pin(input3);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.isPinned(input3), true);
            assert.strictEqual(group.isActive(input3), true);
            assert.strictEqual(events.pinned[0].editor, input3);
            assert.strictEqual(group.count, 3);
            group.unpin(input1);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.isPinned(input1), false);
            assert.strictEqual(group.isActive(input1), false);
            assert.strictEqual(events.unpinned[0].editor, input1);
            assert.strictEqual(group.count, 3);
            group.unpin(input2);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 2); // 2 previews got merged into one
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input3);
            assert.strictEqual(events.closed[0].editor, input1);
            assert.strictEqual(group.count, 2);
            group.unpin(input3);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 1); // pinning replaced the preview
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input3);
            assert.strictEqual(events.closed[1].editor, input2);
            assert.strictEqual(group.count, 1);
        });
        test('Multiple Editors - closing picks next from MRU list', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            const input5 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: true, active: true });
            group.openEditor(input4, { pinned: true, active: true });
            group.openEditor(input5, { pinned: true, active: true });
            assert.strictEqual(group.activeEditor, input5);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input5);
            assert.strictEqual(group.count, 5);
            group.closeEditor(input5);
            assert.strictEqual(group.activeEditor, input4);
            assert.strictEqual(events.activated[5].editor, input4);
            assert.strictEqual(group.count, 4);
            group.setActive(input1);
            group.setActive(input4);
            group.closeEditor(input4);
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.count, 3);
            group.closeEditor(input1);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 2);
            group.setActive(input2);
            group.closeEditor(input2);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 1);
            group.closeEditor(input3);
            assert.ok(!group.activeEditor);
            assert.strictEqual(group.count, 0);
        });
        test('Multiple Editors - closing picks next to the right', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(lifecycle_1.ILifecycleService, disposables.add(new workbenchTestServices_1.TestLifecycleService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { focusRecentEditorAfterClose: false } });
            inst.stub(configuration_1.IConfigurationService, config);
            const group = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, undefined));
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            const input5 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: true, active: true });
            group.openEditor(input4, { pinned: true, active: true });
            group.openEditor(input5, { pinned: true, active: true });
            assert.strictEqual(group.activeEditor, input5);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input5);
            assert.strictEqual(group.count, 5);
            group.closeEditor(input5);
            assert.strictEqual(group.activeEditor, input4);
            assert.strictEqual(events.activated[5].editor, input4);
            assert.strictEqual(group.count, 4);
            group.setActive(input1);
            group.closeEditor(input1);
            assert.strictEqual(group.activeEditor, input2);
            assert.strictEqual(group.count, 3);
            group.setActive(input3);
            group.closeEditor(input3);
            assert.strictEqual(group.activeEditor, input4);
            assert.strictEqual(group.count, 2);
            group.closeEditor(input4);
            assert.strictEqual(group.activeEditor, input2);
            assert.strictEqual(group.count, 1);
            group.closeEditor(input2);
            assert.ok(!group.activeEditor);
            assert.strictEqual(group.count, 0);
            inst.dispose();
        });
        test('Multiple Editors - move editor', function () {
            const group = createEditorGroupModel();
            const events = groupListener(group);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            const input5 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.moveEditor(input1, 1);
            assert.strictEqual(events.moved[0].editor, input1);
            assert.strictEqual(events.moved[0].oldEditorIndex, 0);
            assert.strictEqual(events.moved[0].editorIndex, 1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input1);
            group.setActive(input1);
            group.openEditor(input3, { pinned: true, active: true });
            group.openEditor(input4, { pinned: true, active: true });
            group.openEditor(input5, { pinned: true, active: true });
            group.moveEditor(input4, 0);
            assert.strictEqual(events.moved[1].editor, input4);
            assert.strictEqual(events.moved[1].oldEditorIndex, 3);
            assert.strictEqual(events.moved[1].editorIndex, 0);
            assert.strictEqual(events.moved[1].editor, input4);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input4);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[3], input3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[4], input5);
            group.moveEditor(input4, 3);
            group.moveEditor(input2, 1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], input3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[3], input4);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[4], input5);
            assert.strictEqual(events.moved.length, 4);
            group.moveEditor(input1, 0);
            assert.strictEqual(events.moved.length, 4);
            group.moveEditor(input1, -1);
            assert.strictEqual(events.moved.length, 4);
            group.moveEditor(input5, 4);
            assert.strictEqual(events.moved.length, 4);
            group.moveEditor(input5, 100);
            assert.strictEqual(events.moved.length, 4);
            group.moveEditor(input5, -1);
            assert.strictEqual(events.moved.length, 5);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input5);
            group.moveEditor(input1, 100);
            assert.strictEqual(events.moved.length, 6);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[4], input1);
        });
        test('Multiple Editors - move editor across groups', function () {
            const group1 = createEditorGroupModel();
            const group2 = createEditorGroupModel();
            const g1_input1 = input();
            const g1_input2 = input();
            const g2_input1 = input();
            group1.openEditor(g1_input1, { active: true, pinned: true });
            group1.openEditor(g1_input2, { active: true, pinned: true });
            group2.openEditor(g2_input1, { active: true, pinned: true });
            // A move across groups is a close in the one group and an open in the other group at a specific index
            group2.closeEditor(g2_input1);
            group1.openEditor(g2_input1, { active: true, pinned: true, index: 1 });
            assert.strictEqual(group1.count, 3);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], g1_input1);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], g2_input1);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], g1_input2);
        });
        test('Multiple Editors - move editor across groups (input already exists in group 1)', function () {
            const group1 = createEditorGroupModel();
            const group2 = createEditorGroupModel();
            const g1_input1 = input();
            const g1_input2 = input();
            const g1_input3 = input();
            const g2_input1 = g1_input2;
            group1.openEditor(g1_input1, { active: true, pinned: true });
            group1.openEditor(g1_input2, { active: true, pinned: true });
            group1.openEditor(g1_input3, { active: true, pinned: true });
            group2.openEditor(g2_input1, { active: true, pinned: true });
            // A move across groups is a close in the one group and an open in the other group at a specific index
            group2.closeEditor(g2_input1);
            group1.openEditor(g2_input1, { active: true, pinned: true, index: 0 });
            assert.strictEqual(group1.count, 3);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], g1_input2);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], g1_input1);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], g1_input3);
        });
        test('Multiple Editors - Pinned & Non Active', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            group.openEditor(input1);
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.previewEditor, input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            assert.strictEqual(group.count, 1);
            const input2 = input();
            group.openEditor(input2, { pinned: true, active: false });
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.previewEditor, input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input2);
            assert.strictEqual(group.count, 2);
            const input3 = input();
            group.openEditor(input3, { pinned: true, active: false });
            assert.strictEqual(group.activeEditor, input1);
            assert.strictEqual(group.previewEditor, input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], input2);
            assert.strictEqual(group.isPinned(input1), false);
            assert.strictEqual(group.isPinned(input2), true);
            assert.strictEqual(group.isPinned(input3), true);
            assert.strictEqual(group.count, 3);
        });
        test('Multiple Editors - Close Others, Close Left, Close Right', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            const input5 = input();
            group.openEditor(input1, { active: true, pinned: true });
            group.openEditor(input2, { active: true, pinned: true });
            group.openEditor(input3, { active: true, pinned: true });
            group.openEditor(input4, { active: true, pinned: true });
            group.openEditor(input5, { active: true, pinned: true });
            // Close Others
            closeEditors(group, group.activeEditor);
            assert.strictEqual(group.activeEditor, input5);
            assert.strictEqual(group.count, 1);
            closeAllEditors(group);
            group.openEditor(input1, { active: true, pinned: true });
            group.openEditor(input2, { active: true, pinned: true });
            group.openEditor(input3, { active: true, pinned: true });
            group.openEditor(input4, { active: true, pinned: true });
            group.openEditor(input5, { active: true, pinned: true });
            group.setActive(input3);
            // Close Left
            assert.strictEqual(group.activeEditor, input3);
            closeEditors(group, group.activeEditor, 0 /* CloseDirection.LEFT */);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input4);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], input5);
            closeAllEditors(group);
            group.openEditor(input1, { active: true, pinned: true });
            group.openEditor(input2, { active: true, pinned: true });
            group.openEditor(input3, { active: true, pinned: true });
            group.openEditor(input4, { active: true, pinned: true });
            group.openEditor(input5, { active: true, pinned: true });
            group.setActive(input3);
            // Close Right
            assert.strictEqual(group.activeEditor, input3);
            closeEditors(group, group.activeEditor, 1 /* CloseDirection.RIGHT */);
            assert.strictEqual(group.activeEditor, input3);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input2);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2], input3);
        });
        test('Multiple Editors - real user example', function () {
            const group = createEditorGroupModel();
            // [] -> /index.html/
            const indexHtml = input('index.html');
            let openedEditor = group.openEditor(indexHtml).editor;
            assert.strictEqual(openedEditor, indexHtml);
            assert.strictEqual(group.activeEditor, indexHtml);
            assert.strictEqual(group.previewEditor, indexHtml);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], indexHtml);
            assert.strictEqual(group.count, 1);
            // /index.html/ -> /index.html/
            const sameIndexHtml = input('index.html');
            openedEditor = group.openEditor(sameIndexHtml).editor;
            assert.strictEqual(openedEditor, indexHtml);
            assert.strictEqual(group.activeEditor, indexHtml);
            assert.strictEqual(group.previewEditor, indexHtml);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], indexHtml);
            assert.strictEqual(group.count, 1);
            // /index.html/ -> /style.css/
            const styleCss = input('style.css');
            openedEditor = group.openEditor(styleCss).editor;
            assert.strictEqual(openedEditor, styleCss);
            assert.strictEqual(group.activeEditor, styleCss);
            assert.strictEqual(group.previewEditor, styleCss);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], styleCss);
            assert.strictEqual(group.count, 1);
            // /style.css/ -> [/style.css/, test.js]
            const testJs = input('test.js');
            openedEditor = group.openEditor(testJs, { active: true, pinned: true }).editor;
            assert.strictEqual(openedEditor, testJs);
            assert.strictEqual(group.previewEditor, styleCss);
            assert.strictEqual(group.activeEditor, testJs);
            assert.strictEqual(group.isPinned(styleCss), false);
            assert.strictEqual(group.isPinned(testJs), true);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], styleCss);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], testJs);
            assert.strictEqual(group.count, 2);
            // [/style.css/, test.js] -> [test.js, /index.html/]
            const indexHtml2 = input('index.html');
            group.openEditor(indexHtml2, { active: true });
            assert.strictEqual(group.activeEditor, indexHtml2);
            assert.strictEqual(group.previewEditor, indexHtml2);
            assert.strictEqual(group.isPinned(indexHtml2), false);
            assert.strictEqual(group.isPinned(testJs), true);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], testJs);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], indexHtml2);
            assert.strictEqual(group.count, 2);
            // make test.js active
            const testJs2 = input('test.js');
            group.setActive(testJs2);
            assert.strictEqual(group.activeEditor, testJs);
            assert.strictEqual(group.isActive(testJs2), true);
            assert.strictEqual(group.count, 2);
            // [test.js, /indexHtml/] -> [test.js, index.html]
            const indexHtml3 = input('index.html');
            group.pin(indexHtml3);
            assert.strictEqual(group.isPinned(indexHtml3), true);
            assert.strictEqual(group.activeEditor, testJs);
            // [test.js, index.html] -> [test.js, file.ts, index.html]
            const fileTs = input('file.ts');
            group.openEditor(fileTs, { active: true, pinned: true });
            assert.strictEqual(group.isPinned(fileTs), true);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.activeEditor, fileTs);
            // [test.js, index.html, file.ts] -> [test.js, /file.ts/, index.html]
            group.unpin(fileTs);
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.isPinned(fileTs), false);
            assert.strictEqual(group.activeEditor, fileTs);
            // [test.js, /file.ts/, index.html] -> [test.js, /other.ts/, index.html]
            const otherTs = input('other.ts');
            group.openEditor(otherTs, { active: true });
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.activeEditor, otherTs);
            assert.ok(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].matches(testJs));
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], otherTs);
            assert.ok(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[2].matches(indexHtml));
            // make index.html active
            const indexHtml4 = input('index.html');
            group.setActive(indexHtml4);
            assert.strictEqual(group.activeEditor, indexHtml2);
            // [test.js, /other.ts/, index.html] -> [test.js, /other.ts/]
            group.closeEditor(indexHtml);
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.activeEditor, otherTs);
            assert.ok(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].matches(testJs));
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], otherTs);
            // [test.js, /other.ts/] -> [test.js]
            group.closeEditor(otherTs);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.activeEditor, testJs);
            assert.ok(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].matches(testJs));
            // [test.js] -> /test.js/
            group.unpin(testJs);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.activeEditor, testJs);
            assert.ok(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].matches(testJs));
            assert.strictEqual(group.isPinned(testJs), false);
            // /test.js/ -> []
            group.closeEditor(testJs);
            assert.strictEqual(group.count, 0);
            assert.strictEqual(group.activeEditor, null);
            assert.strictEqual(group.previewEditor, null);
        });
        test('Single Group, Single Editor - persist', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            const lifecycle = disposables.add(new workbenchTestServices_1.TestLifecycleService());
            inst.stub(lifecycle_1.ILifecycleService, lifecycle);
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right' } });
            inst.stub(configuration_1.IConfigurationService, config);
            inst.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            let group = createEditorGroupModel();
            const input1 = input();
            group.openEditor(input1);
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.activeEditor.matches(input1), true);
            assert.strictEqual(group.previewEditor.matches(input1), true);
            assert.strictEqual(group.isActive(input1), true);
            // Create model again - should load from storage
            group = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group.serialize()));
            assert.strictEqual(group.count, 1);
            assert.strictEqual(group.activeEditor.matches(input1), true);
            assert.strictEqual(group.previewEditor.matches(input1), true);
            assert.strictEqual(group.isActive(input1), true);
            inst.dispose();
        });
        test('Multiple Groups, Multiple editors - persist', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            const lifecycle = disposables.add(new workbenchTestServices_1.TestLifecycleService());
            inst.stub(lifecycle_1.ILifecycleService, lifecycle);
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right' } });
            inst.stub(configuration_1.IConfigurationService, config);
            inst.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            let group1 = createEditorGroupModel();
            const g1_input1 = input();
            const g1_input2 = input();
            const g1_input3 = input();
            group1.openEditor(g1_input1, { active: true, pinned: true });
            group1.openEditor(g1_input2, { active: true, pinned: false });
            group1.openEditor(g1_input3, { active: false, pinned: true });
            let group2 = createEditorGroupModel();
            const g2_input1 = input();
            const g2_input2 = input();
            const g2_input3 = input();
            group2.openEditor(g2_input1, { active: true, pinned: true });
            group2.openEditor(g2_input2, { active: false, pinned: false });
            group2.openEditor(g2_input3, { active: false, pinned: true });
            assert.strictEqual(group1.count, 3);
            assert.strictEqual(group2.count, 3);
            assert.strictEqual(group1.activeEditor.matches(g1_input2), true);
            assert.strictEqual(group2.activeEditor.matches(g2_input1), true);
            assert.strictEqual(group1.previewEditor.matches(g1_input2), true);
            assert.strictEqual(group2.previewEditor.matches(g2_input2), true);
            assert.strictEqual(group1.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].matches(g1_input2), true);
            assert.strictEqual(group1.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].matches(g1_input3), true);
            assert.strictEqual(group1.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[2].matches(g1_input1), true);
            assert.strictEqual(group2.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].matches(g2_input1), true);
            assert.strictEqual(group2.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].matches(g2_input3), true);
            assert.strictEqual(group2.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[2].matches(g2_input2), true);
            // Create model again - should load from storage
            group1 = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group1.serialize()));
            group2 = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group2.serialize()));
            assert.strictEqual(group1.count, 3);
            assert.strictEqual(group2.count, 3);
            assert.strictEqual(group1.activeEditor.matches(g1_input2), true);
            assert.strictEqual(group2.activeEditor.matches(g2_input1), true);
            assert.strictEqual(group1.previewEditor.matches(g1_input2), true);
            assert.strictEqual(group2.previewEditor.matches(g2_input2), true);
            assert.strictEqual(group1.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].matches(g1_input2), true);
            assert.strictEqual(group1.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].matches(g1_input3), true);
            assert.strictEqual(group1.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[2].matches(g1_input1), true);
            assert.strictEqual(group2.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].matches(g2_input1), true);
            assert.strictEqual(group2.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].matches(g2_input3), true);
            assert.strictEqual(group2.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[2].matches(g2_input2), true);
            inst.dispose();
        });
        test('Single group, multiple editors - persist (some not persistable)', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            const lifecycle = disposables.add(new workbenchTestServices_1.TestLifecycleService());
            inst.stub(lifecycle_1.ILifecycleService, lifecycle);
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right' } });
            inst.stub(configuration_1.IConfigurationService, config);
            inst.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            let group = createEditorGroupModel();
            const serializableInput1 = input();
            const nonSerializableInput2 = input('3', true);
            const serializableInput2 = input();
            group.openEditor(serializableInput1, { active: true, pinned: true });
            group.openEditor(nonSerializableInput2, { active: true, pinned: false });
            group.openEditor(serializableInput2, { active: false, pinned: true });
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.activeEditor.matches(nonSerializableInput2), true);
            assert.strictEqual(group.previewEditor.matches(nonSerializableInput2), true);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].matches(nonSerializableInput2), true);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].matches(serializableInput2), true);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[2].matches(serializableInput1), true);
            // Create model again - should load from storage
            group = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group.serialize()));
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.activeEditor.matches(serializableInput2), true);
            assert.strictEqual(group.previewEditor, null);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].matches(serializableInput2), true);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].matches(serializableInput1), true);
            inst.dispose();
        });
        test('Single group, multiple editors - persist (some not persistable, sticky editors)', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            const lifecycle = disposables.add(new workbenchTestServices_1.TestLifecycleService());
            inst.stub(lifecycle_1.ILifecycleService, lifecycle);
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right' } });
            inst.stub(configuration_1.IConfigurationService, config);
            inst.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            let group = createEditorGroupModel();
            const serializableInput1 = input();
            const nonSerializableInput2 = input('3', true);
            const serializableInput2 = input();
            group.openEditor(serializableInput1, { active: true, pinned: true });
            group.openEditor(nonSerializableInput2, { active: true, pinned: true, sticky: true });
            group.openEditor(serializableInput2, { active: false, pinned: true });
            assert.strictEqual(group.count, 3);
            assert.strictEqual(group.stickyCount, 1);
            // Create model again - should load from storage
            group = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group.serialize()));
            assert.strictEqual(group.count, 2);
            assert.strictEqual(group.stickyCount, 0);
            inst.dispose();
        });
        test('Multiple groups, multiple editors - persist (some not persistable, causes empty group)', function () {
            const inst = new instantiationServiceMock_1.TestInstantiationService();
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            const lifecycle = disposables.add(new workbenchTestServices_1.TestLifecycleService());
            inst.stub(lifecycle_1.ILifecycleService, lifecycle);
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right' } });
            inst.stub(configuration_1.IConfigurationService, config);
            inst.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            let group1 = createEditorGroupModel();
            let group2 = createEditorGroupModel();
            const serializableInput1 = input();
            const serializableInput2 = input();
            const nonSerializableInput = input('2', true);
            group1.openEditor(serializableInput1, { pinned: true });
            group1.openEditor(serializableInput2);
            group2.openEditor(nonSerializableInput);
            // Create model again - should load from storage
            group1 = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group1.serialize()));
            group2 = disposables.add(inst.createInstance(editorGroupModel_1.EditorGroupModel, group2.serialize()));
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].matches(serializableInput1), true);
            assert.strictEqual(group1.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1].matches(serializableInput2), true);
            inst.dispose();
        });
        test('Multiple Editors - Editor Dispose', function () {
            const group1 = createEditorGroupModel();
            const group2 = createEditorGroupModel();
            const group1Listener = groupListener(group1);
            const group2Listener = groupListener(group2);
            const input1 = input();
            const input2 = input();
            const input3 = input();
            group1.openEditor(input1, { pinned: true, active: true });
            group1.openEditor(input2, { pinned: true, active: true });
            group1.openEditor(input3, { pinned: true, active: true });
            group2.openEditor(input1, { pinned: true, active: true });
            group2.openEditor(input2, { pinned: true, active: true });
            input1.dispose();
            assert.strictEqual(group1Listener.disposed.length, 1);
            assert.strictEqual(group1Listener.disposed[0].editorIndex, 0);
            assert.strictEqual(group2Listener.disposed.length, 1);
            assert.strictEqual(group2Listener.disposed[0].editorIndex, 0);
            assert.ok(group1Listener.disposed[0].editor.matches(input1));
            assert.ok(group2Listener.disposed[0].editor.matches(input1));
            input3.dispose();
            assert.strictEqual(group1Listener.disposed.length, 2);
            assert.strictEqual(group1Listener.disposed[1].editorIndex, 2);
            assert.strictEqual(group2Listener.disposed.length, 1);
            assert.ok(group1Listener.disposed[1].editor.matches(input3));
        });
        test('Preview tab does not have a stable position (https://github.com/microsoft/vscode/issues/8245)', function () {
            const group1 = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            group1.openEditor(input1, { pinned: true, active: true });
            group1.openEditor(input2, { active: true });
            group1.setActive(input1);
            group1.openEditor(input3, { active: true });
            assert.strictEqual(group1.indexOf(input3), 1);
        });
        test('Multiple Editors - Editor Emits Dirty and Label Changed', function () {
            const group1 = createEditorGroupModel();
            const group2 = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            group1.openEditor(input1, { pinned: true, active: true });
            group2.openEditor(input2, { pinned: true, active: true });
            let dirty1Counter = 0;
            disposables.add(group1.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty1Counter++;
                }
            }));
            let dirty2Counter = 0;
            disposables.add(group2.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty2Counter++;
                }
            }));
            let label1ChangeCounter = 0;
            disposables.add(group1.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label1ChangeCounter++;
                }
            }));
            let label2ChangeCounter = 0;
            disposables.add(group2.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label2ChangeCounter++;
                }
            }));
            input1.setDirty();
            input1.setLabel();
            assert.strictEqual(dirty1Counter, 1);
            assert.strictEqual(label1ChangeCounter, 1);
            input2.setDirty();
            input2.setLabel();
            assert.strictEqual(dirty2Counter, 1);
            assert.strictEqual(label2ChangeCounter, 1);
            closeAllEditors(group2);
            input2.setDirty();
            input2.setLabel();
            assert.strictEqual(dirty2Counter, 1);
            assert.strictEqual(label2ChangeCounter, 1);
            assert.strictEqual(dirty1Counter, 1);
            assert.strictEqual(label1ChangeCounter, 1);
        });
        test('Sticky Editors', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            assert.strictEqual(group.stickyCount, 0);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 3);
            assert.strictEqual(group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 3);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 3);
            assert.strictEqual(group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true }).length, 3);
            // Stick last editor should move it first and pin
            group.stick(input3);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(input1), false);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), true);
            assert.strictEqual(group.isPinned(input3), true);
            assert.strictEqual(group.indexOf(input1), 1);
            assert.strictEqual(group.indexOf(input2), 2);
            assert.strictEqual(group.indexOf(input3), 0);
            let sequentialAllEditors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            assert.strictEqual(sequentialAllEditors.length, 3);
            let sequentialEditorsExcludingSticky = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true });
            assert.strictEqual(sequentialEditorsExcludingSticky.length, 2);
            assert.ok(sequentialEditorsExcludingSticky.indexOf(input1) >= 0);
            assert.ok(sequentialEditorsExcludingSticky.indexOf(input2) >= 0);
            let mruAllEditors = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mruAllEditors.length, 3);
            let mruEditorsExcludingSticky = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true });
            assert.strictEqual(mruEditorsExcludingSticky.length, 2);
            assert.ok(mruEditorsExcludingSticky.indexOf(input1) >= 0);
            assert.ok(mruEditorsExcludingSticky.indexOf(input2) >= 0);
            // Sticking same editor again is a no-op
            group.stick(input3);
            assert.strictEqual(group.isSticky(input3), true);
            // Sticking last editor now should move it after sticky one
            group.stick(input2);
            assert.strictEqual(group.stickyCount, 2);
            assert.strictEqual(group.isSticky(input1), false);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), true);
            assert.strictEqual(group.indexOf(input1), 2);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 0);
            sequentialAllEditors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            assert.strictEqual(sequentialAllEditors.length, 3);
            sequentialEditorsExcludingSticky = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true });
            assert.strictEqual(sequentialEditorsExcludingSticky.length, 1);
            assert.ok(sequentialEditorsExcludingSticky.indexOf(input1) >= 0);
            mruAllEditors = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mruAllEditors.length, 3);
            mruEditorsExcludingSticky = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true });
            assert.strictEqual(mruEditorsExcludingSticky.length, 1);
            assert.ok(mruEditorsExcludingSticky.indexOf(input1) >= 0);
            // Sticking remaining editor also works
            group.stick(input1);
            assert.strictEqual(group.stickyCount, 3);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), true);
            assert.strictEqual(group.indexOf(input1), 2);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 0);
            sequentialAllEditors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            assert.strictEqual(sequentialAllEditors.length, 3);
            sequentialEditorsExcludingSticky = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true });
            assert.strictEqual(sequentialEditorsExcludingSticky.length, 0);
            mruAllEditors = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            assert.strictEqual(mruAllEditors.length, 3);
            mruEditorsExcludingSticky = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true });
            assert.strictEqual(mruEditorsExcludingSticky.length, 0);
            // Unsticking moves editor after sticky ones
            group.unstick(input3);
            assert.strictEqual(group.stickyCount, 2);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 1);
            assert.strictEqual(group.indexOf(input2), 0);
            assert.strictEqual(group.indexOf(input3), 2);
            // Unsticking all works
            group.unstick(input1);
            group.unstick(input2);
            assert.strictEqual(group.stickyCount, 0);
            assert.strictEqual(group.isSticky(input1), false);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), false);
            group.moveEditor(input1, 0);
            group.moveEditor(input2, 1);
            group.moveEditor(input3, 2);
            // Opening a new editor always opens after sticky editors
            group.stick(input1);
            group.stick(input2);
            group.setActive(input1);
            const events = groupListener(group);
            group.openEditor(input4, { pinned: true, active: true });
            assert.strictEqual(group.indexOf(input4), 2);
            group.closeEditor(input4);
            assert.strictEqual(events.closed[0].sticky, false);
            group.setActive(input2);
            group.openEditor(input4, { pinned: true, active: true });
            assert.strictEqual(group.indexOf(input4), 2);
            group.closeEditor(input4);
            assert.strictEqual(events.closed[1].sticky, false);
            // Reset
            assert.strictEqual(group.stickyCount, 2);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 0);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 2);
            // Moving a sticky editor works
            group.moveEditor(input1, 1); // still moved within sticky range
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 1);
            assert.strictEqual(group.indexOf(input2), 0);
            assert.strictEqual(group.indexOf(input3), 2);
            group.moveEditor(input1, 0); // still moved within sticky range
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 0);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 2);
            group.moveEditor(input1, 2); // moved out of sticky range//
            assert.strictEqual(group.isSticky(input1), false);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 2);
            assert.strictEqual(group.indexOf(input2), 0);
            assert.strictEqual(group.indexOf(input3), 1);
            group.moveEditor(input2, 2); // moved out of sticky range
            assert.strictEqual(group.isSticky(input1), false);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 1);
            assert.strictEqual(group.indexOf(input2), 2);
            assert.strictEqual(group.indexOf(input3), 0);
            // Reset
            group.moveEditor(input1, 0);
            group.moveEditor(input2, 1);
            group.moveEditor(input3, 2);
            group.stick(input1);
            group.unstick(input2);
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 0);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 2);
            // Moving a unsticky editor in works
            group.moveEditor(input3, 1); // still moved within unsticked range
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 0);
            assert.strictEqual(group.indexOf(input2), 2);
            assert.strictEqual(group.indexOf(input3), 1);
            group.moveEditor(input3, 2); // still moved within unsticked range
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.indexOf(input1), 0);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 2);
            group.moveEditor(input3, 0); // moved into sticky range//
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), false);
            assert.strictEqual(group.isSticky(input3), true);
            assert.strictEqual(group.indexOf(input1), 1);
            assert.strictEqual(group.indexOf(input2), 2);
            assert.strictEqual(group.indexOf(input3), 0);
            group.moveEditor(input2, 0); // moved into sticky range
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), true);
            assert.strictEqual(group.indexOf(input1), 2);
            assert.strictEqual(group.indexOf(input2), 0);
            assert.strictEqual(group.indexOf(input3), 1);
            // Closing a sticky editor updates state properly
            group.stick(input1);
            group.stick(input2);
            group.unstick(input3);
            assert.strictEqual(group.stickyCount, 2);
            group.closeEditor(input1);
            assert.strictEqual(events.closed[2].sticky, true);
            assert.strictEqual(group.stickyCount, 1);
            group.closeEditor(input2);
            assert.strictEqual(events.closed[3].sticky, true);
            assert.strictEqual(group.stickyCount, 0);
            closeAllEditors(group);
            assert.strictEqual(group.stickyCount, 0);
            // Open sticky
            group.openEditor(input1, { sticky: true });
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(input1), true);
            group.openEditor(input2, { pinned: true, active: true });
            assert.strictEqual(group.stickyCount, 1);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), false);
            group.openEditor(input2, { sticky: true });
            assert.strictEqual(group.stickyCount, 2);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            group.openEditor(input3, { pinned: true, active: true });
            group.openEditor(input4, { pinned: false, active: true, sticky: true });
            assert.strictEqual(group.stickyCount, 3);
            assert.strictEqual(group.isSticky(input1), true);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.isSticky(input4), true);
            assert.strictEqual(group.isPinned(input4), true);
            assert.strictEqual(group.indexOf(input1), 0);
            assert.strictEqual(group.indexOf(input2), 1);
            assert.strictEqual(group.indexOf(input3), 3);
            assert.strictEqual(group.indexOf(input4), 2);
        });
        test('Sticky/Unsticky Editors sends correct editor index', function () {
            const group = createEditorGroupModel();
            const input1 = input();
            const input2 = input();
            const input3 = input();
            group.openEditor(input1, { pinned: true, active: true });
            group.openEditor(input2, { pinned: true, active: true });
            group.openEditor(input3, { pinned: false, active: true });
            assert.strictEqual(group.stickyCount, 0);
            const events = groupListener(group);
            group.stick(input3);
            assert.strictEqual(events.sticky[0].editorIndex, 0);
            assert.strictEqual(group.isSticky(input3), true);
            assert.strictEqual(group.stickyCount, 1);
            group.stick(input2);
            assert.strictEqual(events.sticky[1].editorIndex, 1);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.stickyCount, 2);
            group.unstick(input3);
            assert.strictEqual(events.unsticky[0].editorIndex, 1);
            assert.strictEqual(group.isSticky(input3), false);
            assert.strictEqual(group.isSticky(input2), true);
            assert.strictEqual(group.stickyCount, 1);
        });
        test('onDidMoveEditor Event', () => {
            const group1 = createEditorGroupModel();
            const group2 = createEditorGroupModel();
            const input1group1 = input();
            const input2group1 = input();
            const input1group2 = input();
            const input2group2 = input();
            // Open all the editors
            group1.openEditor(input1group1, { pinned: true, active: true, index: 0 });
            group1.openEditor(input2group1, { pinned: true, active: false, index: 1 });
            group2.openEditor(input1group2, { pinned: true, active: true, index: 0 });
            group2.openEditor(input2group2, { pinned: true, active: false, index: 1 });
            const group1Events = groupListener(group1);
            const group2Events = groupListener(group2);
            group1.moveEditor(input1group1, 1);
            assert.strictEqual(group1Events.moved[0].editor, input1group1);
            assert.strictEqual(group1Events.moved[0].oldEditorIndex, 0);
            assert.strictEqual(group1Events.moved[0].editorIndex, 1);
            group2.moveEditor(input1group2, 1);
            assert.strictEqual(group2Events.moved[0].editor, input1group2);
            assert.strictEqual(group2Events.moved[0].oldEditorIndex, 0);
            assert.strictEqual(group2Events.moved[0].editorIndex, 1);
        });
        test('onDidOpeneditor Event', () => {
            const group1 = createEditorGroupModel();
            const group2 = createEditorGroupModel();
            const group1Events = groupListener(group1);
            const group2Events = groupListener(group2);
            const input1group1 = input();
            const input2group1 = input();
            const input1group2 = input();
            const input2group2 = input();
            // Open all the editors
            group1.openEditor(input1group1, { pinned: true, active: true, index: 0 });
            group1.openEditor(input2group1, { pinned: true, active: false, index: 1 });
            group2.openEditor(input1group2, { pinned: true, active: true, index: 0 });
            group2.openEditor(input2group2, { pinned: true, active: false, index: 1 });
            assert.strictEqual(group1Events.opened.length, 2);
            assert.strictEqual(group1Events.opened[0].editor, input1group1);
            assert.strictEqual(group1Events.opened[0].editorIndex, 0);
            assert.strictEqual(group1Events.opened[1].editor, input2group1);
            assert.strictEqual(group1Events.opened[1].editorIndex, 1);
            assert.strictEqual(group2Events.opened.length, 2);
            assert.strictEqual(group2Events.opened[0].editor, input1group2);
            assert.strictEqual(group2Events.opened[0].editorIndex, 0);
            assert.strictEqual(group2Events.opened[1].editor, input2group2);
            assert.strictEqual(group2Events.opened[1].editorIndex, 1);
        });
        test('moving editor sends sticky event when sticky changes', () => {
            const group1 = createEditorGroupModel();
            const input1group1 = input();
            const input2group1 = input();
            const input3group1 = input();
            // Open all the editors
            group1.openEditor(input1group1, { pinned: true, active: true, index: 0, sticky: true });
            group1.openEditor(input2group1, { pinned: true, active: false, index: 1 });
            group1.openEditor(input3group1, { pinned: true, active: false, index: 2 });
            const group1Events = groupListener(group1);
            group1.moveEditor(input2group1, 0);
            assert.strictEqual(group1Events.sticky[0].editor, input2group1);
            assert.strictEqual(group1Events.sticky[0].editorIndex, 0);
            const group2 = createEditorGroupModel();
            const input1group2 = input();
            const input2group2 = input();
            const input3group2 = input();
            // Open all the editors
            group2.openEditor(input1group2, { pinned: true, active: true, index: 0, sticky: true });
            group2.openEditor(input2group2, { pinned: true, active: false, index: 1 });
            group2.openEditor(input3group2, { pinned: true, active: false, index: 2 });
            const group2Events = groupListener(group2);
            group2.moveEditor(input1group2, 1);
            assert.strictEqual(group2Events.unsticky[0].editor, input1group2);
            assert.strictEqual(group2Events.unsticky[0].editorIndex, 1);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JHcm91cE1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5QmhHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFFOUIsSUFBSSxlQUFxRCxDQUFDO1FBRTFELGFBQWEsQ0FBQyxHQUFHLEVBQUU7WUFDbEIsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzNCLGVBQWUsR0FBRyxTQUFTLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxTQUFTLElBQUk7WUFDWixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RCLGVBQWUsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDbEQsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUFlLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQWlCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRDQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxJQUFJLENBQUMsb0NBQXdCLEVBQUUsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBaUIsRUFBRSxxQ0FBb0IsQ0FBQyxDQUFDO1lBRW5ELE1BQU0sTUFBTSxHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsb0JBQW9CLENBQUMsV0FB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LEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTdELEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTdELEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEs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LE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV0RCxLQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXRELEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFckQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUxQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFckQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUxQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUYsTUFB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QUUsQ0FBQyxDQUFDO1lBRTFELEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFbEMsSUFBSSxZQUFZLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENB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RSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVoRCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xCLFlBQVksR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2IsTUFBTSxLQUFLLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUN2QyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2IsTUFBTSxLQUFLLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUN2QyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTNCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2QsTUFBTSxLQUFLLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUN2QyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1QyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTNCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ2xCLE1BQU0sS0FBSyxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDdkMsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXBDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLDJDQUFtQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVsRixtQkFBbUI7WUFDbkIsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDdkIsTUFBTSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFF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LENBQUMsQ0FBQztZQUU1QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFdkQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSwyQ0FBbUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXZELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsMkNBQW1DLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFlB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QUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXZELEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRELEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBELEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBELEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFD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QUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqRCxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsVUFBVSwyQ0FBbUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLEdB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RUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6RCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDekQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6RCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFekQsZUFBZTtZQUNmLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFlBQWEsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbkMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6RCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDekQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELEtBQUssQ0FB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QXNCLEVBQUUsQ0FBQztZQUV0QyxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUMxQixNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUMxQixNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUUxQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU5RCxJQUFJLE1BQU0sR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBRXRDLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxDQUFDO1lBQzFCLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxDQUFDO1lBQzFCLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxDQUFDO1lBRTFCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBYSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFhLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGFBQWMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsYUFBYyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVuRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLDJDQUFtQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLDJDQUFtQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLDJDQUFtQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVyRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLDJDQUFtQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLDJDQUFtQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMs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LENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMscUNBQXFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsNEJBQTRCO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FB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QUFLLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqRCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDekQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9EQUFvRCxFQUFFO1lBQzFELE1BQU0sS0FBSyxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFFdkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDdkIsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDdkIsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFFdkIsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6RCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVwQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXBCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV6QyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXBCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV6QyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLE1BQU0sTUFBTSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDeEMsTUFBTSxNQUFNLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUV4QyxNQUFNLFlBQVksR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUM3QixNQUFNLFlBQVksR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUM3QixNQUFNLFlBQVksR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUM3QixNQUFNLFlBQVksR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUU3Qix1QkFBdUI7WUFDdkIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFM0UsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzQyxNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV6RCxNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsTUFBTSxNQUFNLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUN4QyxNQUFNLE1BQU0sR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBRXhDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQyxNQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFM0MsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFFN0IsdUJBQXVCO1lBQ3ZCLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMs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O1lBQzNFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzQyxNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==