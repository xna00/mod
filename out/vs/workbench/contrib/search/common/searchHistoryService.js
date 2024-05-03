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
define(["require", "exports", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, storage_1, types_1, instantiation_1) {
    "use strict";
    var SearchHistoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchHistoryService = exports.ISearchHistoryService = void 0;
    exports.ISearchHistoryService = (0, instantiation_1.createDecorator)('searchHistoryService');
    let SearchHistoryService = class SearchHistoryService {
        static { SearchHistoryService_1 = this; }
        static { this.SEARCH_HISTORY_KEY = 'workbench.search.history'; }
        constructor(storageService) {
            this.storageService = storageService;
            this._onDidClearHistory = new event_1.Emitter();
            this.onDidClearHistory = this._onDidClearHistory.event;
        }
        clearHistory() {
            this.storageService.remove(SearchHistoryService_1.SEARCH_HISTORY_KEY, 1 /* StorageScope.WORKSPACE */);
            this._onDidClearHistory.fire();
        }
        load() {
            let result;
            const raw = this.storageService.get(SearchHistoryService_1.SEARCH_HISTORY_KEY, 1 /* StorageScope.WORKSPACE */);
            if (raw) {
                try {
                    result = JSON.parse(raw);
                }
                catch (e) {
                    // Invalid data
                }
            }
            return result || {};
        }
        save(history) {
            if ((0, types_1.isEmptyObject)(history)) {
                this.storageService.remove(SearchHistoryService_1.SEARCH_HISTORY_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(SearchHistoryService_1.SEARCH_HISTORY_KEY, JSON.stringify(history), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
        }
    };
    exports.SearchHistoryService = SearchHistoryService;
    exports.SearchHistoryService = SearchHistoryService = SearchHistoryService_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], SearchHistoryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoSGlzdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9jb21tb24vc2VhcmNoSGlzdG9yeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWVuRixRQUFBLHFCQUFxQixHQUFHLElBQUEsK0JBQWUsRUFBd0Isc0JBQXNCLENBQUMsQ0FBQztJQVM3RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjs7aUJBR1QsdUJBQWtCLEdBQUcsMEJBQTBCLEFBQTdCLENBQThCO1FBS3ZFLFlBQ2tCLGNBQWdEO1lBQS9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUpqRCx1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ2pELHNCQUFpQixHQUFnQixJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1FBSXBFLENBQUM7UUFFTCxZQUFZO1lBQ1gsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsc0JBQW9CLENBQUMsa0JBQWtCLGlDQUF5QixDQUFDO1lBQzVGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksTUFBd0MsQ0FBQztZQUM3QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxzQkFBb0IsQ0FBQyxrQkFBa0IsaUNBQXlCLENBQUM7WUFFckcsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVCxJQUFJLENBQUM7b0JBQ0osTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixlQUFlO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQTZCO1lBQ2pDLElBQUksSUFBQSxxQkFBYSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLHNCQUFvQixDQUFDLGtCQUFrQixpQ0FBeUIsQ0FBQztZQUM3RixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQW9CLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsNkRBQTZDLENBQUM7WUFDekksQ0FBQztRQUNGLENBQUM7O0lBdENXLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBUzlCLFdBQUEseUJBQWUsQ0FBQTtPQVRMLG9CQUFvQixDQXVDaEMifQ==