/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform", "vs/workbench/common/configuration", "vs/base/browser/browser", "vs/workbench/common/contributions", "vs/workbench/browser/parts/titlebar/windowTitle", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, platform_1, nls_1, configurationRegistry_1, platform_2, configuration_1, browser_1, contributions_1, windowTitle_1, customEditorLabelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    // Configuration
    (function registerConfiguration() {
        // Migration support
        (0, contributions_1.registerWorkbenchContribution2)(configuration_1.ConfigurationMigrationWorkbenchContribution.ID, configuration_1.ConfigurationMigrationWorkbenchContribution, 4 /* WorkbenchPhase.Eventually */);
        // Dynamic Configuration
        (0, contributions_1.registerWorkbenchContribution2)(configuration_1.DynamicWorkbenchSecurityConfiguration.ID, configuration_1.DynamicWorkbenchSecurityConfiguration, 3 /* WorkbenchPhase.AfterRestored */);
        // Workbench
        registry.registerConfiguration({
            ...configuration_1.workbenchConfigurationNodeBase,
            'properties': {
                'workbench.editor.titleScrollbarSizing': {
                    type: 'string',
                    enum: ['default', 'large'],
                    enumDescriptions: [
                        (0, nls_1.localize)('workbench.editor.titleScrollbarSizing.default', "The default size."),
                        (0, nls_1.localize)('workbench.editor.titleScrollbarSizing.large', "Increases the size, so it can be grabbed more easily with the mouse.")
                    ],
                    description: (0, nls_1.localize)('tabScrollbarHeight', "Controls the height of the scrollbars used for tabs and breadcrumbs in the editor title area."),
                    default: 'default',
                },
                ["workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */]: {
                    'type': 'string',
                    'enum': ["multiple" /* EditorTabsMode.MULTIPLE */, "single" /* EditorTabsMode.SINGLE */, "none" /* EditorTabsMode.NONE */],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.showTabs.multiple', "Each editor is displayed as a tab in the editor title area."),
                        (0, nls_1.localize)('workbench.editor.showTabs.single', "The active editor is displayed as a single large tab in the editor title area."),
                        (0, nls_1.localize)('workbench.editor.showTabs.none', "The editor title area is not displayed."),
                    ],
                    'description': (0, nls_1.localize)('showEditorTabs', "Controls whether opened editors should show as individual tabs, one single large tab or if the title area should not be shown."),
                    'default': 'multiple'
                },
                ["workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */]: {
                    'type': 'string',
                    'enum': ["default" /* EditorActionsLocation.DEFAULT */, "titleBar" /* EditorActionsLocation.TITLEBAR */, "hidden" /* EditorActionsLocation.HIDDEN */],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'workbench.editor.editorActionsLocation.default' }, "Show editor actions in the window title bar when {0} is set to {1}. Otherwise, editor actions are shown in the editor tab bar.", '`#workbench.editor.showTabs#`', '`none`'),
                        (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'workbench.editor.editorActionsLocation.titleBar' }, "Show editor actions in the window title bar. If {0} is set to {1}, editor actions are hidden.", '`#window.customTitleBarVisibility#`', '`never`'),
                        (0, nls_1.localize)('workbench.editor.editorActionsLocation.hidden', "Editor actions are not shown."),
                    ],
                    'markdownDescription': (0, nls_1.localize)('editorActionsLocation', "Controls where the editor actions are shown."),
                    'default': 'default'
                },
                'workbench.editor.wrapTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'wrapTabs' }, "Controls whether tabs should be wrapped over multiple lines when exceeding available space or whether a scrollbar should appear instead. This value is ignored when {0} is not set to '{1}'.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.scrollToSwitchTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'scrollToSwitchTabs' }, "Controls whether scrolling over tabs will open them or not. By default tabs will only reveal upon scrolling, but not open. You can press and hold the Shift-key while scrolling to change this behavior for that duration. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.highlightModifiedTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'highlightModifiedTabs' }, "Controls whether a top border is drawn on tabs for editors that have unsaved changes. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', `multiple`),
                    'default': false
                },
                'workbench.editor.decorations.badges': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('decorations.badges', "Controls whether editor file decorations should use badges."),
                    'default': true
                },
                'workbench.editor.decorations.colors': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('decorations.colors', "Controls whether editor file decorations should use colors."),
                    'default': true
                },
                [customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED]: {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('workbench.editor.label.enabled', "Controls whether the custom workbench editor labels should be applied."),
                    'default': true,
                },
                [customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS]: {
                    'type': 'object',
                    'markdownDescription': (() => {
                        let customEditorLabelDescription = (0, nls_1.localize)('workbench.editor.label.patterns', "Controls the rendering of the editor label. Each __Item__ is a pattern that matches a file path. Both relative and absolute file paths are supported. In case multiple patterns match, the longest matching path will be picked. Each __Value__ is the template for the rendered editor when the __Item__ matches. Variables are substituted based on the context:");
                        customEditorLabelDescription += '\n- ' + [
                            (0, nls_1.localize)('workbench.editor.label.dirname', "`${dirname}`: name of the folder in which the file is located (e.g. `root/folder/file.txt -> folder`)."),
                            (0, nls_1.localize)('workbench.editor.label.nthdirname', "`${dirname(N)}`: name of the nth parent folder in which the file is located (e.g. `N=1: root/folder/file.txt -> root`)."),
                            (0, nls_1.localize)('workbench.editor.label.filename', "`${filename}`: name of the file without the file extension (e.g. `root/folder/file.txt -> file`)."),
                            (0, nls_1.localize)('workbench.editor.label.extname', "`${extname}`: the file extension (e.g. `root/folder/file.txt -> txt`)."),
                        ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
                        customEditorLabelDescription += '\n\n' + (0, nls_1.localize)('customEditorLabelDescriptionExample', "Example: `\"**/static/**/*.html\": \"${filename} - ${dirname} (${extname})\"` will render a file `root/static/folder/file.html` as `file - folder (html)`.");
                        return customEditorLabelDescription;
                    })(),
                    additionalProperties: {
                        type: 'string',
                        markdownDescription: (0, nls_1.localize)('workbench.editor.label.template', "The template which should be rendered when the pattern mtches. May include the variables ${dirname}, ${filename} and ${extname}."),
                        minLength: 1,
                        pattern: '.*[a-zA-Z0-9].*'
                    },
                    'default': {}
                },
                'workbench.editor.labelFormat': {
                    'type': 'string',
                    'enum': ['default', 'short', 'medium', 'long'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.labelFormat.default', "Show the name of the file. When tabs are enabled and two files have the same name in one group the distinguishing sections of each file's path are added. When tabs are disabled, the path relative to the workspace folder is shown if the editor is active."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.short', "Show the name of the file followed by its directory name."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.medium', "Show the name of the file followed by its path relative to the workspace folder."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.long', "Show the name of the file followed by its absolute path.")
                    ],
                    'default': 'default',
                    'description': (0, nls_1.localize)('tabDescription', "Controls the format of the label for an editor."),
                },
                'workbench.editor.untitled.labelFormat': {
                    'type': 'string',
                    'enum': ['content', 'name'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.untitled.labelFormat.content', "The name of the untitled file is derived from the contents of its first line unless it has an associated file path. It will fallback to the name in case the line is empty or contains no word characters."),
                        (0, nls_1.localize)('workbench.editor.untitled.labelFormat.name', "The name of the untitled file is not derived from the contents of the file."),
                    ],
                    'default': 'content',
                    'description': (0, nls_1.localize)('untitledLabelFormat', "Controls the format of the label for an untitled editor."),
                },
                'workbench.editor.empty.hint': {
                    'type': 'string',
                    'enum': ['text', 'hidden'],
                    'default': 'text',
                    'markdownDescription': (0, nls_1.localize)("workbench.editor.empty.hint", "Controls if the empty editor text hint should be visible in the editor.")
                },
                'workbench.editor.languageDetection': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.languageDetection', "Controls whether the language in a text editor is automatically detected unless the language has been explicitly set by the language picker. This can also be scoped by language so you can specify which languages you do not want to be switched off of. This is useful for languages like Markdown that often contain other languages that might trick language detection into thinking it's the embedded language and not Markdown."),
                    scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                },
                'workbench.editor.historyBasedLanguageDetection': {
                    type: 'boolean',
                    default: true,
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.historyBasedLanguageDetection', "Enables use of editor history in language detection. This causes automatic language detection to favor languages that have been recently opened and allows for automatic language detection to operate with smaller inputs."),
                },
                'workbench.editor.preferHistoryBasedLanguageDetection': {
                    type: 'boolean',
                    default: false,
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.preferBasedLanguageDetection', "When enabled, a language detection model that takes into account editor history will be given higher precedence."),
                },
                'workbench.editor.languageDetectionHints': {
                    type: 'object',
                    default: { 'untitledEditors': true, 'notebookEditors': true },
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints', "When enabled, shows a Status bar Quick Fix when the editor language doesn't match detected content language."),
                    additionalProperties: false,
                    properties: {
                        untitledEditors: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints.editors', "Show in untitled text editors"),
                        },
                        notebookEditors: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints.notebook', "Show in notebook editors"),
                        }
                    }
                },
                'workbench.editor.tabActionLocation': {
                    type: 'string',
                    enum: ['left', 'right'],
                    default: 'right',
                    markdownDescription: (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'tabActionLocation' }, "Controls the position of the editor's tabs action buttons (close, unpin). This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.tabActionCloseVisibility': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.tabActionCloseVisibility', "Controls the visibility of the tab close action button.")
                },
                'workbench.editor.tabActionUnpinVisibility': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.tabActionUnpinVisibility', "Controls the visibility of the tab unpin action button.")
                },
                'workbench.editor.tabSizing': {
                    'type': 'string',
                    'enum': ['fit', 'shrink', 'fixed'],
                    'default': 'fit',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.tabSizing.fit', "Always keep tabs large enough to show the full editor label."),
                        (0, nls_1.localize)('workbench.editor.tabSizing.shrink', "Allow tabs to get smaller when the available space is not enough to show all tabs at once."),
                        (0, nls_1.localize)('workbench.editor.tabSizing.fixed', "Make all tabs the same size, while allowing them to get smaller when the available space is not enough to show all tabs at once.")
                    ],
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'tabSizing' }, "Controls the size of editor tabs. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.tabSizingFixedMinWidth': {
                    'type': 'number',
                    'default': 50,
                    'minimum': 38,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.tabSizingFixedMinWidth' }, "Controls the minimum width of tabs when {0} size is set to {1}.", '`#workbench.editor.tabSizing#`', '`fixed`')
                },
                'workbench.editor.tabSizingFixedMaxWidth': {
                    'type': 'number',
                    'default': 160,
                    'minimum': 38,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.tabSizingFixedMaxWidth' }, "Controls the maximum width of tabs when {0} size is set to {1}.", '`#workbench.editor.tabSizing#`', '`fixed`')
                },
                'window.density.editorTabHeight': {
                    'type': 'string',
                    'enum': ['default', 'compact'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.tabHeight' }, "Controls the height of editor tabs. Also applies to the title control bar when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.pinnedTabSizing': {
                    'type': 'string',
                    'enum': ['normal', 'compact', 'shrink'],
                    'default': 'normal',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.normal', "A pinned tab inherits the look of non pinned tabs."),
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.compact', "A pinned tab will show in a compact form with only icon or first letter of the editor name."),
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.shrink', "A pinned tab shrinks to a compact fixed size showing parts of the editor name.")
                    ],
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'pinnedTabSizing' }, "Controls the size of pinned editor tabs. Pinned tabs are sorted to the beginning of all opened tabs and typically do not close until unpinned. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.pinnedTabsOnSeparateRow': {
                    'type': 'boolean',
                    'default': false,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.pinnedTabsOnSeparateRow' }, "When enabled, displays pinned tabs in a separate row above all other tabs. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                },
                'workbench.editor.preventPinnedEditorClose': {
                    'type': 'string',
                    'enum': ['keyboardAndMouse', 'keyboard', 'mouse', 'never'],
                    'default': 'keyboardAndMouse',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.always', "Always prevent closing the pinned editor when using mouse middle click or keyboard."),
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.onlyKeyboard', "Prevent closing the pinned editor when using the keyboard."),
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.onlyMouse', "Prevent closing the pinned editor when using mouse middle click."),
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.never', "Never prevent closing a pinned editor.")
                    ],
                    description: (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose', "Controls whether pinned editors should close when keyboard or middle mouse click is used for closing."),
                },
                'workbench.editor.splitSizing': {
                    'type': 'string',
                    'enum': ['auto', 'distribute', 'split'],
                    'default': 'auto',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.splitSizingAuto', "Splits the active editor group to equal parts, unless all editor groups are already in equal parts. In that case, splits all the editor groups to equal parts."),
                        (0, nls_1.localize)('workbench.editor.splitSizingDistribute', "Splits all the editor groups to equal parts."),
                        (0, nls_1.localize)('workbench.editor.splitSizingSplit', "Splits the active editor group to equal parts.")
                    ],
                    'description': (0, nls_1.localize)('splitSizing', "Controls the size of editor groups when splitting them.")
                },
                'workbench.editor.splitOnDragAndDrop': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('splitOnDragAndDrop', "Controls if editor groups can be split from drag and drop operations by dropping an editor or file on the edges of the editor area.")
                },
                'workbench.editor.dragToOpenWindow': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)('dragToOpenWindow', "Controls if editors can be dragged out of the window to open them in a new window. Press and hold the `Alt` key while dragging to toggle this dynamically.")
                },
                'workbench.editor.focusRecentEditorAfterClose': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('focusRecentEditorAfterClose', "Controls whether editors are closed in most recently used order or from left to right."),
                    'default': true
                },
                'workbench.editor.showIcons': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('showIcons', "Controls whether opened editors should show with an icon or not. This requires a file icon theme to be enabled as well."),
                    'default': true
                },
                'workbench.editor.enablePreview': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('enablePreview', "Controls whether opened editors show as preview editors. Preview editors do not stay open, are reused until explicitly set to be kept open (via double-click or editing), and show file names in italics."),
                    'default': true
                },
                'workbench.editor.enablePreviewFromQuickOpen': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'enablePreviewFromQuickOpen' }, "Controls whether editors opened from Quick Open show as preview editors. Preview editors do not stay open, and are reused until explicitly set to be kept open (via double-click or editing). When enabled, hold Ctrl before selection to open an editor as a non-preview. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.enablePreviewFromCodeNavigation': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'enablePreviewFromCodeNavigation' }, "Controls whether editors remain in preview when a code navigation is started from them. Preview editors do not stay open, and are reused until explicitly set to be kept open (via double-click or editing). This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.closeOnFileDelete': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeOnFileDelete', "Controls whether editors showing a file that was opened during the session should close automatically when getting deleted or renamed by some other process. Disabling this will keep the editor open  on such an event. Note that deleting from within the application will always close the editor and that editors with unsaved changes will never close to preserve your data."),
                    'default': false
                },
                'workbench.editor.openPositioning': {
                    'type': 'string',
                    'enum': ['left', 'right', 'first', 'last'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1}, {2}, {3} will be a setting name rendered as a link'], key: 'editorOpenPositioning' }, "Controls where editors open. Select {0} or {1} to open editors to the left or right of the currently active one. Select {2} or {3} to open editors independently from the currently active one.", '`left`', '`right`', '`first`', '`last`')
                },
                'workbench.editor.openSideBySideDirection': {
                    'type': 'string',
                    'enum': ['right', 'down'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)('sideBySideDirection', "Controls the default direction of editors that are opened side by side (for example, from the Explorer). By default, editors will open on the right hand side of the currently active one. If changed to `down`, the editors will open below the currently active one.")
                },
                'workbench.editor.closeEmptyGroups': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeEmptyGroups', "Controls the behavior of empty editor groups when the last tab in the group is closed. When enabled, empty groups will automatically close. When disabled, empty groups will remain part of the grid."),
                    'default': true
                },
                'workbench.editor.revealIfOpen': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('revealIfOpen', "Controls whether an editor is revealed in any of the visible groups if opened. If disabled, an editor will prefer to open in the currently active editor group. If enabled, an already opened editor will be revealed instead of opened again in the currently active editor group. Note that there are some cases where this setting is ignored, such as when forcing an editor to open in a specific group or to the side of the currently active group."),
                    'default': false
                },
                'workbench.editor.mouseBackForwardToNavigate': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('mouseBackForwardToNavigate', "Enables the use of mouse buttons four and five for commands 'Go Back' and 'Go Forward'."),
                    'default': true
                },
                'workbench.editor.navigationScope': {
                    'type': 'string',
                    'enum': ['default', 'editorGroup', 'editor'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)('navigationScope', "Controls the scope of history navigation in editors for commands such as 'Go Back' and 'Go Forward'."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.navigationScopeDefault', "Navigate across all opened editors and editor groups."),
                        (0, nls_1.localize)('workbench.editor.navigationScopeEditorGroup', "Navigate only in editors of the active editor group."),
                        (0, nls_1.localize)('workbench.editor.navigationScopeEditor', "Navigate only in the active editor.")
                    ],
                },
                'workbench.editor.restoreViewState': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('restoreViewState', "Restores the last editor view state (such as scroll position) when re-opening editors after they have been closed. Editor view state is stored per editor group and discarded when a group closes. Use the {0} setting to use the last known view state across all editor groups in case no previous view state was found for a editor group.", '`#workbench.editor.sharedViewState#`'),
                    'default': true,
                    'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                },
                'workbench.editor.sharedViewState': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('sharedViewState', "Preserves the most recent editor view state (such as scroll position) across all editor groups and restores that if no specific editor view state is found for the editor group."),
                    'default': false
                },
                'workbench.editor.splitInGroupLayout': {
                    'type': 'string',
                    'enum': ['vertical', 'horizontal'],
                    'default': 'horizontal',
                    'markdownDescription': (0, nls_1.localize)('splitInGroupLayout', "Controls the layout for when an editor is split in an editor group to be either vertical or horizontal."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.splitInGroupLayoutVertical', "Editors are positioned from top to bottom."),
                        (0, nls_1.localize)('workbench.editor.splitInGroupLayoutHorizontal', "Editors are positioned from left to right.")
                    ]
                },
                'workbench.editor.centeredLayoutAutoResize': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('centeredLayoutAutoResize', "Controls if the centered layout should automatically resize to maximum width when more than one group is open. Once only one group is open it will resize back to the original centered width.")
                },
                'workbench.editor.centeredLayoutFixedWidth': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('centeredLayoutDynamicWidth', "Controls whether the centered layout tries to maintain constant width when the window is resized.")
                },
                'workbench.editor.doubleClickTabToToggleEditorGroupSizes': {
                    'type': 'string',
                    'enum': ['maximize', 'expand', 'off'],
                    'default': 'expand',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'doubleClickTabToToggleEditorGroupSizes' }, "Controls how the editor group is resized when double clicking on a tab. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.doubleClickTabToToggleEditorGroupSizes.maximize', "All other editor groups are hidden and the current editor group is maximized to take up the entire editor area."),
                        (0, nls_1.localize)('workbench.editor.doubleClickTabToToggleEditorGroupSizes.expand', "The editor group takes as much space as possible by making all other editor groups as small as possible."),
                        (0, nls_1.localize)('workbench.editor.doubleClickTabToToggleEditorGroupSizes.off', "No editor group is resized when double clicking on a tab.")
                    ]
                },
                'workbench.editor.limit.enabled': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('limitEditorsEnablement', "Controls if the number of opened editors should be limited or not. When enabled, less recently used editors will close to make space for newly opening editors.")
                },
                'workbench.editor.limit.value': {
                    'type': 'number',
                    'default': 10,
                    'exclusiveMinimum': 0,
                    'markdownDescription': (0, nls_1.localize)('limitEditorsMaximum', "Controls the maximum number of opened editors. Use the {0} setting to control this limit per editor group or across all groups.", '`#workbench.editor.limit.perEditorGroup#`')
                },
                'workbench.editor.limit.excludeDirty': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('limitEditorsExcludeDirty', "Controls if the maximum number of opened editors should exclude dirty editors for counting towards the configured limit.")
                },
                'workbench.editor.limit.perEditorGroup': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('perEditorGroup', "Controls if the limit of maximum opened editors should apply per editor group or across all editor groups.")
                },
                'workbench.localHistory.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('localHistoryEnabled', "Controls whether local file history is enabled. When enabled, the file contents of an editor that is saved will be stored to a backup location to be able to restore or review the contents later. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.maxFileSize': {
                    'type': 'number',
                    'default': 256,
                    'minimum': 1,
                    'description': (0, nls_1.localize)('localHistoryMaxFileSize', "Controls the maximum size of a file (in KB) to be considered for local file history. Files that are larger will not be added to the local file history. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.maxFileEntries': {
                    'type': 'number',
                    'default': 50,
                    'minimum': 0,
                    'description': (0, nls_1.localize)('localHistoryMaxFileEntries', "Controls the maximum number of local file history entries per file. When the number of local file history entries exceeds this number for a file, the oldest entries will be discarded."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.exclude': {
                    'type': 'object',
                    'patternProperties': {
                        '.*': { 'type': 'boolean' }
                    },
                    'markdownDescription': (0, nls_1.localize)('exclude', "Configure paths or [glob patterns](https://aka.ms/vscode-glob-patterns) for excluding files from the local file history. Glob patterns are always evaluated relative to the path of the workspace folder unless they are absolute paths. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.mergeWindow': {
                    'type': 'number',
                    'default': 10,
                    'minimum': 1,
                    'markdownDescription': (0, nls_1.localize)('mergeWindow', "Configure an interval in seconds during which the last entry in local file history is replaced with the entry that is being added. This helps reduce the overall number of entries that are added, for example when auto save is enabled. This setting is only applied to entries that have the same source of origin. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.commandPalette.history': {
                    'type': 'number',
                    'description': (0, nls_1.localize)('commandHistory', "Controls the number of recently used commands to keep in history for the command palette. Set to 0 to disable command history."),
                    'default': 50,
                    'minimum': 0
                },
                'workbench.commandPalette.preserveInput': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('preserveInput', "Controls whether the last typed input to the command palette should be restored when opening it the next time."),
                    'default': false
                },
                'workbench.commandPalette.experimental.suggestCommands': {
                    'type': 'boolean',
                    tags: ['experimental'],
                    'description': (0, nls_1.localize)('suggestCommands', "Controls whether the command palette should have a list of commonly used commands."),
                    'default': false
                },
                'workbench.commandPalette.experimental.askChatLocation': {
                    'type': 'string',
                    tags: ['experimental'],
                    'description': (0, nls_1.localize)('askChatLocation', "Controls where the command palette should ask chat questions."),
                    'default': 'chatView',
                    enum: ['chatView', 'quickChat'],
                    enumDescriptions: [
                        (0, nls_1.localize)('askChatLocation.chatView', "Ask chat questions in the Chat view."),
                        (0, nls_1.localize)('askChatLocation.quickChat', "Ask chat questions in Quick Chat.")
                    ]
                },
                'workbench.commandPalette.experimental.enableNaturalLanguageSearch': {
                    'type': 'boolean',
                    tags: ['experimental'],
                    'description': (0, nls_1.localize)('enableNaturalLanguageSearch', "Controls whether the command palette should include similar commands. You must have an extension installed that provides Natural Language support."),
                    'default': true
                },
                'workbench.quickOpen.closeOnFocusLost': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeOnFocusLost', "Controls whether Quick Open should close automatically once it loses focus."),
                    'default': true
                },
                'workbench.quickOpen.preserveInput': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('workbench.quickOpen.preserveInput', "Controls whether the last typed input to Quick Open should be restored when opening it the next time."),
                    'default': false
                },
                'workbench.settings.openDefaultSettings': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('openDefaultSettings', "Controls whether opening settings also opens an editor showing all default settings."),
                    'default': false
                },
                'workbench.settings.useSplitJSON': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('useSplitJSON', "Controls whether to use the split JSON editor when editing settings as JSON."),
                    'default': false
                },
                'workbench.settings.openDefaultKeybindings': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('openDefaultKeybindings', "Controls whether opening keybinding settings also opens an editor showing all default keybindings."),
                    'default': false
                },
                'workbench.sideBar.location': {
                    'type': 'string',
                    'enum': ['left', 'right'],
                    'default': 'left',
                    'description': (0, nls_1.localize)('sideBarLocation', "Controls the location of the primary side bar and activity bar. They can either show on the left or right of the workbench. The secondary side bar will show on the opposite side of the workbench.")
                },
                'workbench.panel.defaultLocation': {
                    'type': 'string',
                    'enum': ['left', 'bottom', 'right'],
                    'default': 'bottom',
                    'description': (0, nls_1.localize)('panelDefaultLocation', "Controls the default location of the panel (Terminal, Debug Console, Output, Problems) in a new workspace. It can either show at the bottom, right, or left of the editor area."),
                },
                'workbench.panel.opensMaximized': {
                    'type': 'string',
                    'enum': ['always', 'never', 'preserve'],
                    'default': 'preserve',
                    'description': (0, nls_1.localize)('panelOpensMaximized', "Controls whether the panel opens maximized. It can either always open maximized, never open maximized, or open to the last state it was in before being closed."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.panel.opensMaximized.always', "Always maximize the panel when opening it."),
                        (0, nls_1.localize)('workbench.panel.opensMaximized.never', "Never maximize the panel when opening it. The panel will open un-maximized."),
                        (0, nls_1.localize)('workbench.panel.opensMaximized.preserve', "Open the panel to the state that it was in, before it was closed.")
                    ]
                },
                'workbench.statusBar.visible': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('statusBarVisibility', "Controls the visibility of the status bar at the bottom of the workbench.")
                },
                ["workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */]: {
                    'type': 'string',
                    'enum': ['default', 'top', 'bottom', 'hidden'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting'], key: 'activityBarLocation' }, "Controls the location of the Activity Bar. It can either show to the `default` or `top` / `bottom` of the Primary and Secondary Side Bar or `hidden`."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.activityBar.location.default', "Show the Activity Bar of the Primary Side Bar on the side."),
                        (0, nls_1.localize)('workbench.activityBar.location.top', "Show the Activity Bar on top of the Primary and Secondary Side Bar."),
                        (0, nls_1.localize)('workbench.activityBar.location.bottom', "Show the Activity Bar at the bottom of the Primary and Secondary Side Bar."),
                        (0, nls_1.localize)('workbench.activityBar.location.hide', "Hide the Activity Bar in the Primary and Secondary Side Bar.")
                    ],
                },
                'workbench.activityBar.iconClickBehavior': {
                    'type': 'string',
                    'enum': ['toggle', 'focus'],
                    'default': 'toggle',
                    'description': (0, nls_1.localize)('activityBarIconClickBehavior', "Controls the behavior of clicking an activity bar icon in the workbench."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.activityBar.iconClickBehavior.toggle', "Hide the side bar if the clicked item is already visible."),
                        (0, nls_1.localize)('workbench.activityBar.iconClickBehavior.focus', "Focus side bar if the clicked item is already visible.")
                    ]
                },
                'workbench.view.alwaysShowHeaderActions': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('viewVisibility', "Controls the visibility of view header actions. View header actions may either be always visible, or only visible when that view is focused or hovered over.")
                },
                'workbench.fontAliasing': {
                    'type': 'string',
                    'enum': ['default', 'antialiased', 'none', 'auto'],
                    'default': 'default',
                    'description': (0, nls_1.localize)('fontAliasing', "Controls font aliasing method in the workbench."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.fontAliasing.default', "Sub-pixel font smoothing. On most non-retina displays this will give the sharpest text."),
                        (0, nls_1.localize)('workbench.fontAliasing.antialiased', "Smooth the font on the level of the pixel, as opposed to the subpixel. Can make the font appear lighter overall."),
                        (0, nls_1.localize)('workbench.fontAliasing.none', "Disables font smoothing. Text will show with jagged sharp edges."),
                        (0, nls_1.localize)('workbench.fontAliasing.auto', "Applies `default` or `antialiased` automatically based on the DPI of displays.")
                    ],
                    'included': platform_2.isMacintosh
                },
                'workbench.settings.editor': {
                    'type': 'string',
                    'enum': ['ui', 'json'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('settings.editor.ui', "Use the settings UI editor."),
                        (0, nls_1.localize)('settings.editor.json', "Use the JSON file editor."),
                    ],
                    'description': (0, nls_1.localize)('settings.editor.desc', "Determines which settings editor to use by default."),
                    'default': 'ui',
                    'scope': 3 /* ConfigurationScope.WINDOW */
                },
                'workbench.hover.delay': {
                    'type': 'number',
                    'description': (0, nls_1.localize)('workbench.hover.delay', "Controls the delay in milliseconds after which the hover is shown for workbench items (ex. some extension provided tree view items). Already visible items may require a refresh before reflecting this setting change."),
                    // Testing has indicated that on Windows and Linux 500 ms matches the native hovers most closely.
                    // On Mac, the delay is 1500.
                    'default': platform_2.isMacintosh ? 1500 : 500,
                    'minimum': 0
                },
                'workbench.reduceMotion': {
                    type: 'string',
                    description: (0, nls_1.localize)('workbench.reduceMotion', "Controls whether the workbench should render with fewer animations."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.reduceMotion.on', "Always render with reduced motion."),
                        (0, nls_1.localize)('workbench.reduceMotion.off', "Do not render with reduced motion"),
                        (0, nls_1.localize)('workbench.reduceMotion.auto', "Render with reduced motion based on OS configuration."),
                    ],
                    default: 'auto',
                    tags: ['accessibility'],
                    enum: ['on', 'off', 'auto']
                },
                ["workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */]: {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': platform_2.isWeb ?
                        (0, nls_1.localize)('layoutControlEnabledWeb', "Controls whether the layout control in the title bar is shown.") :
                        (0, nls_1.localize)({ key: 'layoutControlEnabled', comment: ['{0}, {1} is a placeholder for a setting identifier.'] }, "Controls whether the layout control is shown in the custom title bar. This setting only has an effect when {0} is not set to {1}.", '`#window.customTitleBarVisibility#`', '`never`')
                },
                'workbench.layoutControl.type': {
                    'type': 'string',
                    'enum': ['menu', 'toggles', 'both'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('layoutcontrol.type.menu', "Shows a single button with a dropdown of layout options."),
                        (0, nls_1.localize)('layoutcontrol.type.toggles', "Shows several buttons for toggling the visibility of the panels and side bar."),
                        (0, nls_1.localize)('layoutcontrol.type.both', "Shows both the dropdown and toggle buttons."),
                    ],
                    'default': 'both',
                    'description': (0, nls_1.localize)('layoutControlType', "Controls whether the layout control in the custom title bar is displayed as a single menu button or with multiple UI toggles."),
                },
                'workbench.tips.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('tips.enabled', "When enabled, will show the watermark tips when no editor is open.")
                },
            }
        });
        // Window
        let windowTitleDescription = (0, nls_1.localize)('windowTitle', "Controls the window title based on the current context such as the opened workspace or active editor. Variables are substituted based on the context:");
        windowTitleDescription += '\n- ' + [
            (0, nls_1.localize)('activeEditorShort', "`${activeEditorShort}`: the file name (e.g. myFile.txt)."),
            (0, nls_1.localize)('activeEditorMedium', "`${activeEditorMedium}`: the path of the file relative to the workspace folder (e.g. myFolder/myFileFolder/myFile.txt)."),
            (0, nls_1.localize)('activeEditorLong', "`${activeEditorLong}`: the full path of the file (e.g. /Users/Development/myFolder/myFileFolder/myFile.txt)."),
            (0, nls_1.localize)('activeFolderShort', "`${activeFolderShort}`: the name of the folder the file is contained in (e.g. myFileFolder)."),
            (0, nls_1.localize)('activeFolderMedium', "`${activeFolderMedium}`: the path of the folder the file is contained in, relative to the workspace folder (e.g. myFolder/myFileFolder)."),
            (0, nls_1.localize)('activeFolderLong', "`${activeFolderLong}`: the full path of the folder the file is contained in (e.g. /Users/Development/myFolder/myFileFolder)."),
            (0, nls_1.localize)('folderName', "`${folderName}`: name of the workspace folder the file is contained in (e.g. myFolder)."),
            (0, nls_1.localize)('folderPath', "`${folderPath}`: file path of the workspace folder the file is contained in (e.g. /Users/Development/myFolder)."),
            (0, nls_1.localize)('rootName', "`${rootName}`: name of the workspace with optional remote name and workspace indicator if applicable (e.g. myFolder, myRemoteFolder [SSH] or myWorkspace (Workspace))."),
            (0, nls_1.localize)('rootNameShort', "`${rootNameShort}`: shortened name of the workspace without suffixes (e.g. myFolder, myRemoteFolder or myWorkspace)."),
            (0, nls_1.localize)('rootPath', "`${rootPath}`: file path of the opened workspace or folder (e.g. /Users/Development/myWorkspace)."),
            (0, nls_1.localize)('profileName', "`${profileName}`: name of the profile in which the workspace is opened (e.g. Data Science (Profile)). Ignored if default profile is used."),
            (0, nls_1.localize)('appName', "`${appName}`: e.g. VS Code."),
            (0, nls_1.localize)('remoteName', "`${remoteName}`: e.g. SSH"),
            (0, nls_1.localize)('dirty', "`${dirty}`: an indicator for when the active editor has unsaved changes."),
            (0, nls_1.localize)('focusedView', "`${focusedView}`: the name of the view that is currently focused."),
            (0, nls_1.localize)('activeRepositoryName', "`${activeRepositoryName}`: the name of the active repository (e.g. vscode)."),
            (0, nls_1.localize)('activeRepositoryBranchName', "`${activeRepositoryBranchName}`: the name of the active branch in the active repository (e.g. main)."),
            (0, nls_1.localize)('separator', "`${separator}`: a conditional separator (\" - \") that only shows when surrounded by variables with values or static text.")
        ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': (0, nls_1.localize)('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.title': {
                    'type': 'string',
                    'default': windowTitle_1.defaultWindowTitle,
                    'markdownDescription': windowTitleDescription
                },
                'window.titleSeparator': {
                    'type': 'string',
                    'default': windowTitle_1.defaultWindowTitleSeparator,
                    'markdownDescription': (0, nls_1.localize)("window.titleSeparator", "Separator used by {0}.", '`#window.title#`')
                },
                ["window.commandCenter" /* LayoutSettings.COMMAND_CENTER */]: {
                    type: 'boolean',
                    default: true,
                    markdownDescription: platform_2.isWeb ?
                        (0, nls_1.localize)('window.commandCenterWeb', "Show command launcher together with the window title.") :
                        (0, nls_1.localize)({ key: 'window.commandCenter', comment: ['{0}, {1} is a placeholder for a setting identifier.'] }, "Show command launcher together with the window title. This setting only has an effect when {0} is not set to {1}.", '`#window.customTitleBarVisibility#`', '`never`')
                },
                'window.menuBarVisibility': {
                    'type': 'string',
                    'enum': ['classic', 'visible', 'toggle', 'hidden', 'compact'],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)('window.menuBarVisibility.classic', "Menu is displayed at the top of the window and only hidden in full screen mode."),
                        (0, nls_1.localize)('window.menuBarVisibility.visible', "Menu is always visible at the top of the window even in full screen mode."),
                        platform_2.isMacintosh ?
                            (0, nls_1.localize)('window.menuBarVisibility.toggle.mac', "Menu is hidden but can be displayed at the top of the window by executing the `Focus Application Menu` command.") :
                            (0, nls_1.localize)('window.menuBarVisibility.toggle', "Menu is hidden but can be displayed at the top of the window via the Alt key."),
                        (0, nls_1.localize)('window.menuBarVisibility.hidden', "Menu is always hidden."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.menuBarVisibility.compact.web', "Menu is displayed as a compact button in the side bar.") :
                            (0, nls_1.localize)({ key: 'window.menuBarVisibility.compact', comment: ['{0}, {1} is a placeholder for a setting identifier.'] }, "Menu is displayed as a compact button in the side bar. This value is ignored when {0} is {1}.", '`#window.titleBarStyle#`', '`native`')
                    ],
                    'default': platform_2.isWeb ? 'compact' : 'classic',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        (0, nls_1.localize)('menuBarVisibility.mac', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and executing `Focus Application Menu` will show it. A setting of 'compact' will move the menu into the side bar.") :
                        (0, nls_1.localize)('menuBarVisibility', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and a single press of the Alt key will show it. A setting of 'compact' will move the menu into the side bar."),
                    'included': platform_2.isWindows || platform_2.isLinux || platform_2.isWeb
                },
                'window.enableMenuBarMnemonics': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('enableMenuBarMnemonics', "Controls whether the main menus can be opened via Alt-key shortcuts. Disabling mnemonics allows to bind these Alt-key shortcuts to editor commands instead."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.customMenuBarAltFocus': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('customMenuBarAltFocus', "Controls whether the menu bar will be focused by pressing the Alt-key. This setting has no effect on toggling the menu bar with the Alt-key."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.openFilesInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openFilesInNewWindow.on', "Files will open in a new window."),
                        (0, nls_1.localize)('window.openFilesInNewWindow.off', "Files will open in the window with the files' folder open or the last active window."),
                        platform_2.isMacintosh ?
                            (0, nls_1.localize)('window.openFilesInNewWindow.defaultMac', "Files will open in the window with the files' folder open or the last active window unless opened via the Dock or from Finder.") :
                            (0, nls_1.localize)('window.openFilesInNewWindow.default', "Files will open in a new window unless picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'off',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        (0, nls_1.localize)('openFilesInNewWindowMac', "Controls whether files should open in a new window when using a command line or file dialog.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).") :
                        (0, nls_1.localize)('openFilesInNewWindow', "Controls whether files should open in a new window when using a command line or file dialog.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.openFoldersInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openFoldersInNewWindow.on', "Folders will open in a new window."),
                        (0, nls_1.localize)('window.openFoldersInNewWindow.off', "Folders will replace the last active window."),
                        (0, nls_1.localize)('window.openFoldersInNewWindow.default', "Folders will open in a new window unless a folder is picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'default',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('openFoldersInNewWindow', "Controls whether folders should open in a new window or replace the last active window.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.confirmBeforeClose': {
                    'type': 'string',
                    'enum': ['always', 'keyboardOnly', 'never'],
                    'enumDescriptions': [
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.always.web', "Always try to ask for confirmation. Note that browsers may still decide to close a tab or window without confirmation.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.always', "Always ask for confirmation."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.keyboardOnly.web', "Only ask for confirmation if a keybinding was used to close the window. Note that detection may not be possible in some cases.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.keyboardOnly', "Only ask for confirmation if a keybinding was used."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.never.web', "Never explicitly ask for confirmation unless data loss is imminent.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.never', "Never explicitly ask for confirmation.")
                    ],
                    'default': (platform_2.isWeb && !(0, browser_1.isStandalone)()) ? 'keyboardOnly' : 'never', // on by default in web, unless PWA, never on desktop
                    'markdownDescription': platform_2.isWeb ?
                        (0, nls_1.localize)('confirmBeforeCloseWeb', "Controls whether to show a confirmation dialog before closing the browser tab or window. Note that even if enabled, browsers may still decide to close a tab or window without confirmation and that this setting is only a hint that may not work in all cases.") :
                        (0, nls_1.localize)('confirmBeforeClose', "Controls whether to show a confirmation dialog before closing a window or quitting the application."),
                    'scope': 1 /* ConfigurationScope.APPLICATION */
                }
            }
        });
        // Problems
        registry.registerConfiguration({
            ...configuration_1.problemsConfigurationNodeBase,
            'properties': {
                'problems.visibility': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('problems.visibility', "Controls whether the problems are visible throughout the editor and workbench."),
                },
            }
        });
        // Zen Mode
        registry.registerConfiguration({
            'id': 'zenMode',
            'order': 9,
            'title': (0, nls_1.localize)('zenModeConfigurationTitle', "Zen Mode"),
            'type': 'object',
            'properties': {
                'zenMode.fullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.fullScreen', "Controls whether turning on Zen Mode also puts the workbench into full screen mode.")
                },
                'zenMode.centerLayout': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.centerLayout', "Controls whether turning on Zen Mode also centers the layout.")
                },
                'zenMode.showTabs': {
                    'type': 'string',
                    'enum': ['multiple', 'single', 'none'],
                    'description': (0, nls_1.localize)('zenMode.showTabs', "Controls whether turning on Zen Mode should show multiple editor tabs, a single editor tab, or hide the editor title area completely."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('zenMode.showTabs.multiple', "Each editor is displayed as a tab in the editor title area."),
                        (0, nls_1.localize)('zenMode.showTabs.single', "The active editor is displayed as a single large tab in the editor title area."),
                        (0, nls_1.localize)('zenMode.showTabs.none', "The editor title area is not displayed."),
                    ],
                    'default': 'multiple'
                },
                'zenMode.hideStatusBar': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideStatusBar', "Controls whether turning on Zen Mode also hides the status bar at the bottom of the workbench.")
                },
                'zenMode.hideActivityBar': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideActivityBar', "Controls whether turning on Zen Mode also hides the activity bar either at the left or right of the workbench.")
                },
                'zenMode.hideLineNumbers': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideLineNumbers', "Controls whether turning on Zen Mode also hides the editor line numbers.")
                },
                'zenMode.restore': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.restore', "Controls whether a window should restore to Zen Mode if it was exited in Zen Mode.")
                },
                'zenMode.silentNotifications': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.silentNotifications', "Controls whether notifications do not disturb mode should be enabled while in Zen Mode. If true, only error notifications will pop out.")
                }
            }
        });
    })();
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'workbench.activityBar.visible', migrateFn: (value) => {
                const result = [];
                if (value !== undefined) {
                    result.push(['workbench.activityBar.visible', { value: undefined }]);
                }
                if (value === false) {
                    result.push(["workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, { value: "hidden" /* ActivityBarPosition.HIDDEN */ }]);
                }
                return result;
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: "workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, migrateFn: (value) => {
                const results = [];
                if (value === 'side') {
                    results.push(["workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, { value: "default" /* ActivityBarPosition.DEFAULT */ }]);
                }
                return results;
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'workbench.editor.doubleClickTabToToggleEditorGroupSizes', migrateFn: (value) => {
                const results = [];
                if (typeof value === 'boolean') {
                    value = value ? 'expand' : 'off';
                    results.push(['workbench.editor.doubleClickTabToToggleEditorGroupSizes', { value }]);
                }
                return results;
            }
        }, {
            key: "workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, migrateFn: (value) => {
                const results = [];
                if (typeof value === 'boolean') {
                    value = value ? "multiple" /* EditorTabsMode.MULTIPLE */ : "single" /* EditorTabsMode.SINGLE */;
                    results.push(["workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, { value }]);
                }
                return results;
            }
        }, {
            key: 'workbench.editor.tabCloseButton', migrateFn: (value) => {
                const result = [];
                if (value === 'left' || value === 'right') {
                    result.push(['workbench.editor.tabActionLocation', { value }]);
                }
                else if (value === 'off') {
                    result.push(['workbench.editor.tabActionCloseVisibility', { value: false }]);
                }
                return result;
            }
        }, {
            key: 'zenMode.hideTabs', migrateFn: (value) => {
                const result = [['zenMode.hideTabs', { value: undefined }]];
                if (value === true) {
                    result.push(['zenMode.showTabs', { value: 'single' }]);
                }
                return result;
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvd29ya2JlbmNoLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxNQUFNLFFBQVEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFNUYsZ0JBQWdCO0lBQ2hCLENBQUMsU0FBUyxxQkFBcUI7UUFFOUIsb0JBQW9CO1FBQ3BCLElBQUEsOENBQThCLEVBQUMsMkRBQTJDLENBQUMsRUFBRSxFQUFFLDJEQUEyQyxvQ0FBNEIsQ0FBQztRQUV2Six3QkFBd0I7UUFDeEIsSUFBQSw4Q0FBOEIsRUFBQyxxREFBcUMsQ0FBQyxFQUFFLEVBQUUscURBQXFDLHVDQUErQixDQUFDO1FBRTlJLFlBQVk7UUFDWixRQUFRLENBQUMscUJBQXFCLENBQUM7WUFDOUIsR0FBRyw4Q0FBOEI7WUFDakMsWUFBWSxFQUFFO2dCQUNiLHVDQUF1QyxFQUFFO29CQUN4QyxJQUFJLEVBQUUsUUFBUTtvQkFDZCxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDO29CQUMxQixnQkFBZ0IsRUFBRTt3QkFDakIsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUsbUJBQW1CLENBQUM7d0JBQzlFLElBQUEsY0FBUSxFQUFDLDZDQUE2QyxFQUFFLHNFQUFzRSxDQUFDO3FCQUMvSDtvQkFDRCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsK0ZBQStGLENBQUM7b0JBQzVJLE9BQU8sRUFBRSxTQUFTO2lCQUNsQjtnQkFDRCxtRUFBaUMsRUFBRTtvQkFDbEMsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLE1BQU0sRUFBRSxrSEFBcUU7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