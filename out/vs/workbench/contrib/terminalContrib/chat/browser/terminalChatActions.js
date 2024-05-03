/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/inlineChat/browser/inlineChatActions", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatController"], function (require, exports, codicons_1, nls_1, contextkey_1, inlineChatActions_1, inlineChat_1, terminal_1, terminalActions_1, terminalContextKey_1, terminalChat_1, terminalChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.start" /* TerminalChatCommandId.Start */,
        title: (0, nls_1.localize2)('startChat', 'Start in Terminal'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny),
            // HACK: Force weight to be higher than the extension contributed keybinding to override it until it gets replaced
            weight: 400 /* KeybindingWeight.ExternalExtension */ + 1, // KeybindingWeight.WorkbenchContrib,
        },
        f1: true,
        category: inlineChatActions_1.AbstractInlineChatAction.category,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), 
        // TODO: This needs to change to check for a terminal location capable agent
        inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.reveal();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.close" /* TerminalChatCommandId.Close */,
        title: (0, nls_1.localize2)('closeChat', 'Close Chat'),
        keybinding: {
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.visible),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        },
        icon: codicons_1.Codicon.close,
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET,
            group: 'navigation',
            order: 2
        },
        f1: true,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.visible)),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.clear();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.focusResponse" /* TerminalChatCommandId.FocusResponse */,
        title: (0, nls_1.localize2)('focusTerminalResponse', 'Focus Terminal Response'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
            when: terminalChat_1.TerminalChatContextKeys.focused,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        },
        f1: true,
        category: inlineChatActions_1.AbstractInlineChatAction.category,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), terminalChat_1.TerminalChatContextKeys.focused),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.chatWidget?.inlineChatWidget.chatWidget.focusLastMessage();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.focusInput" /* TerminalChatCommandId.FocusInput */,
        title: (0, nls_1.localize2)('focusTerminalInput', 'Focus Terminal Input'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */],
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.toNegated()),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        },
        f1: true,
        category: inlineChatActions_1.AbstractInlineChatAction.category,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), terminalChat_1.TerminalChatContextKeys.focused),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.chatWidget?.focus();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.discard" /* TerminalChatCommandId.Discard */,
        title: (0, nls_1.localize2)('discard', 'Discard'),
        icon: codicons_1.Codicon.discard,
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 2,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock)
        },
        f1: true,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.clear();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.runCommand" /* TerminalChatCommandId.RunCommand */,
        title: (0, nls_1.localize2)('runCommand', 'Run Chat Command'),
        shortTitle: (0, nls_1.localize2)('run', 'Run'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock),
        icon: codicons_1.Codicon.play,
        keybinding: {
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 0,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.requestActive.negate())
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptCommand(true);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.insertCommand" /* TerminalChatCommandId.InsertCommand */,
        title: (0, nls_1.localize2)('insertCommand', 'Insert Chat Command'),
        shortTitle: (0, nls_1.localize2)('insert', 'Insert'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock),
        keybinding: {
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 1,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.requestActive.negate())
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptCommand(false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.viewInChat" /* TerminalChatCommandId.ViewInChat */,
        title: (0, nls_1.localize2)('viewInChat', 'View in Chat'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered),
        icon: codicons_1.Codicon.commentDiscussion,
        menu: [{
                id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
                group: '0_main',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.negate(), terminalChat_1.TerminalChatContextKeys.requestActive.negate()),
            },
            {
                id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET,
                group: 'navigation',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EMPTY.negate(), terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.requestActive.negate()),
            }],
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.viewInChat();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.makeRequest" /* TerminalChatCommandId.MakeRequest */,
        title: (0, nls_1.localize2)('makeChatRequest', 'Make Chat Request'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, inlineChat_1.CTX_INLINE_CHAT_EMPTY.negate()),
        icon: codicons_1.Codicon.send,
        keybinding: {
            when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, terminalChat_1.TerminalChatContextKeys.requestActive.negate()),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 3 /* KeyCode.Enter */
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_INPUT,
            group: 'navigation',
            order: 1,
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptInput();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.cancel" /* TerminalChatCommandId.Cancel */,
        title: (0, nls_1.localize2)('cancelChat', 'Cancel Chat'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), terminalChat_1.TerminalChatContextKeys.requestActive, terminalChat_1.TerminalChatContextKeys.agentRegistered),
        icon: codicons_1.Codicon.debugStop,
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_INPUT,
            group: 'navigation',
            when: terminalChat_1.TerminalChatContextKeys.requestActive,
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.cancel();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.feedbackReportIssue" /* TerminalChatCommandId.FeedbackReportIssue */,
        title: (0, nls_1.localize2)('reportIssue', 'Report Issue'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */}`), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.notEqualsTo(undefined), terminalChat_1.TerminalChatContextKeys.responseSupportsIssueReporting),
        icon: codicons_1.Codicon.report,
        menu: [{
                id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK,
                when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.notEqualsTo(undefined), terminalChat_1.TerminalChatContextKeys.responseSupportsIssueReporting),
                group: 'inline',
                order: 3
            }],
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptFeedback();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2NoYXQvYnJvd3Nlci90ZXJtaW5hbENoYXRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0JoRyxJQUFBLDJDQUF5QixFQUFDO1FBQ3pCLEVBQUUsMEVBQTZCO1FBQy9CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUM7UUFDbEQsVUFBVSxFQUFFO1lBQ1gsT0FBTyxFQUFFLGlEQUE2QjtZQUN0QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsVUFBVSxDQUFDO1lBQ3hELGtIQUFrSDtZQUNsSCxNQUFNLEVBQUUsK0NBQXFDLENBQUMsRUFBRSxxQ0FBcUM7U0FDckY7UUFDRCxFQUFFLEVBQUUsSUFBSTtRQUNSLFFBQVEsRUFBRSw0Q0FBd0IsQ0FBQyxRQUFRO1FBQzNDLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDL0IsMkJBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSwyRkFBd0MsRUFBRSxDQUFDLEVBQ3hFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDO1FBQ25HLDRFQUE0RTtRQUM1RSx5Q0FBNEIsQ0FDNUI7UUFDRCxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxFQUFFO1lBQzFDLElBQUksSUFBQSxxQ0FBMEIsRUFBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLCtDQUFzQixDQUFDLGdCQUFnQixJ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