/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/layout/browser/layoutService", "vs/base/common/platform", "vs/base/browser/window", "vs/platform/window/common/window", "vs/base/browser/browser"], function (require, exports, instantiation_1, layoutService_1, platform_1, window_1, window_2, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelOpensMaximizedOptions = exports.Position = exports.EditorActionsLocation = exports.EditorTabsMode = exports.ActivityBarPosition = exports.LayoutSettings = exports.ZenModeSettings = exports.Parts = exports.IWorkbenchLayoutService = void 0;
    exports.positionToString = positionToString;
    exports.positionFromString = positionFromString;
    exports.panelOpensMaximizedFromString = panelOpensMaximizedFromString;
    exports.shouldShowCustomTitleBar = shouldShowCustomTitleBar;
    exports.IWorkbenchLayoutService = (0, instantiation_1.refineServiceDecorator)(layoutService_1.ILayoutService);
    var Parts;
    (function (Parts) {
        Parts["TITLEBAR_PART"] = "workbench.parts.titlebar";
        Parts["BANNER_PART"] = "workbench.parts.banner";
        Parts["ACTIVITYBAR_PART"] = "workbench.parts.activitybar";
        Parts["SIDEBAR_PART"] = "workbench.parts.sidebar";
        Parts["PANEL_PART"] = "workbench.parts.panel";
        Parts["AUXILIARYBAR_PART"] = "workbench.parts.auxiliarybar";
        Parts["EDITOR_PART"] = "workbench.parts.editor";
        Parts["STATUSBAR_PART"] = "workbench.parts.statusbar";
    })(Parts || (exports.Parts = Parts = {}));
    var ZenModeSettings;
    (function (ZenModeSettings) {
        ZenModeSettings["SHOW_TABS"] = "zenMode.showTabs";
        ZenModeSettings["HIDE_LINENUMBERS"] = "zenMode.hideLineNumbers";
        ZenModeSettings["HIDE_STATUSBAR"] = "zenMode.hideStatusBar";
        ZenModeSettings["HIDE_ACTIVITYBAR"] = "zenMode.hideActivityBar";
        ZenModeSettings["CENTER_LAYOUT"] = "zenMode.centerLayout";
        ZenModeSettings["FULLSCREEN"] = "zenMode.fullScreen";
        ZenModeSettings["RESTORE"] = "zenMode.restore";
        ZenModeSettings["SILENT_NOTIFICATIONS"] = "zenMode.silentNotifications";
    })(ZenModeSettings || (exports.ZenModeSettings = ZenModeSettings = {}));
    var LayoutSettings;
    (function (LayoutSettings) {
        LayoutSettings["ACTIVITY_BAR_LOCATION"] = "workbench.activityBar.location";
        LayoutSettings["EDITOR_TABS_MODE"] = "workbench.editor.showTabs";
        LayoutSettings["EDITOR_ACTIONS_LOCATION"] = "workbench.editor.editorActionsLocation";
        LayoutSettings["COMMAND_CENTER"] = "window.commandCenter";
        LayoutSettings["LAYOUT_ACTIONS"] = "workbench.layoutControl.enabled";
    })(LayoutSettings || (exports.LayoutSettings = LayoutSettings = {}));
    var ActivityBarPosition;
    (function (ActivityBarPosition) {
        ActivityBarPosition["DEFAULT"] = "default";
        ActivityBarPosition["TOP"] = "top";
        ActivityBarPosition["BOTTOM"] = "bottom";
        ActivityBarPosition["HIDDEN"] = "hidden";
    })(ActivityBarPosition || (exports.ActivityBarPosition = ActivityBarPosition = {}));
    var EditorTabsMode;
    (function (EditorTabsMode) {
        EditorTabsMode["MULTIPLE"] = "multiple";
        EditorTabsMode["SINGLE"] = "single";
        EditorTabsMode["NONE"] = "none";
    })(EditorTabsMode || (exports.EditorTabsMode = EditorTabsMode = {}));
    var EditorActionsLocation;
    (function (EditorActionsLocation) {
        EditorActionsLocation["DEFAULT"] = "default";
        EditorActionsLocation["TITLEBAR"] = "titleBar";
        EditorActionsLocation["HIDDEN"] = "hidden";
    })(EditorActionsLocation || (exports.EditorActionsLocation = EditorActionsLocation = {}));
    var Position;
    (function (Position) {
        Position[Position["LEFT"] = 0] = "LEFT";
        Position[Position["RIGHT"] = 1] = "RIGHT";
        Position[Position["BOTTOM"] = 2] = "BOTTOM";
    })(Position || (exports.Position = Position = {}));
    var PanelOpensMaximizedOptions;
    (function (PanelOpensMaximizedOptions) {
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["ALWAYS"] = 0] = "ALWAYS";
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["NEVER"] = 1] = "NEVER";
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["REMEMBER_LAST"] = 2] = "REMEMBER_LAST";
    })(PanelOpensMaximizedOptions || (exports.PanelOpensMaximizedOptions = PanelOpensMaximizedOptions = {}));
    function positionToString(position) {
        switch (position) {
            case 0 /* Position.LEFT */: return 'left';
            case 1 /* Position.RIGHT */: return 'right';
            case 2 /* Position.BOTTOM */: return 'bottom';
            default: return 'bottom';
        }
    }
    const positionsByString = {
        [positionToString(0 /* Position.LEFT */)]: 0 /* Position.LEFT */,
        [positionToString(1 /* Position.RIGHT */)]: 1 /* Position.RIGHT */,
        [positionToString(2 /* Position.BOTTOM */)]: 2 /* Position.BOTTOM */
    };
    function positionFromString(str) {
        return positionsByString[str];
    }
    function panelOpensMaximizedSettingToString(setting) {
        switch (setting) {
            case 0 /* PanelOpensMaximizedOptions.ALWAYS */: return 'always';
            case 1 /* PanelOpensMaximizedOptions.NEVER */: return 'never';
            case 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */: return 'preserve';
            default: return 'preserve';
        }
    }
    const panelOpensMaximizedByString = {
        [panelOpensMaximizedSettingToString(0 /* PanelOpensMaximizedOptions.ALWAYS */)]: 0 /* PanelOpensMaximizedOptions.ALWAYS */,
        [panelOpensMaximizedSettingToString(1 /* PanelOpensMaximizedOptions.NEVER */)]: 1 /* PanelOpensMaximizedOptions.NEVER */,
        [panelOpensMaximizedSettingToString(2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */)]: 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */
    };
    function panelOpensMaximizedFromString(str) {
        return panelOpensMaximizedByString[str];
    }
    function shouldShowCustomTitleBar(configurationService, window, menuBarToggled) {
        if (!(0, window_2.hasCustomTitlebar)(configurationService)) {
            return false;
        }
        const inFullscreen = (0, browser_1.isFullscreen)(window);
        const nativeTitleBarEnabled = (0, window_2.hasNativeTitlebar)(configurationService);
        const showCustomTitleBar = configurationService.getValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */);
        if (showCustomTitleBar === "never" /* CustomTitleBarVisibility.NEVER */ && nativeTitleBarEnabled || showCustomTitleBar === "windowed" /* CustomTitleBarVisibility.WINDOWED */ && inFullscreen) {
            return false;
        }
        if (!isTitleBarEmpty(configurationService)) {
            return true;
        }
        // Hide custom title bar when native title bar enabled and custom title bar is empty
        if (nativeTitleBarEnabled) {
            return false;
        }
        // macOS desktop does not need a title bar when full screen
        if (platform_1.isMacintosh && platform_1.isNative) {
            return !inFullscreen;
        }
        // non-fullscreen native must show the title bar
        if (platform_1.isNative && !inFullscreen) {
            return true;
        }
        // if WCO is visible, we have to show the title bar
        if ((0, browser_1.isWCOEnabled)() && !inFullscreen) {
            return true;
        }
        // remaining behavior is based on menubar visibility
        const menuBarVisibility = !(0, window_1.isAuxiliaryWindow)(window) ? (0, window_2.getMenuBarVisibility)(configurationService) : 'hidden';
        switch (menuBarVisibility) {
            case 'classic':
                return !inFullscreen || !!menuBarToggled;
            case 'compact':
            case 'hidden':
                return false;
            case 'toggle':
                return !!menuBarToggled;
            case 'visible':
                return true;
            default:
                return platform_1.isWeb ? false : !inFullscreen || !!menuBarToggled;
        }
    }
    function isTitleBarEmpty(configurationService) {
        // with the command center enabled, we should always show
        if (configurationService.getValue("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */)) {
            return false;
        }
        // with the activity bar on top, we should always show
        const activityBarPosition = configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
        if (activityBarPosition === "top" /* ActivityBarPosition.TOP */ || activityBarPosition === "bottom" /* ActivityBarPosition.BOTTOM */) {
            return false;
        }
        // with the editor actions on top, we should always show
        const editorActionsLocation = configurationService.getValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */);
        const editorTabsMode = configurationService.getValue("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */);
        if (editorActionsLocation === "titleBar" /* EditorActionsLocation.TITLEBAR */ || editorActionsLocation === "default" /* EditorActionsLocation.DEFAULT */ && editorTabsMode === "none" /* EditorTabsMode.NONE */) {
            return false;
        }
        // with the layout actions on top, we should always show
        if (configurationService.getValue("workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */)) {
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xheW91dC9icm93c2VyL2xheW91dFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0ZoRyw0Q0FPQztJQVFELGdEQUVDO0lBaUJELHNFQUVDO0lBa01ELDREQXFEQztJQTVWWSxRQUFBLHVCQUF1QixHQUFHLElBQUEsc0NBQXNCLEVBQTBDLDhCQUFjLENBQUMsQ0FBQztJQUV2SCxJQUFrQixLQVNqQjtJQVRELFdBQWtCLEtBQUs7UUFDdEIsbURBQTBDLENBQUE7UUFDMUMsK0NBQXNDLENBQUE7UUFDdEMseURBQWdELENBQUE7UUFDaEQsaURBQXdDLENBQUE7UUFDeEMsNkNBQW9DLENBQUE7UUFDcEMsMkRBQWtELENBQUE7UUFDbEQsK0NBQXNDLENBQUE7UUFDdEMscURBQTRDLENBQUE7SUFDN0MsQ0FBQyxFQVRpQixLQUFLLHFCQUFMLEtBQUssUUFTdEI7SUFFRCxJQUFrQixlQVNqQjtJQVRELFdBQWtCLGVBQWU7UUFDaEMsaURBQThCLENBQUE7UUFDOUIsK0RBQTRDLENBQUE7UUFDNUMsMkRBQXdDLENBQUE7UUFDeEMsK0RBQTRDLENBQUE7UUFDNUMseURBQXNDLENBQUE7UUFDdEMsb0RBQWlDLENBQUE7UUFDakMsOENBQTJCLENBQUE7UUFDM0IsdUVBQW9ELENBQUE7SUFDckQsQ0FBQyxFQVRpQixlQUFlLCtCQUFmLGVBQWUsUUFTaEM7SUFFRCxJQUFrQixjQU1qQjtJQU5ELFdBQWtCLGNBQWM7UUFDL0IsMEVBQXdELENBQUE7UUFDeEQsZ0VBQThDLENBQUE7UUFDOUMsb0ZBQWtFLENBQUE7UUFDbEUseURBQXVDLENBQUE7UUFDdkMsb0VBQWtELENBQUE7SUFDbkQsQ0FBQyxFQU5pQixj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