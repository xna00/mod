/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/url/common/url", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/url/common/urlService", "vs/base/common/uri", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/electron-sandbox/remoteAgentService", "vs/platform/ipc/electron-sandbox/services", "vs/base/common/cancellation", "vs/platform/label/common/label", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/progressService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/workspace/common/workspaceTrust", "vs/platform/environment/common/environment", "vs/base/common/platform", "vs/base/common/process", "vs/base/test/common/utils", "vs/platform/update/common/update", "vs/platform/files/common/files", "vs/platform/files/common/fileService"], function (require, exports, assert, uuid_1, extensions_1, ExtensionsActions, extensionsWorkbenchService_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, extensionManagementUtil_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, extensions_2, workspace_1, workbenchTestServices_1, workbenchTestServices_2, configuration_1, log_1, urlService_1, uri_1, testConfigurationService_1, remoteAgentService_1, remoteAgentService_2, services_1, cancellation_1, label_1, productService_1, network_1, progress_1, progressService_1, lifecycle_1, workbenchTestServices_3, environmentService_1, environmentService_2, userDataSync_1, userDataSyncEnablementService_1, contextkey_1, mockKeybindingService_1, workspaceTrust_1, environment_1, platform_1, process_1, utils_1, update_1, files_1, fileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let instantiationService;
    let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
    function setupTest(disposables) {
        installEvent = disposables.add(new event_1.Emitter());
        didInstallEvent = disposables.add(new event_1.Emitter());
        uninstallEvent = disposables.add(new event_1.Emitter());
        didUninstallEvent = disposables.add(new event_1.Emitter());
        instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
        instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_3.TestEnvironmentService);
        instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, workbenchTestServices_3.TestEnvironmentService);
        instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
        instantiationService.stub(log_1.ILogService, log_1.NullLogService);
        instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
        instantiationService.stub(files_1.IFileService, disposables.add(new fileService_1.FileService(new log_1.NullLogService())));
        instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
        instantiationService.stub(progress_1.IProgressService, progressService_1.ProgressService);
        instantiationService.stub(productService_1.IProductService, {});
        instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
        instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
        instantiationService.stub(services_1.ISharedProcessService, workbenchTestServices_2.TestSharedProcessService);
        instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, {
            onDidInstallExtensions: didInstallEvent.event,
            onInstallExtension: installEvent.event,
            onUninstallExtension: uninstallEvent.event,
            onDidUninstallExtension: didUninstallEvent.event,
            onDidUpdateExtensionMetadata: event_1.Event.None,
            onDidChangeProfile: event_1.Event.None,
            async getInstalled() { return []; },
            async getInstalledWorkspaceExtensions() { return []; },
            async getExtensionsControlManifest() { return { malicious: [], deprecated: {}, search: [] }; },
            async updateMetadata(local, metadata) {
                local.identifier.uuid = metadata.id;
                local.publisherDisplayName = metadata.publisherDisplayName;
                local.publisherId = metadata.publisherId;
                return local;
            },
            async canInstall() { return true; },
            async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); },
        });
        instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService_2.RemoteAgentService);
        const localExtensionManagementServer = { extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService), label: 'local', id: 'vscode-local' };
        instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, {
            get localExtensionManagementServer() {
                return localExtensionManagementServer;
            },
            getExtensionManagementServer(extension) {
                if (extension.location.scheme === network_1.Schemas.file) {
                    return localExtensionManagementServer;
                }
                throw new Error(`Invalid Extension ${extension.location}`);
            }
        });
        instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
        instantiationService.stub(label_1.ILabelService, { onDidChangeFormatters: disposables.add(new event_1.Emitter()).event });
        instantiationService.stub(lifecycle_1.ILifecycleService, disposables.add(new workbenchTestServices_3.TestLifecycleService()));
        instantiationService.stub(extensionManagement_1.IExtensionTipsService, disposables.add(instantiationService.createInstance(workbenchTestServices_2.TestExtensionTipsService)));
        instantiationService.stub(extensionRecommendations_1.IExtensionRecommendationsService, {});
        instantiationService.stub(url_1.IURLService, urlService_1.NativeURLService);
        instantiationService.stub(extensionManagement_1.IExtensionGalleryService, 'isEnabled', true);
        instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
        instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', []);
        instantiationService.stub(extensions_2.IExtensionService, { extensions: [], onDidChangeExtensions: event_1.Event.None, canAddExtension: (extension) => false, canRemoveExtension: (extension) => false, whenInstalledExtensionsRegistered: () => Promise.resolve(true) });
        instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).reset();
        instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, disposables.add(instantiationService.createInstance(userDataSyncEnablementService_1.UserDataSyncEnablementService)));
        instantiationService.stub(update_1.IUpdateService, { onStateChange: event_1.Event.None, state: update_1.State.Uninitialized });
        instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, disposables.add(new workbenchTestServices_1.TestWorkspaceTrustManagementService()));
    }
    suite('ExtensionsActions', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => setupTest(disposables));
        test('Install action is disabled when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.InstallAction, { installPreReleaseVersion: false }));
            assert.ok(!testObject.enabled);
        });
        test('Test Install action when state is installed', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.InstallAction, { installPreReleaseVersion: false }));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return workbenchService.queryLocal()
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier })));
                return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                    .then((paged) => {
                    testObject.extension = paged.firstPage[0];
                    assert.ok(!testObject.enabled);
                    assert.strictEqual('Install', testObject.label);
                    assert.strictEqual('extension-action label prominent install', testObject.class);
                });
            });
        });
        test('Test InstallingLabelAction when state is installing', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.InstallingLabelAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
                assert.strictEqual('Installing', testObject.label);
                assert.strictEqual('extension-action label install installing', testObject.class);
            });
        });
        test('Test Install action when state is uninstalled', async () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.InstallAction, { installPreReleaseVersion: false }));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            testObject.extension = paged.firstPage[0];
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual('Install', testObject.label);
        });
        test('Test Install action when extension is system action', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.InstallAction, { installPreReleaseVersion: false }));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', {}, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire({ identifier: local.identifier });
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Install action when extension doesnot has gallery', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.InstallAction, { installPreReleaseVersion: false }));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire({ identifier: local.identifier });
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Uninstall action is disabled when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UninstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            assert.ok(!testObject.enabled);
        });
        test('Test Uninstall action when state is uninstalling', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UninstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire({ identifier: local.identifier });
                assert.ok(!testObject.enabled);
                assert.strictEqual('Uninstalling', testObject.label);
                assert.strictEqual('extension-action label uninstall uninstalling', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is user extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UninstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.strictEqual('Uninstall', testObject.label);
                assert.strictEqual('extension-action label uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is system extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UninstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', {}, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
                assert.strictEqual('Uninstall', testObject.label);
                assert.strictEqual('extension-action label uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installing and is user extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UninstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const gallery = aGalleryExtension('a');
                const extension = extensions[0];
                extension.gallery = gallery;
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                testObject.extension = extension;
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Uninstall action after extension is installed', async () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UninstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual('Uninstall', testObject.label);
            assert.strictEqual('extension-action label uninstall', testObject.class);
        });
        test('Test UpdateAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UpdateAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            assert.ok(!testObject.enabled);
        });
        test('Test UpdateAction when extension is uninstalled', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UpdateAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test UpdateAction when extension is installed and not outdated', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UpdateAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: local.manifest.version })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and system extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UpdateAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', { version: '1.0.0' }, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and user extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UpdateAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            return workbenchService.queryLocal()
                .then(async (extensions) => {
                testObject.extension = extensions[0];
                const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' });
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getCompatibleExtension', gallery);
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', [gallery]);
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    disposables.add(testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    }));
                    instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
                });
            });
        });
        test('Test UpdateAction when extension is installing and outdated and user extension', async () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.UpdateAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getCompatibleExtension', gallery);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', [gallery]);
            await new Promise(c => {
                disposables.add(testObject.onDidChange(() => {
                    if (testObject.enabled) {
                        c();
                    }
                }));
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            });
            await new Promise(c => {
                disposables.add(testObject.onDidChange(() => {
                    if (!testObject.enabled) {
                        c();
                    }
                }));
                installEvent.fire({ identifier: local.identifier, source: gallery });
            });
        });
        test('Test ManageExtensionAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            assert.ok(!testObject.enabled);
        });
        test('Test ManageExtensionAction when extension is installed', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('Manage', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalled', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage hide', testObject.class);
                assert.strictEqual('Manage', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is installing', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage hide', testObject.class);
                assert.strictEqual('Manage', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is queried from gallery and installed', async () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
            assert.strictEqual('Manage', testObject.tooltip);
        });
        test('Test ManageExtensionAction when extension is system extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', {}, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('Manage', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalling', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ManageExtensionAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire({ identifier: local.identifier });
                assert.ok(!testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('Manage', testObject.tooltip);
            });
        });
        test('Test EnableForWorkspaceAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction));
            assert.ok(!testObject.enabled);
        });
        test('Test EnableForWorkspaceAction when there extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction));
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally and workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableGloballyAction));
            assert.ok(!testObject.enabled);
        });
        test('Test EnableGloballyAction when the extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableGloballyAction));
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableGloballyAction));
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableGloballyAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled in both', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableGloballyAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
            assert.ok(!testObject.enabled);
        });
        test('Test EnableDropDownAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
                testObject.extension = page.firstPage[0];
                disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.EnableDropDownAction));
                testObject.extension = extensions[0];
                uninstallEvent.fire({ identifier: local.identifier });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableForWorkspaceAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction));
            assert.ok(!testObject.enabled);
        });
        test('Test DisableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction));
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when the extension is disabled workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction));
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(local)],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction));
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
            assert.ok(!testObject.enabled);
        });
        test('Test DisableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(local)],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(local)],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(local)],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a'))],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a'))],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                testObject.extension = page.firstPage[0];
                disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(local)],
                onDidChangeExtensions: event_1.Event.None,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.DisableGloballyAction));
                testObject.extension = extensions[0];
                disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
                uninstallEvent.fire({ identifier: local.identifier });
                assert.ok(!testObject.enabled);
            });
        });
    });
    suite('ExtensionRuntimeStateAction', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => setupTest(disposables));
        test('Test Runtime State when there is no extension', () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension state is installing', async () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension state is uninstalling', async () => {
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire({ identifier: local.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is newly installed', async () => {
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, `Please restart extensions to enable this extension.`);
        });
        test('Test Runtime State when extension is newly installed and ext host restart is not required', async () => {
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => true,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is installed and uninstalled', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            const identifier = gallery.identifier;
            installEvent.fire({ identifier, source: gallery });
            didInstallEvent.fire([{ identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, { identifier }) }]);
            uninstallEvent.fire({ identifier });
            didUninstallEvent.fire({ identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is uninstalled', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.0' }))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire({ identifier: local.identifier });
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, `Please restart extensions to complete the uninstallation of this extension.`);
        });
        test('Test Runtime State when extension is uninstalled and can be removed', async () => {
            const local = aLocalExtension('a');
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(local)],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => true,
                canAddExtension: (extension) => true,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire({ identifier: local.identifier });
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is uninstalled and installed', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.0' }))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire({ identifier: local.identifier });
            didUninstallEvent.fire({ identifier: local.identifier });
            const gallery = aGalleryExtension('a');
            const identifier = gallery.identifier;
            installEvent.fire({ identifier, source: gallery });
            didInstallEvent.fire([{ identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local }]);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is updated while running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.1' }))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => true,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', { version: '1.0.1' });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            return new Promise(c => {
                disposables.add(testObject.onDidChange(() => {
                    if (testObject.enabled && testObject.tooltip === `Please restart extensions to enable the updated extension.`) {
                        c();
                    }
                }));
                const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            });
        });
        test('Test Runtime State when extension is updated when not running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const local = aLocalExtension('a', { version: '1.0.1' });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 3 /* InstallOperation.Update */, local: aLocalExtension('a', gallery, gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is disabled when running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 6 /* EnablementState.DisabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.strictEqual(`Please restart extensions to disable this extension.`, testObject.tooltip);
        });
        test('Test Runtime State when extension enablement is toggled when running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.0' }))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 6 /* EnablementState.DisabledGlobally */);
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is enabled when not running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const local = aLocalExtension('a');
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.strictEqual(`Please restart extensions to enable this extension.`, testObject.tooltip);
        });
        test('Test Runtime State when extension enablement is toggled when not running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const local = aLocalExtension('a');
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            await workbenchService.setEnablement(extensions[0], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is updated when not running and enabled', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const local = aLocalExtension('a', { version: '1.0.1' });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.strictEqual(`Please restart extensions to enable this extension.`, testObject.tooltip);
        });
        test('Test Runtime State when a localization extension is newly installed', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', { ...gallery, ...{ contributes: { localizations: [{ languageId: 'de', translations: [] }] } } }, gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when a localization extension is updated while running', async () => {
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.1' }))],
                onDidChangeExtensions: event_1.Event.None,
                canRemoveExtension: (extension) => false,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const local = aLocalExtension('a', { version: '1.0.1', contributes: { localizations: [{ languageId: 'de', translations: [] }] } });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', { ...gallery, ...{ contributes: { localizations: [{ languageId: 'de', translations: [] }] } } }, gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is not installed but extension from different server is installed and running', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(remoteExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when extension is uninstalled but extension from different server is installed and running', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const uninstallEvent = new event_1.Emitter();
            const onDidUninstallEvent = new event_1.Emitter();
            localExtensionManagementService.onUninstallExtension = uninstallEvent.event;
            localExtensionManagementService.onDidUninstallExtension = onDidUninstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(remoteExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            uninstallEvent.fire({ identifier: localExtension.identifier });
            didUninstallEvent.fire({ identifier: localExtension.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when workspace extension is disabled on local server and installed in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const remoteExtensionManagementService = createExtensionManagementService([]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a') });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            onDidInstallEvent.fire([{ identifier: remoteExtension.identifier, local: remoteExtension, operation: 2 /* InstallOperation.Install */ }]);
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, `Please reload window to enable this extension.`);
        });
        test('Test Runtime State when ui extension is disabled on remote server and installed in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtensionManagementService = createExtensionManagementService([]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            const localExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a') });
            const promise = event_1.Event.toPromise(event_1.Event.filter(testObject.onDidChange, () => testObject.enabled));
            onDidInstallEvent.fire([{ identifier: localExtension.identifier, local: localExtension, operation: 2 /* InstallOperation.Install */ }]);
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, `Please reload window to enable this extension.`);
        });
        test('Test Runtime State for remote ui extension is disabled when it is installed and enabled in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(localExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State for remote workspace+ui extension is enabled when it is installed and enabled in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(localExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test Runtime State for local ui+workspace extension is enabled when it is installed and enabled in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteExtensionManagementService = createExtensionManagementService([remoteExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(remoteExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test Runtime State for local workspace+ui extension is enabled when it is installed in both servers but running in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(localExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test Runtime State for remote ui+workspace extension is enabled when it is installed on both servers but running in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteExtensionManagementService = createExtensionManagementService([remoteExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(remoteExtension)],
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test Runtime State when ui+workspace+web extension is installed in web and remote and running in remote', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const webExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'], 'browser': 'browser.js' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeUserData }) });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'], 'browser': 'browser.js' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, null, createExtensionManagementService([remoteExtension]), createExtensionManagementService([webExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(remoteExtension)],
                onDidChangeExtensions: event_1.Event.None,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test Runtime State when workspace+ui+web extension is installed in web and local and running in local', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const webExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'], 'browser': 'browser.js' }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeUserData }) });
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'], 'browser': 'browser.js' }, { location: uri_1.URI.file('pub.a') });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), null, createExtensionManagementService([webExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            instantiationService.stub(extensions_2.IExtensionService, {
                extensions: [(0, extensions_2.toExtensionDescription)(localExtension)],
                onDidChangeExtensions: event_1.Event.None,
                canAddExtension: (extension) => false,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.ExtensionRuntimeStateAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
    });
    suite('RemoteInstallAction', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => setupTest(disposables));
        test('Test remote install action is enabled for local workspace extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action when installing local workspace extension', async () => {
            // multi server setup
            const remoteExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            remoteExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: localWorkspaceExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
        });
        test('Test remote install action when installing local workspace extension is finished', async () => {
            // multi server setup
            const remoteExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            remoteExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: localWorkspaceExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
            const installedExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            onDidInstallEvent.fire([{ identifier: installedExtension.identifier, local: installedExtension, operation: 2 /* InstallOperation.Install */ }]);
            await promise;
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for disabled local workspace extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([remoteWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is enabled local workspace+ui extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is enabled for local ui+workapace extension if can install is true', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, true));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is disabled for local ui+workapace extension if can install is false', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled when extension is not set', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for extension which is not installed', async () => {
            // multi server setup
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const pager = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = pager.firstPage[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension which is disabled in env', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            const environmentService = { disableExtensions: true };
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            instantiationService.stub(environment_1.INativeEnvironmentService, environmentService);
            instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(environmentService_1.INativeWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled when remote server is not available', async () => {
            // single server setup
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const extensionManagementServerService = instantiationService.get(extensionManagement_2.IExtensionManagementServerService);
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localWorkspaceExtension]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension if it is uninstalled locally', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localWorkspaceExtension]);
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            uninstallEvent.fire({ identifier: localWorkspaceExtension.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension if it is installed in remote', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for local workspace extension if it has not gallery', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace system extension', async () => {
            // multi server setup
            const localWorkspaceSystemExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`), type: 0 /* ExtensionType.System */ });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceSystemExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceSystemExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local ui extension if it is not installed in remote', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local ui extension if it is also installed in remote', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for locally installed language pack extension', async () => {
            // multi server setup
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([languagePackExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is disabled if local language pack extension is uninstalled', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [languagePackExtension]);
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            uninstallEvent.fire({ identifier: languagePackExtension.identifier });
            assert.ok(!testObject.enabled);
        });
    });
    suite('LocalInstallAction', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => setupTest(disposables));
        test('Test local install action is enabled for remote ui extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action is enabled for remote ui+workspace extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action when installing remote ui extension', async () => {
            // multi server setup
            const localExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            localExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: remoteUIExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: remoteUIExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
        });
        test('Test local install action when installing remote ui extension is finished', async () => {
            // multi server setup
            const localExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            localExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: remoteUIExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: remoteUIExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
            const installedExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            onDidInstallEvent.fire([{ identifier: installedExtension.identifier, local: installedExtension, operation: 2 /* InstallOperation.Install */ }]);
            await promise;
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for disabled remote ui extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localUIExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action is disabled when extension is not set', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for extension which is not installed', async () => {
            // multi server setup
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const pager = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = pager.firstPage[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension which is disabled in env', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const environmentService = { disableExtensions: true };
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            instantiationService.stub(environment_1.INativeEnvironmentService, environmentService);
            instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(environmentService_1.INativeWorkbenchEnvironmentService, environmentService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled when local server is not available', async () => {
            // single server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aSingleRemoteExtensionManagementServerService(instantiationService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension if it is installed in local', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remoteUI extension if it is uninstalled locally', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [remoteUIExtension]);
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            uninstallEvent.fire({ identifier: remoteUIExtension.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for remote UI extension if it has gallery', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test local install action is disabled for remote UI system extension', async () => {
            // multi server setup
            const remoteUISystemExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }), type: 0 /* ExtensionType.System */ });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUISystemExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUISystemExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote workspace extension if it is not installed in local', async () => {
            // multi server setup
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote workspace extension if it is also installed in local', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspae'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for remotely installed language pack extension', async () => {
            // multi server setup
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([languagePackExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action is disabled if remote language pack extension is uninstalled', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposables.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [languagePackExtension]);
            const workbenchService = disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsActions.LocalInstallAction));
            disposables.add(instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]));
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            uninstallEvent.fire({ identifier: languagePackExtension.identifier });
            assert.ok(!testObject.enabled);
        });
    });
    function aLocalExtension(name = 'someext', manifest = {}, properties = {}) {
        manifest = { name, publisher: 'pub', version: '1.0.0', ...manifest };
        properties = {
            type: 1 /* ExtensionType.User */,
            location: uri_1.URI.file(`pub.${name}`),
            identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) },
            ...properties
        };
        properties.isBuiltin = properties.type === 0 /* ExtensionType.System */;
        return Object.create({ manifest, ...properties });
    }
    function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = {}) {
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
        const galleryExtension = Object.create({ name, publisher: 'pub', version: '1.0.0', allTargetPlatforms: [targetPlatform], properties: {}, assets: {}, ...properties });
        galleryExtension.properties = { ...galleryExtension.properties, dependencies: [], targetPlatform, ...galleryExtensionProperties };
        galleryExtension.assets = { ...galleryExtension.assets, ...assets };
        galleryExtension.identifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher, galleryExtension.name), uuid: (0, uuid_1.generateUuid)() };
        galleryExtension.hasReleaseVersion = true;
        return galleryExtension;
    }
    function aPage(...objects) {
        return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
    }
    function aSingleRemoteExtensionManagementServerService(instantiationService, remoteExtensionManagementService) {
        const remoteExtensionManagementServer = {
            id: 'vscode-remote',
            label: 'remote',
            extensionManagementService: remoteExtensionManagementService || createExtensionManagementService(),
        };
        return {
            _serviceBrand: undefined,
            localExtensionManagementServer: null,
            remoteExtensionManagementServer,
            webExtensionManagementServer: null,
            getExtensionManagementServer: (extension) => {
                if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                    return remoteExtensionManagementServer;
                }
                return null;
            },
            getExtensionInstallLocation(extension) {
                const server = this.getExtensionManagementServer(extension);
                return server === remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 1 /* ExtensionInstallLocation.Local */;
            }
        };
    }
    function aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, remoteExtensionManagementService, webExtensionManagementService) {
        const localExtensionManagementServer = localExtensionManagementService === null ? null : {
            id: 'vscode-local',
            label: 'local',
            extensionManagementService: localExtensionManagementService || createExtensionManagementService(),
        };
        const remoteExtensionManagementServer = remoteExtensionManagementService === null ? null : {
            id: 'vscode-remote',
            label: 'remote',
            extensionManagementService: remoteExtensionManagementService || createExtensionManagementService(),
        };
        const webExtensionManagementServer = webExtensionManagementService ? {
            id: 'vscode-web',
            label: 'web',
            extensionManagementService: webExtensionManagementService,
        } : null;
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
                if (extension.location.scheme === network_1.Schemas.vscodeUserData) {
                    return webExtensionManagementServer;
                }
                throw new Error('');
            },
            getExtensionInstallLocation(extension) {
                const server = this.getExtensionManagementServer(extension);
                if (server === null) {
                    return null;
                }
                if (server === remoteExtensionManagementServer) {
                    return 2 /* ExtensionInstallLocation.Remote */;
                }
                if (server === webExtensionManagementServer) {
                    return 3 /* ExtensionInstallLocation.Web */;
                }
                return 1 /* ExtensionInstallLocation.Local */;
            }
        };
    }
    function createExtensionManagementService(installed = []) {
        return {
            onInstallExtension: event_1.Event.None,
            onDidInstallExtensions: event_1.Event.None,
            onUninstallExtension: event_1.Event.None,
            onDidUninstallExtension: event_1.Event.None,
            onDidChangeProfile: event_1.Event.None,
            onDidUpdateExtensionMetadata: event_1.Event.None,
            getInstalled: () => Promise.resolve(installed),
            canInstall: async (extension) => { return true; },
            installFromGallery: (extension) => Promise.reject(new Error('not supported')),
            updateMetadata: async (local, metadata) => {
                local.identifier.uuid = metadata.id;
                local.publisherDisplayName = metadata.publisherDisplayName;
                local.publisherId = metadata.publisherId;
                return local;
            },
            async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); },
            async getExtensionsControlManifest() { return { malicious: [], deprecated: {}, search: [] }; },
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0FjdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy90ZXN0L2VsZWN0cm9uLXNhbmRib3gvZXh0ZW5zaW9uc0FjdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTJEaEcsSUFBSSxvQkFBOEMsQ0FBQztJQUNuRCxJQUFJLFlBQTRDLEVBQy9DLGVBQTJELEVBQzNELGNBQWdELEVBQ2hELGlCQUFzRCxDQUFDO0lBRXhELFNBQVMsU0FBUyxDQUFDLFdBQXlDO1FBQzNELFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUF5QixDQUFDLENBQUM7UUFDckUsZUFBZSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQXFDLENBQUMsQ0FBQztRQUNwRixjQUFjLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBMkIsQ0FBQyxDQUFDO1FBQ3pFLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQThCLENBQUMsQ0FBQztRQUUvRSxvQkFBb0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRSw4Q0FBc0IsQ0FBQyxDQUFDO1FBQ3ZFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpREFBNEIsRUFBRSw4Q0FBc0IsQ0FBQyxDQUFDO1FBRWhGLG9CQUFvQixDQUFDLElBQUksQ0FBQyw2QkFBaUIsRUFBRSxxQ0FBb0IsQ0FBQyxDQUFDO1FBQ25FLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBVyxFQUFFLG9CQUFjLENBQUMs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