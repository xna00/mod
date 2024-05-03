/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTitleBarVisibility = exports.TitlebarStyle = exports.TitleBarSetting = exports.WindowMinimumSize = void 0;
    exports.isOpenedAuxiliaryWindow = isOpenedAuxiliaryWindow;
    exports.isWorkspaceToOpen = isWorkspaceToOpen;
    exports.isFolderToOpen = isFolderToOpen;
    exports.isFileToOpen = isFileToOpen;
    exports.getMenuBarVisibility = getMenuBarVisibility;
    exports.hasCustomTitlebar = hasCustomTitlebar;
    exports.hasNativeTitlebar = hasNativeTitlebar;
    exports.getTitleBarStyle = getTitleBarStyle;
    exports.useWindowControlsOverlay = useWindowControlsOverlay;
    exports.useNativeFullScreen = useNativeFullScreen;
    exports.zoomLevelToZoomFactor = zoomLevelToZoomFactor;
    exports.WindowMinimumSize = {
        WIDTH: 400,
        WIDTH_WITH_VERTICAL_PANEL: 600,
        HEIGHT: 270
    };
    function isOpenedAuxiliaryWindow(candidate) {
        return typeof candidate.parentId === 'number';
    }
    function isWorkspaceToOpen(uriToOpen) {
        return !!uriToOpen.workspaceUri;
    }
    function isFolderToOpen(uriToOpen) {
        return !!uriToOpen.folderUri;
    }
    function isFileToOpen(uriToOpen) {
        return !!uriToOpen.fileUri;
    }
    function getMenuBarVisibility(configurationService) {
        const nativeTitleBarEnabled = hasNativeTitlebar(configurationService);
        const menuBarVisibility = configurationService.getValue('window.menuBarVisibility');
        if (menuBarVisibility === 'default' || (nativeTitleBarEnabled && menuBarVisibility === 'compact') || (platform_1.isMacintosh && platform_1.isNative)) {
            return 'classic';
        }
        else {
            return menuBarVisibility;
        }
    }
    var TitleBarSetting;
    (function (TitleBarSetting) {
        TitleBarSetting["TITLE_BAR_STYLE"] = "window.titleBarStyle";
        TitleBarSetting["CUSTOM_TITLE_BAR_VISIBILITY"] = "window.customTitleBarVisibility";
    })(TitleBarSetting || (exports.TitleBarSetting = TitleBarSetting = {}));
    var TitlebarStyle;
    (function (TitlebarStyle) {
        TitlebarStyle["NATIVE"] = "native";
        TitlebarStyle["CUSTOM"] = "custom";
    })(TitlebarStyle || (exports.TitlebarStyle = TitlebarStyle = {}));
    var CustomTitleBarVisibility;
    (function (CustomTitleBarVisibility) {
        CustomTitleBarVisibility["AUTO"] = "auto";
        CustomTitleBarVisibility["WINDOWED"] = "windowed";
        CustomTitleBarVisibility["NEVER"] = "never";
    })(CustomTitleBarVisibility || (exports.CustomTitleBarVisibility = CustomTitleBarVisibility = {}));
    function hasCustomTitlebar(configurationService, titleBarStyle) {
        // Returns if it possible to have a custom title bar in the curren session
        // Does not imply that the title bar is visible
        return true;
    }
    function hasNativeTitlebar(configurationService, titleBarStyle) {
        if (!titleBarStyle) {
            titleBarStyle = getTitleBarStyle(configurationService);
        }
        return titleBarStyle === "native" /* TitlebarStyle.NATIVE */;
    }
    function getTitleBarStyle(configurationService) {
        if (platform_1.isWeb) {
            return "custom" /* TitlebarStyle.CUSTOM */;
        }
        const configuration = configurationService.getValue('window');
        if (configuration) {
            const useNativeTabs = platform_1.isMacintosh && configuration.nativeTabs === true;
            if (useNativeTabs) {
                return "native" /* TitlebarStyle.NATIVE */; // native tabs on sierra do not work with custom title style
            }
            const useSimpleFullScreen = platform_1.isMacintosh && configuration.nativeFullScreen === false;
            if (useSimpleFullScreen) {
                return "native" /* TitlebarStyle.NATIVE */; // simple fullscreen does not work well with custom title style (https://github.com/microsoft/vscode/issues/63291)
            }
            const style = configuration.titleBarStyle;
            if (style === "native" /* TitlebarStyle.NATIVE */ || style === "custom" /* TitlebarStyle.CUSTOM */) {
                return style;
            }
        }
        return platform_1.isLinux ? "native" /* TitlebarStyle.NATIVE */ : "custom" /* TitlebarStyle.CUSTOM */; // default to custom on all macOS and Windows
    }
    function useWindowControlsOverlay(configurationService) {
        if (!platform_1.isWindows || platform_1.isWeb) {
            return false; // only supported on a desktop Windows instance
        }
        if (hasNativeTitlebar(configurationService)) {
            return false; // only supported when title bar is custom
        }
        // Default to true.
        return true;
    }
    function useNativeFullScreen(configurationService) {
        const windowConfig = configurationService.getValue('window');
        if (!windowConfig || typeof windowConfig.nativeFullScreen !== 'boolean') {
            return true; // default
        }
        if (windowConfig.nativeTabs) {
            return true; // https://github.com/electron/electron/issues/16142
        }
        return windowConfig.nativeFullScreen !== false;
    }
    /**
     * According to Electron docs: `scale := 1.2 ^ level`.
     * https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentssetzoomlevellevel
     */
    function zoomLevelToZoomFactor(zoomLevel = 0) {
        return Math.pow(1.2, zoomLevel);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93aW5kb3cvY29tbW9uL3dpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1RmhHLDBEQUVDO0lBc0JELDhDQUVDO0lBRUQsd0NBRUM7SUFFRCxvQ0FFQztJQUlELG9EQVNDO0lBOENELDhDQUtDO0lBRUQsOENBS0M7SUFFRCw0Q0F3QkM7SUFFRCw0REFXQztJQUVELGtEQVdDO0lBa0pELHNEQUVDO0lBdlhZLFFBQUEsaUJBQWlCLEdBQUc7UUFDaEMsS0FBSyxFQUFFLEdBQUc7UUFDVix5QkFBeUIsRUFBRSxHQUFHO1FBQzlCLE1BQU0sRUFBRSxHQUFHO0tBQ1gsQ0FBQztJQWtFRixTQUFnQix1QkFBdUIsQ0FBQyxTQUFxRDtRQUM1RixPQUFPLE9BQVEsU0FBb0MsQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDO0lBQzNFLENBQUM7SUFzQkQsU0FBZ0IsaUJBQWlCLENBQUMsU0FBMEI7UUFDM0QsT0FBTyxDQUFDLENBQUUsU0FBOEIsQ0FBQyxZQUFZLENBQUM7SUFDdkQsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBQyxTQUEwQjtRQUN4RCxPQUFPLENBQUMsQ0FBRSxTQUEyQixDQUFDLFNBQVMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsU0FBZ0IsWUFBWSxDQUFDLFNBQTBCO1FBQ3RELE9BQU8sQ0FBQyxDQUFFLFNBQXlCLENBQUMsT0FBTyxDQUFDO0lBQzdDLENBQUM7SUFJRCxTQUFnQixvQkFBb0IsQ0FBQyxvQkFBMkM7UUFDL0UsTUFBTSxxQkFBcUIsR0FBRyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0saUJBQWlCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFnQywwQkFBMEIsQ0FBQyxDQUFDO1FBRW5I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