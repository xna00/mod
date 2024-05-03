/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons"], function (require, exports, types_1, nls_1, actions_1, instantiation_1, contextkey_1, uri_1, iconRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT = exports.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT = exports.HAS_PROFILES_CONTEXT = exports.IS_CURRENT_PROFILE_TRANSIENT_CONTEXT = exports.CURRENT_PROFILE_CONTEXT = exports.PROFILES_ENABLEMENT_CONTEXT = exports.PROFILE_FILTER = exports.PROFILE_EXTENSION = exports.PROFILES_CATEGORY = exports.PROFILES_TITLE = exports.MANAGE_PROFILES_ACTION_ID = exports.ProfilesMenu = exports.defaultUserDataProfileIcon = exports.IUserDataProfileImportExportService = exports.PROFILE_URL_AUTHORITY = exports.IUserDataProfileManagementService = exports.IUserDataProfileService = void 0;
    exports.isUserDataProfileTemplate = isUserDataProfileTemplate;
    exports.toUserDataProfileUri = toUserDataProfileUri;
    exports.IUserDataProfileService = (0, instantiation_1.createDecorator)('IUserDataProfileService');
    exports.IUserDataProfileManagementService = (0, instantiation_1.createDecorator)('IUserDataProfileManagementService');
    function isUserDataProfileTemplate(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && ((0, types_1.isUndefined)(candidate.settings) || typeof candidate.settings === 'string')
            && ((0, types_1.isUndefined)(candidate.globalState) || typeof candidate.globalState === 'string')
            && ((0, types_1.isUndefined)(candidate.extensions) || typeof candidate.extensions === 'string'));
    }
    exports.PROFILE_URL_AUTHORITY = 'profile';
    function toUserDataProfileUri(path, productService) {
        return uri_1.URI.from({
            scheme: productService.urlProtocol,
            authority: exports.PROFILE_URL_AUTHORITY,
            path: path.startsWith('/') ? path : `/${path}`
        });
    }
    exports.IUserDataProfileImportExportService = (0, instantiation_1.createDecorator)('IUserDataProfileImportExportService');
    exports.defaultUserDataProfileIcon = (0, iconRegistry_1.registerIcon)('defaultProfile-icon', codicons_1.Codicon.settings, (0, nls_1.localize)('defaultProfileIcon', 'Icon for Default Profile.'));
    exports.ProfilesMenu = new actions_1.MenuId('Profiles');
    exports.MANAGE_PROFILES_ACTION_ID = 'workbench.profiles.actions.manage';
    exports.PROFILES_TITLE = (0, nls_1.localize2)('profiles', 'Profiles');
    exports.PROFILES_CATEGORY = { ...exports.PROFILES_TITLE };
    exports.PROFILE_EXTENSION = 'code-profile';
    exports.PROFILE_FILTER = [{ name: (0, nls_1.localize)('profile', "Profile"), extensions: [exports.PROFILE_EXTENSION] }];
    exports.PROFILES_ENABLEMENT_CONTEXT = new contextkey_1.RawContextKey('profiles.enabled', true);
    exports.CURRENT_PROFILE_CONTEXT = new contextkey_1.RawContextKey('currentProfile', '');
    exports.IS_CURRENT_PROFILE_TRANSIENT_CONTEXT = new contextkey_1.RawContextKey('isCurrentProfileTransient', false);
    exports.HAS_PROFILES_CONTEXT = new contextkey_1.RawContextKey('hasProfiles', false);
    exports.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT = new contextkey_1.RawContextKey('isProfileExportInProgress', false);
    exports.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT = new contextkey_1.RawContextKey('isProfileImportInProgress', false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdXNlckRhdGFQcm9maWxlL2NvbW1vbi91c2VyRGF0YVByb2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkRoRyw4REFPQztJQUdELG9EQU1DO0lBcERZLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwrQkFBZSxFQUEwQix5QkFBeUIsQ0FBQyxDQUFDO0lBYzlGLFFBQUEsaUNBQWlDLEdBQUcsSUFBQSwrQkFBZSxFQUFvQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBc0J6SSxTQUFnQix5QkFBeUIsQ0FBQyxLQUFjO1FBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQTZDLENBQUM7UUFFaEUsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUTtlQUNoRCxDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQztlQUMzRSxDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQztlQUNqRixDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUVZLFFBQUEscUJBQXFCLEdBQUcsU0FBUyxDQUFDO0lBQy9DLFNBQWdCLG9CQUFvQixDQUFDLElBQVksRUFBRSxjQUErQjtRQUNqRixPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZixNQUFNLEVBQUUsY0FBYyxDQUFDLFdBQVc7WUFDbEMsU0FBUyxFQUFFLDZCQUFxQjtZQUNoQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtTQUM5QyxDQUFDLENBQUM7SUFDSixDQUFDO0lBUVksUUFBQSxtQ0FBbUMsR0FBRyxJQUFBLCtCQUFlLEVBQXNDLHFDQUFxQyxDQUFDLENBQUM7SUFrRGxJLFFBQUEsMEJBQTBCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHFCQUFxQixFQUFFLGtCQUFPLENBQUMsUUFBUSxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQztJQUVoSixRQUFBLFlBQVksR0FBRyxJQUFJLGdCQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEMsUUFBQSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQztJQUNoRSxRQUFBLGNBQWMsR0FBRyxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbkQsUUFBQSxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsc0JBQWMsRUFBRSxDQUFDO0lBQzFDLFFBQUEsaUJBQWlCLEdBQUcsY0FBYyxDQUFDO0lBQ25DLFFBQUEsY0FBYyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLHlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLFFBQUEsMkJBQTJCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ25GLFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLFFBQUEsb0NBQW9DLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RHLFFBQUEsb0JBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4RSxRQUFBLHFDQUFxQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RyxRQUFBLHFDQUFxQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQyJ9