/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/native/common/native", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkeys", "vs/platform/files/common/files", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/uri", "vs/base/browser/dom"], function (require, exports, nls_1, native_1, editorService_1, actions_1, actionCommonCategories_1, environmentService_1, contextkeys_1, files_1, environmentService_2, uri_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenUserDataFolderAction = exports.ReloadWindowWithExtensionsDisabledAction = exports.ConfigureRuntimeArgumentsAction = exports.ToggleDevToolsAction = void 0;
    class ToggleDevToolsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleDevTools',
                title: (0, nls_1.localize2)('toggleDevTools', 'Toggle Developer Tools'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                    when: contextkeys_1.IsDevelopmentContext,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */ }
                },
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '5_tools',
                    order: 1
                }
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            return nativeHostService.toggleDevTools({ targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId });
        }
    }
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    class ConfigureRuntimeArgumentsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.configureRuntimeArguments',
                title: (0, nls_1.localize2)('configureRuntimeArguments', 'Configure Runtime Arguments'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            await editorService.openEditor({
                resource: environmentService.argvResource,
                options: { pinned: true }
            });
        }
    }
    exports.ConfigureRuntimeArgumentsAction = ConfigureRuntimeArgumentsAction;
    class ReloadWindowWithExtensionsDisabledAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.reloadWindowWithExtensionsDisabled',
                title: (0, nls_1.localize2)('reloadWindowWithExtensionsDisabled', 'Reload With Extensions Disabled'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            return accessor.get(native_1.INativeHostService).reload({ disableExtensions: true });
        }
    }
    exports.ReloadWindowWithExtensionsDisabledAction = ReloadWindowWithExtensionsDisabledAction;
    class OpenUserDataFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openUserDataFolder',
                title: (0, nls_1.localize2)('openUserDataFolder', 'Open User Data Folder'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const environmentService = accessor.get(environmentService_2.INativeWorkbenchEnvironmentService);
            const userDataHome = uri_1.URI.file(environmentService.userDataPath);
            const file = await fileService.resolve(userDataHome);
            let itemToShow;
            if (file.children && file.children.length > 0) {
                itemToShow = file.children[0].resource;
            }
            else {
                itemToShow = userDataHome;
            }
            return nativeHostService.showItemInFolder(itemToShow.fsPath);
        }
    }
    exports.OpenUserDataFolderAction = OpenUserDataFolderAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2ZWxvcGVyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvYWN0aW9ucy9kZXZlbG9wZXJBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBYSxvQkFBcUIsU0FBUSxpQkFBTztRQUVoRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsaUNBQWlDO2dCQUNyQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0JBQWdCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQzVELFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLEVBQUUsOENBQW9DLEVBQUU7b0JBQzlDLElBQUksRUFBRSxrQ0FBb0I7b0JBQzFCLE9BQU8sRUFBRSxtREFBNkIsd0JBQWU7b0JBQ3JELEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxnREFBMkIsd0JBQWUsRUFBRTtpQkFDNUQ7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7b0JBQzFCLEtBQUssRUFBRSxTQUFTO29CQUNoQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE9BQU8saUJBQWlCLENBQUMsY0FBYyxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUEscUJBQWUsR0FBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7UUFDL0YsQ0FBQztLQUNEO0lBM0JELG9EQTJCQztJQUVELE1BQWEsK0JBQWdDLFNBQVEsaUJBQU87UUFFM0Q7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDRDQUE0QztnQkFDaEQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDJCQUEyQixFQUFFLDZCQUE2QixDQUFDO2dCQUM1RSxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxXQUFXO2dCQUNoQyxFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpREFBNEIsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sYUFBYSxDQUFDLFVBQVUsQ0FBQztnQkFDOUIsUUFBUSxFQUFFLGtCQUFrQixDQUFDLFlBQVk7Z0JBQ3pDLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7YUFDekIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBcEJELDBFQW9CQztJQUVELE1BQWEsd0NBQXlDLFNBQVEsaUJBQU87UUFFcEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHFEQUFxRDtnQkFDekQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9DQUFvQyxFQUFFLGlDQUFpQyxDQUFDO2dCQUN6RixRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBa0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDN0UsQ0FBQztLQUNEO0lBZEQsNEZBY0M7SUFFRCxNQUFhLHdCQUF5QixTQUFRLGlCQUFPO1FBRXBEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztnQkFDL0QsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztZQUMvQyxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdURBQWtDLENBQUMsQ0FBQztZQUU1RSxNQUFNLFlBQVksR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQy9ELE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVyRCxJQUFJLFVBQWUsQ0FBQztZQUNwQixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUN4QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVSxHQUFHLFlBQVksQ0FBQztZQUMzQixDQUFDO1lBRUQsT0FBTyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUQsQ0FBQztLQUNEO0lBNUJELDREQTRCQyJ9