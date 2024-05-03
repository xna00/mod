/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/types"], function (require, exports, instantiation_1, themeService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionData = exports.COLOR_THEME_LIGHT_INITIAL_COLORS = exports.COLOR_THEME_DARK_INITIAL_COLORS = exports.ThemeSettingDefaults = exports.ThemeSettings = exports.themeScopeRegex = exports.THEME_SCOPE_WILDCARD = exports.THEME_SCOPE_CLOSE_PAREN = exports.THEME_SCOPE_OPEN_PAREN = exports.VS_HC_LIGHT_THEME = exports.VS_HC_THEME = exports.VS_DARK_THEME = exports.VS_LIGHT_THEME = exports.IWorkbenchThemeService = void 0;
    exports.IWorkbenchThemeService = (0, instantiation_1.refineServiceDecorator)(themeService_1.IThemeService);
    exports.VS_LIGHT_THEME = 'vs';
    exports.VS_DARK_THEME = 'vs-dark';
    exports.VS_HC_THEME = 'hc-black';
    exports.VS_HC_LIGHT_THEME = 'hc-light';
    exports.THEME_SCOPE_OPEN_PAREN = '[';
    exports.THEME_SCOPE_CLOSE_PAREN = ']';
    exports.THEME_SCOPE_WILDCARD = '*';
    exports.themeScopeRegex = /\[(.+?)\]/g;
    var ThemeSettings;
    (function (ThemeSettings) {
        ThemeSettings["COLOR_THEME"] = "workbench.colorTheme";
        ThemeSettings["FILE_ICON_THEME"] = "workbench.iconTheme";
        ThemeSettings["PRODUCT_ICON_THEME"] = "workbench.productIconTheme";
        ThemeSettings["COLOR_CUSTOMIZATIONS"] = "workbench.colorCustomizations";
        ThemeSettings["TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.tokenColorCustomizations";
        ThemeSettings["SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.semanticTokenColorCustomizations";
        ThemeSettings["PREFERRED_DARK_THEME"] = "workbench.preferredDarkColorTheme";
        ThemeSettings["PREFERRED_LIGHT_THEME"] = "workbench.preferredLightColorTheme";
        ThemeSettings["PREFERRED_HC_DARK_THEME"] = "workbench.preferredHighContrastColorTheme";
        ThemeSettings["PREFERRED_HC_LIGHT_THEME"] = "workbench.preferredHighContrastLightColorTheme";
        ThemeSettings["DETECT_COLOR_SCHEME"] = "window.autoDetectColorScheme";
        ThemeSettings["DETECT_HC"] = "window.autoDetectHighContrast";
    })(ThemeSettings || (exports.ThemeSettings = ThemeSettings = {}));
    var ThemeSettingDefaults;
    (function (ThemeSettingDefaults) {
        ThemeSettingDefaults["COLOR_THEME_DARK"] = "Default Dark Modern";
        ThemeSettingDefaults["COLOR_THEME_LIGHT"] = "Default Light Modern";
        ThemeSettingDefaults["COLOR_THEME_HC_DARK"] = "Default High Contrast";
        ThemeSettingDefaults["COLOR_THEME_HC_LIGHT"] = "Default High Contrast Light";
        ThemeSettingDefaults["COLOR_THEME_DARK_OLD"] = "Default Dark+";
        ThemeSettingDefaults["COLOR_THEME_LIGHT_OLD"] = "Default Light+";
        ThemeSettingDefaults["FILE_ICON_THEME"] = "vs-seti";
        ThemeSettingDefaults["PRODUCT_ICON_THEME"] = "Default";
    })(ThemeSettingDefaults || (exports.ThemeSettingDefaults = ThemeSettingDefaults = {}));
    exports.COLOR_THEME_DARK_INITIAL_COLORS = {
        'activityBar.background': '#181818',
        'statusBar.background': '#181818',
        'statusBar.noFolderBackground': '#1f1f1f',
    };
    exports.COLOR_THEME_LIGHT_INITIAL_COLORS = {
        'activityBar.background': '#f8f8f8',
        'statusBar.background': '#f8f8f8',
        'statusBar.noFolderBackground': '#f8f8f8'
    };
    var ExtensionData;
    (function (ExtensionData) {
        function toJSONObject(d) {
            return d && { _extensionId: d.extensionId, _extensionIsBuiltin: d.extensionIsBuiltin, _extensionName: d.extensionName, _extensionPublisher: d.extensionPublisher };
        }
        ExtensionData.toJSONObject = toJSONObject;
        function fromJSONObject(o) {
            if (o && (0, types_1.isString)(o._extensionId) && (0, types_1.isBoolean)(o._extensionIsBuiltin) && (0, types_1.isString)(o._extensionName) && (0, types_1.isString)(o._extensionPublisher)) {
                return { extensionId: o._extensionId, extensionIsBuiltin: o._extensionIsBuiltin, extensionName: o._extensionName, extensionPublisher: o._extensionPublisher };
            }
            return undefined;
        }
        ExtensionData.fromJSONObject = fromJSONObject;
        function fromName(publisher, name, isBuiltin = false) {
            return { extensionPublisher: publisher, extensionId: `${publisher}.${name}`, extensionName: name, extensionIsBuiltin: isBuiltin };
        }
        ExtensionData.fromName = fromName;
    })(ExtensionData || (exports.ExtensionData = ExtensionData = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGhlbWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi93b3JrYmVuY2hUaGVtZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVW5GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSxzQ0FBc0IsRUFBd0MsNEJBQWEsQ0FBQyxDQUFDO0lBRXRHLFFBQUEsY0FBYyxHQUFHLElBQUksQ0FBQztJQUN0QixRQUFBLGFBQWEsR0FBRyxTQUFTLENBQUM7SUFDMUIsUUFBQSxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ3pCLFFBQUEsaUJBQWlCLEdBQUcsVUFBVSxDQUFDO0lBRS9CLFFBQUEsc0JBQXNCLEdBQUcsR0FBRyxDQUFDO0lBQzdCLFFBQUEsdUJBQXVCLEdBQUcsR0FBRyxDQUFDO0lBQzlCLFFBQUEsb0JBQW9CLEdBQUcsR0FBRyxDQUFDO0lBRTNCLFFBQUEsZUFBZSxHQUFHLFlBQVksQ0FBQztJQUU1QyxJQUFZLGFBY1g7SUFkRCxXQUFZLGFBQWE7UUFDeEIscURBQW9DLENBQUE7UUFDcEMsd0RBQXVDLENBQUE7UUFDdkMsa0VBQWlELENBQUE7UUFDakQsdUVBQXNELENBQUE7UUFDdEQsK0VBQThELENBQUE7UUFDOUQsZ0dBQStFLENBQUE7UUFFL0UsMkVBQTBELENBQUE7UUFDMUQsNkVBQTRELENBQUE7UUFDNUQsc0ZBQXFFLENBQUE7UUFDckUsNEZBQTJFLENBQUE7UUFDM0UscUVBQW9ELENBQUE7UUFDcEQsNERBQTJDLENBQUE7SUFDNUMsQ0FBQyxFQWRXLGFBQWEsNkJBQWIsYUFBYSxRQWN4QjtJQUVELElBQVksb0JBV1g7SUFYRCxXQUFZLG9CQUFvQjtRQUMvQixnRUFBd0MsQ0FBQTtRQUN4QyxrRUFBMEMsQ0FBQTtRQUMxQyxxRUFBNkMsQ0FBQTtRQUM3Qyw0RUFBb0QsQ0FBQTtRQUVwRCw4REFBc0MsQ0FBQTtRQUN0QyxnRUFBd0MsQ0FBQTtRQUV4QyxtREFBMkIsQ0FBQTtRQUMzQixzREFBOEIsQ0FBQTtJQUMvQixDQUFDLEVBWFcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFXL0I7SUFFWSxRQUFBLCtCQUErQixHQUFHO1FBQzlDLHdCQUF3QixFQUFFLFNBQVM7UUFDbkMsc0JBQXNCLEVBQUUsU0FBUztRQUNqQyw4QkFBOEIsRUFBRSxTQUFTO0tBQ3pDLENBQUM7SUFFVyxRQUFBLGdDQUFnQyxHQUFHO1FBQy9DLHdCQUF3QixFQUFFLFNBQVM7UUFDbkMsc0JBQXNCLEVBQUUsU0FBUztRQUNqQyw4QkFBOEIsRUFBRSxTQUFTO0tBQ3pDLENBQUM7SUF3SkYsSUFBaUIsYUFBYSxDQWE3QjtJQWJELFdBQWlCLGFBQWE7UUFDN0IsU0FBZ0IsWUFBWSxDQUFDLENBQTRCO1lBQ3hELE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsYUFBYSxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3BLLENBQUM7UUFGZSwwQkFBWSxlQUUzQixDQUFBO1FBQ0QsU0FBZ0IsY0FBYyxDQUFDLENBQU07WUFDcEMsSUFBSSxDQUFDLElBQUksSUFBQSxnQkFBUSxFQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFBLGlCQUFTLEVBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLElBQUksSUFBQSxnQkFBUSxFQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxJQUFBLGdCQUFRLEVBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztnQkFDeEksT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsWUFBWSxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMvSixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUxlLDRCQUFjLGlCQUs3QixDQUFBO1FBQ0QsU0FBZ0IsUUFBUSxDQUFDLFNBQWlCLEVBQUUsSUFBWSxFQUFFLFNBQVMsR0FBRyxLQUFLO1lBQzFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsU0FBUyxJQUFJLElBQUksRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFDbkksQ0FBQztRQUZlLHNCQUFRLFdBRXZCLENBQUE7SUFDRixDQUFDLEVBYmdCLGFBQWEsNkJBQWIsYUFBYSxRQWE3QiJ9