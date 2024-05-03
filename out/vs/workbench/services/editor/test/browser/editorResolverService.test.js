/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, lifecycle_1, network_1, uri_1, utils_1, diffEditorInput_1, editorResolverService_1, editorGroupsService_1, editorResolverService_2, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorResolverService', () => {
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorResolverService';
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => disposables.clear());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function createEditorResolverService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorResolverService = instantiationService.createInstance(editorResolverService_1.EditorResolverService);
            instantiationService.stub(editorResolverService_2.IEditorResolverService, editorResolverService);
            disposables.add(editorResolverService);
            return [part, editorResolverService, instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor)];
        }
        function constructDisposableFileEditorInput(uri, typeId, store) {
            const editor = new workbenchTestServices_1.TestFileEditorInput(uri, typeId);
            store.add(editor);
            return editor;
        }
        test('Simple Resolve', async () => {
            const [part, service] = await createEditorResolverService();
            const registeredEditor = service.registerEditor('*.test', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
            });
            const resultingResolution = await service.resolveEditor({ resource: uri_1.URI.file('my://resource-basics.test') }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, TEST_EDITOR_INPUT_ID);
                resultingResolution.editor.dispose();
            }
            registeredEditor.dispose();
        });
        test('Untitled Resolve', async () => {
            const UNTITLED_TEST_EDITOR_INPUT_ID = 'UNTITLED_TEST_INPUT';
            const [part, service] = await createEditorResolverService();
            const registeredEditor = service.registerEditor('*.test', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
                createUntitledEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput((resource ? resource : uri_1.URI.from({ scheme: network_1.Schemas.untitled })), UNTITLED_TEST_EDITOR_INPUT_ID) }),
            });
            // Untyped untitled - no resource
            let resultingResolution = await service.resolveEditor({ resource: undefined }, part.activeGroup);
            assert.ok(resultingResolution);
            // We don't expect untitled to match the *.test glob
            assert.strictEqual(typeof resultingResolution, 'number');
            // Untyped untitled - with untitled resource
            resultingResolution = await service.resolveEditor({ resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'foo.test' }) }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, UNTITLED_TEST_EDITOR_INPUT_ID);
                resultingResolution.editor.dispose();
            }
            // Untyped untitled - file resource with forceUntitled
            resultingResolution = await service.resolveEditor({ resource: uri_1.URI.file('/fake.test'), forceUntitled: true }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, UNTITLED_TEST_EDITOR_INPUT_ID);
                resultingResolution.editor.dispose();
            }
            registeredEditor.dispose();
        });
        test('Side by side Resolve', async () => {
            const [part, service] = await createEditorResolverService();
            const registeredEditorPrimary = service.registerEditor('*.test-primary', {
                id: 'TEST_EDITOR_PRIMARY',
                label: 'Test Editor Label Primary',
                detail: 'Test Editor Details Primary',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
            });
            const registeredEditorSecondary = service.registerEditor('*.test-secondary', {
                id: 'TEST_EDITOR_SECONDARY',
                label: 'Test Editor Label Secondary',
                detail: 'Test Editor Details Secondary',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
            });
            const resultingResolution = await service.resolveEditor({
                primary: { resource: uri_1.URI.file('my://resource-basics.test-primary') },
                secondary: { resource: uri_1.URI.file('my://resource-basics.test-secondary') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editorinputs.sidebysideEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            registeredEditorPrimary.dispose();
            registeredEditorSecondary.dispose();
        });
        test('Diff editor Resolve', async () => {
            const [part, service, accessor] = await createEditorResolverService();
            const registeredEditor = service.registerEditor('*.test-diff', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
                createDiffEditorInput: ({ modified, original, options }, group) => ({
                    editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                })
            });
            const resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            registeredEditor.dispose();
        });
        test('Diff editor Resolve - Different Types', async () => {
            const [part, service, accessor] = await createEditorResolverService();
            let diffOneCounter = 0;
            let diffTwoCounter = 0;
            let defaultDiffCounter = 0;
            const registeredEditor = service.registerEditor('*.test-diff', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
                createDiffEditorInput: ({ modified, original, options }, group) => {
                    diffOneCounter++;
                    return {
                        editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                    };
                }
            });
            const secondRegisteredEditor = service.registerEditor('*.test-secondDiff', {
                id: 'TEST_EDITOR_2',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
                createDiffEditorInput: ({ modified, original, options }, group) => {
                    diffTwoCounter++;
                    return {
                        editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                    };
                }
            });
            const defaultRegisteredEditor = service.registerEditor('*', {
                id: 'default',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.option
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
                createDiffEditorInput: ({ modified, original, options }, group) => {
                    defaultDiffCounter++;
                    return {
                        editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                    };
                }
            });
            let resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 0);
                assert.strictEqual(defaultDiffCounter, 0);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 0);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 1);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 2);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                options: { override: 'TEST_EDITOR' }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 2);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 2);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            registeredEditor.dispose();
            secondRegisteredEditor.dispose();
            defaultRegisteredEditor.dispose();
        });
        test('Registry & Events', async () => {
            const [, service] = await createEditorResolverService();
            let eventCounter = 0;
            disposables.add(service.onDidChangeEditorRegistrations(() => {
                eventCounter++;
            }));
            const editors = service.getEditors();
            const registeredEditor = service.registerEditor('*.test', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) })
            });
            assert.strictEqual(eventCounter, 1);
            assert.strictEqual(service.getEditors().length, editors.length + 1);
            assert.strictEqual(service.getEditors().some(editor => editor.id === 'TEST_EDITOR'), true);
            registeredEditor.dispose();
            assert.strictEqual(eventCounter, 2);
            assert.strictEqual(service.getEditors().length, editors.length);
            assert.strictEqual(service.getEditors().some(editor => editor.id === 'TEST_EDITOR'), false);
        });
        test('Multiple registrations to same glob and id #155859', async () => {
            const [part, service, accessor] = await createEditorResolverService();
            const testEditorInfo = {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            };
            const registeredSingleEditor = service.registerEditor('*.test', testEditorInfo, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) })
            });
            const registeredDiffEditor = service.registerEditor('*.test', testEditorInfo, {}, {
                createDiffEditorInput: ({ modified, original, options }, group) => ({
                    editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                })
            });
            // Resolve a diff
            let resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            // Remove diff registration
            registeredDiffEditor.dispose();
            // Resolve a diff again, expected failure
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.strictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.fail();
            }
            registeredSingleEditor.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvdGVzdC9icm93c2VyL2VkaXRvclJlc29sdmVyU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsTUFBTSxvQkFBb0IsR0FBRyx5Q0FBeUMsQ0FBQztRQUN2RSxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFcEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssVUFBVSwyQkFBMkIsQ0FBQyx1QkFBa0QsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDO1lBQ2pKLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSx3Q0FBZ0IsRUFBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN2RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFdEQsTUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQztZQUN6RixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOENBQXNCLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUN6RSxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFFdkMsT0FBTyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQ2hH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