/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, platform_1, utils_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, log_1, productService_1, workspaceTrust_1, extensionManifestPropertiesService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionManifestPropertiesService - ExtensionKind', () => {
        let disposables;
        let testObject;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            testObject = disposables.add(new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_1.TestProductService, new testConfigurationService_1.TestConfigurationService(), new workbenchTestServices_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService()));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('declarative with extension dependencies', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionDependencies: ['ext1'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative extension pack', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionPack: ['ext1', 'ext2'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative extension pack and extension dependencies', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionPack: ['ext1', 'ext2'], extensionDependencies: ['ext1', 'ext2'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative with unknown contribution point => workspace, web in web and => workspace in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ contributes: { 'unknownPoint': { something: true } } }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative extension pack with unknown contribution point', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionPack: ['ext1', 'ext2'], contributes: { 'unknownPoint': { something: true } } }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('simple declarative => ui, workspace, web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({}), ['ui', 'workspace', 'web']);
        });
        test('only browser => web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js' }), ['web']);
        });
        test('only main => workspace', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js' }), ['workspace']);
        });
        test('main and browser => workspace, web in web and workspace in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', browser: 'main.browser.js' }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('browser entry point with workspace extensionKind => workspace, web in web and workspace in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', browser: 'main.browser.js', extensionKind: ['workspace'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('only browser entry point with out extensionKind => web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js' }), ['web']);
        });
        test('simple descriptive with workspace, ui extensionKind => workspace, ui, web in web and workspace, ui in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionKind: ['workspace', 'ui'] }), platform_1.isWeb ? ['workspace', 'ui', 'web'] : ['workspace', 'ui']);
        });
        test('opt out from web through settings even if it can run in web', () => {
            testObject = disposables.add(new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_1.TestProductService, new testConfigurationService_1.TestConfigurationService({ remote: { extensionKind: { 'pub.a': ['-web'] } } }), new workbenchTestServices_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService()));
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js', publisher: 'pub', name: 'a' }), ['ui', 'workspace']);
        });
        test('opt out from web and include only workspace through settings even if it can run in web', () => {
            testObject = disposables.add(new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_1.TestProductService, new testConfigurationService_1.TestConfigurationService({ remote: { extensionKind: { 'pub.a': ['-web', 'workspace'] } } }), new workbenchTestServices_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService()));
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js', publisher: 'pub', name: 'a' }), ['workspace']);
        });
        test('extension cannot opt out from web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js', extensionKind: ['-web'] }), ['web']);
        });
        test('extension cannot opt into web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', extensionKind: ['web', 'workspace', 'ui'] }), ['workspace', 'ui']);
        });
        test('extension cannot opt into web only', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', extensionKind: ['web'] }), ['workspace']);
        });
    });
    // Workspace Trust is disabled in web at the moment
    if (!platform_1.isWeb) {
        suite('ExtensionManifestPropertiesService - ExtensionUntrustedWorkspaceSupportType', () => {
            let testObject;
            let instantiationService;
            let testConfigurationService;
            setup(async () => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                testConfigurationService = new testConfigurationService_1.TestConfigurationService();
                instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            });
            teardown(() => {
                testObject.dispose();
                instantiationService.dispose();
            });
            function assertUntrustedWorkspaceSupport(extensionManifest, expected) {
                testObject = instantiationService.createInstance(extensionManifestPropertiesService_1.ExtensionManifestPropertiesService);
                const untrustedWorkspaceSupport = testObject.getExtensionUntrustedWorkspaceSupportType(extensionManifest);
                assert.strictEqual(untrustedWorkspaceSupport, expected);
            }
            function getExtensionManifest(properties = {}) {
                return Object.create({ name: 'a', publisher: 'pub', version: '1.0.0', ...properties });
            }
            test('test extension workspace trust request when main entry point is missing', () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest();
                assertUntrustedWorkspaceSupport(extensionManifest, true);
            });
            test('test extension workspace trust request when workspace trust is disabled', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService(false));
                const extensionManifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionManifest, true);
            });
            test('test extension workspace trust request when "true" override exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: true } } });
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionManifest, true);
            });
            test('test extension workspace trust request when override (false) exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: false } } });
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionManifest, false);
            });
            test('test extension workspace trust request when override (true) for the version exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: true, version: '1.0.0' } } });
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionManifest, true);
            });
            test('test extension workspace trust request when override (false) for the version exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: false, version: '1.0.0' } } });
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionManifest, false);
            });
            test('test extension workspace trust request when override for a different version exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: true, version: '2.0.0' } } });
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionManifest, 'limited');
            });
            test('test extension workspace trust request when default (true) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { default: true } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionManifest, true);
            });
            test('test extension workspace trust request when default (false) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { default: false } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionManifest, false);
            });
            test('test extension workspace trust request when override (limited) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { override: 'limited' } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: true } } });
                assertUntrustedWorkspaceSupport(extensionManifest, 'limited');
            });
            test('test extension workspace trust request when override (false) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { override: false } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: true } } });
                assertUntrustedWorkspaceSupport(extensionManifest, false);
            });
            test('test extension workspace trust request when value exists in package.json', () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionManifest, 'limited');
            });
            test('test extension workspace trust request when no value exists in package.json', () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
                const extensionManifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionManifest, false);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuaWZlc3RQcm9wZXJ0aWVzU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy90ZXN0L2NvbW1vbi9leHRlbnNpb25NYW5pZmVzdFByb3BlcnRpZXNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLEtBQUssQ0FBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7UUFFaEUsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksVUFBOEMsQ0FBQztRQUVuRCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLFVBQVUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUVBQWtDLENBQUMsMENBQWtCLEVBQUUsSUFBSSxtREFBd0IsRUFBRSxFQUFFLElBQUksMkRBQW1DLEVBQUUsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7WUFDcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQXFCLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENB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