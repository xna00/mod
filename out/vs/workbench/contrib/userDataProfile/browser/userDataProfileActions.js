/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/base/common/codicons", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, actions_1, codicons_1, nls_1, actionCommonCategories_1, menuEntryActionViewItem_1, actions_2, commands_1, contextkey_1, notification_1, quickInput_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameProfileAction = void 0;
    class CreateTransientProfileAction extends actions_2.Action2 {
        static { this.ID = 'workbench.profiles.actions.createTemporaryProfile'; }
        static { this.TITLE = (0, nls_1.localize2)('create temporary profile', "Create a Temporary Profile"); }
        constructor() {
            super({
                id: CreateTransientProfileAction.ID,
                title: CreateTransientProfileAction.TITLE,
                category: userDataProfile_2.PROFILES_CATEGORY,
                f1: true,
                precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        async run(accessor) {
            return accessor.get(userDataProfile_2.IUserDataProfileManagementService).createAndEnterTransientProfile();
        }
    }
    (0, actions_2.registerAction2)(CreateTransientProfileAction);
    class RenameProfileAction extends actions_2.Action2 {
        static { this.ID = 'workbench.profiles.actions.renameProfile'; }
        constructor() {
            super({
                id: RenameProfileAction.ID,
                title: (0, nls_1.localize2)('rename profile', "Rename..."),
                category: userDataProfile_2.PROFILES_CATEGORY,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT, userDataProfile_2.HAS_PROFILES_CONTEXT),
            });
        }
        async run(accessor, profile) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const userDataProfileService = accessor.get(userDataProfile_2.IUserDataProfileService);
            const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
            const userDataProfileManagementService = accessor.get(userDataProfile_2.IUserDataProfileManagementService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (!profile) {
                profile = await this.pickProfile(quickInputService, userDataProfileService, userDataProfilesService);
            }
            if (!profile || profile.isDefault) {
                return;
            }
            const name = await quickInputService.input({
                value: profile.name,
                title: (0, nls_1.localize)('select profile to rename', 'Rename {0}', profile.name),
                validateInput: async (value) => {
                    if (profile.name !== value && userDataProfilesService.profiles.some(p => p.name === value)) {
                        return (0, nls_1.localize)('profileExists', "Profile with name {0} already exists.", value);
                    }
                    return undefined;
                }
            });
            if (name && name !== profile.name) {
                try {
                    await userDataProfileManagementService.updateProfile(profile, { name });
                }
                catch (error) {
                    notificationService.error(error);
                }
            }
        }
        async pickProfile(quickInputService, userDataProfileService, userDataProfilesService) {
            const profiles = userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient);
            if (!profiles.length) {
                return undefined;
            }
            const pick = await quickInputService.pick(profiles.map(profile => ({
                label: profile.name,
                description: profile.id === userDataProfileService.currentProfile.id ? (0, nls_1.localize)('current', "Current") : undefined,
                profile
            })), {
                title: (0, nls_1.localize)('rename specific profile', "Rename Profile..."),
                placeHolder: (0, nls_1.localize)('pick profile to rename', "Select Profile to Rename"),
            });
            return pick?.profile;
        }
    }
    exports.RenameProfileAction = RenameProfileAction;
    (0, actions_2.registerAction2)(RenameProfileAction);
    (0, actions_2.registerAction2)(class ManageProfilesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: userDataProfile_2.MANAGE_PROFILES_ACTION_ID,
                title: (0, nls_1.localize2)('mange', "Manage..."),
                category: userDataProfile_2.PROFILES_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT, userDataProfile_2.HAS_PROFILES_CONTEXT),
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const menuService = accessor.get(actions_2.IMenuService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const commandService = accessor.get(commands_1.ICommandService);
            const menu = menuService.createMenu(userDataProfile_2.ProfilesMenu, contextKeyService);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
            menu.dispose();
            if (actions.length) {
                const picks = actions.map(action => {
                    if (action instanceof actions_1.Separator) {
                        return { type: 'separator' };
                    }
                    return {
                        id: action.id,
                        label: `${action.label}${action.checked ? ` $(${codicons_1.Codicon.check.id})` : ''}`,
                    };
                });
                const pick = await quickInputService.pick(picks, { canPickMany: false, title: userDataProfile_2.PROFILES_CATEGORY.value });
                if (pick?.id) {
                    await commandService.executeCommand(pick.id);
                }
            }
        }
    });
    // Developer Actions
    (0, actions_2.registerAction2)(class CleanupProfilesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.profiles.actions.cleanupProfiles',
                title: (0, nls_1.localize2)('cleanup profile', "Cleanup Profiles"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        async run(accessor) {
            return accessor.get(userDataProfile_1.IUserDataProfilesService).cleanUp();
        }
    });
    (0, actions_2.registerAction2)(class ResetWorkspacesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.profiles.actions.resetWorkspaces',
                title: (0, nls_1.localize2)('reset workspaces', "Reset Workspace Profiles Associations"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        async run(accessor) {
            const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
            return userDataProfilesService.resetWorkspaces();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFQcm9maWxlL2Jyb3dzZXIvdXNlckRhdGFQcm9maWxlQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQU0sNEJBQTZCLFNBQVEsaUJBQU87aUJBQ2pDLE9BQUUsR0FBRyxtREFBbUQsQ0FBQztpQkFDekQsVUFBSyxHQUFHLElBQUEsZUFBUyxFQUFDLDBCQUEwQixFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDNUY7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDRCQUE0QixDQUFDLEVBQUU7Z0JBQ25DLEtBQUssRUFBRSw0QkFBNEIsQ0FBQyxLQUFLO2dCQUN6QyxRQUFRLEVBQUUsbUNBQWlCO2dCQUMzQixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUsNkNBQTJCO2FBQ3pDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxtREFBaUMsQ0FBQyxDQUFDLDhCQUE4QixFQUFFLENBQUM7UUFDekYsQ0FBQzs7SUFHRixJQUFBLHlCQUFlLEVBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUU5QyxNQUFhLG1CQUFvQixTQUFRLGlCQUFPO2lCQUMvQixPQUFFLEdBQUcsMENBQTBDLENBQUM7UUFDaEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLG1CQUFtQixDQUFDLEVBQUU7Z0JBQzFCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUM7Z0JBQy9DLFFBQVEsRUFBRSxtQ0FBaUI7Z0JBQzNCLEVBQUUsRUFB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