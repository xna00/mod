/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionDownloader", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/extensionManagement/node/extensionsScannerService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, assert, buffer_1, lifecycle_1, platform_1, process_1, resources_1, types_1, uri_1, uuid_1, mock_1, utils_1, configuration_1, testConfigurationService_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionsProfileScannerService_1, extensionsScannerService_1, extensionDownloader_1, extensionManagementService_1, extensionSignatureVerificationService_1, extensionsProfileScannerService_2, extensionsScannerService_2, files_1, fileService_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, productService_1, telemetry_1, telemetryUtils_1, uriIdentity_1, uriIdentityService_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    class TestExtensionsScanner extends (0, mock_1.mock)() {
        async scanExtensions() { return []; }
    }
    class TestExtensionSignatureVerificationService extends (0, mock_1.mock)() {
        constructor(verificationResult, didExecute) {
            super();
            this.verificationResult = verificationResult;
            this.didExecute = didExecute;
        }
        async verify() {
            if ((0, types_1.isBoolean)(this.verificationResult)) {
                return this.verificationResult;
            }
            const error = Error(this.verificationResult);
            error.code = this.verificationResult;
            error.didExecute = this.didExecute;
            throw error;
        }
    }
    class TestInstallGalleryExtensionTask extends extensionManagementService_1.InstallGalleryExtensionTask {
        constructor(extension, extensionDownloader, disposables) {
            const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            const logService = instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            const fileService = instantiationService.stub(files_1.IFileService, disposables.add(new fileService_1.FileService(logService)));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const systemExtensionsLocation = (0, resources_1.joinPath)(ROOT, 'system');
            const userExtensionsLocation = (0, resources_1.joinPath)(ROOT, 'extensions');
            instantiationService.stub(environment_1.INativeEnvironmentService, {
                userHome: ROOT,
                userRoamingDataHome: ROOT,
                builtinExtensionsPath: systemExtensionsLocation.fsPath,
                extensionsPath: userExtensionsLocation.fsPath,
                userDataPath: userExtensionsLocation.fsPath,
                cacheHome: ROOT,
            });
            instantiationService.stub(productService_1.IProductService, {});
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const uriIdentityService = instantiationService.stub(uriIdentity_1.IUriIdentityService, disposables.add(instantiationService.createInstance(uriIdentityService_1.UriIdentityService)));
            const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(instantiationService.createInstance(userDataProfile_1.UserDataProfilesService)));
            const extensionsProfileScannerService = instantiationService.stub(extensionsProfileScannerService_1.IExtensionsProfileScannerService, disposables.add(instantiationService.createInstance(extensionsProfileScannerService_2.ExtensionsProfileScannerService)));
            const extensionsScannerService = instantiationService.stub(extensionsScannerService_1.IExtensionsScannerService, disposables.add(instantiationService.createInstance(extensionsScannerService_2.ExtensionsScannerService)));
            super({
                name: extension.name,
                publisher: extension.publisher,
                version: extension.version,
                engines: { vscode: '*' },
            }, extension, { profileLocation: userDataProfilesService.defaultProfile.extensionsResource, productVersion: { version: '' } }, extensionDownloader, new TestExtensionsScanner(), uriIdentityService, userDataProfilesService, extensionsScannerService, extensionsProfileScannerService, logService, telemetryUtils_1.NullTelemetryService);
            this.installed = false;
        }
        async doRun(token) {
            const result = await this.install(token);
            return result[0];
        }
        async extractExtension() {
            this.installed = true;
            return new class extends (0, mock_1.mock)() {
            };
        }
        async validateManifest() { }
    }
    suite('InstallGalleryExtensionTask Tests', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('if verification is enabled by default, the task completes', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: true, didExecute: true }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, true);
            assert.strictEqual(testObject.installed, true);
        });
        test('if verification is enabled in stable, the task completes', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: true, didExecute: true, quality: 'stable' }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, true);
            assert.strictEqual(testObject.installed, true);
        });
        test('if verification is disabled by setting set to false, the task skips verification', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: false, verificationResult: 'error', didExecute: false }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, false);
            assert.strictEqual(testObject.installed, true);
        });
        test('if verification is disabled because the module is not loaded, the task skips verification', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: false, didExecute: false }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, false);
            assert.strictEqual(testObject.installed, true);
        });
        test('if verification fails to execute, the task completes', async () => {
            const errorCode = 'ENOENT';
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: errorCode, didExecute: false }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, errorCode);
            assert.strictEqual(testObject.installed, true);
        });
        test('if verification fails', async () => {
            const errorCode = 'IntegrityCheckFailed';
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: errorCode, didExecute: true }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, errorCode);
            assert.strictEqual(testObject.installed, true);
        });
        test('if verification succeeds, the task completes', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: true }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: true, didExecute: true }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, true);
            assert.strictEqual(testObject.installed, true);
        });
        test('task completes for unsigned extension', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: false }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: true, didExecute: false }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, false);
            assert.strictEqual(testObject.installed, true);
        });
        test('task completes for an unsigned extension even when signature verification throws error', async () => {
            const testObject = new TestInstallGalleryExtensionTask(aGalleryExtension('a', { isSigned: false }), anExtensionsDownloader({ isSignatureVerificationEnabled: true, verificationResult: 'error', didExecute: true }), disposables.add(new lifecycle_1.DisposableStore()));
            await testObject.run();
            assert.strictEqual(testObject.verificationStatus, false);
            assert.strictEqual(testObject.installed, true);
        });
        function anExtensionsDownloader(options) {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(productService_1.IProductService, { quality: options.quality ?? 'insiders' });
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(log_1.ILogService, logService);
            instantiationService.stub(environment_1.INativeEnvironmentService, { extensionsDownloadLocation: (0, resources_1.joinPath)(ROOT, 'CachedExtensionVSIXs') });
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, {
                async download(extension, location, operation) {
                    await fileService.writeFile(location, buffer_1.VSBuffer.fromString('extension vsix'));
                },
                async downloadSignatureArchive(extension, location) {
                    await fileService.writeFile(location, buffer_1.VSBuffer.fromString('extension signature'));
                },
            });
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService((0, types_1.isBoolean)(options.isSignatureVerificationEnabled) ? { extensions: { verifySignature: options.isSignatureVerificationEnabled } } : undefined));
            instantiationService.stub(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new TestExtensionSignatureVerificationService(options.verificationResult, !!options.didExecute));
            return disposables.add(instantiationService.createInstance(extensionDownloader_1.ExtensionsDownloader));
        }
        function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = {}) {
            const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
            const galleryExtension = Object.create({ name, publisher: 'pub', version: '1.0.0', allTargetPlatforms: [targetPlatform], properties: {}, assets: {}, ...properties });
            galleryExtension.properties = { ...galleryExtension.properties, dependencies: [], targetPlatform, ...galleryExtensionProperties };
            galleryExtension.assets = { ...galleryExtension.assets, ...assets };
            galleryExtension.identifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher, galleryExtension.name), uuid: (0, uuid_1.generateUuid)() };
            return galleryExtension;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbEdhbGxlcnlFeHRlbnNpb25UYXNrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvdGVzdC9ub2RlL2luc3RhbGxHYWxsZXJ5RXh0ZW5zaW9uVGFzay50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0NoRyxNQUFNLElBQUksR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBRWhFLE1BQU0scUJBQXNCLFNBQVEsSUFBQSxXQUFJLEdBQXFCO1FBQ25ELEtBQUssQ0FBQyxjQUFjLEtBQWlDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUMxRTtJQUVELE1BQU0seUNBQTBDLFNBQVEsSUFBQSxXQUFJLEdBQTBDO1FBRXJHLFlBQ2tCLGtCQUFvQyxFQUNwQyxVQUFtQjtZQUNwQyxLQUFLLEVBQUUsQ0FBQztZQUZTLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBa0I7WUFDcEMsZUFBVSxHQUFWLFVBQVUsQ0FBUztRQUVyQyxDQUFDO1FBRVEsS0FBSyxDQUFDLE1BQU07WUFDcEIsSUFBSSxJQUFBLGlCQUFTLEVBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7WUFDaEMsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM1QyxLQUFhLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztZQUM3QyxLQUFhLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDNUMs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