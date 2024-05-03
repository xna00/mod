/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatContextKeys = exports.TerminalChatContextKeyStrings = exports.MENU_TERMINAL_CHAT_WIDGET_TOOLBAR = exports.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK = exports.MENU_TERMINAL_CHAT_WIDGET_STATUS = exports.MENU_TERMINAL_CHAT_WIDGET = exports.MENU_TERMINAL_CHAT_INPUT = exports.TerminalChatCommandId = void 0;
    var TerminalChatCommandId;
    (function (TerminalChatCommandId) {
        TerminalChatCommandId["Start"] = "workbench.action.terminal.chat.start";
        TerminalChatCommandId["Close"] = "workbench.action.terminal.chat.close";
        TerminalChatCommandId["FocusResponse"] = "workbench.action.terminal.chat.focusResponse";
        TerminalChatCommandId["FocusInput"] = "workbench.action.terminal.chat.focusInput";
        TerminalChatCommandId["Discard"] = "workbench.action.terminal.chat.discard";
        TerminalChatCommandId["MakeRequest"] = "workbench.action.terminal.chat.makeRequest";
        TerminalChatCommandId["Cancel"] = "workbench.action.terminal.chat.cancel";
        TerminalChatCommandId["FeedbackHelpful"] = "workbench.action.terminal.chat.feedbackHelpful";
        TerminalChatCommandId["FeedbackUnhelpful"] = "workbench.action.terminal.chat.feedbackUnhelpful";
        TerminalChatCommandId["FeedbackReportIssue"] = "workbench.action.terminal.chat.feedbackReportIssue";
        TerminalChatCommandId["RunCommand"] = "workbench.action.terminal.chat.runCommand";
        TerminalChatCommandId["InsertCommand"] = "workbench.action.terminal.chat.insertCommand";
        TerminalChatCommandId["ViewInChat"] = "workbench.action.terminal.chat.viewInChat";
        TerminalChatCommandId["PreviousFromHistory"] = "workbench.action.terminal.chat.previousFromHistory";
        TerminalChatCommandId["NextFromHistory"] = "workbench.action.terminal.chat.nextFromHistory";
    })(TerminalChatCommandId || (exports.TerminalChatCommandId = TerminalChatCommandId = {}));
    exports.MENU_TERMINAL_CHAT_INPUT = actions_1.MenuId.for('terminalChatInput');
    exports.MENU_TERMINAL_CHAT_WIDGET = actions_1.MenuId.for('terminalChatWidget');
    exports.MENU_TERMINAL_CHAT_WIDGET_STATUS = actions_1.MenuId.for('terminalChatWidget.status');
    exports.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK = actions_1.MenuId.for('terminalChatWidget.feedback');
    exports.MENU_TERMINAL_CHAT_WIDGET_TOOLBAR = actions_1.MenuId.for('terminalChatWidget.toolbar');
    var TerminalChatContextKeyStrings;
    (function (TerminalChatContextKeyStrings) {
        TerminalChatContextKeyStrings["ChatFocus"] = "terminalChatFocus";
        TerminalChatContextKeyStrings["ChatVisible"] = "terminalChatVisible";
        TerminalChatContextKeyStrings["ChatActiveRequest"] = "terminalChatActiveRequest";
        TerminalChatContextKeyStrings["ChatInputHasText"] = "terminalChatInputHasText";
        TerminalChatContextKeyStrings["ChatAgentRegistered"] = "terminalChatAgentRegistered";
        TerminalChatContextKeyStrings["ChatResponseEditorFocused"] = "terminalChatResponseEditorFocused";
        TerminalChatContextKeyStrings["ChatResponseContainsCodeBlock"] = "terminalChatResponseContainsCodeBlock";
        TerminalChatContextKeyStrings["ChatResponseSupportsIssueReporting"] = "terminalChatResponseSupportsIssueReporting";
        TerminalChatContextKeyStrings["ChatSessionResponseVote"] = "terminalChatSessionResponseVote";
    })(TerminalChatContextKeyStrings || (exports.TerminalChatContextKeyStrings = TerminalChatContextKeyStrings = {}));
    var TerminalChatContextKeys;
    (function (TerminalChatContextKeys) {
        /** Whether the chat widget is focused */
        TerminalChatContextKeys.focused = new contextkey_1.RawContextKey("terminalChatFocus" /* TerminalChatContextKeyStrings.ChatFocus */, false, (0, nls_1.localize)('chatFocusedContextKey', "Whether the chat view is focused."));
        /** Whether the chat widget is visible */
        TerminalChatContextKeys.visible = new contextkey_1.RawContextKey("terminalChatVisible" /* TerminalChatContextKeyStrings.ChatVisible */, false, (0, nls_1.localize)('chatVisibleContextKey', "Whether the chat view is visible."));
        /** Whether there is an active chat request */
        TerminalChatContextKeys.requestActive = new contextkey_1.RawContextKey("terminalChatActiveRequest" /* TerminalChatContextKeyStrings.ChatActiveRequest */, false, (0, nls_1.localize)('chatRequestActiveContextKey', "Whether there is an active chat request."));
        /** Whether the chat input has text */
        TerminalChatContextKeys.inputHasText = new contextkey_1.RawContextKey("terminalChatInputHasText" /* TerminalChatContextKeyStrings.ChatInputHasText */, false, (0, nls_1.localize)('chatInputHasTextContextKey', "Whether the chat input has text."));
        /** Whether the terminal chat agent has been registered */
        TerminalChatContextKeys.agentRegistered = new contextkey_1.RawContextKey("terminalChatAgentRegistered" /* TerminalChatContextKeyStrings.ChatAgentRegistered */, false, (0, nls_1.localize)('chatAgentRegisteredContextKey', "Whether the terminal chat agent has been registered."));
        /** The type of chat response, if any */
        TerminalChatContextKeys.responseContainsCodeBlock = new contextkey_1.RawContextKey("terminalChatResponseContainsCodeBlock" /* TerminalChatContextKeyStrings.ChatResponseContainsCodeBlock */, false, (0, nls_1.localize)('chatResponseContainsCodeBlockContextKey', "Whether the chat response contains a code block."));
        /** Whether the response supports issue reporting */
        TerminalChatContextKeys.responseSupportsIssueReporting = new contextkey_1.RawContextKey("terminalChatResponseSupportsIssueReporting" /* TerminalChatContextKeyStrings.ChatResponseSupportsIssueReporting */, false, (0, nls_1.localize)('chatResponseSupportsIssueReportingContextKey', "Whether the response supports issue reporting"));
        /** The chat vote, if any for the response, if any */
        TerminalChatContextKeys.sessionResponseVote = new contextkey_1.RawContextKey("terminalChatSessionResponseVote" /* TerminalChatContextKeyStrings.ChatSessionResponseVote */, undefined, { type: 'string', description: (0, nls_1.localize)('interactiveSessionResponseVote', "When the response has been voted up, is set to 'up'. When voted down, is set to 'down'. Otherwise an empty string.") });
    })(TerminalChatContextKeys || (exports.TerminalChatContextKeys = TerminalChatContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvY2hhdC9icm93c2VyL3Rlcm1pbmFsQ2hhdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsSUFBa0IscUJBZ0JqQjtJQWhCRCxXQUFrQixxQkFBcUI7UUFDdEMsdUVBQThDLENBQUE7UUFDOUMsdUVBQThDLENBQUE7UUFDOUMsdUZBQThELENBQUE7UUFDOUQsaUZBQXdELENBQUE7UUFDeEQsMkVBQWtELENBQUE7UUFDbEQsbUZBQTBELENBQUE7UUFDMUQseUVBQWdELENBQUE7UUFDaEQsMkZBQWtFLENBQUE7UUFDbEUsK0ZBQXNFLENBQUE7UUFDdEUsbUdBQTBFLENBQUE7UUFDMUUsaUZBQXdELENBQUE7UUFDeEQsdUZBQThELENBQUE7UUFDOUQsaUZBQXdELENBQUE7UUFDeEQsbUdBQTBFLENBQUE7UUFDMUUsMkZBQWtFLENBQUE7SUFDbkUsQ0FBQyxFQWhCaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFnQnRDO0lBRVksUUFBQSx3QkFBd0IsR0FBRyxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzNELFFBQUEseUJBQXlCLEdBQUcsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUM3RCxRQUFBLGdDQUFnQyxHQUFHLGdCQUFNLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDM0UsUUFBQSxrQ0FBa0MsR0FBRyxnQkFBTSxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQy9FLFFBQUEsaUNBQWlDLEdBQUcsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUUxRixJQUFrQiw2QkFVakI7SUFWRCxXQUFrQiw2QkFBNkI7UUFDOUMsZ0VBQStCLENBQUE7UUFDL0Isb0VBQW1DLENBQUE7UUFDbkMsZ0ZBQStDLENBQUE7UUFDL0MsOEVBQTZDLENBQUE7UUFDN0Msb0ZBQW1ELENBQUE7UUFDbkQsZ0dBQStELENBQUE7UUFDL0Qsd0dBQXVFLENBQUE7UUFDdkUsa0hBQWlGLENBQUE7UUFDakYsNEZBQTJELENBQUE7SUFDNUQsQ0FBQyxFQVZpQiw2QkFBNkIsNkNBQTdCLDZCQUE2QixRQVU5QztJQUdELElBQWlCLHVCQUF1QixDQXlCdkM7SUF6QkQsV0FBaUIsdUJBQXVCO1FBRXZDLHlDQUF5QztRQUM1QiwrQkFBTyxHQUFHLElBQUksMEJBQWEsb0VBQW1ELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDLENBQUM7UUFFMUsseUNBQXlDO1FBQzVCLCtCQUFPLEdBQUcsSUFBSSwwQkFBYSx3RUFBcUQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztRQUU1Syw4Q0FBOEM7UUFDakMscUNBQWEsR0FBRyxJQUFJLDBCQUFhLG9GQUEyRCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsMENBQTBDLENBQUMsQ0FBQyxDQUFDO1FBRXJNLHNDQUFzQztRQUN6QixvQ0FBWSxHQUFHLElBQUksMEJBQWEsa0ZBQTBELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7UUFFMUwsMERBQTBEO1FBQzdDLHVDQUFlLEdBQUcsSUFBSSwwQkFBYSx3RkFBNkQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLHNEQUFzRCxDQUFDLENBQUMsQ0FBQztRQUV2Tix3Q0FBd0M7UUFDM0IsaURBQXlCLEdBQUcsSUFBSSwwQkFBYSw0R0FBdUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLGtEQUFrRCxDQUFDLENBQUMsQ0FBQztRQUVqUCxvREFBb0Q7UUFDdkMsc0RBQThCLEdBQUcsSUFBSSwwQkFBYSxzSEFBNEUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDhDQUE4QyxFQUFFLCtDQUErQyxDQUFDLENBQUMsQ0FBQztRQUU3UCxxREFBcUQ7UUFDeEMsMkNBQW1CLEdBQUcsSUFBSSwwQkFBYSxnR0FBZ0UsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsb0hBQW9ILENBQUMsRUFBRSxDQUFDLENBQUM7SUFDblUsQ0FBQyxFQXpCZ0IsdUJBQXVCLHVDQUF2Qix1QkFBdUIsUUF5QnZDIn0=