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
define(["require", "exports", "vs/platform/keybinding/common/keybinding", "vs/platform/userDataSync/common/userDataSync", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfiguration"], function (require, exports, keybinding_1, userDataSync_1, extensions_1, resolverService_1, textResourceConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncUtilService = class UserDataSyncUtilService {
        constructor(keybindingsService, textModelService, textResourcePropertiesService, textResourceConfigurationService) {
            this.keybindingsService = keybindingsService;
            this.textModelService = textModelService;
            this.textResourcePropertiesService = textResourcePropertiesService;
            this.textResourceConfigurationService = textResourceConfigurationService;
        }
        async resolveDefaultIgnoredSettings() {
            return (0, userDataSync_1.getDefaultIgnoredSettings)();
        }
        async resolveUserBindings(userBindings) {
            const keys = {};
            for (const userbinding of userBindings) {
                keys[userbinding] = this.keybindingsService.resolveUserBinding(userbinding).map(part => part.getUserSettingsLabel()).join(' ');
            }
            return keys;
        }
        async resolveFormattingOptions(resource) {
            try {
                const modelReference = await this.textModelService.createModelReference(resource);
                const { insertSpaces, tabSize } = modelReference.object.textEditorModel.getOptions();
                const eol = modelReference.object.textEditorModel.getEOL();
                modelReference.dispose();
                return { eol, insertSpaces, tabSize };
            }
            catch (e) {
            }
            return {
                eol: this.textResourcePropertiesService.getEOL(resource),
                insertSpaces: !!this.textResourceConfigurationService.getValue(resource, 'editor.insertSpaces'),
                tabSize: this.textResourceConfigurationService.getValue(resource, 'editor.tabSize')
            };
        }
    };
    UserDataSyncUtilService = __decorate([
        __param(0, keybinding_1.IKeybindingService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(3, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], UserDataSyncUtilService);
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataSyncUtilService, UserDataSyncUtilService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jVXRpbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jVXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVdoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQUk1QixZQUNzQyxrQkFBc0MsRUFDdkMsZ0JBQW1DLEVBQ3RCLDZCQUE2RCxFQUMxRCxnQ0FBbUU7WUFIbEYsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN2QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3RCLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDMUQscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztRQUNwSCxDQUFDO1FBRUwsS0FBSyxDQUFDLDZCQUE2QjtZQUNsQyxPQUFPLElBQUEsd0NBQXlCLEdBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQixDQUFDLFlBQXNCO1lBQy9DLE1BQU0sSUFBSSxHQUE4QixFQUFFLENBQUM7WUFDM0MsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoSSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxDQUFDLHdCQUF3QixDQUFDLFFBQWE7WUFDM0MsSUFBSSxDQUFDO2dCQUNKLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyRixNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDM0QsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN6QixPQUFPLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUN2QyxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPO2dCQUNOLEdBQUcsRUFBRSxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztnQkFDeEQsWUFBWSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQztnQkFDL0YsT0FBTyxFQUFFLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDO2FBQ25GLENBQUM7UUFDSCxDQUFDO0tBRUQsQ0FBQTtJQXZDSyx1QkFBdUI7UUFLMUIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEsMERBQThCLENBQUE7UUFDOUIsV0FBQSw2REFBaUMsQ0FBQTtPQVI5Qix1QkFBdUIsQ0F1QzVCO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyx1Q0FBd0IsRUFBRSx1QkFBdUIsb0NBQTRCLENBQUMifQ==