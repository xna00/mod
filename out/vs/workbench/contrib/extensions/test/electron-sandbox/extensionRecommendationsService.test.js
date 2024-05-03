/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "assert", "vs/base/common/uuid", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/platform/notification/test/common/testNotificationService", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/environment/common/environment", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test", "vs/platform/url/common/url", "vs/editor/common/services/model", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/url/common/urlService", "vs/platform/storage/common/storage", "vs/platform/ipc/electron-sandbox/services", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/workbench/contrib/extensions/browser/extensionRecommendationsService", "vs/workbench/contrib/tags/browser/workspaceTagsService", "vs/workbench/contrib/tags/common/workspaceTags", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/resources", "vs/base/common/buffer", "vs/base/common/platform", "vs/base/common/process", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/update/common/update", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, sinon, assert, uuid, extensionManagement_1, extensionManagement_2, extensionGalleryService_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, workspace_1, workbenchTestServices_1, workbenchTestServices_2, workbenchTestServices_3, testNotificationService_1, configuration_1, uri_1, testWorkspace_1, testConfigurationService_1, extensionManagementUtil_1, environment_1, extensions_1, extensionEnablementService_test_1, url_1, model_1, lifecycle_1, notification_1, urlService_1, storage_1, services_1, fileService_1, log_1, files_1, productService_1, extensionRecommendationsService_1, workspaceTagsService_1, workspaceTags_1, extensionsWorkbenchService_1, extensions_2, workspaceExtensionsConfig_1, extensionRecommendations_1, extensionIgnoredRecommendationsService_1, extensionRecommendations_2, extensionRecommendationNotificationService_1, contextkey_1, mockKeybindingService_1, inMemoryFilesystemProvider_1, resources_1, buffer_1, platform_1, process_1, timeTravelScheduler_1, utils_1, lifecycle_2, async_1, update_1, uriIdentity_1, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    const mockExtensionGallery = [
        aGalleryExtension('MockExtension1', {
            displayName: 'Mock Extension 1',
            version: '1.5',
            publisherId: 'mockPublisher1Id',
            publisher: 'mockPublisher1',
            publisherDisplayName: 'Mock Publisher 1',
            description: 'Mock Description',
            installCount: 1000,
            rating: 4,
            ratingCount: 100
        }, {
            dependencies: ['pub.1'],
        }, {
            manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
            readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
            changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
            download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
            icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
            license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
            repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
            signature: { uri: 'uri:signature', fallbackUri: 'fallback:signature' },
            coreTranslations: []
        }),
        aGalleryExtension('MockExtension2', {
            displayName: 'Mock Extension 2',
            version: '1.5',
            publisherId: 'mockPublisher2Id',
            publisher: 'mockPublisher2',
            publisherDisplayName: 'Mock Publisher 2',
            description: 'Mock Description',
            installCount: 1000,
            rating: 4,
            ratingCount: 100
        }, {
            dependencies: ['pub.1', 'pub.2'],
        }, {
            manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
            readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
            changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
            download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
            icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
            license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
            repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
            signature: { uri: 'uri:signature', fallbackUri: 'fallback:signature' },
            coreTranslations: []
        })
    ];
    const mockExtensionLocal = [
        {
            type: 1 /* ExtensionType.User */,
            identifier: mockExtensionGallery[0].identifier,
            manifest: {
                name: mockExtensionGallery[0].name,
                publisher: mockExtensionGallery[0].publisher,
                version: mockExtensionGallery[0].version
            },
            metadata: null,
            path: 'somepath',
            readmeUrl: 'some readmeUrl',
            changelogUrl: 'some changelogUrl'
        },
        {
            type: 1 /* ExtensionType.User */,
            identifier: mockExtensionGallery[1].identifier,
            manifest: {
                name: mockExtensionGallery[1].name,
                publisher: mockExtensionGallery[1].publisher,
                version: mockExtensionGallery[1].version
            },
            metadata: null,
            path: 'somepath',
            readmeUrl: 'some readmeUrl',
            changelogUrl: 'some changelogUrl'
        }
    ];
    const mockTestData = {
        recommendedExtensions: [
            'mockPublisher1.mockExtension1',
            'MOCKPUBLISHER2.mockextension2',
            'badlyformattedextension',
            'MOCKPUBLISHER2.mockextension2',
            'unknown.extension'
        ],
        validRecommendedExtensions: [
            'mockPublisher1.mockExtension1',
            'MOCKPUBLISHER2.mockextension2'
        ]
    };
    function aPage(...objects) {
        return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
    }
    const noAssets = {
        changelog: null,
        download: null,
        icon: null,
        license: null,
        manifest: null,
        readme: null,
        repository: null,
        signature: null,
        coreTranslations: []
    };
    function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = noAssets) {
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
        const galleryExtension = Object.create({ name, publisher: 'pub', version: '1.0.0', allTargetPlatforms: [targetPlatform], properties: {}, assets: {}, ...properties });
        galleryExtension.properties = { ...galleryExtension.properties, dependencies: [], targetPlatform, ...galleryExtensionProperties };
        galleryExtension.assets = { ...galleryExtension.assets, ...assets };
        galleryExtension.identifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher, galleryExtension.name), uuid: uuid.generateUuid() };
        return galleryExtension;
    }
    suite('ExtensionRecommendationsService Test', () => {
        let disposableStore;
        let workspaceService;
        let instantiationService;
        let testConfigurationService;
        let testObject;
        let prompted;
        let promptedEmitter;
        let onModelAddedEvent;
        teardown(async () => {
            disposableStore.dispose();
            await (0, async_1.timeout)(0); // allow for async disposables to complete
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposableStore = new lifecycle_2.DisposableStore();
            instantiationService = disposableStore.add(new instantiationServiceMock_1.TestInstantiationService());
            promptedEmitter = disposableStore.add(new event_1.Emitter());
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(services_1.ISharedProcessService, workbenchTestServices_3.TestSharedProcessService);
            instantiationService.stub(lifecycle_1.ILifecycleService, disposableStore.add(new workbenchTestServices_1.TestLifecycleService()));
            testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            instantiationService.stub(productService_1.IProductService, workbenchTestServices_2.TestProductService);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            const fileService = new fileService_1.FileService(instantiationService.get(log_1.ILogService));
            instantiationService.stub(files_1.IFileService, disposableStore.add(fileService));
            const fileSystemProvider = disposableStore.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposableStore.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            instantiationService.stub(uriIdentity_1.IUriIdentityService, disposableStore.add(new uriIdentityService_1.UriIdentityService(instantiationService.get(files_1.IFileService))));
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, {
                onInstallExtension: event_1.Event.None,
                onDidInstallExtensions: event_1.Event.None,
                onUninstallExtension: event_1.Event.None,
                onDidUninstallExtension: event_1.Event.None,
                onDidUpdateExtensionMetadata: event_1.Event.None,
                onDidChangeProfile: event_1.Event.None,
                async getInstalled() { return []; },
                async canInstall() { return true; },
                async getExtensionsControlManifest() { return { malicious: [], deprecated: {}, search: [] }; },
                async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); },
                isWorkspaceExtensionsSupported() { return false; },
            });
            instantiationService.stub(extensions_2.IExtensionService, {
                onDidChangeExtensions: event_1.Event.None,
                extensions: [],
                async whenInstalledExtensionsRegistered() { return true; }
            });
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, disposableStore.add(new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService)));
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(url_1.IURLService, urlService_1.NativeURLService);
            instantiationService.stub(workspaceTags_1.IWorkspaceTagsService, new workspaceTagsService_1.NoOpWorkspaceTagsService());
            instantiationService.stub(storage_1.IStorageService, disposableStore.add(new workbenchTestServices_2.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(productService_1.IProductService, {
                extensionRecommendations: {
                    'ms-python.python': {
                        onFileOpen: [
                            {
                                'pathGlob': '{**/*.py}',
                                important: true
                            }
                        ]
                    },
                    'ms-vscode.PowerShell': {
                        onFileOpen: [
                            {
                                'pathGlob': '{**/*.ps,**/*.ps1}',
                                important: true
                            }
                        ]
                    },
                    'ms-dotnettools.csharp': {
                        onFileOpen: [
                            {
                                'pathGlob': '{**/*.cs,**/project.json,**/global.json,**/*.csproj,**/*.sln,**/appsettings.json}',
                            }
                        ]
                    },
                    'msjsdiag.debugger-for-chrome': {
                        onFileOpen: [
                            {
                                'pathGlob': '{**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.es6,**/*.mjs,**/*.cjs,**/.babelrc}',
                            }
                        ]
                    },
                    'lukehoban.Go': {
                        onFileOpen: [
                            {
                                'pathGlob': '**/*.go',
                            }
                        ]
                    }
                },
            });
            instantiationService.stub(update_1.IUpdateService, { onStateChange: event_1.Event.None, state: update_1.State.Uninitialized });
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposableStore.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
            instantiationService.stub(extensionManagement_1.IExtensionTipsService, disposableStore.add(instantiationService.createInstance(workbenchTestServices_3.TestExtensionTipsService)));
            onModelAddedEvent = new event_1.Emitter();
            instantiationService.stub(environment_1.IEnvironmentService, {});
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, 'isEnabled', true);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...mockExtensionGallery));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', mockExtensionGallery);
            prompted = false;
            class TestNotificationService2 extends testNotificationService_1.TestNotificationService {
                prompt(severity, message, choices, options) {
                    prompted = true;
                    promptedEmitter.fire();
                    return super.prompt(severity, message, choices, options);
                }
            }
            instantiationService.stub(notification_1.INotificationService, new TestNotificationService2());
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: false });
            instantiationService.stub(model_1.IModelService, {
                getModels() { return []; },
                onModelAdded: onModelAddedEvent.event
            });
        });
        function setUpFolderWorkspace(folderName, recommendedExtensions, ignoredRecommendations = []) {
            return setUpFolder(folderName, recommendedExtensions, ignoredRecommendations);
        }
        async function setUpFolder(folderName, recommendedExtensions, ignoredRecommendations = []) {
            const fileService = instantiationService.get(files_1.IFileService);
            const folderDir = (0, resources_1.joinPath)(ROOT, folderName);
            const workspaceSettingsDir = (0, resources_1.joinPath)(folderDir, '.vscode');
            await fileService.createFolder(workspaceSettingsDir);
            const configPath = (0, resources_1.joinPath)(workspaceSettingsDir, 'extensions.json');
            await fileService.writeFile(configPath, buffer_1.VSBuffer.fromString(JSON.stringify({
                'recommendations': recommendedExtensions,
                'unwantedRecommendations': ignoredRecommendations,
            }, null, '\t')));
            const myWorkspace = (0, testWorkspace_1.testWorkspace)(folderDir);
            instantiationService.stub(files_1.IFileService, fileService);
            workspaceService = new workbenchTestServices_2.TestContextService(myWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
            instantiationService.stub(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService, disposableStore.add(instantiationService.createInstance(workspaceExtensionsConfig_1.WorkspaceExtensionsConfigService)));
            instantiationService.stub(extensionRecommendations_1.IExtensionIgnoredRecommendationsService, disposableStore.add(instantiationService.createInstance(extensionIgnoredRecommendationsService_1.ExtensionIgnoredRecommendationsService)));
            instantiationService.stub(extensionRecommendations_2.IExtensionRecommendationNotificationService, disposableStore.add(instantiationService.createInstance(extensionRecommendationNotificationService_1.ExtensionRecommendationNotificationService)));
        }
        function testNoPromptForValidRecommendations(recommendations) {
            return setUpFolderWorkspace('myFolder', recommendations).then(() => {
                testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
                return testObject.activationPromise.then(() => {
                    assert.strictEqual(Object.keys(testObject.getAllRecommendationsWithReason()).length, recommendations.length);
                    assert.ok(!prompted);
                });
            });
        }
        function testNoPromptOrRecommendationsForValidRecommendations(recommendations) {
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
                assert.ok(!prompted);
                return testObject.getWorkspaceRecommendations().then(() => {
                    assert.strictEqual(Object.keys(testObject.getAllRecommendationsWithReason()).length, 0);
                    assert.ok(!prompted);
                });
            });
        }
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations when galleryService is absent', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const galleryQuerySpy = sinon.spy();
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, { query: galleryQuerySpy, isEnabled: () => false });
            return testNoPromptOrRecommendationsForValidRecommendations(mockTestData.validRecommendedExtensions)
                .then(() => assert.ok(galleryQuerySpy.notCalled));
        }));
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations during extension development', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            instantiationService.stub(environment_1.IEnvironmentService, { extensionDevelopmentLocationURI: [uri_1.URI.file('/folder/file')], isExtensionDevelopment: true });
            return testNoPromptOrRecommendationsForValidRecommendations(mockTestData.validRecommendedExtensions);
        }));
        test('ExtensionRecommendationsService: No workspace recommendations or prompts when extensions.json has empty array', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            return testNoPromptForValidRecommendations([]);
        }));
        test('ExtensionRecommendationsService: Prompt for valid workspace recommendations', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await setUpFolderWorkspace('myFolder', mockTestData.recommendedExtensions);
            testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
            await event_1.Event.toPromise(promptedEmitter.event);
            const recommendations = Object.keys(testObject.getAllRecommendationsWithReason());
            const expected = [...mockTestData.validRecommendedExtensions, 'unknown.extension'];
            assert.strictEqual(recommendations.length, expected.length);
            expected.forEach(x => {
                assert.strictEqual(recommendations.indexOf(x.toLowerCase()) > -1, true);
            });
        }));
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if they are already installed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', mockExtensionLocal);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        }));
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations with casing mismatch if they are already installed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', mockExtensionLocal);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions.map(x => x.toUpperCase()));
        }));
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: true });
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        }));
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if showRecommendationsOnlyOnDemand is set', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { showRecommendationsOnlyOnDemand: true });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
                return testObject.activationPromise.then(() => {
                    assert.ok(!prompted);
                });
            });
        }));
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set for current workspace', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        }));
        test('ExtensionRecommendationsService: No Recommendations of globally ignored recommendations', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', '["ms-dotnettools.csharp", "ms-python.python", "ms-vscode.vscode-typescript-tslint-plugin"]', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/ignored_recommendations', '["ms-dotnettools.csharp", "mockpublisher2.mockextension2"]', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(!recommendations['ms-dotnettools.csharp']); // stored recommendation that has been globally ignored
                    assert.ok(recommendations['ms-python.python']); // stored recommendation
                    assert.ok(recommendations['mockpublisher1.mockextension1']); // workspace recommendation
                    assert.ok(!recommendations['mockpublisher2.mockextension2']); // workspace recommendation that has been globally ignored
                });
            });
        }));
        test('ExtensionRecommendationsService: No Recommendations of workspace ignored recommendations', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const ignoredRecommendations = ['ms-dotnettools.csharp', 'mockpublisher2.mockextension2']; // ignore a stored recommendation and a workspace recommendation.
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python"]';
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions, ignoredRecommendations).then(() => {
                testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(!recommendations['ms-dotnettools.csharp']); // stored recommendation that has been workspace ignored
                    assert.ok(recommendations['ms-python.python']); // stored recommendation
                    assert.ok(recommendations['mockpublisher1.mockextension1']); // workspace recommendation
                    assert.ok(!recommendations['mockpublisher2.mockextension2']); // workspace recommendation that has been workspace ignored
                });
            });
        }));
        test('ExtensionRecommendationsService: Able to retrieve collection of all ignored recommendations', async () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const workspaceIgnoredRecommendations = ['ms-dotnettools.csharp']; // ignore a stored recommendation and a workspace recommendation.
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python"]';
            const globallyIgnoredRecommendations = '["mockpublisher2.mockextension2"]'; // ignore a workspace recommendation.
            storageService.store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/ignored_recommendations', globallyIgnoredRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions, workspaceIgnoredRecommendations);
            testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
            await testObject.activationPromise;
            const recommendations = testObject.getAllRecommendationsWithReason();
            assert.deepStrictEqual(Object.keys(recommendations), ['ms-python.python', 'mockpublisher1.mockextension1']);
        }));
        test('ExtensionRecommendationsService: Able to dynamically ignore/unignore global recommendations', async () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python"]';
            const globallyIgnoredRecommendations = '["mockpublisher2.mockextension2"]'; // ignore a workspace recommendation.
            storageService.store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/ignored_recommendations', globallyIgnoredRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions);
            const extensionIgnoredRecommendationsService = instantiationService.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
            await testObject.activationPromise;
            let recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python']);
            assert.ok(recommendations['mockpublisher1.mockextension1']);
            assert.ok(!recommendations['mockpublisher2.mockextension2']);
            extensionIgnoredRecommendationsService.toggleGlobalIgnoredRecommendation('mockpublisher1.mockextension1', true);
            recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python']);
            assert.ok(!recommendations['mockpublisher1.mockextension1']);
            assert.ok(!recommendations['mockpublisher2.mockextension2']);
            extensionIgnoredRecommendationsService.toggleGlobalIgnoredRecommendation('mockpublisher1.mockextension1', false);
            recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python']);
            assert.ok(recommendations['mockpublisher1.mockextension1']);
            assert.ok(!recommendations['mockpublisher2.mockextension2']);
        }));
        test('test global extensions are modified and recommendation change event is fired when an extension is ignored', async () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const changeHandlerTarget = sinon.spy();
            const ignoredExtensionId = 'Some.Extension';
            storageService.store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/ignored_recommendations', '["ms-vscode.vscode"]', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', []);
            testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
            const extensionIgnoredRecommendationsService = instantiationService.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            disposableStore.add(extensionIgnoredRecommendationsService.onDidChangeGlobalIgnoredRecommendation(changeHandlerTarget));
            extensionIgnoredRecommendationsService.toggleGlobalIgnoredRecommendation(ignoredExtensionId, true);
            await testObject.activationPromise;
            assert.ok(changeHandlerTarget.calledOnce);
            assert.ok(changeHandlerTarget.getCall(0).calledWithMatch({ extensionId: ignoredExtensionId.toLowerCase(), isRecommended: false }));
        }));
        test('ExtensionRecommendationsService: Get file based recommendations from storage (old format)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python", "ms-vscode.vscode-typescript-tslint-plugin"]';
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', []).then(() => {
                testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getFileBasedRecommendations();
                    assert.strictEqual(recommendations.length, 2);
                    assert.ok(recommendations.some(extensionId => extensionId === 'ms-dotnettools.csharp')); // stored recommendation that exists in product.extensionTips
                    assert.ok(recommendations.some(extensionId => extensionId === 'ms-python.python')); // stored recommendation that exists in product.extensionImportantTips
                    assert.ok(recommendations.every(extensionId => extensionId !== 'ms-vscode.vscode-typescript-tslint-plugin')); // stored recommendation that is no longer in neither product.extensionTips nor product.extensionImportantTips
                });
            });
        }));
        test('ExtensionRecommendationsService: Get file based recommendations from storage (new format)', async () => {
            const milliSecondsInADay = 1000 * 60 * 60 * 24;
            const now = Date.now();
            const tenDaysOld = 10 * milliSecondsInADay;
            const storedRecommendations = `{"ms-dotnettools.csharp": ${now}, "ms-python.python": ${now}, "ms-vscode.vscode-typescript-tslint-plugin": ${now}, "lukehoban.Go": ${tenDaysOld}}`;
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', []);
            testObject = disposableStore.add(instantiationService.createInstance(extensionRecommendationsService_1.ExtensionRecommendationsService));
            await testObject.activationPromise;
            const recommendations = testObject.getFileBasedRecommendations();
            assert.strictEqual(recommendations.length, 2);
            assert.ok(recommendations.some(extensionId => extensionId === 'ms-dotnettools.csharp')); // stored recommendation that exists in product.extensionTips
            assert.ok(recommendations.some(extensionId => extensionId === 'ms-python.python')); // stored recommendation that exists in product.extensionImportantTips
            assert.ok(recommendations.every(extensionId => extensionId !== 'ms-vscode.vscode-typescript-tslint-plugin')); // stored recommendation that is no longer in neither product.extensionTips nor product.extensionImportantTips
            assert.ok(recommendations.every(extensionId => extensionId !== 'lukehoban.Go')); //stored recommendation that is older than a week
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL3Rlc3QvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrRWhHLE1BQU0sSUFBSSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFFaEUsTUFBTSxvQkFBb0IsR0FBd0I7UUFDakQsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUU7WUFDbkMsV0FBVyxFQUFFLGtCQUFrQjtZQUMvQixPQUFPLEVBQUUsS0FBSztZQUNkLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixvQkFBb0IsRUFBRSxrQkFBa0I7WUFDeEMsV0FBVyxFQUFFLGtCQUFrQjtZQUMvQixZQUFZLEVBQUUsSUFBSTtZQUNsQixNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxHQUFHO1NBQ2hCLEVBQUU7WUFDRixZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUM7U0FDdkIsRUFBRTtZQUNGLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFO1lBQ25FLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFO1lBQzdELFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFO1lBQ3JFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFO1lBQ25FLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRTtZQUN2RCxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRTtZQUNoRSxVQUFVLEVBQUUsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFO1lBQ3pFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixFQUFFO1lBQ3RFLGdCQUFnQixFQUFFLEVBQUU7U0FDcEIsQ0FBQztRQUNGLGlCQUFpQixDQUFDLGdCQUFnQixFQUFFO1lBQ25DLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsT0FBTyxFQUFFLEtBQUs7WUFDZCxXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFNBQVMsRUFBRSxnQkFBZ0I7WUFDM0Isb0JBQW9CLEVBQUUsa0JBQWtCO1lBQ3hDLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsWUFBWSxFQUFFLElBQUk7WUFDbEIsTUFBTSxFQUFFLENBQUM7WUFDVCxXQUFXLEVBQUUsR0FBRztTQUNoQixFQUFFO1lBQ0YsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztTQUNoQyxFQUFFO1lBQ0YsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUU7WUFDbkUsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUU7WUFDN0QsU0FBUyxFQUFFLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUU7WUFDckUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUU7WUFDbkUsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFO1lBQ3ZELE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFO1lBQ2hFLFVBQVUsRUFBRSxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUU7WUFDekUsU0FBUyxFQUFFLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUU7WUFDdEUsZ0JBQWdCLEVBQUUsRUFBRTtTQUNwQixDQUFDO0tBQ0YsQ0FBQztJQUVGLE1BQU0sa0JBQWtCLEdBQUc7UUFDMUI7WUFDQyxJQUFJLDRCQUFvQjtZQUN4QixVQUFVLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUM5QyxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQ2xDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM1QyxPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTzthQUN4QztZQUNELFFBQVEsRUFBRSxJQUFJO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixZQUFZLEVBQUUsbUJBQW1CO1NBQ2pDO1FBQ0Q7WUFDQyxJQUFJLDRCQUFvQjtZQUN4QixVQUFVLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUM5QyxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQ2xDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM1QyxPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTzthQUN4QztZQUNELFFBQVEsRUFBRSxJQUFJO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixZQUFZLEVBQUUsbUJBQW1CO1NBQ2pDO0tBQ0QsQ0FBQztJQUVGLE1BQU0sWUFBWSxHQUFHO1FBQ3BCLHFCQUFxQixFQUFFO1lBQ3RCLCtCQUErQjtZQUMvQiwrQkFBK0I7WUFDL0IseUJBQXlCO1lBQ3pCLCtCQUErQjtZQUMvQixtQkFBbUI7U0FDbkI7UUFDRCwwQkFBMEIsRUFBRTtZQUMzQiwrQkFBK0I7WUFDL0IsK0JBQStCO1NBQy9CO0tBQ0QsQ0FBQztJQUVGLFNBQVMsS0FBSyxDQUFJLEdBQUcsT0FBWTtRQUNoQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSyxFQUFFLENBQUM7SUFDdEcsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUE0QjtRQUN6QyxTQUFTLEVBQUUsSUFBSTtRQUNmLFFBQVEsRUFBRSxJQUFLO1FBQ2YsSUFBSSxFQUFFLElBQUs7UUFDWCxPQUFPLEVBQUUsSUFBSTtRQUNiLFFBQVEsRUFBRSxJQUFJO1FBQ2QsTUFBTSxFQUFFLElBQUk7UUFDWixVQUFVLEVBQUUsSUFBSTtRQUNoQixTQUFTLEVBQUUsSUFBSTtRQUNmLGdCQUFnQixFQUFFLEVBQUU7S0FDcEIsQ0FBQztJQUVGLFNBQVMsaUJBQWlCLENBQUMsSUFBWSxFQUFFLGFBQWtCLEVBQUUsRUFBRSw2QkFBa0MsRUFBRSxFQUFFLFNBQWtDLFFBQVE7UUFDOUksTUFBTSxjQUFjLEdBQUcsSUFBQSx1Q0FBaUIsRUFBQyxtQkFBUSxFQUFFLGNBQUksQ0FBQyxDQUFDO1FBQ3pELE1BQU0sZ0JBQWdCLEdBQXNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN6TCxnQkFBZ0IsQ0FBQyxVQUFVLEdBQUcsRUFBRSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLGNBQWMsRUFBRSxHQUFHLDBCQUEwQixFQUFFLENBQUM7UUFDbEksZ0JBQWdCLENBQUMsTUFBTSxHQUFHLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUNwRSxnQkFBZ0IsQ0FBQyxVQUFVLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBQSwrQ0FBcUIsRUFBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO1FBQzFJLE9BQTBCLGdCQUFnQixDQUFDO0lBQzVDLENBQUM7SUFFRCxLQUFLLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1FBQ2xELElBQUksZUFBZ0MsQ0FBQztRQUNyQyxJQUFJLGdCQUEwQyxDQUFDO1FBQy9DLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSx3QkFBa0QsQ0FBQztRQUN2RCxJQUFJLFVBQTJDLENBQUM7UUFDaEQsSUFBSSxRQUFpQixDQUFDO1FBQ3RCLElBQUksZUFBOEIsQ0FBQztRQUNuQyxJQUFJLGlCQUFzQyxDQUFDO1FBRTNDLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNuQixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDBDQUEwQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsZUFBZSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3hDLG9CQUFvQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7WUFDM0UsZUFBZSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELG9CQUFvQixDQUFDLElBQUksQ0FBQyw4Q0FBd0IsRUFBRSxpREFBdUIsQ0FBQyxDQUFDO1lBQzdFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxnQ0FBcUIsRUFBRSxnREFBd0IsQ0FBQyxDQUFDO1lBQzNFLG9CQUFvQixDQUFDLElBQUksQ0FBQyw2QkFBaUIsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksNENBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUYsd0JBQXdCLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQzFELG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQzNFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxnQ0FBZSxFQUFFLDBDQUFrQixDQUFDLENBQUM7WUFDL0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlCQUFXLEVBQUUsb0JBQWMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUkseUJBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsaUJBQVcsQ0FBQyxDQUFDLENBQUM7WUFDM0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9CQUFZLEVBQUUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVEQUEwQixFQUFFLENBQUMsQ0FBQztZQUNqRixlQUFlLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNuRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLEVBQUUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEksb0JBQW9CLENBQUMsSUFBSSxDQUFDLG1DQUFvQixFQUFFLElBQUksaURBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztZQUMzRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMERBQW9DLEVBQUU7Z0JBQy9ELGtCQUFrQixFQUFFLGFBQUssQ0FBQyxJQUFJO2dCQUM5QixzQkFBc0IsRUFBRSxhQUFLLENBQUMsSUFBSTtnQkFDbEMsb0JBQW9CLEVBQUUsYUFBSyxDQUFDLElBQUk7Z0JBQ2hDLHVCQUF1QixFQUFFLGFBQUssQ0FBQyxJQUFJO2dCQUNuQyw0QkFBNEIsRUFBRSxhQUFLLENBQUMsSUFBSTtnQkFDeEMsa0JBQWtCLEVBQUUsYUFBSyxDQUFDLElBQUk7Z0JBQzlCLEtBQUssQ0FBQyxZQUFZLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxLQUFLLENBQUMsVUFBVSxLQUFLLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbkMsS0FBSyxDQUFDLDRCQUE0QixLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUYsS0FBSyxDQUFDLGlCQUFpQixLQUFLLE9BQU8sSUFBQSx1Q0FBaUIsRUFBQyxtQkFBUSxFQUFFLGNBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkUsOEJBQThCLEtBQUssT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ2xELENBQUMsQ0FBQztZQUNILG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBaUIsRUFBRTtnQkFDNUMscUJBQXFCLEVBQUUsYUFBSyxDQUFDLElBQUk7Z0JBQ2pDLFVBQVUsRUFBRSxFQUFFO2dCQUNkLEtBQUssQ0FBQyxpQ0FBaUMsS0FBSyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDMUQsQ0FBQyxDQUFDO1lBQ0gsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDBEQUFvQyxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxnRUFBOEIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsNkJBQWlCLEVBQUUscUNBQW9CLENBQUMsQ0FBQztZQUNuRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQVcsRUFBRSw2QkFBZ0IsQ0FBQyxDQUFDO1lBQ3pELG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxJQUFJLCtDQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMseUJBQWUsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlCQUFXLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQztZQUM3RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZ0NBQWUsRUFBRTtnQkFDMUMsd0JBQXdCLEVBQUU7b0JBQ3pCLGtCQUFrQixFQUFFO3dCQUNuQixVQUFVLEVBQUU7NEJBQ1g7Z0NBQ0MsVUFBVSxFQUFFLFdBQVc7Z0NBQ3ZCLFNBQVMsRUFBRSxJQUFJOzZCQUNmO3lCQUNEO3FCQUNEO29CQUNELHNCQUFzQixFQUFFO3dCQUN2QixVQUFVLEVBQUU7NEJBQ1g7Z0NBQ0MsVUFBVSxFQUFFLG9CQUFvQjtnQ0FDaEMsU0FBUyxFQUFFLElBQUk7NkJBQ2Y7eUJBQ0Q7cUJBQ0Q7b0JBQ0QsdUJBQXVCLEVBQUU7d0JBQ3hCLFVBQVUsRUFBRTs0QkFDWDtnQ0FDQyxVQUFVLEVBQUUsbUZBQW1GOzZCQUMvRjt5QkFDRDtxQkFDRDtvQkFDRCw4QkFBOEIsRUFBRTt3QkFDL0IsVUFBVSxFQUFFOzRCQUNYO2dDQUNDLFVBQVUsRUFBRSw0RUFBNEU7NkJBQ3hGO3lCQUNEO3FCQUNEO29CQUNELGNBQWMsRUFBRTt3QkFDZixVQUFVLEVBQUU7NEJBQ1g7Z0NBQ0MsVUFBVSxFQUFFLFNBQVM7NkJBQ3JCO3lCQUNEO3FCQUNEO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHVCQUFjLEVBQUUsRUFBRSxhQUFhLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsY0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDckcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHdDQUEyQixFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVEQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVJLG9CQUFvQixDQUFDLElBQUksQ0FBQywyQ0FBcUIsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxnREFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVySSxpQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBYyxDQUFDO1lBRTlDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuRCxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsaURBQTJCLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4Q0FBd0IsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkUsb0JBQW9CLENBQUMsV0FBVyxDQUFDLDhDQUF3QixFQUFFLE9BQU8sRUFBRSxLQUFLLENBQW9CLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZILG9CQUFvQixDQUFDLFdBQVcsQ0FBQyw4Q0FBd0IsRUFBRSxlQUFlLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUVsRyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBRWpCLE1BQU0sd0JBQXlCLFNBQVEsaURBQXVCO2dCQUM3QyxNQUFNLENBQUMsUUFBa0IsRUFBRSxPQUFlLEVBQUUsT0FBd0IsRUFBRSxPQUF3QjtvQkFDN0csUUFBUSxHQUFHLElBQUksQ0FBQztvQkFDaEIsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN2QixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzFELENBQUM7YUFDRDtZQUVELG9CQUFvQixDQUFDLElBQUksQ0FBQyxtQ0FBb0IsRUFBRSxJQUFJLHdCQUF3QixFQUFFLENBQUMsQ0FBQztZQUVoRix3QkFBd0IsQ0FBQyxvQkFBb0IsQ0FBQyw2QkFBZ0IsRUFBRSxFQUFFLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDbEcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFCQUFhLEVBQWlCO2dCQUN2RCxTQUFTLEtBQVUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixZQUFZLEVBQUUsaUJBQWlCLENBQUMsS0FBSzthQUNyQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsb0JBQW9CLENBQUMsVUFBa0IsRUFBRSxxQkFBK0IsRUFBRSx5QkFBbUMsRUFBRTtZQUN2SCxPQUFPLFdBQVcsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsS0FBSyxVQUFVLFdBQVcsQ0FBQyxVQUFrQixFQUFFLHFCQUErQixFQUFFLHlCQUFtQyxFQUFFO1lBQ3BILE1BQU0sV0FBVyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7WUFDM0QsTUFBTSxTQUFTLEdBQUcsSUFBQSxvQkFBUSxFQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM3QyxNQUFNLG9CQUFvQixHQUFHLElBQUEsb0JBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDckQsTUFBTSxVQUFVLEdBQUcsSUFBQSxvQkFBUSxFQUFDLG9CQUFvQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDckUsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMxRSxpQkFBaUIsRUFBRSxxQkFBcUI7Z0JBQ3hDLHlCQUF5QixFQUFFLHNCQUFzQjthQUNqRCxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFakIsTUFBTSxXQUFXLEdBQUcsSUFBQSw2QkFBYSxFQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTdDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELGdCQUFnQixHQUFHLElBQUksMENBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdkQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9DQUF3QixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDdEUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDZEQUFpQyxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDREQUFnQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pKLG9CQUFvQixDQUFDLElBQUksQ0FBQyxrRUFBdUMsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrRUFBc0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNySyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsc0VBQTJDLEVBQUUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsdUZBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUssQ0FBQztRQUVELFNBQVMsbUNBQW1DLENBQUMsZUFBeUI7WUFDckUsT0FBTyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbEUsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztnQkFDdkcsT0FBTyxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDN0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELFNBQVMsb0RBQW9ELENBQUMsZUFBeUI7WUFDdEYsT0FBTyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLDBCQUEwQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDMUYsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztnQkFDdkcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUVyQixPQUFPLFVBQVUsQ0FBQywyQkFBMkIsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQyw4R0FBOEcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHdDQUFrQixFQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZMLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOENBQXdCLEVBQUUsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRXhHLE9BQU8sb0RBQW9ELENBQUMsWUFBWSxDQUFDLDBCQUEwQixDQUFDO2lCQUNsRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLDZHQUE2RyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEwsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlDQUFtQixFQUFFLEVBQUUsK0JBQStCLEVBQUUsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM5SSxPQUFPLG9EQUFvRCxDQUFDLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3RHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsK0dBQStHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSx3Q0FBa0IsRUFBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN4TCxPQUFPLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsNkVBQTZFLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSx3Q0FBa0IsRUFBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0SixNQUFNLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUMzRSxVQUFVLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUVBQStCLENBQUMsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sYUFBSyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxZQUFZLENBQUMsMEJBQTBCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsOEdBQThHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSx3Q0FBa0IsRUFBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2TCxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsaURBQTJCLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDbEcsT0FBTyxtQ0FBbUMsQ0FBQyxZQUFZLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLG1JQUFtSSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNU0sb0JBQW9CLENBQUMsV0FBVyxDQUFDLGlEQUEyQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2xHLE9BQU8sbUNBQW1DLENBQUMsWUFBWSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0csQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksQ0FBQyxnSEFBZ0gsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHdDQUFrQixFQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pMLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDLDZCQUFnQixFQUFFLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRyxPQUFPLG1DQUFtQyxDQUFDLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3JGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsMEhBQTBILEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSx3Q0FBa0IsRUFBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNuTSx3QkFBd0IsQ0FBQyxvQkFBb0IsQ0FBQyw2QkFBZ0IsRUFBRSxFQUFFLCtCQUErQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDM0csT0FBTyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLDBCQUEwQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDMUYsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztnQkFDdkcsT0FBTyxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDN0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksQ0FBQyxzSUFBc0ksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHdDQUFrQixFQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9NLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUMsS0FBSyxDQUFDLG9EQUFvRCxFQUFFLElBQUksZ0VBQWdELENBQUM7WUFDM0osT0FBTyxtQ0FBbUMsQ0FBQyxZQUFZLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLHlGQUF5RixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEssb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQyxLQUFLLENBQUMsb0RBQW9ELEVBQUUsSUFBSSxnRUFBZ0QsQ0FBQztZQUMzSixvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSw0RkFBNEYsOERBQThDLENBQUM7WUFDbE8sb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQyxLQUFLLENBQUMsNkNBQTZDLEVBQUUsNERBQTRELDhEQUE4QyxDQUFDO1lBRTFNLE9BQU8sb0JBQW9CLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzFGLFVBQVUsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpRUFBK0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZHLE9BQU8sVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQzdDLE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO29CQUNyRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLHVEQUF1RDtvQkFDN0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsd0JBQXdCO29CQUN4RSxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQywyQkFBMkI7b0JBQ3hGLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLENBQUMsMERBQTBEO2dCQUN6SCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksQ0FBQywwRkFBMEYsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHdDQUFrQixFQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25LLE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUMsaUVBQWlFO1lBQzVKLE1BQU0scUJBQXFCLEdBQUcsK0NBQStDLENBQUM7WUFDOUUsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQyxLQUFLLENBQUMsb0RBQW9ELEVBQUUsSUFBSSxnRUFBZ0QsQ0FBQztZQUMzSixvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxxQkFBcUIsOERBQThDLENBQUM7WUFFM0osT0FBTyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLDBCQUEwQixFQUFFLHNCQUFzQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbEgsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztnQkFDdkcsT0FBTyxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDN0MsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLCtCQUErQixFQUFFLENBQUM7b0JBQ3JFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsd0RBQXdEO29CQUM5RyxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7b0JBQ3hFLE1BQU0sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDLDJCQUEyQjtvQkFDeEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQywyREFBMkQ7Z0JBQzFILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLDZGQUE2RixFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsSUFBQSx3Q0FBa0IsRUFBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUU1SyxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sK0JBQStCLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsaUVBQWlFO1lBQ3BJLE1BQU0scUJBQXFCLEdBQUcsK0NBQStDLENBQUM7WUFDOUUsTUFBTSw4QkFBOEIsR0FBRyxtQ0FBbUMsQ0FBQyxDQUFDLHFDQUFxQztZQUNqSCxjQUFjLENBQUMsS0FBSyxDQUFDLG9EQUFvRCxFQUFFLElBQUksZ0VBQWdELENBQUM7WUFDaEksY0FBYyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxxQkFBcUIsOERBQThDLENBQUM7WUFDaEksY0FBYyxDQUFDLEtBQUssQ0FBQyw2Q0FBNkMsRUFBRSw4QkFBOEIsOERBQThDLENBQUM7WUFFakosTUFBTSxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLDBCQUEwQixFQUFFLCtCQUErQixDQUFDLENBQUM7WUFDakgsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQztZQUVuQyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsK0JBQStCLEVBQUUsQ0FBQztZQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUM7UUFDN0csQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksQ0FBQyw2RkFBNkYsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUssTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUVqRSxNQUFNLHFCQUFxQixHQUFHLCtDQUErQyxDQUFDO1lBQzlFLE1BQU0sOEJBQThCLEdBQUcsbUNBQW1DLENBQUMsQ0FBQyxxQ0FBcUM7WUFDakgsY0FBYyxDQUFDLEtBQUssQ0FBQyxvREFBb0QsRUFBRSxJQUFJLGdFQUFnRCxDQUFDO1lBQ2hJLGNBQWMsQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUscUJBQXFCLDhEQUE4QyxDQUFDO1lBQ2hJLGNBQWMsQ0FBQyxLQUFLLENBQUMsNkNBQTZDLEVBQUUsOEJBQThCLDhEQUE4QyxDQUFDO1lBRWpKLE1BQU0sb0JBQW9CLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sc0NBQXNDLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLGtFQUF1QyxDQUFDLENBQUM7WUFDakgsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQztZQUVuQyxJQUFJLGVBQWUsR0FBRyxVQUFVLENBQUMsK0JBQStCLEVBQUUsQ0FBQztZQUNuRSxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO1lBRTdELHNDQUFzQyxDQUFDLGlDQUFpQyxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWhILGVBQWUsR0FBRyxVQUFVLENBQUMsK0JBQStCLEVBQUUsQ0FBQztZQUMvRCxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7WUFFN0Qsc0NBQXNDLENBQUMsaUNBQWlDLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFakgsZUFBZSxHQUFHLFVBQVUsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksQ0FBQywyR0FBMkcsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUwsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNqRSxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN4QyxNQUFNLGtCQUFrQixHQUFHLGdCQUFnQixDQUFDO1lBRTVDLGNBQWMsQ0FBQyxLQUFLLENBQUMsb0RBQW9ELEVBQUUsSUFBSSxnRUFBZ0QsQ0FBQztZQUNoSSxjQUFjLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxFQUFFLHNCQUFzQiw4REFBOEMsQ0FBQztZQUV6SSxNQUFNLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzQyxVQUFVLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUVBQStCLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sc0NBQXNDLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLGtFQUF1QyxDQUFDLENBQUM7WUFDakgsZUFBZSxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsQ0FBQyxzQ0FBc0MsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDeEgsc0NBQXNDLENBQUMsaUNBQWlDLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkcsTUFBTSxVQUFVLENBQUMsaUJBQWlCLENBQUM7WUFFbkMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsV0FBVyxFQUFFLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLDJGQUEyRixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDcEssTUFBTSxxQkFBcUIsR0FBRyw0RkFBNEYsQ0FBQztZQUMzSCxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxxQkFBcUIsOERBQThDLENBQUM7WUFFM0osT0FBTyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDckQsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztnQkFDdkcsT0FBTyxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDN0MsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLDJCQUEyQixFQUFFLENBQUM7b0JBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDOUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLDZEQUE2RDtvQkFDdEosTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLHNFQUFzRTtvQkFDMUosTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLDJDQUEyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDhHQUE4RztnQkFDN04sQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsMkZBQTJGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUcsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDL0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sVUFBVSxHQUFHLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQztZQUMzQyxNQUFNLHFCQUFxQixHQUFHLDZCQUE2QixHQUFHLHlCQUF5QixHQUFHLGtEQUFrRCxHQUFHLHFCQUFxQixVQUFVLEdBQUcsQ0FBQztZQUNsTCxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxxQkFBcUIsOERBQThDLENBQUM7WUFFM0osTUFBTSxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0MsVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlFQUErQixDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQztZQUVuQyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLDZEQUE2RDtZQUN0SixNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEtBQUssa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsc0VBQXNFO1lBQzFKLE1BQU0sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsS0FBSywyQ0FBMkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyw4R0FBOEc7WUFDNU4sTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpREFBaUQ7UUFDbkksQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9