/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneServicesNLS = exports.ToggleHighContrastNLS = exports.StandaloneCodeEditorNLS = exports.QuickOutlineNLS = exports.QuickCommandNLS = exports.QuickHelpNLS = exports.GoToLineNLS = exports.InspectTokensNLS = exports.AccessibilityHelpNLS = void 0;
    var AccessibilityHelpNLS;
    (function (AccessibilityHelpNLS) {
        AccessibilityHelpNLS.accessibilityHelpTitle = nls.localize('accessibilityHelpTitle', "Accessibility Help");
        AccessibilityHelpNLS.openingDocs = nls.localize("openingDocs", "Opening the Accessibility documentation page.");
        AccessibilityHelpNLS.readonlyDiffEditor = nls.localize("readonlyDiffEditor", "You are in a read-only pane of a diff editor.");
        AccessibilityHelpNLS.editableDiffEditor = nls.localize("editableDiffEditor", "You are in a pane of a diff editor.");
        AccessibilityHelpNLS.readonlyEditor = nls.localize("readonlyEditor", "You are in a read-only code editor.");
        AccessibilityHelpNLS.editableEditor = nls.localize("editableEditor", "You are in a code editor.");
        AccessibilityHelpNLS.changeConfigToOnMac = nls.localize("changeConfigToOnMac", "Configure the application to be optimized for usage with a Screen Reader (Command+E).");
        AccessibilityHelpNLS.changeConfigToOnWinLinux = nls.localize("changeConfigToOnWinLinux", "Configure the application to be optimized for usage with a Screen Reader (Control+E).");
        AccessibilityHelpNLS.auto_on = nls.localize("auto_on", "The application is configured to be optimized for usage with a Screen Reader.");
        AccessibilityHelpNLS.auto_off = nls.localize("auto_off", "The application is configured to never be optimized for usage with a Screen Reader.");
        AccessibilityHelpNLS.screenReaderModeEnabled = nls.localize("screenReaderModeEnabled", "Screen Reader Optimized Mode enabled.");
        AccessibilityHelpNLS.screenReaderModeDisabled = nls.localize("screenReaderModeDisabled", "Screen Reader Optimized Mode disabled.");
        AccessibilityHelpNLS.tabFocusModeOnMsg = nls.localize("tabFocusModeOnMsg", "Pressing Tab in the current editor will move focus to the next focusable element. Toggle this behavior {0}.");
        AccessibilityHelpNLS.tabFocusModeOnMsgNoKb = nls.localize("tabFocusModeOnMsgNoKb", "Pressing Tab in the current editor will move focus to the next focusable element. The command {0} is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.stickScrollKb = nls.localize("stickScrollKb", "Focus Sticky Scroll ({0}) to focus the currently nested scopes.");
        AccessibilityHelpNLS.stickScrollNoKb = nls.localize("stickScrollNoKb", "Focus Sticky Scroll to focus the currently nested scopes. It is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.tabFocusModeOffMsg = nls.localize("tabFocusModeOffMsg", "Pressing Tab in the current editor will insert the tab character. Toggle this behavior {0}.");
        AccessibilityHelpNLS.tabFocusModeOffMsgNoKb = nls.localize("tabFocusModeOffMsgNoKb", "Pressing Tab in the current editor will insert the tab character. The command {0} is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.showAccessibilityHelpAction = nls.localize("showAccessibilityHelpAction", "Show Accessibility Help");
        AccessibilityHelpNLS.listSignalSounds = nls.localize("listSignalSoundsCommand", "Run the command: List Signal Sounds for an overview of all sounds and their current status.");
        AccessibilityHelpNLS.listAlerts = nls.localize("listAnnouncementsCommand", "Run the command: List Signal Announcements for an overview of announcements and their current status.");
        AccessibilityHelpNLS.quickChat = nls.localize("quickChatCommand", "Toggle quick chat ({0}) to open or close a chat session.");
        AccessibilityHelpNLS.quickChatNoKb = nls.localize("quickChatCommandNoKb", "Toggle quick chat is not currently triggerable by a keybinding.");
        AccessibilityHelpNLS.startInlineChat = nls.localize("startInlineChatCommand", "Start inline chat ({0}) to create an in editor chat session.");
        AccessibilityHelpNLS.startInlineChatNoKb = nls.localize("startInlineChatCommandNoKb", "The command: Start inline chat is not currentlyt riggerable by a keybinding.");
    })(AccessibilityHelpNLS || (exports.AccessibilityHelpNLS = AccessibilityHelpNLS = {}));
    var InspectTokensNLS;
    (function (InspectTokensNLS) {
        InspectTokensNLS.inspectTokensAction = nls.localize('inspectTokens', "Developer: Inspect Tokens");
    })(InspectTokensNLS || (exports.InspectTokensNLS = InspectTokensNLS = {}));
    var GoToLineNLS;
    (function (GoToLineNLS) {
        GoToLineNLS.gotoLineActionLabel = nls.localize('gotoLineActionLabel', "Go to Line/Column...");
    })(GoToLineNLS || (exports.GoToLineNLS = GoToLineNLS = {}));
    var QuickHelpNLS;
    (function (QuickHelpNLS) {
        QuickHelpNLS.helpQuickAccessActionLabel = nls.localize('helpQuickAccess', "Show all Quick Access Providers");
    })(QuickHelpNLS || (exports.QuickHelpNLS = QuickHelpNLS = {}));
    var QuickCommandNLS;
    (function (QuickCommandNLS) {
        QuickCommandNLS.quickCommandActionLabel = nls.localize('quickCommandActionLabel', "Command Palette");
        QuickCommandNLS.quickCommandHelp = nls.localize('quickCommandActionHelp', "Show And Run Commands");
    })(QuickCommandNLS || (exports.QuickCommandNLS = QuickCommandNLS = {}));
    var QuickOutlineNLS;
    (function (QuickOutlineNLS) {
        QuickOutlineNLS.quickOutlineActionLabel = nls.localize('quickOutlineActionLabel', "Go to Symbol...");
        QuickOutlineNLS.quickOutlineByCategoryActionLabel = nls.localize('quickOutlineByCategoryActionLabel', "Go to Symbol by Category...");
    })(QuickOutlineNLS || (exports.QuickOutlineNLS = QuickOutlineNLS = {}));
    var StandaloneCodeEditorNLS;
    (function (StandaloneCodeEditorNLS) {
        StandaloneCodeEditorNLS.editorViewAccessibleLabel = nls.localize('editorViewAccessibleLabel', "Editor content");
        StandaloneCodeEditorNLS.accessibilityHelpMessage = nls.localize('accessibilityHelpMessage', "Press Alt+F1 for Accessibility Options.");
    })(StandaloneCodeEditorNLS || (exports.StandaloneCodeEditorNLS = StandaloneCodeEditorNLS = {}));
    var ToggleHighContrastNLS;
    (function (ToggleHighContrastNLS) {
        ToggleHighContrastNLS.toggleHighContrast = nls.localize('toggleHighContrast', "Toggle High Contrast Theme");
    })(ToggleHighContrastNLS || (exports.ToggleHighContrastNLS = ToggleHighContrastNLS = {}));
    var StandaloneServicesNLS;
    (function (StandaloneServicesNLS) {
        StandaloneServicesNLS.bulkEditServiceSummary = nls.localize('bulkEditServiceSummary', "Made {0} edits in {1} files");
    })(StandaloneServicesNLS || (exports.StandaloneServicesNLS = StandaloneServicesNLS = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVN0cmluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc3RhbmRhbG9uZVN0cmluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLElBQWlCLG9CQUFvQixDQTBCcEM7SUExQkQsV0FBaUIsb0JBQW9CO1FBQ3ZCLDJDQUFzQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUN0RixnQ0FBVyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLCtDQUErQyxDQUFDLENBQUM7UUFDM0YsdUNBQWtCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO1FBQ3pHLHVDQUFrQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUscUNBQXFDLENBQUMsQ0FBQztRQUMvRixtQ0FBYyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUscUNBQXFDLENBQUMsQ0FBQztRQUN2RixtQ0FBYyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztRQUM3RSx3Q0FBbUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLHVGQUF1RixDQUFDLENBQUM7UUFDbkosNkNBQXdCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSx1RkFBdUYsQ0FBQyxDQUFDO1FBQzdKLDRCQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsK0VBQStFLENBQUMsQ0FBQztRQUNuSCw2QkFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLHFGQUFx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