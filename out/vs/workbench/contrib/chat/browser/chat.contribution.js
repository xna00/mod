/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/accessibility/browser/accessibilityContributions", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatClearActions", "vs/workbench/contrib/chat/browser/actions/chatCodeblockActions", "vs/workbench/contrib/chat/browser/actions/chatCopyActions", "vs/workbench/contrib/chat/browser/actions/chatExecuteActions", "vs/workbench/contrib/chat/browser/actions/chatFileTreeActions", "vs/workbench/contrib/chat/browser/actions/chatImportExport", "vs/workbench/contrib/chat/browser/actions/chatMoveActions", "vs/workbench/contrib/chat/browser/actions/chatQuickInputActions", "vs/workbench/contrib/chat/browser/actions/chatTitleActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatAccessibilityService", "vs/workbench/contrib/chat/browser/chatContributionServiceImpl", "vs/workbench/contrib/chat/browser/chatEditor", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/browser/chatQuick", "vs/workbench/contrib/chat/browser/chatVariables", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/contrib/chat/common/languageModels", "vs/workbench/contrib/chat/common/voiceChat", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/contrib/chat/browser/codeBlockContextProviderService", "vs/workbench/contrib/chat/browser/contrib/chatHistoryVariables", "vs/workbench/contrib/chat/browser/contrib/chatInputEditorContrib", "../common/chatColors"], function (require, exports, htmlContent_1, lifecycle_1, network_1, platform_1, codeEditorService_1, nls, commands_1, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_2, editor_1, contributions_1, editor_2, accessibilityContributions_1, accessibleView_1, accessibleViewActions_1, chatActions_1, chatClearActions_1, chatCodeblockActions_1, chatCopyActions_1, chatExecuteActions_1, chatFileTreeActions_1, chatImportExport_1, chatMoveActions_1, chatQuickInputActions_1, chatTitleActions_1, chat_1, chatAccessibilityService_1, chatContributionServiceImpl_1, chatEditor_1, chatEditorInput_1, chatQuick_1, chatVariables_1, chatWidget_1, chatAgents_1, chatContextKeys_1, chatContributionService_1, chatModel_1, chatParserTypes_1, chatService_1, chatServiceImpl_1, chatSlashCommands_1, chatVariables_2, chatViewModel_1, chatWidgetHistoryService_1, languageModels_1, voiceChat_1, editorResolverService_1, codeBlockContextProviderService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register configuration
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'chatSidebar',
        title: nls.localize('interactiveSessionConfigurationTitle', "Chat"),
        type: 'object',
        properties: {
            'chat.editor.fontSize': {
                type: 'number',
                description: nls.localize('interactiveSession.editor.fontSize', "Controls the font size in pixels in chat codeblocks."),
                default: platform_1.isMacintosh ? 12 : 14,
            },
            'chat.editor.fontFamily': {
                type: 'string',
                description: nls.localize('interactiveSession.editor.fontFamily', "Controls the font family in chat codeblocks."),
                default: 'default'
            },
            'chat.editor.fontWeight': {
                type: 'string',
                description: nls.localize('interactiveSession.editor.fontWeight', "Controls the font weight in chat codeblocks."),
                default: 'default'
            },
            'chat.editor.wordWrap': {
                type: 'string',
                description: nls.localize('interactiveSession.editor.wordWrap', "Controls whether lines should wrap in chat codeblocks."),
                default: 'off',
                enum: ['on', 'off']
            },
            'chat.editor.lineHeight': {
                type: 'number',
                description: nls.localize('interactiveSession.editor.lineHeight', "Controls the line height in pixels in chat codeblocks. Use 0 to compute the line height from the font size."),
                default: 0
            },
            'chat.experimental.implicitContext': {
                type: 'boolean',
                description: nls.localize('chat.experimental.implicitContext', "Controls whether a checkbox is shown to allow the user to determine which implicit context is included with a chat participant's prompt."),
                default: false
            },
        }
    });
    platform_2.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(chatEditor_1.ChatEditor, chatEditorInput_1.ChatEditorInput.EditorID, nls.localize('chat', "Chat")), [
        new descriptors_1.SyncDescriptor(chatEditorInput_1.ChatEditorInput)
    ]);
    let ChatResolverContribution = class ChatResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.chatResolver'; }
        constructor(editorResolverService, instantiationService) {
            super();
            this._register(editorResolverService.registerEditor(`${network_1.Schemas.vscodeChatSesssion}:**/**`, {
                id: chatEditorInput_1.ChatEditorInput.EditorID,
                label: nls.localize('chat', "Chat"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {
                singlePerResource: true,
                canSupportResource: resource => resource.scheme === network_1.Schemas.vscodeChatSesssion
            }, {
                createEditorInput: ({ resource, options }) => {
                    return { editor: instantiationService.createInstance(chatEditorInput_1.ChatEditorInput, resource, options), options };
                }
            }));
        }
    };
    ChatResolverContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], ChatResolverContribution);
    class ChatAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(100, 'panelChat', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                return renderAccessibleView(accessibleViewService, widgetService, codeEditorService, true);
                function renderAccessibleView(accessibleViewService, widgetService, codeEditorService, initialRender) {
                    const widget = widgetService.lastFocusedWidget;
                    if (!widget) {
                        return false;
                    }
                    const chatInputFocused = initialRender && !!codeEditorService.getFocusedCodeEditor();
                    if (initialRender && chatInputFocused) {
                        widget.focusLastMessage();
                    }
                    if (!widget) {
                        return false;
                    }
                    const verifiedWidget = widget;
                    const focusedItem = verifiedWidget.getFocus();
                    if (!focusedItem) {
                        return false;
                    }
                    widget.focus(focusedItem);
                    const isWelcome = focusedItem instanceof chatModel_1.ChatWelcomeMessageModel;
                    let responseContent = (0, chatViewModel_1.isResponseVM)(focusedItem) ? focusedItem.response.asString() : undefined;
                    if (isWelcome) {
                        const welcomeReplyContents = [];
                        for (const content of focusedItem.content) {
                            if (Array.isArray(content)) {
                                welcomeReplyContents.push(...content.map(m => m.message));
                            }
                            else {
                                welcomeReplyContents.push(content.value);
                            }
                        }
                        responseContent = welcomeReplyContents.join('\n');
                    }
                    if (!responseContent && 'errorDetails' in focusedItem && focusedItem.errorDetails) {
                        responseContent = focusedItem.errorDetails.message;
                    }
                    if (!responseContent) {
                        return false;
                    }
                    const responses = verifiedWidget.viewModel?.getItems().filter(i => (0, chatViewModel_1.isResponseVM)(i));
                    const length = responses?.length;
                    const responseIndex = responses?.findIndex(i => i === focusedItem);
                    accessibleViewService.show({
                        id: "panelChat" /* AccessibleViewProviderId.Chat */,
                        verbositySettingKey: "accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */,
                        provideContent() { return responseContent; },
                        onClose() {
                            verifiedWidget.reveal(focusedItem);
                            if (chatInputFocused) {
                                verifiedWidget.focusInput();
                            }
                            else {
                                verifiedWidget.focus(focusedItem);
                            }
                        },
                        next() {
                            verifiedWidget.moveFocus(focusedItem, 'next');
                            (0, accessibilityContributions_1.alertFocusChange)(responseIndex, length, 'next');
                            renderAccessibleView(accessibleViewService, widgetService, codeEditorService);
                        },
                        previous() {
                            verifiedWidget.moveFocus(focusedItem, 'previous');
                            (0, accessibilityContributions_1.alertFocusChange)(responseIndex, length, 'previous');
                            renderAccessibleView(accessibleViewService, widgetService, codeEditorService);
                        },
                        options: { type: "view" /* AccessibleViewType.View */ }
                    });
                    return true;
                }
            }, chatContextKeys_1.CONTEXT_IN_CHAT_SESSION));
        }
    }
    let ChatSlashStaticSlashCommandsContribution = class ChatSlashStaticSlashCommandsContribution extends lifecycle_1.Disposable {
        constructor(slashCommandService, commandService, chatAgentService, chatVariablesService) {
            super();
            this._store.add(slashCommandService.registerSlashCommand({
                command: 'clear',
                detail: nls.localize('clear', "Start a new chat"),
                sortText: 'z2_clear',
                executeImmediately: true
            }, async () => {
                commandService.executeCommand(chatClearActions_1.ACTION_ID_NEW_CHAT);
            }));
            this._store.add(slashCommandService.registerSlashCommand({
                command: 'help',
                detail: '',
                sortText: 'z1_help',
                executeImmediately: true
            }, async (prompt, progress) => {
                const defaultAgent = chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
                const agents = chatAgentService.getAgents();
                // Report prefix
                if (defaultAgent?.metadata.helpTextPrefix) {
                    if ((0, htmlContent_1.isMarkdownString)(defaultAgent.metadata.helpTextPrefix)) {
                        progress.report({ content: defaultAgent.metadata.helpTextPrefix, kind: 'markdownContent' });
                    }
                    else {
                        progress.report({ content: defaultAgent.metadata.helpTextPrefix, kind: 'content' });
                    }
                    progress.report({ content: '\n\n', kind: 'content' });
                }
                // Report agent list
                const agentText = (await Promise.all(agents
                    .filter(a => a.id !== defaultAgent?.id)
                    .map(async (a) => {
                    const agentWithLeader = `${chatParserTypes_1.chatAgentLeader}${a.name}`;
                    const actionArg = { inputValue: `${agentWithLeader} ${a.metadata.sampleRequest}` };
                    const urlSafeArg = encodeURIComponent(JSON.stringify(actionArg));
                    const agentLine = `* [\`${agentWithLeader}\`](command:${chatExecuteActions_1.SubmitAction.ID}?${urlSafeArg}) - ${a.description}`;
                    const commandText = a.slashCommands.map(c => {
                        const actionArg = { inputValue: `${agentWithLeader} ${chatParserTypes_1.chatSubcommandLeader}${c.name} ${c.sampleRequest ?? ''}` };
                        const urlSafeArg = encodeURIComponent(JSON.stringify(actionArg));
                        return `\t* [\`${chatParserTypes_1.chatSubcommandLeader}${c.name}\`](command:${chatExecuteActions_1.SubmitAction.ID}?${urlSafeArg}) - ${c.description}`;
                    }).join('\n');
                    return (agentLine + '\n' + commandText).trim();
                }))).join('\n');
                progress.report({ content: new htmlContent_1.MarkdownString(agentText, { isTrusted: { enabledCommands: [chatExecuteActions_1.SubmitAction.ID] } }), kind: 'markdownContent' });
                // Report variables
                if (defaultAgent?.metadata.helpTextVariablesPrefix) {
                    progress.report({ content: '\n\n', kind: 'content' });
                    if ((0, htmlContent_1.isMarkdownString)(defaultAgent.metadata.helpTextVariablesPrefix)) {
                        progress.report({ content: defaultAgent.metadata.helpTextVariablesPrefix, kind: 'markdownContent' });
                    }
                    else {
                        progress.report({ content: defaultAgent.metadata.helpTextVariablesPrefix, kind: 'content' });
                    }
                    const variableText = Array.from(chatVariablesService.getVariables())
                        .map(v => `* \`${chatParserTypes_1.chatVariableLeader}${v.name}\` - ${v.description}`)
                        .join('\n');
                    progress.report({ content: '\n' + variableText, kind: 'content' });
                }
                // Report help text ending
                if (defaultAgent?.metadata.helpTextPostfix) {
                    progress.report({ content: '\n\n', kind: 'content' });
                    if ((0, htmlContent_1.isMarkdownString)(defaultAgent.metadata.helpTextPostfix)) {
                        progress.report({ content: defaultAgent.metadata.helpTextPostfix, kind: 'markdownContent' });
                    }
                    else {
                        progress.report({ content: defaultAgent.metadata.helpTextPostfix, kind: 'content' });
                    }
                }
            }));
        }
    };
    ChatSlashStaticSlashCommandsContribution = __decorate([
        __param(0, chatSlashCommands_1.IChatSlashCommandService),
        __param(1, commands_1.ICommandService),
        __param(2, chatAgents_1.IChatAgentService),
        __param(3, chatVariables_2.IChatVariablesService)
    ], ChatSlashStaticSlashCommandsContribution);
    const workbenchContributionsRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(ChatResolverContribution.ID, ChatResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ChatAccessibleViewContribution, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ChatSlashStaticSlashCommandsContribution, 4 /* LifecyclePhase.Eventually */);
    platform_2.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(chatEditorInput_1.ChatEditorInput.TypeID, chatEditorInput_1.ChatEditorInputSerializer);
    (0, chatActions_1.registerChatActions)();
    (0, chatCopyActions_1.registerChatCopyActions)();
    (0, chatCodeblockActions_1.registerChatCodeBlockActions)();
    (0, chatFileTreeActions_1.registerChatFileTreeActions)();
    (0, chatTitleActions_1.registerChatTitleActions)();
    (0, chatExecuteActions_1.registerChatExecuteActions)();
    (0, chatQuickInputActions_1.registerQuickChatActions)();
    (0, chatImportExport_1.registerChatExportActions)();
    (0, chatMoveActions_1.registerMoveActions)();
    (0, chatClearActions_1.registerNewChatActions)();
    (0, extensions_1.registerSingleton)(chatService_1.IChatService, chatServiceImpl_1.ChatService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatContributionService_1.IChatContributionService, chatContributionServiceImpl_1.ChatContributionService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IChatWidgetService, chatWidget_1.ChatWidgetService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IQuickChatService, chatQuick_1.QuickChatService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IChatAccessibilityService, chatAccessibilityService_1.ChatAccessibilityService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatWidgetHistoryService_1.IChatWidgetHistoryService, chatWidgetHistoryService_1.ChatWidgetHistoryService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(languageModels_1.ILanguageModelsService, languageModels_1.LanguageModelsService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatSlashCommands_1.IChatSlashCommandService, chatSlashCommands_1.ChatSlashCommandService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatAgents_1.IChatAgentService, chatAgents_1.ChatAgentService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatVariables_2.IChatVariablesService, chatVariables_1.ChatVariablesService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(voiceChat_1.IVoiceChatService, voiceChat_1.VoiceChatService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IChatCodeBlockContextProviderService, codeBlockContextProviderService_1.ChatCodeBlockContextProviderService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQTJEaEcseUJBQXlCO0lBQ3pCLE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3pHLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDO1FBQzNDLEVBQUUsRUFBRSxhQUFhO1FBQ2pCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNDQUFzQyxFQUFFLE1BQU0sQ0FBQztRQUNuRSxJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNYLHNCQUFzQixFQUFFO2dCQUN2QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQ0FBb0MsRUFBRSxzREFBc0QsQ0FBQztnQkFDdkgsT0FBTyxFQUFFLHNCQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTthQUM5QjtZQUNELHdCQUF3QixFQUFFO2dCQUN6QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSw4Q0FBOEMsQ0FBQztnQkFDakgsT0FBTyxFQUFFLFNBQVM7YUFDbEI7WUFDRCx3QkFBd0IsRUFBRTtnQkFDekIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0NBQXNDLEVBQUUsOENBQThDLENBQUM7Z0JBQ2pILE9BQU8sRUFBRSxTQUFTO2FBQ2xCO1lBQ0Qsc0JBQXNCLEVB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