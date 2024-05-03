/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/workbench/common/editor", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/textResourceEditorInput", "vs/platform/theme/test/common/testThemeService", "vs/base/common/uri", "vs/workbench/browser/editor", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/resources", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/editor/editorInput", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/test/common/utils"], function (require, exports, assert, editorPane_1, editorPlaceholder_1, editor_1, platform_1, descriptors_1, telemetry_1, telemetryUtils_1, workbenchTestServices_1, textResourceEditorInput_1, testThemeService_1, uri_1, editor_2, cancellation_1, lifecycle_1, workbenchTestServices_2, resources_1, editorService_1, editorService_2, editorGroupsService_1, workspaceTrust_1, editorInput_1, testConfigurationService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const NullThemeService = new testThemeService_1.TestThemeService();
    const editorRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane);
    const editorInputRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
    class TestEditor extends editorPane_1.EditorPane {
        constructor(group) {
            const disposables = new lifecycle_1.DisposableStore();
            super('TestEditor', group, telemetryUtils_1.NullTelemetryService, NullThemeService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            this._register(disposables);
        }
        getId() { return 'testEditor'; }
        layout() { }
        createEditor() { }
    }
    class OtherTestEditor extends editorPane_1.EditorPane {
        constructor(group) {
            const disposables = new lifecycle_1.DisposableStore();
            super('testOtherEditor', group, telemetryUtils_1.NullTelemetryService, NullThemeService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            this._register(disposables);
        }
        getId() { return 'testOtherEditor'; }
        layout() { }
        createEditor() { }
    }
    class TestInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(input) {
            return input.toString();
        }
        deserialize(instantiationService, raw) {
            return {};
        }
    }
    class TestInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        prefersEditorPane(editors) {
            return editors[1];
        }
        get typeId() {
            return 'testInput';
        }
        resolve() {
            return null;
        }
    }
    class OtherTestInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        get typeId() {
            return 'otherTestInput';
        }
        resolve() {
            return null;
        }
    }
    class TestResourceEditorInput extends textResourceEditorInput_1.TextResourceEditorInput {
    }
    suite('EditorPane', () => {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        test('EditorPane API', async () => {
            const group = new workbenchTestServices_1.TestEditorGroupView(1);
            const editor = new TestEditor(group);
            assert.ok(editor.group);
            const input = disposables.add(new OtherTestInput());
            const options = {};
            assert(!editor.isVisible());
            assert(!editor.input);
            await editor.setInput(input, options, Object.create(null), cancellation_1.CancellationToken.None);
            assert.strictEqual(input, editor.input);
            editor.setVisible(true);
            assert(editor.isVisible());
            editor.dispose();
            editor.clearInput();
            editor.setVisible(false);
            assert(!editor.isVisible());
            assert(!editor.input);
            assert(!editor.getControl());
        });
        test('EditorPaneDescriptor', () => {
            const editorDescriptor = editor_2.EditorPaneDescriptor.create(TestEditor, 'id', 'name');
            assert.strictEqual(editorDescriptor.typeId, 'id');
            assert.strictEqual(editorDescriptor.name, 'name');
        });
        test('Editor Pane Registration', function () {
            const editorDescriptor1 = editor_2.EditorPaneDescriptor.create(TestEditor, 'id1', 'name');
            const editorDescriptor2 = editor_2.EditorPaneDescriptor.create(OtherTestEditor, 'id2', 'name');
            const oldEditorsCnt = editorRegistry.getEditorPanes().length;
            const oldInputCnt = editorRegistry.getEditors().length;
            disposables.add(editorRegistry.registerEditorPane(editorDescriptor1, [new descriptors_1.SyncDescriptor(TestInput)]));
            disposables.add(editorRegistry.registerEditorPane(editorDescriptor2, [new descriptors_1.SyncDescriptor(TestInput), new descriptors_1.SyncDescriptor(OtherTestInput)]));
            assert.strictEqual(editorRegistry.getEditorPanes().length, oldEditorsCnt + 2);
            assert.strictEqual(editorRegistry.getEditors().length, oldInputCnt + 3);
            assert.strictEqual(editorRegistry.getEditorPane(disposables.add(new TestInput())), editorDescriptor2);
            assert.strictEqual(editorRegistry.getEditorPane(disposables.add(new OtherTestInput())), editorDescriptor2);
            assert.strictEqual(editorRegistry.getEditorPaneByType('id1'), editorDescriptor1);
            assert.strictEqual(editorRegistry.getEditorPaneByType('id2'), editorDescriptor2);
            assert(!editorRegistry.getEditorPaneByType('id3'));
        });
        test('Editor Pane Lookup favors specific class over superclass (match on specific class)', function () {
            const d1 = editor_2.EditorPaneDescriptor.create(TestEditor, 'id1', 'name');
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add(editorRegistry.registerEditorPane(d1, [new descriptors_1.SyncDescriptor(TestResourceEditorInput)]));
            const inst = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const group = new workbenchTestServices_1.TestEditorGroupView(1);
            const editor = disposables.add(editorRegistry.getEditorPane(disposables.add(inst.createInstance(TestResourceEditorInput, uri_1.URI.file('/fake'), 'fake', '', undefined, undefined))).instantiate(inst, group));
            assert.strictEqual(editor.getId(), 'testEditor');
            const otherEditor = disposables.add(editorRegistry.getEditorPane(disposables.add(inst.createInstance(textResourceEditorInput_1.TextResourceEditorInput, uri_1.URI.file('/fake'), 'fake', '', undefined, undefined))).instantiate(inst, group));
            assert.strictEqual(otherEditor.getId(), 'workbench.editors.textResourceEditor');
        });
        test('Editor Pane Lookup favors specific class over superclass (match on super class)', function () {
            const inst = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const group = new workbenchTestServices_1.TestEditorGroupView(1);
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            const editor = disposables.add(editorRegistry.getEditorPane(disposables.add(inst.createInstance(TestResourceEditorInput, uri_1.URI.file('/fake'), 'fake', '', undefined, undefined))).instantiate(inst, group));
            assert.strictEqual('workbench.editors.textResourceEditor', editor.getId());
        });
        test('Editor Input Serializer', function () {
            const testInput = disposables.add(new workbenchTestServices_1.TestEditorInput(uri_1.URI.file('/fake'), 'testTypeId'));
            (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables).invokeFunction(accessor => editorInputRegistry.start(accessor));
            disposables.add(editorInputRegistry.registerEditorSerializer(testInput.typeId, TestInputSerializer));
            let factory = editorInputRegistry.getEditorSerializer('testTypeId');
            assert(factory);
            factory = editorInputRegistry.getEditorSerializer(testInput);
            assert(factory);
            // throws when registering serializer for same type
            assert.throws(() => editorInputRegistry.registerEditorSerializer(testInput.typeId, TestInputSerializer));
        });
        test('EditorMemento - basics', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            const testGroup1 = new workbenchTestServices_1.TestEditorGroupView(1);
            const testGroup4 = new workbenchTestServices_1.TestEditorGroupView(4);
            const configurationService = new workbenchTestServices_1.TestTextResourceConfigurationService();
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([
                testGroup0,
                testGroup1,
                new workbenchTestServices_1.TestEditorGroupView(2)
            ]);
            const rawMemento = Object.create(null);
            let memento = disposables.add(new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService));
            let res = memento.loadEditorState(testGroup0, uri_1.URI.file('/A'));
            assert.ok(!res);
            memento.saveEditorState(testGroup0, uri_1.URI.file('/A'), { line: 3 });
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/A'));
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            memento.saveEditorState(testGroup1, uri_1.URI.file('/A'), { line: 5 });
            res = memento.loadEditorState(testGroup1, uri_1.URI.file('/A'));
            assert.ok(res);
            assert.strictEqual(res.line, 5);
            // Ensure capped at 3 elements
            memento.saveEditorState(testGroup0, uri_1.URI.file('/B'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/C'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/D'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/E'), { line: 1 });
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/A')));
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/B')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
            // Save at an unknown group
            memento.saveEditorState(testGroup4, uri_1.URI.file('/E'), { line: 1 });
            assert.ok(memento.loadEditorState(testGroup4, uri_1.URI.file('/E'))); // only gets removed when memento is saved
            memento.saveEditorState(testGroup4, uri_1.URI.file('/C'), { line: 1 });
            assert.ok(memento.loadEditorState(testGroup4, uri_1.URI.file('/C'))); // only gets removed when memento is saved
            memento.saveState();
            memento = disposables.add(new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
            // Check on entries no longer there from invalid groups
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/E')));
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/C')));
            memento.clearEditorState(uri_1.URI.file('/C'), testGroup4);
            memento.clearEditorState(uri_1.URI.file('/E'));
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
        });
        test('EditorMemento - move', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            const configurationService = new workbenchTestServices_1.TestTextResourceConfigurationService();
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([testGroup0]);
            const rawMemento = Object.create(null);
            const memento = disposables.add(new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService));
            memento.saveEditorState(testGroup0, uri_1.URI.file('/some/folder/file-1.txt'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/some/folder/file-2.txt'), { line: 2 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/some/other/file.txt'), { line: 3 });
            memento.moveEditorState(uri_1.URI.file('/some/folder/file-1.txt'), uri_1.URI.file('/some/folder/file-moved.txt'), resources_1.extUri);
            let res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder/file-1.txt'));
            assert.ok(!res);
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder/file-moved.txt'));
            assert.strictEqual(res?.line, 1);
            memento.moveEditorState(uri_1.URI.file('/some/folder'), uri_1.URI.file('/some/folder-moved'), resources_1.extUri);
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder-moved/file-moved.txt'));
            assert.strictEqual(res?.line, 1);
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder-moved/file-2.txt'));
            assert.strictEqual(res?.line, 2);
        });
        test('EditoMemento - use with editor input', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            class TestEditorInput extends editorInput_1.EditorInput {
                constructor(resource, id = 'testEditorInputForMementoTest') {
                    super();
                    this.resource = resource;
                    this.id = id;
                }
                get typeId() { return 'testEditorInputForMementoTest'; }
                async resolve() { return null; }
                matches(other) {
                    return other && this.id === other.id && other instanceof TestEditorInput;
                }
            }
            const rawMemento = Object.create(null);
            const memento = disposables.add(new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, new workbenchTestServices_1.TestEditorGroupsService(), new workbenchTestServices_1.TestTextResourceConfigurationService()));
            const testInputA = disposables.add(new TestEditorInput(uri_1.URI.file('/A')));
            let res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputA, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            // State removed when input gets disposed
            testInputA.dispose();
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
        });
        test('EditoMemento - clear on editor dispose', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            class TestEditorInput extends editorInput_1.EditorInput {
                constructor(resource, id = 'testEditorInputForMementoTest') {
                    super();
                    this.resource = resource;
                    this.id = id;
                }
                get typeId() { return 'testEditorInputForMementoTest'; }
                async resolve() { return null; }
                matches(other) {
                    return other && this.id === other.id && other instanceof TestEditorInput;
                }
            }
            const rawMemento = Object.create(null);
            const memento = disposables.add(new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, new workbenchTestServices_1.TestEditorGroupsService(), new workbenchTestServices_1.TestTextResourceConfigurationService()));
            const testInputA = disposables.add(new TestEditorInput(uri_1.URI.file('/A')));
            let res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputA.resource, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            // State not yet removed when input gets disposed
            // because we used resource
            testInputA.dispose();
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            const testInputB = disposables.add(new TestEditorInput(uri_1.URI.file('/B')));
            res = memento.loadEditorState(testGroup0, testInputB);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputB.resource, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputB);
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            memento.clearEditorStateOnDispose(testInputB.resource, testInputB);
            // State removed when input gets disposed
            testInputB.dispose();
            res = memento.loadEditorState(testGroup0, testInputB);
            assert.ok(!res);
        });
        test('EditorMemento - workbench.editor.sharedViewState', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            const testGroup1 = new workbenchTestServices_1.TestEditorGroupView(1);
            const configurationService = new workbenchTestServices_1.TestTextResourceConfigurationService(new testConfigurationService_1.TestConfigurationService({
                workbench: {
                    editor: {
                        sharedViewState: true
                    }
                }
            }));
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([testGroup0]);
            const rawMemento = Object.create(null);
            const memento = disposables.add(new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService));
            const resource = uri_1.URI.file('/some/folder/file-1.txt');
            memento.saveEditorState(testGroup0, resource, { line: 1 });
            let res = memento.loadEditorState(testGroup0, resource);
            assert.strictEqual(res.line, 1);
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 1);
            memento.saveEditorState(testGroup0, resource, { line: 3 });
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 3);
            memento.saveEditorState(testGroup1, resource, { line: 1 });
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 1);
            memento.clearEditorState(resource, testGroup0);
            memento.clearEditorState(resource, testGroup1);
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 1);
            memento.clearEditorState(resource);
            res = memento.loadEditorState(testGroup1, resource);
            assert.ok(!res);
        });
        test('WorkspaceTrustRequiredEditor', async function () {
            let TrustRequiredTestEditor = class TrustRequiredTestEditor extends editorPane_1.EditorPane {
                constructor(group, telemetryService) {
                    super('TestEditor', group, telemetryUtils_1.NullTelemetryService, NullThemeService, disposables.add(new workbenchTestServices_2.TestStorageService()));
                }
                getId() { return 'trustRequiredTestEditor'; }
                layout() { }
                createEditor() { }
            };
            TrustRequiredTestEditor = __decorate([
                __param(1, telemetry_1.ITelemetryService)
            ], TrustRequiredTestEditor);
            class TrustRequiredTestInput extends editorInput_1.EditorInput {
                constructor() {
                    super(...arguments);
                    this.resource = undefined;
                }
                get typeId() {
                    return 'trustRequiredTestInput';
                }
                get capabilities() {
                    return 16 /* EditorInputCapabilities.RequiresTrust */;
                }
                resolve() {
                    return null;
                }
            }
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const workspaceTrustService = disposables.add(instantiationService.createInstance(workbenchTestServices_2.TestWorkspaceTrustManagementService));
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, workspaceTrustService);
            workspaceTrustService.setWorkspaceTrust(false);
            const editorPart = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, editorPart);
            const editorService = disposables.add(instantiationService.createInstance(editorService_1.EditorService, undefined));
            instantiationService.stub(editorService_2.IEditorService, editorService);
            const group = editorPart.activeGroup;
            const editorDescriptor = editor_2.EditorPaneDescriptor.create(TrustRequiredTestEditor, 'id1', 'name');
            disposables.add(editorRegistry.registerEditorPane(editorDescriptor, [new descriptors_1.SyncDescriptor(TrustRequiredTestInput)]));
            const testInput = disposables.add(new TrustRequiredTestInput());
            await group.openEditor(testInput);
            assert.strictEqual(group.activeEditorPane?.getId(), editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.ID);
            const getEditorPaneIdAsync = () => new Promise(resolve => {
                disposables.add(editorService.onDidActiveEditorChange(() => {
                    resolve(group.activeEditorPane?.getId());
                }));
            });
            workspaceTrustService.setWorkspaceTrust(true);
            assert.strictEqual(await getEditorPaneIdAsync(), 'trustRequiredTestEditor');
            workspaceTrustService.setWorkspaceTrust(false);
            assert.strictEqual(await getEditorPaneIdAsync(), editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.ID);
            await group.closeAllEditors();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFuZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JQYW5lLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUE0QmhHLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxtQ0FBZ0IsRUFBRSxDQUFDO0lBRWhELE1BQU0sY0FBYyxHQUF1QixtQkFBUSxDQUFDLEVBQUUsQ0FBQyx5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwRixNQUFNLG1CQUFtQixHQUEyQixtQkFBUSxDQUFDLEVBQUUsQ0FBQyx5QkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUVoRyxNQUFNLFVBQVcsU0FBUSx1QkFBVTtRQUVsQyxZQUFZLEtBQW1CO1lBQzlCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLHFDQUFvQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU5RyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFUSxLQUFLLEtBQWEsT0FBTyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sS0FBVyxDQUFDO1FBQ1IsWUFBWSxLQUFVLENBQUM7S0FDakM7SUFFRCxNQUFNLGVBQWdCLFNBQVEsdUJBQVU7UUFFdkMsWUFBWSxLQUFtQjtZQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLHFDQUFvQixFQUFFLGdCQUFn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