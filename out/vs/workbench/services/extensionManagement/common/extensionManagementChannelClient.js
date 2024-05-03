/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/strings"], function (require, exports, extensions_1, extensionManagementIpc_1, event_1, arrays_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProfileAwareExtensionManagementChannelClient = void 0;
    class ProfileAwareExtensionManagementChannelClient extends extensionManagementIpc_1.ExtensionManagementChannelClient {
        constructor(channel, userDataProfileService, uriIdentityService) {
            super(channel);
            this.userDataProfileService = userDataProfileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeProfile = this._register(new event_1.Emitter());
            this.onDidChangeProfile = this._onDidChangeProfile.event;
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => {
                if (!this.uriIdentityService.extUri.isEqual(e.previous.extensionsResource, e.profile.extensionsResource)) {
                    e.join(this.whenProfileChanged(e));
                }
            }));
        }
        async fireEvent(arg0, arg1) {
            if (Array.isArray(arg1)) {
                const event = arg0;
                const data = arg1;
                const filtered = [];
                for (const e of data) {
                    const result = this.filterEvent(e);
                    if (result instanceof Promise ? await result : result) {
                        filtered.push(e);
                    }
                }
                if (filtered.length) {
                    event.fire(filtered);
                }
            }
            else {
                const event = arg0;
                const data = arg1;
                const result = this.filterEvent(data);
                if (result instanceof Promise ? await result : result) {
                    event.fire(data);
                }
            }
        }
        async install(vsix, installOptions) {
            installOptions = { ...installOptions, profileLocation: await this.getProfileLocation(installOptions?.profileLocation) };
            return super.install(vsix, installOptions);
        }
        async installFromLocation(location, profileLocation) {
            return super.installFromLocation(location, await this.getProfileLocation(profileLocation));
        }
        async installFromGallery(extension, installOptions) {
            installOptions = { ...installOptions, profileLocation: await this.getProfileLocation(installOptions?.profileLocation) };
            return super.installFromGallery(extension, installOptions);
        }
        async installGalleryExtensions(extensions) {
            const infos = [];
            for (const extension of extensions) {
                infos.push({ ...extension, options: { ...extension.options, profileLocation: await this.getProfileLocation(extension.options?.profileLocation) } });
            }
            return super.installGalleryExtensions(infos);
        }
        async uninstall(extension, options) {
            options = { ...options, profileLocation: await this.getProfileLocation(options?.profileLocation) };
            return super.uninstall(extension, options);
        }
        async getInstalled(type = null, extensionsProfileResource, productVersion) {
            return super.getInstalled(type, await this.getProfileLocation(extensionsProfileResource), productVersion);
        }
        async updateMetadata(local, metadata, extensionsProfileResource) {
            return super.updateMetadata(local, metadata, await this.getProfileLocation(extensionsProfileResource));
        }
        async toggleAppliationScope(local, fromProfileLocation) {
            return super.toggleAppliationScope(local, await this.getProfileLocation(fromProfileLocation));
        }
        async copyExtensions(fromProfileLocation, toProfileLocation) {
            return super.copyExtensions(await this.getProfileLocation(fromProfileLocation), await this.getProfileLocation(toProfileLocation));
        }
        async whenProfileChanged(e) {
            const previousProfileLocation = await this.getProfileLocation(e.previous.extensionsResource);
            const currentProfileLocation = await this.getProfileLocation(e.profile.extensionsResource);
            if (this.uriIdentityService.extUri.isEqual(previousProfileLocation, currentProfileLocation)) {
                return;
            }
            const eventData = await this.switchExtensionsProfile(previousProfileLocation, currentProfileLocation);
            this._onDidChangeProfile.fire(eventData);
        }
        async switchExtensionsProfile(previousProfileLocation, currentProfileLocation, preserveExtensions) {
            const oldExtensions = await this.getInstalled(1 /* ExtensionType.User */, previousProfileLocation);
            const newExtensions = await this.getInstalled(1 /* ExtensionType.User */, currentProfileLocation);
            if (preserveExtensions?.length) {
                const extensionsToInstall = [];
                for (const extension of oldExtensions) {
                    if (preserveExtensions.some(id => extensions_1.ExtensionIdentifier.equals(extension.identifier.id, id)) &&
                        !newExtensions.some(e => extensions_1.ExtensionIdentifier.equals(e.identifier.id, extension.identifier.id))) {
                        extensionsToInstall.push(extension.identifier);
                    }
                }
                if (extensionsToInstall.length) {
                    await this.installExtensionsFromProfile(extensionsToInstall, previousProfileLocation, currentProfileLocation);
                }
            }
            return (0, arrays_1.delta)(oldExtensions, newExtensions, (a, b) => (0, strings_1.compare)(`${extensions_1.ExtensionIdentifier.toKey(a.identifier.id)}@${a.manifest.version}`, `${extensions_1.ExtensionIdentifier.toKey(b.identifier.id)}@${b.manifest.version}`));
        }
        async getProfileLocation(profileLocation) {
            return profileLocation ?? this.userDataProfileService.currentProfile.extensionsResource;
        }
    }
    exports.ProfileAwareExtensionManagementChannelClient = ProfileAwareExtensionManagementChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudENoYW5uZWxDbGllbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25NYW5hZ2VtZW50Q2hhbm5lbENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBc0IsNENBQTZDLFNBQVEseURBQW9DO1FBSzlHLFlBQVksT0FBaUIsRUFDVCxzQkFBK0MsRUFDL0Msa0JBQXVDO1lBRTFELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUhJLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUwxQyx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4RSxDQUFDLENBQUM7WUFDeEksdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQU81RCxJQUFJLENBQUMsU0FBUyxDQUFDLHNCQUFzQixDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztvQkFDMUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBUWtCLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBUyxFQUFFLElBQVM7WUFDdEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sS0FBSyxHQUFHLElBQXVDLENBQUM7Z0JBQ3RELE1BQU0sSUFBSSxHQUFHLElBQThCLENBQUM7Z0JBQzVDLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztnQkFDcEIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDdEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxNQUFNLFlBQVksT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3ZELFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xCLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckIsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEtBQUssR0FBRyxJQUFxQyxDQUFDO2dCQUNwRCxNQUFNLElBQUksR0FBRyxJQUE0QixDQUFDO2dCQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLE1BQU0sWUFBWSxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDdkQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFTLEVBQUUsY0FBK0I7WUFDaEUsY0FBYyxHQUFHLEVBQUUsR0FBRyxjQUFjLEVBQUUsZUFBZSxFQUFFLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQ3hILE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVRLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxRQUFhLEVBQUUsZUFBb0I7WUFDckUsT0FBTyxLQUFLLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVRLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUE0QixFQUFFLGNBQStCO1lBQzlGLGNBQWMsR0FBRyxFQUFFLEdBQUcsY0FBYyxFQUFFLGVBQWUsRUFBRSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLEVBQUUsQ0FBQztZQUN4SCxPQUFPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVRLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxVQUFrQztZQUN6RSxNQUFNLEtBQUssR0FBMkIsRUFBRSxDQUFDO1lBQ3pDLEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckosQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFUSxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQTBCLEVBQUUsT0FBMEI7WUFDOUUsT0FBTyxHQUFHLEVBQUUsR0FBRyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQ25HLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVRLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBNkIsSUFBSSxFQUFFLHlCQUErQixFQUFFLGNBQWdDO1lBQy9ILE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMzRyxDQUFDO1FBRVEsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFzQixFQUFFLFFBQTJCLEVBQUUseUJBQStCO1lBQ2pILE9BQU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztRQUN4RyxDQUFDO1FBRVEsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQXNCLEVBQUUsbUJBQXdCO1lBQ3BGLE9BQU8sS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFDL0YsQ0FBQztRQUVRLEtBQUssQ0FBQyxjQUFjLENBQUMsbUJBQXdCLEVBQUUsaUJBQXNCO1lBQzdFLE9BQU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUNuSSxDQUFDO1FBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQWdDO1lBQ2hFLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTNGLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxDQUFDO2dCQUM3RixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLHVCQUF1QixFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDdEcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRVMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLHVCQUE0QixFQUFFLHNCQUEyQixFQUFFLGtCQUEwQztZQUM1SSxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLDZCQUFxQix1QkFBdUIsQ0FBQyxDQUFDO1lBQzNGLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksNkJBQXFCLHNCQUFzQixDQUFDLENBQUM7WUFDMUYsSUFBSSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxtQkFBbUIsR0FBMkIsRUFBRSxDQUFDO2dCQUN2RCxLQUFLLE1BQU0sU0FBUyxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUN2QyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLGdDQUFtQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDekYsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZ0NBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNqRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNoRCxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDL0csQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUEsY0FBSyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFBLGlCQUFPLEVBQUMsR0FBRyxnQ0FBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsZ0NBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN00sQ0FBQztRQUlTLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxlQUFxQjtZQUN2RCxPQUFPLGVBQWUsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDO1FBQ3pGLENBQUM7S0FHRDtJQS9IRCxvR0ErSEMifQ==