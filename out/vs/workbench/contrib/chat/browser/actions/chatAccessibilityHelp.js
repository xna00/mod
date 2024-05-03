/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/editor/browser/widget/diffEditor/commands", "vs/workbench/contrib/inlineChat/common/inlineChat"], function (require, exports, nls_1, strings_1, keybinding_1, chat_1, accessibleView_1, commands_1, inlineChat_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAccessibilityHelpText = getAccessibilityHelpText;
    exports.runAccessibilityHelpAction = runAccessibilityHelpAction;
    function getAccessibilityHelpText(accessor, type) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const content = [];
        const openAccessibleViewKeybinding = keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel();
        if (type === 'panelChat') {
            content.push((0, nls_1.localize)('chat.overview', 'The chat view is comprised of an input box and a request/response list. The input box is used to make requests and the list is used to display responses.'));
            content.push((0, nls_1.localize)('chat.requestHistory', 'In the input box, use up and down arrows to navigate your request history. Edit input and use enter or the submit button to run a new request.'));
            content.push(openAccessibleViewKeybinding ? (0, nls_1.localize)('chat.inspectResponse', 'In the input box, inspect the last response in the accessible view {0}', openAccessibleViewKeybinding) : (0, nls_1.localize)('chat.inspectResponseNoKb', 'With the input box focused, inspect the last response in the accessible view via the Open Accessible View command, which is currently not triggerable by a keybinding.'));
            content.push((0, nls_1.localize)('chat.followUp', 'In the input box, navigate to the suggested follow up question (Shift+Tab) and press Enter to run it.'));
            content.push((0, nls_1.localize)('chat.announcement', 'Chat responses will be announced as they come in. A response will indicate the number of code blocks, if any, and then the rest of the response.'));
            content.push(descriptionForCommand('chat.action.focus', (0, nls_1.localize)('workbench.action.chat.focus', 'To focus the chat request/response list, which can be navigated with up and down arrows, invoke the Focus Chat command ({0}).'), (0, nls_1.localize)('workbench.action.chat.focusNoKb', 'To focus the chat request/response list, which can be navigated with up and down arrows, invoke The Focus Chat List command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.focusInput', (0, nls_1.localize)('workbench.action.chat.focusInput', 'To focus the input box for chat requests, invoke the Focus Chat Input command ({0}).'), (0, nls_1.localize)('workbench.action.interactiveSession.focusInputNoKb', 'To focus the input box for chat requests, invoke the Focus Chat Input command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.nextCodeBlock', (0, nls_1.localize)('workbench.action.chat.nextCodeBlock', 'To focus the next code block within a response, invoke the Chat: Next Code Block command ({0}).'), (0, nls_1.localize)('workbench.action.chat.nextCodeBlockNoKb', 'To focus the next code block within a response, invoke the Chat: Next Code Block command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.nextFileTree', (0, nls_1.localize)('workbench.action.chat.nextFileTree', 'To focus the next file tree within a response, invoke the Chat: Next File Tree command ({0}).'), (0, nls_1.localize)('workbench.action.chat.nextFileTreeNoKb', 'To focus the next file tree within a response, invoke the Chat: Next File Tree command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.clear', (0, nls_1.localize)('workbench.action.chat.clear', 'To clear the request/response list, invoke the Chat Clear command ({0}).'), (0, nls_1.localize)('workbench.action.chat.clearNoKb', 'To clear the request/response list, invoke the Chat Clear command, which is currently not triggerable by a keybinding.'), keybindingService));
        }
        else {
            const startChatKeybinding = keybindingService.lookupKeybinding('inlineChat.start')?.getAriaLabel();
            content.push((0, nls_1.localize)('inlineChat.overview', "Inline chat occurs within a code editor and takes into account the current selection. It is useful for making changes to the current editor. For example, fixing diagnostics, documenting or refactoring code. Keep in mind that AI generated code may be incorrect."));
            content.push((0, nls_1.localize)('inlineChat.access', "It can be activated via code actions or directly using the command: Inline Chat: Start Inline Chat ({0}).", startChatKeybinding));
            const upHistoryKeybinding = keybindingService.lookupKeybinding('inlineChat.previousFromHistory')?.getAriaLabel();
            const downHistoryKeybinding = keybindingService.lookupKeybinding('inlineChat.nextFromHistory')?.getAriaLabel();
            if (upHistoryKeybinding && downHistoryKeybinding) {
                content.push((0, nls_1.localize)('inlineChat.requestHistory', 'In the input box, use {0} and {1} to navigate your request history. Edit input and use enter or the submit button to run a new request.', upHistoryKeybinding, downHistoryKeybinding));
            }
            content.push(openAccessibleViewKeybinding ? (0, nls_1.localize)('inlineChat.inspectResponse', 'In the input box, inspect the response in the accessible view {0}.', openAccessibleViewKeybinding) : (0, nls_1.localize)('inlineChat.inspectResponseNoKb', 'With the input box focused, inspect the response in the accessible view via the Open Accessible View command, which is currently not triggerable by a keybinding.'));
            content.push((0, nls_1.localize)('inlineChat.contextActions', "Context menu actions may run a request prefixed with a /. Type / to discover such ready-made commands."));
            content.push((0, nls_1.localize)('inlineChat.fix', "If a fix action is invoked, a response will indicate the problem with the current code. A diff editor will be rendered and can be reached by tabbing."));
            const diffReviewKeybinding = keybindingService.lookupKeybinding(commands_1.AccessibleDiffViewerNext.id)?.getAriaLabel();
            content.push(diffReviewKeybinding ? (0, nls_1.localize)('inlineChat.diff', "Once in the diff editor, enter review mode with ({0}). Use up and down arrows to navigate lines with the proposed changes.", diffReviewKeybinding) : (0, nls_1.localize)('inlineChat.diffNoKb', "Tab again to enter the Diff editor with the changes and enter review mode with the Go to Next Difference Command. Use Up/DownArrow to navigate lines with the proposed changes."));
            content.push((0, nls_1.localize)('inlineChat.toolbar', "Use tab to reach conditional parts like commands, status, message responses and more."));
        }
        content.push((0, nls_1.localize)('chat.signals', "Accessibility Signals can be changed via settings with a prefix of signals.chat. By default, if a request takes more than 4 seconds, you will hear a sound indicating that progress is still occurring."));
        return content.join('\n\n');
    }
    function descriptionForCommand(commandId, msg, noKbMsg, keybindingService) {
        const kb = keybindingService.lookupKeybinding(commandId);
        if (kb) {
            return (0, strings_1.format)(msg, kb.getAriaLabel());
        }
        return (0, strings_1.format)(noKbMsg, commandId);
    }
    async function runAccessibilityHelpAction(accessor, editor, type) {
        const widgetService = accessor.get(chat_1.IChatWidgetService);
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const inputEditor = type === 'panelChat' ? widgetService.lastFocusedWidget?.inputEditor : editor;
        if (!inputEditor) {
            return;
        }
        const domNode = inputEditor.getDomNode() ?? undefined;
        if (!domNode) {
            return;
        }
        const cachedPosition = inputEditor.getPosition();
        inputEditor.getSupportedActions();
        const helpText = getAccessibilityHelpText(accessor, type);
        accessibleViewService.show({
            id: type === 'panelChat' ? "panelChat" /* AccessibleViewProviderId.Chat */ : "inlineChat" /* AccessibleViewProviderId.InlineChat */,
            verbositySettingKey: type === 'panelChat' ? "accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */ : "accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */,
            provideContent: () => helpText,
            onClose: () => {
                if (type === 'panelChat' && cachedPosition) {
                    inputEditor.setPosition(cachedPosition);
                    inputEditor.focus();
                }
                else if (type === 'inlineChat') {
                    // TODO@jrieken find a better way for this
                    const ctrl = editor?.getContribution(inlineChat_1.INLINE_CHAT_ID);
                    ctrl?.focus();
                }
            },
            options: { type: "help" /* AccessibleViewType.Help */ }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjY2Vzc2liaWxpdHlIZWxwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0QWNjZXNzaWJpbGl0eUhlbHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsNERBaUNDO0lBVUQsZ0VBa0NDO0lBN0VELFNBQWdCLHdCQUF3QixDQUFDLFFBQTBCLEVBQUUsSUFBZ0M7UUFDcEcsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7UUFDM0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ25CLE1BQU0sNEJBQTRCLEdBQUcsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsOEJBQThCLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQztRQUN4SCxJQUFJLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSwySkFBMkosQ0FBQyxDQUFDLENBQUM7WUFDck0sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxnSkFBZ0osQ0FBQyxDQUFDLENBQUM7WUFDaE0sT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsd0VBQXdFLEVBQUUsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsd0tBQXdLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZZLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHVHQUF1RyxDQUFDLENBQUMsQ0FBQztZQUNq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