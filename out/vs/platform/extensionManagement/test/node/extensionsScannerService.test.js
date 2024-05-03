var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, assert, buffer_1, resources_1, uri_1, utils_1, environment_1, extensionsProfileScannerService_1, extensionsScannerService_1, extensionsProfileScannerService_2, files_1, fileService_1, inMemoryFilesystemProvider_1, instantiation_1, instantiationServiceMock_1, log_1, productService_1, telemetryUtils_1, uriIdentity_1, uriIdentityService_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let translations = Object.create(null);
    const ROOT = uri_1.URI.file('/ROOT');
    let ExtensionsScannerService = class ExtensionsScannerService extends extensionsScannerService_1.AbstractExtensionsScannerService {
        constructor(userDataProfilesService, extensionsProfileScannerService, fileService, logService, nativeEnvironmentService, productService, uriIdentityService, instantiationService) {
            super(uri_1.URI.file(nativeEnvironmentService.builtinExtensionsPath), uri_1.URI.file(nativeEnvironmentService.extensionsPath), (0, resources_1.joinPath)(nativeEnvironmentService.userHome, '.vscode-oss-dev', 'extensions', 'control.json'), userDataProfilesService.defaultProfile, userDataProfilesService, extensionsProfileScannerService, fileService, logService, nativeEnvironmentService, productService, uriIdentityService, instantiationService);
        }
        async getTranslations(language) {
            return translations;
        }
    };
    ExtensionsScannerService = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, extensionsProfileScannerService_1.IExtensionsProfileScannerService),
        __param(2, files_1.IFileService),
        __param(3, log_1.ILogService),
        __param(4, environment_1.INativeEnvironmentService),
        __param(5, productService_1.IProductService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, instantiation_1.IInstantiationService)
    ], ExtensionsScannerService);
    suite('NativeExtensionsScanerService Test', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        setup(async () => {
            translations = {};
            instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            instantiationService.stub(log_1.ILogService, logService);
            instantiationService.stub(files_1.IFileService, fileService);
            const systemExtensionsLocation = (0, resources_1.joinPath)(ROOT, 'system');
            const userExtensionsLocation = (0, resources_1.joinPath)(ROOT, 'extensions');
            const environmentService = instantiationService.stub(environment_1.INativeEnvironmentService, {
                userHome: ROOT,
                userRoamingDataHome: ROOT,
                builtinExtensionsPath: systemExtensionsLocation.fsPath,
                extensionsPath: userExtensionsLocation.fsPath,
                cacheHome: (0, resources_1.joinPath)(ROOT, 'cache'),
            });
            instantiationService.stub(productService_1.IProductService, { version: '1.66.0' });
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            const userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            instantiationService.stub(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            instantiationService.stub(extensionsProfileScannerService_1.IExtensionsProfileScannerService, disposables.add(new extensionsProfileScannerService_2.ExtensionsProfileScannerService(environmentService, fileService, userDataProfilesService, uriIdentityService, telemetryUtils_1.NullTelemetryService, logService)));
            await fileService.createFolder(systemExtensionsLocation);
            await fileService.createFolder(userExtensionsLocation);
        });
        test('scan system extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub' });
            const extensionLocation = await aSystemExtension(manifest);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanSystemExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual[0].isBuiltin, true);
            assert.deepStrictEqual(actual[0].type, 0 /* ExtensionType.System */);
            assert.deepStrictEqual(actual[0].isValid, true);
            assert.deepStrictEqual(actual[0].validations, []);
            assert.deepStrictEqual(actual[0].metadata, undefined);
            assert.deepStrictEqual(actual[0].targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            assert.deepStrictEqual(actual[0].manifest, manifest);
        });
        test('scan user extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub', __metadata: { id: 'uuid' } });
            const extensionLocation = await aUserExtension(manifest);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name', uuid: 'uuid' });
            assert.deepStrictEqual(actual[0].location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual[0].isBuiltin, false);
            assert.deepStrictEqual(actual[0].type, 1 /* ExtensionType.User */);
            assert.deepStrictEqual(actual[0].isValid, true);
            assert.deepStrictEqual(actual[0].validations, []);
            assert.deepStrictEqual(actual[0].metadata, { id: 'uuid' });
            assert.deepStrictEqual(actual[0].targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            delete manifest.__metadata;
            assert.deepStrictEqual(actual[0].manifest, manifest);
        });
        test('scan existing extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub' });
            const extensionLocation = await aUserExtension(manifest);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanExistingExtension(extensionLocation, 1 /* ExtensionType.User */, {});
            assert.notEqual(actual, null);
            assert.deepStrictEqual(actual.identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual.location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual.isBuiltin, false);
            assert.deepStrictEqual(actual.type, 1 /* ExtensionType.User */);
            assert.deepStrictEqual(actual.isValid, true);
            assert.deepStrictEqual(actual.validations, []);
            assert.deepStrictEqual(actual.metadata, undefined);
            assert.deepStrictEqual(actual.targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            assert.deepStrictEqual(actual.manifest, manifest);
        });
        test('scan single extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub' });
            const extensionLocation = await aUserExtension(manifest);
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanOneOrMultipleExtensions(extensionLocation, 1 /* ExtensionType.User */, {});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual[0].isBuiltin, false);
            assert.deepStrictEqual(actual[0].type, 1 /* ExtensionType.User */);
            assert.deepStrictEqual(actual[0].isValid, true);
            assert.deepStrictEqual(actual[0].validations, []);
            assert.deepStrictEqual(actual[0].metadata, undefined);
            assert.deepStrictEqual(actual[0].targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            assert.deepStrictEqual(actual[0].manifest, manifest);
        });
        test('scan multiple extensions', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanOneOrMultipleExtensions((0, resources_1.dirname)(extensionLocation), 1 /* ExtensionType.User */, {});
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name2' });
        });
        test('scan user extension with different versions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.2' }));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.2');
        });
        test('scan user extension include all versions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.2' }));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({ includeAllVersions: true });
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.1');
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].manifest.version, '1.0.2');
        });
        test('scan user extension with different versions and higher version is not compatible', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.2', engines: { vscode: '^1.67.0' } }));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.1');
        });
        test('scan exclude invalid extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub', engines: { vscode: '^1.67.0' } }));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
        });
        test('scan exclude uninstalled extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(uri_1.URI.file(instantiationService.get(environment_1.INativeEnvironmentService).extensionsPath), '.obsolete'), buffer_1.VSBuffer.fromString(JSON.stringify({ 'pub.name2-1.0.0': true })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
        });
        test('scan include uninstalled extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(uri_1.URI.file(instantiationService.get(environment_1.INativeEnvironmentService).extensionsPath), '.obsolete'), buffer_1.VSBuffer.fromString(JSON.stringify({ 'pub.name2-1.0.0': true })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({ includeUninstalled: true });
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name2' });
        });
        test('scan include invalid extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub', engines: { vscode: '^1.67.0' } }));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({ includeInvalid: true });
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name2' });
        });
        test('scan system extensions include additional builtin extensions', async () => {
            instantiationService.stub(productService_1.IProductService, {
                version: '1.66.0',
                builtInExtensions: [
                    { name: 'pub.name2', version: '', repo: '', metadata: undefined },
                    { name: 'pub.name', version: '', repo: '', metadata: undefined }
                ]
            });
            await anExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }), (0, resources_1.joinPath)(ROOT, 'additional'));
            const extensionLocation = await anExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }), (0, resources_1.joinPath)(ROOT, 'additional'));
            await aSystemExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(instantiationService.get(environment_1.INativeEnvironmentService).userHome, '.vscode-oss-dev', 'extensions', 'control.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ 'pub.name2': 'disabled', 'pub.name': extensionLocation.fsPath })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanSystemExtensions({ checkControlFile: true });
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.0');
        });
        test('scan extension with default nls replacements', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', displayName: '%displayName%' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ displayName: 'Hello World' })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.displayName, 'Hello World');
        });
        test('scan extension with en nls replacements', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', displayName: '%displayName%' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ displayName: 'Hello World' })));
            const nlsLocation = (0, resources_1.joinPath)(extensionLocation, 'package.en.json');
            await instantiationService.get(files_1.IFileService).writeFile(nlsLocation, buffer_1.VSBuffer.fromString(JSON.stringify({ contents: { package: { displayName: 'Hello World EN' } } })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            translations = { 'pub.name': nlsLocation.fsPath };
            const actual = await testObject.scanUserExtensions({ language: 'en' });
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.displayName, 'Hello World EN');
        });
        test('scan extension falls back to default nls replacements', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', displayName: '%displayName%' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ displayName: 'Hello World' })));
            const nlsLocation = (0, resources_1.joinPath)(extensionLocation, 'package.en.json');
            await instantiationService.get(files_1.IFileService).writeFile(nlsLocation, buffer_1.VSBuffer.fromString(JSON.stringify({ contents: { package: { displayName: 'Hello World EN' } } })));
            const testObject = disposables.add(instantiationService.createInstance(ExtensionsScannerService));
            translations = { 'pub.name2': nlsLocation.fsPath };
            const actual = await testObject.scanUserExtensions({ language: 'en' });
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.displayName, 'Hello World');
        });
        async function aUserExtension(manifest) {
            const environmentService = instantiationService.get(environment_1.INativeEnvironmentService);
            return anExtension(manifest, uri_1.URI.file(environmentService.extensionsPath));
        }
        async function aSystemExtension(manifest) {
            const environmentService = instantiationService.get(environment_1.INativeEnvironmentService);
            return anExtension(manifest, uri_1.URI.file(environmentService.builtinExtensionsPath));
        }
        async function anExtension(manifest, root) {
            const fileService = instantiationService.get(files_1.IFileService);
            const extensionLocation = (0, resources_1.joinPath)(root, `${manifest.publisher}.${manifest.name}-${manifest.version}-${manifest.__metadata?.targetPlatform ?? "undefined" /* TargetPlatform.UNDEFINED */}`);
            await fileService.writeFile((0, resources_1.joinPath)(extensionLocation, 'package.json'), buffer_1.VSBuffer.fromString(JSON.stringify(manifest)));
            return extensionLocation;
        }
        function anExtensionManifest(manifest) {
            return { engines: { vscode: '^1.66.0' }, version: '1.0.0', main: 'main.js', activationEvents: ['*'], ...manifest };
        }
    });
    suite('ExtensionScannerInput', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('compare inputs - location', () => {
            const anInput = (location, mtime) => new extensionsScannerService_1.ExtensionScannerInput(location, mtime, undefined, undefined, false, undefined, 1 /* ExtensionType.User */, true, true, '1.1.1', undefined, undefined, true, undefined, {});
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, undefined), anInput(ROOT, undefined)), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, 100), anInput(ROOT, 100)), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput((0, resources_1.joinPath)(ROOT, 'foo'), undefined), anInput(ROOT, undefined)), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, 100), anInput(ROOT, 200)), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, undefined), anInput(ROOT, 200)), false);
        });
        test('compare inputs - application location', () => {
            const anInput = (location, mtime) => new extensionsScannerService_1.ExtensionScannerInput(ROOT, undefined, location, mtime, false, undefined, 1 /* ExtensionType.User */, true, true, '1.1.1', undefined, undefined, true, undefined, {});
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, undefined), anInput(ROOT, undefined)), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, 100), anInput(ROOT, 100)), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput((0, resources_1.joinPath)(ROOT, 'foo'), undefined), anInput(ROOT, undefined)), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, 100), anInput(ROOT, 200)), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(ROOT, undefined), anInput(ROOT, 200)), false);
        });
        test('compare inputs - profile', () => {
            const anInput = (profile, profileScanOptions) => new extensionsScannerService_1.ExtensionScannerInput(ROOT, undefined, undefined, undefined, profile, profileScanOptions, 1 /* ExtensionType.User */, true, true, '1.1.1', undefined, undefined, true, undefined, {});
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(true, { bailOutWhenFileNotFound: true }), anInput(true, { bailOutWhenFileNotFound: true })), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(false, { bailOutWhenFileNotFound: true }), anInput(false, { bailOutWhenFileNotFound: true })), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(true, { bailOutWhenFileNotFound: false }), anInput(true, { bailOutWhenFileNotFound: false })), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(true, {}), anInput(true, {})), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(true, { bailOutWhenFileNotFound: true }), anInput(true, { bailOutWhenFileNotFound: false })), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(true, {}), anInput(true, { bailOutWhenFileNotFound: true })), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(true, undefined), anInput(true, {})), false);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(false, { bailOutWhenFileNotFound: true }), anInput(true, { bailOutWhenFileNotFound: true })), false);
        });
        test('compare inputs - extension type', () => {
            const anInput = (type) => new extensionsScannerService_1.ExtensionScannerInput(ROOT, undefined, undefined, undefined, false, undefined, type, true, true, '1.1.1', undefined, undefined, true, undefined, {});
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(0 /* ExtensionType.System */), anInput(0 /* ExtensionType.System */)), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(1 /* ExtensionType.User */), anInput(1 /* ExtensionType.User */)), true);
            assert.strictEqual(extensionsScannerService_1.ExtensionScannerInput.equals(anInput(1 /* ExtensionType.User */), anInput(0 /* ExtensionType.System */)), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvdGVzdC9ub2RlL2V4dGVuc2lvbnNTY2FubmVyU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQTBCQSxJQUFJLFlBQVksR0FBaUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyRCxNQUFNLElBQUksR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRS9CLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsMkRBQWdDO1FBRXRFLFlBQzJCLHVCQUFpRCxFQUN6QywrQkFBaUUsRUFDckYsV0FBeUIsRUFDMUIsVUFBdUIsRUFDVCx3QkFBbUQsRUFDN0QsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ3JDLG9CQUEyQztZQUVsRSxLQUFLLENBQ0osU0FBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUN4RCxTQUFHLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxFQUNqRCxJQUFBLG9CQUFRLEVBQUMsd0JBQXdCLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsRUFDNUYsdUJBQXVCLENBQUMsY0FBYyxFQUN0Qyx1QkFBdUIsRUFBRSwrQkFBK0IsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3pLLENBQUM7UUFFUyxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQWdCO1lBQy9DLE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7S0FFRCxDQUFBO0lBeEJLLHdCQUF3QjtRQUczQixXQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFdBQUEsa0VBQWdDLENBQUE7UUFDaEMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSx1Q0FBeUIsQ0FBQTtRQUN6QixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEscUNBQXFCLENBQUE7T0FWbEIsd0JBQXdCLENBd0I3QjtJQUVELEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFFaEQsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzlELElBQUksb0JBQThDLENBQUM7UUFFbkQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDbEIsb0JBQW9CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUN2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFjLEVBQUUsQ0FBQztZQUN4QyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVEQUEwQixFQUFFLENBQUMsQ0FBQztZQUM3RSxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUMvRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNuRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsb0JBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNyRCxNQUFNLHdCQUF3QixHQUFHLElBQUEsb0JBQVEsRUFBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUQsTUFBTSxzQkFBc0IsR0FBRyxJQUFBLG9CQUFRLEVBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzVELE1BQU0sa0JBQWtCLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHVDQUF5QixFQUFFO2dCQUMvRSxRQUFRLEVBQUUsSUFBSTtnQkFDZCxtQkFBbUIsRUFBRSxJQUFJO2dCQUN6QixxQkFBcUIsRUFBRSx3QkFBd0IsQ0FBQyxNQUFNO2dCQUN0RCxjQUFjLEVBQUUsc0JBQXNCLENBQUMsTUFBTTtnQkFDN0MsU0FBUyxFQUFFLElBQUEsb0JBQVEsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDO2FBQ2xDLENBQUMsQ0FBQztZQUNILG9CQUFvQixDQUFDLElBQUksQ0FBQyxnQ0FBZSxFQUFFLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDbEUsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNoRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUNuRSxNQUFNLHVCQUF1QixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5Q0FBdUIsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM5SSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQXdCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUM3RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsa0VBQWdDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlFQUErQixDQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxrQkFBa0IsRUFBRSxxQ0FBb0IsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbE8sTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDekQsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEMsTUFBTSxRQUFRLEdBQWdDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMxRyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0QsTUFBTSxVQUFVLEdBQThCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUU3SCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV6RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksK0JBQXVCLENBQUM7WUFDN0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyw2Q0FBMkIsQ0FBQztZQUMzRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEMsTUFBTSxRQUFRLEdBQXVDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0ksTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6RCxNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXZELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLDZCQUFxQixDQUFDO1lBQzNELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyw2Q0FBMkIsQ0FBQztZQUMzRSxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDM0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFDLE1BQU0sUUFBUSxHQUFnQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDMUcsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6RCxNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQiw4QkFBc0IsRUFBRSxDQUFDLENBQUM7WUFFakcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTyxDQUFDLElBQUksNkJBQXFCLENBQUM7WUFDekQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU8sQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFPLENBQUMsY0FBYyw2Q0FBMkIsQ0FBQztZQUN6RSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEMsTUFBTSxRQUFRLEdBQWdDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMxRyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sVUFBVSxHQUE4QixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFFN0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxVQUFVLENBQUMsMkJBQTJCLENBQUMsaUJBQWlCLDhCQUFzQixFQUFFLENBQUMsQ0FBQztZQUV2RyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksNkJBQXFCLENBQUM7WUFDM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyw2Q0FBMkIsQ0FBQztZQUMzRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0MsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RyxNQUFNLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLDJCQUEyQixDQUFDLElBQUEsbUJBQU8sRUFBQyxpQkFBaUIsQ0FBQyw4QkFBc0IsRUFBRSxDQUFDLENBQUM7WUFFaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlELE1BQU0sY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEcsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRyxNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXZELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNELE1BQU0sY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEcsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRyxNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVqRixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtGQUFrRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25HLE1BQU0sY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEcsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEksTUFBTSxVQUFVLEdBQThCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUU3SCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV2RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRCxNQUFNLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkgsTUFBTSxVQUFVLEdBQThCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUU3SCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV2RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEQsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsdUNBQXlCLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxXQUFXLENBQUMsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOU4sTUFBTSxVQUFVLEdBQThCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUU3SCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV2RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEQsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxjQUFjLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsdUNBQXlCLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxXQUFXLENBQUMsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOU4sTUFBTSxVQUFVLEdBQThCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUU3SCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFakYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xELE1BQU0sY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuSCxNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFN0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhEQUE4RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9FLG9CQUFvQixDQUFDLElBQUksQ0FBQyxnQ0FBZSxFQUFFO2dCQUMxQyxPQUFPLEVBQUUsUUFBUTtnQkFDakIsaUJBQWlCLEVBQUU7b0JBQ2xCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtvQkFDakUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO2lCQUNoRTthQUNELENBQUMsQ0FBQztZQUNILE1BQU0sV0FBVyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFBLG9CQUFRLEVBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDOUcsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBQSxvQkFBUSxFQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3ZJLE1BQU0sZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RyxNQUFNLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUEsb0JBQVEsRUFBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsdUNBQXlCLENBQUMsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4UixNQUFNLFVBQVUsR0FBOEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVqRixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUksTUFBTSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdLLE1BQU0sVUFBVSxHQUE4QixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFFN0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxVQUFVLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUQsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFJLE1BQU0sb0JBQW9CLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBUSxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3SyxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNuRSxNQUFNLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZLLE1BQU0sVUFBVSxHQUE4QixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFFN0gsWUFBWSxHQUFHLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFJLE1BQU0sb0JBQW9CLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBUSxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3SyxNQUFNLFdBQVcsR0FBRyxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNuRSxNQUFNLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZLLE1BQU0sVUFBVSxHQUE4QixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFFN0gsWUFBWSxHQUFHLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNuRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxVQUFVLGNBQWMsQ0FBQyxRQUE0QztZQUN6RSxNQUFNLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx1Q0FBeUIsQ0FBQyxDQUFDO1lBQy9FLE9BQU8sV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxRQUE0QztZQUMzRSxNQUFNLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx1Q0FBeUIsQ0FBQyxDQUFDO1lBQy9FLE9BQU8sV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsS0FBSyxVQUFVLFdBQVcsQ0FBQyxRQUE0QyxFQUFFLElBQVM7WUFDakYsTUFBTSxXQUFXLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztZQUMzRCxNQUFNLGlCQUFpQixHQUFHLElBQUEsb0JBQVEsRUFBQyxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLE9BQU8sSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLGNBQWMsOENBQTRCLEVBQUUsQ0FBQyxDQUFDO1lBQzFLLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEgsT0FBTyxpQkFBaUIsQ0FBQztRQUMxQixDQUFDO1FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxRQUE0QztZQUN4RSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUM7UUFDcEgsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUVuQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLE9BQU8sR0FBRyxDQUFDLFFBQWEsRUFBRSxLQUF5QixFQUFFLEVBQUUsQ0FBQyxJQUFJLGdEQUFxQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyw4QkFBc0IsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJPLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNHLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9GLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFBLG9CQUFRLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3SCxNQUFNLENBQUMsV0FBVyxDQUFDLGdEQUFxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRyxNQUFNLENBQUMsV0FBVyxDQUFDLGdEQUFxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxRQUFhLEVBQUUsS0FBeUIsRUFBRSxFQUFFLENBQUMsSUFBSSxnREFBcUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsOEJBQXNCLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVoTyxNQUFNLENBQUMsV0FBVyxDQUFDLGdEQUFxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzRyxNQUFNLENBQUMsV0FBVyxDQUFDLGdEQUFxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvRixNQUFNLENBQUMsV0FBVyxDQUFDLGdEQUFxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBQSxvQkFBUSxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0gsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnREFBcUIsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnREFBcUIsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxrQkFBNkQsRUFBRSxFQUFFLENBQUMsSUFBSSxnREFBcUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLGtCQUFrQiw4QkFBc0IsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZSLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0osTUFBTSxDQUFDLFdBQVcsQ0FBQyxnREFBcUIsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3SixNQUFNLENBQUMsV0FBVyxDQUFDLGdEQUFxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdKLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdGLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0osTUFBTSxDQUFDLFdBQVcsQ0FBQyxnREFBcUIsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdILE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JHLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUosQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1lBQzVDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBbUIsRUFBRSxFQUFFLENBQUMsSUFBSSxnREFBcUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWxNLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sOEJBQXNCLEVBQUUsT0FBTyw4QkFBc0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JILE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sNEJBQW9CLEVBQUUsT0FBTyw0QkFBb0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pILE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0RBQXFCLENBQUMsTUFBTSxDQUFDLE9BQU8sNEJBQW9CLEVBQUUsT0FBTyw4QkFBc0IsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JILENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==