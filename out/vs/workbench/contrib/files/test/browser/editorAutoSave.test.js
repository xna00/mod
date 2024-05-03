/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/lifecycle", "vs/workbench/services/editor/browser/editorService", "vs/workbench/browser/parts/editor/editorAutoSave", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/common/editor", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, assert, event_1, utils_1, editorService_1, workbenchTestServices_1, editorGroupsService_1, lifecycle_1, editorService_2, editorAutoSave_1, configuration_1, testConfigurationService_1, filesConfigurationService_1, mockKeybindingService_1, editor_1, testWorkspace_1, workbenchTestServices_2, uriIdentityService_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorAutoSave', () => {
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        async function createEditorAutoSave(autoSaveConfig) {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('files', autoSaveConfig);
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(accessibilitySignalService_1.IAccessibilitySignalService, {
                playSignal: async () => { },
                isSoundEnabled(signal) { return false; },
            });
            instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, disposables.add(new workbenchTestServices_1.TestFilesConfigurationService(instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService), configurationService, new workbenchTestServices_2.TestContextService(testWorkspace_1.TestWorkspace), workbenchTestServices_1.TestEnvironmentService, disposables.add(new uriIdentityService_1.UriIdentityService(disposables.add(new workbenchTestServices_1.TestFileService()))), disposables.add(new workbenchTestServices_1.TestFileService()), new workbenchTestServices_2.TestMarkerService(), new workbenchTestServices_1.TestTextResourceConfigurationService(configurationService))));
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
            disposables.add(instantiationService.createInstance(editorAutoSave_1.EditorAutoSave));
            return accessor;
        }
        test('editor auto saves after short delay if configured', async function () {
            const accessor = await createEditorAutoSave({ autoSave: 'afterDelay', autoSaveDelay: 1 });
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const model = disposables.add(await accessor.textFileService.files.resolve(resource));
            model.textEditorModel?.setValue('Super Good');
            assert.ok(model.isDirty());
            await awaitModelSaved(model);
            assert.strictEqual(model.isDirty(), false);
        });
        test('editor auto saves on focus change if configured', async function () {
            const accessor = await createEditorAutoSave({ autoSave: 'onFocusChange' });
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } });
            const model = disposables.add(await accessor.textFileService.files.resolve(resource));
            model.textEditorModel?.setValue('Super Good');
            assert.ok(model.isDirty());
            const editorPane = await accessor.editorService.openEditor({ resource: utils_1.toResource.call(this, '/path/index_other.txt') });
            await awaitModelSaved(model);
            assert.strictEqual(model.isDirty(), false);
            await editorPane?.group.closeAllEditors();
        });
        function awaitModelSaved(model) {
            return event_1.Event.toPromise(event_1.Event.once(model.onDidChangeDirty));
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQXV0b1NhdmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvdGVzdC9icm93c2VyL2VkaXRvckF1dG9TYXZlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF3QmhHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFFNUIsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSw4Q0FBc0IsR0FBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxVQUFVLG9CQUFvQixDQUFDLGNBQXNCO1lBQ3pELE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFbkYsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDNUQsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ25FLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3ZFLG9CQUFvQixDQUFDLElBQUksQ0FBQyx3REFBMkIsRUFBRTtnQkFDdEQsVUFBVSxFQUFFLEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQztnQkFDM0IsY0FBYyxDQUFDLE1BQWUsSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDMUMsQ0FBQyxDQUFDO1lBQ1Ys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