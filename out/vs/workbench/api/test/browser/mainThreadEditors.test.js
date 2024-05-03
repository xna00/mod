/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/editor/test/browser/editorTestServices", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/workspace/common/workspace", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/contrib/bulkEdit/browser/bulkEditService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/label/common/labelService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, lifecycle_1, uri_1, mock_1, utils_1, bulkEditService_1, codeEditorService_1, editOperation_1, position_1, range_1, editorWorker_1, languageService_1, model_1, modelService_1, resolverService_1, editorTestServices_1, testLanguageConfigurationService_1, configuration_1, testConfigurationService_1, dialogs_1, testDialogService_1, environment_1, files_1, descriptors_1, instantiationService_1, serviceCollection_1, label_1, log_1, notification_1, testNotificationService_1, testThemeService_1, undoRedo_1, undoRedoService_1, uriIdentity_1, uriIdentityService_1, workspace_1, mainThreadBulkEdits_1, testRPCProtocol_1, bulkEditService_2, editorGroupsService_1, editorService_1, environmentService_1, labelService_1, lifecycle_2, panecomposite_1, textfiles_1, workingCopyFileService_1, workingCopyService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadEditors', () => {
        let disposables;
        const resource = uri_1.URI.parse('foo:bar');
        let modelService;
        let bulkEdits;
        const movedResources = new Map();
        const copiedResources = new Map();
        const createdResources = new Set();
        const deletedResources = new Set();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            movedResources.clear();
            copiedResources.clear();
            createdResources.clear();
            deletedResources.clear();
            const configService = new testConfigurationService_1.TestConfigurationService();
            const dialogService = new testDialogService_1.TestDialogService();
            const notificationService = new testNotificationService_1.TestNotificationService();
            const undoRedoService = new undoRedoService_1.UndoRedoService(dialogService, notificationService);
            const themeService = new testThemeService_1.TestThemeService();
            modelService = new modelService_1.ModelService(configService, new workbenchTestServices_2.TestTextResourcePropertiesService(configService), undoRedoService, disposables.add(new languageService_1.LanguageService()), new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            const services = new serviceCollection_1.ServiceCollection();
            services.set(bulkEditService_1.IBulkEditService, new descriptors_1.SyncDescriptor(bulkEditService_2.BulkEditService));
            services.set(label_1.ILabelService, new descriptors_1.SyncDescriptor(labelService_1.LabelService));
            services.set(log_1.ILogService, new log_1.NullLogService());
            services.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            services.set(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            services.set(environmentService_1.IWorkbenchEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            services.set(configuration_1.IConfigurationService, configService);
            services.set(dialogs_1.IDialogService, dialogService);
            services.set(notification_1.INotificationService, notificationService);
            services.set(undoRedo_1.IUndoRedoService, undoRedoService);
            services.set(model_1.IModelService, modelService);
            services.set(codeEditorService_1.ICodeEditorService, new editorTestServices_1.TestCodeEditorService(themeService));
            services.set(files_1.IFileService, new workbenchTestServices_1.TestFileService());
            services.set(uriIdentity_1.IUriIdentityService, new descriptors_1.SyncDescriptor(uriIdentityService_1.UriIdentityService));
            services.set(editorService_1.IEditorService, disposables.add(new workbenchTestServices_1.TestEditorService()));
            services.set(lifecycle_2.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            services.set(workingCopyService_1.IWorkingCopyService, new workbenchTestServices_1.TestWorkingCopyService());
            services.set(editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService());
            services.set(textfiles_1.ITextFileService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.files = {
                        onDidSave: event_1.Event.None,
                        onDidRevert: event_1.Event.None,
                        onDidChangeDirty: event_1.Event.None
                    };
                }
                isDirty() { return false; }
                create(operations) {
                    for (const o of operations) {
                        createdResources.add(o.resource);
                    }
                    return Promise.resolve(Object.create(null));
                }
                async getEncodedReadable(resource, value) {
                    return undefined;
                }
            });
            services.set(workingCopyFileService_1.IWorkingCopyFileService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidRunWorkingCopyFileOperation = event_1.Event.None;
                }
                createFolder(operations) {
                    this.create(operations);
                }
                create(operations) {
                    for (const operation of operations) {
                        createdResources.add(operation.resource);
                    }
                    return Promise.resolve(Object.create(null));
                }
                move(operations) {
                    const { source, target } = operations[0].file;
                    movedResources.set(source, target);
                    return Promise.resolve(Object.create(null));
                }
                copy(operations) {
                    const { source, target } = operations[0].file;
                    copiedResources.set(source, target);
                    return Promise.resolve(Object.create(null));
                }
                delete(operations) {
                    for (const operation of operations) {
                        deletedResources.add(operation.resource);
                    }
                    return Promise.resolve(undefined);
                }
            });
            services.set(resolverService_1.ITextModelService, new class extends (0, mock_1.mock)() {
                createModelReference(resource) {
                    const textEditorModel = new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.textEditorModel = modelService.getModel(resource);
                        }
                    };
                    textEditorModel.isReadonly = () => false;
                    return Promise.resolve(new lifecycle_1.ImmortalReference(textEditorModel));
                }
            });
            services.set(editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
            });
            services.set(panecomposite_1.IPaneCompositePartService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidPaneCompositeOpen = event_1.Event.None;
                    this.onDidPaneCompositeClose = event_1.Event.None;
                }
                getActivePaneComposite() {
                    return undefined;
                }
            });
            const instaService = new instantiationService_1.InstantiationService(services);
            bulkEdits = instaService.createInstance(mainThreadBulkEdits_1.MainThreadBulkEdits, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(null));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test(`applyWorkspaceEdit returns false if model is changed by user`, () => {
            const model = disposables.add(modelService.createModel('something', null, resource));
            const workspaceResourceEdit = {
                resource: resource,
                versionId: model.getVersionId(),
                textEdit: {
                    text: 'asdfg',
                    range: new range_1.Range(1, 1, 1, 1)
                }
            };
            // Act as if the user edited the model
            model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(0, 0), 'something')]);
            return bulkEdits.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit] }).then((result) => {
                assert.strictEqual(result, false);
            });
        });
        test(`issue #54773: applyWorkspaceEdit checks model version in race situation`, () => {
            const model = disposables.add(modelService.createModel('something', null, resource));
            const workspaceResourceEdit1 = {
                resource: resource,
                versionId: model.getVersionId(),
                textEdit: {
                    text: 'asdfg',
                    range: new range_1.Range(1, 1, 1, 1)
                }
            };
            const workspaceResourceEdit2 = {
                resource: resource,
                versionId: model.getVersionId(),
                textEdit: {
                    text: 'asdfg',
                    range: new range_1.Range(1, 1, 1, 1)
                }
            };
            const p1 = bulkEdits.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit1] }).then((result) => {
                // first edit request succeeds
                assert.strictEqual(result, true);
            });
            const p2 = bulkEdits.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit2] }).then((result) => {
                // second edit request fails
                assert.strictEqual(result, false);
            });
            return Promise.all([p1, p2]);
        });
        test(`applyWorkspaceEdit with only resource edit`, () => {
            return bulkEdits.$tryApplyWorkspaceEdit({
                edits: [
                    { oldResource: resource, newResource: resource, options: undefined },
                    { oldResource: undefined, newResource: resource, options: undefined },
                    { oldResource: resource, newResource: undefined, options: undefined }
                ]
            }).then((result) => {
                assert.strictEqual(result, true);
                assert.strictEqual(movedResources.get(resource), resource);
                assert.strictEqual(createdResources.has(resource), true);
                assert.strictEqual(deletedResources.has(resource), true);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVkaXRvcnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvbWFpblRocmVhZEVkaXRvcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdEaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFJLFdBQTRCLENBQUM7UUFDakMsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV0QyxJQUFJLFlBQTJCLENBQUM7UUFFaEMsSUFBSSxTQUE4QixDQUFDO1FBRW5DLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFZLENBQUM7UUFDM0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQVksQ0FBQztRQUM1QyxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFPLENBQUM7UUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBTyxDQUFDO1FBRXhDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFcEMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3ZCLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QixnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6QixnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUd6QixNQUFNLGFBQWEsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDckQsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzlDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxpREFBdUIsRUFBRSxDQUFDO1lBQzFELE1BQU0sZUFBZSxHQUFH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