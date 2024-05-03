/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/workbench/contrib/editSessions/browser/editSessions.contribution", "vs/workbench/services/progress/browser/progressService", "vs/platform/progress/common/progress", "vs/workbench/contrib/scm/common/scm", "vs/workbench/contrib/scm/common/scmService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/base/test/common/mock", "sinon", "assert", "vs/workbench/contrib/editSessions/common/editSessions", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/environment/common/environment", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/common/views", "vs/editor/common/services/resolverService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/editor/common/editorService", "vs/base/common/cancellation", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/editSessions", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/workspaces/common/workspaceIdentityService"], function (require, exports, lifecycle_1, files_1, fileService_1, network_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, editSessions_contribution_1, progressService_1, progress_1, scm_1, scmService_1, testConfigurationService_1, configuration_1, workspace_1, mock_1, sinon, assert, editSessions_1, uri_1, resources_1, notification_1, testNotificationService_1, workbenchTestServices_1, environment_1, mockKeybindingService_1, contextkey_1, themeService_1, event_1, views_1, resolverService_1, lifecycle_2, dialogs_1, editorService_1, cancellation_1, telemetry_1, telemetryUtils_1, remoteAgentService_1, extensions_1, editSessions_2, userDataProfile_1, productService_1, storage_1, workbenchTestServices_2, uriIdentity_1, uriIdentityService_1, workspaceIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const folderName = 'test-folder';
    const folderUri = uri_1.URI.file(`/${folderName}`);
    suite('Edit session sync', () => {
        let instantiationService;
        let editSessionsContribution;
        let fileService;
        let sandbox;
        const disposables = new lifecycle_1.DisposableStore();
        suiteSetup(() => {
            sandbox = sinon.createSandbox();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            // Set up filesystem
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(network_1.Schemas.file, fileSystemProvider);
            // Stub out all services
            instantiationService.stub(editSessions_1.IEditSessionsLogService, logService);
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(lifecycle_2.ILifecycleService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onWillShutdown = event_1.Event.None;
                }
            });
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            instantiationService.stub(productService_1.IProductService, { 'editSessions.store': { url: 'https://test.com', canSwitch: true, authenticationProviders: {} } });
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_2.TestStorageService());
            instantiationService.stub(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(fileService));
            instantiationService.stub(editSessions_1.IEditSessionsStorageService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidSignIn = event_1.Event.None;
                    this.onDidSignOut = event_1.Event.None;
                }
            });
            instantiationService.stub(extensions_1.IExtensionService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidChangeExtensions = event_1.Event.None;
                }
            });
            instantiationService.stub(progress_1.IProgressService, progressService_1.ProgressService);
            instantiationService.stub(scm_1.ISCMService, scmService_1.SCMService);
            instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(dialogs_1.IDialogService, new class extends (0, mock_1.mock)() {
                async prompt(prompt) {
                    const result = prompt.buttons?.[0].run({ checkboxChecked: false });
                    return { result };
                }
                async confirm() {
                    return { confirmed: false };
                }
            });
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, new class extends (0, mock_1.mock)() {
                async getEnvironment() {
                    return null;
                }
            });
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService({ workbench: { experimental: { editSessions: { enabled: true } } } }));
            instantiationService.stub(workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                getWorkspace() {
                    return {
                        id: 'workspace-id',
                        folders: [{
                                uri: folderUri,
                                name: folderName,
                                index: 0,
                                toResource: (relativePath) => (0, resources_1.joinPath)(folderUri, relativePath)
                            }]
                    };
                }
                getWorkbenchState() {
                    return 2 /* WorkbenchState.FOLDER */;
                }
            });
            // Stub repositories
            instantiationService.stub(scm_1.ISCMService, '_repositories', new Map());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(themeService_1.IThemeService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidColorThemeChange = event_1.Event.None;
                    this.onDidFileIconThemeChange = event_1.Event.None;
                }
            });
            instantiationService.stub(views_1.IViewDescriptorService, {
                onDidChangeLocation: event_1.Event.None
            });
            instantiationService.stub(resolverService_1.ITextModelService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.registerTextModelContentProvider = () => ({ dispose: () => { } });
                }
            });
            instantiationService.stub(editorService_1.IEditorService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.saveAll = async (_options) => { return { success: true, editors: [] }; };
                }
            });
            instantiationService.stub(editSessions_2.IEditSessionIdentityService, new class extends (0, mock_1.mock)() {
                async getEditSessionIdentifier() {
                    return 'test-identity';
                }
            });
            instantiationService.set(workspaceIdentityService_1.IWorkspaceIdentityService, instantiationService.createInstance(workspaceIdentityService_1.WorkspaceIdentityService));
            instantiationService.stub(userDataProfile_1.IUserDataProfilesService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.defaultProfile = {
                        id: 'default',
                        name: 'Default',
                        isDefault: true,
                        location: uri_1.URI.file('location'),
                        globalStorageHome: uri_1.URI.file('globalStorageHome'),
                        settingsResource: uri_1.URI.file('settingsResource'),
                        keybindingsResource: uri_1.URI.file('keybindingsResource'),
                        tasksResource: uri_1.URI.file('tasksResource'),
                        snippetsHome: uri_1.URI.file('snippetsHome'),
                        extensionsResource: uri_1.URI.file('extensionsResource'),
                        cacheHome: uri_1.URI.file('cacheHome'),
                    };
                }
            });
            editSessionsContribution = instantiationService.createInstance(editSessions_contribution_1.EditSessionsContribution);
        });
        teardown(() => {
            sinon.restore();
            disposables.clear();
        });
        test('Can apply edit session', async function () {
            const fileUri = (0, resources_1.joinPath)(folderUri, 'dir1', 'README.md');
            const fileContents = '# readme';
            const editSession = {
                version: 1,
                folders: [
                    {
                        name: folderName,
                        workingChanges: [
                            {
                                relativeFilePath: 'dir1/README.md',
                                fileType: editSessions_1.FileType.File,
                                contents: fileContents,
                                type: editSessions_1.ChangeType.Addition
                            }
                        ]
                    }
                ]
            };
            // Stub sync service to return edit session data
            const readStub = sandbox.stub().returns({ content: JSON.stringify(editSession), ref: '0' });
            instantiationService.stub(editSessions_1.IEditSessionsStorageService, 'read', readStub);
            // Create root folder
            await fileService.createFolder(folderUri);
            // Resume edit session
            await editSessionsContribution.resumeEditSession();
            // Verify edit session was correctly applied
            assert.equal((await fileService.readFile(fileUri)).value.toString(), fileContents);
        });
        test('Edit session not stored if there are no edits', async function () {
            const writeStub = sandbox.stub();
            instantiationService.stub(editSessions_1.IEditSessionsStorageService, 'write', writeStub);
            // Create root folder
            await fileService.createFolder(folderUri);
            await editSessionsContribution.storeEditSession(true, cancellation_1.CancellationToken.None);
            // Verify that we did not attempt to write the edit session
            assert.equal(writeStub.called, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2VkaXRTZXNzaW9ucy90ZXN0L2Jyb3dzZXIvZWRpdFNlc3Npb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrRGhHLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztJQUNqQyxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQztJQUU3QyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQy9CLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSx3QkFBa0QsQ0FBQztRQUN2RCxJQUFJLFdBQXdCLENBQUM7UUFDN0IsSUFBSSxPQUEyQixDQUFDO1FBRWhDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZixPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBRWhDLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUV0RCxvQkFBb0I7WUFDcEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7WUFDeEMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDO1lBQzdFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRS9ELHdCQUF3QjtZQUN4QixvQkFBb0Is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