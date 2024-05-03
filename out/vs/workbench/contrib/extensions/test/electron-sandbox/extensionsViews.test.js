/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/workbench/contrib/extensions/browser/extensionsViews", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/url/common/url", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/url/common/urlService", "vs/base/common/uri", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/electron-sandbox/remoteAgentService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/actions/common/actions", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/common/views", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/process", "vs/platform/product/common/productService", "vs/base/common/cancellation", "vs/base/test/common/utils", "vs/platform/update/common/update", "vs/platform/files/common/files", "vs/platform/files/common/fileService"], function (require, exports, assert, uuid_1, extensionsViews_1, instantiationServiceMock_1, extensions_1, extensionsWorkbenchService_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, extensionManagementUtil_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, event_1, telemetry_1, telemetryUtils_1, extensions_2, workspace_1, workbenchTestServices_1, workbenchTestServices_2, configuration_1, log_1, urlService_1, uri_1, testConfigurationService_1, remoteAgentService_1, remoteAgentService_2, services_1, contextkey_1, mockKeybindingService_1, actions_1, workbenchTestServices_3, views_1, network_1, platform_1, process_1, productService_1, cancellation_1, utils_1, update_1, files_1, fileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsViews Tests', () => {
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let testableView;
        const localEnabledTheme = aLocalExtension('first-enabled-extension', { categories: ['Themes', 'random'] }, { installedTimestamp: 123456 });
        const localEnabledLanguage = aLocalExtension('second-enabled-extension', { categories: ['Programming languages'], version: '1.0.0' }, { installedTimestamp: Date.now(), updated: false });
        const localDisabledTheme = aLocalExtension('first-disabled-extension', { categories: ['themes'] }, { installedTimestamp: 234567 });
        const localDisabledLanguage = aLocalExtension('second-disabled-extension', { categories: ['programming languages'] }, { installedTimestamp: Date.now() - 50000, updated: true });
        const localRandom = aLocalExtension('random-enabled-extension', { categories: ['random'] }, { installedTimestamp: 345678 });
        const builtInTheme = aLocalExtension('my-theme', { categories: ['Themes'], contributes: { themes: ['my-theme'] } }, { type: 0 /* ExtensionType.System */, installedTimestamp: 222 });
        const builtInBasic = aLocalExtension('my-lang', { categories: ['Programming Languages'], contributes: { grammars: [{ language: 'my-language' }] } }, { type: 0 /* ExtensionType.System */, installedTimestamp: 666666 });
        const galleryEnabledLanguage = aGalleryExtension(localEnabledLanguage.manifest.name, { ...localEnabledLanguage.manifest, version: '1.0.1', identifier: localDisabledLanguage.identifier });
        const workspaceRecommendationA = aGalleryExtension('workspace-recommendation-A');
        const workspaceRecommendationB = aGalleryExtension('workspace-recommendation-B');
        const configBasedRecommendationA = aGalleryExtension('configbased-recommendation-A');
        const configBasedRecommendationB = aGalleryExtension('configbased-recommendation-B');
        const fileBasedRecommendationA = aGalleryExtension('filebased-recommendation-A');
        const fileBasedRecommendationB = aGalleryExtension('filebased-recommendation-B');
        const otherRecommendationA = aGalleryExtension('other-recommendation-A');
        setup(async () => {
            instantiationService = disposableStore.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            instantiationService.stub(files_1.IFileService, disposableStore.add(new fileService_1.FileService(new log_1.NullLogService())));
            instantiationService.stub(productService_1.IProductService, {});
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_3.TestContextService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(services_1.ISharedProcessService, workbenchTestServices_2.TestSharedProcessService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, {
                onInstallExtension: event_1.Event.None,
                onDidInstallExtensions: event_1.Event.None,
                onUninstallExtension: event_1.Event.None,
                onDidUninstallExtension: event_1.Event.None,
                onDidUpdateExtensionMetadata: event_1.Event.None,
                onDidChangeProfile: event_1.Event.None,
                async getInstalled() { return []; },
                async getInstalledWorkspaceExtensions() { return []; },
                async canInstall() { return true; },
                async getExtensionsControlManifest() { return { malicious: [], deprecated: {}, search: [] }; },
                async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); },
                async updateMetadata(local) { return local; }
            });
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService_2.RemoteAgentService);
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(actions_1.IMenuService, new workbenchTestServices_1.TestMenuService());
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
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposableStore.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            const reasons = {};
            reasons[workspaceRecommendationA.identifier.id] = { reasonId: 0 /* ExtensionRecommendationReason.Workspace */ };
            reasons[workspaceRecommendationB.identifier.id] = { reasonId: 0 /* ExtensionRecommendationReason.Workspace */ };
            reasons[fileBasedRecommendationA.identifier.id] = { reasonId: 1 /* ExtensionRecommendationReason.File */ };
            reasons[fileBasedRecommendationB.identifier.id] = { reasonId: 1 /* ExtensionRecommendationReason.File */ };
            reasons[otherRecommendationA.identifier.id] = { reasonId: 2 /* ExtensionRecommendationReason.Executable */ };
            reasons[configBasedRecommendationA.identifier.id] = { reasonId: 3 /* ExtensionRecommendationReason.WorkspaceConfig */ };
            instantiationService.stub(extensionRecommendations_1.IExtensionRecommendationsService, {
                getWorkspaceRecommendations() {
                    return Promise.resolve([
                        workspaceRecommendationA.identifier.id,
                        workspaceRecommendationB.identifier.id
                    ]);
                },
                getConfigBasedRecommendations() {
                    return Promise.resolve({
                        important: [configBasedRecommendationA.identifier.id],
                        others: [configBasedRecommendationB.identifier.id],
                    });
                },
                getImportantRecommendations() {
                    return Promise.resolve([]);
                },
                getFileBasedRecommendations() {
                    return [
                        fileBasedRecommendationA.identifier.id,
                        fileBasedRecommendationB.identifier.id
                    ];
                },
                getOtherRecommendations() {
                    return Promise.resolve([
                        configBasedRecommendationB.identifier.id,
                        otherRecommendationA.identifier.id
                    ]);
                },
                getAllRecommendationsWithReason() {
                    return reasons;
                }
            });
            instantiationService.stub(url_1.IURLService, urlService_1.NativeURLService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localEnabledTheme, localEnabledLanguage, localRandom, localDisabledTheme, localDisabledLanguage, builtInTheme, builtInBasic]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getExtensgetExtensionsControlManifestionsReport', {});
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, 'isEnabled', true);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(galleryEnabledLanguage));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getCompatibleExtension', galleryEnabledLanguage);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', [galleryEnabledLanguage]);
            instantiationService.stub(views_1.IViewDescriptorService, {
                getViewLocationById() {
                    return 0 /* ViewContainerLocation.Sidebar */;
                },
                onDidChangeLocation: event_1.Event.None
            });
            instantiationService.stub(extensions_2.IExtensionService, {
                onDidChangeExtensions: event_1.Event.None,
                extensions: [
                    (0, extensions_2.toExtensionDescription)(localEnabledTheme),
                    (0, extensions_2.toExtensionDescription)(localEnabledLanguage),
                    (0, extensions_2.toExtensionDescription)(localRandom),
                    (0, extensions_2.toExtensionDescription)(builtInTheme),
                    (0, extensions_2.toExtensionDescription)(builtInBasic)
                ],
                canAddExtension: (extension) => true,
                whenInstalledExtensionsRegistered: () => Promise.resolve(true)
            });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localDisabledTheme], 6 /* EnablementState.DisabledGlobally */);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localDisabledLanguage], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stub(update_1.IUpdateService, { onStateChange: event_1.Event.None, state: update_1.State.Uninitialized });
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposableStore.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
            testableView = disposableStore.add(instantiationService.createInstance(extensionsViews_1.ExtensionsListView, {}, { id: '', title: '' }));
        });
        test('Test query types', () => {
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isBuiltInExtensionsQuery('@builtin'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@installed'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@enabled'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@disabled'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@outdated'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@updates'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@sort:name'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@sort:updateDate'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@installed searchText'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@enabled searchText'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@disabled searchText'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@outdated searchText'), true);
            assert.strictEqual(extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery('@updates searchText'), true);
        });
        test('Test empty query equates to sort by install count', () => {
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            return testableView.show('').then(() => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.strictEqual(options.sortBy, 4 /* SortBy.InstallCount */);
            });
        });
        test('Test non empty query without sort doesnt use sortBy', () => {
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            return testableView.show('some extension').then(() => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.strictEqual(options.sortBy, undefined);
            });
        });
        test('Test query with sort uses sortBy', () => {
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
            return testableView.show('some extension @sort:rating').then(() => {
                assert.ok(target.calledOnce);
                const options = target.args[0][0];
                assert.strictEqual(options.sortBy, 12 /* SortBy.WeightedRating */);
            });
        });
        test('Test default view actions required sorting', async () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const extension = (await workbenchService.queryLocal()).find(ex => ex.identifier === localEnabledLanguage.identifier);
            await new Promise(c => {
                const disposable = workbenchService.onChange(() => {
                    if (extension?.outdated) {
                        disposable.dispose();
                        c();
                    }
                });
                instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            });
            const result = await testableView.show('@installed');
            assert.strictEqual(result.length, 5, 'Unexpected number of results for @installed query');
            const actual = [result.get(0).name, result.get(1).name, result.get(2).name, result.get(3).name, result.get(4).name];
            const expected = [localEnabledLanguage.manifest.name, localEnabledTheme.manifest.name, localRandom.manifest.name, localDisabledTheme.manifest.name, localDisabledLanguage.manifest.name];
            for (let i = 0; i < result.length; i++) {
                assert.strictEqual(actual[i], expected[i], 'Unexpected extension for @installed query with outadted extension.');
            }
        });
        test('Test installed query results', async () => {
            await testableView.show('@installed').then(result => {
                assert.strictEqual(result.length, 5, 'Unexpected number of results for @installed query');
                const actual = [result.get(0).name, result.get(1).name, result.get(2).name, result.get(3).name, result.get(4).name].sort();
                const expected = [localDisabledTheme.manifest.name, localEnabledTheme.manifest.name, localRandom.manifest.name, localDisabledLanguage.manifest.name, localEnabledLanguage.manifest.name];
                for (let i = 0; i < result.length; i++) {
                    assert.strictEqual(actual[i], expected[i], 'Unexpected extension for @installed query.');
                }
            });
            await testableView.show('@installed first').then(result => {
                assert.strictEqual(result.length, 2, 'Unexpected number of results for @installed query');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with search text.');
                assert.strictEqual(result.get(1).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with search text.');
            });
            await testableView.show('@disabled').then(result => {
                assert.strictEqual(result.length, 2, 'Unexpected number of results for @disabled query');
                assert.strictEqual(result.get(0).name, localDisabledTheme.manifest.name, 'Unexpected extension for @disabled query.');
                assert.strictEqual(result.get(1).name, localDisabledLanguage.manifest.name, 'Unexpected extension for @disabled query.');
            });
            await testableView.show('@enabled').then(result => {
                assert.strictEqual(result.length, 3, 'Unexpected number of results for @enabled query');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @enabled query.');
                assert.strictEqual(result.get(1).name, localRandom.manifest.name, 'Unexpected extension for @enabled query.');
                assert.strictEqual(result.get(2).name, localEnabledLanguage.manifest.name, 'Unexpected extension for @enabled query.');
            });
            await testableView.show('@builtin category:themes').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @builtin category:themes query');
                assert.strictEqual(result.get(0).name, builtInTheme.manifest.name, 'Unexpected extension for @builtin:themes query.');
            });
            await testableView.show('@builtin category:"programming languages"').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @builtin:basics query');
                assert.strictEqual(result.get(0).name, builtInBasic.manifest.name, 'Unexpected extension for @builtin:basics query.');
            });
            await testableView.show('@builtin').then(result => {
                assert.strictEqual(result.length, 2, 'Unexpected number of results for @builtin query');
                assert.strictEqual(result.get(0).name, builtInBasic.manifest.name, 'Unexpected extension for @builtin query.');
                assert.strictEqual(result.get(1).name, builtInTheme.manifest.name, 'Unexpected extension for @builtin query.');
            });
            await testableView.show('@builtin my-theme').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @builtin query');
                assert.strictEqual(result.get(0).name, builtInTheme.manifest.name, 'Unexpected extension for @builtin query.');
            });
        });
        test('Test installed query with category', async () => {
            await testableView.show('@installed category:themes').then(result => {
                assert.strictEqual(result.length, 2, 'Unexpected number of results for @installed query with category');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with category.');
                assert.strictEqual(result.get(1).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with category.');
            });
            await testableView.show('@installed category:"themes"').then(result => {
                assert.strictEqual(result.length, 2, 'Unexpected number of results for @installed query with quoted category');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with quoted category.');
                assert.strictEqual(result.get(1).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with quoted category.');
            });
            await testableView.show('@installed category:"programming languages"').then(result => {
                assert.strictEqual(result.length, 2, 'Unexpected number of results for @installed query with quoted category including space');
                assert.strictEqual(result.get(0).name, localEnabledLanguage.manifest.name, 'Unexpected extension for @installed query with quoted category including space.');
                assert.strictEqual(result.get(1).name, localDisabledLanguage.manifest.name, 'Unexpected extension for @installed query with quoted category inlcuding space.');
            });
            await testableView.show('@installed category:themes category:random').then(result => {
                assert.strictEqual(result.length, 3, 'Unexpected number of results for @installed query with multiple category');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @installed query with multiple category.');
                assert.strictEqual(result.get(1).name, localRandom.manifest.name, 'Unexpected extension for @installed query with multiple category.');
                assert.strictEqual(result.get(2).name, localDisabledTheme.manifest.name, 'Unexpected extension for @installed query with multiple category.');
            });
            await testableView.show('@enabled category:themes').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @enabled query with category');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @enabled query with category.');
            });
            await testableView.show('@enabled category:"themes"').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @enabled query with quoted category');
                assert.strictEqual(result.get(0).name, localEnabledTheme.manifest.name, 'Unexpected extension for @enabled query with quoted category.');
            });
            await testableView.show('@enabled category:"programming languages"').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @enabled query with quoted category inlcuding space');
                assert.strictEqual(result.get(0).name, localEnabledLanguage.manifest.name, 'Unexpected extension for @enabled query with quoted category including space.');
            });
            await testableView.show('@disabled category:themes').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @disabled query with category');
                assert.strictEqual(result.get(0).name, localDisabledTheme.manifest.name, 'Unexpected extension for @disabled query with category.');
            });
            await testableView.show('@disabled category:"themes"').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @disabled query with quoted category');
                assert.strictEqual(result.get(0).name, localDisabledTheme.manifest.name, 'Unexpected extension for @disabled query with quoted category.');
            });
            await testableView.show('@disabled category:"programming languages"').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @disabled query with quoted category inlcuding space');
                assert.strictEqual(result.get(0).name, localDisabledLanguage.manifest.name, 'Unexpected extension for @disabled query with quoted category including space.');
            });
        });
        test('Test local query with sorting order', async () => {
            await testableView.show('@recentlyUpdated').then(result => {
                assert.strictEqual(result.length, 1, 'Unexpected number of results for @recentlyUpdated');
                assert.strictEqual(result.get(0).name, localDisabledLanguage.manifest.name, 'Unexpected default sort order of extensions for @recentlyUpdate query');
            });
            await testableView.show('@installed @sort:updateDate').then(result => {
                assert.strictEqual(result.length, 5, 'Unexpected number of results for @sort:updateDate. Expected all localy installed Extension which are not builtin');
                const actual = [result.get(0).local?.installedTimestamp, result.get(1).local?.installedTimestamp, result.get(2).local?.installedTimestamp, result.get(3).local?.installedTimestamp, result.get(4).local?.installedTimestamp];
                const expected = [localEnabledLanguage.installedTimestamp, localDisabledLanguage.installedTimestamp, localRandom.installedTimestamp, localDisabledTheme.installedTimestamp, localEnabledTheme.installedTimestamp];
                for (let i = 0; i < result.length; i++) {
                    assert.strictEqual(actual[i], expected[i], 'Unexpected extension sorting for @sort:updateDate query.');
                }
            });
        });
        test('Test @recommended:workspace query', () => {
            const workspaceRecommendedExtensions = [
                workspaceRecommendationA,
                workspaceRecommendationB,
                configBasedRecommendationA,
            ];
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', workspaceRecommendedExtensions);
            return testableView.show('@recommended:workspace').then(result => {
                const extensionInfos = target.args[0][0];
                assert.strictEqual(extensionInfos.length, workspaceRecommendedExtensions.length);
                assert.strictEqual(result.length, workspaceRecommendedExtensions.length);
                for (let i = 0; i < workspaceRecommendedExtensions.length; i++) {
                    assert.strictEqual(extensionInfos[i].id, workspaceRecommendedExtensions[i].identifier.id);
                    assert.strictEqual(result.get(i).identifier.id, workspaceRecommendedExtensions[i].identifier.id);
                }
            });
        });
        test('Test @recommended query', () => {
            const allRecommendedExtensions = [
                fileBasedRecommendationA,
                fileBasedRecommendationB,
                configBasedRecommendationB,
                otherRecommendationA
            ];
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', allRecommendedExtensions);
            return testableView.show('@recommended').then(result => {
                const extensionInfos = target.args[0][0];
                assert.strictEqual(extensionInfos.length, allRecommendedExtensions.length);
                assert.strictEqual(result.length, allRecommendedExtensions.length);
                for (let i = 0; i < allRecommendedExtensions.length; i++) {
                    assert.strictEqual(extensionInfos[i].id, allRecommendedExtensions[i].identifier.id);
                    assert.strictEqual(result.get(i).identifier.id, allRecommendedExtensions[i].identifier.id);
                }
            });
        });
        test('Test @recommended:all query', () => {
            const allRecommendedExtensions = [
                workspaceRecommendationA,
                workspaceRecommendationB,
                configBasedRecommendationA,
                fileBasedRecommendationA,
                fileBasedRecommendationB,
                configBasedRecommendationB,
                otherRecommendationA,
            ];
            const target = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', allRecommendedExtensions);
            return testableView.show('@recommended:all').then(result => {
                const extensionInfos = target.args[0][0];
                assert.strictEqual(extensionInfos.length, allRecommendedExtensions.length);
                assert.strictEqual(result.length, allRecommendedExtensions.length);
                for (let i = 0; i < allRecommendedExtensions.length; i++) {
                    assert.strictEqual(extensionInfos[i].id, allRecommendedExtensions[i].identifier.id);
                    assert.strictEqual(result.get(i).identifier.id, allRecommendedExtensions[i].identifier.id);
                }
            });
        });
        test('Test search', () => {
            const searchText = 'search-me';
            const results = [
                fileBasedRecommendationA,
                workspaceRecommendationA,
                otherRecommendationA,
                workspaceRecommendationB
            ];
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...results));
            return testableView.show('search-me').then(result => {
                const options = queryTarget.args[0][0];
                assert.ok(queryTarget.calledOnce);
                assert.strictEqual(options.text, searchText);
                assert.strictEqual(result.length, results.length);
                for (let i = 0; i < results.length; i++) {
                    assert.strictEqual(result.get(i).identifier.id, results[i].identifier.id);
                }
            });
        });
        test('Test preferred search experiment', () => {
            const searchText = 'search-me';
            const actual = [
                fileBasedRecommendationA,
                workspaceRecommendationA,
                otherRecommendationA,
                workspaceRecommendationB
            ];
            const expected = [
                workspaceRecommendationA,
                workspaceRecommendationB,
                fileBasedRecommendationA,
                otherRecommendationA
            ];
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...actual));
            const experimentTarget = instantiationService.stubPromise(extensionManagement_2.IWorkbenchExtensionManagementService, 'getExtensionsControlManifest', {
                malicious: [], deprecated: {},
                search: [{
                        query: 'search-me',
                        preferredResults: [
                            workspaceRecommendationA.identifier.id,
                            'something-that-wasnt-in-first-page',
                            workspaceRecommendationB.identifier.id
                        ]
                    }]
            });
            testableView.dispose();
            testableView = disposableStore.add(instantiationService.createInstance(extensionsViews_1.ExtensionsListView, {}, { id: '', title: '' }));
            return testableView.show('search-me').then(result => {
                const options = queryTarget.args[0][0];
                assert.ok(experimentTarget.calledTwice);
                assert.ok(queryTarget.calledOnce);
                assert.strictEqual(options.text, searchText);
                assert.strictEqual(result.length, expected.length);
                for (let i = 0; i < expected.length; i++) {
                    assert.strictEqual(result.get(i).identifier.id, expected[i].identifier.id);
                }
            });
        });
        test('Skip preferred search experiment when user defines sort order', () => {
            const searchText = 'search-me';
            const realResults = [
                fileBasedRecommendationA,
                workspaceRecommendationA,
                otherRecommendationA,
                workspaceRecommendationB
            ];
            const queryTarget = instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...realResults));
            testableView.dispose();
            disposableStore.add(testableView = instantiationService.createInstance(extensionsViews_1.ExtensionsListView, {}, { id: '', title: '' }));
            return testableView.show('search-me @sort:installs').then(result => {
                const options = queryTarget.args[0][0];
                assert.ok(queryTarget.calledOnce);
                assert.strictEqual(options.text, searchText);
                assert.strictEqual(result.length, realResults.length);
                for (let i = 0; i < realResults.length; i++) {
                    assert.strictEqual(result.get(i).identifier.id, realResults[i].identifier.id);
                }
            });
        });
        function aLocalExtension(name = 'someext', manifest = {}, properties = {}) {
            manifest = { name, publisher: 'pub', version: '1.0.0', ...manifest };
            properties = {
                type: 1 /* ExtensionType.User */,
                location: uri_1.URI.file(`pub.${name}`),
                identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) },
                metadata: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), publisherId: manifest.publisher, publisherDisplayName: 'somename' },
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
            return galleryExtension;
        }
        function aPage(...objects) {
            return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1ZpZXdzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvdGVzdC9lbGVjdHJvbi1zYW5kYm94L2V4dGVuc2lvbnNWaWV3cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbURoRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLE1BQU0sZUFBZSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVsRSxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksWUFBZ0MsQ0FBQztRQUVyQyxNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUMzSSxNQUFNLG9CQUFvQixHQUFHLGVBQWUsQ0FBQywwQkFBMEIsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFMLE1BQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDLDBCQUEwQixFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbkksTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsRUFB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