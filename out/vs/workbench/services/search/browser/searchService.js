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
define(["require", "exports", "vs/editor/common/services/model", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/worker/simpleWorker", "vs/base/common/lifecycle", "vs/base/browser/defaultWorkerFactory", "vs/platform/instantiation/common/extensions", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/event", "vs/nls", "vs/platform/files/browser/webFileSystemAccess", "vs/base/common/marshalling"], function (require, exports, model_1, files_1, instantiation_1, log_1, telemetry_1, editorService_1, extensions_1, search_1, searchService_1, uriIdentity_1, simpleWorker_1, lifecycle_1, defaultWorkerFactory_1, extensions_2, decorators_1, network_1, uri_1, event_1, nls_1, webFileSystemAccess_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalFileSearchWorkerClient = exports.RemoteSearchService = void 0;
    let RemoteSearchService = class RemoteSearchService extends searchService_1.SearchService {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService, instantiationService, uriIdentityService) {
            super(modelService, editorService, telemetryService, logService, extensionService, fileService, uriIdentityService);
            this.instantiationService = instantiationService;
            const searchProvider = this.instantiationService.createInstance(LocalFileSearchWorkerClient);
            this.registerSearchResultProvider(network_1.Schemas.file, 0 /* SearchProviderType.file */, searchProvider);
            this.registerSearchResultProvider(network_1.Schemas.file, 1 /* SearchProviderType.text */, searchProvider);
        }
    };
    exports.RemoteSearchService = RemoteSearchService;
    exports.RemoteSearchService = RemoteSearchService = __decorate([
        __param(0, model_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, extensions_1.IExtensionService),
        __param(5, files_1.IFileService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], RemoteSearchService);
    let LocalFileSearchWorkerClient = class LocalFileSearchWorkerClient extends lifecycle_1.Disposable {
        constructor(fileService, uriIdentityService) {
            super();
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidReceiveTextSearchMatch = new event_1.Emitter();
            this.onDidReceiveTextSearchMatch = this._onDidReceiveTextSearchMatch.event;
            this.queryId = 0;
            this._worker = null;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory('localFileSearchWorker');
        }
        sendTextSearchMatch(match, queryId) {
            this._onDidReceiveTextSearchMatch.fire({ match, queryId });
        }
        get fileSystemProvider() {
            return this.fileService.getProvider(network_1.Schemas.file);
        }
        async cancelQuery(queryId) {
            const proxy = await this._getOrCreateWorker().getProxyObject();
            proxy.cancelQuery(queryId);
        }
        async textSearch(query, onProgress, token) {
            try {
                const queryDisposables = new lifecycle_1.DisposableStore();
                const proxy = await this._getOrCreateWorker().getProxyObject();
                const results = [];
                let limitHit = false;
                await Promise.all(query.folderQueries.map(async (fq) => {
                    const queryId = this.queryId++;
                    queryDisposables.add(token?.onCancellationRequested(e => this.cancelQuery(queryId)) || lifecycle_1.Disposable.None);
                    const handle = await this.fileSystemProvider.getHandle(fq.folder);
                    if (!handle || !webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                        console.error('Could not get directory handle for ', fq);
                        return;
                    }
                    // force resource to revive using URI.revive.
                    // TODO @andrea see why we can't just use `revive()` below. For some reason, (<MarshalledObject>obj).$mid was undefined for result.resource
                    const reviveMatch = (result) => ({
                        resource: uri_1.URI.revive(result.resource),
                        results: (0, marshalling_1.revive)(result.results)
                    });
                    queryDisposables.add(this.onDidReceiveTextSearchMatch(e => {
                        if (e.queryId === queryId) {
                            onProgress?.(reviveMatch(e.match));
                        }
                    }));
                    const ignorePathCasing = this.uriIdentityService.extUri.ignorePathCasing(fq.folder);
                    const folderResults = await proxy.searchDirectory(handle, query, fq, ignorePathCasing, queryId);
                    for (const folderResult of folderResults.results) {
                        results.push((0, marshalling_1.revive)(folderResult));
                    }
                    if (folderResults.limitHit) {
                        limitHit = true;
                    }
                }));
                queryDisposables.dispose();
                const result = { messages: [], results, limitHit };
                return result;
            }
            catch (e) {
                console.error('Error performing web worker text search', e);
                return {
                    results: [],
                    messages: [{
                            text: (0, nls_1.localize)('errorSearchText', "Unable to search with Web Worker text searcher"), type: search_1.TextSearchCompleteMessageType.Warning
                        }],
                };
            }
        }
        async fileSearch(query, token) {
            try {
                const queryDisposables = new lifecycle_1.DisposableStore();
                let limitHit = false;
                const proxy = await this._getOrCreateWorker().getProxyObject();
                const results = [];
                await Promise.all(query.folderQueries.map(async (fq) => {
                    const queryId = this.queryId++;
                    queryDisposables.add(token?.onCancellationRequested(e => this.cancelQuery(queryId)) || lifecycle_1.Disposable.None);
                    const handle = await this.fileSystemProvider.getHandle(fq.folder);
                    if (!handle || !webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                        console.error('Could not get directory handle for ', fq);
                        return;
                    }
                    const caseSensitive = this.uriIdentityService.extUri.ignorePathCasing(fq.folder);
                    const folderResults = await proxy.listDirectory(handle, query, fq, caseSensitive, queryId);
                    for (const folderResult of folderResults.results) {
                        results.push({ resource: uri_1.URI.joinPath(fq.folder, folderResult) });
                    }
                    if (folderResults.limitHit) {
                        limitHit = true;
                    }
                }));
                queryDisposables.dispose();
                const result = { messages: [], results, limitHit };
                return result;
            }
            catch (e) {
                console.error('Error performing web worker file search', e);
                return {
                    results: [],
                    messages: [{
                            text: (0, nls_1.localize)('errorSearchFile', "Unable to search with Web Worker file searcher"), type: search_1.TextSearchCompleteMessageType.Warning
                        }],
                };
            }
        }
        async clearCache(cacheKey) {
            if (this.cache?.key === cacheKey) {
                this.cache = undefined;
            }
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/services/search/worker/localFileSearch', this));
                }
                catch (err) {
                    (0, simpleWorker_1.logOnceWebWorkerWarning)(err);
                    throw err;
                }
            }
            return this._worker;
        }
    };
    exports.LocalFileSearchWorkerClient = LocalFileSearchWorkerClient;
    __decorate([
        decorators_1.memoize
    ], LocalFileSearchWorkerClient.prototype, "fileSystemProvider", null);
    exports.LocalFileSearchWorkerClient = LocalFileSearchWorkerClient = __decorate([
        __param(0, files_1.IFileService),
        __param(1, uriIdentity_1.IUriIdentityService)
    ], LocalFileSearchWorkerClient);
    (0, extensions_2.registerSingleton)(search_1.ISearchService, RemoteSearchService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9icm93c2VyL3NlYXJjaFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLDZCQUFhO1FBQ3JELFlBQ2dCLFlBQTJCLEVBQzFCLGFBQTZCLEVBQzFCLGdCQUFtQyxFQUN6QyxVQUF1QixFQUNqQixnQkFBbUMsRUFDeEMsV0FBeUIsRUFDQyxvQkFBMkMsRUFDOUQsa0JBQXVDO1lBRTVELEtBQUssQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUg1RSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBSW5GLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUM3RixJQUFJLENBQUMsNEJBQTRCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLG1DQUEyQixjQUFjLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsNEJBQTRCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLG1DQUEyQixjQUFjLENBQUMsQ0FBQztRQUMxRixDQUFDO0tBQ0QsQ0FBQTtJQWhCWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQUU3QixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FB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