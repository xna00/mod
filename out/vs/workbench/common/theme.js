/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/base/common/color", "vs/platform/theme/common/theme"], function (require, exports, nls_1, colorRegistry_1, color_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WINDOW_INACTIVE_BORDER = exports.WINDOW_ACTIVE_BORDER = exports.NOTIFICATIONS_INFO_ICON_FOREGROUND = exports.NOTIFICATIONS_WARNING_ICON_FOREGROUND = exports.NOTIFICATIONS_ERROR_ICON_FOREGROUND = exports.NOTIFICATIONS_BORDER = exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND = exports.NOTIFICATIONS_CENTER_HEADER_FOREGROUND = exports.NOTIFICATIONS_LINKS = exports.NOTIFICATIONS_BACKGROUND = exports.NOTIFICATIONS_FOREGROUND = exports.NOTIFICATIONS_TOAST_BORDER = exports.NOTIFICATIONS_CENTER_BORDER = exports.COMMAND_CENTER_INACTIVEBORDER = exports.COMMAND_CENTER_ACTIVEBORDER = exports.COMMAND_CENTER_BORDER = exports.COMMAND_CENTER_ACTIVEBACKGROUND = exports.COMMAND_CENTER_BACKGROUND = exports.COMMAND_CENTER_INACTIVEFOREGROUND = exports.COMMAND_CENTER_ACTIVEFOREGROUND = exports.COMMAND_CENTER_FOREGROUND = exports.MENUBAR_SELECTION_BORDER = exports.MENUBAR_SELECTION_BACKGROUND = exports.MENUBAR_SELECTION_FOREGROUND = exports.TITLE_BAR_BORDER = exports.TITLE_BAR_INACTIVE_BACKGROUND = exports.TITLE_BAR_ACTIVE_BACKGROUND = exports.TITLE_BAR_INACTIVE_FOREGROUND = exports.TITLE_BAR_ACTIVE_FOREGROUND = exports.ACTIVITY_BAR_TOP_BORDER = exports.SIDE_BAR_SECTION_HEADER_BORDER = exports.SIDE_BAR_SECTION_HEADER_FOREGROUND = exports.SIDE_BAR_SECTION_HEADER_BACKGROUND = exports.SIDE_BAR_DRAG_AND_DROP_BACKGROUND = exports.SIDE_BAR_TITLE_FOREGROUND = exports.SIDE_BAR_BORDER = exports.SIDE_BAR_FOREGROUND = exports.SIDE_BAR_BACKGROUND = exports.EXTENSION_BADGE_REMOTE_FOREGROUND = exports.EXTENSION_BADGE_REMOTE_BACKGROUND = exports.STATUS_BAR_OFFLINE_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_OFFLINE_ITEM_HOVER_FOREGROUND = exports.STATUS_BAR_OFFLINE_ITEM_FOREGROUND = exports.STATUS_BAR_OFFLINE_ITEM_BACKGROUND = exports.STATUS_BAR_REMOTE_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_REMOTE_ITEM_HOVER_FOREGROUND = exports.STATUS_BAR_REMOTE_ITEM_FOREGROUND = exports.STATUS_BAR_REMOTE_ITEM_BACKGROUND = exports.PROFILE_BADGE_FOREGROUND = exports.PROFILE_BADGE_BACKGROUND = exports.ACTIVITY_BAR_TOP_BACKGROUND = exports.ACTIVITY_BAR_TOP_DRAG_AND_DROP_BORDER = exports.ACTIVITY_BAR_TOP_INACTIVE_FOREGROUND = exports.ACTIVITY_BAR_TOP_ACTIVE_BACKGROUND = exports.ACTIVITY_BAR_TOP_ACTIVE_BORDER = exports.ACTIVITY_BAR_TOP_FOREGROUND = exports.ACTIVITY_BAR_BADGE_FOREGROUND = exports.ACTIVITY_BAR_BADGE_BACKGROUND = exports.ACTIVITY_BAR_DRAG_AND_DROP_BORDER = exports.ACTIVITY_BAR_ACTIVE_BACKGROUND = exports.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER = exports.ACTIVITY_BAR_ACTIVE_BORDER = exports.ACTIVITY_BAR_BORDER = exports.ACTIVITY_BAR_INACTIVE_FOREGROUND = exports.ACTIVITY_BAR_FOREGROUND = exports.ACTIVITY_BAR_BACKGROUND = exports.STATUS_BAR_WARNING_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_WARNING_ITEM_HOVER_FOREGROUND = exports.STATUS_BAR_WARNING_ITEM_FOREGROUND = exports.STATUS_BAR_WARNING_ITEM_BACKGROUND = exports.STATUS_BAR_ERROR_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_ERROR_ITEM_HOVER_FOREGROUND = exports.STATUS_BAR_ERROR_ITEM_FOREGROUND = exports.STATUS_BAR_ERROR_ITEM_BACKGROUND = exports.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_PROMINENT_ITEM_HOVER_FOREGROUND = exports.STATUS_BAR_PROMINENT_ITEM_BACKGROUND = exports.STATUS_BAR_PROMINENT_ITEM_FOREGROUND = exports.STATUS_BAR_ITEM_COMPACT_HOVER_BACKGROUND = exports.STATUS_BAR_ITEM_HOVER_FOREGROUND = exports.STATUS_BAR_ITEM_HOVER_BACKGROUND = exports.STATUS_BAR_ITEM_FOCUS_BORDER = exports.STATUS_BAR_ITEM_ACTIVE_BACKGROUND = exports.STATUS_BAR_NO_FOLDER_BORDER = exports.STATUS_BAR_FOCUS_BORDER = exports.STATUS_BAR_BORDER = exports.STATUS_BAR_NO_FOLDER_BACKGROUND = exports.STATUS_BAR_BACKGROUND = exports.STATUS_BAR_NO_FOLDER_FOREGROUND = exports.STATUS_BAR_FOREGROUND = exports.BANNER_ICON_FOREGROUND = exports.BANNER_FOREGROUND = exports.BANNER_BACKGROUND = exports.PANEL_SECTION_BORDER = exports.PANEL_SECTION_HEADER_BORDER = exports.PANEL_SECTION_HEADER_FOREGROUND = exports.PANEL_SECTION_HEADER_BACKGROUND = exports.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND = exports.PANEL_DRAG_AND_DROP_BORDER = exports.PANEL_INPUT_BORDER = exports.PANEL_ACTIVE_TITLE_BORDER = exports.PANEL_INACTIVE_TITLE_FOREGROUND = exports.PANEL_ACTIVE_TITLE_FOREGROUND = exports.PANEL_BORDER = exports.PANEL_BACKGROUND = exports.SIDE_BY_SIDE_EDITOR_VERTICAL_BORDER = exports.SIDE_BY_SIDE_EDITOR_HORIZONTAL_BORDER = exports.EDITOR_DROP_INTO_PROMPT_BORDER = exports.EDITOR_DROP_INTO_PROMPT_BACKGROUND = exports.EDITOR_DROP_INTO_PROMPT_FOREGROUND = exports.EDITOR_DRAG_AND_DROP_BACKGROUND = exports.EDITOR_GROUP_BORDER = exports.EDITOR_GROUP_HEADER_BORDER = exports.EDITOR_GROUP_HEADER_NO_TABS_BACKGROUND = exports.EDITOR_GROUP_HEADER_TABS_BORDER = exports.EDITOR_GROUP_HEADER_TABS_BACKGROUND = exports.EDITOR_GROUP_FOCUSED_EMPTY_BORDER = exports.EDITOR_GROUP_EMPTY_BACKGROUND = exports.EDITOR_PANE_BACKGROUND = exports.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER = exports.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER = exports.TAB_INACTIVE_MODIFIED_BORDER = exports.TAB_ACTIVE_MODIFIED_BORDER = exports.TAB_DRAG_AND_DROP_BORDER = exports.TAB_UNFOCUSED_HOVER_BORDER = exports.TAB_HOVER_BORDER = exports.TAB_UNFOCUSED_ACTIVE_BORDER_TOP = exports.TAB_ACTIVE_BORDER_TOP = exports.TAB_UNFOCUSED_ACTIVE_BORDER = exports.TAB_ACTIVE_BORDER = exports.TAB_LAST_PINNED_BORDER = exports.TAB_BORDER = exports.TAB_UNFOCUSED_HOVER_FOREGROUND = exports.TAB_HOVER_FOREGROUND = exports.TAB_UNFOCUSED_HOVER_BACKGROUND = exports.TAB_HOVER_BACKGROUND = exports.TAB_UNFOCUSED_INACTIVE_FOREGROUND = exports.TAB_UNFOCUSED_ACTIVE_FOREGROUND = exports.TAB_INACTIVE_FOREGROUND = exports.TAB_ACTIVE_FOREGROUND = exports.TAB_UNFOCUSED_INACTIVE_BACKGROUND = exports.TAB_INACTIVE_BACKGROUND = exports.TAB_UNFOCUSED_ACTIVE_BACKGROUND = exports.TAB_ACTIVE_BACKGROUND = void 0;
    exports.WORKBENCH_BACKGROUND = WORKBENCH_BACKGROUND;
    // < --- Workbench (not customizable) --- >
    function WORKBENCH_BACKGROUND(theme) {
        switch (theme.type) {
            case theme_1.ColorScheme.LIGHT:
                return color_1.Color.fromHex('#F3F3F3');
            case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT:
                return color_1.Color.fromHex('#FFFFFF');
            case theme_1.ColorScheme.HIGH_CONTRAST_DARK:
                return color_1.Color.fromHex('#000000');
            default:
                return color_1.Color.fromHex('#252526');
        }
    }
    // < --- Tabs --- >
    //#region Tab Background
    exports.TAB_ACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('tab.activeBackground', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hcDark: colorRegistry_1.editorBackground,
        hcLight: colorRegistry_1.editorBackground
    }, (0, nls_1.localize)('tabActiveBackground', "Active tab background color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('tab.unfocusedActiveBackground', {
        dark: exports.TAB_ACTIVE_BACKGROUND,
        light: exports.TAB_ACTIVE_BACKGROUND,
        hcDark: exports.TAB_ACTIVE_BACKGROUND,
        hcLight: exports.TAB_ACTIVE_BACKGROUND,
    }, (0, nls_1.localize)('tabUnfocusedActiveBackground', "Active tab background color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_INACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('tab.inactiveBackground', {
        dark: '#2D2D2D',
        light: '#ECECEC',
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('tabInactiveBackground', "Inactive tab background color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_INACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('tab.unfocusedInactiveBackground', {
        dark: exports.TAB_INACTIVE_BACKGROUND,
        light: exports.TAB_INACTIVE_BACKGROUND,
        hcDark: exports.TAB_INACTIVE_BACKGROUND,
        hcLight: exports.TAB_INACTIVE_BACKGROUND
    }, (0, nls_1.localize)('tabUnfocusedInactiveBackground', "Inactive tab background color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Foreground
    exports.TAB_ACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('tab.activeForeground', {
        dark: color_1.Color.white,
        light: '#333333',
        hcDark: color_1.Color.white,
        hcLight: '#292929'
    }, (0, nls_1.localize)('tabActiveForeground', "Active tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_INACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('tab.inactiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_FOREGROUND, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_FOREGROUND, 0.7),
        hcDark: color_1.Color.white,
        hcLight: '#292929'
    }, (0, nls_1.localize)('tabInactiveForeground', "Inactive tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('tab.unfocusedActiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_FOREGROUND, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_FOREGROUND, 0.7),
        hcDark: color_1.Color.white,
        hcLight: '#292929'
    }, (0, nls_1.localize)('tabUnfocusedActiveForeground', "Active tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_INACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('tab.unfocusedInactiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_INACTIVE_FOREGROUND, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_INACTIVE_FOREGROUND, 0.5),
        hcDark: color_1.Color.white,
        hcLight: '#292929'
    }, (0, nls_1.localize)('tabUnfocusedInactiveForeground', "Inactive tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Hover Foreground/Background
    exports.TAB_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('tab.hoverBackground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabHoverBackground', "Tab background color when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('tab.unfocusedHoverBackground', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_HOVER_BACKGROUND, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_HOVER_BACKGROUND, 0.7),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabUnfocusedHoverBackground', "Tab background color in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('tab.hoverForeground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('tabHoverForeground', "Tab foreground color when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('tab.unfocusedHoverForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_HOVER_FOREGROUND, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_HOVER_FOREGROUND, 0.5),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabUnfocusedHoverForeground', "Tab foreground color in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Borders
    exports.TAB_BORDER = (0, colorRegistry_1.registerColor)('tab.border', {
        dark: '#252526',
        light: '#F3F3F3',
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder,
    }, (0, nls_1.localize)('tabBorder', "Border to separate tabs from each other. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_LAST_PINNED_BORDER = (0, colorRegistry_1.registerColor)('tab.lastPinnedBorder', {
        dark: colorRegistry_1.treeIndentGuidesStroke,
        light: colorRegistry_1.treeIndentGuidesStroke,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('lastPinnedTabBorder', "Border to separate pinned tabs from other tabs. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_ACTIVE_BORDER = (0, colorRegistry_1.registerColor)('tab.activeBorder', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabActiveBorder', "Border on the bottom of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_BORDER = (0, colorRegistry_1.registerColor)('tab.unfocusedActiveBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_BORDER, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_BORDER, 0.7),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabActiveUnfocusedBorder', "Border on the bottom of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_ACTIVE_BORDER_TOP = (0, colorRegistry_1.registerColor)('tab.activeBorderTop', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('tabActiveBorderTop', "Border to the top of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_BORDER_TOP = (0, colorRegistry_1.registerColor)('tab.unfocusedActiveBorderTop', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_BORDER_TOP, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_BORDER_TOP, 0.7),
        hcDark: null,
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('tabActiveUnfocusedBorderTop', "Border to the top of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_HOVER_BORDER = (0, colorRegistry_1.registerColor)('tab.hoverBorder', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabHoverBorder', "Border to highlight tabs when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_HOVER_BORDER = (0, colorRegistry_1.registerColor)('tab.unfocusedHoverBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_HOVER_BORDER, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_HOVER_BORDER, 0.7),
        hcDark: null,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('tabUnfocusedHoverBorder', "Border to highlight tabs in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Drag and Drop Border
    exports.TAB_DRAG_AND_DROP_BORDER = (0, colorRegistry_1.registerColor)('tab.dragAndDropBorder', {
        dark: exports.TAB_ACTIVE_FOREGROUND,
        light: exports.TAB_ACTIVE_FOREGROUND,
        hcDark: colorRegistry_1.activeContrastBorder,
        hcLight: colorRegistry_1.activeContrastBorder
    }, (0, nls_1.localize)('tabDragAndDropBorder', "Border between tabs to indicate that a tab can be inserted between two tabs. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    //#region Tab Modified Border
    exports.TAB_ACTIVE_MODIFIED_BORDER = (0, colorRegistry_1.registerColor)('tab.activeModifiedBorder', {
        dark: '#3399CC',
        light: '#33AAEE',
        hcDark: null,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('tabActiveModifiedBorder', "Border on the top of modified active tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_INACTIVE_MODIFIED_BORDER = (0, colorRegistry_1.registerColor)('tab.inactiveModifiedBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.5),
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('tabInactiveModifiedBorder', "Border on the top of modified inactive tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER = (0, colorRegistry_1.registerColor)('tab.unfocusedActiveModifiedBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_ACTIVE_MODIFIED_BORDER, 0.7),
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('unfocusedActiveModifiedBorder', "Border on the top of modified active tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    exports.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER = (0, colorRegistry_1.registerColor)('tab.unfocusedInactiveModifiedBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.TAB_INACTIVE_MODIFIED_BORDER, 0.5),
        light: (0, colorRegistry_1.transparent)(exports.TAB_INACTIVE_MODIFIED_BORDER, 0.5),
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('unfocusedINactiveModifiedBorder', "Border on the top of modified inactive tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups."));
    //#endregion
    // < --- Editors --- >
    exports.EDITOR_PANE_BACKGROUND = (0, colorRegistry_1.registerColor)('editorPane.background', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hcDark: colorRegistry_1.editorBackground,
        hcLight: colorRegistry_1.editorBackground
    }, (0, nls_1.localize)('editorPaneBackground', "Background color of the editor pane visible on the left and right side of the centered editor layout."));
    exports.EDITOR_GROUP_EMPTY_BACKGROUND = (0, colorRegistry_1.registerColor)('editorGroup.emptyBackground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('editorGroupEmptyBackground', "Background color of an empty editor group. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_FOCUSED_EMPTY_BORDER = (0, colorRegistry_1.registerColor)('editorGroup.focusedEmptyBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, (0, nls_1.localize)('editorGroupFocusedEmptyBorder', "Border color of an empty editor group that is focused. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_TABS_BACKGROUND = (0, colorRegistry_1.registerColor)('editorGroupHeader.tabsBackground', {
        dark: '#252526',
        light: '#F3F3F3',
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabsContainerBackground', "Background color of the editor group title header when tabs are enabled. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_TABS_BORDER = (0, colorRegistry_1.registerColor)('editorGroupHeader.tabsBorder', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('tabsContainerBorder', "Border color of the editor group title header when tabs are enabled. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_NO_TABS_BACKGROUND = (0, colorRegistry_1.registerColor)('editorGroupHeader.noTabsBackground', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hcDark: colorRegistry_1.editorBackground,
        hcLight: colorRegistry_1.editorBackground
    }, (0, nls_1.localize)('editorGroupHeaderBackground', "Background color of the editor group title header when (`\"workbench.editor.showTabs\": \"single\"`). Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_HEADER_BORDER = (0, colorRegistry_1.registerColor)('editorGroupHeader.border', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('editorTitleContainerBorder', "Border color of the editor group title header. Editor groups are the containers of editors."));
    exports.EDITOR_GROUP_BORDER = (0, colorRegistry_1.registerColor)('editorGroup.border', {
        dark: '#444444',
        light: '#E7E7E7',
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('editorGroupBorder', "Color to separate multiple editor groups from each other. Editor groups are the containers of editors."));
    exports.EDITOR_DRAG_AND_DROP_BACKGROUND = (0, colorRegistry_1.registerColor)('editorGroup.dropBackground', {
        dark: color_1.Color.fromHex('#53595D').transparent(0.5),
        light: color_1.Color.fromHex('#2677CB').transparent(0.18),
        hcDark: null,
        hcLight: color_1.Color.fromHex('#0F4A85').transparent(0.50)
    }, (0, nls_1.localize)('editorDragAndDropBackground', "Background color when dragging editors around. The color should have transparency so that the editor contents can still shine through."));
    exports.EDITOR_DROP_INTO_PROMPT_FOREGROUND = (0, colorRegistry_1.registerColor)('editorGroup.dropIntoPromptForeground', {
        dark: colorRegistry_1.editorWidgetForeground,
        light: colorRegistry_1.editorWidgetForeground,
        hcDark: colorRegistry_1.editorWidgetForeground,
        hcLight: colorRegistry_1.editorWidgetForeground
    }, (0, nls_1.localize)('editorDropIntoPromptForeground', "Foreground color of text shown over editors when dragging files. This text informs the user that they can hold shift to drop into the editor."));
    exports.EDITOR_DROP_INTO_PROMPT_BACKGROUND = (0, colorRegistry_1.registerColor)('editorGroup.dropIntoPromptBackground', {
        dark: colorRegistry_1.editorWidgetBackground,
        light: colorRegistry_1.editorWidgetBackground,
        hcDark: colorRegistry_1.editorWidgetBackground,
        hcLight: colorRegistry_1.editorWidgetBackground
    }, (0, nls_1.localize)('editorDropIntoPromptBackground', "Background color of text shown over editors when dragging files. This text informs the user that they can hold shift to drop into the editor."));
    exports.EDITOR_DROP_INTO_PROMPT_BORDER = (0, colorRegistry_1.registerColor)('editorGroup.dropIntoPromptBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('editorDropIntoPromptBorder', "Border color of text shown over editors when dragging files. This text informs the user that they can hold shift to drop into the editor."));
    exports.SIDE_BY_SIDE_EDITOR_HORIZONTAL_BORDER = (0, colorRegistry_1.registerColor)('sideBySideEditor.horizontalBorder', {
        dark: exports.EDITOR_GROUP_BORDER,
        light: exports.EDITOR_GROUP_BORDER,
        hcDark: exports.EDITOR_GROUP_BORDER,
        hcLight: exports.EDITOR_GROUP_BORDER
    }, (0, nls_1.localize)('sideBySideEditor.horizontalBorder', "Color to separate two editors from each other when shown side by side in an editor group from top to bottom."));
    exports.SIDE_BY_SIDE_EDITOR_VERTICAL_BORDER = (0, colorRegistry_1.registerColor)('sideBySideEditor.verticalBorder', {
        dark: exports.EDITOR_GROUP_BORDER,
        light: exports.EDITOR_GROUP_BORDER,
        hcDark: exports.EDITOR_GROUP_BORDER,
        hcLight: exports.EDITOR_GROUP_BORDER
    }, (0, nls_1.localize)('sideBySideEditor.verticalBorder', "Color to separate two editors from each other when shown side by side in an editor group from left to right."));
    // < --- Panels --- >
    exports.PANEL_BACKGROUND = (0, colorRegistry_1.registerColor)('panel.background', {
        dark: colorRegistry_1.editorBackground,
        light: colorRegistry_1.editorBackground,
        hcDark: colorRegistry_1.editorBackground,
        hcLight: colorRegistry_1.editorBackground
    }, (0, nls_1.localize)('panelBackground', "Panel background color. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_BORDER = (0, colorRegistry_1.registerColor)('panel.border', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('panelBorder', "Panel border color to separate the panel from the editor. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_ACTIVE_TITLE_FOREGROUND = (0, colorRegistry_1.registerColor)('panelTitle.activeForeground', {
        dark: '#E7E7E7',
        light: '#424242',
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('panelActiveTitleForeground', "Title color for the active panel. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_INACTIVE_TITLE_FOREGROUND = (0, colorRegistry_1.registerColor)('panelTitle.inactiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.PANEL_ACTIVE_TITLE_FOREGROUND, 0.6),
        light: (0, colorRegistry_1.transparent)(exports.PANEL_ACTIVE_TITLE_FOREGROUND, 0.75),
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('panelInactiveTitleForeground', "Title color for the inactive panel. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_ACTIVE_TITLE_BORDER = (0, colorRegistry_1.registerColor)('panelTitle.activeBorder', {
        dark: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        light: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('panelActiveTitleBorder', "Border color for the active panel title. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_INPUT_BORDER = (0, colorRegistry_1.registerColor)('panelInput.border', {
        dark: colorRegistry_1.inputBorder,
        light: color_1.Color.fromHex('#ddd'),
        hcDark: colorRegistry_1.inputBorder,
        hcLight: colorRegistry_1.inputBorder
    }, (0, nls_1.localize)('panelInputBorder', "Input box border for inputs in the panel."));
    exports.PANEL_DRAG_AND_DROP_BORDER = (0, colorRegistry_1.registerColor)('panel.dropBorder', {
        dark: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        light: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        hcDark: exports.PANEL_ACTIVE_TITLE_FOREGROUND,
        hcLight: exports.PANEL_ACTIVE_TITLE_FOREGROUND
    }, (0, nls_1.localize)('panelDragAndDropBorder', "Drag and drop feedback color for the panel titles. Panels are shown below the editor area and contain views like output and integrated terminal."));
    exports.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND = (0, colorRegistry_1.registerColor)('panelSection.dropBackground', {
        dark: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        light: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        hcDark: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        hcLight: exports.EDITOR_DRAG_AND_DROP_BACKGROUND
    }, (0, nls_1.localize)('panelSectionDragAndDropBackground', "Drag and drop feedback color for the panel sections. The color should have transparency so that the panel sections can still shine through. Panels are shown below the editor area and contain views like output and integrated terminal. Panel sections are views nested within the panels."));
    exports.PANEL_SECTION_HEADER_BACKGROUND = (0, colorRegistry_1.registerColor)('panelSectionHeader.background', {
        dark: color_1.Color.fromHex('#808080').transparent(0.2),
        light: color_1.Color.fromHex('#808080').transparent(0.2),
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('panelSectionHeaderBackground', "Panel section header background color. Panels are shown below the editor area and contain views like output and integrated terminal. Panel sections are views nested within the panels."));
    exports.PANEL_SECTION_HEADER_FOREGROUND = (0, colorRegistry_1.registerColor)('panelSectionHeader.foreground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('panelSectionHeaderForeground', "Panel section header foreground color. Panels are shown below the editor area and contain views like output and integrated terminal. Panel sections are views nested within the panels."));
    exports.PANEL_SECTION_HEADER_BORDER = (0, colorRegistry_1.registerColor)('panelSectionHeader.border', {
        dark: colorRegistry_1.contrastBorder,
        light: colorRegistry_1.contrastBorder,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('panelSectionHeaderBorder', "Panel section header border color used when multiple views are stacked vertically in the panel. Panels are shown below the editor area and contain views like output and integrated terminal. Panel sections are views nested within the panels."));
    exports.PANEL_SECTION_BORDER = (0, colorRegistry_1.registerColor)('panelSection.border', {
        dark: exports.PANEL_BORDER,
        light: exports.PANEL_BORDER,
        hcDark: exports.PANEL_BORDER,
        hcLight: exports.PANEL_BORDER
    }, (0, nls_1.localize)('panelSectionBorder', "Panel section border color used when multiple views are stacked horizontally in the panel. Panels are shown below the editor area and contain views like output and integrated terminal. Panel sections are views nested within the panels."));
    // < --- Output Editor -->
    const OUTPUT_VIEW_BACKGROUND = (0, colorRegistry_1.registerColor)('outputView.background', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('outputViewBackground', "Output view background color."));
    (0, colorRegistry_1.registerColor)('outputViewStickyScroll.background', {
        dark: OUTPUT_VIEW_BACKGROUND,
        light: OUTPUT_VIEW_BACKGROUND,
        hcDark: OUTPUT_VIEW_BACKGROUND,
        hcLight: OUTPUT_VIEW_BACKGROUND
    }, (0, nls_1.localize)('outputViewStickyScrollBackground', "Output view sticky scroll background color."));
    // < --- Banner --- >
    exports.BANNER_BACKGROUND = (0, colorRegistry_1.registerColor)('banner.background', {
        dark: colorRegistry_1.listActiveSelectionBackground,
        light: (0, colorRegistry_1.darken)(colorRegistry_1.listActiveSelectionBackground, 0.3),
        hcDark: colorRegistry_1.listActiveSelectionBackground,
        hcLight: colorRegistry_1.listActiveSelectionBackground
    }, (0, nls_1.localize)('banner.background', "Banner background color. The banner is shown under the title bar of the window."));
    exports.BANNER_FOREGROUND = (0, colorRegistry_1.registerColor)('banner.foreground', {
        dark: colorRegistry_1.listActiveSelectionForeground,
        light: colorRegistry_1.listActiveSelectionForeground,
        hcDark: colorRegistry_1.listActiveSelectionForeground,
        hcLight: colorRegistry_1.listActiveSelectionForeground
    }, (0, nls_1.localize)('banner.foreground', "Banner foreground color. The banner is shown under the title bar of the window."));
    exports.BANNER_ICON_FOREGROUND = (0, colorRegistry_1.registerColor)('banner.iconForeground', {
        dark: colorRegistry_1.editorInfoForeground,
        light: colorRegistry_1.editorInfoForeground,
        hcDark: colorRegistry_1.editorInfoForeground,
        hcLight: colorRegistry_1.editorInfoForeground
    }, (0, nls_1.localize)('banner.iconForeground', "Banner icon color. The banner is shown under the title bar of the window."));
    // < --- Status --- >
    exports.STATUS_BAR_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBar.foreground', {
        dark: '#FFFFFF',
        light: '#FFFFFF',
        hcDark: '#FFFFFF',
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('statusBarForeground', "Status bar foreground color when a workspace or folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_NO_FOLDER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBar.noFolderForeground', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hcDark: exports.STATUS_BAR_FOREGROUND,
        hcLight: exports.STATUS_BAR_FOREGROUND
    }, (0, nls_1.localize)('statusBarNoFolderForeground', "Status bar foreground color when no folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBar.background', {
        dark: '#007ACC',
        light: '#007ACC',
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('statusBarBackground', "Status bar background color when a workspace or folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_NO_FOLDER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBar.noFolderBackground', {
        dark: '#68217A',
        light: '#68217A',
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('statusBarNoFolderBackground', "Status bar background color when no folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_BORDER = (0, colorRegistry_1.registerColor)('statusBar.border', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('statusBarBorder', "Status bar border color separating to the sidebar and editor. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_FOCUS_BORDER = (0, colorRegistry_1.registerColor)('statusBar.focusBorder', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hcDark: null,
        hcLight: exports.STATUS_BAR_FOREGROUND
    }, (0, nls_1.localize)('statusBarFocusBorder', "Status bar border color when focused on keyboard navigation. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_NO_FOLDER_BORDER = (0, colorRegistry_1.registerColor)('statusBar.noFolderBorder', {
        dark: exports.STATUS_BAR_BORDER,
        light: exports.STATUS_BAR_BORDER,
        hcDark: exports.STATUS_BAR_BORDER,
        hcLight: exports.STATUS_BAR_BORDER
    }, (0, nls_1.localize)('statusBarNoFolderBorder', "Status bar border color separating to the sidebar and editor when no folder is opened. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_ACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.activeBackground', {
        dark: color_1.Color.white.transparent(0.18),
        light: color_1.Color.white.transparent(0.18),
        hcDark: color_1.Color.white.transparent(0.18),
        hcLight: color_1.Color.black.transparent(0.18)
    }, (0, nls_1.localize)('statusBarItemActiveBackground', "Status bar item background color when clicking. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_FOCUS_BORDER = (0, colorRegistry_1.registerColor)('statusBarItem.focusBorder', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hcDark: null,
        hcLight: colorRegistry_1.activeContrastBorder
    }, (0, nls_1.localize)('statusBarItemFocusBorder', "Status bar item border color when focused on keyboard navigation. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.hoverBackground', {
        dark: color_1.Color.white.transparent(0.12),
        light: color_1.Color.white.transparent(0.12),
        hcDark: color_1.Color.white.transparent(0.12),
        hcLight: color_1.Color.black.transparent(0.12)
    }, (0, nls_1.localize)('statusBarItemHoverBackground', "Status bar item background color when hovering. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.hoverForeground', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hcDark: exports.STATUS_BAR_FOREGROUND,
        hcLight: exports.STATUS_BAR_FOREGROUND
    }, (0, nls_1.localize)('statusBarItemHoverForeground', "Status bar item foreground color when hovering. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ITEM_COMPACT_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.compactHoverBackground', {
        dark: color_1.Color.white.transparent(0.20),
        light: color_1.Color.white.transparent(0.20),
        hcDark: color_1.Color.white.transparent(0.20),
        hcLight: color_1.Color.black.transparent(0.20)
    }, (0, nls_1.localize)('statusBarItemCompactHoverBackground', "Status bar item background color when hovering an item that contains two hovers. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.prominentForeground', {
        dark: exports.STATUS_BAR_FOREGROUND,
        light: exports.STATUS_BAR_FOREGROUND,
        hcDark: exports.STATUS_BAR_FOREGROUND,
        hcLight: exports.STATUS_BAR_FOREGROUND
    }, (0, nls_1.localize)('statusBarProminentItemForeground', "Status bar prominent items foreground color. Prominent items stand out from other status bar entries to indicate importance. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.prominentBackground', {
        dark: color_1.Color.black.transparent(0.5),
        light: color_1.Color.black.transparent(0.5),
        hcDark: color_1.Color.black.transparent(0.5),
        hcLight: color_1.Color.black.transparent(0.5),
    }, (0, nls_1.localize)('statusBarProminentItemBackground', "Status bar prominent items background color. Prominent items stand out from other status bar entries to indicate importance. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.prominentHoverForeground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND
    }, (0, nls_1.localize)('statusBarProminentItemHoverForeground', "Status bar prominent items foreground color when hovering. Prominent items stand out from other status bar entries to indicate importance. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.prominentHoverBackground', {
        dark: color_1.Color.black.transparent(0.3),
        light: color_1.Color.black.transparent(0.3),
        hcDark: color_1.Color.black.transparent(0.3),
        hcLight: null
    }, (0, nls_1.localize)('statusBarProminentItemHoverBackground', "Status bar prominent items background color when hovering. Prominent items stand out from other status bar entries to indicate importance. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ERROR_ITEM_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.errorBackground', {
        dark: (0, colorRegistry_1.darken)(colorRegistry_1.errorForeground, .4),
        light: (0, colorRegistry_1.darken)(colorRegistry_1.errorForeground, .4),
        hcDark: null,
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('statusBarErrorItemBackground', "Status bar error items background color. Error items stand out from other status bar entries to indicate error conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ERROR_ITEM_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.errorForeground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hcDark: color_1.Color.white,
        hcLight: color_1.Color.white
    }, (0, nls_1.localize)('statusBarErrorItemForeground', "Status bar error items foreground color. Error items stand out from other status bar entries to indicate error conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ERROR_ITEM_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.errorHoverForeground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND
    }, (0, nls_1.localize)('statusBarErrorItemHoverForeground', "Status bar error items foreground color when hovering. Error items stand out from other status bar entries to indicate error conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_ERROR_ITEM_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.errorHoverBackground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND
    }, (0, nls_1.localize)('statusBarErrorItemHoverBackground', "Status bar error items background color when hovering. Error items stand out from other status bar entries to indicate error conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_WARNING_ITEM_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.warningBackground', {
        dark: (0, colorRegistry_1.darken)(colorRegistry_1.editorWarningForeground, .4),
        light: (0, colorRegistry_1.darken)(colorRegistry_1.editorWarningForeground, .4),
        hcDark: null,
        hcLight: '#895503'
    }, (0, nls_1.localize)('statusBarWarningItemBackground', "Status bar warning items background color. Warning items stand out from other status bar entries to indicate warning conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_WARNING_ITEM_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.warningForeground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hcDark: color_1.Color.white,
        hcLight: color_1.Color.white
    }, (0, nls_1.localize)('statusBarWarningItemForeground', "Status bar warning items foreground color. Warning items stand out from other status bar entries to indicate warning conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_WARNING_ITEM_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.warningHoverForeground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND
    }, (0, nls_1.localize)('statusBarWarningItemHoverForeground', "Status bar warning items foreground color when hovering. Warning items stand out from other status bar entries to indicate warning conditions. The status bar is shown in the bottom of the window."));
    exports.STATUS_BAR_WARNING_ITEM_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.warningHoverBackground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND
    }, (0, nls_1.localize)('statusBarWarningItemHoverBackground', "Status bar warning items background color when hovering. Warning items stand out from other status bar entries to indicate warning conditions. The status bar is shown in the bottom of the window."));
    // < --- Activity Bar --- >
    exports.ACTIVITY_BAR_BACKGROUND = (0, colorRegistry_1.registerColor)('activityBar.background', {
        dark: '#333333',
        light: '#2C2C2C',
        hcDark: '#000000',
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('activityBarBackground', "Activity bar background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_FOREGROUND = (0, colorRegistry_1.registerColor)('activityBar.foreground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('activityBarForeground', "Activity bar item foreground color when it is active. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_INACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('activityBar.inactiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.ACTIVITY_BAR_FOREGROUND, 0.4),
        light: (0, colorRegistry_1.transparent)(exports.ACTIVITY_BAR_FOREGROUND, 0.4),
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('activityBarInActiveForeground', "Activity bar item foreground color when it is inactive. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_BORDER = (0, colorRegistry_1.registerColor)('activityBar.border', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('activityBarBorder', "Activity bar border color separating to the side bar. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_ACTIVE_BORDER = (0, colorRegistry_1.registerColor)('activityBar.activeBorder', {
        dark: exports.ACTIVITY_BAR_FOREGROUND,
        light: exports.ACTIVITY_BAR_FOREGROUND,
        hcDark: null,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('activityBarActiveBorder', "Activity bar border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER = (0, colorRegistry_1.registerColor)('activityBar.activeFocusBorder', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('activityBarActiveFocusBorder', "Activity bar focus border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_ACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('activityBar.activeBackground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('activityBarActiveBackground', "Activity bar background color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_DRAG_AND_DROP_BORDER = (0, colorRegistry_1.registerColor)('activityBar.dropBorder', {
        dark: exports.ACTIVITY_BAR_FOREGROUND,
        light: exports.ACTIVITY_BAR_FOREGROUND,
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('activityBarDragAndDropBorder', "Drag and drop feedback color for the activity bar items. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_BADGE_BACKGROUND = (0, colorRegistry_1.registerColor)('activityBarBadge.background', {
        dark: '#007ACC',
        light: '#007ACC',
        hcDark: '#000000',
        hcLight: '#0F4A85'
    }, (0, nls_1.localize)('activityBarBadgeBackground', "Activity notification badge background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_BADGE_FOREGROUND = (0, colorRegistry_1.registerColor)('activityBarBadge.foreground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hcDark: color_1.Color.white,
        hcLight: color_1.Color.white
    }, (0, nls_1.localize)('activityBarBadgeForeground', "Activity notification badge foreground color. The activity bar is showing on the far left or right and allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_TOP_FOREGROUND = (0, colorRegistry_1.registerColor)('activityBarTop.foreground', {
        dark: '#E7E7E7',
        light: '#424242',
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('activityBarTop', "Active foreground color of the item in the Activity bar when it is on top / bottom. The activity allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_TOP_ACTIVE_BORDER = (0, colorRegistry_1.registerColor)('activityBarTop.activeBorder', {
        dark: exports.ACTIVITY_BAR_TOP_FOREGROUND,
        light: exports.ACTIVITY_BAR_TOP_FOREGROUND,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('activityBarTopActiveFocusBorder', "Focus border color for the active item in the Activity bar when it is on top / bottom. The activity allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_TOP_ACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('activityBarTop.activeBackground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('activityBarTopActiveBackground', "Background color for the active item in the Activity bar when it is on top / bottom. The activity allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_TOP_INACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('activityBarTop.inactiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.ACTIVITY_BAR_TOP_FOREGROUND, 0.6),
        light: (0, colorRegistry_1.transparent)(exports.ACTIVITY_BAR_TOP_FOREGROUND, 0.75),
        hcDark: color_1.Color.white,
        hcLight: colorRegistry_1.editorForeground
    }, (0, nls_1.localize)('activityBarTopInActiveForeground', "Inactive foreground color of the item in the Activity bar when it is on top / bottom. The activity allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_TOP_DRAG_AND_DROP_BORDER = (0, colorRegistry_1.registerColor)('activityBarTop.dropBorder', {
        dark: exports.ACTIVITY_BAR_TOP_FOREGROUND,
        light: exports.ACTIVITY_BAR_TOP_FOREGROUND,
        hcDark: exports.ACTIVITY_BAR_TOP_FOREGROUND,
        hcLight: exports.ACTIVITY_BAR_TOP_FOREGROUND
    }, (0, nls_1.localize)('activityBarTopDragAndDropBorder', "Drag and drop feedback color for the items in the Activity bar when it is on top / bottom. The activity allows to switch between views of the side bar."));
    exports.ACTIVITY_BAR_TOP_BACKGROUND = (0, colorRegistry_1.registerColor)('activityBarTop.background', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('activityBarTopBackground', "Background color of the activity bar when set to top / bottom."));
    // < --- Profiles --- >
    exports.PROFILE_BADGE_BACKGROUND = (0, colorRegistry_1.registerColor)('profileBadge.background', {
        dark: '#4D4D4D',
        light: '#C4C4C4',
        hcDark: color_1.Color.white,
        hcLight: color_1.Color.black
    }, (0, nls_1.localize)('profileBadgeBackground', "Profile badge background color. The profile badge shows on top of the settings gear icon in the activity bar."));
    exports.PROFILE_BADGE_FOREGROUND = (0, colorRegistry_1.registerColor)('profileBadge.foreground', {
        dark: color_1.Color.white,
        light: '#333333',
        hcDark: color_1.Color.black,
        hcLight: color_1.Color.white
    }, (0, nls_1.localize)('profileBadgeForeground', "Profile badge foreground color. The profile badge shows on top of the settings gear icon in the activity bar."));
    // < --- Remote --- >
    exports.STATUS_BAR_REMOTE_ITEM_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.remoteBackground', {
        dark: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        light: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        hcDark: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        hcLight: exports.ACTIVITY_BAR_BADGE_BACKGROUND
    }, (0, nls_1.localize)('statusBarItemHostBackground', "Background color for the remote indicator on the status bar."));
    exports.STATUS_BAR_REMOTE_ITEM_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.remoteForeground', {
        dark: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        light: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        hcDark: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        hcLight: exports.ACTIVITY_BAR_BADGE_FOREGROUND
    }, (0, nls_1.localize)('statusBarItemHostForeground', "Foreground color for the remote indicator on the status bar."));
    exports.STATUS_BAR_REMOTE_ITEM_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.remoteHoverForeground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND
    }, (0, nls_1.localize)('statusBarRemoteItemHoverForeground', "Foreground color for the remote indicator on the status bar when hovering."));
    exports.STATUS_BAR_REMOTE_ITEM_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.remoteHoverBackground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcLight: null
    }, (0, nls_1.localize)('statusBarRemoteItemHoverBackground', "Background color for the remote indicator on the status bar when hovering."));
    exports.STATUS_BAR_OFFLINE_ITEM_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.offlineBackground', {
        dark: '#6c1717',
        light: '#6c1717',
        hcDark: '#6c1717',
        hcLight: '#6c1717'
    }, (0, nls_1.localize)('statusBarItemOfflineBackground', "Status bar item background color when the workbench is offline."));
    exports.STATUS_BAR_OFFLINE_ITEM_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.offlineForeground', {
        dark: exports.STATUS_BAR_REMOTE_ITEM_FOREGROUND,
        light: exports.STATUS_BAR_REMOTE_ITEM_FOREGROUND,
        hcDark: exports.STATUS_BAR_REMOTE_ITEM_FOREGROUND,
        hcLight: exports.STATUS_BAR_REMOTE_ITEM_FOREGROUND
    }, (0, nls_1.localize)('statusBarItemOfflineForeground', "Status bar item foreground color when the workbench is offline."));
    exports.STATUS_BAR_OFFLINE_ITEM_HOVER_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.offlineHoverForeground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND,
        hcLight: exports.STATUS_BAR_ITEM_HOVER_FOREGROUND
    }, (0, nls_1.localize)('statusBarOfflineItemHoverForeground', "Status bar item foreground hover color when the workbench is offline."));
    exports.STATUS_BAR_OFFLINE_ITEM_HOVER_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBarItem.offlineHoverBackground', {
        dark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        light: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcDark: exports.STATUS_BAR_ITEM_HOVER_BACKGROUND,
        hcLight: null
    }, (0, nls_1.localize)('statusBarOfflineItemHoverBackground', "Status bar item background hover color when the workbench is offline."));
    exports.EXTENSION_BADGE_REMOTE_BACKGROUND = (0, colorRegistry_1.registerColor)('extensionBadge.remoteBackground', {
        dark: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        light: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        hcDark: exports.ACTIVITY_BAR_BADGE_BACKGROUND,
        hcLight: exports.ACTIVITY_BAR_BADGE_BACKGROUND
    }, (0, nls_1.localize)('extensionBadge.remoteBackground', "Background color for the remote badge in the extensions view."));
    exports.EXTENSION_BADGE_REMOTE_FOREGROUND = (0, colorRegistry_1.registerColor)('extensionBadge.remoteForeground', {
        dark: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        light: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        hcDark: exports.ACTIVITY_BAR_BADGE_FOREGROUND,
        hcLight: exports.ACTIVITY_BAR_BADGE_FOREGROUND
    }, (0, nls_1.localize)('extensionBadge.remoteForeground', "Foreground color for the remote badge in the extensions view."));
    // < --- Side Bar --- >
    exports.SIDE_BAR_BACKGROUND = (0, colorRegistry_1.registerColor)('sideBar.background', {
        dark: '#252526',
        light: '#F3F3F3',
        hcDark: '#000000',
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('sideBarBackground', "Side bar background color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_FOREGROUND = (0, colorRegistry_1.registerColor)('sideBar.foreground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('sideBarForeground', "Side bar foreground color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_BORDER = (0, colorRegistry_1.registerColor)('sideBar.border', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('sideBarBorder', "Side bar border color on the side separating to the editor. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_TITLE_FOREGROUND = (0, colorRegistry_1.registerColor)('sideBarTitle.foreground', {
        dark: exports.SIDE_BAR_FOREGROUND,
        light: exports.SIDE_BAR_FOREGROUND,
        hcDark: exports.SIDE_BAR_FOREGROUND,
        hcLight: exports.SIDE_BAR_FOREGROUND
    }, (0, nls_1.localize)('sideBarTitleForeground', "Side bar title foreground color. The side bar is the container for views like explorer and search."));
    exports.SIDE_BAR_DRAG_AND_DROP_BACKGROUND = (0, colorRegistry_1.registerColor)('sideBar.dropBackground', {
        dark: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        light: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        hcDark: exports.EDITOR_DRAG_AND_DROP_BACKGROUND,
        hcLight: exports.EDITOR_DRAG_AND_DROP_BACKGROUND
    }, (0, nls_1.localize)('sideBarDragAndDropBackground', "Drag and drop feedback color for the side bar sections. The color should have transparency so that the side bar sections can still shine through. The side bar is the container for views like explorer and search. Side bar sections are views nested within the side bar."));
    exports.SIDE_BAR_SECTION_HEADER_BACKGROUND = (0, colorRegistry_1.registerColor)('sideBarSectionHeader.background', {
        dark: color_1.Color.fromHex('#808080').transparent(0.2),
        light: color_1.Color.fromHex('#808080').transparent(0.2),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('sideBarSectionHeaderBackground', "Side bar section header background color. The side bar is the container for views like explorer and search. Side bar sections are views nested within the side bar."));
    exports.SIDE_BAR_SECTION_HEADER_FOREGROUND = (0, colorRegistry_1.registerColor)('sideBarSectionHeader.foreground', {
        dark: exports.SIDE_BAR_FOREGROUND,
        light: exports.SIDE_BAR_FOREGROUND,
        hcDark: exports.SIDE_BAR_FOREGROUND,
        hcLight: exports.SIDE_BAR_FOREGROUND
    }, (0, nls_1.localize)('sideBarSectionHeaderForeground', "Side bar section header foreground color. The side bar is the container for views like explorer and search. Side bar sections are views nested within the side bar."));
    exports.SIDE_BAR_SECTION_HEADER_BORDER = (0, colorRegistry_1.registerColor)('sideBarSectionHeader.border', {
        dark: colorRegistry_1.contrastBorder,
        light: colorRegistry_1.contrastBorder,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('sideBarSectionHeaderBorder', "Side bar section header border color. The side bar is the container for views like explorer and search. Side bar sections are views nested within the side bar."));
    exports.ACTIVITY_BAR_TOP_BORDER = (0, colorRegistry_1.registerColor)('sideBarActivityBarTop.border', {
        dark: exports.SIDE_BAR_SECTION_HEADER_BORDER,
        light: exports.SIDE_BAR_SECTION_HEADER_BORDER,
        hcDark: exports.SIDE_BAR_SECTION_HEADER_BORDER,
        hcLight: exports.SIDE_BAR_SECTION_HEADER_BORDER
    }, (0, nls_1.localize)('sideBarActivityBarTopBorder', "Border color between the activity bar at the top/bottom and the views."));
    // < --- Title Bar --- >
    exports.TITLE_BAR_ACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('titleBar.activeForeground', {
        dark: '#CCCCCC',
        light: '#333333',
        hcDark: '#FFFFFF',
        hcLight: '#292929'
    }, (0, nls_1.localize)('titleBarActiveForeground', "Title bar foreground when the window is active."));
    exports.TITLE_BAR_INACTIVE_FOREGROUND = (0, colorRegistry_1.registerColor)('titleBar.inactiveForeground', {
        dark: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_FOREGROUND, 0.6),
        light: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_FOREGROUND, 0.6),
        hcDark: null,
        hcLight: '#292929'
    }, (0, nls_1.localize)('titleBarInactiveForeground', "Title bar foreground when the window is inactive."));
    exports.TITLE_BAR_ACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('titleBar.activeBackground', {
        dark: '#3C3C3C',
        light: '#DDDDDD',
        hcDark: '#000000',
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('titleBarActiveBackground', "Title bar background when the window is active."));
    exports.TITLE_BAR_INACTIVE_BACKGROUND = (0, colorRegistry_1.registerColor)('titleBar.inactiveBackground', {
        dark: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_BACKGROUND, 0.6),
        light: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_BACKGROUND, 0.6),
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('titleBarInactiveBackground', "Title bar background when the window is inactive."));
    exports.TITLE_BAR_BORDER = (0, colorRegistry_1.registerColor)('titleBar.border', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('titleBarBorder', "Title bar border color."));
    // < --- Menubar --- >
    exports.MENUBAR_SELECTION_FOREGROUND = (0, colorRegistry_1.registerColor)('menubar.selectionForeground', {
        dark: exports.TITLE_BAR_ACTIVE_FOREGROUND,
        light: exports.TITLE_BAR_ACTIVE_FOREGROUND,
        hcDark: exports.TITLE_BAR_ACTIVE_FOREGROUND,
        hcLight: exports.TITLE_BAR_ACTIVE_FOREGROUND,
    }, (0, nls_1.localize)('menubarSelectionForeground', "Foreground color of the selected menu item in the menubar."));
    exports.MENUBAR_SELECTION_BACKGROUND = (0, colorRegistry_1.registerColor)('menubar.selectionBackground', {
        dark: colorRegistry_1.toolbarHoverBackground,
        light: colorRegistry_1.toolbarHoverBackground,
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('menubarSelectionBackground', "Background color of the selected menu item in the menubar."));
    exports.MENUBAR_SELECTION_BORDER = (0, colorRegistry_1.registerColor)('menubar.selectionBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.activeContrastBorder,
        hcLight: colorRegistry_1.activeContrastBorder,
    }, (0, nls_1.localize)('menubarSelectionBorder', "Border color of the selected menu item in the menubar."));
    // < --- Command Center --- >
    // foreground (inactive and active)
    exports.COMMAND_CENTER_FOREGROUND = (0, colorRegistry_1.registerColor)('commandCenter.foreground', { dark: exports.TITLE_BAR_ACTIVE_FOREGROUND, hcDark: exports.TITLE_BAR_ACTIVE_FOREGROUND, light: exports.TITLE_BAR_ACTIVE_FOREGROUND, hcLight: exports.TITLE_BAR_ACTIVE_FOREGROUND }, (0, nls_1.localize)('commandCenter-foreground', "Foreground color of the command center"), false);
    exports.COMMAND_CENTER_ACTIVEFOREGROUND = (0, colorRegistry_1.registerColor)('commandCenter.activeForeground', { dark: exports.MENUBAR_SELECTION_FOREGROUND, hcDark: exports.MENUBAR_SELECTION_FOREGROUND, light: exports.MENUBAR_SELECTION_FOREGROUND, hcLight: exports.MENUBAR_SELECTION_FOREGROUND }, (0, nls_1.localize)('commandCenter-activeForeground', "Active foreground color of the command center"), false);
    exports.COMMAND_CENTER_INACTIVEFOREGROUND = (0, colorRegistry_1.registerColor)('commandCenter.inactiveForeground', { dark: exports.TITLE_BAR_INACTIVE_FOREGROUND, hcDark: exports.TITLE_BAR_INACTIVE_FOREGROUND, light: exports.TITLE_BAR_INACTIVE_FOREGROUND, hcLight: exports.TITLE_BAR_INACTIVE_FOREGROUND }, (0, nls_1.localize)('commandCenter-inactiveForeground', "Foreground color of the command center when the window is inactive"), false);
    // background (inactive and active)
    exports.COMMAND_CENTER_BACKGROUND = (0, colorRegistry_1.registerColor)('commandCenter.background', { dark: color_1.Color.white.transparent(0.05), hcDark: null, light: color_1.Color.black.transparent(0.05), hcLight: null }, (0, nls_1.localize)('commandCenter-background', "Background color of the command center"), false);
    exports.COMMAND_CENTER_ACTIVEBACKGROUND = (0, colorRegistry_1.registerColor)('commandCenter.activeBackground', { dark: color_1.Color.white.transparent(0.08), hcDark: exports.MENUBAR_SELECTION_BACKGROUND, light: color_1.Color.black.transparent(0.08), hcLight: exports.MENUBAR_SELECTION_BACKGROUND }, (0, nls_1.localize)('commandCenter-activeBackground', "Active background color of the command center"), false);
    // border: active and inactive. defaults to active background
    exports.COMMAND_CENTER_BORDER = (0, colorRegistry_1.registerColor)('commandCenter.border', { dark: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_FOREGROUND, .20), hcDark: colorRegistry_1.contrastBorder, light: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_FOREGROUND, .20), hcLight: colorRegistry_1.contrastBorder }, (0, nls_1.localize)('commandCenter-border', "Border color of the command center"), false);
    exports.COMMAND_CENTER_ACTIVEBORDER = (0, colorRegistry_1.registerColor)('commandCenter.activeBorder', { dark: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_FOREGROUND, .30), hcDark: exports.TITLE_BAR_ACTIVE_FOREGROUND, light: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_ACTIVE_FOREGROUND, .30), hcLight: exports.TITLE_BAR_ACTIVE_FOREGROUND }, (0, nls_1.localize)('commandCenter-activeBorder', "Active border color of the command center"), false);
    // border: defaults to active background
    exports.COMMAND_CENTER_INACTIVEBORDER = (0, colorRegistry_1.registerColor)('commandCenter.inactiveBorder', { dark: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_INACTIVE_FOREGROUND, .25), hcDark: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_INACTIVE_FOREGROUND, .25), light: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_INACTIVE_FOREGROUND, .25), hcLight: (0, colorRegistry_1.transparent)(exports.TITLE_BAR_INACTIVE_FOREGROUND, .25) }, (0, nls_1.localize)('commandCenter-inactiveBorder', "Border color of the command center when the window is inactive"), false);
    // < --- Notifications --- >
    exports.NOTIFICATIONS_CENTER_BORDER = (0, colorRegistry_1.registerColor)('notificationCenter.border', {
        dark: colorRegistry_1.widgetBorder,
        light: colorRegistry_1.widgetBorder,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('notificationCenterBorder', "Notifications center border color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_TOAST_BORDER = (0, colorRegistry_1.registerColor)('notificationToast.border', {
        dark: colorRegistry_1.widgetBorder,
        light: colorRegistry_1.widgetBorder,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('notificationToastBorder', "Notification toast border color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_FOREGROUND = (0, colorRegistry_1.registerColor)('notifications.foreground', {
        dark: colorRegistry_1.editorWidgetForeground,
        light: colorRegistry_1.editorWidgetForeground,
        hcDark: colorRegistry_1.editorWidgetForeground,
        hcLight: colorRegistry_1.editorWidgetForeground
    }, (0, nls_1.localize)('notificationsForeground', "Notifications foreground color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_BACKGROUND = (0, colorRegistry_1.registerColor)('notifications.background', {
        dark: colorRegistry_1.editorWidgetBackground,
        light: colorRegistry_1.editorWidgetBackground,
        hcDark: colorRegistry_1.editorWidgetBackground,
        hcLight: colorRegistry_1.editorWidgetBackground
    }, (0, nls_1.localize)('notificationsBackground', "Notifications background color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_LINKS = (0, colorRegistry_1.registerColor)('notificationLink.foreground', {
        dark: colorRegistry_1.textLinkForeground,
        light: colorRegistry_1.textLinkForeground,
        hcDark: colorRegistry_1.textLinkForeground,
        hcLight: colorRegistry_1.textLinkForeground
    }, (0, nls_1.localize)('notificationsLink', "Notification links foreground color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_CENTER_HEADER_FOREGROUND = (0, colorRegistry_1.registerColor)('notificationCenterHeader.foreground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('notificationCenterHeaderForeground', "Notifications center header foreground color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND = (0, colorRegistry_1.registerColor)('notificationCenterHeader.background', {
        dark: (0, colorRegistry_1.lighten)(exports.NOTIFICATIONS_BACKGROUND, 0.3),
        light: (0, colorRegistry_1.darken)(exports.NOTIFICATIONS_BACKGROUND, 0.05),
        hcDark: exports.NOTIFICATIONS_BACKGROUND,
        hcLight: exports.NOTIFICATIONS_BACKGROUND
    }, (0, nls_1.localize)('notificationCenterHeaderBackground', "Notifications center header background color. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_BORDER = (0, colorRegistry_1.registerColor)('notifications.border', {
        dark: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND,
        light: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND,
        hcDark: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND,
        hcLight: exports.NOTIFICATIONS_CENTER_HEADER_BACKGROUND
    }, (0, nls_1.localize)('notificationsBorder', "Notifications border color separating from other notifications in the notifications center. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_ERROR_ICON_FOREGROUND = (0, colorRegistry_1.registerColor)('notificationsErrorIcon.foreground', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hcDark: colorRegistry_1.editorErrorForeground,
        hcLight: colorRegistry_1.editorErrorForeground
    }, (0, nls_1.localize)('notificationsErrorIconForeground', "The color used for the icon of error notifications. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_WARNING_ICON_FOREGROUND = (0, colorRegistry_1.registerColor)('notificationsWarningIcon.foreground', {
        dark: colorRegistry_1.editorWarningForeground,
        light: colorRegistry_1.editorWarningForeground,
        hcDark: colorRegistry_1.editorWarningForeground,
        hcLight: colorRegistry_1.editorWarningForeground
    }, (0, nls_1.localize)('notificationsWarningIconForeground', "The color used for the icon of warning notifications. Notifications slide in from the bottom right of the window."));
    exports.NOTIFICATIONS_INFO_ICON_FOREGROUND = (0, colorRegistry_1.registerColor)('notificationsInfoIcon.foreground', {
        dark: colorRegistry_1.editorInfoForeground,
        light: colorRegistry_1.editorInfoForeground,
        hcDark: colorRegistry_1.editorInfoForeground,
        hcLight: colorRegistry_1.editorInfoForeground
    }, (0, nls_1.localize)('notificationsInfoIconForeground', "The color used for the icon of info notifications. Notifications slide in from the bottom right of the window."));
    exports.WINDOW_ACTIVE_BORDER = (0, colorRegistry_1.registerColor)('window.activeBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('windowActiveBorder', "The color used for the border of the window when it is active. Only supported in the macOS and Linux desktop client when using the custom title bar."));
    exports.WINDOW_INACTIVE_BORDER = (0, colorRegistry_1.registerColor)('window.inactiveBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('windowInactiveBorder', "The color used for the border of the window when it is inactive. Only supported in the macOS and Linux desktop client when using the custom title bar."));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vdGhlbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLG9EQVdDO0lBYkQsMkNBQTJDO0lBRTNDLFNBQWdCLG9CQUFvQixDQUFDLEtBQWtCO1FBQ3RELFFBQVEsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BCLEtBQUssbUJBQVcsQ0FBQyxLQUFLO2dCQUNyQixPQUFPLGFBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakMsS0FBSyxtQkFBVyxDQUFDLG1CQUFtQjtnQkFDbkMsT0FBTyxhQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLEtBQUssbUJBQVcsQ0FBQyxrQkFBa0I7Z0JBQ2xDLE9BQU8sYUFBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNqQztnQkFDQyxPQUFPLGFBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNGLENBQUM7SUFFRCxtQkFBbUI7SUFFbkIsd0JBQXdCO0lBRVgsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsc0JBQXNCLEVBQUU7UUFDMUUsSUFBSSxFQUFFLGdDQUFnQjtRQUN0QixLQUFLLEVBQUUsZ0NBQWdCO1FBQ3ZCLE1BQU0sRUFBRSxnQ0FBZ0I7UUFDeEIsT0FBTyxFQUFFLGdDQUFnQjtLQUN6QixFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLCtMQUErTCxDQUFDLENBQUMsQ0FBQztJQUV4TixRQUFBLCtCQUErQixHQUFHLElBQUEsNkJBQWEsRUFBQywrQkFBK0IsRUFBRTtRQUM3RixJQUFJLEVBQUUsNkJBQXFCO1FBQzNCLEtBQUssRUFBRSw2QkFBcUI7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