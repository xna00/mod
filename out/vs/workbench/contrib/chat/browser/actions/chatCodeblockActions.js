/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/clipboard/browser/clipboard", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, cancellation_1, codicons_1, editorBrowser_1, bulkEditService_1, codeEditorService_1, range_1, editorContextKeys_1, language_1, languageFeatures_1, clipboard_1, nls_1, actions_1, clipboardService_1, contextkey_1, terminal_1, accessibilityConfiguration_1, chatActions_1, chat_1, chatContextKeys_1, chatService_1, chatViewModel_1, cellOperations_1, notebookCommon_1, terminal_2, editorService_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCodeBlockActionContext = isCodeBlockActionContext;
    exports.registerChatCodeBlockActions = registerChatCodeBlockActions;
    function isCodeBlockActionContext(thing) {
        return typeof thing === 'object' && thing !== null && 'code' in thing && 'element' in thing;
    }
    function isResponseFiltered(context) {
        return (0, chatViewModel_1.isResponseVM)(context.element) && context.element.errorDetails?.responseIsFiltered;
    }
    function getUsedDocuments(context) {
        return (0, chatViewModel_1.isResponseVM)(context.element) ? context.element.usedContext?.documents : undefined;
    }
    class ChatCodeBlockAction extends actions_1.Action2 {
        run(accessor, ...args) {
            let context = args[0];
            if (!isCodeBlockActionContext(context)) {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
                if (!editor) {
                    return;
                }
                context = getContextFromEditor(editor, accessor);
                if (!isCodeBlockActionContext(context)) {
                    return;
                }
            }
            return this.runWithContext(accessor, context);
        }
    }
    function registerChatCodeBlockActions() {
        (0, actions_1.registerAction2)(class CopyCodeBlockAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.copyCodeBlock',
                    title: (0, nls_1.localize2)('interactive.copyCodeBlock.label', "Copy"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.copy,
                    menu: {
                        id: actions_1.MenuId.ChatCodeBlock,
                        group: 'navigation'
                    }
                });
            }
            run(accessor, ...args) {
                const context = args[0];
                if (!isCodeBlockActionContext(context) || isResponseFiltered(context)) {
                    return;
                }
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                clipboardService.writeText(context.code);
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    const chatService = accessor.get(chatService_1.IChatService);
                    chatService.notifyUserAction({
                        providerId: context.element.providerId,
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'copy',
                            codeBlockIndex: context.codeBlockIndex,
                            copyKind: chatService_1.ChatCopyKind.Toolbar,
                            copiedCharacters: context.code.length,
                            totalCharacters: context.code.length,
                            copiedText: context.code,
                        }
                    });
                }
            }
        });
        clipboard_1.CopyAction?.addImplementation(50000, 'chat-codeblock', (accessor) => {
            // get active code editor
            const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (!editor) {
                return false;
            }
            const editorModel = editor.getModel();
            if (!editorModel) {
                return false;
            }
            const context = getContextFromEditor(editor, accessor);
            if (!context) {
                return false;
            }
            const noSelection = editor.getSelections()?.length === 1 && editor.getSelection()?.isEmpty();
            const copiedText = noSelection ?
                editorModel.getValue() :
                editor.getSelections()?.reduce((acc, selection) => acc + editorModel.getValueInRange(selection), '') ?? '';
            const totalCharacters = editorModel.getValueLength();
            // Report copy to extensions
            const chatService = accessor.get(chatService_1.IChatService);
            const element = context.element;
            if (element) {
                chatService.notifyUserAction({
                    providerId: element.providerId,
                    agentId: element.agent?.id,
                    sessionId: element.sessionId,
                    requestId: element.requestId,
                    result: element.result,
                    action: {
                        kind: 'copy',
                        codeBlockIndex: context.codeBlockIndex,
                        copyKind: chatService_1.ChatCopyKind.Action,
                        copiedText,
                        copiedCharacters: copiedText.length,
                        totalCharacters,
                    }
                });
            }
            // Copy full cell if no selection, otherwise fall back on normal editor implementation
            if (noSelection) {
                accessor.get(clipboardService_1.IClipboardService).writeText(context.code);
                return true;
            }
            return false;
        });
        (0, actions_1.registerAction2)(class InsertCodeBlockAction extends ChatCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.insertCodeBlock',
                    title: (0, nls_1.localize2)('interactive.insertCodeBlock.label', "Insert at Cursor"),
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.insert,
                    menu: {
                        id: actions_1.MenuId.ChatCodeBlock,
                        group: 'navigation',
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION
                    },
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.negate()), accessibilityConfiguration_1.accessibleViewInCodeBlock),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */ },
                        weight: 400 /* KeybindingWeight.ExternalExtension */ + 1
                    },
                });
            }
            async runWithContext(accessor, context) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const textFileService = accessor.get(textfiles_1.ITextFileService);
                if (isResponseFiltered(context)) {
                    // When run from command palette
                    return;
                }
                if (editorService.activeEditorPane?.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
                    return this.handleNotebookEditor(accessor, editorService.activeEditorPane.getControl(), context);
                }
                let activeEditorControl = editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isDiffEditor)(activeEditorControl)) {
                    activeEditorControl = activeEditorControl.getOriginalEditor().hasTextFocus() ? activeEditorControl.getOriginalEditor() : activeEditorControl.getModifiedEditor();
                }
                if (!(0, editorBrowser_1.isCodeEditor)(activeEditorControl)) {
                    return;
                }
                const activeModel = activeEditorControl.getModel();
                if (!activeModel) {
                    return;
                }
                // Check if model is editable, currently only support untitled and text file
                const activeTextModel = textFileService.files.get(activeModel.uri) ?? textFileService.untitled.get(activeModel.uri);
                if (!activeTextModel || activeTextModel.isReadonly()) {
                    return;
                }
                await this.handleTextEditor(accessor, activeEditorControl, activeModel, context);
            }
            async handleNotebookEditor(accessor, notebookEditor, context) {
                if (!notebookEditor.hasModel()) {
                    return;
                }
                if (notebookEditor.isReadOnly) {
                    return;
                }
                if (notebookEditor.activeCodeEditor?.hasTextFocus()) {
                    const codeEditor = notebookEditor.activeCodeEditor;
                    const textModel = codeEditor.getModel();
                    if (textModel) {
                        return this.handleTextEditor(accessor, codeEditor, textModel, context);
                    }
                }
                const languageService = accessor.get(language_1.ILanguageService);
                const focusRange = notebookEditor.getFocus();
                const next = Math.max(focusRange.end - 1, 0);
                (0, cellOperations_1.insertCell)(languageService, notebookEditor, next, notebookCommon_1.CellKind.Code, 'below', context.code, true);
                this.notifyUserAction(accessor, context);
            }
            async handleTextEditor(accessor, codeEditor, activeModel, codeBlockActionContext) {
                this.notifyUserAction(accessor, codeBlockActionContext);
                const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const mappedEditsProviders = accessor.get(languageFeatures_1.ILanguageFeaturesService).mappedEditsProvider.ordered(activeModel);
                // try applying workspace edit that was returned by a MappedEditsProvider, else simply insert at selection
                let mappedEdits = null;
                if (mappedEditsProviders.length > 0) {
                    const mostRelevantProvider = mappedEditsProviders[0]; // TODO@ulugbekna: should we try all providers?
                    // 0th sub-array - editor selections array if there are any selections
                    // 1st sub-array - array with documents used to get the chat reply
                    const docRefs = [];
                    if (codeEditor.hasModel()) {
                        const model = codeEditor.getModel();
                        const currentDocUri = model.uri;
                        const currentDocVersion = model.getVersionId();
                        const selections = codeEditor.getSelections();
                        if (selections.length > 0) {
                            docRefs.push([
                                {
                                    uri: currentDocUri,
                                    version: currentDocVersion,
                                    ranges: selections,
                                }
                            ]);
                        }
                    }
                    const usedDocuments = getUsedDocuments(codeBlockActionContext);
                    if (usedDocuments) {
                        docRefs.push(usedDocuments);
                    }
                    const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                    mappedEdits = await mostRelevantProvider.provideMappedEdits(activeModel, [codeBlockActionContext.code], { documents: docRefs }, cancellationTokenSource.token);
                }
                if (mappedEdits) {
                    await bulkEditService.apply(mappedEdits);
                }
                else {
                    const activeSelection = codeEditor.getSelection() ?? new range_1.Range(activeModel.getLineCount(), 1, activeModel.getLineCount(), 1);
                    await bulkEditService.apply([
                        new bulkEditService_1.ResourceTextEdit(activeModel.uri, {
                            range: activeSelection,
                            text: codeBlockActionContext.code,
                        }),
                    ]);
                }
                codeEditorService.listCodeEditors().find(editor => editor.getModel()?.uri.toString() === activeModel.uri.toString())?.focus();
            }
            notifyUserAction(accessor, context) {
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    const chatService = accessor.get(chatService_1.IChatService);
                    chatService.notifyUserAction({
                        providerId: context.element.providerId,
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'insert',
                            codeBlockIndex: context.codeBlockIndex,
                            totalCharacters: context.code.length,
                        }
                    });
                }
            }
        });
        (0, actions_1.registerAction2)(class InsertIntoNewFileAction extends ChatCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.insertIntoNewFile',
                    title: (0, nls_1.localize2)('interactive.insertIntoNewFile.label', "Insert into New File"),
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.newFile,
                    menu: {
                        id: actions_1.MenuId.ChatCodeBlock,
                        group: 'navigation',
                        isHiddenByDefault: true
                    }
                });
            }
            async runWithContext(accessor, context) {
                if (isResponseFiltered(context)) {
                    // When run from command palette
                    return;
                }
                const editorService = accessor.get(editorService_1.IEditorService);
                const chatService = accessor.get(chatService_1.IChatService);
                editorService.openEditor({ contents: context.code, languageId: context.languageId, resource: undefined });
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    chatService.notifyUserAction({
                        providerId: context.element.providerId,
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'insert',
                            codeBlockIndex: context.codeBlockIndex,
                            totalCharacters: context.code.length,
                            newFile: true
                        }
                    });
                }
            }
        });
        const shellLangIds = [
            'fish',
            'ps1',
            'pwsh',
            'powershell',
            'sh',
            'shellscript',
            'zsh'
        ];
        (0, actions_1.registerAction2)(class RunInTerminalAction extends ChatCodeBlockAction {
            constructor() {
                super({
                    id: 'workbench.action.chat.runInTerminal',
                    title: (0, nls_1.localize2)('interactive.runInTerminal.label', "Insert into Terminal"),
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.terminal,
                    menu: [{
                            id: actions_1.MenuId.ChatCodeBlock,
                            group: 'navigation',
                            when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, contextkey_1.ContextKeyExpr.or(...shellLangIds.map(e => contextkey_1.ContextKeyExpr.equals(editorContextKeys_1.EditorContextKeys.languageId.key, e)))),
                        },
                        {
                            id: actions_1.MenuId.ChatCodeBlock,
                            group: 'navigation',
                            isHiddenByDefault: true,
                            when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, ...shellLangIds.map(e => contextkey_1.ContextKeyExpr.notEquals(editorContextKeys_1.EditorContextKeys.languageId.key, e)))
                        }],
                    keybinding: [{
                            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                            mac: {
                                primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                            },
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: contextkey_1.ContextKeyExpr.or(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, accessibilityConfiguration_1.accessibleViewInCodeBlock),
                        }]
                });
            }
            async runWithContext(accessor, context) {
                if (isResponseFiltered(context)) {
                    // When run from command palette
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const terminalEditorService = accessor.get(terminal_2.ITerminalEditorService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                let terminal = await terminalService.getActiveOrCreateInstance();
                // isFeatureTerminal = debug terminal or task terminal
                const unusableTerminal = terminal.xterm?.isStdinDisabled || terminal.shellLaunchConfig.isFeatureTerminal;
                terminal = unusableTerminal ? await terminalService.createTerminal() : terminal;
                terminalService.setActiveInstance(terminal);
                await terminal.focusWhenReady(true);
                if (terminal.target === terminal_1.TerminalLocation.Editor) {
                    const existingEditors = editorService.findEditors(terminal.resource);
                    terminalEditorService.openEditor(terminal, { viewColumn: existingEditors?.[0].groupId });
                }
                else {
                    terminalGroupService.showPanel(true);
                }
                terminal.runCommand(context.code, false);
                if ((0, chatViewModel_1.isResponseVM)(context.element)) {
                    chatService.notifyUserAction({
                        providerId: context.element.providerId,
                        agentId: context.element.agent?.id,
                        sessionId: context.element.sessionId,
                        requestId: context.element.requestId,
                        result: context.element.result,
                        action: {
                            kind: 'runInTerminal',
                            codeBlockIndex: context.codeBlockIndex,
                            languageId: context.languageId,
                        }
                    });
                }
            }
        });
        function navigateCodeBlocks(accessor, reverse) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = chatWidgetService.lastFocusedWidget;
            if (!widget) {
                return;
            }
            const editor = codeEditorService.getFocusedCodeEditor();
            const editorUri = editor?.getModel()?.uri;
            const curCodeBlockInfo = editorUri ? widget.getCodeBlockInfoForEditor(editorUri) : undefined;
            const focused = !widget.inputEditor.hasWidgetFocus() && widget.getFocus();
            const focusedResponse = (0, chatViewModel_1.isResponseVM)(focused) ? focused : undefined;
            const currentResponse = curCodeBlockInfo ?
                curCodeBlockInfo.element :
                (focusedResponse ?? widget.viewModel?.getItems().reverse().find((item) => (0, chatViewModel_1.isResponseVM)(item)));
            if (!currentResponse) {
                return;
            }
            widget.reveal(currentResponse);
            const responseCodeblocks = widget.getCodeBlockInfosForResponse(currentResponse);
            const focusIdx = curCodeBlockInfo ?
                (curCodeBlockInfo.codeBlockIndex + (reverse ? -1 : 1) + responseCodeblocks.length) % responseCodeblocks.length :
                reverse ? responseCodeblocks.length - 1 : 0;
            responseCodeblocks[focusIdx]?.focus();
        }
        (0, actions_1.registerAction2)(class NextCodeBlockAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.nextCodeBlock',
                    title: (0, nls_1.localize2)('interactive.nextCodeBlock.label', "Next Code Block"),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION,
                    },
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                });
            }
            run(accessor, ...args) {
                navigateCodeBlocks(accessor);
            }
        });
        (0, actions_1.registerAction2)(class PreviousCodeBlockAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.previousCodeBlock',
                    title: (0, nls_1.localize2)('interactive.previousCodeBlock.label', "Previous Code Block"),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION,
                    },
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                });
            }
            run(accessor, ...args) {
                navigateCodeBlocks(accessor, true);
            }
        });
    }
    function getContextFromEditor(editor, accessor) {
        const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
        const chatCodeBlockContextProviderService = accessor.get(chat_1.IChatCodeBlockContextProviderService);
        const model = editor.getModel();
        if (!model) {
            return;
        }
        const widget = chatWidgetService.lastFocusedWidget;
        const codeBlockInfo = widget?.getCodeBlockInfoForEditor(model.uri);
        if (!codeBlockInfo) {
            for (const provider of chatCodeBlockContextProviderService.providers) {
                const context = provider.getCodeBlockContext(editor);
                if (context) {
                    return context;
                }
            }
            return;
        }
        return {
            element: codeBlockInfo.element,
            codeBlockIndex: codeBlockInfo.codeBlockIndex,
            code: editor.getValue(),
            languageId: editor.getModel().getLanguageId(),
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENvZGVibG9ja0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9hY3Rpb25zL2NoYXRDb2RlYmxvY2tBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeUNoRyw0REFFQztJQWdDRCxvRUE2ZEM7SUEvZkQsU0FBZ0Isd0JBQXdCLENBQUMsS0FBYztRQUN0RCxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLE1BQU0sSUFBSSxLQUFLLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQztJQUM3RixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxPQUFnQztRQUMzRCxPQUFPLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUM7SUFDMUYsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBZ0M7UUFDekQsT0FBTyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUMzRixDQUFDO0lBRUQsTUFBZSxtQkFBb0IsU0FBUSxpQkFBTztRQUNqRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDN0MsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NB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