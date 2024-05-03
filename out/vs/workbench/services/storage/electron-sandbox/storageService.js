/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/storage/common/storageService"], function (require, exports, storageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkbenchStorageService = void 0;
    class NativeWorkbenchStorageService extends storageService_1.RemoteStorageService {
        constructor(workspace, userDataProfileService, userDataProfilesService, mainProcessService, environmentService) {
            super(workspace, { currentProfile: userDataProfileService.currentProfile, defaultProfile: userDataProfilesService.defaultProfile }, mainProcessService, environmentService);
            this.userDataProfileService = userDataProfileService;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(e => e.join(this.switchToProfile(e.profile))));
        }
    }
    exports.NativeWorkbenchStorageService = NativeWorkbenchStorageService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zdG9yYWdlL2VsZWN0cm9uLXNhbmRib3gvc3RvcmFnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsNkJBQThCLFNBQVEscUNBQW9CO1FBRXRFLFlBQ0MsU0FBOEMsRUFDN0Isc0JBQStDLEVBQ2hFLHVCQUFpRCxFQUNqRCxrQkFBdUMsRUFDdkMsa0JBQXVDO1lBRXZDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxjQUFjLEVBQUUsc0JBQXNCLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSx1QkFBdUIsQ0FBQyxjQUFjLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBTDNKLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFPaEUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckgsQ0FBQztLQUNEO0lBakJELHNFQWlCQyJ9