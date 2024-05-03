/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/mock", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/common/memento", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, mock_1, configuration_1, testConfigurationService_1, fileService_1, instantiationServiceMock_1, log_1, remoteAuthorityResolver_1, storage_1, workspace_1, workspaceTrust_1, testWorkspace_1, memento_1, environmentService_1, uriIdentity_1, uriIdentityService_1, workspaceTrust_2, workbenchTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspace Trust', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let environmentService;
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            configurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            environmentService = {};
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            const fileService = store.add(new fileService_1.FileService(new log_1.NullLogService()));
            const uriIdentityService = store.add(new uriIdentityService_1.UriIdentityService(fileService));
            instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            instantiationService.stub(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, new class extends (0, mock_1.mock)() {
            });
        });
        suite('Enablement', () => {
            test('workspace trust enabled', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                const testObject = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService));
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), true);
            });
            test('workspace trust disabled (user setting)', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(false, true));
                const testObject = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService));
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), false);
            });
            test('workspace trust disabled (--disable-workspace-trust)', () => {
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { ...environmentService, disableWorkspaceTrust: true });
                const testObject = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService));
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), false);
            });
        });
        suite('Management', () => {
            let storageService;
            let workspaceService;
            teardown(() => {
                memento_1.Memento.clear(1 /* StorageScope.WORKSPACE */);
            });
            setup(() => {
                storageService = store.add(new workbenchTestServices_1.TestStorageService());
                instantiationService.stub(storage_1.IStorageService, storageService);
                workspaceService = new workbenchTestServices_1.TestContextService();
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
            });
            test('empty workspace - trusted', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(true, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - untrusted', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, false));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(false, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - trusted, open trusted file', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                const trustInfo = { uriTrustInfo: [{ uri: uri_1.URI.parse('file:///Folder'), trusted: true }] };
                storageService.store(workspaceTrust_2.WORKSPACE_TRUST_STORAGE_KEY, JSON.stringify(trustInfo), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                environmentService.filesToOpenOrCreate = [{ fileUri: uri_1.URI.parse('file:///Folder/file.txt') }];
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { ...environmentService });
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(true, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - trusted, open untrusted file', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                environmentService.filesToOpenOrCreate = [{ fileUri: uri_1.URI.parse('file:///Folder/foo.txt') }];
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { ...environmentService });
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(false, testObject.isWorkspaceTrusted());
            });
            async function initializeTestObject() {
                const workspaceTrustManagementService = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustManagementService));
                await workspaceTrustManagementService.workspaceTrustInitialized;
                return workspaceTrustManagementService;
            }
        });
        function getUserSettings(enabled, emptyWindow) {
            return { workspace: { trust: { emptyWindow, enabled } } };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3QudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtzcGFjZXMvdGVzdC9jb21tb24vd29ya3NwYWNlVHJ1c3QudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVCaEcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUM3QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksa0JBQWdELENBQUM7UUFFckQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7WUFFakUsb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ3RELG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRXZFLGtCQUFrQixHQUFHLEVBQWtDLENBQUM7WUFDeEQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlEQUE0QixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFFNUUsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlCQUFXLENBQUMsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFFMUUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlDQUFtQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDbkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHlEQUErQixFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFtQzthQUFJLENBQUMsQ0FBQztRQUMzSCxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDMUMsTUFBTSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6RixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxnREFBK0IsQ0FBQyxDQUFDLENBQUM7Z0JBRW5HLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzFELE1BQU0sb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDMUYsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0RBQStCLENBQUMsQ0FBQyxDQUFDO2dCQUVuRyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtnQkFDakUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlEQUE0QixFQUFFLEVBQUUsR0FBRyxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNoSCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxnREFBK0IsQ0FBQyxDQUFDLENBQUM7Z0JBRW5HLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLElBQUksY0FBa0MsQ0FBQztZQUN2QyxJQUFJLGdCQUFvQyxDQUFDO1lBRXpDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2IsaUJBQU8sQ0FBQyxLQUFLLGdDQUF3QixDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDVixjQUFjLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQztnQkFDckQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHlCQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBRTNELGdCQUFnQixHQUFHLElBQUksMENBQWtCLEVBQUUsQ0FBQztnQkFDNUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9DQUF3QixFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBRXRFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpREFBZ0MsRUFBRSxJQUFJLDJEQUFtQyxFQUFFLENBQUMsQ0FBQztZQUN4RyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDNUMsTUFBTSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6RixnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsSUFBSSx5QkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxVQUFVLEdBQUcsTUFBTSxvQkFBb0IsRUFBRSxDQUFDO2dCQUVoRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUM5QyxNQUFNLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzFGLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLHlCQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLFVBQVUsR0FBRyxNQUFNLG9CQUFvQixFQUFFLENBQUM7Z0JBRWhELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDNUQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQy9ELE1BQU0sb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDekYsTUFBTSxTQUFTLEdBQXdCLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQy9HLGNBQWMsQ0FBQyxLQUFLLENBQUMsNENBQTJCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsbUVBQWtELENBQUM7Z0JBRTdILGtCQUEwQixDQUFDLG1CQUFtQixHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlEQUE0QixFQUFFLEVBQUUsR0FBRyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7Z0JBRW5GLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLHlCQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLFVBQVUsR0FBRyxNQUFNLG9CQUFvQixFQUFFLENBQUM7Z0JBRWhELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDM0QsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ2pFLE1BQU0sb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFeEYsa0JBQTBCLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaURBQTRCLEVBQUUsRUFBRSxHQUFHLGtCQUFrQixFQUFFLENBQUMsQ0FBQztnQkFFbkYsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLElBQUkseUJBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sVUFBVSxHQUFHLE1BQU0sb0JBQW9CLEVBQUUsQ0FBQztnQkFFaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztZQUM1RCxDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssVUFBVSxvQkFBb0I7Z0JBQ2xDLE1BQU0sK0JBQStCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0RBQStCLENBQUMsQ0FBQyxDQUFDO2dCQUN4SCxNQUFNLCtCQUErQixDQUFDLHlCQUF5QixDQUFDO2dCQUVoRSxPQUFPLCtCQUErQixDQUFDO1lBQ3hDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsZUFBZSxDQUFDLE9BQWdCLEVBQUUsV0FBb0I7WUFDOUQsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDM0QsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDIn0=