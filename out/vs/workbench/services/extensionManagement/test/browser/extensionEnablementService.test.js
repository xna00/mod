define(["require", "exports", "assert", "sinon", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/browser/extensionEnablementService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/base/common/network", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/host/browser/host", "vs/base/test/common/mock", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/test/common/workbenchTestServices", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/extensionManagement/common/extensionManagementService", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/product/common/productService"], function (require, exports, assert, sinon, extensionManagement_1, extensionManagement_2, extensionEnablementService_1, instantiationServiceMock_1, event_1, workspace_1, environmentService_1, storage_1, types_1, extensionManagementUtil_1, configuration_1, uri_1, network_1, testConfigurationService_1, workbenchTestServices_1, extensionEnablementService_2, userDataSyncAccount_1, userDataSync_1, lifecycle_1, notification_1, testNotificationService_1, host_1, mock_1, workspaceTrust_1, extensionManifestPropertiesService_1, workbenchTestServices_2, testWorkspace_1, extensionManagementService_1, log_1, lifecycle_2, utils_1, files_1, fileService_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestExtensionEnablementService = void 0;
    exports.anExtensionManagementServerService = anExtensionManagementServerService;
    function createStorageService(instantiationService, disposableStore) {
        let service = instantiationService.get(storage_1.IStorageService);
        if (!service) {
            let workspaceContextService = instantiationService.get(workspace_1.IWorkspaceContextService);
            if (!workspaceContextService) {
                workspaceContextService = instantiationService.stub(workspace_1.IWorkspaceContextService, {
                    getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */,
                    getWorkspace: () => testWorkspace_1.TestWorkspace
                });
            }
            service = instantiationService.stub(storage_1.IStorageService, disposableStore.add(new storage_1.InMemoryStorageService()));
        }
        return service;
    }
    class TestExtensionEnablementService extends extensionEnablementService_1.ExtensionEnablementService {
        constructor(instantiationService) {
            const disposables = new lifecycle_2.DisposableStore();
            const storageService = createStorageService(instantiationService, disposables);
            const extensionManagementServerService = instantiationService.get(extensionManagement_2.IExtensionManagementServerService) ||
                instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService({
                    id: 'local',
                    label: 'local',
                    extensionManagementService: {
                        onInstallExtension: disposables.add(new event_1.Emitter()).event,
                        onDidInstallExtensions: disposables.add(new event_1.Emitter()).event,
                        onUninstallExtension: disposables.add(new event_1.Emitter()).event,
                        onDidUninstallExtension: disposables.add(new event_1.Emitter()).event,
                        onDidChangeProfile: disposables.add(new event_1.Emitter()).event,
                        onDidUpdateExtensionMetadata: disposables.add(new event_1.Emitter()).event,
                    },
                }, null, null));
            const extensionManagementService = disposables.add(instantiationService.createInstance(extensionManagementService_1.ExtensionManagementService));
            const workbenchExtensionManagementService = instantiationService.get(extensionManagement_2.IWorkbenchExtensionManagementService) || instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, extensionManagementService);
            const workspaceTrustManagementService = instantiationService.get(workspaceTrust_1.IWorkspaceTrustManagementService) || instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, disposables.add(new workbenchTestServices_2.TestWorkspaceTrustManagementService()));
            super(storageService, disposables.add(new extensionEnablementService_2.GlobalExtensionEnablementService(storageService, extensionManagementService)), instantiationService.get(workspace_1.IWorkspaceContextService) || new workbenchTestServices_2.TestContextService(), instantiationService.get(environmentService_1.IWorkbenchEnvironmentService) || instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, {}), workbenchExtensionManagementService, instantiationService.get(configuration_1.IConfigurationService), extensionManagementServerService, instantiationService.get(userDataSync_1.IUserDataSyncEnablementService) || instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, { isEnabled() { return false; } }), instantiationService.get(userDataSyncAccount_1.IUserDataSyncAccountService) || instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, userDataSyncAccount_1.UserDataSyncAccountService), instantiationService.get(lifecycle_1.ILifecycleService) || instantiationService.stub(lifecycle_1.ILifecycleService, disposables.add(new workbenchTestServices_1.TestLifecycleService())), instantiationService.get(notification_1.INotificationService) || instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService()), instantiationService.get(host_1.IHostService), new class extends (0, mock_1.mock)() {
                isDisabledByBisect() { return false; }
            }, workspaceTrustManagementService, new class extends (0, mock_1.mock)() {
                requestWorkspaceTrust(options) { return Promise.resolve(true); }
            }, instantiationService.get(extensionManifestPropertiesService_1.IExtensionManifestPropertiesService) || instantiationService.stub(extensionManifestPropertiesService_1.IExtensionManifestPropertiesService, disposables.add(new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_2.TestProductService, new testConfigurationService_1.TestConfigurationService(), new workbenchTestServices_2.TestWorkspaceTrustEnablementService(), new log_1.NullLogService()))), instantiationService);
            this._register(disposables);
        }
        async waitUntilInitialized() {
            await this.extensionsManager.whenInitialized();
        }
        reset() {
            let extensions = this.globalExtensionEnablementService.getDisabledExtensions();
            for (const e of this._getWorkspaceDisabledExtensions()) {
                if (!extensions.some(r => (0, extensionManagementUtil_1.areSameExtensions)(r, e))) {
                    extensions.push(e);
                }
            }
            const workspaceEnabledExtensions = this._getWorkspaceEnabledExtensions();
            if (workspaceEnabledExtensions.length) {
                extensions = extensions.filter(r => !workspaceEnabledExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, r)));
            }
            extensions.forEach(d => this.setEnablement([aLocalExtension(d.id)], 8 /* EnablementState.EnabledGlobally */));
        }
    }
    exports.TestExtensionEnablementService = TestExtensionEnablementService;
    suite('ExtensionEnablementService Test', () => {
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let testObject;
        const didInstallEvent = new event_1.Emitter();
        const didUninstallEvent = new event_1.Emitter();
        const didChangeProfileExtensionsEvent = new event_1.Emitter();
        const installed = [];
        setup(() => {
            installed.splice(0, installed.length);
            instantiationService = disposableStore.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(files_1.IFileService, disposableStore.add(new fileService_1.FileService(new log_1.NullLogService())));
            instantiationService.stub(productService_1.IProductService, workbenchTestServices_2.TestProductService);
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService({
                id: 'local',
                label: 'local',
                extensionManagementService: {
                    onDidInstallExtensions: didInstallEvent.event,
                    onDidUninstallExtension: didUninstallEvent.event,
                    onDidChangeProfile: didChangeProfileExtensionsEvent.event,
                    getInstalled: () => Promise.resolve(installed)
                },
            }, null, null));
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, disposableStore.add(instantiationService.createInstance(extensionManagementService_1.ExtensionManagementService)));
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
        });
        test('test disable an extension globally', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 6 /* EnablementState.DisabledGlobally */);
        });
        test('test disable an extension globally should return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally triggers the change event', async () => {
            const target = sinon.spy();
            disposableStore.add(testObject.onEnablementChanged(target));
            await testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
        });
        test('test disable an extension globally again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 6 /* EnablementState.DisabledGlobally */));
        });
        test('test state of globally enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 8 /* EnablementState.EnabledGlobally */));
        });
        test('test disable an extension for workspace', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 7 /* EnablementState.DisabledWorkspace */);
        });
        test('test disable an extension for workspace returns a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of workspace disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 7 /* EnablementState.DisabledWorkspace */));
        });
        test('test state of workspace and globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 7 /* EnablementState.DisabledWorkspace */));
        });
        test('test state of workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 9 /* EnablementState.EnabledWorkspace */));
        });
        test('test state of globally disabled and workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 9 /* EnablementState.EnabledWorkspace */));
        });
        test('test state of an extension when disabled for workspace from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 7 /* EnablementState.DisabledWorkspace */));
        });
        test('test state of an extension when disabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 6 /* EnablementState.DisabledGlobally */));
        });
        test('test state of an extension when disabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 6 /* EnablementState.DisabledGlobally */));
        });
        test('test state of an extension when enabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 8 /* EnablementState.EnabledGlobally */));
        });
        test('test state of an extension when enabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 8 /* EnablementState.EnabledGlobally */));
        });
        test('test disable an extension for workspace and then globally', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 6 /* EnablementState.DisabledGlobally */);
        });
        test('test disable an extension for workspace and then globally return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace and then globally trigger the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => disposableStore.add(testObject.onEnablementChanged(target)))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension globally and then for workspace', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 7 /* EnablementState.DisabledWorkspace */);
        });
        test('test disable an extension globally and then for workspace return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally and then for workspace triggers the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => disposableStore.add(testObject.onEnablementChanged(target)))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension for workspace when there is no workspace throws error', () => {
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* WorkbenchState.EMPTY */);
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => assert.fail('should throw an error'), error => assert.ok(error));
        });
        test('test enable an extension globally', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension globally return truthy promise', async () => {
            await testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */);
            const value = await testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(value[0], true);
        });
        test('test enable an extension globally triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => disposableStore.add(testObject.onEnablementChanged(target)))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test enable an extension globally when already enabled return falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */)
                .then(value => assert.ok(!value[0]));
        });
        test('test enable an extension for workspace', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test enable an extension for workspace return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.b')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => disposableStore.add(testObject.onEnablementChanged(target)))
                .then(() => testObject.setEnablement([aLocalExtension('pub.b')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.b' });
            });
        });
        test('test enable an extension for workspace when already enabled return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */)
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace when disabled in workspace and gloablly', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test enable an extension globally when disabled in workspace and gloablly', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension also enables dependencies', async () => {
            installed.push(...[aLocalExtension2('pub.a', { extensionDependencies: ['pub.b'] }), aLocalExtension('pub.b')]);
            const target = installed[0];
            const dep = installed[1];
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([dep, target], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([target], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(target));
            assert.ok(testObject.isEnabled(dep));
            assert.strictEqual(testObject.getEnablementState(target), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(dep), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension in workspace with a dependency extension that has auth providers', async () => {
            installed.push(...[aLocalExtension2('pub.a', { extensionDependencies: ['pub.b'] }), aLocalExtension('pub.b', { authentication: [{ id: 'a', label: 'a' }] })]);
            const target = installed[0];
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([target], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([target], 9 /* EnablementState.EnabledWorkspace */);
            assert.ok(testObject.isEnabled(target));
            assert.strictEqual(testObject.getEnablementState(target), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test enable an extension with a dependency extension that cannot be enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceDepExtension = aLocalExtension2('pub.b', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.b`) });
            const remoteWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'], extensionDependencies: ['pub.b'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteWorkspaceDepExtension = aLocalExtension2('pub.b', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.b`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            installed.push(localWorkspaceDepExtension, remoteWorkspaceExtension, remoteWorkspaceDepExtension);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([remoteWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([remoteWorkspaceExtension], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(remoteWorkspaceExtension));
            assert.strictEqual(testObject.getEnablementState(remoteWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension also enables packed extensions', async () => {
            installed.push(...[aLocalExtension2('pub.a', { extensionPack: ['pub.b'] }), aLocalExtension('pub.b')]);
            const target = installed[0];
            const dep = installed[1];
            await testObject.setEnablement([dep, target], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([target], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(target));
            assert.ok(testObject.isEnabled(dep));
            assert.strictEqual(testObject.getEnablementState(target), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(dep), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test remove an extension from disablement list when uninstalled', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            didUninstallEvent.fire({ identifier: { id: 'pub.a' } });
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test isEnabled return false extension is disabled globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return false extension is disabled in workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return true extension is not disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.c')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => assert.ok(testObject.isEnabled(aLocalExtension('pub.b'))));
        });
        test('test canChangeEnablement return false for language packs', () => {
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { localizations: [{ languageId: 'gr', translations: [{ id: 'vscode', path: 'path' }] }] })), false);
        });
        test('test canChangeEnablement return true for auth extension', () => {
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), true);
        });
        test('test canChangeEnablement return true for auth extension when user data sync account does not depends on it', () => {
            instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, {
                account: { authenticationProviderId: 'b' }
            });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), true);
        });
        test('test canChangeEnablement return true for auth extension when user data sync account depends on it but auto sync is off', () => {
            instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, {
                account: { authenticationProviderId: 'a' }
            });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), true);
        });
        test('test canChangeEnablement return false for auth extension and user data sync account depends on it and auto sync is on', () => {
            instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, { isEnabled() { return true; } });
            instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, {
                account: { authenticationProviderId: 'a' }
            });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), false);
        });
        test('test canChangeWorkspaceEnablement return true', () => {
            assert.strictEqual(testObject.canChangeWorkspaceEnablement(aLocalExtension('pub.a')), true);
        });
        test('test canChangeWorkspaceEnablement return false if there is no workspace', () => {
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* WorkbenchState.EMPTY */);
            assert.strictEqual(testObject.canChangeWorkspaceEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeWorkspaceEnablement return false for auth extension', () => {
            assert.strictEqual(testObject.canChangeWorkspaceEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), false);
        });
        test('test canChangeEnablement return false when extensions are disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return false when the extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return true for system extensions when extensions are disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            const extension = aLocalExtension('pub.a', undefined, 0 /* ExtensionType.System */);
            assert.strictEqual(testObject.canChangeEnablement(extension), true);
        });
        test('test canChangeEnablement return false for system extension when extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            const extension = aLocalExtension('pub.a', undefined, 0 /* ExtensionType.System */);
            assert.ok(!testObject.canChangeEnablement(extension));
        });
        test('test extension is disabled when disabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 2 /* EnablementState.DisabledByEnvironment */);
        });
        test('test extension is enabled globally when enabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension is enabled workspace when enabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test extension is enabled by environment when disabled globally', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 3 /* EnablementState.EnabledByEnvironment */);
        });
        test('test extension is enabled by environment when disabled workspace', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 3 /* EnablementState.EnabledByEnvironment */);
        });
        test('test extension is disabled by environment when also enabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true, enableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 2 /* EnablementState.DisabledByEnvironment */);
        });
        test('test canChangeEnablement return false when the extension is enabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test extension does not support vitrual workspace is not enabled in virtual workspace', async () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 4 /* EnablementState.DisabledByVirtualWorkspace */);
        });
        test('test web extension from web extension management server and does not support vitrual workspace is enabled in virtual workspace', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(null, anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false }, browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'web' }) });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test web extension from remote extension management server and does not support vitrual workspace is disabled in virtual workspace', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(null, anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false }, browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 4 /* EnablementState.DisabledByVirtualWorkspace */);
        });
        test('test enable a remote workspace extension and local ui extension that is a dependency of remote', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localUIExtension = aLocalExtension2('pub.a', { main: 'main.js', extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension2('pub.a', { main: 'main.js', extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            const target = aLocalExtension2('pub.b', { main: 'main.js', extensionDependencies: ['pub.a'] }, { location: uri_1.URI.file(`pub.b`).with({ scheme: 'vscode-remote' }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            installed.push(localUIExtension, remoteUIExtension, target);
            await testObject.setEnablement([target, localUIExtension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([target, localUIExtension], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(target));
            assert.ok(testObject.isEnabled(localUIExtension));
            assert.strictEqual(testObject.getEnablementState(target), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(localUIExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable a remote workspace extension also enables its dependency in local', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localUIExtension = aLocalExtension2('pub.a', { main: 'main.js', extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension2('pub.a', { main: 'main.js', extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            const target = aLocalExtension2('pub.b', { main: 'main.js', extensionDependencies: ['pub.a'] }, { location: uri_1.URI.file(`pub.b`).with({ scheme: 'vscode-remote' }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            installed.push(localUIExtension, remoteUIExtension, target);
            await testObject.setEnablement([target, localUIExtension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([target], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(target));
            assert.ok(testObject.isEnabled(localUIExtension));
            assert.strictEqual(testObject.getEnablementState(target), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(localUIExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return false when extension is disabled in virtual workspace', () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.canChangeEnablement(extension));
        });
        test('test extension does not support vitrual workspace is enabled in normal workspace', async () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA') }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension supports virtual workspace is enabled in virtual workspace', async () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: true } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension does not support untrusted workspaces is disabled in untrusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.getEnablementState(extension), 0 /* EnablementState.DisabledByTrustRequirement */);
        });
        test('test canChangeEnablement return true when extension is disabled by workspace trust', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.canChangeEnablement(extension));
        });
        test('test extension supports untrusted workspaces is enabled in untrusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension does not support untrusted workspaces is enabled in trusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: '' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return true; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension supports untrusted workspaces is enabled in trusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return true; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension without any value for virtual worksapce is enabled in virtual workspace', async () => {
            const extension = aLocalExtension2('pub.a');
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test local workspace extension is disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test local workspace + ui extension is enabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test local ui extension is not disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return true when the local workspace extension is disabled by kind', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), false);
        });
        test('test canChangeEnablement return true for local ui extension', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), true);
        });
        test('test remote ui extension is disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test remote ui+workspace extension is disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test remote ui extension is disabled by kind when there is no local server', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(null, anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test remote workspace extension is not disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return true when the remote ui extension is disabled by kind', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), false);
        });
        test('test canChangeEnablement return true for remote workspace extension', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), true);
        });
        test('test web extension on local server is disabled by kind when web worker is not enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: false });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), false);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test web extension on local server is not disabled by kind when web worker is enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: true });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), true);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test web extension on remote server is disabled by kind when web worker is not enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: false });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), false);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test web extension on remote server is disabled by kind when web worker is enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: true });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), false);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test web extension on remote server is enabled in web', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: false });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), true);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test web extension on web server is not disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const webExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'web' }) });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.isEnabled(webExtension), true);
            assert.deepStrictEqual(testObject.getEnablementState(webExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test state of multipe extensions', async () => {
            installed.push(...[aLocalExtension('pub.a'), aLocalExtension('pub.b'), aLocalExtension('pub.c'), aLocalExtension('pub.d'), aLocalExtension('pub.e')]);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([installed[0]], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([installed[1]], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([installed[2]], 9 /* EnablementState.EnabledWorkspace */);
            await testObject.setEnablement([installed[3]], 8 /* EnablementState.EnabledGlobally */);
            assert.deepStrictEqual(testObject.getEnablementStates(installed), [6 /* EnablementState.DisabledGlobally */, 7 /* EnablementState.DisabledWorkspace */, 9 /* EnablementState.EnabledWorkspace */, 8 /* EnablementState.EnabledGlobally */, 8 /* EnablementState.EnabledGlobally */]);
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled', async () => {
            installed.push(...[aLocalExtension2('pub.a'), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'] })]);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([installed[0]], 6 /* EnablementState.DisabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(installed[1]), 5 /* EnablementState.DisabledByExtensionDependency */);
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled by virtual workspace', async () => {
            installed.push(...[aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { virtualWorkspaces: true } })]);
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            assert.strictEqual(testObject.getEnablementState(installed[0]), 4 /* EnablementState.DisabledByVirtualWorkspace */);
            assert.strictEqual(testObject.getEnablementState(installed[1]), 5 /* EnablementState.DisabledByExtensionDependency */);
        });
        test('test canChangeEnablement return false when extension is disabled by dependency if it has a dependency that is disabled by virtual workspace', async () => {
            installed.push(...[aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { virtualWorkspaces: true } })]);
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            assert.ok(!testObject.canChangeEnablement(installed[1]));
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled by workspace trust', async () => {
            installed.push(...[aLocalExtension2('pub.a', { main: 'hello.js', capabilities: { untrustedWorkspaces: { supported: false, description: '' } } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { untrustedWorkspaces: { supported: true } } })]);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            assert.strictEqual(testObject.getEnablementState(installed[0]), 0 /* EnablementState.DisabledByTrustRequirement */);
            assert.strictEqual(testObject.getEnablementState(installed[1]), 5 /* EnablementState.DisabledByExtensionDependency */);
        });
        test('test extension is not disabled by dependency if it has a dependency that is disabled by extension kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localUIExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteWorkspaceExtension = aLocalExtension2('pub.n', { extensionKind: ['workspace'], extensionDependencies: ['pub.a'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            installed.push(localUIExtension, remoteUIExtension, remoteWorkspaceExtension);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            assert.strictEqual(testObject.getEnablementState(localUIExtension), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(remoteUIExtension), 1 /* EnablementState.DisabledByExtensionKind */);
            assert.strictEqual(testObject.getEnablementState(remoteWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return true when extension is disabled by dependency if it has a dependency that is disabled by workspace trust', async () => {
            installed.push(...[aLocalExtension2('pub.a', { main: 'hello.js', capabilities: { untrustedWorkspaces: { supported: false, description: '' } } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { untrustedWorkspaces: { supported: true } } })]);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            assert.ok(testObject.canChangeEnablement(installed[1]));
        });
        test('test extension is not disabled by dependency even if it has a dependency that is disabled when installed extensions are not set', async () => {
            await testObject.setEnablement([aLocalExtension2('pub.a')], 6 /* EnablementState.DisabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'] })), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled when all extensions are passed', async () => {
            installed.push(...[aLocalExtension2('pub.a'), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'] })]);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([installed[0]], 6 /* EnablementState.DisabledGlobally */);
            assert.deepStrictEqual(testObject.getEnablementStates(installed), [6 /* EnablementState.DisabledGlobally */, 5 /* EnablementState.DisabledByExtensionDependency */]);
        });
        test('test override workspace to trusted when getting extensions enablements', async () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.getEnablementStates([extension], { trusted: true })[0], 8 /* EnablementState.EnabledGlobally */);
        });
        test('test override workspace to not trusted when getting extensions enablements', async () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return true; } });
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            assert.strictEqual(testObject.getEnablementStates([extension], { trusted: false })[0], 0 /* EnablementState.DisabledByTrustRequirement */);
        });
        test('test update extensions enablements on trust change triggers change events for extensions depending on workspace trust', async () => {
            installed.push(...[
                aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } }),
                aLocalExtension2('pub.b', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } }),
                aLocalExtension2('pub.c', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } }),
                aLocalExtension2('pub.d', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } }),
            ]);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            const target = sinon.spy();
            disposableStore.add(testObject.onEnablementChanged(target));
            await testObject.updateExtensionsEnablementsWhenWorkspaceTrustChanges();
            assert.strictEqual(target.args[0][0].length, 2);
            assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            assert.deepStrictEqual(target.args[0][0][1].identifier, { id: 'pub.c' });
        });
        test('test adding an extension that was disabled', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            testObject = disposableStore.add(new TestExtensionEnablementService(instantiationService));
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            const target = sinon.spy();
            disposableStore.add(testObject.onEnablementChanged(target));
            didChangeProfileExtensionsEvent.fire({ added: [extension], removed: [] });
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 6 /* EnablementState.DisabledGlobally */);
            assert.strictEqual(target.args[0][0].length, 1);
            assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
        });
    });
    function anExtensionManagementServer(authority, instantiationService) {
        return {
            id: authority,
            label: authority,
            extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService),
        };
    }
    function aMultiExtensionManagementServerService(instantiationService) {
        const localExtensionManagementServer = anExtensionManagementServer('vscode-local', instantiationService);
        const remoteExtensionManagementServer = anExtensionManagementServer('vscode-remote', instantiationService);
        return anExtensionManagementServerService(localExtensionManagementServer, remoteExtensionManagementServer, null);
    }
    function anExtensionManagementServerService(localExtensionManagementServer, remoteExtensionManagementServer, webExtensionManagementServer) {
        return {
            _serviceBrand: undefined,
            localExtensionManagementServer,
            remoteExtensionManagementServer,
            webExtensionManagementServer,
            getExtensionManagementServer: (extension) => {
                if (extension.location.scheme === network_1.Schemas.file) {
                    return localExtensionManagementServer;
                }
                if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                    return remoteExtensionManagementServer;
                }
                return webExtensionManagementServer;
            },
            getExtensionInstallLocation(extension) {
                const server = this.getExtensionManagementServer(extension);
                return server === remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */
                    : server === webExtensionManagementServer ? 3 /* ExtensionInstallLocation.Web */
                        : 1 /* ExtensionInstallLocation.Local */;
            }
        };
    }
    function aLocalExtension(id, contributes, type) {
        return aLocalExtension2(id, contributes ? { contributes } : {}, (0, types_1.isUndefinedOrNull)(type) ? {} : { type });
    }
    function aLocalExtension2(id, manifest = {}, properties = {}) {
        const [publisher, name] = id.split('.');
        manifest = { name, publisher, ...manifest };
        properties = {
            identifier: { id },
            location: uri_1.URI.file(`pub.${name}`),
            galleryIdentifier: { id, uuid: undefined },
            type: 1 /* ExtensionType.User */,
            ...properties
        };
        properties.isBuiltin = properties.type === 0 /* ExtensionType.System */;
        return Object.create({ manifest, ...properties });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRW5hYmxlbWVudFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbk1hbmFnZW1lbnQvdGVzdC9icm93c2VyL2V4dGVuc2lvbkVuYWJsZW1lbnRTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQXNoQ0EsZ0ZBc0JDO0lBamdDRCxTQUFTLG9CQUFvQixDQUFDLG9CQUE4QyxFQUFFLGVBQWdDO1FBQzdHLElBQUksT0FBTyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2QsSUFBSSx1QkFBdUIsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0NBQXdCLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDOUIsdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9DQUF3QixFQUE0QjtvQkFDdkcsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLDhCQUFzQjtvQkFDOUMsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLDZCQUEyQjtpQkFDL0MsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMseUJBQWUsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksZ0NBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekcsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxNQUFhLDhCQUErQixTQUFRLHVEQUEwQjtRQUM3RSxZQUFZLG9CQUE4QztZQUN6RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxNQUFNLGNB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