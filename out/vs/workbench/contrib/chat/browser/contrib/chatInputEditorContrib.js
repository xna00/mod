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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/core/wordHelper", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/contrib/chat/browser/actions/chatExecuteActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/browser/contrib/chatDynamicVariables", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatColors", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, htmlContent_1, lifecycle_1, codeEditorService_1, range_1, wordHelper_1, languageFeatures_1, nls_1, actions_1, instantiation_1, platform_1, colorRegistry_1, themeService_1, contributions_1, chatExecuteActions_1, chat_1, chatInputPart_1, chatWidget_1, chatDynamicVariables_1, chatAgents_1, chatColors_1, chatParserTypes_1, chatRequestParser_1, chatSlashCommands_1, chatVariables_1) {
    "use strict";
    var BuiltinDynamicCompletions_1, VariableCompletions_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const decorationDescription = 'chat';
    const placeholderDecorationType = 'chat-session-detail';
    const slashCommandTextDecorationType = 'chat-session-text';
    const variableTextDecorationType = 'chat-variable-text';
    function agentAndCommandToKey(agent, subcommand) {
        return subcommand ? `${agent.id}__${subcommand}` : agent.id;
    }
    let InputEditorDecorations = class InputEditorDecorations extends lifecycle_1.Disposable {
        constructor(widget, codeEditorService, themeService, chatAgentService) {
            super();
            this.widget = widget;
            this.codeEditorService = codeEditorService;
            this.themeService = themeService;
            this.chatAgentService = chatAgentService;
            this.id = 'inputEditorDecorations';
            this.previouslyUsedAgents = new Set();
            this.viewModelDisposables = this._register(new lifecycle_1.MutableDisposable());
            this.codeEditorService.registerDecorationType(decorationDescription, placeholderDecorationType, {});
            this._register(this.themeService.onDidColorThemeChange(() => this.updateRegisteredDecorationTypes()));
            this.updateRegisteredDecorationTypes();
            this.updateInputEditorDecorations();
            this._register(this.widget.inputEditor.onDidChangeModelContent(() => this.updateInputEditorDecorations()));
            this._register(this.widget.onDidChangeParsedInput(() => this.updateInputEditorDecorations()));
            this._register(this.widget.onDidChangeViewModel(() => {
                this.registerViewModelListeners();
                this.previouslyUsedAgents.clear();
                this.updateInputEditorDecorations();
            }));
            this._register(this.widget.onDidSubmitAgent((e) => {
                this.previouslyUsedAgents.add(agentAndCommandToKey(e.agent, e.slashCommand?.name));
            }));
            this._register(this.chatAgentService.onDidChangeAgents(() => this.updateInputEditorDecorations()));
            this.registerViewModelListeners();
        }
        registerViewModelListeners() {
            this.viewModelDisposables.value = this.widget.viewModel?.onDidChange(e => {
                if (e?.kind === 'changePlaceholder' || e?.kind === 'initialize') {
                    this.updateInputEditorDecorations();
                }
            });
        }
        updateRegisteredDecorationTypes() {
            this.codeEditorService.removeDecorationType(variableTextDecorationType);
            this.codeEditorService.removeDecorationType(chatDynamicVariables_1.dynamicVariableDecorationType);
            this.codeEditorService.removeDecorationType(slashCommandTextDecorationType);
            const theme = this.themeService.getColorTheme();
            this.codeEditorService.registerDecorationType(decorationDescription, slashCommandTextDecorationType, {
                color: theme.getColor(chatColors_1.chatSlashCommandForeground)?.toString(),
                backgroundColor: theme.getColor(chatColors_1.chatSlashCommandBackground)?.toString(),
                borderRadius: '3px'
            });
            this.codeEditorService.registerDecorationType(decorationDescription, variableTextDecorationType, {
                color: theme.getColor(chatColors_1.chatSlashCommandForeground)?.toString(),
                backgroundColor: theme.getColor(chatColors_1.chatSlashCommandBackground)?.toString(),
                borderRadius: '3px'
            });
            this.codeEditorService.registerDecorationType(decorationDescription, chatDynamicVariables_1.dynamicVariableDecorationType, {
                color: theme.getColor(chatColors_1.chatSlashCommandForeground)?.toString(),
                backgroundColor: theme.getColor(chatColors_1.chatSlashCommandBackground)?.toString(),
                borderRadius: '3px'
            });
            this.updateInputEditorDecorations();
        }
        getPlaceholderColor() {
            const theme = this.themeService.getColorTheme();
            const transparentForeground = theme.getColor(colorRegistry_1.inputPlaceholderForeground);
            return transparentForeground?.toString();
        }
        async updateInputEditorDecorations() {
            const inputValue = this.widget.inputEditor.getValue();
            const viewModel = this.widget.viewModel;
            if (!viewModel) {
                return;
            }
            if (!inputValue) {
                const defaultAgent = this.chatAgentService.getDefaultAgent(this.widget.location);
                const decoration = [
                    {
                        range: {
                            startLineNumber: 1,
                            endLineNumber: 1,
                            startColumn: 1,
                            endColumn: 1000
                        },
                        renderOptions: {
                            after: {
                                contentText: viewModel.inputPlaceholder ?? defaultAgent?.description ?? '',
                                color: this.getPlaceholderColor()
                            }
                        }
                    }
                ];
                this.widget.inputEditor.setDecorationsByType(decorationDescription, placeholderDecorationType, decoration);
                return;
            }
            const parsedRequest = this.widget.parsedInput.parts;
            let placeholderDecoration;
            const agentPart = parsedRequest.find((p) => p instanceof chatParserTypes_1.ChatRequestAgentPart);
            const agentSubcommandPart = parsedRequest.find((p) => p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            const slashCommandPart = parsedRequest.find((p) => p instanceof chatParserTypes_1.ChatRequestSlashCommandPart);
            const exactlyOneSpaceAfterPart = (part) => {
                const partIdx = parsedRequest.indexOf(part);
                if (parsedRequest.length > partIdx + 2) {
                    return false;
                }
                const nextPart = parsedRequest[partIdx + 1];
                return nextPart && nextPart instanceof chatParserTypes_1.ChatRequestTextPart && nextPart.text === ' ';
            };
            const getRangeForPlaceholder = (part) => ({
                startLineNumber: part.editorRange.startLineNumber,
                endLineNumber: part.editorRange.endLineNumber,
                startColumn: part.editorRange.endColumn + 1,
                endColumn: 1000
            });
            const onlyAgentAndWhitespace = agentPart && parsedRequest.every(p => p instanceof chatParserTypes_1.ChatRequestTextPart && !p.text.trim().length || p instanceof chatParserTypes_1.ChatRequestAgentPart);
            if (onlyAgentAndWhitespace) {
                // Agent reference with no other text - show the placeholder
                const isFollowupSlashCommand = this.previouslyUsedAgents.has(agentAndCommandToKey(agentPart.agent, undefined));
                const shouldRenderFollowupPlaceholder = isFollowupSlashCommand && agentPart.agent.metadata.followupPlaceholder;
                if (agentPart.agent.description && exactlyOneSpaceAfterPart(agentPart)) {
                    placeholderDecoration = [{
                            range: getRangeForPlaceholder(agentPart),
                            renderOptions: {
                                after: {
                                    contentText: shouldRenderFollowupPlaceholder ? agentPart.agent.metadata.followupPlaceholder : agentPart.agent.description,
                                    color: this.getPlaceholderColor(),
                                }
                            }
                        }];
                }
            }
            const onlyAgentCommandAndWhitespace = agentPart && agentSubcommandPart && parsedRequest.every(p => p instanceof chatParserTypes_1.ChatRequestTextPart && !p.text.trim().length || p instanceof chatParserTypes_1.ChatRequestAgentPart || p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            if (onlyAgentCommandAndWhitespace) {
                // Agent reference and subcommand with no other text - show the placeholder
                const isFollowupSlashCommand = this.previouslyUsedAgents.has(agentAndCommandToKey(agentPart.agent, agentSubcommandPart.command.name));
                const shouldRenderFollowupPlaceholder = isFollowupSlashCommand && agentSubcommandPart.command.followupPlaceholder;
                if (agentSubcommandPart?.command.description && exactlyOneSpaceAfterPart(agentSubcommandPart)) {
                    placeholderDecoration = [{
                            range: getRangeForPlaceholder(agentSubcommandPart),
                            renderOptions: {
                                after: {
                                    contentText: shouldRenderFollowupPlaceholder ? agentSubcommandPart.command.followupPlaceholder : agentSubcommandPart.command.description,
                                    color: this.getPlaceholderColor(),
                                }
                            }
                        }];
                }
            }
            this.widget.inputEditor.setDecorationsByType(decorationDescription, placeholderDecorationType, placeholderDecoration ?? []);
            const textDecorations = [];
            if (agentPart) {
                const isDupe = !!this.chatAgentService.getAgents().find(other => other.name === agentPart.agent.name && other.id !== agentPart.agent.id);
                const id = isDupe ? `(${agentPart.agent.id}) ` : '';
                const agentHover = `${id}${agentPart.agent.description}`;
                textDecorations.push({ range: agentPart.editorRange, hoverMessage: new htmlContent_1.MarkdownString(agentHover) });
                if (agentSubcommandPart) {
                    textDecorations.push({ range: agentSubcommandPart.editorRange, hoverMessage: new htmlContent_1.MarkdownString(agentSubcommandPart.command.description) });
                }
            }
            if (slashCommandPart) {
                textDecorations.push({ range: slashCommandPart.editorRange });
            }
            this.widget.inputEditor.setDecorationsByType(decorationDescription, slashCommandTextDecorationType, textDecorations);
            const varDecorations = [];
            const variableParts = parsedRequest.filter((p) => p instanceof chatParserTypes_1.ChatRequestVariablePart);
            for (const variable of variableParts) {
                varDecorations.push({ range: variable.editorRange });
            }
            this.widget.inputEditor.setDecorationsByType(decorationDescription, variableTextDecorationType, varDecorations);
        }
    };
    InputEditorDecorations = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, themeService_1.IThemeService),
        __param(3, chatAgents_1.IChatAgentService)
    ], InputEditorDecorations);
    class InputEditorSlashCommandMode extends lifecycle_1.Disposable {
        constructor(widget) {
            super();
            this.widget = widget;
            this.id = 'InputEditorSlashCommandMode';
            this._register(this.widget.onDidSubmitAgent(e => {
                this.repopulateAgentCommand(e.agent, e.slashCommand);
            }));
        }
        async repopulateAgentCommand(agent, slashCommand) {
            let value;
            if (slashCommand && slashCommand.isSticky) {
                value = `${chatParserTypes_1.chatAgentLeader}${agent.name} ${chatParserTypes_1.chatSubcommandLeader}${slashCommand.name} `;
            }
            else if (agent.metadata.isSticky) {
                value = `${chatParserTypes_1.chatAgentLeader}${agent.name} `;
            }
            if (value) {
                this.widget.inputEditor.setValue(value);
                this.widget.inputEditor.setPosition({ lineNumber: 1, column: value.length + 1 });
            }
        }
    }
    chatWidget_1.ChatWidget.CONTRIBS.push(InputEditorDecorations, InputEditorSlashCommandMode);
    let SlashCommandCompletions = class SlashCommandCompletions extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, chatWidgetService, chatSlashCommandService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this.chatSlashCommandService = chatSlashCommandService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'globalSlashCommands',
                triggerCharacters: ['/'],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const range = computeCompletionRanges(model, position, /\/\w*/g);
                    if (!range) {
                        return null;
                    }
                    const parsedRequest = widget.parsedInput.parts;
                    const usedAgent = parsedRequest.find(p => p instanceof chatParserTypes_1.ChatRequestAgentPart);
                    if (usedAgent) {
                        // No (classic) global slash commands when an agent is used
                        return;
                    }
                    const slashCommands = this.chatSlashCommandService.getCommands();
                    if (!slashCommands) {
                        return null;
                    }
                    return {
                        suggestions: slashCommands.map((c, i) => {
                            const withSlash = `/${c.command}`;
                            return {
                                label: withSlash,
                                insertText: c.executeImmediately ? '' : `${withSlash} `,
                                detail: c.detail,
                                range: new range_1.Range(1, 1, 1, 1),
                                sortText: c.sortText ?? 'a'.repeat(i + 1),
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway,
                                command: c.executeImmediately ? { id: chatExecuteActions_1.SubmitAction.ID, title: withSlash, arguments: [{ widget, inputValue: `${withSlash} ` }] } : undefined,
                            };
                        })
                    };
                }
            }));
        }
    };
    SlashCommandCompletions = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService),
        __param(2, chatSlashCommands_1.IChatSlashCommandService)
    ], SlashCommandCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(SlashCommandCompletions, 4 /* LifecyclePhase.Eventually */);
    let AgentCompletions = class AgentCompletions extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, chatWidgetService, chatAgentService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this.chatAgentService = chatAgentService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgent',
                triggerCharacters: ['@'],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const parsedRequest = widget.parsedInput.parts;
                    const usedAgent = parsedRequest.find(p => p instanceof chatParserTypes_1.ChatRequestAgentPart);
                    if (usedAgent && !range_1.Range.containsPosition(usedAgent.editorRange, position)) {
                        // Only one agent allowed
                        return;
                    }
                    const range = computeCompletionRanges(model, position, /@\w*/g);
                    if (!range) {
                        return null;
                    }
                    const agents = this.chatAgentService.getAgents()
                        .filter(a => !a.isDefault)
                        .filter(a => a.locations.includes(widget.location));
                    return {
                        suggestions: agents.map((a, i) => {
                            const withAt = `@${a.name}`;
                            const isDupe = !!agents.find(other => other.name === a.name && other.id !== a.id);
                            return {
                                // Leading space is important because detail has no space at the start by design
                                label: isDupe ?
                                    { label: withAt, description: a.description, detail: ` (${a.id})` } :
                                    withAt,
                                insertText: `${withAt} `,
                                detail: a.description,
                                range: new range_1.Range(1, 1, 1, 1),
                                command: { id: AssignSelectedAgentAction.ID, title: AssignSelectedAgentAction.ID, arguments: [{ agent: a, widget }] },
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                            };
                        })
                    };
                }
            }));
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgentSubcommand',
                triggerCharacters: ['/'],
                provideCompletionItems: async (model, position, _context, token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return;
                    }
                    const range = computeCompletionRanges(model, position, /\/\w*/g);
                    if (!range) {
                        return null;
                    }
                    const parsedRequest = widget.parsedInput.parts;
                    const usedAgentIdx = parsedRequest.findIndex((p) => p instanceof chatParserTypes_1.ChatRequestAgentPart);
                    if (usedAgentIdx < 0) {
                        return;
                    }
                    const usedSubcommand = parsedRequest.find(p => p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
                    if (usedSubcommand) {
                        // Only one allowed
                        return;
                    }
                    for (const partAfterAgent of parsedRequest.slice(usedAgentIdx + 1)) {
                        // Could allow text after 'position'
                        if (!(partAfterAgent instanceof chatParserTypes_1.ChatRequestTextPart) || !partAfterAgent.text.trim().match(/^(\/\w*)?$/)) {
                            // No text allowed between agent and subcommand
                            return;
                        }
                    }
                    const usedAgent = parsedRequest[usedAgentIdx];
                    return {
                        suggestions: usedAgent.agent.slashCommands.map((c, i) => {
                            const withSlash = `/${c.name}`;
                            return {
                                label: withSlash,
                                insertText: `${withSlash} `,
                                detail: c.description,
                                range,
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                            };
                        })
                    };
                }
            }));
            // list subcommands when the query is empty, insert agent+subcommand
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgentAndSubcommand',
                triggerCharacters: ['/'],
                provideCompletionItems: async (model, position, _context, token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    const viewModel = widget?.viewModel;
                    if (!widget || !viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return;
                    }
                    const range = computeCompletionRanges(model, position, /\/\w*/g);
                    if (!range) {
                        return null;
                    }
                    const agents = this.chatAgentService.getAgents()
                        .filter(a => a.locations.includes(widget.location));
                    const justAgents = agents
                        .filter(a => !a.isDefault)
                        .map(agent => {
                        const isDupe = !!agents.find(other => other.name === agent.name && other.id !== agent.id);
                        const detail = agent.description;
                        const agentLabel = `${chatParserTypes_1.chatAgentLeader}${agent.name}`;
                        return {
                            label: isDupe ?
                                { label: agentLabel, description: agent.description, detail: ` (${agent.id})` } :
                                agentLabel,
                            detail,
                            filterText: `${chatParserTypes_1.chatSubcommandLeader}${agent.name}`,
                            insertText: `${agentLabel} `,
                            range: new range_1.Range(1, 1, 1, 1),
                            kind: 18 /* CompletionItemKind.Text */,
                            sortText: `${chatParserTypes_1.chatSubcommandLeader}${agent.id}`,
                            command: { id: AssignSelectedAgentAction.ID, title: AssignSelectedAgentAction.ID, arguments: [{ agent, widget }] },
                        };
                    });
                    return {
                        suggestions: justAgents.concat(agents.flatMap(agent => agent.slashCommands.map((c, i) => {
                            const agentLabel = `${chatParserTypes_1.chatAgentLeader}${agent.name}`;
                            const withSlash = `${chatParserTypes_1.chatSubcommandLeader}${c.name}`;
                            return {
                                label: { label: withSlash, description: agentLabel },
                                filterText: `${chatParserTypes_1.chatSubcommandLeader}${agent.name}${c.name}`,
                                commitCharacters: [' '],
                                insertText: `${agentLabel} ${withSlash} `,
                                detail: `(${agentLabel}) ${c.description ?? ''}`,
                                range: new range_1.Range(1, 1, 1, 1),
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                                sortText: `${chatParserTypes_1.chatSubcommandLeader}${agent.id}${c.name}`,
                                command: { id: AssignSelectedAgentAction.ID, title: AssignSelectedAgentAction.ID, arguments: [{ agent, widget }] },
                            };
                        })))
                    };
                }
            }));
        }
    };
    AgentCompletions = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService),
        __param(2, chatAgents_1.IChatAgentService)
    ], AgentCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(AgentCompletions, 4 /* LifecyclePhase.Eventually */);
    class AssignSelectedAgentAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.assignSelectedAgent'; }
        constructor() {
            super({
                id: AssignSelectedAgentAction.ID,
                title: '' // not displayed
            });
        }
        async run(accessor, ...args) {
            const arg = args[0];
            if (!arg || !arg.widget || !arg.agent) {
                return;
            }
            arg.widget.lastSelectedAgent = arg.agent;
        }
    }
    (0, actions_1.registerAction2)(AssignSelectedAgentAction);
    let BuiltinDynamicCompletions = class BuiltinDynamicCompletions extends lifecycle_1.Disposable {
        static { BuiltinDynamicCompletions_1 = this; }
        static { this.VariableNameDef = new RegExp(`${chatParserTypes_1.chatVariableLeader}\\w*`, 'g'); } // MUST be using `g`-flag
        constructor(languageFeaturesService, chatWidgetService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatDynamicCompletions',
                triggerCharacters: [chatParserTypes_1.chatVariableLeader],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.supportsFileReferences || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const range = computeCompletionRanges(model, position, BuiltinDynamicCompletions_1.VariableNameDef);
                    if (!range) {
                        return null;
                    }
                    const afterRange = new range_1.Range(position.lineNumber, range.replace.startColumn, position.lineNumber, range.replace.startColumn + '#file:'.length);
                    return {
                        suggestions: [
                            {
                                label: `${chatParserTypes_1.chatVariableLeader}file`,
                                insertText: `${chatParserTypes_1.chatVariableLeader}file:`,
                                detail: (0, nls_1.localize)('pickFileLabel', "Pick a file"),
                                range,
                                kind: 18 /* CompletionItemKind.Text */,
                                command: { id: chatDynamicVariables_1.SelectAndInsertFileAction.ID, title: chatDynamicVariables_1.SelectAndInsertFileAction.ID, arguments: [{ widget, range: afterRange }] },
                                sortText: 'z'
                            }
                        ]
                    };
                }
            }));
        }
    };
    BuiltinDynamicCompletions = BuiltinDynamicCompletions_1 = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService)
    ], BuiltinDynamicCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BuiltinDynamicCompletions, 4 /* LifecyclePhase.Eventually */);
    function computeCompletionRanges(model, position, reg) {
        const varWord = (0, wordHelper_1.getWordAtText)(position.column, reg, model.getLineContent(position.lineNumber), 0);
        if (!varWord && model.getWordUntilPosition(position).word) {
            // inside a "normal" word
            return;
        }
        let insert;
        let replace;
        if (!varWord) {
            insert = replace = range_1.Range.fromPositions(position);
        }
        else {
            insert = new range_1.Range(position.lineNumber, varWord.startColumn, position.lineNumber, position.column);
            replace = new range_1.Range(position.lineNumber, varWord.startColumn, position.lineNumber, varWord.endColumn);
        }
        return { insert, replace, varWord };
    }
    let VariableCompletions = class VariableCompletions extends lifecycle_1.Disposable {
        static { VariableCompletions_1 = this; }
        static { this.VariableNameDef = new RegExp(`${chatParserTypes_1.chatVariableLeader}\\w*`, 'g'); } // MUST be using `g`-flag
        constructor(languageFeaturesService, chatWidgetService, chatVariablesService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this.chatVariablesService = chatVariablesService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatVariables',
                triggerCharacters: [chatParserTypes_1.chatVariableLeader],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const range = computeCompletionRanges(model, position, VariableCompletions_1.VariableNameDef);
                    if (!range) {
                        return null;
                    }
                    const usedVariables = widget.parsedInput.parts.filter((p) => p instanceof chatParserTypes_1.ChatRequestVariablePart);
                    const variableItems = Array.from(this.chatVariablesService.getVariables())
                        // This doesn't look at dynamic variables like `file`, where multiple makes sense.
                        .filter(v => !usedVariables.some(usedVar => usedVar.variableName === v.name))
                        .map(v => {
                        const withLeader = `${chatParserTypes_1.chatVariableLeader}${v.name}`;
                        return {
                            label: withLeader,
                            range,
                            insertText: withLeader + ' ',
                            detail: v.description,
                            kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                            sortText: 'z'
                        };
                    });
                    return {
                        suggestions: variableItems
                    };
                }
            }));
        }
    };
    VariableCompletions = VariableCompletions_1 = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService),
        __param(2, chatVariables_1.IChatVariablesService)
    ], VariableCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(VariableCompletions, 4 /* LifecyclePhase.Eventually */);
    let ChatTokenDeleter = class ChatTokenDeleter extends lifecycle_1.Disposable {
        constructor(widget, instantiationService) {
            super();
            this.widget = widget;
            this.instantiationService = instantiationService;
            this.id = 'chatTokenDeleter';
            const parser = this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const inputValue = this.widget.inputEditor.getValue();
            let previousInputValue;
            let previousSelectedAgent;
            // A simple heuristic to delete the previous token when the user presses backspace.
            // The sophisticated way to do this would be to have a parse tree that can be updated incrementally.
            this._register(this.widget.inputEditor.onDidChangeModelContent(e => {
                if (!previousInputValue) {
                    previousInputValue = inputValue;
                    previousSelectedAgent = this.widget.lastSelectedAgent;
                }
                // Don't try to handle multicursor edits right now
                const change = e.changes[0];
                // If this was a simple delete, try to find out whether it was inside a token
                if (!change.text && this.widget.viewModel) {
                    const previousParsedValue = parser.parseChatRequest(this.widget.viewModel.sessionId, previousInputValue, chatAgents_1.ChatAgentLocation.Panel, { selectedAgent: previousSelectedAgent });
                    // For dynamic variables, this has to happen in ChatDynamicVariableModel with the other bookkeeping
                    const deletableTokens = previousParsedValue.parts.filter(p => p instanceof chatParserTypes_1.ChatRequestAgentPart || p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart || p instanceof chatParserTypes_1.ChatRequestSlashCommandPart || p instanceof chatParserTypes_1.ChatRequestVariablePart);
                    deletableTokens.forEach(token => {
                        const deletedRangeOfToken = range_1.Range.intersectRanges(token.editorRange, change.range);
                        // Part of this token was deleted, or the space after it was deleted, and the deletion range doesn't go off the front of the token, for simpler math
                        if (deletedRangeOfToken && range_1.Range.compareRangesUsingStarts(token.editorRange, change.range) < 0) {
                            // Assume single line tokens
                            const length = deletedRangeOfToken.endColumn - deletedRangeOfToken.startColumn;
                            const rangeToDelete = new range_1.Range(token.editorRange.startLineNumber, token.editorRange.startColumn, token.editorRange.endLineNumber, token.editorRange.endColumn - length);
                            this.widget.inputEditor.executeEdits(this.id, [{
                                    range: rangeToDelete,
                                    text: '',
                                }]);
                        }
                    });
                }
                previousInputValue = this.widget.inputEditor.getValue();
                previousSelectedAgent = this.widget.lastSelectedAgent;
            }));
        }
    };
    ChatTokenDeleter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ChatTokenDeleter);
    chatWidget_1.ChatWidget.CONTRIBS.push(ChatTokenDeleter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdElucHV0RWRpdG9yQ29udHJpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NvbnRyaWIvY2hhdElucHV0RWRpdG9yQ29udHJpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ2hHLE1BQU0scUJBQXFCLEdBQUcsTUFBTSxDQUFDO0lBQ3JDLE1BQU0seUJBQXlCLEdBQUcscUJBQXFCLENBQUM7SUFDeEQsTUFBTSw4QkFBOEIsR0FBRyxtQkFBbUIsQ0FBQztJQUMzRCxNQUFNLDBCQUEwQixHQUFHLG9CQUFvQixDQUFDO0lBRXhELFNBQVMsb0JBQW9CLENBQUMsS0FBcUIsRUFBRSxVQUE4QjtRQUNsRixPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRSxLQUFLLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQzdELENBQUM7SUFFRCxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVO1FBUTlDLFlBQ2tCLE1BQW1CLEVBQ2hCLGlCQUFzRCxFQUMzRCxZQUE0QyxFQUN4QyxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFMUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ0Msc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMxQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN2QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBVnhELE9BQUUsR0FBRyx3QkFBd0IsQ0FBQztZQUU3Qix5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBRXpDLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFVL0UsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXBHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEcsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7WUFFdkMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0csSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFO2dCQUNwRCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2pELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEYsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVuRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRU8sMEJBQTBCO1lBQ2pDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4RSxJQUFJLENBQUMsRUFBRSxJQUFJLEtBQUssbUJBQW1CLElBQUksQ0FBQyxFQUFFLElBQUksS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDakUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTywrQkFBK0I7WUFDdEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLG9EQUE2QixDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFFNUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNoRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMscUJBQXFCLEVBQUUsOEJBQThCLEVBQUU7Z0JBQ3BHLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLHVDQUEwQixDQUFDLEVBQUUsUUFBUSxFQUFFO2dCQUM3RCxlQUFlLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyx1Q0FBMEIsQ0FBQyxFQUFFLFFBQVEsRUFBRTtnQkFDdkUsWUFBWSxFQUFFLEtBQUs7YUFDbkIsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLHFCQUFxQixFQUFFLDBCQUEwQixFQUFFO2dCQUNoRyxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyx1Q0FBMEIsQ0FBQyxFQUFFLFFBQVEsRUFBRTtnQkFDN0QsZUFBZSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsdUNBQTBCLENBQUMsRUFBRSxRQUFRLEVBQUU7Z0JBQ3ZFLFlBQVksRUFBRSxLQUFLO2FBQ25CLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxxQkFBcUIsRUFBRSxvREFBNkIsRUFBRTtnQkFDbkcsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsdUNBQTBCLENBQUMsRUFBRSxRQUFRLEVBQUU7Z0JBQzdELGVBQWUsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLHVDQUEwQixDQUFDLEVBQUUsUUFBUSxFQUFFO2dCQUN2RSxZQUFZLEVBQUUsS0FBSzthQUNuQixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRU8sbUJBQW1CO1lBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDaEQsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLDBDQUEwQixDQUFDLENBQUM7WUFDekUsT0FBTyxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBRU8sS0FBSyxDQUFDLDRCQUE0QjtZQUN6QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUV0RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pGLE1BQU0sVUFBVSxHQUF5QjtvQkFDeEM7d0JBQ0MsS0FBSyxFQUFFOzRCQUNOLGVBQWUsRUFBRSxDQUFDOzRCQUNsQixhQUFhLEVBQUUsQ0FBQzs0QkFDaEIsV0FBVyxFQUFFLENBQUM7NEJBQ2QsU0FBUyxFQUFFLElBQUk7eUJBQ2Y7d0JBQ0QsYUFBYSxFQUFFOzRCQUNkLEtBQUssRUFBRTtnQ0FDTixXQUFXLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixJQUFJLFlBQVksRUFBRSxXQUFXLElBQUksRUFBRTtnQ0FDMUUsS0FBSyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRTs2QkFDakM7eUJBQ0Q7cUJBQ0Q7aUJBQ0QsQ0FBQztnQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsRUFBRSx5QkFBeUIsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDM0csT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFcEQsSUFBSSxxQkFBdUQsQ0FBQztZQUM1RCxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUE2QixFQUFFLENBQUMsQ0FBQyxZQUFZLHNDQUFvQixDQUFDLENBQUM7WUFDMUcsTUFBTSxtQkFBbUIsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUF1QyxFQUFFLENBQUMsQ0FBQyxZQUFZLGdEQUE4QixDQUFDLENBQUM7WUFDeEksTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFvQyxFQUFFLENBQUMsQ0FBQyxZQUFZLDZDQUEyQixDQUFDLENBQUM7WUFFL0gsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLElBQTRCLEVBQVcsRUFBRTtnQkFDMUUsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxPQUFPLFFBQVEsSUFBSSxRQUFRLFlBQVkscUNBQW1CLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7WUFDckYsQ0FBQyxDQUFDO1lBRUYsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLElBQTRCLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pFLGVBQWUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWU7Z0JBQ2pELGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWE7Z0JBQzdDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsR0FBRyxDQUFDO2dCQUMzQyxTQUFTLEVBQUUsSUFBSTthQUNmLENBQUMsQ0FBQztZQUVILE1BQU0sc0JBQXNCLEdBQUcsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVkscUNBQW1CLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLFlBQVksc0NBQW9CLENBQUMsQ0FBQztZQUNySyxJQUFJLHNCQUFzQixFQUFFLENBQUM7Z0JBQzVCLDREQUE0RDtnQkFDNUQsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDL0csTUFBTSwrQkFBK0IsR0FBRyxzQkFBc0IsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDL0csSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUN4RSxxQkFBcUIsR0FBRyxDQUFDOzRCQUN4QixLQUFLLEVBQUUsc0JBQXNCLENBQUMsU0FBUyxDQUFDOzRCQUN4QyxhQUFhLEVBQUU7Z0NBQ2QsS0FBSyxFQUFFO29DQUNOLFdBQVcsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsV0FBVztvQ0FDekgsS0FBSyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtpQ0FDakM7NkJBQ0Q7eUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSw2QkFBNkIsR0FBRyxTQUFTLElBQUksbUJBQW1CLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxxQ0FBbUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsWUFBWSxzQ0FBb0IsSUFBSSxDQUFDLFlBQVksZ0RBQThCLENBQUMsQ0FBQztZQUNsUCxJQUFJLDZCQUE2QixFQUFFLENBQUM7Z0JBQ25DLDJFQUEyRTtnQkFDM0UsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3RJLE1BQU0sK0JBQStCLEdBQUcsc0JBQXNCLElBQUksbUJBQW1CLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO2dCQUNsSCxJQUFJLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxXQUFXLElBQUksd0JBQXdCLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO29CQUMvRixxQkFBcUIsR0FBRyxDQUFDOzRCQUN4QixLQUFLLEVBQUUsc0JBQXNCLENBQUMsbUJBQW1CLENBQUM7NEJBQ2xELGFBQWEsRUFBRTtnQ0FDZCxLQUFLLEVBQUU7b0NBQ04sV0FBVyxFQUFFLCtCQUErQixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxXQUFXO29DQUN4SSxLQUFLLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFO2lDQUNqQzs2QkFDRDt5QkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsRUFBRSx5QkFBeUIsRUFBRSxxQkFBcUIsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU1SCxNQUFNLGVBQWUsR0FBcUMsRUFBRSxDQUFDO1lBQzdELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekksTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxVQUFVLEdBQUcsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDekQsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxJQUFJLDRCQUFjLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7b0JBQ3pCLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxJQUFJLDRCQUFjLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDN0ksQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMscUJBQXFCLEVBQUUsOEJBQThCLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFckgsTUFBTSxjQUFjLEdBQXlCLEVBQUUsQ0FBQztZQUNoRCxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFnQyxFQUFFLENBQUMsQ0FBQyxZQUFZLHlDQUF1QixDQUFDLENBQUM7WUFDdEgsS0FBSyxNQUFNLFFBQVEsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDdEMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUN0RCxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMscUJBQXFCLEVBQUUsMEJBQTBCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDakgsQ0FBQztLQUNELENBQUE7SUFoTUssc0JBQXNCO1FBVXpCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSw4QkFBaUIsQ0FBQTtPQVpkLHNCQUFzQixDQWdNM0I7SUFFRCxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBR25ELFlBQ2tCLE1BQW1CO1lBRXBDLEtBQUssRUFBRSxDQUFDO1lBRlMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUhyQixPQUFFLEdBQUcsNkJBQTZCLENBQUM7WUFNbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMvQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdEQsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxLQUFLLENBQUMsc0JBQXNCLENBQUMsS0FBcUIsRUFBRSxZQUEyQztZQUN0RyxJQUFJLEtBQXlCLENBQUM7WUFDOUIsSUFBSSxZQUFZLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMzQyxLQUFLLEdBQUcsR0FBRyxpQ0FBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksc0NBQW9CLEdBQUcsWUFBWSxDQUFDLElBQUksR0FBRyxDQUFDO1lBQ3hGLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQyxLQUFLLEdBQUcsR0FBRyxpQ0FBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQztZQUM1QyxDQUFDO1lBRUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsdUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFFOUUsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQUMvQyxZQUM0Qyx1QkFBaUQsRUFDdkQsaUJBQXFDLEVBQy9CLHVCQUFpRDtZQUU1RixLQUFLLEVBQUUsQ0FBQztZQUptQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3ZELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDL0IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUk1RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsNkJBQWEsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzNJLGlCQUFpQixFQUFFLHFCQUFxQjtnQkFDeEMsaUJBQWlCLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3hCLHNCQUFzQixFQUFFLEtBQUssRUFBRSxLQUFpQixFQUFFLFFBQWtCLEVBQUUsUUFBMkIsRUFBRSxNQUF5QixFQUFFLEVBQUU7b0JBQy9ILE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3JFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEtBQUssOEJBQWlCLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxFQUFFLENBQUM7d0JBQ3BJLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7b0JBQy9DLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksc0NBQW9CLENBQUMsQ0FBQztvQkFDN0UsSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFDZiwyREFBMkQ7d0JBQzNELE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2pFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDcEIsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFFRCxPQUF1Qjt3QkFDdEIsV0FBVyxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUNsQyxPQUF1QjtnQ0FDdEIsS0FBSyxFQUFFLFNBQVM7Z0NBQ2hCLFVBQVUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLEdBQUc7Z0NBQ3ZELE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTTtnQ0FDaEIsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQ0FDNUIsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dDQUN6QyxJQUFJLGtDQUF5QixFQUFFLHNDQUFzQztnQ0FDckUsT0FBTyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsaUNBQVksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxTQUFTLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUzs2QkFDM0ksQ0FBQzt3QkFDSCxDQUFDLENBQUM7cUJBQ0YsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0QsQ0FBQTtJQW5ESyx1QkFBdUI7UUFFMUIsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLHlCQUFrQixDQUFBO1FBQ2xCLFdBQUEsNENBQXdCLENBQUE7T0FKckIsdUJBQXVCLENBbUQ1QjtJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyx1QkFBdUIsb0NBQTRCLENBQUM7SUFFOUosSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQUN4QyxZQUM0Qyx1QkFBaUQsRUFDdkQsaUJBQXFDLEVBQ3RDLGdCQUFtQztZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUptQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3ZELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDdEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUl2RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsNkJBQWEsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzNJLGlCQUFpQixFQUFFLFdBQVc7Z0JBQzlCLGlCQUFpQixFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUN4QixzQkFBc0IsRUFBRSxLQUFLLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLFFBQTJCLEVBQUUsTUFBeUIsRUFBRSxFQUFFO29CQUMvSCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyRSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLDhCQUFpQixDQUFDLEtBQUssQ0FBQyxrREFBa0QsRUFBRSxDQUFDO3dCQUNwSSxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUVELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO29CQUMvQyxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLHNDQUFvQixDQUFDLENBQUM7b0JBQzdFLElBQUksU0FBUyxJQUFJLENBQUMsYUFBSyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDM0UseUJBQXlCO3dCQUN6QixPQUFPO29CQUNSLENBQUM7b0JBRUQsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDaEUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRTt5QkFDOUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO3lCQUN6QixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFFckQsT0FBdUI7d0JBQ3RCLFdBQVcsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFOzRCQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDNUIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQ2xGLE9BQXVCO2dDQUN0QixnRkFBZ0Y7Z0NBQ2hGLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQ0FDZCxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztvQ0FDckUsTUFBTTtnQ0FDUCxVQUFVLEVBQUUsR0FBRyxNQUFNLEdBQUc7Z0NBQ3hCLE1BQU0sRUFBRSxDQUFDLENBQUMsV0FBVztnQ0FDckIsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQ0FDNUIsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUseUJBQXlCLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQTBDLENBQUMsRUFBRTtnQ0FDN0osSUFBSSxrQ0FBeUIsRUFBRSxxQ0FBcUM7NkJBQ3BFLENBQUM7d0JBQ0gsQ0FBQyxDQUFDO3FCQUNGLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLDZCQUFhLENBQUMsWUFBWSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxFQUFFO2dCQUMzSSxpQkFBaUIsRUFBRSxxQkFBcUI7Z0JBQ3hDLGlCQUFpQixFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUN4QixzQkFBc0IsRUFBRSxLQUFLLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLFFBQTJCLEVBQUUsS0FBd0IsRUFBRSxFQUFFO29CQUM5SCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyRSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLDhCQUFpQixDQUFDLEtBQUssQ0FBQyxrREFBa0QsRUFBRSxDQUFDO3dCQUNwSSxPQUFPO29CQUNSLENBQUM7b0JBRUQsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7b0JBQy9DLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQTZCLEVBQUUsQ0FBQyxDQUFDLFlBQVksc0NBQW9CLENBQUMsQ0FBQztvQkFDbEgsSUFBSSxZQUFZLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3RCLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLGdEQUE4QixDQUFDLENBQUM7b0JBQzVGLElBQUksY0FBYyxFQUFFLENBQUM7d0JBQ3BCLG1CQUFtQjt3QkFDbkIsT0FBTztvQkFDUixDQUFDO29CQUVELEtBQUssTUFBTSxjQUFjLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEUsb0NBQW9DO3dCQUNwQyxJQUFJLENBQUMsQ0FBQyxjQUFjLFlBQVkscUNBQW1CLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7NEJBQ3pHLCtDQUErQzs0QkFDL0MsT0FBTzt3QkFDUixDQUFDO29CQUNGLENBQUM7b0JBRUQsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBeUIsQ0FBQztvQkFDdEUsT0FBdUI7d0JBQ3RCLFdBQVcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQ3ZELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUMvQixPQUF1QjtnQ0FDdEIsS0FBSyxFQUFFLFNBQVM7Z0NBQ2hCLFVBQVUsRUFBRSxHQUFHLFNBQVMsR0FBRztnQ0FDM0IsTUFBTSxFQUFFLENBQUMsQ0FBQyxXQUFXO2dDQUNyQixLQUFLO2dDQUNMLElBQUksa0NBQXlCLEVBQUUscUNBQXFDOzZCQUNwRSxDQUFDO3dCQUNILENBQUMsQ0FBQztxQkFDRixDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLG9FQUFvRTtZQUNwRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsNkJBQWEsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzNJLGlCQUFpQixFQUFFLHdCQUF3QjtnQkFDM0MsaUJBQWlCLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3hCLHNCQUFzQixFQUFFLEtBQUssRUFBRSxLQUFpQixFQUFFLFFBQWtCLEVBQUUsUUFBMkIsRUFBRSxLQUF3QixFQUFFLEVBQUU7b0JBQzlILE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3JFLE1BQU0sU0FBUyxHQUFHLE1BQU0sRUFBRSxTQUFTLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLFFBQVEsS0FBSyw4QkFBaUIsQ0FBQyxLQUFLLENBQUMsa0RBQWtELEVBQUUsQ0FBQzt3QkFDN0gsT0FBTztvQkFDUixDQUFDO29CQUVELE1BQU0sS0FBSyxHQUFHLHVCQUF1QixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2pFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDWixPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUU7eUJBQzlDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUVyRCxNQUFNLFVBQVUsR0FBcUIsTUFBTTt5QkFDekMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO3lCQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQ1osTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzFGLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7d0JBQ2pDLE1BQU0sVUFBVSxHQUFHLEdBQUcsaUNBQWUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBRXJELE9BQU87NEJBQ04sS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dDQUNkLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dDQUNqRixVQUFVOzRCQUNYLE1BQU07NEJBQ04sVUFBVSxFQUFFLEdBQUcsc0NBQW9CLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRTs0QkFDbEQsVUFBVSxFQUFFLEdBQUcsVUFBVSxHQUFHOzRCQUM1QixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDOzRCQUM1QixJQUFJLGtDQUF5Qjs0QkFDN0IsUUFBUSxFQUFFLEdBQUcsc0NBQW9CLEdBQUcsS0FBSyxDQUFDLEVBQUUsRUFBRTs0QkFDOUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUseUJBQXlCLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBMEMsQ0FBQyxFQUFFO3lCQUMxSixDQUFDO29CQUNILENBQUMsQ0FBQyxDQUFDO29CQUVKLE9BQU87d0JBQ04sV0FBVyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDeEQsTUFBTSxVQUFVLEdBQUcsR0FBRyxpQ0FBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDckQsTUFBTSxTQUFTLEdBQUcsR0FBRyxzQ0FBb0IsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQ3JELE9BQU87Z0NBQ04sS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFO2dDQUNwRCxVQUFVLEVBQUUsR0FBRyxzQ0FBb0IsR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7Z0NBQzNELGdCQUFnQixFQUFFLENBQUMsR0FBRyxDQUFDO2dDQUN2QixVQUFVLEVBQUUsR0FBRyxVQUFVLElBQUksU0FBUyxHQUFHO2dDQUN6QyxNQUFNLEVBQUUsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDLFdBQVcsSUFBSSxFQUFFLEVBQUU7Z0NBQ2hELEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0NBQzVCLElBQUksa0NBQXlCLEVBQUUscUNBQXFDO2dDQUNwRSxRQUFRLEVBQUUsR0FBRyxzQ0FBb0IsR0FBRyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7Z0NBQ3ZELE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSx5QkFBeUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQTBDLENBQUMsRUFBRTs2QkFDakksQ0FBQzt3QkFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDTCxDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBcEtLLGdCQUFnQjtRQUVuQixXQUFBLDJDQUF3QixDQUFBO1FBQ3hCLFdBQUEseUJBQWtCLENBQUE7UUFDbEIsV0FBQSw4QkFBaUIsQ0FBQTtPQUpkLGdCQUFnQixDQW9LckI7SUFDRCxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsNkJBQTZCLENBQUMsZ0JBQWdCLG9DQUE0QixDQUFDO0lBT3ZKLE1BQU0seUJBQTBCLFNBQVEsaUJBQU87aUJBQzlCLE9BQUUsR0FBRywyQ0FBMkMsQ0FBQztRQUVqRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUseUJBQXlCLENBQUMsRUFBRTtnQkFDaEMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0I7YUFDMUIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDbkQsTUFBTSxHQUFHLEdBQWtDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdkMsT0FBTztZQUNSLENBQUM7WUFFRCxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDMUMsQ0FBQzs7SUFFRixJQUFBLHlCQUFlLEVBQUMseUJBQXlCLENBQUMsQ0FBQztJQUUzQyxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHNCQUFVOztpQkFDekIsb0JBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLG9DQUFrQixNQUFNLEVBQUUsR0FBRyxDQUFDLEFBQS9DLENBQWdELEdBQUMseUJBQXlCO1FBRWpILFlBQzRDLHVCQUFpRCxFQUN2RCxpQkFBcUM7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFIbUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN2RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBSTFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSw2QkFBYSxDQUFDLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDM0ksaUJBQWlCLEVBQUUsd0JBQXdCO2dCQUMzQyxpQkFBaUIsRUFBRSxDQUFDLG9DQUFrQixDQUFDO2dCQUN2QyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLFFBQTJCLEVBQUUsTUFBeUIsRUFBRSxFQUFFO29CQUMvSCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyRSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixJQUFJLE1BQU0sQ0FBQyxRQUFRLEtBQUssOEJBQWlCLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxFQUFFLENBQUM7d0JBQ2pKLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSwyQkFBeUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDbEcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxhQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0ksT0FBdUI7d0JBQ3RCLFdBQVcsRUFBRTs0QkFDSTtnQ0FDZixLQUFLLEVBQUUsR0FBRyxvQ0FBa0IsTUFBTTtnQ0FDbEMsVUFBVSxFQUFFLEdBQUcsb0NBQWtCLE9BQU87Z0NBQ3hDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsYUFBYSxDQUFDO2dDQUNoRCxLQUFLO2dDQUNMLElBQUksa0NBQXlCO2dDQUM3QixPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsZ0RBQXlCLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxnREFBeUIsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUU7Z0NBQzlILFFBQVEsRUFBRSxHQUFHOzZCQUNiO3lCQUNEO3FCQUNELENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzs7SUF2Q0kseUJBQXlCO1FBSTVCLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSx5QkFBa0IsQ0FBQTtPQUxmLHlCQUF5QixDQXdDOUI7SUFFRCxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsNkJBQTZCLENBQUMseUJBQXlCLG9DQUE0QixDQUFDO0lBRWhLLFNBQVMsdUJBQXVCLENBQUMsS0FBaUIsRUFBRSxRQUFrQixFQUFFLEdBQVc7UUFDbEYsTUFBTSxPQUFPLEdBQUcsSUFBQSwwQkFBYSxFQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLElBQUksQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzNELHlCQUF5QjtZQUN6QixPQUFPO1FBQ1IsQ0FBQztRQUVELElBQUksTUFBYSxDQUFDO1FBQ2xCLElBQUksT0FBYyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLE1BQU0sR0FBRyxPQUFPLEdBQUcsYUFBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRCxDQUFDO2FBQU0sQ0FBQztZQUNQLE1BQU0sR0FBRyxJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkcsT0FBTyxHQUFHLElBQUksYUFBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBRUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUVELElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7O2lCQUVuQixvQkFBZSxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsb0NBQWtCLE1BQU0sRUFBRSxHQUFHLENBQUMsQUFBL0MsQ0FBZ0QsR0FBQyx5QkFBeUI7UUFFakgsWUFDNEMsdUJBQWlELEVBQ3ZELGlCQUFxQyxFQUNsQyxvQkFBMkM7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFKbUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN2RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFJbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLDZCQUFhLENBQUMsWUFBWSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxFQUFFO2dCQUMzSSxpQkFBaUIsRUFBRSxlQUFlO2dCQUNsQyxpQkFBaUIsRUFBRSxDQUFDLG9DQUFrQixDQUFDO2dCQUN2QyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLFFBQTJCLEVBQUUsTUFBeUIsRUFBRSxFQUFFO29CQUUvSCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyRSxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEtBQUssOEJBQWlCLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxFQUFFLENBQUM7d0JBQy9HLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxxQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDNUYsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFnQyxFQUFFLENBQUMsQ0FBQyxZQUFZLHlDQUF1QixDQUFDLENBQUM7b0JBQ2pJLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUN6RSxrRkFBa0Y7eUJBQ2pGLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUM1RSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ1IsTUFBTSxVQUFVLEdBQUcsR0FBRyxvQ0FBa0IsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3BELE9BQXVCOzRCQUN0QixLQUFLLEVBQUUsVUFBVTs0QkFDakIsS0FBSzs0QkFDTCxVQUFVLEVBQUUsVUFBVSxHQUFHLEdBQUc7NEJBQzVCLE1BQU0sRUFBRSxDQUFDLENBQUMsV0FBVzs0QkFDckIsSUFBSSxrQ0FBeUIsRUFBRSxxQ0FBcUM7NEJBQ3BFLFFBQVEsRUFBRSxHQUFHO3lCQUNiLENBQUM7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBRUosT0FBdUI7d0JBQ3RCLFdBQVcsRUFBRSxhQUFhO3FCQUMxQixDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7O0lBL0NJLG1CQUFtQjtRQUt0QixXQUFBLDJDQUF3QixDQUFBO1FBQ3hCLFdBQUEseUJBQWtCLENBQUE7UUFDbEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVBsQixtQkFBbUIsQ0FnRHhCO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLG1CQUFtQixvQ0FBNEIsQ0FBQztJQUUxSixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBSXhDLFlBQ2tCLE1BQW1CLEVBQ2Isb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSFMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNJLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFKcEUsT0FBRSxHQUFHLGtCQUFrQixDQUFDO1lBT3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUNBQWlCLENBQUMsQ0FBQztZQUMzRSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0RCxJQUFJLGtCQUFzQyxDQUFDO1lBQzNDLElBQUkscUJBQWlELENBQUM7WUFFdEQsbUZBQW1GO1lBQ25GLG9HQUFvRztZQUNwRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNsRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDekIsa0JBQWtCLEdBQUcsVUFBVSxDQUFDO29CQUNoQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDO2dCQUN2RCxDQUFDO2dCQUVELGtEQUFrRDtnQkFDbEQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFNUIsNkVBQTZFO2dCQUM3RSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUMzQyxNQUFNLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsOEJBQWlCLENBQUMsS0FBSyxFQUFFLEVBQUUsYUFBYSxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztvQkFFNUssbUdBQW1HO29CQUNuRyxNQUFNLGVBQWUsR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLHNDQUFvQixJQUFJLENBQUMsWUFBWSxnREFBOEIsSUFBSSxDQUFDLFlBQVksNkNBQTJCLElBQUksQ0FBQyxZQUFZLHlDQUF1QixDQUFDLENBQUM7b0JBQ3BPLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQy9CLE1BQU0sbUJBQW1CLEdBQUcsYUFBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkYsb0pBQW9KO3dCQUNwSixJQUFJLG1CQUFtQixJQUFJLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDaEcsNEJBQTRCOzRCQUM1QixNQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxDQUFDOzRCQUMvRSxNQUFNLGFBQWEsR0FBRyxJQUFJLGFBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQzs0QkFDekssSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQ0FDOUMsS0FBSyxFQUFFLGFBQWE7b0NBQ3BCLElBQUksRUFBRSxFQUFFO2lDQUNSLENBQUMsQ0FBQyxDQUFDO3dCQUNMLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDeEQscUJBQXFCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNELENBQUE7SUFsREssZ0JBQWdCO1FBTW5CLFdBQUEscUNBQXFCLENBQUE7T0FObEIsZ0JBQWdCLENBa0RyQjtJQUNELHVCQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDIn0=