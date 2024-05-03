/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/themables", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, async_1, event_1, lifecycle_1, objects_1, themables_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileService = void 0;
    class UserDataProfileService extends lifecycle_1.Disposable {
        get currentProfile() { return this._currentProfile; }
        constructor(currentProfile) {
            super();
            this._onDidChangeCurrentProfile = this._register(new event_1.Emitter());
            this.onDidChangeCurrentProfile = this._onDidChangeCurrentProfile.event;
            this._currentProfile = currentProfile;
        }
        async updateCurrentProfile(userDataProfile) {
            if ((0, objects_1.equals)(this._currentProfile, userDataProfile)) {
                return;
            }
            const previous = this._currentProfile;
            this._currentProfile = userDataProfile;
            const joiners = [];
            this._onDidChangeCurrentProfile.fire({
                previous,
                profile: userDataProfile,
                join(promise) {
                    joiners.push(promise);
                }
            });
            await async_1.Promises.settled(joiners);
        }
        getShortName(profile) {
            if (!profile.isDefault && profile.shortName && themables_1.ThemeIcon.fromId(profile.shortName)) {
                return profile.shortName;
            }
            return `$(${userDataProfile_1.defaultUserDataProfileIcon.id})`;
        }
    }
    exports.UserDataProfileService = UserDataProfileService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9jb21tb24vdXNlckRhdGFQcm9maWxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxzQkFBdUIsU0FBUSxzQkFBVTtRQVFyRCxJQUFJLGNBQWMsS0FBdUIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUV2RSxZQUNDLGNBQWdDO1lBRWhDLEtBQUssRUFBRSxDQUFDO1lBVFEsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUMsQ0FBQyxDQUFDO1lBQ2xHLDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFTMUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7UUFDdkMsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxlQUFpQztZQUMzRCxJQUFJLElBQUEsZ0JBQU0sRUFBQyxJQUFJLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUN0QyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztZQUN2QyxNQUFNLE9BQU8sR0FBb0IsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUM7Z0JBQ3BDLFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLElBQUksQ0FBQyxPQUFPO29CQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7YUFDRCxDQUFDLENBQUM7WUFDSCxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBeUI7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDcEYsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQzFCLENBQUM7WUFDRCxPQUFPLEtBQUssNENBQTBCLENBQUMsRUFBRSxHQUFHLENBQUM7UUFDOUMsQ0FBQztLQUVEO0lBekNELHdEQXlDQyJ9