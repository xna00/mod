/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, assert, sinon, buffer_1, resources_1, uri_1, utils_1, environment_1, extensionsProfileScannerService_1, fileService_1, files_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, telemetry_1, telemetryUtils_1, uriIdentity_1, uriIdentityService_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestObject extends extensionsProfileScannerService_1.AbstractExtensionsProfileScannerService {
    }
    suite('ExtensionsProfileScannerService', () => {
        const ROOT = uri_1.URI.file('/ROOT');
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const extensionsLocation = (0, resources_1.joinPath)(ROOT, 'extensions');
        let instantiationService;
        setup(async () => {
            instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            instantiationService.stub(log_1.ILogService, logService);
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const uriIdentityService = instantiationService.stub(uriIdentity_1.IUriIdentityService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)));
            const environmentService = instantiationService.stub(environment_1.IEnvironmentService, { userRoamingDataHome: ROOT, cacheHome: (0, resources_1.joinPath)(ROOT, 'cache'), });
            const userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            instantiationService.stub(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
        });
        suiteTeardown(() => sinon.restore());
        test('write extensions located in the same extensions folder', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
        });
        test('write extensions located in the different folder', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
        });
        test('write extensions located in the same extensions folder has relative location ', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(actual, [{ identifier: extension.identifier, location: extension.location.toJSON(), relativeLocation: 'pub.a-1.0.0', version: extension.manifest.version }]);
        });
        test('write extensions located in different extensions folder does not has relative location ', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(actual, [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version }]);
        });
        test('extension in old format is read and migrated', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
            const manifestContent = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(manifestContent, [{ identifier: extension.identifier, location: extension.location.toJSON(), relativeLocation: 'pub.a-1.0.0', version: extension.manifest.version }]);
        });
        test('extension in old format is not migrated if not exists in same location', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
            const manifestContent = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(manifestContent, [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version }]);
        });
        test('extension in old format is read and migrated during write', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extension2 = aExtension('pub.b', (0, resources_1.joinPath)(extensionsLocation, 'pub.b-1.0.0'));
            await testObject.addExtensionsToProfile([[extension2, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [
                { identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined },
                { identifier: extension2.identifier, location: extension2.location.toJSON(), version: extension2.manifest.version, metadata: undefined }
            ]);
            const manifestContent = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(manifestContent, [
                { identifier: extension.identifier, location: extension.location.toJSON(), relativeLocation: 'pub.a-1.0.0', version: extension.manifest.version },
                { identifier: extension2.identifier, location: extension2.location.toJSON(), relativeLocation: 'pub.b-1.0.0', version: extension2.manifest.version }
            ]);
        });
        test('extensions in old format and new format is read and migrated', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            const extension2 = aExtension('pub.b', (0, resources_1.joinPath)(extensionsLocation, 'pub.b-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                }, {
                    identifier: extension2.identifier,
                    location: extension2.location.toJSON(),
                    relativeLocation: 'pub.b-1.0.0',
                    version: extension2.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [
                { identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined },
                { identifier: extension2.identifier, location: extension2.location.toJSON(), version: extension2.manifest.version, metadata: undefined }
            ]);
            const manifestContent = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(manifestContent, [
                { identifier: extension.identifier, location: extension.location.toJSON(), relativeLocation: 'pub.a-1.0.0', version: extension.manifest.version },
                { identifier: extension2.identifier, location: extension2.location.toJSON(), relativeLocation: 'pub.b-1.0.0', version: extension2.manifest.version }
            ]);
        });
        test('throws error if extension has invalid relativePath', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                    relativePath: 2
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            try {
                await testObject.scanProfileExtensions(extensionsManifest);
                assert.fail('Should throw error');
            }
            catch (error) { /*expected*/ }
        });
        test('throws error if extension has no location', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    version: extension.manifest.version,
                    relativePath: 'pub.a-1.0.0'
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            try {
                await testObject.scanProfileExtensions(extensionsManifest);
                assert.fail('Should throw error');
            }
            catch (error) { /*expected*/ }
        });
        test('throws error if extension location is invalid', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: {},
                    version: extension.manifest.version,
                    relativePath: 'pub.a-1.0.0'
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            try {
                await testObject.scanProfileExtensions(extensionsManifest);
                assert.fail('Should throw error');
            }
            catch (error) { /*expected*/ }
        });
        test('throws error if extension has no identifier', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            try {
                await testObject.scanProfileExtensions(extensionsManifest);
                assert.fail('Should throw error');
            }
            catch (error) { /*expected*/ }
        });
        test('throws error if extension identifier is invalid', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: 'pub.a',
                    location: extension.location.toJSON(),
                    version: extension.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            try {
                await testObject.scanProfileExtensions(extensionsManifest);
                assert.fail('Should throw error');
            }
            catch (error) { /*expected*/ }
        });
        test('throws error if extension has no version', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            try {
                await testObject.scanProfileExtensions(extensionsManifest);
                assert.fail('Should throw error');
            }
            catch (error) { /*expected*/ }
        });
        test('read extension when manifest is empty', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(''));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual, []);
        });
        test('read extension when manifest has empty lines and spaces', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(`


		`));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual, []);
        });
        test('read extension when the relative location is empty', async () => {
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(extensionsLocation, 'pub.a-1.0.0'));
            await instantiationService.get(files_1.IFileService).writeFile(extensionsManifest, buffer_1.VSBuffer.fromString(JSON.stringify([{
                    identifier: extension.identifier,
                    location: extension.location.toJSON(),
                    relativeLocation: '',
                    version: extension.manifest.version,
                }])));
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
            const manifestContent = JSON.parse((await instantiationService.get(files_1.IFileService).readFile(extensionsManifest)).value.toString());
            assert.deepStrictEqual(manifestContent, [{ identifier: extension.identifier, location: extension.location.toJSON(), relativeLocation: 'pub.a-1.0.0', version: extension.manifest.version }]);
        });
        test('add extension trigger events', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            disposables.add(testObject.onAddExtensions(target1));
            disposables.add(testObject.onDidAddExtensions(target2));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'foo', 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
            assert.ok(target1.calledOnce);
            assert.deepStrictEqual((target1.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target1.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].identifier, extension.identifier);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].version, extension.manifest.version);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].location.toString(), extension.location.toString());
            assert.ok(target2.calledOnce);
            assert.deepStrictEqual((target2.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target2.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].identifier, extension.identifier);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].version, extension.manifest.version);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].location.toString(), extension.location.toString());
        });
        test('remove extension trigger events', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            disposables.add(testObject.onRemoveExtensions(target1));
            disposables.add(testObject.onDidRemoveExtensions(target2));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'foo', 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            await testObject.removeExtensionFromProfile(extension, extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.length, 0);
            assert.ok(target1.calledOnce);
            assert.deepStrictEqual((target1.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target1.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].identifier, extension.identifier);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].version, extension.manifest.version);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].location.toString(), extension.location.toString());
            assert.ok(target2.calledOnce);
            assert.deepStrictEqual((target2.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target2.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].identifier, extension.identifier);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].version, extension.manifest.version);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].location.toString(), extension.location.toString());
        });
        test('add extension with same id but different version', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension1 = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension1, undefined]], extensionsManifest);
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            const target3 = sinon.stub();
            const target4 = sinon.stub();
            disposables.add(testObject.onAddExtensions(target1));
            disposables.add(testObject.onRemoveExtensions(target2));
            disposables.add(testObject.onDidAddExtensions(target3));
            disposables.add(testObject.onDidRemoveExtensions(target4));
            const extension2 = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-2.0.0'), undefined, { version: '2.0.0' });
            await testObject.addExtensionsToProfile([[extension2, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension2.identifier, location: extension2.location.toJSON(), version: extension2.manifest.version, metadata: undefined }]);
            assert.ok(target1.calledOnce);
            assert.deepStrictEqual((target1.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target1.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].identifier, extension2.identifier);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].version, extension2.manifest.version);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].location.toString(), extension2.location.toString());
            assert.ok(target2.calledOnce);
            assert.deepStrictEqual((target2.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target2.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].identifier, extension1.identifier);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].version, extension1.manifest.version);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].location.toString(), extension1.location.toString());
            assert.ok(target3.calledOnce);
            assert.deepStrictEqual((target1.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target1.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].identifier, extension2.identifier);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].version, extension2.manifest.version);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].location.toString(), extension2.location.toString());
            assert.ok(target4.calledOnce);
            assert.deepStrictEqual((target2.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target2.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].identifier, extension1.identifier);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].version, extension1.manifest.version);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].location.toString(), extension1.location.toString());
        });
        test('add same extension', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            const target3 = sinon.stub();
            const target4 = sinon.stub();
            disposables.add(testObject.onAddExtensions(target1));
            disposables.add(testObject.onRemoveExtensions(target2));
            disposables.add(testObject.onDidAddExtensions(target3));
            disposables.add(testObject.onDidRemoveExtensions(target4));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
            assert.ok(target1.notCalled);
            assert.ok(target2.notCalled);
            assert.ok(target3.notCalled);
            assert.ok(target4.notCalled);
        });
        test('add same extension with different metadata', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            const target3 = sinon.stub();
            const target4 = sinon.stub();
            disposables.add(testObject.onAddExtensions(target1));
            disposables.add(testObject.onRemoveExtensions(target2));
            disposables.add(testObject.onDidAddExtensions(target3));
            disposables.add(testObject.onDidRemoveExtensions(target4));
            await testObject.addExtensionsToProfile([[extension, { isApplicationScoped: true }]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON(), metadata: a.metadata })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: { isApplicationScoped: true } }]);
            assert.ok(target1.notCalled);
            assert.ok(target2.notCalled);
            assert.ok(target3.notCalled);
            assert.ok(target4.notCalled);
        });
        test('add extension with different version and metadata', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            const extension1 = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension1, undefined]], extensionsManifest);
            const extension2 = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-2.0.0'), undefined, { version: '2.0.0' });
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            const target3 = sinon.stub();
            const target4 = sinon.stub();
            disposables.add(testObject.onAddExtensions(target1));
            disposables.add(testObject.onRemoveExtensions(target2));
            disposables.add(testObject.onDidAddExtensions(target3));
            disposables.add(testObject.onDidRemoveExtensions(target4));
            await testObject.addExtensionsToProfile([[extension2, { isApplicationScoped: true }]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON(), metadata: a.metadata })), [{ identifier: extension2.identifier, location: extension2.location.toJSON(), version: extension2.manifest.version, metadata: { isApplicationScoped: true } }]);
            assert.ok(target1.calledOnce);
            assert.deepStrictEqual((target1.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target1.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].identifier, extension2.identifier);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].version, extension2.manifest.version);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].location.toString(), extension2.location.toString());
            assert.ok(target2.calledOnce);
            assert.deepStrictEqual((target2.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target2.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].identifier, extension1.identifier);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].version, extension1.manifest.version);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].location.toString(), extension1.location.toString());
            assert.ok(target3.calledOnce);
            assert.deepStrictEqual((target1.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target1.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].identifier, extension2.identifier);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].version, extension2.manifest.version);
            assert.deepStrictEqual((target1.args[0][0]).extensions[0].location.toString(), extension2.location.toString());
            assert.ok(target4.calledOnce);
            assert.deepStrictEqual((target2.args[0][0]).profileLocation.toString(), extensionsManifest.toString());
            assert.deepStrictEqual((target2.args[0][0]).extensions.length, 1);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].identifier, extension1.identifier);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].version, extension1.manifest.version);
            assert.deepStrictEqual((target2.args[0][0]).extensions[0].location.toString(), extension1.location.toString());
        });
        test('add extension with same id and version located in the different folder', async () => {
            const testObject = disposables.add(instantiationService.createInstance(TestObject, extensionsLocation));
            const extensionsManifest = (0, resources_1.joinPath)(extensionsLocation, 'extensions.json');
            let extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'foo', 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const target1 = sinon.stub();
            const target2 = sinon.stub();
            const target3 = sinon.stub();
            const target4 = sinon.stub();
            disposables.add(testObject.onAddExtensions(target1));
            disposables.add(testObject.onRemoveExtensions(target2));
            disposables.add(testObject.onDidAddExtensions(target3));
            disposables.add(testObject.onDidRemoveExtensions(target4));
            extension = aExtension('pub.a', (0, resources_1.joinPath)(ROOT, 'pub.a-1.0.0'));
            await testObject.addExtensionsToProfile([[extension, undefined]], extensionsManifest);
            const actual = await testObject.scanProfileExtensions(extensionsManifest);
            assert.deepStrictEqual(actual.map(a => ({ ...a, location: a.location.toJSON() })), [{ identifier: extension.identifier, location: extension.location.toJSON(), version: extension.manifest.version, metadata: undefined }]);
            assert.ok(target1.notCalled);
            assert.ok(target2.notCalled);
            assert.ok(target3.notCalled);
            assert.ok(target4.notCalled);
        });
        function aExtension(id, location, e, manifest) {
            return {
                identifier: { id },
                location,
                type: 1 /* ExtensionType.User */,
                targetPlatform: "darwin-x64" /* TargetPlatform.DARWIN_X64 */,
                isBuiltin: false,
                manifest: {
                    name: 'name',
                    publisher: 'publisher',
                    version: '1.0.0',
                    engines: { vscode: '1.0.0' },
                    ...manifest,
                },
                isValid: true,
                validations: [],
                ...e
            };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb2ZpbGVTY2FubmVyU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L3Rlc3QvY29tbW9uL2V4dGVuc2lvbnNQcm9maWxlU2Nhbm5lclNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsTUFBTSxVQUFXLFNBQVEseUVBQXVDO0tBQUk7SUFFcEUsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUU3QyxNQUFNLElBQUksR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUU5RCxNQUFNLGtCQUFrQixHQUFHLElBQUEsb0JBQVEsRUFBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDeEQsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsb0JBQW9CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUN2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFjLEVBQUUsQ0FBQztZQUN4QyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVEQUEwQixFQUFFLENBQUMsQ0FBQztZQUM3RSxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLENBQUMs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QzVGLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxSCxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUV6SSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNqSSxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxSCxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUV6SSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNqSSxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxSCxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUV6SSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNqSSxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMx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LE9BQU8sRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRXpJLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2pJLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLGVBQWUsQ0FBMEIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkgsTUFBTSxDQUFDLGVBQWUsQ0FBMEIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRXpJLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2pJLE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLGVBQWUsQ0FBMEIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkgsTUFBTSxDQUFDLGVBQWUsQ0FBMEIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFILE1BQU0sQ0FBQyxlQUFlLENBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxR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