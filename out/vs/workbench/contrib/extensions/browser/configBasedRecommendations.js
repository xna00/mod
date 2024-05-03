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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/nls", "vs/platform/workspace/common/workspace", "vs/base/common/event"], function (require, exports, extensionManagement_1, extensionRecommendations_1, nls_1, workspace_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigBasedRecommendations = void 0;
    let ConfigBasedRecommendations = class ConfigBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get otherRecommendations() { return this._otherRecommendations; }
        get importantRecommendations() { return this._importantRecommendations; }
        get recommendations() { return [...this.importantRecommendations, ...this.otherRecommendations]; }
        constructor(extensionTipsService, workspaceContextService) {
            super();
            this.extensionTipsService = extensionTipsService;
            this.workspaceContextService = workspaceContextService;
            this.importantTips = [];
            this.otherTips = [];
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this._otherRecommendations = [];
            this._importantRecommendations = [];
        }
        async doActivate() {
            await this.fetch();
            this._register(this.workspaceContextService.onDidChangeWorkspaceFolders(e => this.onWorkspaceFoldersChanged(e)));
        }
        async fetch() {
            const workspace = this.workspaceContextService.getWorkspace();
            const importantTips = new Map();
            const otherTips = new Map();
            for (const folder of workspace.folders) {
                const configBasedTips = await this.extensionTipsService.getConfigBasedTips(folder.uri);
                for (const tip of configBasedTips) {
                    if (tip.important) {
                        importantTips.set(tip.extensionId, tip);
                    }
                    else {
                        otherTips.set(tip.extensionId, tip);
                    }
                }
            }
            this.importantTips = [...importantTips.values()];
            this.otherTips = [...otherTips.values()].filter(tip => !importantTips.has(tip.extensionId));
            this._otherRecommendations = this.otherTips.map(tip => this.toExtensionRecommendation(tip));
            this._importantRecommendations = this.importantTips.map(tip => this.toExtensionRecommendation(tip));
        }
        async onWorkspaceFoldersChanged(event) {
            if (event.added.length) {
                const oldImportantRecommended = this.importantTips;
                await this.fetch();
                // Suggest only if at least one of the newly added recommendations was not suggested before
                if (this.importantTips.some(current => oldImportantRecommended.every(old => current.extensionId !== old.extensionId))) {
                    this._onDidChangeRecommendations.fire();
                }
            }
        }
        toExtensionRecommendation(tip) {
            return {
                extension: tip.extensionId,
                reason: {
                    reasonId: 3 /* ExtensionRecommendationReason.WorkspaceConfig */,
                    reasonText: (0, nls_1.localize)('exeBasedRecommendation', "This extension is recommended because of the current workspace configuration")
                },
                whenNotInstalled: tip.whenNotInstalled
            };
        }
    };
    exports.ConfigBasedRecommendations = ConfigBasedRecommendations;
    exports.ConfigBasedRecommendations = ConfigBasedRecommendations = __decorate([
        __param(0, extensionManagement_1.IExtensionTipsService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ConfigBasedRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnQmFzZWRSZWNvbW1lbmRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9jb25maWdCYXNlZFJlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxtREFBd0I7UUFTdkUsSUFBSSxvQkFBb0IsS0FBd0QsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBR3BILElBQUksd0JBQXdCLEtBQXdELE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztRQUU1SCxJQUFJLGVBQWUsS0FBd0QsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXJKLFlBQ3dCLG9CQUE0RCxFQUN6RCx1QkFBa0U7WUFFNUYsS0FBSyxFQUFFLENBQUM7WUFIZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN4Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBaEJyRixrQkFBYSxHQUErQixFQUFFLENBQUM7WUFDL0MsY0FBUyxHQUErQixFQUFFLENBQUM7WUFFM0MsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDakUsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQUVyRSwwQkFBcUIsR0FBeUMsRUFBRSxDQUFDO1lBR2pFLDhCQUF5QixHQUF5QyxFQUFFLENBQUM7UUFVN0UsQ0FBQztRQUVTLEtBQUssQ0FBQyxV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