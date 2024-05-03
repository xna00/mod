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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig"], function (require, exports, arrays_1, event_1, lifecycle_1, extensions_1, storage_1, extensionRecommendations_1, workspaceExtensionsConfig_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionIgnoredRecommendationsService = void 0;
    const ignoredRecommendationsStorageKey = 'extensionsAssistant/ignored_recommendations';
    let ExtensionIgnoredRecommendationsService = class ExtensionIgnoredRecommendationsService extends lifecycle_1.Disposable {
        get globalIgnoredRecommendations() { return [...this._globalIgnoredRecommendations]; }
        get ignoredRecommendations() { return (0, arrays_1.distinct)([...this.globalIgnoredRecommendations, ...this.ignoredWorkspaceRecommendations]); }
        constructor(workspaceExtensionsConfigService, storageService) {
            super();
            this.workspaceExtensionsConfigService = workspaceExtensionsConfigService;
            this.storageService = storageService;
            this._onDidChangeIgnoredRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeIgnoredRecommendations = this._onDidChangeIgnoredRecommendations.event;
            // Global Ignored Recommendations
            this._globalIgnoredRecommendations = [];
            this._onDidChangeGlobalIgnoredRecommendation = this._register(new event_1.Emitter());
            this.onDidChangeGlobalIgnoredRecommendation = this._onDidChangeGlobalIgnoredRecommendation.event;
            // Ignored Workspace Recommendations
            this.ignoredWorkspaceRecommendations = [];
            this._globalIgnoredRecommendations = this.getCachedIgnoredRecommendations();
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, ignoredRecommendationsStorageKey, this._register(new lifecycle_1.DisposableStore()))(e => this.onDidStorageChange()));
            this.initIgnoredWorkspaceRecommendations();
        }
        async initIgnoredWorkspaceRecommendations() {
            this.ignoredWorkspaceRecommendations = await this.workspaceExtensionsConfigService.getUnwantedRecommendations();
            this._onDidChangeIgnoredRecommendations.fire();
            this._register(this.workspaceExtensionsConfigService.onDidChangeExtensionsConfigs(async () => {
                this.ignoredWorkspaceRecommendations = await this.workspaceExtensionsConfigService.getUnwantedRecommendations();
                this._onDidChangeIgnoredRecommendations.fire();
            }));
        }
        toggleGlobalIgnoredRecommendation(extensionId, shouldIgnore) {
            extensionId = extensionId.toLowerCase();
            const ignored = this._globalIgnoredRecommendations.indexOf(extensionId) !== -1;
            if (ignored === shouldIgnore) {
                return;
            }
            this._globalIgnoredRecommendations = shouldIgnore ? [...this._globalIgnoredRecommendations, extensionId] : this._globalIgnoredRecommendations.filter(id => id !== extensionId);
            this.storeCachedIgnoredRecommendations(this._globalIgnoredRecommendations);
            this._onDidChangeGlobalIgnoredRecommendation.fire({ extensionId, isRecommended: !shouldIgnore });
            this._onDidChangeIgnoredRecommendations.fire();
        }
        getCachedIgnoredRecommendations() {
            const ignoredRecommendations = JSON.parse(this.ignoredRecommendationsValue);
            return ignoredRecommendations.map(e => e.toLowerCase());
        }
        onDidStorageChange() {
            if (this.ignoredRecommendationsValue !== this.getStoredIgnoredRecommendationsValue() /* This checks if current window changed the value or not */) {
                this._ignoredRecommendationsValue = undefined;
                this._globalIgnoredRecommendations = this.getCachedIgnoredRecommendations();
                this._onDidChangeIgnoredRecommendations.fire();
            }
        }
        storeCachedIgnoredRecommendations(ignoredRecommendations) {
            this.ignoredRecommendationsValue = JSON.stringify(ignoredRecommendations);
        }
        get ignoredRecommendationsValue() {
            if (!this._ignoredRecommendationsValue) {
                this._ignoredRecommendationsValue = this.getStoredIgnoredRecommendationsValue();
            }
            return this._ignoredRecommendationsValue;
        }
        set ignoredRecommendationsValue(ignoredRecommendationsValue) {
            if (this.ignoredRecommendationsValue !== ignoredRecommendationsValue) {
                this._ignoredRecommendationsValue = ignoredRecommendationsValue;
                this.setStoredIgnoredRecommendationsValue(ignoredRecommendationsValue);
            }
        }
        getStoredIgnoredRecommendationsValue() {
            return this.storageService.get(ignoredRecommendationsStorageKey, 0 /* StorageScope.PROFILE */, '[]');
        }
        setStoredIgnoredRecommendationsValue(value) {
            this.storageService.store(ignoredRecommendationsStorageKey, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    exports.ExtensionIgnoredRecommendationsService = ExtensionIgnoredRecommendationsService;
    exports.ExtensionIgnoredRecommendationsService = ExtensionIgnoredRecommendationsService = __decorate([
        __param(0, workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService),
        __param(1, storage_1.IStorageService)
    ], ExtensionIgnoredRecommendationsService);
    (0, extensions_1.registerSingleton)(extensionRecommendations_1.IExtensionIgnoredRecommendationsService, ExtensionIgnoredRecommendationsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSWdub3JlZFJlY29tbWVuZGF0aW9uc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnMvY29tbW9uL2V4dGVuc2lvbklnbm9yZWRSZWNvbW1lbmRhdGlvbnNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxNQUFNLGdDQUFnQyxHQUFHLDZDQUE2QyxDQUFDO0lBRWhGLElBQU0sc0NBQXNDLEdBQTVDLE1BQU0sc0NBQXVDLFNBQVEsc0JBQVU7UUFTckUsSUFBSSw0QkFBNEIsS0FBZSxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFPaEcsSUFBSSxzQkFBc0IsS0FBZSxPQUFPLElBQUEsaUJBQVEsRUFBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUksWUFDb0MsZ0NBQW9GLEVBQ3RHLGNBQWdEO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBSDRDLHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBbUM7WUFDckYsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBaEIxRCx1Q0FBa0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN4RSxzQ0FBaUMsR0FBRyxJQUFJLENBQUMsa0NBQWtDLENBQUMsS0FBSyxDQUFDO1lBRTNGLGlDQUFpQztZQUN6QixrQ0FBNkIsR0FBYSxFQUFFLENBQUM7WUFFN0MsNENBQXVDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMkMsQ0FB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