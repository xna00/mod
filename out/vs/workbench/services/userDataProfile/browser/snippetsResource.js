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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/map", "vs/nls", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/common/views", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, buffer_1, map_1, nls_1, files_1, instantiation_1, uriIdentity_1, editorCommands_1, views_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetsResourceTreeItem = exports.SnippetsResource = exports.SnippetsResourceInitializer = void 0;
    let SnippetsResourceInitializer = class SnippetsResourceInitializer {
        constructor(userDataProfileService, fileService, uriIdentityService) {
            this.userDataProfileService = userDataProfileService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
        }
        async initialize(content) {
            const snippetsContent = JSON.parse(content);
            for (const key in snippetsContent.snippets) {
                const resource = this.uriIdentityService.extUri.joinPath(this.userDataProfileService.currentProfile.snippetsHome, key);
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(snippetsContent.snippets[key]));
            }
        }
    };
    exports.SnippetsResourceInitializer = SnippetsResourceInitializer;
    exports.SnippetsResourceInitializer = SnippetsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, files_1.IFileService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], SnippetsResourceInitializer);
    let SnippetsResource = class SnippetsResource {
        constructor(fileService, uriIdentityService) {
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
        }
        async getContent(profile, excluded) {
            const snippets = await this.getSnippets(profile, excluded);
            return JSON.stringify({ snippets });
        }
        async apply(content, profile) {
            const snippetsContent = JSON.parse(content);
            for (const key in snippetsContent.snippets) {
                const resource = this.uriIdentityService.extUri.joinPath(profile.snippetsHome, key);
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(snippetsContent.snippets[key]));
            }
        }
        async getSnippets(profile, excluded) {
            const snippets = {};
            const snippetsResources = await this.getSnippetsResources(profile, excluded);
            for (const resource of snippetsResources) {
                const key = this.uriIdentityService.extUri.relativePath(profile.snippetsHome, resource);
                const content = await this.fileService.readFile(resource);
                snippets[key] = content.value.toString();
            }
            return snippets;
        }
        async getSnippetsResources(profile, excluded) {
            const snippets = [];
            let stat;
            try {
                stat = await this.fileService.resolve(profile.snippetsHome);
            }
            catch (e) {
                // No snippets
                if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return snippets;
                }
                else {
                    throw e;
                }
            }
            for (const { resource } of stat.children || []) {
                if (excluded?.has(resource)) {
                    continue;
                }
                const extension = this.uriIdentityService.extUri.extname(resource);
                if (extension === '.json' || extension === '.code-snippets') {
                    snippets.push(resource);
                }
            }
            return snippets;
        }
    };
    exports.SnippetsResource = SnippetsResource;
    exports.SnippetsResource = SnippetsResource = __decorate([
        __param(0, files_1.IFileService),
        __param(1, uriIdentity_1.IUriIdentityService)
    ], SnippetsResource);
    let SnippetsResourceTreeItem = class SnippetsResourceTreeItem {
        constructor(profile, instantiationService, uriIdentityService) {
            this.profile = profile;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this.type = "snippets" /* ProfileResourceType.Snippets */;
            this.handle = this.profile.snippetsHome.toString();
            this.label = { label: (0, nls_1.localize)('snippets', "Snippets") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Collapsed;
            this.excludedSnippets = new map_1.ResourceSet();
        }
        async getChildren() {
            const snippetsResources = await this.instantiationService.createInstance(SnippetsResource).getSnippetsResources(this.profile);
            const that = this;
            return snippetsResources.map(resource => ({
                handle: resource.toString(),
                parent: that,
                resourceUri: resource,
                collapsibleState: views_1.TreeItemCollapsibleState.None,
                accessibilityInformation: {
                    label: this.uriIdentityService.extUri.basename(resource),
                },
                checkbox: that.checkbox ? {
                    get isChecked() { return !that.excludedSnippets.has(resource); },
                    set isChecked(value) {
                        if (value) {
                            that.excludedSnippets.delete(resource);
                        }
                        else {
                            that.excludedSnippets.add(resource);
                        }
                    },
                    accessibilityInformation: {
                        label: (0, nls_1.localize)('exclude', "Select Snippet {0}", this.uriIdentityService.extUri.basename(resource)),
                    }
                } : undefined,
                command: {
                    id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                    title: '',
                    arguments: [resource, undefined, undefined]
                }
            }));
        }
        async hasContent() {
            const snippetsResources = await this.instantiationService.createInstance(SnippetsResource).getSnippetsResources(this.profile);
            return snippetsResources.length > 0;
        }
        async getContent() {
            return this.instantiationService.createInstance(SnippetsResource).getContent(this.profile, this.excludedSnippets);
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.snippets;
        }
    };
    exports.SnippetsResourceTreeItem = SnippetsResourceTreeItem;
    exports.SnippetsResourceTreeItem = SnippetsResourceTreeItem = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], SnippetsResourceTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL3NuaXBwZXRzUmVzb3VyY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjtRQUV2QyxZQUMyQyxzQkFBK0MsRUFDMUQsV0FBeUIsRUFDbEIsa0JBQXVDO1lBRm5DLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDMUQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUU5RSxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFlO1lBQy9CLE1BQU0sZUFBZSxHQUFxQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlELEtBQUssTUFBTSxHQUFHLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkgsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEcsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBaEJZLGtFQUEyQjswQ0FBM0IsMkJBQTJCO1FBR3JDLFdBQUEseUNBQXVCLENBQUE7UUFDdkIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQ0FBbUIsQ0FBQTtPQUxULDJCQUEyQixDQWdCdkM7SUFFTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtRQUU1QixZQUNnQyxXQUF5QixFQUNsQixrQkFBdUM7WUFEOUMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUU5RSxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUF5QixFQUFFLFFBQXNCO1lBQ2pFLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFlLEVBQUUsT0FBeUI7WUFDckQsTUFBTSxlQUFlLEdBQXFCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsS0FBSyxNQUFNLEdBQUcsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3BGLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUF5QixFQUFFLFFBQXNCO1lBQzFFLE1BQU0sUUFBUSxHQUE4QixFQUFFLENBQUM7WUFDL0MsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDN0UsS0FBSyxNQUFNLFFBQVEsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBRSxDQUFDO2dCQUN6RixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRCxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUF5QixFQUFFLFFBQXNCO1lBQzNFLE1BQU0sUUFBUSxHQUFVLEVBQUUsQ0FBQztZQUMzQixJQUFJLElBQWUsQ0FBQztZQUNwQixJQUFJLENBQUM7Z0JBQ0osSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLGNBQWM7Z0JBQ2QsSUFBSSxDQUFDLFlBQVksMEJBQWtCLElBQUksQ0FBQyxDQUFDLG1CQUFtQiwrQ0FBdUMsRUFBRSxDQUFDO29CQUNyRyxPQUFPLFFBQVEsQ0FBQztnQkFDakIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxDQUFDO2dCQUNULENBQUM7WUFDRixDQUFDO1lBQ0QsS0FBSyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQzdCLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFJLFNBQVMsS0FBSyxnQkFBZ0IsRUFBRSxDQUFDO29CQUM3RCxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6QixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7S0FDRCxDQUFBO0lBeERZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBRzFCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUNBQW1CLENBQUE7T0FKVCxnQkFBZ0IsQ0F3RDVCO0lBRU0sSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBd0I7UUFVcEMsWUFDa0IsT0FBeUIsRUFDbkIsb0JBQTRELEVBQzlELGtCQUF3RDtZQUY1RCxZQUFPLEdBQVAsT0FBTyxDQUFrQjtZQUNGLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQVhyRSxTQUFJLGlEQUFnQztZQUNwQyxXQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDOUMsVUFBSyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3BELHFCQUFnQixHQUFHLGdDQUF3QixDQUFDLFNBQVMsQ0FBQztZQUc5QyxxQkFBZ0IsR0FBRyxJQUFJLGlCQUFXLEVBQUUsQ0FBQztRQU1sRCxDQUFDO1FBRUwsS0FBSyxDQUFDLFdBQVc7WUFDaEIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUgsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE9BQU8saUJBQWlCLENBQUMsR0FBRyxDQUFnQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFO2dCQUMzQixNQUFNLEVBQUUsSUFBSTtnQkFDWixXQUFXLEVBQUUsUUFBUTtnQkFDckIsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSTtnQkFDL0Msd0JBQXdCLEVBQUU7b0JBQ3pCLEtBQUssRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7aUJBQ3hEO2dCQUNELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDekIsSUFBSSxTQUFTLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxJQUFJLFNBQVMsQ0FBQyxLQUFjO3dCQUMzQixJQUFJLEtBQUssRUFBRSxDQUFDOzRCQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3hDLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNyQyxDQUFDO29CQUNGLENBQUM7b0JBQ0Qsd0JBQXdCLEVBQUU7d0JBQ3pCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQ25HO2lCQUNELENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ2IsT0FBTyxFQUFFO29CQUNSLEVBQUUsRUFBRSwyQ0FBMEI7b0JBQzlCLEtBQUssRUFBRSxFQUFFO29CQUNULFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDO2lCQUMzQzthQUNELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUgsT0FBTyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVTtZQUNmLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ25ILENBQUM7UUFFRCxvQkFBb0I7WUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUM7UUFDNUUsQ0FBQztLQUdELENBQUE7SUE5RFksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFZbEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlDQUFtQixDQUFBO09BYlQsd0JBQXdCLENBOERwQyJ9