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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions"], function (require, exports, instantiation_1, lifecycle_1, extensionManagementUtil_1, contextkey_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionsSearchActionsMenu = exports.UPDATE_ACTIONS_GROUP = exports.INSTALL_ACTIONS_GROUP = exports.THEME_ACTIONS_GROUP = exports.CONTEXT_HAS_GALLERY = exports.HasOutdatedExtensionsContext = exports.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID = exports.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID = exports.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID = exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = exports.OUTDATED_EXTENSIONS_VIEW_ID = exports.WORKSPACE_RECOMMENDATIONS_VIEW_ID = exports.ExtensionContainers = exports.CloseExtensionDetailsOnViewChangeKey = exports.AutoCheckUpdatesConfigurationKey = exports.AutoUpdateConfigurationKey = exports.ConfigurationKey = exports.ExtensionEditorTab = exports.IExtensionsWorkbenchService = exports.ExtensionRuntimeActionType = exports.ExtensionState = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.extensions';
    var ExtensionState;
    (function (ExtensionState) {
        ExtensionState[ExtensionState["Installing"] = 0] = "Installing";
        ExtensionState[ExtensionState["Installed"] = 1] = "Installed";
        ExtensionState[ExtensionState["Uninstalling"] = 2] = "Uninstalling";
        ExtensionState[ExtensionState["Uninstalled"] = 3] = "Uninstalled";
    })(ExtensionState || (exports.ExtensionState = ExtensionState = {}));
    var ExtensionRuntimeActionType;
    (function (ExtensionRuntimeActionType) {
        ExtensionRuntimeActionType["ReloadWindow"] = "reloadWindow";
        ExtensionRuntimeActionType["RestartExtensions"] = "restartExtensions";
        ExtensionRuntimeActionType["DownloadUpdate"] = "downloadUpdate";
        ExtensionRuntimeActionType["ApplyUpdate"] = "applyUpdate";
        ExtensionRuntimeActionType["QuitAndInstall"] = "quitAndInstall";
    })(ExtensionRuntimeActionType || (exports.ExtensionRuntimeActionType = ExtensionRuntimeActionType = {}));
    exports.IExtensionsWorkbenchService = (0, instantiation_1.createDecorator)('extensionsWorkbenchService');
    var ExtensionEditorTab;
    (function (ExtensionEditorTab) {
        ExtensionEditorTab["Readme"] = "readme";
        ExtensionEditorTab["Features"] = "features";
        ExtensionEditorTab["Changelog"] = "changelog";
        ExtensionEditorTab["Dependencies"] = "dependencies";
        ExtensionEditorTab["ExtensionPack"] = "extensionPack";
    })(ExtensionEditorTab || (exports.ExtensionEditorTab = ExtensionEditorTab = {}));
    exports.ConfigurationKey = 'extensions';
    exports.AutoUpdateConfigurationKey = 'extensions.autoUpdate';
    exports.AutoCheckUpdatesConfigurationKey = 'extensions.autoCheckUpdates';
    exports.CloseExtensionDetailsOnViewChangeKey = 'extensions.closeExtensionDetailsOnViewChange';
    let ExtensionContainers = class ExtensionContainers extends lifecycle_1.Disposable {
        constructor(containers, extensionsWorkbenchService) {
            super();
            this.containers = containers;
            this._register(extensionsWorkbenchService.onChange(this.update, this));
        }
        set extension(extension) {
            this.containers.forEach(c => c.extension = extension);
        }
        update(extension) {
            for (const container of this.containers) {
                if (extension && container.extension) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(container.extension.identifier, extension.identifier)) {
                        if (container.extension.server && extension.server && container.extension.server !== extension.server) {
                            if (container.updateWhenCounterExtensionChanges) {
                                container.update();
                            }
                        }
                        else {
                            container.extension = extension;
                        }
                    }
                }
                else {
                    container.update();
                }
            }
        }
    };
    exports.ExtensionContainers = ExtensionContainers;
    exports.ExtensionContainers = ExtensionContainers = __decorate([
        __param(1, exports.IExtensionsWorkbenchService)
    ], ExtensionContainers);
    exports.WORKSPACE_RECOMMENDATIONS_VIEW_ID = 'workbench.views.extensions.workspaceRecommendations';
    exports.OUTDATED_EXTENSIONS_VIEW_ID = 'workbench.views.extensions.searchOutdated';
    exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = 'workbench.extensions.action.toggleIgnoreExtension';
    exports.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID = 'workbench.extensions.action.installVSIX';
    exports.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID = 'workbench.extensions.command.installFromVSIX';
    exports.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID = 'workbench.extensions.action.listWorkspaceUnsupportedExtensions';
    // Context Keys
    exports.HasOutdatedExtensionsContext = new contextkey_1.RawContextKey('hasOutdatedExtensions', false);
    exports.CONTEXT_HAS_GALLERY = new contextkey_1.RawContextKey('hasGallery', false);
    // Context Menu Groups
    exports.THEME_ACTIONS_GROUP = '_theme_';
    exports.INSTALL_ACTIONS_GROUP = '0_install';
    exports.UPDATE_ACTIONS_GROUP = '0_update';
    exports.extensionsSearchActionsMenu = new actions_1.MenuId('extensionsSearchActionsMenu');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQm5GLFFBQUEsVUFBVSxHQUFHLDJCQUEyQixDQUFDO0lBWXRELElBQWtCLGNBS2pCO0lBTEQsV0FBa0IsY0FBYztRQUMvQiwrREFBVSxDQUFBO1FBQ1YsNkRBQVMsQ0FBQTtRQUNULG1FQUFZLENBQUE7UUFDWixpRUFBVyxDQUFBO0lBQ1osQ0FBQyxFQUxpQixjQUFjLDhCQUFkLGNBQWMsUUFLL0I7SUFFRCxJQUFrQiwwQkFNakI7SUFORCxXQUFrQiwwQkFBMEI7UUFDM0MsMkRBQTZCLENBQUE7UUFDN0IscUVBQXVDLENBQUE7UUFDdkMsK0RBQWlDLENBQUE7UUFDakMseURBQTJCLENBQUE7UUFDM0IsK0RBQWlDLENBQUE7SUFDbEMsQ0FBQyxFQU5pQiwwQkFBMEIsMENBQTFCLDBCQUEwQixRQU0zQztJQXdEWSxRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNEJBQTRCLENBQUMsQ0FBQztJQWtEdEgsSUFBa0Isa0JBTWpCO0lBTkQsV0FBa0Isa0JBQWtCO1FBQ25DLHVDQUFpQixDQUFBO1FBQ2pCLDJDQUFxQixDQUFBO1FBQ3JCLDZDQUF1QixDQUFBO1FBQ3ZCLG1EQUE2QixDQUFBO1FBQzdCLHFEQUErQixDQUFBO0lBQ2hDLENBQUMsRUFOaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFNbkM7SUFFWSxRQUFBLGdCQUFnQixHQUFHLFlBQVksQ0FBQztJQUNoQyxRQUFBLDBCQUEwQixHQUFHLHVCQUF1QixDQUFDO0lBQ3JELFFBQUEsZ0NBQWdDLEdBQUcsNkJBQTZCLENBQUM7SUFD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