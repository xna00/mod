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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferencesEditorInput"], function (require, exports, event_1, lifecycle_1, platform_1, resources_1, userDataProfile_1, userDataSync_1, viewsService_1, extensions_1, editorService_1, host_1, keybindingsEditorInput_1, preferencesEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncTrigger = void 0;
    let UserDataSyncTrigger = class UserDataSyncTrigger extends lifecycle_1.Disposable {
        constructor(editorService, userDataProfilesService, viewsService, userDataAutoSyncService, hostService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            const event = event_1.Event.filter(event_1.Event.any(event_1.Event.map(editorService.onDidActiveEditorChange, () => this.getUserDataEditorInputSource(editorService.activeEditor)), event_1.Event.map(event_1.Event.filter(viewsService.onDidChangeViewContainerVisibility, e => e.id === extensions_1.VIEWLET_ID && e.visible), e => e.id)), source => source !== undefined);
            if (platform_1.isWeb) {
                this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.map(hostService.onDidChangeFocus, () => 'windowFocus'), event_1.Event.map(event, source => source)), (last, source) => last ? [...last, source] : [source], 1000)(sources => userDataAutoSyncService.triggerSync(sources, true, false)));
            }
            else {
                this._register(event(source => userDataAutoSyncService.triggerSync([source], true, false)));
            }
        }
        getUserDataEditorInputSource(editorInput) {
            if (!editorInput) {
                return undefined;
            }
            if (editorInput instanceof preferencesEditorInput_1.SettingsEditor2Input) {
                return 'settingsEditor';
            }
            if (editorInput instanceof keybindingsEditorInput_1.KeybindingsEditorInput) {
                return 'keybindingsEditor';
            }
            const resource = editorInput.resource;
            if ((0, resources_1.isEqual)(resource, this.userDataProfilesService.defaultProfile.settingsResource)) {
                return 'settingsEditor';
            }
            if ((0, resources_1.isEqual)(resource, this.userDataProfilesService.defaultProfile.keybindingsResource)) {
                return 'keybindingsEditor';
            }
            return undefined;
        }
    };
    exports.UserDataSyncTrigger = UserDataSyncTrigger;
    exports.UserDataSyncTrigger = UserDataSyncTrigger = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, viewsService_1.IViewsService),
        __param(3, userDataSync_1.IUserDataAutoSyncService),
        __param(4, host_1.IHostService)
    ], UserDataSyncTrigger);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jVHJpZ2dlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFTeW5jL2Jyb3dzZXIvdXNlckRhdGFTeW5jVHJpZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFFbEQsWUFDaUIsYUFBNkIsRUFDRix1QkFBaUQsRUFDN0UsWUFBMkIsRUFDaEIsdUJBQWlELEVBQzdELFdBQXlCO1lBRXZDLEtBQUssRUFBRSxDQUFDO1lBTG1DLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFNNUYsTUFBTSxLQUFLLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FDekIsYUFBSyxDQUFDLEdBQUcsQ0FDUixhQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQ3JILGFBQUssQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsa0NBQWtDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLHVCQUFVLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUMxSCxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksZ0JBQUssRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLFFBQVEsQ0FDNUIsYUFBSyxDQUFDLEdBQUcsQ0FDUixhQUFLLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFDNUQsYUFBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFPLENBQUMsQ0FDbkMsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FDOUQsT0FBTyxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RixDQUFDO1FBQ0YsQ0FBQztRQUVPLDRCQUE0QixDQUFDLFdBQW9DO1lBQ3hFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUksV0FBVyxZQUFZLDZDQUFvQixFQUFFLENBQUM7Z0JBQ2pELE9BQU8sZ0JBQWdCLENBQUM7WUFDekIsQ0FBQztZQUNELElBQUksV0FBVyxZQUFZLCtDQUFzQixFQUFFLENBQUM7Z0JBQ25ELE9BQU8sbUJBQW1CLENBQUM7WUFDNUIsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDdEMsSUFBSSxJQUFBLG1CQUFPLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUNyRixPQUFPLGdCQUFnQixDQUFDO1lBQ3pCLENBQUM7WUFDRCxJQUFJLElBQUEsbUJBQU8sRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hGLE9BQU8sbUJBQW1CLENBQUM7WUFDNUIsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRCxDQUFBO0lBOUNZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBRzdCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSx1Q0FBd0IsQ0FBQTtRQUN4QixXQUFBLG1CQUFZLENBQUE7T0FQRixtQkFBbUIsQ0E4Qy9CIn0=