/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/configuration/browser/configurationService", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/resolverService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/configuration/common/jsonEditingService", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/workbench/services/configuration/common/configuration", "vs/platform/sign/browser/signService", "vs/platform/userData/common/fileUserDataProvider", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/workbench/services/environment/common/environmentService", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/workbench/services/remote/browser/remoteAgentService", "vs/platform/remote/browser/remoteAuthorityResolverService", "vs/base/common/hash", "vs/workbench/test/common/workbenchTestServices", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/policy/common/filePolicyService", "vs/base/test/common/timeTravelScheduler", "vs/workbench/services/userDataProfile/common/userDataProfileService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService", "vs/base/test/common/utils"], function (require, exports, assert, sinon, uri_1, platform_1, environment_1, configurationRegistry_1, configurationService_1, files_1, workspace_1, configuration_1, workbenchTestServices_1, textfiles_1, resolverService_1, textModelResolverService_1, jsonEditing_1, jsonEditingService_1, network_1, resources_1, platform_2, remoteAgentService_1, fileService_1, log_1, configuration_2, signService_1, fileUserDataProvider_1, keybindingEditing_1, environmentService_1, async_1, buffer_1, event_1, uriIdentityService_1, inMemoryFilesystemProvider_1, remoteAgentService_2, remoteAuthorityResolverService_1, hash_1, workbenchTestServices_2, userDataProfile_1, policy_1, filePolicyService_1, timeTravelScheduler_1, userDataProfileService_1, userDataProfile_2, remoteSocketFactoryService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function convertToWorkspacePayload(folder) {
        return {
            id: (0, hash_1.hash)(folder.toString()).toString(16),
            uri: folder
        };
    }
    class ConfigurationCache {
        needsCaching(resource) { return false; }
        async read() { return ''; }
        async write() { }
        async remove() { }
    }
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    suite('WorkspaceContextService - Folder', () => {
        const folderName = 'Folder A';
        let folder;
        let testObject;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            folder = (0, resources_1.joinPath)(ROOT, folderName);
            await fileService.createFolder(folder);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            const userDataProfileService = disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, disposables.add(new remoteAgentService_2.RemoteAgentService(new remoteSocketFactoryService_1.RemoteSocketFactoryService(), userDataProfileService, environmentService, workbenchTestServices_2.TestProductService, disposables.add(new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(false, undefined, undefined, undefined, workbenchTestServices_2.TestProductService, logService)), new signService_1.SignService(workbenchTestServices_2.TestProductService), new log_1.NullLogService())), uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            await testObject.initialize(convertToWorkspacePayload(folder));
        });
        test('getWorkspace()', () => {
            const actual = testObject.getWorkspace();
            assert.strictEqual(actual.folders.length, 1);
            assert.strictEqual(actual.folders[0].uri.path, folder.path);
            assert.strictEqual(actual.folders[0].name, folderName);
            assert.strictEqual(actual.folders[0].index, 0);
            assert.ok(!actual.configuration);
        });
        test('getWorkbenchState()', () => {
            const actual = testObject.getWorkbenchState();
            assert.strictEqual(actual, 2 /* WorkbenchState.FOLDER */);
        });
        test('getWorkspaceFolder()', () => {
            const actual = testObject.getWorkspaceFolder((0, resources_1.joinPath)(folder, 'a'));
            assert.strictEqual(actual, testObject.getWorkspace().folders[0]);
        });
        test('getWorkspaceFolder() - queries in workspace folder', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const folder = (0, resources_1.joinPath)(ROOT, folderName).with({ query: 'myquery=1' });
            await fileService.createFolder(folder);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            const userDataProfileService = disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile));
            const testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, disposables.add(new remoteAgentService_2.RemoteAgentService(new remoteSocketFactoryService_1.RemoteSocketFactoryService(), userDataProfileService, environmentService, workbenchTestServices_2.TestProductService, disposables.add(new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(false, undefined, undefined, undefined, workbenchTestServices_2.TestProductService, logService)), new signService_1.SignService(workbenchTestServices_2.TestProductService), new log_1.NullLogService())), uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            await testObject.initialize(convertToWorkspacePayload(folder));
            const actual = testObject.getWorkspaceFolder((0, resources_1.joinPath)(folder, 'a'));
            assert.strictEqual(actual, testObject.getWorkspace().folders[0]);
        }));
        test('getWorkspaceFolder() - queries in resource', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const folder = (0, resources_1.joinPath)(ROOT, folderName);
            await fileService.createFolder(folder);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            const userDataProfileService = disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile));
            const testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, disposables.add(new remoteAgentService_2.RemoteAgentService(new remoteSocketFactoryService_1.RemoteSocketFactoryService(), userDataProfileService, environmentService, workbenchTestServices_2.TestProductService, disposables.add(new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(false, undefined, undefined, undefined, workbenchTestServices_2.TestProductService, logService)), new signService_1.SignService(workbenchTestServices_2.TestProductService), new log_1.NullLogService())), uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            await testObject.initialize(convertToWorkspacePayload(folder));
            const actual = testObject.getWorkspaceFolder((0, resources_1.joinPath)(folder, 'a').with({ query: 'myquery=1' }));
            assert.strictEqual(actual, testObject.getWorkspace().folders[0]);
        }));
        test('isCurrentWorkspace() => true', () => {
            assert.ok(testObject.isCurrentWorkspace(folder));
        });
        test('isCurrentWorkspace() => false', () => {
            assert.ok(!testObject.isCurrentWorkspace((0, resources_1.joinPath)((0, resources_1.dirname)(folder), 'abc')));
        });
        test('workspace is complete', () => testObject.getCompleteWorkspace());
    });
    suite('WorkspaceContextService - Workspace', () => {
        let testObject;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            const configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = disposables.add(disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService)));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)), userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            testObject.acquireInstantiationService(instantiationService);
        });
        test('workspace folders', () => {
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 2);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
        });
        test('getWorkbenchState()', () => {
            const actual = testObject.getWorkbenchState();
            assert.strictEqual(actual, 3 /* WorkbenchState.WORKSPACE */);
        });
        test('workspace is complete', () => testObject.getCompleteWorkspace());
    });
    suite('WorkspaceContextService - Workspace Editing', () => {
        let testObject, fileService;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            const configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)), userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            instantiationService.stub(jsonEditing_1.IJSONEditingService, instantiationService.createInstance(jsonEditingService_1.JSONEditingService));
            testObject.acquireInstantiationService(instantiationService);
        });
        test('add folders', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }]);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'c');
        }));
        test('add folders (at specific index)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }], 0);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'c');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'b');
        }));
        test('add folders (at specific wrong index)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }], 10);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'c');
        }));
        test('add folders (with name)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.addFolders([{ uri: (0, resources_1.joinPath)(ROOT, 'd'), name: 'DDD' }, { uri: (0, resources_1.joinPath)(ROOT, 'c'), name: 'CCC' }]);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 4);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'a');
            assert.strictEqual((0, resources_1.basename)(actual[1].uri), 'b');
            assert.strictEqual((0, resources_1.basename)(actual[2].uri), 'd');
            assert.strictEqual((0, resources_1.basename)(actual[3].uri), 'c');
            assert.strictEqual(actual[2].name, 'DDD');
            assert.strictEqual(actual[3].name, 'CCC');
        }));
        test('add folders triggers change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }];
            await testObject.addFolders(addedFolders);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed, []);
        }));
        test('remove folders', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.removeFolders([testObject.getWorkspace().folders[0].uri]);
            const actual = testObject.getWorkspace().folders;
            assert.strictEqual(actual.length, 1);
            assert.strictEqual((0, resources_1.basename)(actual[0].uri), 'b');
        }));
        test('remove folders triggers change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const removedFolder = testObject.getWorkspace().folders[0];
            await testObject.removeFolders([removedFolder.uri]);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed.map(r => r.uri.toString()), [removedFolder.uri.toString()]);
            assert.deepStrictEqual(actual_1.changed.map(c => c.uri.toString()), [testObject.getWorkspace().folders[0].uri.toString()]);
        }));
        test('remove folders and add them back by writing into the file', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const folders = testObject.getWorkspace().folders;
            await testObject.removeFolders([folders[0].uri]);
            const promise = new Promise((resolve, reject) => {
                disposables.add(testObject.onDidChangeWorkspaceFolders(actual => {
                    try {
                        assert.deepStrictEqual(actual.added.map(r => r.uri.toString()), [folders[0].uri.toString()]);
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                }));
            });
            const workspace = { folders: [{ path: folders[0].uri.path }, { path: folders[1].uri.path }] };
            await fileService.writeFile(testObject.getWorkspace().configuration, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            await promise;
        }));
        test('update folders (remove last and add to end)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }];
            const removedFolders = [testObject.getWorkspace().folders[1]].map(f => f.uri);
            await testObject.updateFolders(addedFolders, removedFolders);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
            assert.deepStrictEqual(actual_1.removed.map(r_1 => r_1.uri.toString()), removedFolders.map(a_1 => a_1.toString()));
            assert.deepStrictEqual(actual_1.changed, []);
        }));
        test('update folders (rename first via add and remove)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'a'), name: 'The Folder' }];
            const removedFolders = [testObject.getWorkspace().folders[0]].map(f => f.uri);
            await testObject.updateFolders(addedFolders, removedFolders, 0);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed.map(r => r.uri.toString()), removedFolders.map(a => a.toString()));
        }));
        test('update folders (remove first and add to end)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const addedFolders = [{ uri: (0, resources_1.joinPath)(ROOT, 'd') }, { uri: (0, resources_1.joinPath)(ROOT, 'c') }];
            const removedFolders = [testObject.getWorkspace().folders[0]].map(f => f.uri);
            const changedFolders = [testObject.getWorkspace().folders[1]].map(f => f.uri);
            await testObject.updateFolders(addedFolders, removedFolders);
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added.map(r => r.uri.toString()), addedFolders.map(a => a.uri.toString()));
            assert.deepStrictEqual(actual_1.removed.map(r_1 => r_1.uri.toString()), removedFolders.map(a_1 => a_1.toString()));
            assert.deepStrictEqual(actual_1.changed.map(r_2 => r_2.uri.toString()), changedFolders.map(a_2 => a_2.toString()));
        }));
        test('reorder folders trigger change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const workspace = { folders: [{ path: testObject.getWorkspace().folders[1].uri.path }, { path: testObject.getWorkspace().folders[0].uri.path }] };
            await fileService.writeFile(testObject.getWorkspace().configuration, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            await testObject.reloadConfiguration();
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed.map(c => c.uri.toString()), testObject.getWorkspace().folders.map(f => f.uri.toString()).reverse());
        }));
        test('rename folders trigger change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            const workspace = { folders: [{ path: testObject.getWorkspace().folders[0].uri.path, name: '1' }, { path: testObject.getWorkspace().folders[1].uri.path }] };
            fileService.writeFile(testObject.getWorkspace().configuration, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            await testObject.reloadConfiguration();
            assert.strictEqual(target.callCount, 2, `Should be called only once but called ${target.callCount} times`);
            const actual_1 = target.args[1][0];
            assert.deepStrictEqual(actual_1.added, []);
            assert.deepStrictEqual(actual_1.removed, []);
            assert.deepStrictEqual(actual_1.changed.map(c => c.uri.toString()), [testObject.getWorkspace().folders[0].uri.toString()]);
        }));
    });
    suite('WorkspaceService - Initialization', () => {
        let configResource, testObject, fileService, environmentService, userDataProfileService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'initialization.testSetting1': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'initialization.testSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            userDataProfileService = instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await testObject.initialize({ id: '' });
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            testObject.acquireInstantiationService(instantiationService);
        });
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from an empty workspace with no configuration changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await testObject.initialize(convertToWorkspacePayload(folder));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'userValue');
            assert.strictEqual(target.callCount, 4);
            assert.deepStrictEqual(target.args[0], [2 /* WorkbenchState.FOLDER */]);
            assert.deepStrictEqual(target.args[1], [undefined]);
            assert.deepStrictEqual(target.args[3][0].added.map(f => f.uri.toString()), [folder.toString()]);
            assert.deepStrictEqual(target.args[3][0].removed, []);
            assert.deepStrictEqual(target.args[3][0].changed, []);
        }));
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from an empty workspace with configuration changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.writeFile((0, resources_1.joinPath)(folder, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue" }'));
            await testObject.initialize(convertToWorkspacePayload(folder));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'workspaceValue');
            assert.strictEqual(target.callCount, 5);
            assert.deepStrictEqual([...target.args[0][0].affectedKeys], ['initialization.testSetting1']);
            assert.deepStrictEqual(target.args[1], [2 /* WorkbenchState.FOLDER */]);
            assert.deepStrictEqual(target.args[2], [undefined]);
            assert.deepStrictEqual(target.args[4][0].added.map(f => f.uri.toString()), [folder.toString()]);
            assert.deepStrictEqual(target.args[4][0].removed, []);
            assert.deepStrictEqual(target.args[4][0].changed, []);
        }));
        (platform_2.isMacintosh ? test.skip : test)('initialize a multi root workspace from an empty workspace with no configuration changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            assert.strictEqual(target.callCount, 4);
            assert.deepStrictEqual(target.args[0], [3 /* WorkbenchState.WORKSPACE */]);
            assert.deepStrictEqual(target.args[1], [undefined]);
            assert.deepStrictEqual(target.args[3][0].added.map(folder => folder.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString(), (0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[3][0].removed, []);
            assert.deepStrictEqual(target.args[3][0].changed, []);
        }));
        (platform_2.isMacintosh ? test.skip : test)('initialize a multi root workspace from an empty workspace with configuration changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'a', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue1" }'));
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'b', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting2": "workspaceValue2" }'));
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            assert.strictEqual(target.callCount, 5);
            assert.deepStrictEqual([...target.args[0][0].affectedKeys], ['initialization.testSetting1', 'initialization.testSetting2']);
            assert.deepStrictEqual(target.args[1], [3 /* WorkbenchState.WORKSPACE */]);
            assert.deepStrictEqual(target.args[2], [undefined]);
            assert.deepStrictEqual(target.args[4][0].added.map(folder => folder.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString(), (0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[4][0].removed, []);
            assert.deepStrictEqual(target.args[4][0].changed, []);
        }));
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from a folder workspace with no configuration changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "userValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'b')));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'userValue');
            assert.strictEqual(target.callCount, 2);
            assert.deepStrictEqual(target.args[1][0].added.map(folder_1 => folder_1.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[1][0].removed.map(folder_2 => folder_2.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString()]);
            assert.deepStrictEqual(target.args[1][0].changed, []);
        }));
        (platform_2.isMacintosh ? test.skip : test)('initialize a folder workspace from a folder workspace with configuration changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'b', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue2" }'));
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'b')));
            assert.strictEqual(testObject.getValue('initialization.testSetting1'), 'workspaceValue2');
            assert.strictEqual(target.callCount, 3);
            assert.deepStrictEqual([...target.args[0][0].affectedKeys], ['initialization.testSetting1']);
            assert.deepStrictEqual(target.args[2][0].added.map(folder_1 => folder_1.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[2][0].removed.map(folder_2 => folder_2.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'a').toString()]);
            assert.deepStrictEqual(target.args[2][0].changed, []);
        }));
        (platform_2.isMacintosh ? test.skip : test)('initialize a multi folder workspace from a folder workspacce triggers change events in the right order', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeWorkbenchState(target));
            disposables.add(testObject.onDidChangeWorkspaceName(target));
            disposables.add(testObject.onWillChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeWorkspaceFolders(target));
            disposables.add(testObject.onDidChangeConfiguration(target));
            await fileService.writeFile((0, resources_1.joinPath)(ROOT, 'a', '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "initialization.testSetting1": "workspaceValue2" }'));
            await testObject.initialize(getWorkspaceIdentifier(configResource));
            assert.strictEqual(target.callCount, 5);
            assert.deepStrictEqual([...target.args[0][0].affectedKeys], ['initialization.testSetting1']);
            assert.deepStrictEqual(target.args[1], [3 /* WorkbenchState.WORKSPACE */]);
            assert.deepStrictEqual(target.args[2], [undefined]);
            assert.deepStrictEqual(target.args[4][0].added.map(folder_1 => folder_1.uri.toString()), [(0, resources_1.joinPath)(ROOT, 'b').toString()]);
            assert.deepStrictEqual(target.args[4][0].removed, []);
            assert.deepStrictEqual(target.args[4][0].changed, []);
        }));
    });
    suite('WorkspaceConfigurationService - Folder', () => {
        let testObject, workspaceService, fileService, environmentService, userDataProfileService, instantiationService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.folder.machineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    },
                    'configurationService.folder.machineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    },
                    'configurationService.folder.testSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'configurationService.folder.languageSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                    },
                    'configurationService.folder.restrictedSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        restricted: true
                    },
                    'configurationService.folder.policySetting': {
                        'type': 'string',
                        'default': 'isSet',
                        policy: {
                            name: 'configurationService.folder.policySetting',
                            minimumVersion: '1.0.0',
                        }
                    },
                }
            });
            configurationRegistry.registerDefaultConfigurations([{
                    overrides: {
                        '[jsonc]': {
                            'configurationService.folder.languageSetting': 'languageValue'
                        }
                    }
                }]);
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.createFolder(folder);
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            environmentService.policyFile = (0, resources_1.joinPath)(folder, 'policies.json');
            const remoteAgentService = disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            userDataProfileService = instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)));
            workspaceService = testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), disposables.add(new filePolicyService_1.FilePolicyService(environmentService.policyFile, fileService, logService))));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await workspaceService.initialize(convertToWorkspacePayload(folder));
            instantiationService.stub(keybindingEditing_1.IKeybindingEditingService, disposables.add(instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService)));
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            workspaceService.acquireInstantiationService(instantiationService);
        });
        test('defaults', () => {
            assert.deepStrictEqual(testObject.getValue('configurationService'), { 'folder': { 'applicationSetting': 'isSet', 'machineSetting': 'isSet', 'machineOverridableSetting': 'isSet', 'testSetting': 'isSet', 'languageSetting': 'isSet', 'restrictedSetting': 'isSet', 'policySetting': 'isSet' } });
        });
        test('globals override defaults', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'userValue');
        }));
        test('globals', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('testworkbench.editor.tabs'), true);
        }));
        test('workspace settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "testworkbench.editor.icons": true }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('testworkbench.editor.icons'), true);
        }));
        test('workspace settings override user settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'workspaceValue');
        }));
        test('machine overridable settings override user Settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineOverridableSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineOverridableSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineOverridableSetting'), 'workspaceValue');
        }));
        test('workspace settings override user settings after defaults are registered ', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.newSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.newSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.newSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.newSetting'), 'workspaceValue');
        }));
        test('machine overridable settings override user settings after defaults are registered ', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.newMachineOverridableSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.newMachineOverridableSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.newMachineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.newMachineOverridableSetting'), 'workspaceValue');
        }));
        test('application settings are not read from workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting'), 'userValue');
        }));
        test('application settings are not read from workspace when workspace folder uri is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('machine settings are not read from workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('machine settings are not read from workspace when workspace folder uri is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('get application scope settings are not loaded after defaults are registered', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-2": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-2": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-2'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting-2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-2'), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-2'), 'userValue');
        }));
        test('get application scope settings are not loaded after defaults are registered when workspace folder uri is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-3": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting-3": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.applicationSetting-3': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('get machine scope settings are not loaded after defaults are registered', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-2": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-2": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-2'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.machineSetting-2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-2'), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-2'), 'userValue');
        }));
        test('get machine scope settings are not loaded after defaults are registered when workspace folder uri is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-3": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting-3": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.folder.machineSetting-3': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting-3', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('policy value override all', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const result = await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
                await fileService.writeFile(environmentService.policyFile, buffer_1.VSBuffer.fromString('{ "configurationService.folder.policySetting": "policyValue" }'));
                return promise;
            });
            assert.deepStrictEqual([...result.affectedKeys], ['configurationService.folder.policySetting']);
            assert.strictEqual(testObject.getValue('configurationService.folder.policySetting'), 'policyValue');
            assert.strictEqual(testObject.inspect('configurationService.folder.policySetting').policyValue, 'policyValue');
        }));
        test('policy settings when policy value is not set', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.policySetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.policySetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.policySetting'), 'workspaceValue');
            assert.strictEqual(testObject.inspect('configurationService.folder.policySetting').policyValue, undefined);
        }));
        test('reload configuration emits events after global configuraiton changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.reloadConfiguration();
            assert.ok(target.called);
        }));
        test('reload configuration emits events after workspace configuraiton changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.reloadConfiguration();
            assert.ok(target.called);
        }));
        test('reload configuration should not emit event if no changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "testworkbench.editor.tabs": true }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(() => { target(); }));
            await testObject.reloadConfiguration();
            assert.ok(!target.called);
        }));
        test('inspect', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            let actual = testObject.inspect('something.missing');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, undefined);
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'isSet');
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userValue');
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'workspaceValue');
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'tasks.json'), buffer_1.VSBuffer.fromString('{ "configurationService.tasks.testSetting": "tasksValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('tasks');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.application, undefined);
            assert.deepStrictEqual(actual.userValue, {});
            assert.deepStrictEqual(actual.workspaceValue, {
                "configurationService": {
                    "tasks": {
                        "testSetting": "tasksValue"
                    }
                }
            });
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.deepStrictEqual(actual.value, {
                "configurationService": {
                    "tasks": {
                        "testSetting": "tasksValue"
                    }
                }
            });
        }));
        test('inspect restricted settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userRestrictedValue" }'));
            await testObject.reloadConfiguration();
            let actual = testObject.inspect('configurationService.folder.restrictedSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userRestrictedValue');
            testObject.updateWorkspaceTrust(true);
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.restrictedSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userRestrictedValue');
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceRestrictedValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.restrictedSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userRestrictedValue');
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'tasks.json'), buffer_1.VSBuffer.fromString('{ "configurationService.tasks.testSetting": "tasksValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('tasks');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.application, undefined);
            assert.deepStrictEqual(actual.userValue, {});
            assert.deepStrictEqual(actual.workspaceValue, {
                "configurationService": {
                    "tasks": {
                        "testSetting": "tasksValue"
                    }
                }
            });
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.deepStrictEqual(actual.value, {
                "configurationService": {
                    "tasks": {
                        "testSetting": "tasksValue"
                    }
                }
            });
            testObject.updateWorkspaceTrust(true);
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.folder.restrictedSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'workspaceRestrictedValue');
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'tasks.json'), buffer_1.VSBuffer.fromString('{ "configurationService.tasks.testSetting": "tasksValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('tasks');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.application, undefined);
            assert.deepStrictEqual(actual.userValue, {});
            assert.deepStrictEqual(actual.workspaceValue, {
                "configurationService": {
                    "tasks": {
                        "testSetting": "tasksValue"
                    }
                }
            });
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.deepStrictEqual(actual.value, {
                "configurationService": {
                    "tasks": {
                        "testSetting": "tasksValue"
                    }
                }
            });
        }));
        test('inspect restricted settings after change', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userRestrictedValue" }'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceRestrictedValue" }'));
            const event = await promise;
            const actual = testObject.inspect('configurationService.folder.restrictedSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userRestrictedValue');
            assert.strictEqual(event.affectsConfiguration('configurationService.folder.restrictedSetting'), true);
        }));
        test('keys', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            let actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepStrictEqual(actual.user, []);
            assert.deepStrictEqual(actual.workspace, []);
            assert.deepStrictEqual(actual.workspaceFolder, []);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepStrictEqual(actual.user, ['configurationService.folder.testSetting']);
            assert.deepStrictEqual(actual.workspace, []);
            assert.deepStrictEqual(actual.workspaceFolder, []);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.keys();
            assert.ok(actual.default.indexOf('configurationService.folder.testSetting') !== -1);
            assert.deepStrictEqual(actual.user, ['configurationService.folder.testSetting']);
            assert.deepStrictEqual(actual.workspace, ['configurationService.folder.testSetting']);
            assert.deepStrictEqual(actual.workspaceFolder, []);
        }));
        test('update user configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 2 /* ConfigurationTarget.USER */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'value'));
        });
        test('update workspace configuration', () => {
            return testObject.updateValue('tasks.service.testSetting', 'value', 5 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.strictEqual(testObject.getValue("tasks.service.testSetting" /* TasksSchemaProperties.ServiceTestSetting */), 'value'));
        });
        test('update resource configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'value', { resource: workspaceService.getWorkspace().folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'value'));
        });
        test('update language configuration using configuration overrides', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'abcLangValue', { overrideIdentifier: 'abclang' });
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'abclang' }), 'abcLangValue');
        }));
        test('update language configuration using configuration update overrides', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'abcLangValue', { overrideIdentifiers: ['abclang'] });
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'abclang' }), 'abcLangValue');
        }));
        test('update language configuration for multiple languages', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'multiLangValue', { overrideIdentifiers: ['xyzlang', 'deflang'] }, 2 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'deflang' }), 'multiLangValue');
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'xyzlang' }), 'multiLangValue');
            assert.deepStrictEqual(testObject.getValue((0, configurationRegistry_1.keyFromOverrideIdentifiers)(['deflang', 'xyzlang'])), { 'configurationService.folder.languageSetting': 'multiLangValue' });
        }));
        test('update language configuration for multiple languages when already set', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "[deflang][xyzlang]": { "configurationService.folder.languageSetting": "userValue" }}'));
            await testObject.updateValue('configurationService.folder.languageSetting', 'multiLangValue', { overrideIdentifiers: ['xyzlang', 'deflang'] }, 2 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'deflang' }), 'multiLangValue');
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { overrideIdentifier: 'xyzlang' }), 'multiLangValue');
            assert.deepStrictEqual(testObject.getValue((0, configurationRegistry_1.keyFromOverrideIdentifiers)(['deflang', 'xyzlang'])), { 'configurationService.folder.languageSetting': 'multiLangValue' });
            const actualContent = (await fileService.readFile(userDataProfileService.currentProfile.settingsResource)).value.toString();
            assert.deepStrictEqual(JSON.parse(actualContent), { '[deflang][xyzlang]': { 'configurationService.folder.languageSetting': 'multiLangValue' } });
        }));
        test('update resource language configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.folder.languageSetting', 'value', { resource: workspaceService.getWorkspace().folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting'), 'value');
        }));
        test('update resource language configuration for a language using configuration overrides', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValue');
            await testObject.updateValue('configurationService.folder.languageSetting', 'languageValueUpdated', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValueUpdated');
        }));
        test('update resource language configuration for a language using configuration update overrides', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValue');
            await testObject.updateValue('configurationService.folder.languageSetting', 'languageValueUpdated', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifiers: ['jsonc'] }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.folder.languageSetting', { resource: workspaceService.getWorkspace().folders[0].uri, overrideIdentifier: 'jsonc' }), 'languageValueUpdated');
        }));
        test('update application setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.folder.applicationSetting', 'workspaceValue', {}, 5 /* ConfigurationTarget.WORKSPACE */, { donotNotifyError: true })
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 1 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */));
        });
        test('update machine setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.folder.machineSetting', 'workspaceValue', {}, 5 /* ConfigurationTarget.WORKSPACE */, { donotNotifyError: true })
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 2 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */));
        });
        test('update tasks configuration', () => {
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, 5 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.deepStrictEqual(testObject.getValue("tasks" /* TasksSchemaProperties.Tasks */), { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }));
        });
        test('update user configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 2 /* ConfigurationTarget.USER */)
                .then(() => assert.ok(target.called));
        });
        test('update workspace configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            return testObject.updateValue('configurationService.folder.testSetting', 'value', 5 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
        test('update memory configuration', () => {
            return testObject.updateValue('configurationService.folder.testSetting', 'memoryValue', 8 /* ConfigurationTarget.MEMORY */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'memoryValue'));
        });
        test('update memory configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            return testObject.updateValue('configurationService.folder.testSetting', 'memoryValue', 8 /* ConfigurationTarget.MEMORY */)
                .then(() => assert.ok(target.called));
        });
        test('remove setting from all targets', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const key = 'configurationService.folder.testSetting';
            await testObject.updateValue(key, 'workspaceValue', 5 /* ConfigurationTarget.WORKSPACE */);
            await testObject.updateValue(key, 'userValue', 2 /* ConfigurationTarget.USER */);
            await testObject.updateValue(key, undefined);
            await testObject.reloadConfiguration();
            const actual = testObject.inspect(key, { resource: workspaceService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        }));
        test('update user configuration to default value when target is not passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.folder.testSetting', 'value', 2 /* ConfigurationTarget.USER */);
            await testObject.updateValue('configurationService.folder.testSetting', 'isSet');
            assert.strictEqual(testObject.inspect('configurationService.folder.testSetting').userValue, undefined);
        }));
        test('update user configuration to default value when target is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.folder.testSetting', 'value', 2 /* ConfigurationTarget.USER */);
            await testObject.updateValue('configurationService.folder.testSetting', 'isSet', 2 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.inspect('configurationService.folder.testSetting').userValue, 'isSet');
        }));
        test('update task configuration should trigger change event before promise is resolve', () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            return testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, 5 /* ConfigurationTarget.WORKSPACE */)
                .then(() => assert.ok(target.called));
        });
        test('no change event when there are no global tasks', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await (0, async_1.timeout)(5);
            assert.ok(target.notCalled);
        }));
        test('change event when there are global tasks', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile((0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'tasks.json'), buffer_1.VSBuffer.fromString('{ "version": "1.0.0", "tasks": [{ "taskName": "myTask" }'));
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await testObject.reloadLocalUserConfiguration();
            await promise;
        }));
        test('creating workspace settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            await new Promise((c, e) => {
                const disposable = testObject.onDidChangeConfiguration(e => {
                    assert.ok(e.affectsConfiguration('configurationService.folder.testSetting'));
                    assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'workspaceValue');
                    disposable.dispose();
                    c();
                });
                fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }')).catch(e);
            });
        }));
        test('deleting workspace settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "userValue" }'));
            const workspaceSettingsResource = (0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json');
            await fileService.writeFile(workspaceSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.testSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const e = await new Promise((c, e) => {
                event_1.Event.once(testObject.onDidChangeConfiguration)(c);
                fileService.del(workspaceSettingsResource).catch(e);
            });
            assert.ok(e.affectsConfiguration('configurationService.folder.testSetting'));
            assert.strictEqual(testObject.getValue('configurationService.folder.testSetting'), 'userValue');
        }));
        test('restricted setting is read from workspace when workspace is trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.size, 1);
            assert.deepStrictEqual(testObject.restrictedSettings.workspaceFolder?.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        }));
        test('restricted setting is not read from workspace when workspace is changed to trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            testObject.updateWorkspaceTrust(false);
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.size, 1);
            assert.deepStrictEqual(testObject.restrictedSettings.workspaceFolder?.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        }));
        test('change event is triggered when workspace is changed to untrusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            testObject.updateWorkspaceTrust(false);
            const event = await promise;
            assert.ok(event.affectedKeys.has('configurationService.folder.restrictedSetting'));
            assert.ok(event.affectsConfiguration('configurationService.folder.restrictedSetting'));
        }));
        test('restricted setting is not read from workspace when workspace is not trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'userValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.size, 1);
            assert.deepStrictEqual(testObject.restrictedSettings.workspaceFolder?.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        }));
        test('restricted setting is read when workspace is changed to trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            testObject.updateWorkspaceTrust(true);
            assert.strictEqual(testObject.getValue('configurationService.folder.restrictedSetting', { resource: workspaceService.getWorkspace().folders[0].uri }), 'workspaceValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.folder.restrictedSetting'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.folder.restrictedSetting']);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.size, 1);
            assert.deepStrictEqual(testObject.restrictedSettings.workspaceFolder?.get(workspaceService.getWorkspace().folders[0].uri), ['configurationService.folder.restrictedSetting']);
        }));
        test('change event is triggered when workspace is changed to trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            testObject.updateWorkspaceTrust(true);
            const event = await promise;
            assert.ok(event.affectedKeys.has('configurationService.folder.restrictedSetting'));
            assert.ok(event.affectsConfiguration('configurationService.folder.restrictedSetting'));
        }));
        test('adding an restricted setting triggers change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "userValue" }'));
            testObject.updateWorkspaceTrust(false);
            const promise = event_1.Event.toPromise(testObject.onDidChangeRestrictedSettings);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.restrictedSetting": "workspaceValue" }'));
            return promise;
        }));
        test('remove an unregistered setting', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const key = 'configurationService.folder.unknownSetting';
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.unknownSetting": "userValue" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.folder.unknownSetting": "workspaceValue" }'));
            await testObject.reloadConfiguration();
            await testObject.updateValue(key, undefined);
            const actual = testObject.inspect(key, { resource: workspaceService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        }));
    });
    suite('WorkspaceConfigurationService - Profiles', () => {
        let testObject, workspaceService, fileService, environmentService, userDataProfileService, instantiationService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    [configuration_2.APPLY_ALL_PROFILES_SETTING]: {
                        'type': 'array',
                        'default': [],
                        'scope': 1 /* ConfigurationScope.APPLICATION */,
                    },
                    'configurationService.profiles.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.profiles.testSetting': {
                        'type': 'string',
                        'default': 'isSet',
                    },
                    'configurationService.profiles.applicationSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.profiles.testSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                    },
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.createFolder(folder);
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            environmentService.policyFile = (0, resources_1.joinPath)(folder, 'policies.json');
            const remoteAgentService = disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            userDataProfileService = instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService((0, userDataProfile_1.toUserDataProfile)('custom', 'custom', (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'profiles', 'temp'), (0, resources_1.joinPath)(environmentService.cacheHome, 'profilesCache')))));
            workspaceService = testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), disposables.add(new filePolicyService_1.FilePolicyService(environmentService.policyFile, fileService, logService))));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting2": "applicationValue", "configurationService.profiles.testSetting2": "userValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting2": "profileValue", "configurationService.profiles.testSetting2": "profileValue" }'));
            await workspaceService.initialize(convertToWorkspacePayload(folder));
            instantiationService.stub(keybindingEditing_1.IKeybindingEditingService, disposables.add(instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService)));
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            workspaceService.acquireInstantiationService(instantiationService);
        });
        test('initialize', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting2'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'profileValue');
        }));
        test('inspect', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            let actual = testObject.inspect('something.missing');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, undefined);
            actual = testObject.inspect('configurationService.profiles.applicationSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'isSet');
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "applicationValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "profileValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.profiles.applicationSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.applicationValue, 'applicationValue');
            assert.strictEqual(actual.userValue, 'profileValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'applicationValue');
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting": "applicationValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting": "profileValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.profiles.testSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.applicationValue, undefined);
            assert.strictEqual(actual.userValue, 'profileValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'profileValue');
        }));
        test('update application scope setting', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.profiles.applicationSetting', 'applicationValue');
            assert.deepStrictEqual(JSON.parse((await fileService.readFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource)).value.toString()), { 'configurationService.profiles.applicationSetting': 'applicationValue', 'configurationService.profiles.applicationSetting2': 'applicationValue', 'configurationService.profiles.testSetting2': 'userValue' });
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting'), 'applicationValue');
        }));
        test('update normal setting', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.profiles.testSetting', 'profileValue');
            assert.deepStrictEqual(JSON.parse((await fileService.readFile(userDataProfileService.currentProfile.settingsResource)).value.toString()), { 'configurationService.profiles.testSetting': 'profileValue', 'configurationService.profiles.testSetting2': 'profileValue', 'configurationService.profiles.applicationSetting2': 'profileValue' });
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'profileValue');
        }));
        test('registering normal setting after init', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting3": "defaultProfile" }'));
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.profiles.testSetting3': {
                        'type': 'string',
                        'default': 'isSet',
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting3'), 'isSet');
        }));
        test('registering application scope setting after init', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting3": "defaultProfile" }'));
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.profiles.applicationSetting3': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting3'), 'defaultProfile');
        }));
        test('initialize with custom all profiles settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            await testObject.initialize(convertToWorkspacePayload((0, resources_1.joinPath)(ROOT, 'a')));
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting2'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'userValue');
        }));
        test('update all profiles settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], [configuration_2.APPLY_ALL_PROFILES_SETTING, 'configurationService.profiles.testSetting2']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'userValue');
        }));
        test('setting applied to all profiles is registered later', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting4": "userValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting4": "profileValue" }'));
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting4'], 3 /* ConfigurationTarget.USER_LOCAL */);
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting4'), 'userValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.profiles.testSetting4': {
                        'type': 'string',
                        'default': 'isSet',
                    }
                }
            });
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting4'), 'userValue');
        }));
        test('update setting that is applied to all profiles', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await testObject.updateValue('configurationService.profiles.testSetting2', 'updatedValue', 3 /* ConfigurationTarget.USER_LOCAL */);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.testSetting2']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'updatedValue');
        }));
        test('test isSettingAppliedToAllProfiles', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            assert.strictEqual(testObject.isSettingAppliedForAllProfiles('configurationService.profiles.applicationSetting2'), true);
            assert.strictEqual(testObject.isSettingAppliedForAllProfiles('configurationService.profiles.testSetting2'), false);
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            assert.strictEqual(testObject.isSettingAppliedForAllProfiles('configurationService.profiles.testSetting2'), true);
        }));
        test('switch to default profile', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "applicationValue", "configurationService.profiles.testSetting": "userValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "profileValue", "configurationService.profiles.testSetting": "profileValue" }'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await userDataProfileService.updateCurrentProfile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.testSetting']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'userValue');
        }));
        test('switch to non default profile', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "applicationValue", "configurationService.profiles.testSetting": "userValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "profileValue", "configurationService.profiles.testSetting": "profileValue" }'));
            await testObject.reloadConfiguration();
            const profile = (0, userDataProfile_1.toUserDataProfile)('custom2', 'custom2', (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'profiles', 'custom2'), (0, resources_1.joinPath)(environmentService.cacheHome, 'profilesCache'));
            await fileService.writeFile(profile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "profileValue2", "configurationService.profiles.testSetting": "profileValue2" }'));
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await userDataProfileService.updateCurrentProfile(profile);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.testSetting']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'profileValue2');
        }));
        test('switch to non default profile using settings from default profile', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "applicationValue", "configurationService.profiles.testSetting": "userValue" }'));
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "profileValue", "configurationService.profiles.testSetting": "profileValue" }'));
            await testObject.reloadConfiguration();
            const profile = (0, userDataProfile_1.toUserDataProfile)('custom3', 'custom3', (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'profiles', 'custom2'), (0, resources_1.joinPath)(environmentService.cacheHome, 'profilesCache'), { useDefaultFlags: { settings: true } }, instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile);
            await fileService.writeFile(profile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "applicationValue2", "configurationService.profiles.testSetting": "profileValue2" }'));
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await userDataProfileService.updateCurrentProfile(profile);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.applicationSetting', 'configurationService.profiles.testSetting']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting'), 'applicationValue2');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'profileValue2');
        }));
        test('In non-default profile, changing application settings shall include only application scope settings in the change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{}'));
            await testObject.reloadConfiguration();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await fileService.writeFile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.applicationSetting": "applicationValue", "configurationService.profiles.testSetting": "applicationValue" }'));
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.applicationSetting']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'isSet');
        }));
        test('switch to default profile with settings applied to all profiles', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            await userDataProfileService.updateCurrentProfile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting2'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'userValue');
        }));
        test('switch to non default profile with settings applied to all profiles', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            const profile = (0, userDataProfile_1.toUserDataProfile)('custom2', 'custom2', (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'profiles', 'custom2'), (0, resources_1.joinPath)(environmentService.cacheHome, 'profilesCache'));
            await fileService.writeFile(profile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting": "profileValue", "configurationService.profiles.testSetting2": "profileValue2" }'));
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await userDataProfileService.updateCurrentProfile(profile);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.testSetting']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting2'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'userValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'profileValue');
        }));
        test('switch to non default from default profile with settings applied to all profiles', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, ['configurationService.profiles.testSetting2'], 3 /* ConfigurationTarget.USER_LOCAL */);
            await userDataProfileService.updateCurrentProfile(instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile);
            const profile = (0, userDataProfile_1.toUserDataProfile)('custom2', 'custom2', (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'profiles', 'custom2'), (0, resources_1.joinPath)(environmentService.cacheHome, 'profilesCache'));
            await fileService.writeFile(profile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.profiles.testSetting": "profileValue", "configurationService.profiles.testSetting2": "profileValue2" }'));
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await userDataProfileService.updateCurrentProfile(profile);
            const changeEvent = await promise;
            assert.deepStrictEqual([...changeEvent.affectedKeys], ['configurationService.profiles.testSetting']);
            assert.strictEqual(testObject.getValue('configurationService.profiles.applicationSetting2'), 'applicationValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting2'), 'userValue');
            assert.strictEqual(testObject.getValue('configurationService.profiles.testSetting'), 'profileValue');
        }));
    });
    suite('WorkspaceConfigurationService-Multiroot', () => {
        let workspaceContextService, jsonEditingServce, testObject, fileService, environmentService, userDataProfileService;
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testSetting': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'configurationService.workspace.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.workspace.machineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    },
                    'configurationService.workspace.machineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    },
                    'configurationService.workspace.testResourceSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'configurationService.workspace.testLanguageSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                    },
                    'configurationService.workspace.testRestrictedSetting1': {
                        'type': 'string',
                        'default': 'isSet',
                        restricted: true,
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    },
                    'configurationService.workspace.testRestrictedSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        restricted: true,
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            const folderA = (0, resources_1.joinPath)(ROOT, 'a');
            const folderB = (0, resources_1.joinPath)(ROOT, 'b');
            const configResource = (0, resources_1.joinPath)(ROOT, 'vsctests.code-workspace');
            const workspace = { folders: [{ path: folderA.path }, { path: folderB.path }] };
            await fileService.createFolder(appSettingsHome);
            await fileService.createFolder(folderA);
            await fileService.createFolder(folderB);
            await fileService.writeFile(configResource, buffer_1.VSBuffer.fromString(JSON.stringify(workspace, null, '\t')));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteAgentService = disposables.add(instantiationService.createInstance(remoteAgentService_2.RemoteAgentService));
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            userDataProfileService = instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)));
            const workspaceService = disposables.add(new configurationService_1.WorkspaceService({ configurationCache: new ConfigurationCache() }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
            instantiationService.stub(configuration_1.IConfigurationService, workspaceService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            await workspaceService.initialize(getWorkspaceIdentifier(configResource));
            instantiationService.stub(keybindingEditing_1.IKeybindingEditingService, disposables.add(instantiationService.createInstance(keybindingEditing_1.KeybindingsEditingService)));
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            jsonEditingServce = instantiationService.createInstance(jsonEditingService_1.JSONEditingService);
            instantiationService.stub(jsonEditing_1.IJSONEditingService, jsonEditingServce);
            workspaceService.acquireInstantiationService(instantiationService);
            workspaceContextService = workspaceService;
            testObject = workspaceService;
        });
        test('application settings are not read from workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.applicationSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting'), 'userValue');
        }));
        test('application settings are not read from workspace when folder is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.applicationSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.applicationSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.applicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('machine settings are not read from workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.machineSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting'), 'userValue');
        }));
        test('machine settings are not read from workspace when folder is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.folder.machineSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.machineSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.folder.machineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('get application scope settings are not loaded after defaults are registered', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.newSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.newSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.newSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting'), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting'), 'userValue');
        }));
        test('get application scope settings are not loaded after defaults are registered when workspace folder is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.newSetting-2": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.newSetting-2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting-2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.newSetting-2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting-2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newSetting-2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('workspace settings override user settings after defaults are registered for machine overridable settings ', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.newMachineOverridableSetting": "userValue" }'));
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['settings'], value: { 'configurationService.workspace.newMachineOverridableSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newMachineOverridableSetting'), 'workspaceValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.newMachineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.newMachineOverridableSetting'), 'workspaceValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.newMachineOverridableSetting'), 'workspaceValue');
        }));
        test('application settings are not read from workspace folder', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.applicationSetting'), 'userValue');
        }));
        test('application settings are not read from workspace folder when workspace folder is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.applicationSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.applicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('machine settings are not read from workspace folder', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.machineSetting'), 'userValue');
        }));
        test('machine settings are not read from workspace folder when workspace folder is passed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.machineSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.machineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('application settings are not read from workspace folder after defaults are registered', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewApplicationSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewApplicationSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewApplicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewApplicationSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('machine settings are not read from workspace folder after defaults are registered', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewMachineSetting": "userValue" }'));
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewMachineSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'userValue');
        }));
        test('resource setting in folder is read after it is registered later', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewResourceSetting2": "workspaceFolderValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testNewResourceSetting2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewResourceSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewResourceSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
        }));
        test('resource language setting in folder is read after it is registered later', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewResourceLanguageSetting2": "workspaceFolderValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testNewResourceLanguageSetting2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewResourceLanguageSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewResourceLanguageSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
        }));
        test('machine overridable setting in folder is read after it is registered later', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testNewMachineOverridableSetting2": "workspaceFolderValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testNewMachineOverridableSetting2': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.workspace.testNewMachineOverridableSetting2': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.workspace.testNewMachineOverridableSetting2', { resource: workspaceContextService.getWorkspace().folders[0].uri }), 'workspaceFolderValue');
        }));
        test('inspect', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            let actual = testObject.inspect('something.missing');
            assert.strictEqual(actual.defaultValue, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, undefined);
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'isSet');
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testResourceSetting": "userValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userValue');
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testResourceSetting': 'workspaceValue' } }], true);
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testResourceSetting');
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'workspaceValue');
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testResourceSetting": "workspaceFolderValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testResourceSetting', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.userValue, 'userValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceValue');
            assert.strictEqual(actual.workspaceFolderValue, 'workspaceFolderValue');
            assert.strictEqual(actual.value, 'workspaceFolderValue');
        }));
        test('inspect restricted settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testRestrictedSetting1': 'workspaceRestrictedValue' } }], true);
            await testObject.reloadConfiguration();
            let actual = testObject.inspect('configurationService.workspace.testRestrictedSetting1', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'isSet');
            testObject.updateWorkspaceTrust(true);
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testRestrictedSetting1', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'workspaceRestrictedValue');
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "workspaceFolderRestrictedValue" }'));
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testRestrictedSetting1', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, 'workspaceFolderRestrictedValue');
            assert.strictEqual(actual.value, 'isSet');
            testObject.updateWorkspaceTrust(true);
            await testObject.reloadConfiguration();
            actual = testObject.inspect('configurationService.workspace.testRestrictedSetting1', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, 'workspaceFolderRestrictedValue');
            assert.strictEqual(actual.value, 'workspaceFolderRestrictedValue');
        }));
        test('inspect restricted settings after change', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "userRestrictedValue" }'));
            await testObject.reloadConfiguration();
            let promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testRestrictedSetting1': 'workspaceRestrictedValue' } }], true);
            let event = await promise;
            let actual = testObject.inspect('configurationService.workspace.testRestrictedSetting1', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.value, 'userRestrictedValue');
            assert.strictEqual(event.affectsConfiguration('configurationService.workspace.testRestrictedSetting1'), true);
            promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            await fileService.writeFile(workspaceContextService.getWorkspace().folders[0].toResource('.vscode/settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "workspaceFolderRestrictedValue" }'));
            event = await promise;
            actual = testObject.inspect('configurationService.workspace.testRestrictedSetting1', { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.defaultValue, 'isSet');
            assert.strictEqual(actual.application, undefined);
            assert.strictEqual(actual.userValue, 'userRestrictedValue');
            assert.strictEqual(actual.workspaceValue, 'workspaceRestrictedValue');
            assert.strictEqual(actual.workspaceFolderValue, 'workspaceFolderRestrictedValue');
            assert.strictEqual(actual.value, 'userRestrictedValue');
            assert.strictEqual(event.affectsConfiguration('configurationService.workspace.testRestrictedSetting1'), true);
        }));
        test('get launch configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const expectedLaunchConfiguration = {
                'version': '0.1.0',
                'configurations': [
                    {
                        'type': 'node',
                        'request': 'launch',
                        'name': 'Gulp Build',
                        'program': '${workspaceFolder}/node_modules/gulp/bin/gulp.js',
                        'stopOnEntry': true,
                        'args': [
                            'watch-extension:json-client'
                        ],
                        'cwd': '${workspaceFolder}'
                    }
                ]
            };
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['launch'], value: expectedLaunchConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.getValue('launch');
            assert.deepStrictEqual(actual, expectedLaunchConfiguration);
        }));
        test('inspect launch configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const expectedLaunchConfiguration = {
                'version': '0.1.0',
                'configurations': [
                    {
                        'type': 'node',
                        'request': 'launch',
                        'name': 'Gulp Build',
                        'program': '${workspaceFolder}/node_modules/gulp/bin/gulp.js',
                        'stopOnEntry': true,
                        'args': [
                            'watch-extension:json-client'
                        ],
                        'cwd': '${workspaceFolder}'
                    }
                ]
            };
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['launch'], value: expectedLaunchConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.inspect('launch').workspaceValue;
            assert.deepStrictEqual(actual, expectedLaunchConfiguration);
        }));
        test('get tasks configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const expectedTasksConfiguration = {
                'version': '2.0.0',
                'tasks': [
                    {
                        'label': 'Run Dev',
                        'type': 'shell',
                        'command': './scripts/code.sh',
                        'windows': {
                            'command': '.\\scripts\\code.bat'
                        },
                        'problemMatcher': []
                    }
                ]
            };
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['tasks'], value: expectedTasksConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.getValue("tasks" /* TasksSchemaProperties.Tasks */);
            assert.deepStrictEqual(actual, expectedTasksConfiguration);
        }));
        test('inspect tasks configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const expectedTasksConfiguration = {
                'version': '2.0.0',
                'tasks': [
                    {
                        'label': 'Run Dev',
                        'type': 'shell',
                        'command': './scripts/code.sh',
                        'windows': {
                            'command': '.\\scripts\\code.bat'
                        },
                        'problemMatcher': []
                    }
                ]
            };
            await jsonEditingServce.write(workspaceContextService.getWorkspace().configuration, [{ path: ['tasks'], value: expectedTasksConfiguration }], true);
            await testObject.reloadConfiguration();
            const actual = testObject.inspect('tasks').workspaceValue;
            assert.deepStrictEqual(actual, expectedTasksConfiguration);
        }));
        test('update user configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.workspace.testSetting', 'userValue', 2 /* ConfigurationTarget.USER */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testSetting'), 'userValue');
        }));
        test('update user configuration should trigger change event before promise is resolve', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.updateValue('configurationService.workspace.testSetting', 'userValue', 2 /* ConfigurationTarget.USER */);
            assert.ok(target.called);
        }));
        test('update workspace configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.workspace.testSetting', 'workspaceValue', 5 /* ConfigurationTarget.WORKSPACE */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testSetting'), 'workspaceValue');
        }));
        test('update workspace configuration should trigger change event before promise is resolve', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.updateValue('configurationService.workspace.testSetting', 'workspaceValue', 5 /* ConfigurationTarget.WORKSPACE */);
            assert.ok(target.called);
        }));
        test('update application setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.workspace.applicationSetting', 'workspaceValue', {}, 5 /* ConfigurationTarget.WORKSPACE */, { donotNotifyError: true })
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 1 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */));
        });
        test('update machine setting into workspace configuration in a workspace is not supported', () => {
            return testObject.updateValue('configurationService.workspace.machineSetting', 'workspaceValue', {}, 5 /* ConfigurationTarget.WORKSPACE */, { donotNotifyError: true })
                .then(() => assert.fail('Should not be supported'), (e) => assert.strictEqual(e.code, 2 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */));
        });
        test('update workspace folder configuration', () => {
            const workspace = workspaceContextService.getWorkspace();
            return testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */)
                .then(() => assert.strictEqual(testObject.getValue('configurationService.workspace.testResourceSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue'));
        });
        test('update resource language configuration in workspace folder', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('configurationService.workspace.testLanguageSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testLanguageSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue');
        }));
        test('update workspace folder configuration should trigger change event before promise is resolve', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.ok(target.called);
        }));
        test('update workspace folder configuration second time should trigger change event before promise is resolve', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.updateValue('configurationService.workspace.testResourceSetting', 'workspaceFolderValue2', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.ok(target.called);
        }));
        test('update machine overridable setting in folder', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('configurationService.workspace.machineOverridableSetting', 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.machineOverridableSetting', { resource: workspace.folders[0].uri }), 'workspaceFolderValue');
        }));
        test('update memory configuration', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await testObject.updateValue('configurationService.workspace.testSetting', 'memoryValue', 8 /* ConfigurationTarget.MEMORY */);
            assert.strictEqual(testObject.getValue('configurationService.workspace.testSetting'), 'memoryValue');
        }));
        test('update memory configuration should trigger change event before promise is resolve', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const target = sinon.spy();
            disposables.add(testObject.onDidChangeConfiguration(target));
            await testObject.updateValue('configurationService.workspace.testSetting', 'memoryValue', 8 /* ConfigurationTarget.MEMORY */);
            assert.ok(target.called);
        }));
        test('remove setting from all targets', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            const key = 'configurationService.workspace.testResourceSetting';
            await testObject.updateValue(key, 'workspaceFolderValue', { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            await testObject.updateValue(key, 'workspaceValue', 5 /* ConfigurationTarget.WORKSPACE */);
            await testObject.updateValue(key, 'userValue', 2 /* ConfigurationTarget.USER */);
            await testObject.updateValue(key, undefined, { resource: workspace.folders[0].uri });
            await testObject.reloadConfiguration();
            const actual = testObject.inspect(key, { resource: workspace.folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        }));
        test('update tasks configuration in a folder', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('tasks', { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] }, { resource: workspace.folders[0].uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            assert.deepStrictEqual(testObject.getValue("tasks" /* TasksSchemaProperties.Tasks */, { resource: workspace.folders[0].uri }), { 'version': '1.0.0', tasks: [{ 'taskName': 'myTask' }] });
        }));
        test('update launch configuration in a workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            await testObject.updateValue('launch', { 'version': '1.0.0', configurations: [{ 'name': 'myLaunch' }] }, { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE */, { donotNotifyError: true });
            assert.deepStrictEqual(testObject.getValue('launch'), { 'version': '1.0.0', configurations: [{ 'name': 'myLaunch' }] });
        }));
        test('update tasks configuration in a workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspace = workspaceContextService.getWorkspace();
            const tasks = { 'version': '2.0.0', tasks: [{ 'label': 'myTask' }] };
            await testObject.updateValue('tasks', tasks, { resource: workspace.folders[0].uri }, 5 /* ConfigurationTarget.WORKSPACE */, { donotNotifyError: true });
            assert.deepStrictEqual(testObject.getValue("tasks" /* TasksSchemaProperties.Tasks */), tasks);
        }));
        test('configuration of newly added folder is available on configuration change event', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const workspaceService = testObject;
            const uri = workspaceService.getWorkspace().folders[1].uri;
            await workspaceService.removeFolders([uri]);
            await fileService.writeFile((0, resources_1.joinPath)(uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testResourceSetting": "workspaceFolderValue" }'));
            return new Promise((c, e) => {
                disposables.add(testObject.onDidChangeConfiguration(() => {
                    try {
                        assert.strictEqual(testObject.getValue('configurationService.workspace.testResourceSetting', { resource: uri }), 'workspaceFolderValue');
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                }));
                workspaceService.addFolders([{ uri }]);
            });
        }));
        test('restricted setting is read from workspace folders when workspace is trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(true);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "userValue", "configurationService.workspace.testRestrictedSetting2": "userValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testRestrictedSetting1': 'workspaceValue' } }], true);
            await fileService.writeFile((0, resources_1.joinPath)(testObject.getWorkspace().folders[1].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting2": "workspaceFolder2Value" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting1', { resource: testObject.getWorkspace().folders[0].uri }), 'workspaceValue');
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting2', { resource: testObject.getWorkspace().folders[1].uri }), 'workspaceFolder2Value');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting1'));
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting2'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.workspace.testRestrictedSetting1']);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.size, 1);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.get(testObject.getWorkspace().folders[0].uri), undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspaceFolder?.get(testObject.getWorkspace().folders[1].uri), ['configurationService.workspace.testRestrictedSetting2']);
        }));
        test('restricted setting is not read from workspace when workspace is not trusted', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testObject.updateWorkspaceTrust(false);
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting1": "userValue", "configurationService.workspace.testRestrictedSetting2": "userValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.testRestrictedSetting1': 'workspaceValue' } }], true);
            await fileService.writeFile((0, resources_1.joinPath)(testObject.getWorkspace().folders[1].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.testRestrictedSetting2": "workspaceFolder2Value" }'));
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting1', { resource: testObject.getWorkspace().folders[0].uri }), 'userValue');
            assert.strictEqual(testObject.getValue('configurationService.workspace.testRestrictedSetting2', { resource: testObject.getWorkspace().folders[1].uri }), 'userValue');
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting1'));
            assert.ok(testObject.restrictedSettings.default.includes('configurationService.workspace.testRestrictedSetting2'));
            assert.strictEqual(testObject.restrictedSettings.userLocal, undefined);
            assert.strictEqual(testObject.restrictedSettings.userRemote, undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspace, ['configurationService.workspace.testRestrictedSetting1']);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.size, 1);
            assert.strictEqual(testObject.restrictedSettings.workspaceFolder?.get(testObject.getWorkspace().folders[0].uri), undefined);
            assert.deepStrictEqual(testObject.restrictedSettings.workspaceFolder?.get(testObject.getWorkspace().folders[1].uri), ['configurationService.workspace.testRestrictedSetting2']);
        }));
        test('remove an unregistered setting', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const key = 'configurationService.workspace.unknownSetting';
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.workspace.unknownSetting": "userValue" }'));
            await jsonEditingServce.write((workspaceContextService.getWorkspace().configuration), [{ path: ['settings'], value: { 'configurationService.workspace.unknownSetting': 'workspaceValue' } }], true);
            await fileService.writeFile((0, resources_1.joinPath)(workspaceContextService.getWorkspace().folders[0].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.unknownSetting": "workspaceFolderValue1" }'));
            await fileService.writeFile((0, resources_1.joinPath)(workspaceContextService.getWorkspace().folders[1].uri, '.vscode', 'settings.json'), buffer_1.VSBuffer.fromString('{ "configurationService.workspace.unknownSetting": "workspaceFolderValue2" }'));
            await testObject.reloadConfiguration();
            await testObject.updateValue(key, undefined, { resource: workspaceContextService.getWorkspace().folders[0].uri });
            let actual = testObject.inspect(key, { resource: workspaceContextService.getWorkspace().folders[0].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            await testObject.updateValue(key, undefined, { resource: workspaceContextService.getWorkspace().folders[1].uri });
            actual = testObject.inspect(key, { resource: workspaceContextService.getWorkspace().folders[1].uri });
            assert.strictEqual(actual.userValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        }));
    });
    suite('WorkspaceConfigurationService - Remote Folder', () => {
        let testObject, folder, machineSettingsResource, remoteSettingsResource, fileSystemProvider, resolveRemoteEnvironment, instantiationService, fileService, environmentService, userDataProfileService;
        const remoteAuthority = 'configuraiton-tests';
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.remote.applicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'configurationService.remote.machineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    },
                    'configurationService.remote.machineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    },
                    'configurationService.remote.testSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */
                    }
                }
            });
        });
        setup(async () => {
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const appSettingsHome = (0, resources_1.joinPath)(ROOT, 'user');
            folder = (0, resources_1.joinPath)(ROOT, 'a');
            await fileService.createFolder(folder);
            await fileService.createFolder(appSettingsHome);
            machineSettingsResource = (0, resources_1.joinPath)(ROOT, 'machine-settings.json');
            remoteSettingsResource = machineSettingsResource.with({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority });
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            environmentService = workbenchTestServices_1.TestEnvironmentService;
            const remoteEnvironmentPromise = new Promise(c => resolveRemoteEnvironment = () => c({ settingsPath: remoteSettingsResource }));
            const remoteAgentService = instantiationService.stub(remoteAgentService_1.IRemoteAgentService, { getEnvironment: () => remoteEnvironmentPromise });
            const configurationCache = { read: () => Promise.resolve(''), write: () => Promise.resolve(), remove: () => Promise.resolve(), needsCaching: () => false };
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService)));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()))));
            userDataProfileService = instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)));
            testObject = disposables.add(new configurationService_1.WorkspaceService({ configurationCache, remoteAuthority }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, new log_1.NullLogService(), new policy_1.NullPolicyService()));
            instantiationService.stub(workspace_1.IWorkspaceContextService, testObject);
            instantiationService.stub(configuration_1.IConfigurationService, testObject);
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            instantiationService.stub(files_1.IFileService, fileService);
        });
        async function initialize() {
            await testObject.initialize(convertToWorkspacePayload(folder));
            instantiationService.stub(textfiles_1.ITextFileService, disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestTextFileService)));
            instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
            instantiationService.stub(jsonEditing_1.IJSONEditingService, instantiationService.createInstance(jsonEditingService_1.JSONEditingService));
            testObject.acquireInstantiationService(instantiationService);
        }
        function registerRemoteFileSystemProvider() {
            disposables.add(instantiationService.get(files_1.IFileService).registerProvider(network_1.Schemas.vscodeRemote, new workbenchTestServices_1.RemoteFileSystemProvider(fileSystemProvider, remoteAuthority)));
        }
        function registerRemoteFileSystemProviderOnActivation() {
            const disposable = disposables.add(instantiationService.get(files_1.IFileService).onWillActivateFileSystemProvider(e => {
                if (e.scheme === network_1.Schemas.vscodeRemote) {
                    disposable.dispose();
                    e.join(Promise.resolve().then(() => registerRemoteFileSystemProvider()));
                }
            }));
        }
        test('remote settings override globals', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
        }));
        test('remote settings override globals after remote provider is registered on activation', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            resolveRemoteEnvironment();
            registerRemoteFileSystemProviderOnActivation();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
        }));
        test('remote settings override globals after remote environment is resolved', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            registerRemoteFileSystemProvider();
            await initialize();
            const promise = new Promise((c, e) => {
                disposables.add(testObject.onDidChangeConfiguration(event => {
                    try {
                        assert.strictEqual(event.source, 2 /* ConfigurationTarget.USER */);
                        assert.deepStrictEqual([...event.affectedKeys], ['configurationService.remote.machineSetting']);
                        assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                }));
            });
            resolveRemoteEnvironment();
            return promise;
        }));
        test('remote settings override globals after remote provider is registered on activation and remote environment is resolved', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(machineSettingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "remoteValue" }'));
            registerRemoteFileSystemProviderOnActivation();
            await initialize();
            const promise = new Promise((c, e) => {
                disposables.add(testObject.onDidChangeConfiguration(event => {
                    try {
                        assert.strictEqual(event.source, 2 /* ConfigurationTarget.USER */);
                        assert.deepStrictEqual([...event.affectedKeys], ['configurationService.remote.machineSetting']);
                        assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'remoteValue');
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                }));
            });
            resolveRemoteEnvironment();
            return promise;
        }));
        test('machine settings in local user settings does not override defaults', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineSetting": "globalValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineSetting'), 'isSet');
        }));
        test('machine overridable settings in local user settings does not override defaults', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.machineOverridableSetting": "globalValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            assert.strictEqual(testObject.getValue('configurationService.remote.machineOverridableSetting'), 'isSet');
        }));
        test('non machine setting is written in local settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            await testObject.updateValue('configurationService.remote.applicationSetting', 'applicationValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.inspect('configurationService.remote.applicationSetting').userLocalValue, 'applicationValue');
        }));
        test('machine setting is written in remote settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            await testObject.updateValue('configurationService.remote.machineSetting', 'machineValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.inspect('configurationService.remote.machineSetting').userRemoteValue, 'machineValue');
        }));
        test('machine overridable setting is written in remote settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            await testObject.updateValue('configurationService.remote.machineOverridableSetting', 'machineValue');
            await testObject.reloadConfiguration();
            assert.strictEqual(testObject.inspect('configurationService.remote.machineOverridableSetting').userRemoteValue, 'machineValue');
        }));
        test('machine settings in local user settings does not override defaults after defalts are registered ', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.newMachineSetting": "userValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.remote.newMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.remote.newMachineSetting'), 'isSet');
        }));
        test('machine overridable settings in local user settings does not override defaults after defaults are registered ', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await fileService.writeFile(userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString('{ "configurationService.remote.newMachineOverridableSetting": "userValue" }'));
            registerRemoteFileSystemProvider();
            resolveRemoteEnvironment();
            await initialize();
            configurationRegistry.registerConfiguration({
                'id': '_test',
                'type': 'object',
                'properties': {
                    'configurationService.remote.newMachineOverridableSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            assert.strictEqual(testObject.getValue('configurationService.remote.newMachineOverridableSetting'), 'isSet');
        }));
    });
    function getWorkspaceId(configPath) {
        let workspaceConfigPath = configPath.toString();
        if (!platform_2.isLinux) {
            workspaceConfigPath = workspaceConfigPath.toLowerCase(); // sanitize for platform file system
        }
        return (0, hash_1.hash)(workspaceConfigPath).toString(16);
    }
    function getWorkspaceIdentifier(configPath) {
        return {
            configPath,
            id: getWorkspaceId(configPath)
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbmZpZ3VyYXRpb24vdGVzdC9icm93c2VyL2NvbmZpZ3VyYXRpb25TZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvRGhHLFNBQVMseUJBQXlCLENBQUMsTUFBVztRQUM3QyxPQUFPO1lBQ04sRUFBRSxFQUFFLElBQUEsV0FBSSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDeEMsR0FBRyxFQUFFLE1BQU07U0FDWCxDQUFDO0lBQ0gsQ0FBQztJQUVELE1BQU0sa0JBQWtCO1FBQ3ZCLFlBQVksQ0FBQyxRQUFhLElBQWEsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RELEtBQUssQ0FBQyxJQUFJLEtBQXNCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsS0FBSyxLQUFvQixDQUFDO1FBQ2hDLEtBQUssQ0FBQyxNQUFNLEtBQW9CLENBQUM7S0FDakM7SUFFRCxNQUFNLElBQUksR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBRWhFLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7UUFFOUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksTUFBVyxDQUFDO1FBQ2hCLElBQUksVUFBNEIsQ0FBQztRQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFOUQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLE1B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