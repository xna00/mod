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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/storage/common/storage", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookLoggingService"], function (require, exports, lifecycle_1, map_1, nls_1, actionCommonCategories_1, actions_1, storage_1, notebookKernelService_1, notebookLoggingService_1) {
    "use strict";
    var NotebookKernelHistoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookKernelHistoryService = void 0;
    const MAX_KERNELS_IN_HISTORY = 5;
    let NotebookKernelHistoryService = class NotebookKernelHistoryService extends lifecycle_1.Disposable {
        static { NotebookKernelHistoryService_1 = this; }
        static { this.STORAGE_KEY = 'notebook.kernelHistory'; }
        constructor(_storageService, _notebookKernelService, _notebookLoggingService) {
            super();
            this._storageService = _storageService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookLoggingService = _notebookLoggingService;
            this._mostRecentKernelsMap = {};
            this._loadState();
            this._register(this._storageService.onWillSaveState(() => this._saveState()));
            this._register(this._storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, NotebookKernelHistoryService_1.STORAGE_KEY, this._register(new lifecycle_1.DisposableStore()))(() => {
                this._loadState();
            }));
        }
        getKernels(notebook) {
            const allAvailableKernels = this._notebookKernelService.getMatchingKernel(notebook);
            const allKernels = allAvailableKernels.all;
            const selectedKernel = allAvailableKernels.selected;
            // We will suggest the only kernel
            const suggested = allAvailableKernels.all.length === 1 ? allAvailableKernels.all[0] : undefined;
            this._notebookLoggingService.debug('History', `getMatchingKernels: ${allAvailableKernels.all.length} kernels available for ${notebook.uri.path}. Selected: ${allAvailableKernels.selected?.label}. Suggested: ${suggested?.label}`);
            const mostRecentKernelIds = this._mostRecentKernelsMap[notebook.viewType] ? [...this._mostRecentKernelsMap[notebook.viewType].values()] : [];
            const all = mostRecentKernelIds.map(kernelId => allKernels.find(kernel => kernel.id === kernelId)).filter(kernel => !!kernel);
            this._notebookLoggingService.debug('History', `mru: ${mostRecentKernelIds.length} kernels in history, ${all.length} registered already.`);
            return {
                selected: selectedKernel ?? suggested,
                all
            };
        }
        addMostRecentKernel(kernel) {
            const key = kernel.id;
            const viewType = kernel.viewType;
            const recentKeynels = this._mostRecentKernelsMap[viewType] ?? new map_1.LinkedMap();
            recentKeynels.set(key, key, 1 /* Touch.AsOld */);
            if (recentKeynels.size > MAX_KERNELS_IN_HISTORY) {
                const reserved = [...recentKeynels.entries()].slice(0, MAX_KERNELS_IN_HISTORY);
                recentKeynels.fromJSON(reserved);
            }
            this._mostRecentKernelsMap[viewType] = recentKeynels;
        }
        _saveState() {
            let notEmpty = false;
            for (const [_, kernels] of Object.entries(this._mostRecentKernelsMap)) {
                notEmpty = notEmpty || kernels.size > 0;
            }
            if (notEmpty) {
                const serialized = this._serialize();
                this._storageService.store(NotebookKernelHistoryService_1.STORAGE_KEY, JSON.stringify(serialized), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
            else {
                this._storageService.remove(NotebookKernelHistoryService_1.STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
        _loadState() {
            const serialized = this._storageService.get(NotebookKernelHistoryService_1.STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            if (serialized) {
                try {
                    this._deserialize(JSON.parse(serialized));
                }
                catch (e) {
                    this._mostRecentKernelsMap = {};
                }
            }
            else {
                this._mostRecentKernelsMap = {};
            }
        }
        _serialize() {
            const result = Object.create(null);
            for (const [viewType, kernels] of Object.entries(this._mostRecentKernelsMap)) {
                result[viewType] = {
                    entries: [...kernels.values()]
                };
            }
            return result;
        }
        _deserialize(serialized) {
            this._mostRecentKernelsMap = {};
            for (const [viewType, kernels] of Object.entries(serialized)) {
                const linkedMap = new map_1.LinkedMap();
                const mapValues = [];
                for (const entry of kernels.entries) {
                    mapValues.push([entry, entry]);
                }
                linkedMap.fromJSON(mapValues);
                this._mostRecentKernelsMap[viewType] = linkedMap;
            }
        }
        _clear() {
            this._mostRecentKernelsMap = {};
            this._saveState();
        }
    };
    exports.NotebookKernelHistoryService = NotebookKernelHistoryService;
    exports.NotebookKernelHistoryService = NotebookKernelHistoryService = NotebookKernelHistoryService_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, notebookLoggingService_1.INotebookLoggingService)
    ], NotebookKernelHistoryService);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.clearNotebookKernelsMRUCache',
                title: (0, nls_1.localize2)('workbench.notebook.clearNotebookKernelsMRUCache', "Clear Notebook Kernels MRU Cache"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(notebookKernelService_1.INotebookKernelHistoryService);
            historyService._clear();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxIaXN0b3J5U2VydmljZUltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tLZXJuZWxIaXN0b3J5U2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9CaEcsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLENBQUM7SUFFMUIsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzQkFBVTs7aUJBRzVDLGdCQUFXLEdBQUcsd0JBQXdCLEFBQTNCLENBQTRCO1FBR3RELFlBQTZCLGVBQWlELEVBQ3JELHNCQUErRCxFQUM5RCx1QkFBaUU7WUFDMUYsS0FBSyxFQUFFLENBQUM7WUFIcUMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ3BDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFDN0MsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUpuRiwwQkFBcUIsR0FBaUQsRUFBRSxDQUFDO1lBT2hGLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixpQ0FBeUIsOEJBQTRCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtnQkFDbEssSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ25C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