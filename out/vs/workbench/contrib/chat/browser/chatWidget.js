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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/editor/browser/services/codeEditorService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/theme/common/themeService", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatAccessibilityProvider", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/workbench/contrib/chat/browser/chatListRenderer", "vs/workbench/contrib/chat/browser/chatOptions", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/chat/common/codeBlockModelCollection", "vs/workbench/services/views/common/viewsService", "vs/css!./media/chat"], function (require, exports, dom, async_1, errorMessage_1, event_1, lifecycle_1, network_1, resources_1, types_1, codeEditorService_1, actions_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, listService_1, log_1, themeService_1, chat_1, chatAccessibilityProvider_1, chatInputPart_1, chatListRenderer_1, chatOptions_1, chatAgents_1, chatContextKeys_1, chatContributionService_1, chatModel_1, chatParserTypes_1, chatRequestParser_1, chatService_1, chatSlashCommands_1, chatViewModel_1, codeBlockModelCollection_1, viewsService_1) {
    "use strict";
    var ChatWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatWidgetService = exports.ChatWidget = void 0;
    const $ = dom.$;
    function revealLastElement(list) {
        list.scrollTop = list.scrollHeight - list.renderHeight;
    }
    let ChatWidget = class ChatWidget extends lifecycle_1.Disposable {
        static { ChatWidget_1 = this; }
        static { this.CONTRIBS = []; }
        get visible() {
            return this._visible;
        }
        set viewModel(viewModel) {
            if (this._viewModel === viewModel) {
                return;
            }
            this.viewModelDisposables.clear();
            this._viewModel = viewModel;
            if (viewModel) {
                this.viewModelDisposables.add(viewModel);
            }
            this._onDidChangeViewModel.fire();
        }
        get viewModel() {
            return this._viewModel;
        }
        get parsedInput() {
            if (this.parsedChatRequest === undefined) {
                this.parsedChatRequest = this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(this.viewModel.sessionId, this.getInput(), this.location, { selectedAgent: this._lastSelectedAgent });
                this.agentInInput.set((!!this.parsedChatRequest.parts.find(part => part instanceof chatParserTypes_1.ChatRequestAgentPart)));
            }
            return this.parsedChatRequest;
        }
        constructor(location, viewContext, viewOptions, styles, codeEditorService, contextKeyService, instantiationService, chatService, chatAgentService, chatWidgetService, contextMenuService, chatAccessibilityService, logService, themeService, chatSlashCommandService) {
            super();
            this.location = location;
            this.viewContext = viewContext;
            this.viewOptions = viewOptions;
            this.styles = styles;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.chatService = chatService;
            this.chatAgentService = chatAgentService;
            this.contextMenuService = contextMenuService;
            this.chatAccessibilityService = chatAccessibilityService;
            this.logService = logService;
            this.themeService = themeService;
            this.chatSlashCommandService = chatSlashCommandService;
            this._onDidSubmitAgent = this._register(new event_1.Emitter());
            this.onDidSubmitAgent = this._onDidSubmitAgent.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidChangeViewModel = this._register(new event_1.Emitter());
            this.onDidChangeViewModel = this._onDidChangeViewModel.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidClear = this._register(new event_1.Emitter());
            this.onDidClear = this._onDidClear.event;
            this._onDidAcceptInput = this._register(new event_1.Emitter());
            this.onDidAcceptInput = this._onDidAcceptInput.event;
            this._onDidChangeParsedInput = this._register(new event_1.Emitter());
            this.onDidChangeParsedInput = this._onDidChangeParsedInput.event;
            this._onDidChangeHeight = this._register(new event_1.Emitter());
            this.onDidChangeHeight = this._onDidChangeHeight.event;
            this._onDidChangeContentHeight = new event_1.Emitter();
            this.onDidChangeContentHeight = this._onDidChangeContentHeight.event;
            this.contribs = [];
            this.visibleChangeCount = 0;
            this._visible = false;
            this.previousTreeScrollHeight = 0;
            this.viewModelDisposables = this._register(new lifecycle_1.DisposableStore());
            chatContextKeys_1.CONTEXT_IN_CHAT_SESSION.bindTo(contextKeyService).set(true);
            chatContextKeys_1.CONTEXT_CHAT_LOCATION.bindTo(contextKeyService).set(location);
            this.agentInInput = chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_AGENT.bindTo(contextKeyService);
            this.requestInProgress = chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.bindTo(contextKeyService);
            this._register(chatWidgetService.register(this));
            this._codeBlockModelCollection = this._register(instantiationService.createInstance(codeBlockModelCollection_1.CodeBlockModelCollection));
            this._register(codeEditorService.registerCodeEditorOpenHandler(async (input, _source, _sideBySide) => {
                if (input.resource.scheme !== network_1.Schemas.vscodeChatCodeBlock) {
                    return null;
                }
                const responseId = input.resource.path.split('/').at(1);
                if (!responseId) {
                    return null;
                }
                const item = this.viewModel?.getItems().find(item => item.id === responseId);
                if (!item) {
                    return null;
                }
                this.reveal(item);
                await (0, async_1.timeout)(0); // wait for list to actually render
                for (const editor of this.renderer.editorsInUse() ?? []) {
                    if (editor.uri?.toString() === input.resource.toString()) {
                        const inner = editor.editor;
                        if (input.options?.selection) {
                            inner.setSelection({
                                startLineNumber: input.options.selection.startLineNumber,
                                startColumn: input.options.selection.startColumn,
                                endLineNumber: input.options.selection.startLineNumber ?? input.options.selection.endLineNumber,
                                endColumn: input.options.selection.startColumn ?? input.options.selection.endColumn
                            });
                        }
                        return inner;
                    }
                }
                return null;
            }));
        }
        set lastSelectedAgent(agent) {
            this.parsedChatRequest = undefined;
            this._lastSelectedAgent = agent;
            this._onDidChangeParsedInput.fire();
        }
        get lastSelectedAgent() {
            return this._lastSelectedAgent;
        }
        get supportsFileReferences() {
            return !!this.viewOptions.supportsFileReferences;
        }
        get providerId() {
            return this.viewModel?.providerId || '';
        }
        get input() {
            return this.inputPart;
        }
        get inputEditor() {
            return this.inputPart.inputEditor;
        }
        get inputUri() {
            return this.inputPart.inputUri;
        }
        get contentHeight() {
            return dom.getTotalHeight(this.inputPart.element) + this.tree.contentHeight;
        }
        render(parent) {
            const viewId = 'viewId' in this.viewContext ? this.viewContext.viewId : undefined;
            this.editorOptions = this._register(this.instantiationService.createInstance(chatOptions_1.ChatEditorOptions, viewId, this.styles.listForeground, this.styles.inputEditorBackground, this.styles.resultEditorBackground));
            const renderInputOnTop = this.viewOptions.renderInputOnTop ?? false;
            const renderStyle = this.viewOptions.renderStyle;
            this.container = dom.append(parent, $('.interactive-session'));
            if (renderInputOnTop) {
                this.createInput(this.container, { renderFollowups: false, renderStyle });
                this.listContainer = dom.append(this.container, $(`.interactive-list`));
            }
            else {
                this.listContainer = dom.append(this.container, $(`.interactive-list`));
                this.createInput(this.container, { renderFollowups: true, renderStyle });
            }
            this.createList(this.listContainer, { renderStyle, editableCodeBlock: this.viewOptions.editableCodeBlocks });
            this._register(this.editorOptions.onDidChange(() => this.onDidStyleChange()));
            this.onDidStyleChange();
            // Do initial render
            if (this.viewModel) {
                this.onDidChangeItems();
                revealLastElement(this.tree);
            }
            this.contribs = ChatWidget_1.CONTRIBS.map(contrib => {
                try {
                    return this._register(this.instantiationService.createInstance(contrib, this));
                }
                catch (err) {
                    this.logService.error('Failed to instantiate chat widget contrib', (0, errorMessage_1.toErrorMessage)(err));
                    return undefined;
                }
            }).filter(types_1.isDefined);
        }
        getContrib(id) {
            return this.contribs.find(c => c.id === id);
        }
        focusInput() {
            this.inputPart.focus();
        }
        hasInputFocus() {
            return this.inputPart.hasFocus();
        }
        moveFocus(item, type) {
            if (!(0, chatViewModel_1.isResponseVM)(item)) {
                return;
            }
            const items = this.viewModel?.getItems();
            if (!items) {
                return;
            }
            const responseItems = items.filter(i => (0, chatViewModel_1.isResponseVM)(i));
            const targetIndex = responseItems.indexOf(item);
            if (targetIndex === undefined) {
                return;
            }
            const indexToFocus = type === 'next' ? targetIndex + 1 : targetIndex - 1;
            if (indexToFocus < 0 || indexToFocus > responseItems.length - 1) {
                return;
            }
            this.focus(responseItems[indexToFocus]);
        }
        clear() {
            if (this._dynamicMessageLayoutData) {
                this._dynamicMessageLayoutData.enabled = true;
            }
            this._onDidClear.fire();
        }
        onDidChangeItems(skipDynamicLayout) {
            if (this.tree && this._visible) {
                const treeItems = (this.viewModel?.getItems() ?? [])
                    .map(item => {
                    return {
                        element: item,
                        collapsed: false,
                        collapsible: false
                    };
                });
                this.tree.setChildren(null, treeItems, {
                    diffIdentityProvider: {
                        getId: (element) => {
                            return (((0, chatViewModel_1.isResponseVM)(element) || (0, chatViewModel_1.isRequestVM)(element)) ? element.dataId : element.id) +
                                // TODO? We can give the welcome message a proper VM or get rid of the rest of the VMs
                                (((0, chatViewModel_1.isWelcomeVM)(element) && this.viewModel) ? `_${chatModel_1.ChatModelInitState[this.viewModel.initState]}` : '') +
                                // Ensure re-rendering an element once slash commands are loaded, so the colorization can be applied.
                                `${((0, chatViewModel_1.isRequestVM)(element) || (0, chatViewModel_1.isWelcomeVM)(element)) /* && !!this.lastSlashCommands ? '_scLoaded' : '' */}` +
                                // If a response is in the process of progressive rendering, we need to ensure that it will
                                // be re-rendered so progressive rendering is restarted, even if the model wasn't updated.
                                `${(0, chatViewModel_1.isResponseVM)(element) && element.renderData ? `_${this.visibleChangeCount}` : ''}` +
                                // Re-render once content references are loaded
                                ((0, chatViewModel_1.isResponseVM)(element) ? `_${element.contentReferences.length}` : '');
                        },
                    }
                });
                if (!skipDynamicLayout && this._dynamicMessageLayoutData) {
                    this.layoutDynamicChatTreeItemMode();
                }
                const lastItem = treeItems[treeItems.length - 1]?.element;
                if (lastItem && (0, chatViewModel_1.isResponseVM)(lastItem) && lastItem.isComplete) {
                    this.renderFollowups(lastItem.replyFollowups, lastItem);
                }
                else if (lastItem && (0, chatViewModel_1.isWelcomeVM)(lastItem)) {
                    this.renderFollowups(lastItem.sampleQuestions);
                }
                else {
                    this.renderFollowups(undefined);
                }
            }
        }
        async renderFollowups(items, response) {
            this.inputPart.renderFollowups(items, response);
            if (this.bodyDimension) {
                this.layout(this.bodyDimension.height, this.bodyDimension.width);
            }
        }
        setVisible(visible) {
            this._visible = visible;
            this.visibleChangeCount++;
            this.renderer.setVisible(visible);
            if (visible) {
                this._register((0, async_1.disposableTimeout)(() => {
                    // Progressive rendering paused while hidden, so start it up again.
                    // Do it after a timeout because the container is not visible yet (it should be but offsetHeight returns 0 here)
                    if (this._visible) {
                        this.onDidChangeItems(true);
                    }
                }, 0));
            }
        }
        createList(listContainer, options) {
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            const delegate = scopedInstantiationService.createInstance(chatListRenderer_1.ChatListDelegate, this.viewOptions.defaultElementHeight ?? 200);
            const rendererDelegate = {
                getListLength: () => this.tree.getNode(null).visibleChildrenCount,
                onDidScroll: this.onDidScroll,
            };
            // Create a dom element to hold UI from editor widgets embedded in chat messages
            const overflowWidgetsContainer = document.createElement('div');
            overflowWidgetsContainer.classList.add('chat-overflow-widget-container', 'monaco-editor');
            listContainer.append(overflowWidgetsContainer);
            this.renderer = this._register(scopedInstantiationService.createInstance(chatListRenderer_1.ChatListItemRenderer, this.editorOptions, this.location, options, rendererDelegate, this._codeBlockModelCollection, overflowWidgetsContainer));
            this._register(this.renderer.onDidClickFollowup(item => {
                // is this used anymore?
                this.acceptInput(item.message);
            }));
            this.tree = scopedInstantiationService.createInstance(listService_1.WorkbenchObjectTree, 'Chat', listContainer, delegate, [this.renderer], {
                identityProvider: { getId: (e) => e.id },
                horizontalScrolling: false,
                supportDynamicHeights: true,
                hideTwistiesOfChildlessElements: true,
                accessibilityProvider: this.instantiationService.createInstance(chatAccessibilityProvider_1.ChatAccessibilityProvider),
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => (0, chatViewModel_1.isRequestVM)(e) ? e.message : (0, chatViewModel_1.isResponseVM)(e) ? e.response.value : '' }, // TODO
                setRowLineHeight: false,
                filter: this.viewOptions.filter ? { filter: this.viewOptions.filter.bind(this.viewOptions), } : undefined,
                overrideStyles: {
                    listFocusBackground: this.styles.listBackground,
                    listInactiveFocusBackground: this.styles.listBackground,
                    listActiveSelectionBackground: this.styles.listBackground,
                    listFocusAndSelectionBackground: this.styles.listBackground,
                    listInactiveSelectionBackground: this.styles.listBackground,
                    listHoverBackground: this.styles.listBackground,
                    listBackground: this.styles.listBackground,
                    listFocusForeground: this.styles.listForeground,
                    listHoverForeground: this.styles.listForeground,
                    listInactiveFocusForeground: this.styles.listForeground,
                    listInactiveSelectionForeground: this.styles.listForeground,
                    listActiveSelectionForeground: this.styles.listForeground,
                    listFocusAndSelectionForeground: this.styles.listForeground,
                }
            });
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onDidChangeContentHeight(() => {
                this.onDidChangeTreeContentHeight();
            }));
            this._register(this.renderer.onDidChangeItemHeight(e => {
                this.tree.updateElementHeight(e.element, e.height);
            }));
            this._register(this.tree.onDidFocus(() => {
                this._onDidFocus.fire();
            }));
            this._register(this.tree.onDidScroll(() => {
                this._onDidScroll.fire();
            }));
        }
        onContextMenu(e) {
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            const selected = e.element;
            const scopedContextKeyService = this.contextKeyService.createOverlay([
                [chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.key, (0, chatViewModel_1.isResponseVM)(selected) && !!selected.errorDetails?.responseIsFiltered]
            ]);
            this.contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.ChatContext,
                menuActionOptions: { shouldForwardArgs: true },
                contextKeyService: scopedContextKeyService,
                getAnchor: () => e.anchor,
                getActionsContext: () => selected,
            });
        }
        onDidChangeTreeContentHeight() {
            if (this.tree.scrollHeight !== this.previousTreeScrollHeight) {
                // Due to rounding, the scrollTop + renderHeight will not exactly match the scrollHeight.
                // Consider the tree to be scrolled all the way down if it is within 2px of the bottom.
                const lastElementWasVisible = this.tree.scrollTop + this.tree.renderHeight >= this.previousTreeScrollHeight - 2;
                if (lastElementWasVisible) {
                    dom.scheduleAtNextAnimationFrame(dom.getWindow(this.listContainer), () => {
                        // Can't set scrollTop during this event listener, the list might overwrite the change
                        revealLastElement(this.tree);
                    }, 0);
                }
            }
            this.previousTreeScrollHeight = this.tree.scrollHeight;
            this._onDidChangeContentHeight.fire();
        }
        createInput(container, options) {
            this.inputPart = this._register(this.instantiationService.createInstance(chatInputPart_1.ChatInputPart, this.location, {
                renderFollowups: options?.renderFollowups ?? true,
                renderStyle: options?.renderStyle,
                menus: { executeToolbar: actions_1.MenuId.ChatExecute, ...this.viewOptions.menus },
                editorOverflowWidgetsDomNode: this.viewOptions.editorOverflowWidgetsDomNode,
            }));
            this.inputPart.render(container, '', this);
            this._register(this.inputPart.onDidLoadInputState(state => {
                this.contribs.forEach(c => {
                    if (c.setInputState && typeof state === 'object' && state?.[c.id]) {
                        c.setInputState(state[c.id]);
                    }
                });
            }));
            this._register(this.inputPart.onDidFocus(() => this._onDidFocus.fire()));
            this._register(this.inputPart.onDidAcceptFollowup(e => {
                if (!this.viewModel) {
                    return;
                }
                let msg = '';
                if (e.followup.agentId && e.followup.agentId !== this.chatAgentService.getDefaultAgent(this.location)?.id) {
                    const agent = this.chatAgentService.getAgent(e.followup.agentId);
                    if (!agent) {
                        return;
                    }
                    this.lastSelectedAgent = agent;
                    msg = `${chatParserTypes_1.chatAgentLeader}${agent.name} `;
                    if (e.followup.subCommand) {
                        msg += `${chatParserTypes_1.chatSubcommandLeader}${e.followup.subCommand} `;
                    }
                }
                else if (!e.followup.agentId && e.followup.subCommand && this.chatSlashCommandService.hasCommand(e.followup.subCommand)) {
                    msg = `${chatParserTypes_1.chatSubcommandLeader}${e.followup.subCommand} `;
                }
                msg += e.followup.message;
                this.acceptInput(msg);
                if (!e.response) {
                    // Followups can be shown by the welcome message, then there is no response associated.
                    // At some point we probably want telemetry for these too.
                    return;
                }
                this.chatService.notifyUserAction({
                    providerId: this.viewModel.providerId,
                    sessionId: this.viewModel.sessionId,
                    requestId: e.response.requestId,
                    agentId: e.response.agent?.id,
                    result: e.response.result,
                    action: {
                        kind: 'followUp',
                        followup: e.followup
                    },
                });
            }));
            this._register(this.inputPart.onDidChangeHeight(() => {
                if (this.bodyDimension) {
                    this.layout(this.bodyDimension.height, this.bodyDimension.width);
                }
                this._onDidChangeContentHeight.fire();
            }));
            this._register(this.inputEditor.onDidChangeModelContent(() => this.updateImplicitContextKinds()));
            this._register(this.chatAgentService.onDidChangeAgents(() => {
                if (this.viewModel) {
                    this.updateImplicitContextKinds();
                }
            }));
        }
        onDidStyleChange() {
            this.container.style.setProperty('--vscode-interactive-result-editor-background-color', this.editorOptions.configuration.resultEditor.backgroundColor?.toString() ?? '');
            this.container.style.setProperty('--vscode-interactive-session-foreground', this.editorOptions.configuration.foreground?.toString() ?? '');
            this.container.style.setProperty('--vscode-chat-list-background', this.themeService.getColorTheme().getColor(this.styles.listBackground)?.toString() ?? '');
        }
        updateImplicitContextKinds() {
            if (!this.viewModel) {
                return;
            }
            this.parsedChatRequest = undefined;
            const agentAndSubcommand = (0, chatParserTypes_1.extractAgentAndCommand)(this.parsedInput);
            const currentAgent = agentAndSubcommand.agentPart?.agent ?? this.chatAgentService.getDefaultAgent(this.location);
            const implicitVariables = agentAndSubcommand.commandPart ?
                agentAndSubcommand.commandPart.command.defaultImplicitVariables :
                currentAgent?.defaultImplicitVariables;
            this.inputPart.setImplicitContextKinds(implicitVariables ?? []);
            if (this.bodyDimension) {
                this.layout(this.bodyDimension.height, this.bodyDimension.width);
            }
        }
        setModel(model, viewState) {
            if (!this.container) {
                throw new Error('Call render() before setModel()');
            }
            this._codeBlockModelCollection.clear();
            this.container.setAttribute('data-session-id', model.sessionId);
            this.viewModel = this.instantiationService.createInstance(chatViewModel_1.ChatViewModel, model, this._codeBlockModelCollection);
            this.viewModelDisposables.add(event_1.Event.accumulate(this.viewModel.onDidChange, 0)(events => {
                if (!this.viewModel) {
                    return;
                }
                this.requestInProgress.set(this.viewModel.requestInProgress);
                this.onDidChangeItems();
                if (events.some(e => e?.kind === 'addRequest')) {
                    revealLastElement(this.tree);
                    this.focusInput();
                }
            }));
            this.viewModelDisposables.add(this.viewModel.onDidDisposeModel(() => {
                // Ensure that view state is saved here, because we will load it again when a new model is assigned
                this.inputPart.saveState();
                // Disposes the viewmodel and listeners
                this.viewModel = undefined;
                this.onDidChangeItems();
            }));
            this.inputPart.setState(model.providerId, viewState.inputValue);
            this.contribs.forEach(c => {
                if (c.setInputState && viewState.inputState?.[c.id]) {
                    c.setInputState(viewState.inputState?.[c.id]);
                }
            });
            if (this.tree) {
                this.onDidChangeItems();
                revealLastElement(this.tree);
            }
            this.updateImplicitContextKinds();
        }
        getFocus() {
            return this.tree.getFocus()[0] ?? undefined;
        }
        reveal(item) {
            this.tree.reveal(item);
        }
        focus(item) {
            const items = this.tree.getNode(null).children;
            const node = items.find(i => i.element?.id === item.id);
            if (!node) {
                return;
            }
            this.tree.setFocus([node.element]);
            this.tree.domFocus();
        }
        refilter() {
            this.tree.refilter();
        }
        setInputPlaceholder(placeholder) {
            this.viewModel?.setInputPlaceholder(placeholder);
        }
        resetInputPlaceholder() {
            this.viewModel?.resetInputPlaceholder();
        }
        setInput(value = '') {
            this.inputPart.setValue(value);
        }
        getInput() {
            return this.inputPart.inputEditor.getValue();
        }
        async acceptInput(query) {
            this._acceptInput(query ? { query } : undefined);
        }
        async acceptInputWithPrefix(prefix) {
            this._acceptInput({ prefix });
        }
        collectInputState() {
            const inputState = {};
            this.contribs.forEach(c => {
                if (c.getInputState) {
                    inputState[c.id] = c.getInputState();
                }
            });
            return inputState;
        }
        async _acceptInput(opts) {
            if (this.viewModel) {
                this._onDidAcceptInput.fire();
                const editorValue = this.getInput();
                const requestId = this.chatAccessibilityService.acceptRequest();
                const input = !opts ? editorValue :
                    'query' in opts ? opts.query :
                        `${opts.prefix} ${editorValue}`;
                const isUserQuery = !opts || 'prefix' in opts;
                const result = await this.chatService.sendRequest(this.viewModel.sessionId, input, this.inputPart.implicitContextEnabled, this.location, { selectedAgent: this._lastSelectedAgent });
                if (result) {
                    const inputState = this.collectInputState();
                    this.inputPart.acceptInput(isUserQuery ? input : undefined, isUserQuery ? inputState : undefined);
                    this._onDidSubmitAgent.fire({ agent: result.agent, slashCommand: result.slashCommand });
                    result.responseCompletePromise.then(async () => {
                        const responses = this.viewModel?.getItems().filter(chatViewModel_1.isResponseVM);
                        const lastResponse = responses?.[responses.length - 1];
                        this.chatAccessibilityService.acceptResponse(lastResponse, requestId);
                    });
                }
            }
        }
        getCodeBlockInfosForResponse(response) {
            return this.renderer.getCodeBlockInfosForResponse(response);
        }
        getCodeBlockInfoForEditor(uri) {
            return this.renderer.getCodeBlockInfoForEditor(uri);
        }
        getFileTreeInfosForResponse(response) {
            return this.renderer.getFileTreeInfosForResponse(response);
        }
        getLastFocusedFileTreeForResponse(response) {
            return this.renderer.getLastFocusedFileTreeForResponse(response);
        }
        focusLastMessage() {
            if (!this.viewModel) {
                return;
            }
            const items = this.tree.getNode(null).children;
            const lastItem = items[items.length - 1];
            if (!lastItem) {
                return;
            }
            this.tree.setFocus([lastItem.element]);
            this.tree.domFocus();
        }
        layout(height, width) {
            width = Math.min(width, 850);
            this.bodyDimension = new dom.Dimension(width, height);
            this.inputPart.layout(height, width);
            const inputPartHeight = this.inputPart.inputPartHeight;
            const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
            const listHeight = height - inputPartHeight;
            this.tree.layout(listHeight, width);
            this.tree.getHTMLElement().style.height = `${listHeight}px`;
            this.renderer.layout(width);
            if (lastElementVisible) {
                revealLastElement(this.tree);
            }
            this.listContainer.style.height = `${height - inputPartHeight}px`;
            this._onDidChangeHeight.fire(height);
        }
        // An alternative to layout, this allows you to specify the number of ChatTreeItems
        // you want to show, and the max height of the container. It will then layout the
        // tree to show that many items.
        // TODO@TylerLeonhardt: This could use some refactoring to make it clear which layout strategy is being used
        setDynamicChatTreeItemLayout(numOfChatTreeItems, maxHeight) {
            this._dynamicMessageLayoutData = { numOfMessages: numOfChatTreeItems, maxHeight, enabled: true };
            this._register(this.renderer.onDidChangeItemHeight(() => this.layoutDynamicChatTreeItemMode()));
            const mutableDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.tree.onDidScroll((e) => {
                // TODO@TylerLeonhardt this should probably just be disposed when this is disabled
                // and then set up again when it is enabled again
                if (!this._dynamicMessageLayoutData?.enabled) {
                    return;
                }
                mutableDisposable.value = dom.scheduleAtNextAnimationFrame(dom.getWindow(this.listContainer), () => {
                    if (!e.scrollTopChanged || e.heightChanged || e.scrollHeightChanged) {
                        return;
                    }
                    const renderHeight = e.height;
                    const diff = e.scrollHeight - renderHeight - e.scrollTop;
                    if (diff === 0) {
                        return;
                    }
                    const possibleMaxHeight = (this._dynamicMessageLayoutData?.maxHeight ?? maxHeight);
                    const width = this.bodyDimension?.width ?? this.container.offsetWidth;
                    this.inputPart.layout(possibleMaxHeight, width);
                    const inputPartHeight = this.inputPart.inputPartHeight;
                    const newHeight = Math.min(renderHeight + diff, possibleMaxHeight - inputPartHeight);
                    this.layout(newHeight + inputPartHeight, width);
                });
            }));
        }
        updateDynamicChatTreeItemLayout(numOfChatTreeItems, maxHeight) {
            this._dynamicMessageLayoutData = { numOfMessages: numOfChatTreeItems, maxHeight, enabled: true };
            let hasChanged = false;
            let height = this.bodyDimension.height;
            let width = this.bodyDimension.width;
            if (maxHeight < this.bodyDimension.height) {
                height = maxHeight;
                hasChanged = true;
            }
            const containerWidth = this.container.offsetWidth;
            if (this.bodyDimension?.width !== containerWidth) {
                width = containerWidth;
                hasChanged = true;
            }
            if (hasChanged) {
                this.layout(height, width);
            }
        }
        get isDynamicChatTreeItemLayoutEnabled() {
            return this._dynamicMessageLayoutData?.enabled ?? false;
        }
        set isDynamicChatTreeItemLayoutEnabled(value) {
            if (!this._dynamicMessageLayoutData) {
                return;
            }
            this._dynamicMessageLayoutData.enabled = value;
        }
        layoutDynamicChatTreeItemMode() {
            if (!this.viewModel || !this._dynamicMessageLayoutData?.enabled) {
                return;
            }
            const width = this.bodyDimension?.width ?? this.container.offsetWidth;
            this.inputPart.layout(this._dynamicMessageLayoutData.maxHeight, width);
            const inputHeight = this.inputPart.inputPartHeight;
            const totalMessages = this.viewModel.getItems();
            // grab the last N messages
            const messages = totalMessages.slice(-this._dynamicMessageLayoutData.numOfMessages);
            const needsRerender = messages.some(m => m.currentRenderedHeight === undefined);
            const listHeight = needsRerender
                ? this._dynamicMessageLayoutData.maxHeight
                : messages.reduce((acc, message) => acc + message.currentRenderedHeight, 0);
            this.layout(Math.min(
            // we add an additional 18px in order to show that there is scrollable content
            inputHeight + listHeight + (totalMessages.length > 2 ? 18 : 0), this._dynamicMessageLayoutData.maxHeight), width);
            if (needsRerender || !listHeight) {
                // TODO: figure out a better place to reveal the last element
                revealLastElement(this.tree);
            }
        }
        saveState() {
            this.inputPart.saveState();
        }
        getViewState() {
            this.inputPart.saveState();
            return { inputValue: this.getInput(), inputState: this.collectInputState() };
        }
    };
    exports.ChatWidget = ChatWidget;
    exports.ChatWidget = ChatWidget = ChatWidget_1 = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, chatService_1.IChatService),
        __param(8, chatAgents_1.IChatAgentService),
        __param(9, chat_1.IChatWidgetService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, chat_1.IChatAccessibilityService),
        __param(12, log_1.ILogService),
        __param(13, themeService_1.IThemeService),
        __param(14, chatSlashCommands_1.IChatSlashCommandService)
    ], ChatWidget);
    let ChatWidgetService = class ChatWidgetService {
        get lastFocusedWidget() {
            return this._lastFocusedWidget;
        }
        constructor(viewsService, chatContributionService) {
            this.viewsService = viewsService;
            this.chatContributionService = chatContributionService;
            this._widgets = [];
            this._lastFocusedWidget = undefined;
        }
        getWidgetByInputUri(uri) {
            return this._widgets.find(w => (0, resources_1.isEqual)(w.inputUri, uri));
        }
        getWidgetBySessionId(sessionId) {
            return this._widgets.find(w => w.viewModel?.sessionId === sessionId);
        }
        async revealViewForProvider(providerId) {
            const viewId = this.chatContributionService.getViewIdForProvider(providerId);
            const view = await this.viewsService.openView(viewId);
            return view?.widget;
        }
        setLastFocusedWidget(widget) {
            if (widget === this._lastFocusedWidget) {
                return;
            }
            this._lastFocusedWidget = widget;
        }
        register(newWidget) {
            if (this._widgets.some(widget => widget === newWidget)) {
                throw new Error('Cannot register the same widget multiple times');
            }
            this._widgets.push(newWidget);
            return (0, lifecycle_1.combinedDisposable)(newWidget.onDidFocus(() => this.setLastFocusedWidget(newWidget)), (0, lifecycle_1.toDisposable)(() => this._widgets.splice(this._widgets.indexOf(newWidget), 1)));
        }
    };
    exports.ChatWidgetService = ChatWidgetService;
    exports.ChatWidgetService = ChatWidgetService = __decorate([
        __param(0, viewsService_1.IViewsService),
        __param(1, chatContributionService_1.IChatContributionService)
    ], ChatWidgetService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBDaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixTQUFTLGlCQUFpQixDQUFDLElBQThCO1FBQ3hELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQ3hELENBQUM7SUE2Qk0sSUFBTSxVQUFVLEdBQWhCLE1BQU0sVUFBVyxTQUFRLHNCQUFVOztpQkFDbEIsYUFBUSxHQUFrRSxFQUFFLEFBQXBFLENBQXFFO1FBK0NwRyxJQUFXLE9BQU87WUFDakIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFNRCxJQUFZLFNBQVMsQ0FBQyxTQUFvQztZQUN6RCxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBRWxDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUdELElBQUksV0FBVztZQUNkLElB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