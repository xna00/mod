/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/workbench/contrib/files/browser/editors/textFileEditorTracker", "vs/base/test/common/utils", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/editor/browser/editorService", "vs/base/common/resources", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/contrib/files/common/files", "vs/workbench/common/editor", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, assert, event_1, textFileEditorTracker_1, utils_1, editorService_1, workbenchTestServices_1, textfiles_1, files_1, editorGroupsService_1, async_1, lifecycle_1, editorService_2, resources_1, testConfigurationService_1, configuration_1, filesConfigurationService_1, mockKeybindingService_1, files_2, editor_1, testWorkspace_1, workbenchTestServices_2, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - TextFileEditorTracker', () => {
        const disposables = new lifecycle_1.DisposableStore();
        class TestTextFileEditorTracker extends textFileEditorTracker_1.TextFileEditorTracker {
            getDirtyTextFileTrackerDelay() {
                return 5; // encapsulated in a method for tests to override
            }
        }
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        async function createTracker(autoSaveEnabled = false) {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            if (autoSaveEnabled) {
                configurationService.setUserConfiguration('files', { autoSave: 'afterDelay', autoSaveDelay: 1 });
            }
            else {
                configurationService.setUserConfiguration('files', { autoSave: 'off', autoSaveDelay: 1 });
            }
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            const fileService = disposables.add(new workbenchTestServices_1.TestFileService());
            instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, disposables.add(new workbenchTestServices_1.TestFilesConfigurationService(instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService), configurationService, new workbenchTestServices_2.TestContextService(testWorkspace_1.TestWorkspace), workbenchTestServices_1.TestEnvironmentService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)), fileService, new workbenchTestServices_2.TestMarkerService(), new workbenchTestServices_1.TestTextResourceConfigurationService(configurationService))));
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            disposables.add(editorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
            disposables.add(instantiationService.createInstance(TestTextFileEditorTracker));
            const cleanup = async () => {
                await (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
                part.dispose();
            };
            return { accessor, cleanup };
        }
        test('file change event updates model', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const model = await accessor.textFileService.files.resolve(resource);
            disposables.add(model);
            model.textEditorModel.setValue('Super Good');
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), 'Super Good');
            await model.save();
            // change event (watcher)
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* FileChangeType.UPDATED */ }], false));
            await (0, async_1.timeout)(0); // due to event updating model async
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), 'Hello Html');
            await cleanup();
        });
        test('dirty text file model opens as editor', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, false, false);
        });
        test('dirty text file model does not open as editor if autosave is ON', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, true, false);
        });
        test('dirty text file model opens as editor when save fails', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, false, true);
        });
        test('dirty text file model opens as editor when save fails if autosave is ON', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, true, true);
        });
        async function testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, autoSave, error) {
            const { accessor, cleanup } = await createTracker(autoSave);
            assert.ok(!accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
            if (error) {
                accessor.textFileService.setWriteErrorOnce(new files_1.FileOperationError('fail to write', 10 /* FileOperationResult.FILE_OTHER_ERROR */));
            }
            const model = await accessor.textFileService.files.resolve(resource);
            disposables.add(model);
            model.textEditorModel.setValue('Super Good');
            if (autoSave) {
                await model.save();
                await (0, async_1.timeout)(10);
                if (error) {
                    assert.ok(accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
                }
                else {
                    assert.ok(!accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
                }
            }
            else {
                await awaitEditorOpening(accessor.editorService);
                assert.ok(accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
            }
            await cleanup();
        }
        test('dirty untitled text file model opens as editor', function () {
            return testUntitledEditor(false);
        });
        test('dirty untitled text file model opens as editor - autosave ON', function () {
            return testUntitledEditor(true);
        });
        async function testUntitledEditor(autoSaveEnabled) {
            const { accessor, cleanup } = await createTracker(autoSaveEnabled);
            const untitledTextEditor = await accessor.textEditorService.resolveTextEditor({ resource: undefined, forceUntitled: true });
            const model = disposables.add(await untitledTextEditor.resolve());
            assert.ok(!accessor.editorService.isOpened(untitledTextEditor));
            model.textEditorModel?.setValue('Super Good');
            await awaitEditorOpening(accessor.editorService);
            assert.ok(accessor.editorService.isOpened(untitledTextEditor));
            await cleanup();
        }
        function awaitEditorOpening(editorService) {
            return event_1.Event.toPromise(event_1.Event.once(editorService.onDidActiveEditorChange));
        }
        test('non-dirty files reload on window focus', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor(await accessor.textEditorService.resolveTextEditor({ resource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } }));
            accessor.hostService.setFocus(false);
            accessor.hostService.setFocus(true);
            await awaitModelResolveEvent(accessor.textFileService, resource);
            await cleanup();
        });
        function awaitModelResolveEvent(textFileService, resource) {
            return new Promise(resolve => {
                const listener = textFileService.files.onDidResolve(e => {
                    if ((0, resources_1.isEqual)(e.model.resource, resource)) {
                        listener.dispose();
                        resolve();
                    }
                });
            });
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JUcmFja2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL3Rlc3QvYnJvd3Nlci90ZXh0RmlsZUVkaXRvclRyYWNrZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZCaEcsS0FBSyxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUUzQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxNQUFNLHlCQUEwQixTQUFRLDZDQUFxQjtZQUV6Qyw0QkFBNEI7Z0JBQzlDLE9BQU8sQ0FBQyxDQUFDLENBQUMsaURBQWlEO1lBQzVELENBQUM7U0FDRDtRQUVELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsOENBQXNCLEdBQUUsQ0FBQyxDQUFDO1lBQzFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSxrREFBMEIsR0FBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxVQUFVLGFBQWEsQ0FBQyxlQUFlLEdBQUcsS0FBSztZQUNuRCxNQUFNLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRW5GLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQzVELElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFF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