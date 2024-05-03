/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/workspace/common/workspace", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/common/editor/editorInput", "vs/base/common/resources", "vs/base/test/common/utils", "vs/workbench/common/editor/filteredEditorGroupModel"], function (require, exports, assert, editorGroupModel_1, editor_1, workbenchTestServices_1, testConfigurationService_1, instantiationServiceMock_1, configuration_1, lifecycle_1, workspace_1, platform_1, telemetry_1, telemetryUtils_1, storage_1, lifecycle_2, workbenchTestServices_2, editorInput_1, resources_1, utils_1, filteredEditorGroupModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FilteredEditorGroupModel', () => {
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
        function closeAllEditors(group) {
            for (const editor of group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)) {
                group.closeEditor(editor, undefined, false);
            }
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
        test('Sticky/Unsticky count', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.count, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.count, 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.count, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.count, 1);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.count, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.count, 2);
        });
        test('Sticky/Unsticky stickyCount', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.stickyCount, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.stickyCount, 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.stickyCount, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.stickyCount, 0);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.stickyCount, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.stickyCount, 0);
        });
        test('Sticky/Unsticky isEmpty', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: false });
            model.openEditor(input2, { pinned: true, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.count === 0, true);
            assert.strictEqual(unstickyFilteredEditorGroup.count === 0, false);
            model.stick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.count === 0, false);
            assert.strictEqual(unstickyFilteredEditorGroup.count === 0, false);
            model.stick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.count === 0, false);
            assert.strictEqual(unstickyFilteredEditorGroup.count === 0, true);
        });
        test('Sticky/Unsticky editors', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
        });
        test('Sticky/Unsticky activeEditor', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, input1);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, null);
            model.openEditor(input2, { pinned: true, sticky: false, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, input2);
            model.closeEditor(input1);
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, input2);
            model.closeEditor(input2);
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, null);
        });
        test('Sticky/Unsticky previewEditor', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1);
            assert.strictEqual(stickyFilteredEditorGroup.previewEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.previewEditor, input1);
            model.openEditor(input2, { sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.previewEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.previewEditor, input1);
        });
        test('Sticky/Unsticky isSticky()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isSticky(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isSticky(input2), true);
            model.unstick(input1);
            model.closeEditor(input1);
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(unstickyFilteredEditorGroup.isSticky(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isSticky(input2), false);
        });
        test('Sticky/Unsticky isPinned()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: false });
            model.openEditor(input3, { pinned: false, sticky: true });
            model.openEditor(input4, { pinned: false, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.isPinned(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isPinned(input2), true);
            assert.strictEqual(stickyFilteredEditorGroup.isPinned(input3), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isPinned(input4), false);
        });
        test('Sticky/Unsticky isActive()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.isActive(input1), true);
            model.openEditor(input2, { pinned: true, sticky: false, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.isActive(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isActive(input2), true);
            model.unstick(input1);
            assert.strictEqual(unstickyFilteredEditorGroup.isActive(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isActive(input2), true);
        });
        test('Sticky/Unsticky getEditors()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true, active: true });
            model.openEditor(input2, { pinned: true, sticky: true, active: true });
            // all sticky editors
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            // no unsticky editors
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            // options: excludeSticky
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 0);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: false }).length, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: false }).length, 0);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1], input1);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            model.unstick(input2);
            // all unsticky editors
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            // order: MOST_RECENTLY_ACTIVE
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1], input1);
            // order: SEQUENTIAL
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input1);
        });
        test('Sticky/Unsticky getEditorByIndex()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(0), input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(1), input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(2), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(0), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(1), undefined);
            model.openEditor(input3, { pinned: true, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(0), input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(1), input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(2), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(0), input3);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(1), undefined);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(0), input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(1), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(0), input1);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(1), input3);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(2), undefined);
        });
        test('Sticky/Unsticky indexOf()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input1), 0);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input2), 1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input1), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input2), -1);
            model.openEditor(input3, { pinned: true, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input1), 0);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input2), 1);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input3), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input1), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input2), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input3), 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input1), -1);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input2), 0);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input3), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input1), 0);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input2), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input3), 1);
        });
        test('Sticky/Unsticky isFirst()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input1), true);
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input2), false);
            model.unstick(input1);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input2), true);
            model.unstick(input2);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input2), true);
            model.moveEditor(input2, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input2), false);
        });
        test('Sticky/Unsticky isLast()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input1), true);
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input1), false);
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input2), true);
            model.unstick(input1);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input2), true);
            model.unstick(input2);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input2), false);
            model.moveEditor(input2, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input2), true);
        });
        test('Sticky/Unsticky contains()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.contains(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input2), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input2), false);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input1), false);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input2), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input2), false);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input1), false);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input2), false);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input2), true);
        });
        test('Sticky/Unsticky group information', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            // same id
            assert.strictEqual(stickyFilteredEditorGroup.id, model.id);
            assert.strictEqual(unstickyFilteredEditorGroup.id, model.id);
            // group locking same behaviour
            assert.strictEqual(stickyFilteredEditorGroup.isLocked, model.isLocked);
            assert.strictEqual(unstickyFilteredEditorGroup.isLocked, model.isLocked);
            model.lock(true);
            assert.strictEqual(stickyFilteredEditorGroup.isLocked, model.isLocked);
            assert.strictEqual(unstickyFilteredEditorGroup.isLocked, model.isLocked);
            model.lock(false);
            assert.strictEqual(stickyFilteredEditorGroup.isLocked, model.isLocked);
            assert.strictEqual(unstickyFilteredEditorGroup.isLocked, model.isLocked);
        });
        test('Multiple Editors - Editor Emits Dirty and Label Changed', function () {
            const model1 = createEditorGroupModel();
            const model2 = createEditorGroupModel();
            const stickyFilteredEditorGroup1 = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model1));
            const unstickyFilteredEditorGroup1 = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model1));
            const stickyFilteredEditorGroup2 = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model2));
            const unstickyFilteredEditorGroup2 = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model2));
            const input1 = input();
            const input2 = input();
            model1.openEditor(input1, { pinned: true, active: true });
            model2.openEditor(input2, { pinned: true, active: true, sticky: true });
            // DIRTY
            let dirty1CounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty1CounterSticky++;
                }
            }));
            let dirty1CounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty1CounterUnsticky++;
                }
            }));
            let dirty2CounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty2CounterSticky++;
                }
            }));
            let dirty2CounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty2CounterUnsticky++;
                }
            }));
            // LABEL
            let label1ChangeCounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label1ChangeCounterSticky++;
                }
            }));
            let label1ChangeCounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label1ChangeCounterUnsticky++;
                }
            }));
            let label2ChangeCounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label2ChangeCounterSticky++;
                }
            }));
            let label2ChangeCounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label2ChangeCounterUnsticky++;
                }
            }));
            input1.setDirty();
            input1.setLabel();
            assert.strictEqual(dirty1CounterSticky, 0);
            assert.strictEqual(dirty1CounterUnsticky, 1);
            assert.strictEqual(label1ChangeCounterSticky, 0);
            assert.strictEqual(label1ChangeCounterUnsticky, 1);
            input2.setDirty();
            input2.setLabel();
            assert.strictEqual(dirty2CounterSticky, 1);
            assert.strictEqual(dirty2CounterUnsticky, 0);
            assert.strictEqual(label2ChangeCounterSticky, 1);
            assert.strictEqual(label2ChangeCounterUnsticky, 0);
            closeAllEditors(model2);
            input2.setDirty();
            input2.setLabel();
            assert.strictEqual(dirty2CounterSticky, 1);
            assert.strictEqual(dirty2CounterUnsticky, 0);
            assert.strictEqual(label2ChangeCounterSticky, 1);
            assert.strictEqual(label2ChangeCounterUnsticky, 0);
            assert.strictEqual(dirty1CounterSticky, 0);
            assert.strictEqual(dirty1CounterUnsticky, 1);
            assert.strictEqual(label1ChangeCounterSticky, 0);
            assert.strictEqual(label1ChangeCounterUnsticky, 1);
        });
        test('Sticky/Unsticky isTransient()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            model.openEditor(input1, { pinned: true, transient: false });
            model.openEditor(input2, { pinned: true });
            model.openEditor(input3, { pinned: true, transient: true });
            model.openEditor(input4, { pinned: false, transient: true });
            assert.strictEqual(stickyFilteredEditorGroup.isTransient(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isTransient(input2), false);
            assert.strictEqual(stickyFilteredEditorGroup.isTransient(input3), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isTransient(input4), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyZWRFZGl0b3JHcm91cE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2Jyb3dzZXIvcGFydHMvZWRpdG9yL2ZpbHRlcmVkRWRpdG9yR3JvdXBNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0JoRyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBRXRDLElBQUksZUFBcUQsQ0FBQztRQUUxRCxhQUFhLENBQUMsR0FBRyxFQUFFO1lBQ2xCLGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUMzQixlQUFlLEdBQUcsU0FBUyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDO1FBRUgsU0FBUyxJQUFJO1lBQ1osSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN0QixlQUFlLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ2xELENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyxlQUFlLENBQUM7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyx5QkFBZSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUFpQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw0Q0FBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLG9DQUF3QixFQUFFLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQWlCLEVBQUUscUNBQW9CLENBQUMsQ0FBQztZQUVuRCxNQUFNLE1BQU0sR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDOUMsTUFBTSxDQUFD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