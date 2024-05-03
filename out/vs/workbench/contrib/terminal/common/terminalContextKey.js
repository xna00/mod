/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, nls_1, contextkey_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalContextKeys = exports.TerminalContextKeyStrings = void 0;
    var TerminalContextKeyStrings;
    (function (TerminalContextKeyStrings) {
        TerminalContextKeyStrings["IsOpen"] = "terminalIsOpen";
        TerminalContextKeyStrings["Count"] = "terminalCount";
        TerminalContextKeyStrings["GroupCount"] = "terminalGroupCount";
        TerminalContextKeyStrings["TabsNarrow"] = "isTerminalTabsNarrow";
        TerminalContextKeyStrings["HasFixedWidth"] = "terminalHasFixedWidth";
        TerminalContextKeyStrings["ProcessSupported"] = "terminalProcessSupported";
        TerminalContextKeyStrings["Focus"] = "terminalFocus";
        TerminalContextKeyStrings["FocusInAny"] = "terminalFocusInAny";
        TerminalContextKeyStrings["AccessibleBufferFocus"] = "terminalAccessibleBufferFocus";
        TerminalContextKeyStrings["AccessibleBufferOnLastLine"] = "terminalAccessibleBufferOnLastLine";
        TerminalContextKeyStrings["EditorFocus"] = "terminalEditorFocus";
        TerminalContextKeyStrings["TabsFocus"] = "terminalTabsFocus";
        TerminalContextKeyStrings["WebExtensionContributedProfile"] = "terminalWebExtensionContributedProfile";
        TerminalContextKeyStrings["TerminalHasBeenCreated"] = "terminalHasBeenCreated";
        TerminalContextKeyStrings["TerminalEditorActive"] = "terminalEditorActive";
        TerminalContextKeyStrings["TabsMouse"] = "terminalTabsMouse";
        TerminalContextKeyStrings["AltBufferActive"] = "terminalAltBufferActive";
        TerminalContextKeyStrings["SuggestWidgetVisible"] = "terminalSuggestWidgetVisible";
        TerminalContextKeyStrings["A11yTreeFocus"] = "terminalA11yTreeFocus";
        TerminalContextKeyStrings["ViewShowing"] = "terminalViewShowing";
        TerminalContextKeyStrings["TextSelected"] = "terminalTextSelected";
        TerminalContextKeyStrings["TextSelectedInFocused"] = "terminalTextSelectedInFocused";
        TerminalContextKeyStrings["FindVisible"] = "terminalFindVisible";
        TerminalContextKeyStrings["FindInputFocused"] = "terminalFindInputFocused";
        TerminalContextKeyStrings["FindFocused"] = "terminalFindFocused";
        TerminalContextKeyStrings["TabsSingularSelection"] = "terminalTabsSingularSelection";
        TerminalContextKeyStrings["SplitTerminal"] = "terminalSplitTerminal";
        TerminalContextKeyStrings["ShellType"] = "terminalShellType";
        TerminalContextKeyStrings["InTerminalRunCommandPicker"] = "inTerminalRunCommandPicker";
        TerminalContextKeyStrings["TerminalShellIntegrationEnabled"] = "terminalShellIntegrationEnabled";
    })(TerminalContextKeyStrings || (exports.TerminalContextKeyStrings = TerminalContextKeyStrings = {}));
    var TerminalContextKeys;
    (function (TerminalContextKeys) {
        /** Whether there is at least one opened terminal. */
        TerminalContextKeys.isOpen = new contextkey_1.RawContextKey("terminalIsOpen" /* TerminalContextKeyStrings.IsOpen */, false, true);
        /** Whether the terminal is focused. */
        TerminalContextKeys.focus = new contextkey_1.RawContextKey("terminalFocus" /* TerminalContextKeyStrings.Focus */, false, (0, nls_1.localize)('terminalFocusContextKey', "Whether the terminal is focused."));
        /** Whether any terminal is focused, including detached terminals used in other UI. */
        TerminalContextKeys.focusInAny = new contextkey_1.RawContextKey("terminalFocusInAny" /* TerminalContextKeyStrings.FocusInAny */, false, (0, nls_1.localize)('terminalFocusInAnyContextKey', "Whether any terminal is focused, including detached terminals used in other UI."));
        /** Whether a terminal in the editor area is focused. */
        TerminalContextKeys.editorFocus = new contextkey_1.RawContextKey("terminalEditorFocus" /* TerminalContextKeyStrings.EditorFocus */, false, (0, nls_1.localize)('terminalEditorFocusContextKey', "Whether a terminal in the editor area is focused."));
        /** The current number of terminals. */
        TerminalContextKeys.count = new contextkey_1.RawContextKey("terminalCount" /* TerminalContextKeyStrings.Count */, 0, (0, nls_1.localize)('terminalCountContextKey', "The current number of terminals."));
        /** The current number of terminal groups. */
        TerminalContextKeys.groupCount = new contextkey_1.RawContextKey("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 0, true);
        /** Whether the terminal tabs view is narrow. */
        TerminalContextKeys.tabsNarrow = new contextkey_1.RawContextKey("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */, false, true);
        /** Whether the terminal tabs view is narrow. */
        TerminalContextKeys.terminalHasFixedWidth = new contextkey_1.RawContextKey("terminalHasFixedWidth" /* TerminalContextKeyStrings.HasFixedWidth */, false, true);
        /** Whether the terminal tabs widget is focused. */
        TerminalContextKeys.tabsFocus = new contextkey_1.RawContextKey("terminalTabsFocus" /* TerminalContextKeyStrings.TabsFocus */, false, (0, nls_1.localize)('terminalTabsFocusContextKey', "Whether the terminal tabs widget is focused."));
        /** Whether a web extension has contributed a profile */
        TerminalContextKeys.webExtensionContributedProfile = new contextkey_1.RawContextKey("terminalWebExtensionContributedProfile" /* TerminalContextKeyStrings.WebExtensionContributedProfile */, false, true);
        /** Whether at least one terminal has been created */
        TerminalContextKeys.terminalHasBeenCreated = new contextkey_1.RawContextKey("terminalHasBeenCreated" /* TerminalContextKeyStrings.TerminalHasBeenCreated */, false, true);
        /** Whether at least one terminal has been created */
        TerminalContextKeys.terminalEditorActive = new contextkey_1.RawContextKey("terminalEditorActive" /* TerminalContextKeyStrings.TerminalEditorActive */, false, true);
        /** Whether the mouse is within the terminal tabs list. */
        TerminalContextKeys.tabsMouse = new contextkey_1.RawContextKey("terminalTabsMouse" /* TerminalContextKeyStrings.TabsMouse */, false, true);
        /** The shell type of the active terminal, this is set to the last known value when no terminals exist. */
        TerminalContextKeys.shellType = new contextkey_1.RawContextKey("terminalShellType" /* TerminalContextKeyStrings.ShellType */, undefined, { type: 'string', description: (0, nls_1.localize)('terminalShellTypeContextKey', "The shell type of the active terminal, this is set to the last known value when no terminals exist.") });
        /** Whether the terminal's alt buffer is active. */
        TerminalContextKeys.altBufferActive = new contextkey_1.RawContextKey("terminalAltBufferActive" /* TerminalContextKeyStrings.AltBufferActive */, false, (0, nls_1.localize)('terminalAltBufferActive', "Whether the terminal's alt buffer is active."));
        /** Whether the terminal's suggest widget is visible. */
        TerminalContextKeys.suggestWidgetVisible = new contextkey_1.RawContextKey("terminalSuggestWidgetVisible" /* TerminalContextKeyStrings.SuggestWidgetVisible */, false, (0, nls_1.localize)('terminalSuggestWidgetVisible', "Whether the terminal's suggest widget is visible."));
        /** Whether the terminal is NOT focused. */
        TerminalContextKeys.notFocus = TerminalContextKeys.focus.toNegated();
        /** Whether the terminal view is showing. */
        TerminalContextKeys.viewShowing = new contextkey_1.RawContextKey("terminalViewShowing" /* TerminalContextKeyStrings.ViewShowing */, false, (0, nls_1.localize)('terminalViewShowing', "Whether the terminal view is showing"));
        /** Whether text is selected in the active terminal. */
        TerminalContextKeys.textSelected = new contextkey_1.RawContextKey("terminalTextSelected" /* TerminalContextKeyStrings.TextSelected */, false, (0, nls_1.localize)('terminalTextSelectedContextKey', "Whether text is selected in the active terminal."));
        /** Whether text is selected in a focused terminal. `textSelected` counts text selected in an active in a terminal view or an editor, where `textSelectedInFocused` simply counts text in an element with DOM focus. */
        TerminalContextKeys.textSelectedInFocused = new contextkey_1.RawContextKey("terminalTextSelectedInFocused" /* TerminalContextKeyStrings.TextSelectedInFocused */, false, (0, nls_1.localize)('terminalTextSelectedInFocusedContextKey', "Whether text is selected in a focused terminal."));
        /** Whether text is NOT selected in the active terminal. */
        TerminalContextKeys.notTextSelected = TerminalContextKeys.textSelected.toNegated();
        /** Whether the active terminal's find widget is visible. */
        TerminalContextKeys.findVisible = new contextkey_1.RawContextKey("terminalFindVisible" /* TerminalContextKeyStrings.FindVisible */, false, true);
        /** Whether the active terminal's find widget is NOT visible. */
        TerminalContextKeys.notFindVisible = TerminalContextKeys.findVisible.toNegated();
        /** Whether the active terminal's find widget text input is focused. */
        TerminalContextKeys.findInputFocus = new contextkey_1.RawContextKey("terminalFindInputFocused" /* TerminalContextKeyStrings.FindInputFocused */, false, true);
        /** Whether an element within the active terminal's find widget is focused. */
        TerminalContextKeys.findFocus = new contextkey_1.RawContextKey("terminalFindFocused" /* TerminalContextKeyStrings.FindFocused */, false, true);
        /** Whether NO elements within the active terminal's find widget is focused. */
        TerminalContextKeys.notFindFocus = TerminalContextKeys.findInputFocus.toNegated();
        /** Whether terminal processes can be launched in the current workspace. */
        TerminalContextKeys.processSupported = new contextkey_1.RawContextKey("terminalProcessSupported" /* TerminalContextKeyStrings.ProcessSupported */, false, (0, nls_1.localize)('terminalProcessSupportedContextKey', "Whether terminal processes can be launched in the current workspace."));
        /** Whether one terminal is selected in the terminal tabs list. */
        TerminalContextKeys.tabsSingularSelection = new contextkey_1.RawContextKey("terminalTabsSingularSelection" /* TerminalContextKeyStrings.TabsSingularSelection */, false, (0, nls_1.localize)('terminalTabsSingularSelectedContextKey', "Whether one terminal is selected in the terminal tabs list."));
        /** Whether the focused tab's terminal is a split terminal. */
        TerminalContextKeys.splitTerminal = new contextkey_1.RawContextKey("terminalSplitTerminal" /* TerminalContextKeyStrings.SplitTerminal */, false, (0, nls_1.localize)('isSplitTerminalContextKey', "Whether the focused tab's terminal is a split terminal."));
        /** Whether the terminal run command picker is currently open. */
        TerminalContextKeys.inTerminalRunCommandPicker = new contextkey_1.RawContextKey("inTerminalRunCommandPicker" /* TerminalContextKeyStrings.InTerminalRunCommandPicker */, false, (0, nls_1.localize)('inTerminalRunCommandPickerContextKey', "Whether the terminal run command picker is currently open."));
        /** Whether shell integration is enabled in the active terminal. This only considers full VS Code shell integration. */
        TerminalContextKeys.terminalShellIntegrationEnabled = new contextkey_1.RawContextKey("terminalShellIntegrationEnabled" /* TerminalContextKeyStrings.TerminalShellIntegrationEnabled */, false, (0, nls_1.localize)('terminalShellIntegrationEnabled', "Whether shell integration is enabled in the active terminal"));
        TerminalContextKeys.shouldShowViewInlineActions = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_1.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.notEquals(`config.${"terminal.integrated.tabs.hideCondition" /* TerminalSettingId.TabsHideCondition */}`, 'never'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.not(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleTerminal'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleTerminalOrNarrow'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1), contextkey_1.ContextKeyExpr.has("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */))), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleGroup'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'always')));
    })(TerminalContextKeys || (exports.TerminalContextKeys = TerminalContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb250ZXh0S2V5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9jb21tb24vdGVybWluYWxDb250ZXh0S2V5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFrQix5QkErQmpCO0lBL0JELFdBQWtCLHlCQUF5QjtRQUMxQyxzREFBeUIsQ0FBQTtRQUN6QixvREFBdUIsQ0FBQTtRQUN2Qiw4REFBaUMsQ0FBQTtRQUNqQyxnRUFBbUMsQ0FBQTtRQUNuQyxvRUFBdUMsQ0FBQTtRQUN2QywwRUFBNkMsQ0FBQTtRQUM3QyxvREFBdUIsQ0FBQTtRQUN2Qiw4REFBaUMsQ0FBQTtRQUNqQyxvRkFBdUQsQ0FBQTtRQUN2RCw4RkFBaUUsQ0FBQTtRQUNqRSxnRUFBbUMsQ0FBQTtRQUNuQyw0REFBK0IsQ0FBQTtRQUMvQixzR0FBeUUsQ0FBQTtRQUN6RSw4RUFBaUQsQ0FBQTtRQUNqRCwwRUFBNkMsQ0FBQTtRQUM3Qyw0REFBK0IsQ0FBQTtRQUMvQix3RUFBMkMsQ0FBQTtRQUMzQyxrRkFBcUQsQ0FBQTtRQUNyRCxvRUFBdUMsQ0FBQTtRQUN2QyxnRUFBbUMsQ0FBQTtRQUNuQyxrRUFBcUMsQ0FBQTtRQUNyQyxvRkFBdUQsQ0FBQTtRQUN2RCxnRUFBbUMsQ0FBQTtRQUNuQywwRUFBNkMsQ0FBQTtRQUM3QyxnRUFBbUMsQ0FBQTtRQUNuQyxvRkFBdUQsQ0FBQTtRQUN2RCxvRUFBdUMsQ0FBQTtRQUN2Qyw0REFBK0IsQ0FBQTtRQUMvQixzRkFBeUQsQ0FBQTtRQUN6RCxnR0FBbUUsQ0FBQTtJQUNwRSxDQUFDLEVBL0JpQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQStCMUM7SUFFRCxJQUFpQixtQkFBbUIsQ0FxSG5DO0lBckhELFdBQWlCLG1CQUFtQjtR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