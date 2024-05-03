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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/native/common/native", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/network"], function (require, exports, actions_1, nls, native_1, environmentService_1, files_1, resources_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenExtensionLogsFolderAction = exports.OpenLogsFolderAction = void 0;
    let OpenLogsFolderAction = class OpenLogsFolderAction extends actions_1.Action {
        static { this.ID = 'workbench.action.openLogsFolder'; }
        static { this.TITLE = nls.localize2('openLogsFolder', "Open Logs Folder"); }
        constructor(id, label, environmentService, nativeHostService) {
            super(id, label);
            this.environmentService = environmentService;
            this.nativeHostService = nativeHostService;
        }
        run() {
            return this.nativeHostService.showItemInFolder((0, resources_1.joinPath)(this.environmentService.logsHome, 'main.log').with({ scheme: network_1.Schemas.file }).fsPath);
        }
    };
    exports.OpenLogsFolderAction = OpenLogsFolderAction;
    exports.OpenLogsFolderAction = OpenLogsFolderAction = __decorate([
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(3, native_1.INativeHostService)
    ], OpenLogsFolderAction);
    let OpenExtensionLogsFolderAction = class OpenExtensionLogsFolderAction extends actions_1.Action {
        static { this.ID = 'workbench.action.openExtensionLogsFolder'; }
        static { this.TITLE = nls.localize2('openExtensionLogsFolder', "Open Extension Logs Folder"); }
        constructor(id, label, environmentSerice, fileService, nativeHostService) {
            super(id, label);
            this.environmentSerice = environmentSerice;
            this.fileService = fileService;
            this.nativeHostService = nativeHostService;
        }
        async run() {
            const folderStat = await this.fileService.resolve(this.environmentSerice.extHostLogsPath);
            if (folderStat.children && folderStat.children[0]) {
                return this.nativeHostService.showItemInFolder(folderStat.children[0].resource.with({ scheme: network_1.Schemas.file }).fsPath);
            }
        }
    };
    exports.OpenExtensionLogsFolderAction = OpenExtensionLogsFolderAction;
    exports.OpenExtensionLogsFolderAction = OpenExtensionLogsFolderAction = __decorate([
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, native_1.INativeHostService)
    ], OpenExtensionLogsFolderAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvZ3MvZWxlY3Ryb24tc2FuZGJveC9sb2dzQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxnQkFBTTtpQkFFL0IsT0FBRSxHQUFHLGlDQUFpQyxBQUFwQyxDQUFxQztpQkFDdkMsVUFBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsQUFBdEQsQ0FBdUQ7UUFFNUUsWUFBWSxFQUFVLEVBQUUsS0FBYSxFQUNpQixrQkFBc0QsRUFDdEUsaUJBQXFDO1lBRTFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFIb0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQztZQUN0RSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1FBRzNFLENBQUM7UUFFUSxHQUFHO1lBQ1gsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsSUFBQSxvQkFBUSxFQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5SSxDQUFDOztJQWRXLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBTTlCLFdBQUEsdURBQWtDLENBQUE7UUFDbEMsV0FBQSwyQkFBa0IsQ0FBQTtPQVBSLG9CQUFvQixDQWVoQztJQUVNLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsZ0JBQU07aUJBRXhDLE9BQUUsR0FBRywwQ0FBMEMsQUFBN0MsQ0FBOEM7aUJBQ2hELFVBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLHlCQUF5QixFQUFFLDRCQUE0QixDQUFDLEFBQXpFLENBQTBFO1FBRS9GLFlBQVksRUFBVSxFQUFFLEtBQWEsRUFDaUIsaUJBQXFELEVBQzNFLFdBQXlCLEVBQ25CLGlCQUFxQztZQUUxRSxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBSm9DLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0M7WUFDM0UsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQUczRSxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDMUYsSUFBSSxVQUFVLENBQUMsUUFBUSxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2SCxDQUFDO1FBQ0YsQ0FBQzs7SUFsQlcsc0VBQTZCOzRDQUE3Qiw2QkFBNkI7UUFNdkMsV0FBQSx1REFBa0MsQ0FBQTtRQUNsQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDJCQUFrQixDQUFBO09BUlIsNkJBQTZCLENBbUJ6QyJ9