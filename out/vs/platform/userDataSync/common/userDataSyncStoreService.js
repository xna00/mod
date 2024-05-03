/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, mime_1, platform_1, resources_1, types_1, uri_1, uuid_1, configuration_1, environment_1, files_1, productService_1, request_1, serviceMachineId_1, storage_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestsSession = exports.UserDataSyncStoreService = exports.UserDataSyncStoreClient = exports.UserDataSyncStoreManagementService = exports.AbstractUserDataSyncStoreManagementService = void 0;
    const CONFIGURATION_SYNC_STORE_KEY = 'configurationSync.store';
    const SYNC_PREVIOUS_STORE = 'sync.previous.store';
    const DONOT_MAKE_REQUESTS_UNTIL_KEY = 'sync.donot-make-requests-until';
    const USER_SESSION_ID_KEY = 'sync.user-session-id';
    const MACHINE_SESSION_ID_KEY = 'sync.machine-session-id';
    const REQUEST_SESSION_LIMIT = 100;
    const REQUEST_SESSION_INTERVAL = 1000 * 60 * 5; /* 5 minutes */
    let AbstractUserDataSyncStoreManagementService = class AbstractUserDataSyncStoreManagementService extends lifecycle_1.Disposable {
        get userDataSyncStore() { return this._userDataSyncStore; }
        get userDataSyncStoreType() {
            return this.storageService.get(userDataSync_1.SYNC_SERVICE_URL_TYPE, -1 /* StorageScope.APPLICATION */);
        }
        set userDataSyncStoreType(type) {
            this.storageService.store(userDataSync_1.SYNC_SERVICE_URL_TYPE, type, -1 /* StorageScope.APPLICATION */, platform_1.isWeb ? 0 /* StorageTarget.USER */ : 1 /* StorageTarget.MACHINE */);
        }
        constructor(productService, configurationService, storageService) {
            super();
            this.productService = productService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this._onDidChangeUserDataSyncStore = this._register(new event_1.Emitter());
            this.onDidChangeUserDataSyncStore = this._onDidChangeUserDataSyncStore.event;
            this.updateUserDataSyncStore();
            const disposable = this._register(new lifecycle_1.DisposableStore());
            this._register(event_1.Event.filter(storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, userDataSync_1.SYNC_SERVICE_URL_TYPE, disposable), () => this.userDataSyncStoreType !== this.userDataSyncStore?.type, disposable)(() => this.updateUserDataSyncStore()));
        }
        updateUserDataSyncStore() {
            this._userDataSyncStore = this.toUserDataSyncStore(this.productService[CONFIGURATION_SYNC_STORE_KEY]);
            this._onDidChangeUserDataSyncStore.fire();
        }
        toUserDataSyncStore(configurationSyncStore) {
            if (!configurationSyncStore) {
                return undefined;
            }
            // Check for web overrides for backward compatibility while reading previous store
            configurationSyncStore = platform_1.isWeb && configurationSyncStore.web ? { ...configurationSyncStore, ...configurationSyncStore.web } : configurationSyncStore;
            if ((0, types_1.isString)(configurationSyncStore.url)
                && (0, types_1.isObject)(configurationSyncStore.authenticationProviders)
                && Object.keys(configurationSyncStore.authenticationProviders).every(authenticationProviderId => Array.isArray(configurationSyncStore.authenticationProviders[authenticationProviderId].scopes))) {
                const syncStore = configurationSyncStore;
                const canSwitch = !!syncStore.canSwitch;
                const defaultType = syncStore.url === syncStore.insidersUrl ? 'insiders' : 'stable';
                const type = (canSwitch ? this.userDataSyncStoreType : undefined) || defaultType;
                const url = type === 'insiders' ? syncStore.insidersUrl
                    : type === 'stable' ? syncStore.stableUrl
                        : syncStore.url;
                return {
                    url: uri_1.URI.parse(url),
                    type,
                    defaultType,
                    defaultUrl: uri_1.URI.parse(syncStore.url),
                    stableUrl: uri_1.URI.parse(syncStore.stableUrl),
                    insidersUrl: uri_1.URI.parse(syncStore.insidersUrl),
                    canSwitch,
                    authenticationProviders: Object.keys(syncStore.authenticationProviders).reduce((result, id) => {
                        result.push({ id, scopes: syncStore.authenticationProviders[id].scopes });
                        return result;
                    }, [])
                };
            }
            return undefined;
        }
    };
    exports.AbstractUserDataSyncStoreManagementService = AbstractUserDataSyncStoreManagementService;
    exports.AbstractUserDataSyncStoreManagementService = AbstractUserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], AbstractUserDataSyncStoreManagementService);
    let UserDataSyncStoreManagementService = class UserDataSyncStoreManagementService extends AbstractUserDataSyncStoreManagementService {
        constructor(productService, configurationService, storageService) {
            super(productService, configurationService, storageService);
            const previousConfigurationSyncStore = this.storageService.get(SYNC_PREVIOUS_STORE, -1 /* StorageScope.APPLICATION */);
            if (previousConfigurationSyncStore) {
                this.previousConfigurationSyncStore = JSON.parse(previousConfigurationSyncStore);
            }
            const syncStore = this.productService[CONFIGURATION_SYNC_STORE_KEY];
            if (syncStore) {
                this.storageService.store(SYNC_PREVIOUS_STORE, JSON.stringify(syncStore), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(SYNC_PREVIOUS_STORE, -1 /* StorageScope.APPLICATION */);
            }
        }
        async switch(type) {
            if (type !== this.userDataSyncStoreType) {
                this.userDataSyncStoreType = type;
                this.updateUserDataSyncStore();
            }
        }
        async getPreviousUserDataSyncStore() {
            return this.toUserDataSyncStore(this.previousConfigurationSyncStore);
        }
    };
    exports.UserDataSyncStoreManagementService = UserDataSyncStoreManagementService;
    exports.UserDataSyncStoreManagementService = UserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], UserDataSyncStoreManagementService);
    let UserDataSyncStoreClient = class UserDataSyncStoreClient extends lifecycle_1.Disposable {
        get donotMakeRequestsUntil() { return this._donotMakeRequestsUntil; }
        constructor(userDataSyncStoreUrl, productService, requestService, logService, environmentService, fileService, storageService) {
            super();
            this.requestService = requestService;
            this.logService = logService;
            this.storageService = storageService;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
            this._onTokenSucceed = this._register(new event_1.Emitter());
            this.onTokenSucceed = this._onTokenSucceed.event;
            this._donotMakeRequestsUntil = undefined;
            this._onDidChangeDonotMakeRequestsUntil = this._register(new event_1.Emitter());
            this.onDidChangeDonotMakeRequestsUntil = this._onDidChangeDonotMakeRequestsUntil.event;
            this.resetDonotMakeRequestsUntilPromise = undefined;
            this.updateUserDataSyncStoreUrl(userDataSyncStoreUrl);
            this.commonHeadersPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService)
                .then(uuid => {
                const headers = {
                    'X-Client-Name': `${productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                    'X-Client-Version': productService.version,
                };
                if (productService.commit) {
                    headers['X-Client-Commit'] = productService.commit;
                }
                return headers;
            });
            /* A requests session that limits requests per sessions */
            this.session = new RequestsSession(REQUEST_SESSION_LIMIT, REQUEST_SESSION_INTERVAL, this.requestService, this.logService);
            this.initDonotMakeRequestsUntil();
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.resetDonotMakeRequestsUntilPromise) {
                    this.resetDonotMakeRequestsUntilPromise.cancel();
                    this.resetDonotMakeRequestsUntilPromise = undefined;
                }
            }));
        }
        setAuthToken(token, type) {
            this.authToken = { token, type };
        }
        updateUserDataSyncStoreUrl(userDataSyncStoreUrl) {
            this.userDataSyncStoreUrl = userDataSyncStoreUrl ? (0, resources_1.joinPath)(userDataSyncStoreUrl, 'v1') : undefined;
        }
        initDonotMakeRequestsUntil() {
            const donotMakeRequestsUntil = this.storageService.getNumber(DONOT_MAKE_REQUESTS_UNTIL_KEY, -1 /* StorageScope.APPLICATION */);
            if (donotMakeRequestsUntil && Date.now() < donotMakeRequestsUntil) {
                this.setDonotMakeRequestsUntil(new Date(donotMakeRequestsUntil));
            }
        }
        setDonotMakeRequestsUntil(donotMakeRequestsUntil) {
            if (this._donotMakeRequestsUntil?.getTime() !== donotMakeRequestsUntil?.getTime()) {
                this._donotMakeRequestsUntil = donotMakeRequestsUntil;
                if (this.resetDonotMakeRequestsUntilPromise) {
                    this.resetDonotMakeRequestsUntilPromise.cancel();
                    this.resetDonotMakeRequestsUntilPromise = undefined;
                }
                if (this._donotMakeRequestsUntil) {
                    this.storageService.store(DONOT_MAKE_REQUESTS_UNTIL_KEY, this._donotMakeRequestsUntil.getTime(), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    this.resetDonotMakeRequestsUntilPromise = (0, async_1.createCancelablePromise)(token => (0, async_1.timeout)(this._donotMakeRequestsUntil.getTime() - Date.now(), token).then(() => this.setDonotMakeRequestsUntil(undefined)));
                    this.resetDonotMakeRequestsUntilPromise.then(null, e => null /* ignore error */);
                }
                else {
                    this.storageService.remove(DONOT_MAKE_REQUESTS_UNTIL_KEY, -1 /* StorageScope.APPLICATION */);
                }
                this._onDidChangeDonotMakeRequestsUntil.fire();
            }
        }
        // #region Collection
        async getAllCollections(headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection').toString();
            headers = { ...headers };
            headers['Content-Type'] = 'application/json';
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            return (await (0, request_1.asJson)(context))?.map(({ id }) => id) || [];
        }
        async createCollection(headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection').toString();
            headers = { ...headers };
            headers['Content-Type'] = mime_1.Mimes.text;
            const context = await this.request(url, { type: 'POST', headers }, [], cancellation_1.CancellationToken.None);
            const collectionId = await (0, request_1.asTextOrError)(context);
            if (!collectionId) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the collection id', url, "NoCollection" /* UserDataSyncErrorCode.NoCollection */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return collectionId;
        }
        async deleteCollection(collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = collection ? (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection', collection).toString() : (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'collection').toString();
            headers = { ...headers };
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        // #endregion
        // #region Resource
        async getAllResourceRefs(resource, collection) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const uri = this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource);
            const headers = {};
            const context = await this.request(uri.toString(), { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            const result = await (0, request_1.asJson)(context) || [];
            return result.map(({ url, created }) => ({ ref: (0, resources_1.relativePath)(uri, uri.with({ path: url })), created: created * 1000 /* Server returns in seconds */ }));
        }
        async resolveResourceContent(resource, ref, collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource), ref).toString();
            headers = { ...headers };
            headers['Cache-Control'] = 'no-cache';
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            const content = await (0, request_1.asTextOrError)(context);
            return content;
        }
        async deleteResource(resource, ref, collection) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = ref !== null ? (0, resources_1.joinPath)(this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource), ref).toString() : this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource).toString();
            const headers = {};
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        async deleteResources() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource').toString();
            const headers = { 'Content-Type': mime_1.Mimes.text };
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        async readResource(resource, oldValue, collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource), 'latest').toString();
            headers = { ...headers };
            // Disable caching as they are cached by synchronisers
            headers['Cache-Control'] = 'no-cache';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request(url, { type: 'GET', headers }, [304], cancellation_1.CancellationToken.None);
            let userData = null;
            if (context.res.statusCode === 304) {
                userData = oldValue;
            }
            if (userData === null) {
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                const content = await (0, request_1.asTextOrError)(context);
                if (!content && context.res.statusCode === 304) {
                    throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                userData = { ref, content };
            }
            return userData;
        }
        async writeResource(resource, data, ref, collection, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = this.getResourceUrl(this.userDataSyncStoreUrl, collection, resource).toString();
            headers = { ...headers };
            headers['Content-Type'] = mime_1.Mimes.text;
            if (ref) {
                headers['If-Match'] = ref;
            }
            const context = await this.request(url, { type: 'POST', data, headers }, [], cancellation_1.CancellationToken.None);
            const newRef = context.res.headers['etag'];
            if (!newRef) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return newRef;
        }
        // #endregion
        async manifest(oldValue, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'manifest').toString();
            headers = { ...headers };
            headers['Content-Type'] = 'application/json';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request(url, { type: 'GET', headers }, [304], cancellation_1.CancellationToken.None);
            let manifest = null;
            if (context.res.statusCode === 304) {
                manifest = oldValue;
            }
            if (!manifest) {
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                const content = await (0, request_1.asTextOrError)(context);
                if (!content && context.res.statusCode === 304) {
                    throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                if (content) {
                    manifest = { ...JSON.parse(content), ref };
                }
            }
            const currentSessionId = this.storageService.get(USER_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            if (currentSessionId && manifest && currentSessionId !== manifest.session) {
                // Server session is different from client session so clear cached session.
                this.clearSession();
            }
            if (manifest === null && currentSessionId) {
                // server session is cleared so clear cached session.
                this.clearSession();
            }
            if (manifest) {
                // update session
                this.storageService.store(USER_SESSION_ID_KEY, manifest.session, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            return manifest;
        }
        async clear() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            await this.deleteCollection();
            await this.deleteResources();
            // clear cached session.
            this.clearSession();
        }
        async getActivityData() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'download').toString();
            const headers = {};
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            if (!(0, request_1.isSuccess)(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            if ((0, request_1.hasNoContent)(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return context.stream;
        }
        getResourceUrl(userDataSyncStoreUrl, collection, resource) {
            return collection ? (0, resources_1.joinPath)(userDataSyncStoreUrl, 'collection', collection, 'resource', resource) : (0, resources_1.joinPath)(userDataSyncStoreUrl, 'resource', resource);
        }
        clearSession() {
            this.storageService.remove(USER_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            this.storageService.remove(MACHINE_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
        }
        async request(url, options, successCodes, token) {
            if (!this.authToken) {
                throw new userDataSync_1.UserDataSyncStoreError('No Auth Token Available', url, "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */, undefined, undefined);
            }
            if (this._donotMakeRequestsUntil && Date.now() < this._donotMakeRequestsUntil.getTime()) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */, undefined, undefined);
            }
            this.setDonotMakeRequestsUntil(undefined);
            const commonHeaders = await this.commonHeadersPromise;
            options.headers = {
                ...(options.headers || {}),
                ...commonHeaders,
                'X-Account-Type': this.authToken.type,
                'authorization': `Bearer ${this.authToken.token}`,
            };
            // Add session headers
            this.addSessionHeaders(options.headers);
            this.logService.trace('Sending request to server', { url, type: options.type, headers: { ...options.headers, ...{ authorization: undefined } } });
            let context;
            try {
                context = await this.session.request(url, options, token);
            }
            catch (e) {
                if (!(e instanceof userDataSync_1.UserDataSyncStoreError)) {
                    let code = "RequestFailed" /* UserDataSyncErrorCode.RequestFailed */;
                    const errorMessage = (0, errors_1.getErrorMessage)(e).toLowerCase();
                    // Request timed out
                    if (errorMessage.includes('xhr timeout')) {
                        code = "RequestTimeout" /* UserDataSyncErrorCode.RequestTimeout */;
                    }
                    // Request protocol not supported
                    else if (errorMessage.includes('protocol') && errorMessage.includes('not supported')) {
                        code = "RequestProtocolNotSupported" /* UserDataSyncErrorCode.RequestProtocolNotSupported */;
                    }
                    // Request path not escaped
                    else if (errorMessage.includes('request path contains unescaped characters')) {
                        code = "RequestPathNotEscaped" /* UserDataSyncErrorCode.RequestPathNotEscaped */;
                    }
                    // Request header not an object
                    else if (errorMessage.includes('headers must be an object')) {
                        code = "RequestHeadersNotObject" /* UserDataSyncErrorCode.RequestHeadersNotObject */;
                    }
                    // Request canceled
                    else if ((0, errors_1.isCancellationError)(e)) {
                        code = "RequestCanceled" /* UserDataSyncErrorCode.RequestCanceled */;
                    }
                    e = new userDataSync_1.UserDataSyncStoreError(`Connection refused for the request '${url}'.`, url, code, undefined, undefined);
                }
                this.logService.info('Request failed', url);
                throw e;
            }
            const operationId = context.res.headers[userDataSync_1.HEADER_OPERATION_ID];
            const requestInfo = { url, status: context.res.statusCode, 'execution-id': options.headers[userDataSync_1.HEADER_EXECUTION_ID], 'operation-id': operationId };
            const isSuccess = (0, request_1.isSuccess)(context) || (context.res.statusCode && successCodes.includes(context.res.statusCode));
            let failureMessage = '';
            if (isSuccess) {
                this.logService.trace('Request succeeded', requestInfo);
            }
            else {
                failureMessage = await (0, request_1.asText)(context) || '';
                this.logService.info('Request failed', requestInfo, failureMessage);
            }
            if (context.res.statusCode === 401 || context.res.statusCode === 403) {
                this.authToken = undefined;
                if (context.res.statusCode === 401) {
                    this._onTokenFailed.fire("Unauthorized" /* UserDataSyncErrorCode.Unauthorized */);
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Unauthorized (401).`, url, "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */, context.res.statusCode, operationId);
                }
                if (context.res.statusCode === 403) {
                    this._onTokenFailed.fire("Forbidden" /* UserDataSyncErrorCode.Forbidden */);
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the access is forbidden (403).`, url, "Forbidden" /* UserDataSyncErrorCode.Forbidden */, context.res.statusCode, operationId);
                }
            }
            this._onTokenSucceed.fire();
            if (context.res.statusCode === 404) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested resource is not found (404).`, url, "NotFound" /* UserDataSyncErrorCode.NotFound */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 405) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested endpoint is not found (405). ${failureMessage}`, url, "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 409) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Conflict (409). There is new data for this resource. Make the request again with latest data.`, url, "Conflict" /* UserDataSyncErrorCode.Conflict */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 410) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested resource is not longer available (410).`, url, "Gone" /* UserDataSyncErrorCode.Gone */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 412) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Precondition Failed (412). There is new data for this resource. Make the request again with latest data.`, url, "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 413) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too large payload (413).`, url, "TooLarge" /* UserDataSyncErrorCode.TooLarge */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 426) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed with status Upgrade Required (426). Please upgrade the client and try again.`, url, "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 429) {
                const retryAfter = context.res.headers['retry-after'];
                if (retryAfter) {
                    this.setDonotMakeRequestsUntil(new Date(Date.now() + (parseInt(retryAfter) * 1000)));
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */, context.res.statusCode, operationId);
                }
                else {
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */, context.res.statusCode, operationId);
                }
            }
            if (!isSuccess) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, url, "Unknown" /* UserDataSyncErrorCode.Unknown */, context.res.statusCode, operationId);
            }
            return context;
        }
        addSessionHeaders(headers) {
            let machineSessionId = this.storageService.get(MACHINE_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            if (machineSessionId === undefined) {
                machineSessionId = (0, uuid_1.generateUuid)();
                this.storageService.store(MACHINE_SESSION_ID_KEY, machineSessionId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            headers['X-Machine-Session-Id'] = machineSessionId;
            const userSessionId = this.storageService.get(USER_SESSION_ID_KEY, -1 /* StorageScope.APPLICATION */);
            if (userSessionId !== undefined) {
                headers['X-User-Session-Id'] = userSessionId;
            }
        }
    };
    exports.UserDataSyncStoreClient = UserDataSyncStoreClient;
    exports.UserDataSyncStoreClient = UserDataSyncStoreClient = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreClient);
    let UserDataSyncStoreService = class UserDataSyncStoreService extends UserDataSyncStoreClient {
        constructor(userDataSyncStoreManagementService, productService, requestService, logService, environmentService, fileService, storageService) {
            super(userDataSyncStoreManagementService.userDataSyncStore?.url, productService, requestService, logService, environmentService, fileService, storageService);
            this._register(userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => this.updateUserDataSyncStoreUrl(userDataSyncStoreManagementService.userDataSyncStore?.url)));
        }
    };
    exports.UserDataSyncStoreService = UserDataSyncStoreService;
    exports.UserDataSyncStoreService = UserDataSyncStoreService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreService);
    class RequestsSession {
        constructor(limit, interval, /* in ms */ requestService, logService) {
            this.limit = limit;
            this.interval = interval;
            this.requestService = requestService;
            this.logService = logService;
            this.requests = [];
            this.startTime = undefined;
        }
        request(url, options, token) {
            if (this.isExpired()) {
                this.reset();
            }
            options.url = url;
            if (this.requests.length >= this.limit) {
                this.logService.info('Too many requests', ...this.requests);
                throw new userDataSync_1.UserDataSyncStoreError(`Too many requests. Only ${this.limit} requests allowed in ${this.interval / (1000 * 60)} minutes.`, url, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */, undefined, undefined);
            }
            this.startTime = this.startTime || new Date();
            this.requests.push(url);
            return this.requestService.request(options, token);
        }
        isExpired() {
            return this.startTime !== undefined && new Date().getTime() - this.startTime.getTime() > this.interval;
        }
        reset() {
            this.requests = [];
            this.startTime = undefined;
        }
    }
    exports.RequestsSession = RequestsSession;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU3RvcmVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL3VzZXJEYXRhU3luY1N0b3JlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLE1BQU0sNEJBQTRCLEdBQUcseUJBQXlCLENBQUM7SUFDL0QsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztJQUNsRCxNQUFNLDZCQUE2QixHQUFHLGdDQUFnQyxDQUFDO0lBQ3ZFLE1BQU0sbUJBQW1CLEdBQUcsc0JBQXNCLENBQUM7SUFDbkQsTUFBTSxzQkFBc0IsR0FBRyx5QkFBeUIsQ0FBQztJQUN6RCxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQztJQUNsQyxNQUFNLHdCQUF3QixHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsZUFBZTtJQUl4RCxJQUFlLDBDQUEwQyxHQUF6RCxNQUFlLDBDQUEyQyxTQUFRLHNCQUFVO1FBT2xGLElBQUksaUJBQWlCLEtBQW9DLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUUxRixJQUFjLHFCQUFxQjtZQUNsQyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFxQixvQ0FBb0QsQ0FBQztRQUMxRyxDQUFDO1FBQ0QsSUFBYyxxQkFBcUIsQ0FBQyxJQUF1QztZQUMxRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxvQ0FBcUIsRUFBRSxJQUFJLHFDQUE0QixnQkFBSyxDQUFDLENBQUMsNEJBQXNDLENBQUMsOEJBQXNCLENBQUMsQ0FBQztRQUN4SixDQUFDO1FBRUQsWUFDa0IsY0FBa0QsRUFDNUMsb0JBQThELEVBQ3BFLGNBQWtE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