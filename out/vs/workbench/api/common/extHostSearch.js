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
define(["require", "exports", "vs/base/common/lifecycle", "../common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/search/common/fileSearchManager", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/platform/log/common/log", "vs/base/common/uri", "vs/workbench/services/search/common/textSearchManager"], function (require, exports, lifecycle_1, extHost_protocol_1, instantiation_1, fileSearchManager_1, extHostRpcService_1, extHostUriTransformerService_1, log_1, uri_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostSearch = exports.IExtHostSearch = void 0;
    exports.reviveQuery = reviveQuery;
    exports.IExtHostSearch = (0, instantiation_1.createDecorator)('IExtHostSearch');
    let ExtHostSearch = class ExtHostSearch {
        constructor(extHostRpc, _uriTransformer, _logService) {
            this.extHostRpc = extHostRpc;
            this._uriTransformer = _uriTransformer;
            this._logService = _logService;
            this._proxy = this.extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadSearch);
            this._handlePool = 0;
            this._textSearchProvider = new Map();
            this._textSearchUsedSchemes = new Set();
            this._aiTextSearchProvider = new Map();
            this._aiTextSearchUsedSchemes = new Set();
            this._fileSearchProvider = new Map();
            this._fileSearchUsedSchemes = new Set();
            this._fileSearchManager = new fileSearchManager_1.FileSearchManager();
        }
        _transformScheme(scheme) {
            return this._uriTransformer.transformOutgoingScheme(scheme);
        }
        registerTextSearchProvider(scheme, provider) {
            if (this._textSearchUsedSchemes.has(scheme)) {
                throw new Error(`a text search provider for the scheme '${scheme}' is already registered`);
            }
            this._textSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._textSearchProvider.set(handle, provider);
            this._proxy.$registerTextSearchProvider(handle, this._transformScheme(scheme));
            return (0, lifecycle_1.toDisposable)(() => {
                this._textSearchUsedSchemes.delete(scheme);
                this._textSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        registerAITextSearchProvider(scheme, provider) {
            if (this._aiTextSearchUsedSchemes.has(scheme)) {
                throw new Error(`an AI text search provider for the scheme '${scheme}'is already registered`);
            }
            this._aiTextSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._aiTextSearchProvider.set(handle, provider);
            this._proxy.$registerAITextSearchProvider(handle, this._transformScheme(scheme));
            return (0, lifecycle_1.toDisposable)(() => {
                this._aiTextSearchUsedSchemes.delete(scheme);
                this._aiTextSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        registerFileSearchProvider(scheme, provider) {
            if (this._fileSearchUsedSchemes.has(scheme)) {
                throw new Error(`a file search provider for the scheme '${scheme}' is already registered`);
            }
            this._fileSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._fileSearchProvider.set(handle, provider);
            this._proxy.$registerFileSearchProvider(handle, this._transformScheme(scheme));
            return (0, lifecycle_1.toDisposable)(() => {
                this._fileSearchUsedSchemes.delete(scheme);
                this._fileSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        $provideFileSearchResults(handle, session, rawQuery, token) {
            const query = reviveQuery(rawQuery);
            const provider = this._fileSearchProvider.get(handle);
            if (provider) {
                return this._fileSearchManager.fileSearch(query, provider, batch => {
                    this._proxy.$handleFileMatch(handle, session, batch.map(p => p.resource));
                }, token);
            }
            else {
                throw new Error('3 unknown provider: ' + handle);
            }
        }
        async doInternalFileSearchWithCustomCallback(query, token, handleFileMatch) {
            return { messages: [] };
        }
        $clearCache(cacheKey) {
            this._fileSearchManager.clearCache(cacheKey);
            return Promise.resolve(undefined);
        }
        $provideTextSearchResults(handle, session, rawQuery, token) {
            const provider = this._textSearchProvider.get(handle);
            if (!provider || !provider.provideTextSearchResults) {
                throw new Error(`2 Unknown provider ${handle}`);
            }
            const query = reviveQuery(rawQuery);
            const engine = this.createTextSearchManager(query, provider);
            return engine.search(progress => this._proxy.$handleTextMatch(handle, session, progress), token);
        }
        $provideAITextSearchResults(handle, session, rawQuery, token) {
            const provider = this._aiTextSearchProvider.get(handle);
            if (!provider || !provider.provideAITextSearchResults) {
                throw new Error(`1 Unknown provider ${handle}`);
            }
            const query = reviveQuery(rawQuery);
            const engine = this.createAITextSearchManager(query, provider);
            return engine.search(progress => this._proxy.$handleTextMatch(handle, session, progress), token);
        }
        $enableExtensionHostSearch() { }
        createTextSearchManager(query, provider) {
            return new textSearchManager_1.TextSearchManager({ query, provider }, {
                readdir: resource => Promise.resolve([]),
                toCanonicalName: encoding => encoding
            }, 'textSearchProvider');
        }
        createAITextSearchManager(query, provider) {
            return new textSearchManager_1.TextSearchManager({ query, provider }, {
                readdir: resource => Promise.resolve([]),
                toCanonicalName: encoding => encoding
            }, 'aiTextSearchProvider');
        }
    };
    exports.ExtHostSearch = ExtHostSearch;
    exports.ExtHostSearch = ExtHostSearch = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostUriTransformerService_1.IURITransformerService),
        __param(2, log_1.ILogService)
    ], ExtHostSearch);
    function reviveQuery(rawQuery) {
        return {
            ...rawQuery, // TODO@rob ???
            ...{
                folderQueries: rawQuery.folderQueries && rawQuery.folderQueries.map(reviveFolderQuery),
                extraFileResources: rawQuery.extraFileResources && rawQuery.extraFileResources.map(components => uri_1.URI.revive(components))
            }
        };
    }
    function reviveFolderQuery(rawFolderQuery) {
        return {
            ...rawFolderQuery,
            folder: uri_1.URI.revive(rawFolderQuery.folder)
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFNlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUErSmhHLGtDQVFDO0lBakpZLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZ0JBQWdCLENBQUMsQ0FBQztJQUV6RSxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFhO1FBZ0J6QixZQUNxQixVQUFzQyxFQUNsQyxlQUFpRCxFQUM1RCxXQUFrQztZQUZuQixlQUFVLEdBQVYsVUFBVSxDQUFvQjtZQUN4QixvQkFBZSxHQUFmLGVBQWUsQ0FBd0I7WUFDbEQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFqQjdCLFdBQU0sR0FBMEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2hHLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1lBRWpCLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1lBQ25FLDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFFM0MsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQXVDLENBQUM7WUFDdkUsNkJBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUU3Qyx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztZQUNuRSwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBRTNDLHVCQUFrQixHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztRQU0xRCxDQUFDO1FBRUssZ0JBQWdCLENBQUMsTUFBYztZQUN4QyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELDBCQUEwQixDQUFDLE1BQWMsRUFBRSxRQUFtQztZQUM3RSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsTUFBTSx5QkFBeUIsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFFRCxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMvRSxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsNEJBQTRCLENBQUMsTUFBYyxFQUFFLFFBQXFDO1lBQ2pGLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxNQUFNLHdCQUF3QixDQUFDLENBQUM7WUFDL0YsQ0FBQztZQUVELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCwwQkFBMEIsQ0FBQyxNQUFjLEVBQUUsUUFBbUM7WUFDN0UsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLE1BQU0seUJBQXlCLENBQUMsQ0FBQztZQUM1RixDQUFDO1lBRUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDL0UsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELHlCQUF5QixDQUFDLE1BQWMsRUFBRSxPQUFlLEVBQUUsUUFBdUIsRUFBRSxLQUErQjtZQUNsSCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNsRSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBRyxNQUFNLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxLQUFpQixFQUFFLEtBQXdCLEVBQUUsZUFBc0M7WUFDL0gsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsV0FBVyxDQUFDLFFBQWdCO1lBQzNCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFN0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCx5QkFBeUIsQ0FBQyxNQUFjLEVBQUUsT0FBZSxFQUFFLFFBQXVCLEVBQUUsS0FBK0I7WUFDbEgsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3JELE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzdELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRUQsMkJBQTJCLENBQUMsTUFBYyxFQUFFLE9BQWUsRUFBRSxRQUF5QixFQUFFLEtBQStCO1lBQ3RILE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMvRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUVELDBCQUEwQixLQUFXLENBQUM7UUFFNUIsdUJBQXVCLENBQUMsS0FBaUIsRUFBRSxRQUFtQztZQUN2RixPQUFPLElBQUkscUNBQWlCLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQ2pELE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxlQUFlLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO2FBQ3JDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRVMseUJBQXlCLENBQUMsS0FBbUIsRUFBRSxRQUFxQztZQUM3RixPQUFPLElBQUkscUNBQWlCLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQ2pELE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxlQUFlLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRO2FBQ3JDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQ0QsQ0FBQTtJQXJJWSxzQ0FBYTs0QkFBYixhQUFhO1FBaUJ2QixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEscURBQXNCLENBQUE7UUFDdEIsV0FBQSxpQkFBVyxDQUFBO09BbkJELGFBQWEsQ0FxSXpCO0lBRUQsU0FBZ0IsV0FBVyxDQUFzQixRQUFXO1FBQzNELE9BQU87WUFDTixHQUFRLFFBQVEsRUFBRSxlQUFlO1lBQ2pDLEdBQUc7Z0JBQ0YsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3RGLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsSUFBSSxRQUFRLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUN4SDtTQUNELENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxjQUEyQztRQUNyRSxPQUFPO1lBQ04sR0FBRyxjQUFjO1lBQ2pCLE1BQU0sRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7U0FDekMsQ0FBQztJQUNILENBQUMifQ==