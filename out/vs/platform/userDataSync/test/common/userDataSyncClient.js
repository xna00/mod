/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncLocalStoreService", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/userDataSync/common/userDataSyncService", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/userDataProfile/test/common/userDataProfileStorageService.test"], function (require, exports, buffer_1, event_1, lifecycle_1, network_1, resources_1, uri_1, uuid_1, configuration_1, configurationService_1, environment_1, extensionEnablementService_1, extensionManagement_1, files_1, fileService_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, product_1, productService_1, request_1, storage_1, telemetry_1, telemetryUtils_1, uriIdentity_1, uriIdentityService_1, extensionStorage_1, ignoredExtensions_1, userDataSync_1, userDataSyncAccount_1, userDataSyncLocalStoreService_1, userDataSyncMachines_1, userDataSyncEnablementService_1, userDataSyncService_1, userDataSyncStoreService_1, userDataProfile_1, policy_1, userDataProfileStorageService_1, userDataProfileStorageService_test_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestUserDataSyncUtilService = exports.UserDataSyncTestServer = exports.UserDataSyncClient = void 0;
    class UserDataSyncClient extends lifecycle_1.Disposable {
        constructor(testServer = new UserDataSyncTestServer()) {
            super();
            this.testServer = testServer;
            this.instantiationService = this._register(new instantiationServiceMock_1.TestInstantiationService());
        }
        async setUp(empty = false) {
            this._register((0, userDataSync_1.registerConfiguration)());
            const logService = this.instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            const userRoamingDataHome = uri_1.URI.file('userdata').with({ scheme: network_1.Schemas.inMemory });
            const userDataSyncHome = (0, resources_1.joinPath)(userRoamingDataHome, '.sync');
            const environmentService = this.instantiationService.stub(environment_1.IEnvironmentService, {
                userDataSyncHome,
                userRoamingDataHome,
                cacheHome: (0, resources_1.joinPath)(userRoamingDataHome, 'cache'),
                argvResource: (0, resources_1.joinPath)(userRoamingDataHome, 'argv.json'),
                sync: 'on',
            });
            this.instantiationService.stub(productService_1.IProductService, {
                _serviceBrand: undefined, ...product_1.default, ...{
                    'configurationSync.store': {
                        url: this.testServer.url,
                        stableUrl: this.testServer.url,
                        insidersUrl: this.testServer.url,
                        canSwitch: false,
                        authenticationProviders: { 'test': { scopes: [] } }
                    }
                }
            });
            const fileService = this._register(new fileService_1.FileService(logService));
            this._register(fileService.registerProvider(network_1.Schemas.inMemory, this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            this._register(fileService.registerProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            this.instantiationService.stub(files_1.IFileService, fileService);
            const uriIdentityService = this._register(this.instantiationService.createInstance(uriIdentityService_1.UriIdentityService));
            this.instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            const userDataProfilesService = this._register(new userDataProfile_1.InMemoryUserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            this.instantiationService.stub(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            const storageService = this._register(new TestStorageService(userDataProfilesService.defaultProfile));
            this.instantiationService.stub(storage_1.IStorageService, this._register(storageService));
            this.instantiationService.stub(userDataProfileStorageService_1.IUserDataProfileStorageService, this._register(new userDataProfileStorageService_test_1.TestUserDataProfileStorageService(storageService)));
            const configurationService = this._register(new configurationService_1.ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, new policy_1.NullPolicyService(), logService));
            await configurationService.initialize();
            this.instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            this.instantiationService.stub(request_1.IRequestService, this.testServer);
            this.instantiationService.stub(userDataSync_1.IUserDataSyncLogService, logService);
            this.instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            this.instantiationService.stub(userDataSync_1.IUserDataSyncStoreManagementService, this._register(this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreManagementService)));
            this.instantiationService.stub(userDataSync_1.IUserDataSyncStoreService, this._register(this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreService)));
            const userDataSyncAccountService = this._register(this.instantiationService.createInstance(userDataSyncAccount_1.UserDataSyncAccountService));
            await userDataSyncAccountService.updateAccount({ authenticationProviderId: 'authenticationProviderId', token: 'token' });
            this.instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, userDataSyncAccountService);
            this.instantiationService.stub(userDataSyncMachines_1.IUserDataSyncMachinesService, this._register(this.instantiationService.createInstance(userDataSyncMachines_1.UserDataSyncMachinesService)));
            this.instantiationService.stub(userDataSync_1.IUserDataSyncLocalStoreService, this._register(this.instantiationService.createInstance(userDataSyncLocalStoreService_1.UserDataSyncLocalStoreService)));
            this.instantiationService.stub(userDataSync_1.IUserDataSyncUtilService, new TestUserDataSyncUtilService());
            this.instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, this._register(this.instantiationService.createInstance(userDataSyncEnablementService_1.UserDataSyncEnablementService)));
            this.instantiationService.stub(extensionManagement_1.IExtensionManagementService, {
                async getInstalled() { return []; },
                onDidInstallExtensions: new event_1.Emitter().event,
                onDidUninstallExtension: new event_1.Emitter().event,
            });
            this.instantiationService.stub(extensionManagement_1.IGlobalExtensionEnablementService, this._register(this.instantiationService.createInstance(extensionEnablementService_1.GlobalExtensionEnablementService)));
            this.instantiationService.stub(extensionStorage_1.IExtensionStorageService, this._register(this.instantiationService.createInstance(extensionStorage_1.ExtensionStorageService)));
            this.instantiationService.stub(ignoredExtensions_1.IIgnoredExtensionsManagementService, this.instantiationService.createInstance(ignoredExtensions_1.IgnoredExtensionsManagementService));
            this.instantiationService.stub(extensionManagement_1.IExtensionGalleryService, {
                isEnabled() { return true; },
                async getCompatibleExtension() { return null; }
            });
            this.instantiationService.stub(userDataSync_1.IUserDataSyncService, this._register(this.instantiationService.createInstance(userDataSyncService_1.UserDataSyncService)));
            if (!empty) {
                await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({})));
                await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([])));
                await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'c.json'), buffer_1.VSBuffer.fromString(`{}`));
                await fileService.writeFile(userDataProfilesService.defaultProfile.tasksResource, buffer_1.VSBuffer.fromString(`{}`));
                await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'en' })));
            }
            await configurationService.reloadConfiguration();
        }
        async sync() {
            await (await this.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
        }
        read(resource, collection) {
            return this.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).readResource(resource, null, collection);
        }
        async getResourceManifest() {
            const manifest = await this.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).manifest(null);
            return manifest?.latest ?? null;
        }
        getSynchronizer(source) {
            return this.instantiationService.get(userDataSync_1.IUserDataSyncService).getOrCreateActiveProfileSynchronizer(this.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile, undefined).enabled.find(s => s.resource === source);
        }
    }
    exports.UserDataSyncClient = UserDataSyncClient;
    const ALL_SERVER_RESOURCES = [...userDataSync_1.ALL_SYNC_RESOURCES, 'machines'];
    class UserDataSyncTestServer {
        get requests() { return this._requests; }
        get requestsWithAllHeaders() { return this._requestsWithAllHeaders; }
        get responses() { return this._responses; }
        reset() { this._requests = []; this._responses = []; this._requestsWithAllHeaders = []; }
        constructor(rateLimit = Number.MAX_SAFE_INTEGER, retryAfter) {
            this.rateLimit = rateLimit;
            this.retryAfter = retryAfter;
            this.url = 'http://host:3000';
            this.session = null;
            this.collections = new Map();
            this.data = new Map();
            this._requests = [];
            this._requestsWithAllHeaders = [];
            this._responses = [];
            this.manifestRef = 0;
            this.collectionCounter = 0;
        }
        async resolveProxy(url) { return url; }
        async loadCertificates() { return []; }
        async request(options, token) {
            if (this._requests.length === this.rateLimit) {
                return this.toResponse(429, this.retryAfter ? { 'retry-after': `${this.retryAfter}` } : undefined);
            }
            const headers = {};
            if (options.headers) {
                if (options.headers['If-None-Match']) {
                    headers['If-None-Match'] = options.headers['If-None-Match'];
                }
                if (options.headers['If-Match']) {
                    headers['If-Match'] = options.headers['If-Match'];
                }
            }
            this._requests.push({ url: options.url, type: options.type, headers });
            this._requestsWithAllHeaders.push({ url: options.url, type: options.type, headers: options.headers });
            const requestContext = await this.doRequest(options);
            this._responses.push({ status: requestContext.res.statusCode });
            return requestContext;
        }
        async doRequest(options) {
            const versionUrl = `${this.url}/v1/`;
            const relativePath = options.url.indexOf(versionUrl) === 0 ? options.url.substring(versionUrl.length) : undefined;
            const segments = relativePath ? relativePath.split('/') : [];
            if (options.type === 'GET' && segments.length === 1 && segments[0] === 'manifest') {
                return this.getManifest(options.headers);
            }
            if (options.type === 'GET' && segments.length === 3 && segments[0] === 'resource') {
                return this.getResourceData(undefined, segments[1], segments[2] === 'latest' ? undefined : segments[2], options.headers);
            }
            if (options.type === 'POST' && segments.length === 2 && segments[0] === 'resource') {
                return this.writeData(undefined, segments[1], options.data, options.headers);
            }
            // resources in collection
            if (options.type === 'GET' && segments.length === 5 && segments[0] === 'collection' && segments[2] === 'resource') {
                return this.getResourceData(segments[1], segments[3], segments[4] === 'latest' ? undefined : segments[4], options.headers);
            }
            if (options.type === 'POST' && segments.length === 4 && segments[0] === 'collection' && segments[2] === 'resource') {
                return this.writeData(segments[1], segments[3], options.data, options.headers);
            }
            if (options.type === 'DELETE' && segments.length === 2 && segments[0] === 'resource') {
                return this.deleteResourceData(undefined, segments[1]);
            }
            if (options.type === 'DELETE' && segments.length === 1 && segments[0] === 'resource') {
                return this.clear(options.headers);
            }
            if (options.type === 'DELETE' && segments[0] === 'collection') {
                return this.toResponse(204);
            }
            if (options.type === 'POST' && segments.length === 1 && segments[0] === 'collection') {
                return this.createCollection();
            }
            return this.toResponse(501);
        }
        async getManifest(headers) {
            if (this.session) {
                const latest = Object.create({});
                this.data.forEach((value, key) => latest[key] = value.ref);
                let collection = undefined;
                if (this.collectionCounter) {
                    collection = {};
                    for (let collectionId = 1; collectionId <= this.collectionCounter; collectionId++) {
                        const collectionData = this.collections.get(`${collectionId}`);
                        if (collectionData) {
                            const latest = Object.create({});
                            collectionData.forEach((value, key) => latest[key] = value.ref);
                            collection[`${collectionId}`] = { latest };
                        }
                    }
                }
                const manifest = { session: this.session, latest, collection };
                return this.toResponse(200, { 'Content-Type': 'application/json', etag: `${this.manifestRef++}` }, JSON.stringify(manifest));
            }
            return this.toResponse(204, { etag: `${this.manifestRef++}` });
        }
        async getResourceData(collection, resource, ref, headers = {}) {
            const collectionData = collection ? this.collections.get(collection) : this.data;
            if (!collectionData) {
                return this.toResponse(501);
            }
            const resourceKey = ALL_SERVER_RESOURCES.find(key => key === resource);
            if (resourceKey) {
                const data = collectionData.get(resourceKey);
                if (ref && data?.ref !== ref) {
                    return this.toResponse(404);
                }
                if (!data) {
                    return this.toResponse(204, { etag: '0' });
                }
                if (headers['If-None-Match'] === data.ref) {
                    return this.toResponse(304);
                }
                return this.toResponse(200, { etag: data.ref }, data.content || '');
            }
            return this.toResponse(204);
        }
        async writeData(collection, resource, content = '', headers = {}) {
            if (!this.session) {
                this.session = (0, uuid_1.generateUuid)();
            }
            const collectionData = collection ? this.collections.get(collection) : this.data;
            if (!collectionData) {
                return this.toResponse(501);
            }
            const resourceKey = ALL_SERVER_RESOURCES.find(key => key === resource);
            if (resourceKey) {
                const data = collectionData.get(resourceKey);
                if (headers['If-Match'] !== undefined && headers['If-Match'] !== (data ? data.ref : '0')) {
                    return this.toResponse(412);
                }
                const ref = `${parseInt(data?.ref || '0') + 1}`;
                collectionData.set(resourceKey, { ref, content });
                return this.toResponse(200, { etag: ref });
            }
            return this.toResponse(204);
        }
        async deleteResourceData(collection, resource, headers = {}) {
            const collectionData = collection ? this.collections.get(collection) : this.data;
            if (!collectionData) {
                return this.toResponse(501);
            }
            const resourceKey = ALL_SERVER_RESOURCES.find(key => key === resource);
            if (resourceKey) {
                collectionData.delete(resourceKey);
                return this.toResponse(200);
            }
            return this.toResponse(404);
        }
        async createCollection() {
            const collectionId = `${++this.collectionCounter}`;
            this.collections.set(collectionId, new Map());
            return this.toResponse(200, {}, collectionId);
        }
        async clear(headers) {
            this.collections.clear();
            this.data.clear();
            this.session = null;
            this.collectionCounter = 0;
            return this.toResponse(204);
        }
        toResponse(statusCode, headers, data) {
            return {
                res: {
                    headers: headers || {},
                    statusCode
                },
                stream: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(data || ''))
            };
        }
    }
    exports.UserDataSyncTestServer = UserDataSyncTestServer;
    class TestUserDataSyncUtilService {
        async resolveDefaultIgnoredSettings() {
            return (0, userDataSync_1.getDefaultIgnoredSettings)();
        }
        async resolveUserBindings(userbindings) {
            const keys = {};
            for (const keybinding of userbindings) {
                keys[keybinding] = keybinding;
            }
            return keys;
        }
        async resolveFormattingOptions(file) {
            return { eol: '\n', insertSpaces: false, tabSize: 4 };
        }
    }
    exports.TestUserDataSyncUtilService = TestUserDataSyncUtilService;
    class TestStorageService extends storage_1.InMemoryStorageService {
        constructor(profileStorageProfile) {
            super();
            this.profileStorageProfile = profileStorageProfile;
        }
        hasScope(profile) {
            return this.profileStorageProfile.id === profile.id;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jQ2xpZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvdGVzdC9jb21tb24vdXNlckRhdGFTeW5jQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTZDaEcsTUFBYSxrQkFBbUIsU0FBUSxzQkFBVTtRQUlqRCxZQUFxQixhQUFxQyxJQUFJLHNCQUFzQixFQUFFO1lBQ3JGLEtBQUssRUFBRSxDQUFDO1lBRFksZUFBVSxHQUFWLFVBQVUsQ0FBdUQ7WUFFckYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBaUIsS0FBSztZQUNqQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsb0NBQXFCLEdBQUUsQ0FBQyxDQUFDO1lBRXhDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO1lBRXJGLE1BQU0sbUJBQW1CLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRTtnQkFDOUUsZ0JBQWdCO2dCQUNoQixtQkFBbUI7Z0JBQ25CLFNBQVMsRUFBRSxJ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