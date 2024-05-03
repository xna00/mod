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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/rawSearchService", "vs/workbench/services/search/node/ripgrepSearchProvider", "vs/workbench/services/search/node/ripgrepSearchUtils", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, lifecycle_1, network_1, uri_1, pfs, log_1, extHostInitDataService_1, extHostRpcService_1, extHostSearch_1, extHostUriTransformerService_1, search_1, rawSearchService_1, ripgrepSearchProvider_1, ripgrepSearchUtils_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtHostSearch = void 0;
    let NativeExtHostSearch = class NativeExtHostSearch extends extHostSearch_1.ExtHostSearch {
        constructor(extHostRpc, initData, _uriTransformer, _logService) {
            super(extHostRpc, _uriTransformer, _logService);
            this._pfs = pfs; // allow extending for tests
            this._internalFileSearchHandle = -1;
            this._internalFileSearchProvider = null;
            this._registeredEHSearchProvider = false;
            this._disposables = new lifecycle_1.DisposableStore();
            const outputChannel = new ripgrepSearchUtils_1.OutputChannel('RipgrepSearchUD', this._logService);
            this._disposables.add(this.registerTextSearchProvider(network_1.Schemas.vscodeUserData, new ripgrepSearchProvider_1.RipgrepSearchProvider(outputChannel)));
            if (initData.remote.isRemote && initData.remote.authority) {
                this._registerEHSearchProviders();
            }
        }
        dispose() {
            this._disposables.dispose();
        }
        $enableExtensionHostSearch() {
            this._registerEHSearchProviders();
        }
        _registerEHSearchProviders() {
            if (this._registeredEHSearchProvider) {
                return;
            }
            this._registeredEHSearchProvider = true;
            const outputChannel = new ripgrepSearchUtils_1.OutputChannel('RipgrepSearchEH', this._logService);
            this._disposables.add(this.registerTextSearchProvider(network_1.Schemas.file, new ripgrepSearchProvider_1.RipgrepSearchProvider(outputChannel)));
            this._disposables.add(this.registerInternalFileSearchProvider(network_1.Schemas.file, new rawSearchService_1.SearchService('fileSearchProvider')));
        }
        registerInternalFileSearchProvider(scheme, provider) {
            const handle = this._handlePool++;
            this._internalFileSearchProvider = provider;
            this._internalFileSearchHandle = handle;
            this._proxy.$registerFileSearchProvider(handle, this._transformScheme(scheme));
            return (0, lifecycle_1.toDisposable)(() => {
                this._internalFileSearchProvider = null;
                this._proxy.$unregisterProvider(handle);
            });
        }
        $provideFileSearchResults(handle, session, rawQuery, token) {
            const query = (0, extHostSearch_1.reviveQuery)(rawQuery);
            if (handle === this._internalFileSearchHandle) {
                const start = Date.now();
                return this.doInternalFileSearch(handle, session, query, token).then(result => {
                    const elapsed = Date.now() - start;
                    this._logService.debug(`Ext host file search time: ${elapsed}ms`);
                    return result;
                });
            }
            return super.$provideFileSearchResults(handle, session, rawQuery, token);
        }
        doInternalFileSearchWithCustomCallback(rawQuery, token, handleFileMatch) {
            const onResult = (ev) => {
                if ((0, search_1.isSerializedFileMatch)(ev)) {
                    ev = [ev];
                }
                if (Array.isArray(ev)) {
                    handleFileMatch(ev.map(m => uri_1.URI.file(m.path)));
                    return;
                }
                if (ev.message) {
                    this._logService.debug('ExtHostSearch', ev.message);
                }
            };
            if (!this._internalFileSearchProvider) {
                throw new Error('No internal file search handler');
            }
            return this._internalFileSearchProvider.doFileSearch(rawQuery, onResult, token);
        }
        async doInternalFileSearch(handle, session, rawQuery, token) {
            return this.doInternalFileSearchWithCustomCallback(rawQuery, token, (data) => {
                this._proxy.$handleFileMatch(handle, session, data);
            });
        }
        $clearCache(cacheKey) {
            this._internalFileSearchProvider?.clearCache(cacheKey);
            return super.$clearCache(cacheKey);
        }
        createTextSearchManager(query, provider) {
            return new textSearchManager_1.NativeTextSearchManager(query, provider, undefined, 'textSearchProvider');
        }
    };
    exports.NativeExtHostSearch = NativeExtHostSearch;
    exports.NativeExtHostSearch = NativeExtHostSearch = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostUriTransformerService_1.IURITransformerService),
        __param(3, log_1.ILogService)
    ], NativeExtHostSearch);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9ub2RlL2V4dEhvc3RTZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLDZCQUFhO1FBV3JELFlBQ3FCLFVBQThCLEVBQ3pCLFFBQWlDLEVBQ2xDLGVBQXVDLEVBQ2xELFdBQXdCO1lBRXJDLEtBQUssQ0FBQyxVQUFVLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBZnZDLFNBQUksR0FBZSxHQUFHLENBQUMsQ0FBQyw0QkFBNEI7WUFFdEQsOEJBQXlCLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdkMsZ0NBQTJCLEdBQXlCLElBQUksQ0FBQztZQUV6RCxnQ0FBMkIsR0FBRyxLQUFLLENBQUM7WUFFM0IsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVVyRCxNQUFNLGFBQWEsR0FBRyxJQUFJLGtDQUFhLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxpQkFBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLDZDQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6SCxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQ25DLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxF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