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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/search/common/search", "../common/extHost.protocol", "vs/base/common/marshalling", "vs/workbench/contrib/search/common/constants", "vs/platform/contextkey/common/contextkey"], function (require, exports, cancellation_1, lifecycle_1, uri_1, configuration_1, telemetry_1, extHostCustomers_1, search_1, extHost_protocol_1, marshalling_1, Constants, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSearch = void 0;
    let MainThreadSearch = class MainThreadSearch {
        constructor(extHostContext, _searchService, _telemetryService, _configurationService, contextKeyService) {
            this._searchService = _searchService;
            this._telemetryService = _telemetryService;
            this.contextKeyService = contextKeyService;
            this._searchProvider = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSearch);
            this._proxy.$enableExtensionHostSearch();
        }
        dispose() {
            this._searchProvider.forEach(value => value.dispose());
            this._searchProvider.clear();
        }
        $registerTextSearchProvider(handle, scheme) {
            this._searchProvider.set(handle, new RemoteSearchProvider(this._searchService, 1 /* SearchProviderType.text */, scheme, handle, this._proxy));
        }
        $registerAITextSearchProvider(handle, scheme) {
            Constants.SearchContext.hasAIResultProvider.bindTo(this.contextKeyService).set(true);
            this._searchProvider.set(handle, new RemoteSearchProvider(this._searchService, 2 /* SearchProviderType.aiText */, scheme, handle, this._proxy));
        }
        $registerFileSearchProvider(handle, scheme) {
            this._searchProvider.set(handle, new RemoteSearchProvider(this._searchService, 0 /* SearchProviderType.file */, scheme, handle, this._proxy));
        }
        $unregisterProvider(handle) {
            (0, lifecycle_1.dispose)(this._searchProvider.get(handle));
            this._searchProvider.delete(handle);
        }
        $handleFileMatch(handle, session, data) {
            const provider = this._searchProvider.get(handle);
            if (!provider) {
                throw new Error('Got result for unknown provider');
            }
            provider.handleFindMatch(session, data);
        }
        $handleTextMatch(handle, session, data) {
            const provider = this._searchProvider.get(handle);
            if (!provider) {
                throw new Error('Got result for unknown provider');
            }
            provider.handleFindMatch(session, data);
        }
        $handleTelemetry(eventName, data) {
            this._telemetryService.publicLog(eventName, data);
        }
    };
    exports.MainThreadSearch = MainThreadSearch;
    exports.MainThreadSearch = MainThreadSearch = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSearch),
        __param(1, search_1.ISearchService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService)
    ], MainThreadSearch);
    class SearchOperation {
        static { this._idPool = 0; }
        constructor(progress, id = ++SearchOperation._idPool, matches = new Map()) {
            this.progress = progress;
            this.id = id;
            this.matches = matches;
            //
        }
        addMatch(match) {
            const existingMatch = this.matches.get(match.resource.toString());
            if (existingMatch) {
                // TODO@rob clean up text/file result types
                // If a file search returns the same file twice, we would enter this branch.
                // It's possible that could happen, #90813
                if (existingMatch.results && match.results) {
                    existingMatch.results.push(...match.results);
                }
            }
            else {
                this.matches.set(match.resource.toString(), match);
            }
            this.progress?.(match);
        }
    }
    class RemoteSearchProvider {
        constructor(searchService, type, _scheme, _handle, _proxy) {
            this._scheme = _scheme;
            this._handle = _handle;
            this._proxy = _proxy;
            this._registrations = new lifecycle_1.DisposableStore();
            this._searches = new Map();
            this._registrations.add(searchService.registerSearchResultProvider(this._scheme, type, this));
        }
        dispose() {
            this._registrations.dispose();
        }
        fileSearch(query, token = cancellation_1.CancellationToken.None) {
            return this.doSearch(query, undefined, token);
        }
        textSearch(query, onProgress, token = cancellation_1.CancellationToken.None) {
            return this.doSearch(query, onProgress, token);
        }
        doSearch(query, onProgress, token = cancellation_1.CancellationToken.None) {
            if (!query.folderQueries.length) {
                throw new Error('Empty folderQueries');
            }
            const search = new SearchOperation(onProgress);
            this._searches.set(search.id, search);
            const searchP = this._provideSearchResults(query, search.id, token);
            return Promise.resolve(searchP).then((result) => {
                this._searches.delete(search.id);
                return { results: Array.from(search.matches.values()), stats: result.stats, limitHit: result.limitHit, messages: result.messages };
            }, err => {
                this._searches.delete(search.id);
                return Promise.reject(err);
            });
        }
        clearCache(cacheKey) {
            return Promise.resolve(this._proxy.$clearCache(cacheKey));
        }
        handleFindMatch(session, dataOrUri) {
            const searchOp = this._searches.get(session);
            if (!searchOp) {
                // ignore...
                return;
            }
            dataOrUri.forEach(result => {
                if (result.results) {
                    searchOp.addMatch((0, marshalling_1.revive)(result));
                }
                else {
                    searchOp.addMatch({
                        resource: uri_1.URI.revive(result)
                    });
                }
            });
        }
        _provideSearchResults(query, session, token) {
            switch (query.type) {
                case 1 /* QueryType.File */:
                    return this._proxy.$provideFileSearchResults(this._handle, session, query, token);
                case 2 /* QueryType.Text */:
                    return this._proxy.$provideTextSearchResults(this._handle, session, query, token);
                default:
                    return this._proxy.$provideAITextSearchResults(this._handle, session, query, token);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRTZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBSzVCLFlBQ0MsY0FBK0IsRUFDZixjQUErQyxFQUM1QyxpQkFBcUQsRUFDakQscUJBQTRDLEVBQy9DLGlCQUErQztZQUhsQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUUxQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBUG5ELG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQWdDLENBQUM7WUFTMUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFRCwyQkFBMkIsQ0FBQyxNQUFjLEVBQUUsTUFBYztZQUN6RCxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxtQ0FBMkIsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN2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