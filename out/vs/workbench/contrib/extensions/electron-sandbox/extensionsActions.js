/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/native/common/native", "vs/base/common/network", "vs/platform/actions/common/actions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, files_1, uri_1, environmentService_1, native_1, network_1, actions_1, extensionManagement_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CleanUpExtensionsFolderAction = exports.OpenExtensionsFolderAction = void 0;
    class OpenExtensionsFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.openExtensionsFolder',
                title: (0, nls_1.localize2)('openExtensionsFolder', 'Open Extensions Folder'),
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const environmentService = accessor.get(environmentService_1.INativeWorkbenchEnvironmentService);
            const extensionsHome = uri_1.URI.file(environmentService.extensionsPath);
            const file = await fileService.resolve(extensionsHome);
            let itemToShow;
            if (file.children && file.children.length > 0) {
                itemToShow = file.children[0].resource;
            }
            else {
                itemToShow = extensionsHome;
            }
            if (itemToShow.scheme === network_1.Schemas.file) {
                return nativeHostService.showItemInFolder(itemToShow.fsPath);
            }
        }
    }
    exports.OpenExtensionsFolderAction = OpenExtensionsFolderAction;
    class CleanUpExtensionsFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: '_workbench.extensions.action.cleanUpExtensionsFolder',
                title: (0, nls_1.localize2)('cleanUpExtensionsFolder', 'Cleanup Extensions Folder'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            return extensionManagementService.cleanUp();
        }
    }
    exports.CleanUpExtensionsFolderAction = CleanUpExtensionsFolderAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25zQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSwwQkFBMkIsU0FBUSxpQkFBTztRQUV0RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0RBQWtEO2dCQUN0RCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQ2xFLFFBQVEsRUFBRSw4Q0FBd0I7Z0JBQ2xDLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7WUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVEQUFrQyxDQUFDLENBQUM7WUFFNUUsTUFBTSxjQUFjLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRSxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFdkQsSUFBSSxVQUFlLENBQUM7WUFDcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDeEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFVBQVUsR0FBRyxjQUFjLENBQUM7WUFDN0IsQ0FBQztZQUVELElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4QyxPQUFPLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBOUJELGdFQThCQztJQUVELE1BQWEsNkJBQThCLFNBQVEsaUJBQU87UUFFekQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHNEQUFzRDtnQkFDMUQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLHlCQUF5QixFQUFFLDJCQUEyQixDQUFDO2dCQUN4RSxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0sMEJBQTBCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpREFBMkIsQ0FBQyxDQUFDO1lBQzdFLE9BQU8sMEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0MsQ0FBQztLQUNEO0lBZkQsc0VBZUMifQ==