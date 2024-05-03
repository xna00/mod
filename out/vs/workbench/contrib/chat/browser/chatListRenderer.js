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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/button/button", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/themables", "vs/base/common/uri", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatFollowups", "vs/workbench/contrib/chat/browser/chatMarkdownDecorationsRenderer", "vs/workbench/contrib/chat/browser/codeBlockPart", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/chat/common/chatWordCounter", "vs/workbench/contrib/files/browser/views/explorerView", "../common/annotations"], function (require, exports, dom, aria_1, button_1, iconLabels_1, arrays_1, async_1, codicons_1, event_1, htmlContent_1, lifecycle_1, map_1, network_1, numbers_1, path_1, resources_1, strings_1, themables_1, uri_1, markdownRenderer_1, range_1, resolverService_1, nls_1, menuEntryActionViewItem_1, toolbar_1, actions_1, commands_1, configuration_1, contextkey_1, files_1, instantiation_1, serviceCollection_1, listService_1, log_1, opener_1, defaultStyles_1, theme_1, themeService_1, labels_1, chat_1, chatFollowups_1, chatMarkdownDecorationsRenderer_1, codeBlockPart_1, chatContextKeys_1, chatParserTypes_1, chatService_1, chatVariables_1, chatViewModel_1, chatWordCounter_1, explorerView_1, annotations_1) {
    "use strict";
    var ChatListItemRenderer_1, ContentReferencesListRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatListDelegate = exports.ChatListItemRenderer = void 0;
    const $ = dom.$;
    const forceVerboseLayoutTracing = false;
    let ChatListItemRenderer = class ChatListItemRenderer extends lifecycle_1.Disposable {
        static { ChatListItemRenderer_1 = this; }
        static { this.ID = 'item'; }
        constructor(editorOptions, location, rendererOptions, delegate, codeBlockModelCollection, overflowWidgetsDomNode, instantiationService, configService, logService, openerService, contextKeyService, themeService, commandService, textModelService) {
            super();
            this.location = location;
            this.rendererOptions = rendererOptions;
            this.delegate = delegate;
            this.codeBlockModelCollection = codeBlockModelCollection;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.openerService = openerService;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.commandService = commandService;
            this.textModelService = textModelService;
            this.codeBlocksByResponseId = new Map();
            this.codeBlocksByEditorUri = new map_1.ResourceMap();
            this.fileTreesByResponseId = new Map();
            this.focusedFileTreesByResponseId = new Map();
            this._onDidClickFollowup = this._register(new event_1.Emitter());
            this.onDidClickFollowup = this._onDidClickFollowup.event;
            this._onDidChangeItemHeight = this._register(new event_1.Emitter());
            this.onDidChangeItemHeight = this._onDidChangeItemHeight.event;
            this._currentLayoutWidth = 0;
            this._isVisible = true;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this._usedReferencesEnabled = false;
            this.renderer = this._register(this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {}));
            this.markdownDecorationsRenderer = this.instantiationService.createInstance(chatMarkdownDecorationsRenderer_1.ChatMarkdownDecorationsRenderer);
            this._editorPool = this._register(this.instantiationService.createInstance(EditorPool, editorOptions, delegate, overflowWidgetsDomNode));
            this._treePool = this._register(this.instantiationService.createInstance(TreePool, this._onDidChangeVisibility.event));
            this._contentReferencesListPool = this._register(this.instantiationService.createInstance(ContentReferencesListPool, this._onDidChangeVisibility.event));
            this._register(this.instantiationService.createInstance(codeBlockPart_1.ChatCodeBlockContentProvider));
            this._usedReferencesEnabled = configService.getValue('chat.experimental.usedReferences') ?? true;
            this._register(configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('chat.experimental.usedReferences')) {
                    this._usedReferencesEnabled = configService.getValue('chat.experimental.usedReferences') ?? true;
                }
            }));
        }
        get templateId() {
            return ChatListItemRenderer_1.ID;
        }
        editorsInUse() {
            return this._editorPool.inUse();
        }
        traceLayout(method, message) {
            if (forceVerboseLayoutTracing) {
                this.logService.info(`ChatListItemRenderer#${method}: ${message}`);
            }
            else {
                this.logService.trace(`ChatListItemRenderer#${method}: ${message}`);
            }
        }
        getProgressiveRenderRate(element) {
            if (element.isComplete) {
                return 80;
            }
            if (element.contentUpdateTimings && element.contentUpdateTimings.impliedWordLoadRate) {
                // words/s
                const minRate = 12;
                const maxRate = 80;
                // This doesn't account for dead time after the last update. When the previous update is the final one and the model is only waiting for followupQuestions, that's good.
                // When there was one quick update and then you are waiting longer for the next one, that's not good since the rate should be decreasing.
                // If it's an issue, we can change this to be based on the total time from now to the beginning.
                const rateBoost = 1.5;
                const rate = element.contentUpdateTimings.impliedWordLoadRate * rateBoost;
                return (0, numbers_1.clamp)(rate, minRate, maxRate);
            }
            return 8;
        }
        getCodeBlockInfosForResponse(response) {
            const codeBlocks = this.codeBlocksByResponseId.get(response.id);
            return codeBlocks ?? [];
        }
        getCodeBlockInfoForEditor(uri) {
            return this.codeBlocksByEditorUri.get(uri);
        }
        getFileTreeInfosForResponse(response) {
            const fileTrees = this.fileTreesByResponseId.get(response.id);
            return fileTrees ?? [];
        }
        getLastFocusedFileTreeForResponse(response) {
            const fileTrees = this.fileTreesByResponseId.get(response.id);
            const lastFocusedFileTreeIndex = this.focusedFileTreesByResponseId.get(response.id);
            if (fileTrees?.length && lastFocusedFileTreeIndex !== undefined && lastFocusedFileTreeIndex < fileTrees.length) {
                return fileTrees[lastFocusedFileTreeIndex];
            }
            return undefined;
        }
        setVisible(visible) {
            this._isVisible = visible;
            this._onDidChangeVisibility.fire(visible);
        }
        layout(width) {
            this._currentLayoutWidth = width - (this.rendererOptions.noPadding ? 0 : 40); // padding
            for (const editor of this._editorPool.inUse()) {
                editor.layout(this._currentLayoutWidth);
            }
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const rowContainer = dom.append(container, $('.interactive-item-container'));
            if (this.rendererOptions.renderStyle === 'compact') {
                rowContainer.classList.add('interactive-item-compact');
            }
            if (this.rendererOptions.noPadding) {
                rowContainer.classList.add('no-padding');
            }
            const header = dom.append(rowContainer, $('.header'));
            const user = dom.append(header, $('.user'));
            const avatarContainer = dom.append(user, $('.avatar-container'));
            const agentAvatarContainer = dom.append(user, $('.agent-avatar-container'));
            const username = dom.append(user, $('h3.username'));
            const detailContainer = dom.append(user, $('span.detail-container'));
            const detail = dom.append(detailContainer, $('span.detail'));
            dom.append(detailContainer, $('span.chat-animated-ellipsis'));
            const referencesListContainer = dom.append(rowContainer, $('.referencesListContainer'));
            const value = dom.append(rowContainer, $('.value'));
            const elementDisposables = new lifecycle_1.DisposableStore();
            const contextKeyService = templateDisposables.add(this.contextKeyService.createScoped(rowContainer));
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyService]));
            let titleToolbar;
            if (this.rendererOptions.noHeader) {
                header.classList.add('hidden');
            }
            else {
                titleToolbar = templateDisposables.add(scopedInstantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, header, actions_1.MenuId.ChatMessageTitle, {
                    menuOptions: {
                        shouldForwardArgs: true
                    },
                    toolbarOptions: {
                        shouldInlineSubmenu: submenu => submenu.actions.length <= 1
                    },
                    actionViewItemProvider: (action, options) => {
                        if (action instanceof actions_1.MenuItemAction && (action.item.id === 'workbench.action.chat.voteDown' || action.item.id === 'workbench.action.chat.voteUp')) {
                            return scopedInstantiationService.createInstance(ChatVoteButton, action, options);
                        }
                        return (0, menuEntryActionViewItem_1.createActionViewItem)(scopedInstantiationService, action, options);
                    }
                }));
            }
            const template = { avatarContainer, agentAvatarContainer, username, detail, referencesListContainer, value, rowContainer, elementDisposables, titleToolbar, templateDisposables, contextKeyService };
            return template;
        }
        renderElement(node, index, templateData) {
            this.renderChatTreeItem(node.element, index, templateData);
        }
        renderChatTreeItem(element, index, templateData) {
            const kind = (0, chatViewModel_1.isRequestVM)(element) ? 'request' :
                (0, chatViewModel_1.isResponseVM)(element) ? 'response' :
                    'welcome';
            this.traceLayout('renderElement', `${kind}, index=${index}`);
            chatContextKeys_1.CONTEXT_RESPONSE.bindTo(templateData.contextKeyService).set((0, chatViewModel_1.isResponseVM)(element));
            chatContextKeys_1.CONTEXT_REQUEST.bindTo(templateData.contextKeyService).set((0, chatViewModel_1.isRequestVM)(element));
            chatContextKeys_1.CONTEXT_RESPONSE_DETECTED_AGENT_COMMAND.bindTo(templateData.contextKeyService).set((0, chatViewModel_1.isResponseVM)(element) && element.agentOrSlashCommandDetected);
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                chatContextKeys_1.CONTEXT_CHAT_RESPONSE_SUPPORT_ISSUE_REPORTING.bindTo(templateData.contextKeyService).set(!!element.agent?.metadata.supportIssueReporting);
                chatContextKeys_1.CONTEXT_RESPONSE_VOTE.bindTo(templateData.contextKeyService).set(element.vote === chatService_1.InteractiveSessionVoteDirection.Up ? 'up' : element.vote === chatService_1.InteractiveSessionVoteDirection.Down ? 'down' : '');
            }
            else {
                chatContextKeys_1.CONTEXT_RESPONSE_VOTE.bindTo(templateData.contextKeyService).set('');
            }
            if (templateData.titleToolbar) {
                templateData.titleToolbar.context = element;
            }
            const isFiltered = !!((0, chatViewModel_1.isResponseVM)(element) && element.errorDetails?.responseIsFiltered);
            chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.bindTo(templateData.contextKeyService).set(isFiltered);
            templateData.rowContainer.classList.toggle('interactive-request', (0, chatViewModel_1.isRequestVM)(element));
            templateData.rowContainer.classList.toggle('interactive-response', (0, chatViewModel_1.isResponseVM)(element));
            templateData.rowContainer.classList.toggle('interactive-welcome', (0, chatViewModel_1.isWelcomeVM)(element));
            templateData.rowContainer.classList.toggle('filtered-response', isFiltered);
            templateData.rowContainer.classList.toggle('show-detail-progress', (0, chatViewModel_1.isResponseVM)(element) && !element.isComplete && !element.progressMessages.length);
            templateData.username.textContent = element.username;
            if (!this.rendererOptions.noHeader) {
                this.renderAvatar(element, templateData);
            }
            dom.clearNode(templateData.detail);
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                this.renderDetail(element, templateData);
            }
            // Do a progressive render if
            // - This the last response in the list
            // - And it has some content
            // - And the response is not complete
            //   - Or, we previously started a progressive rendering of this element (if the element is complete, we will finish progressive rendering with a very fast rate)
            // - And, the feature is not disabled in configuration
            if ((0, chatViewModel_1.isResponseVM)(element) && index === this.delegate.getListLength() - 1 && (!element.isComplete || element.renderData) && element.response.value.length) {
                this.traceLayout('renderElement', `start progressive render ${kind}, index=${index}`);
                const progressiveRenderingDisposables = templateData.elementDisposables.add(new lifecycle_1.DisposableStore());
                const timer = templateData.elementDisposables.add(new dom.WindowIntervalTimer());
                const runProgressiveRender = (initial) => {
                    try {
                        if (this.doNextProgressiveRender(element, index, templateData, !!initial, progressiveRenderingDisposables)) {
                            timer.cancel();
                        }
                    }
                    catch (err) {
                        // Kill the timer if anything went wrong, avoid getting stuck in a nasty rendering loop.
                        timer.cancel();
                        throw err;
                    }
                };
                timer.cancelAndSet(runProgressiveRender, 50, dom.getWindow(templateData.rowContainer));
                runProgressiveRender(true);
            }
            else if ((0, chatViewModel_1.isResponseVM)(element)) {
                const renderableResponse = (0, annotations_1.annotateSpecialMarkdownContent)(element.response.value);
                this.basicRenderElement(renderableResponse, element, index, templateData);
            }
            else if ((0, chatViewModel_1.isRequestVM)(element)) {
                const markdown = 'message' in element.message ?
                    element.message.message :
                    this.markdownDecorationsRenderer.convertParsedRequestToMarkdown(element.message);
                this.basicRenderElement([{ content: new htmlContent_1.MarkdownString(markdown), kind: 'markdownContent' }], element, index, templateData);
            }
            else {
                this.renderWelcomeMessage(element, templateData);
            }
        }
        renderDetail(element, templateData) {
            let progressMsg = '';
            if (element.agent && !element.agent.isDefault) {
                let usingMsg = chatParserTypes_1.chatAgentLeader + element.agent.name;
                if (element.slashCommand) {
                    usingMsg += ` ${chatParserTypes_1.chatSubcommandLeader}${element.slashCommand.name}`;
                }
                if (element.isComplete) {
                    progressMsg = (0, nls_1.localize)('usedAgent', "used {0}", usingMsg);
                }
                else {
                    progressMsg = (0, nls_1.localize)('usingAgent', "using {0}", usingMsg);
                }
            }
            else if (element.agentOrSlashCommandDetected) {
                const usingMsg = [];
                if (element.agent && !element.agent.isDefault) {
                    usingMsg.push(chatParserTypes_1.chatAgentLeader + element.agent.name);
                }
                if (element.slashCommand) {
                    usingMsg.push(chatParserTypes_1.chatSubcommandLeader + element.slashCommand.name);
                }
                if (usingMsg.length) {
                    if (element.isComplete) {
                        progressMsg = (0, nls_1.localize)('usedAgent', "used {0}", usingMsg.join(' '));
                    }
                    else {
                        progressMsg = (0, nls_1.localize)('usingAgent', "using {0}", usingMsg.join(' '));
                    }
                }
            }
            else if (!element.isComplete) {
                progressMsg = chat_1.GeneratingPhrase;
            }
            templateData.detail.textContent = progressMsg;
            if (element.agent) {
                templateData.detail.title = progressMsg + (element.slashCommand?.description ? `\n${element.slashCommand.description}` : '');
            }
            else {
                templateData.detail.title = '';
            }
        }
        renderAvatar(element, templateData) {
            if (uri_1.URI.isUri(element.avatarIcon)) {
                const avatarImgIcon = dom.$('img.icon');
                avatarImgIcon.src = network_1.FileAccess.uriToBrowserUri(element.avatarIcon).toString(true);
                templateData.avatarContainer.replaceChildren(dom.$('.avatar', undefined, avatarImgIcon));
            }
            else {
                const defaultIcon = (0, chatViewModel_1.isRequestVM)(element) ? codicons_1.Codicon.account : codicons_1.Codicon.copilot;
                const icon = element.avatarIcon ?? defaultIcon;
                const avatarIcon = dom.$(themables_1.ThemeIcon.asCSSSelector(icon));
                templateData.avatarContainer.replaceChildren(dom.$('.avatar.codicon-avatar', undefined, avatarIcon));
            }
            if ((0, chatViewModel_1.isResponseVM)(element) && element.agent && !element.agent.isDefault) {
                dom.show(templateData.agentAvatarContainer);
                const icon = this.getAgentIcon(element.agent.metadata);
                if (icon instanceof uri_1.URI) {
                    const avatarIcon = dom.$('img.icon');
                    avatarIcon.src = network_1.FileAccess.uriToBrowserUri(icon).toString(true);
                    templateData.agentAvatarContainer.replaceChildren(dom.$('.avatar', undefined, avatarIcon));
                }
                else if (icon) {
                    const avatarIcon = dom.$(themables_1.ThemeIcon.asCSSSelector(icon));
                    templateData.agentAvatarContainer.replaceChildren(dom.$('.avatar.codicon-avatar', undefined, avatarIcon));
                }
                else {
                    dom.hide(templateData.agentAvatarContainer);
                    return;
                }
                templateData.agentAvatarContainer.classList.toggle('complete', element.isComplete);
                if (!element.agentAvatarHasBeenRendered && !element.isComplete) {
                    element.agentAvatarHasBeenRendered = true;
                    templateData.agentAvatarContainer.classList.remove('loading');
                    templateData.elementDisposables.add((0, async_1.disposableTimeout)(() => {
                        templateData.agentAvatarContainer.classList.toggle('loading', !element.isComplete);
                    }, 100));
                }
                else {
                    templateData.agentAvatarContainer.classList.toggle('loading', !element.isComplete);
                }
            }
            else {
                dom.hide(templateData.agentAvatarContainer);
            }
        }
        getAgentIcon(agent) {
            if (agent.themeIcon) {
                return agent.themeIcon;
            }
            else {
                return this.themeService.getColorTheme().type === theme_1.ColorScheme.DARK && agent.iconDark ? agent.iconDark :
                    agent.icon;
            }
        }
        basicRenderElement(value, element, index, templateData) {
            const fillInIncompleteTokens = (0, chatViewModel_1.isResponseVM)(element) && (!element.isComplete || element.isCanceled || element.errorDetails?.responseIsFiltered || element.errorDetails?.responseIsIncomplete);
            dom.clearNode(templateData.value);
            dom.clearNode(templateData.referencesListContainer);
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                this.renderDetail(element, templateData);
            }
            this.renderContentReferencesIfNeeded(element, templateData, templateData.elementDisposables);
            let fileTreeIndex = 0;
            value.forEach((data, index) => {
                const result = data.kind === 'treeData'
                    ? this.renderTreeData(data.treeData, element, templateData, fileTreeIndex++)
                    : data.kind === 'markdownContent'
                        ? this.renderMarkdown(data.content, element, templateData, fillInIncompleteTokens)
                        : data.kind === 'progressMessage' && onlyProgressMessagesAfterI(value, index) ? this.renderProgressMessage(data, false) // TODO render command
                            : data.kind === 'command' ? this.renderCommandButton(element, data)
                                : undefined;
                if (result) {
                    templateData.value.appendChild(result.element);
                    templateData.elementDisposables.add(result);
                }
            });
            if ((0, chatViewModel_1.isResponseVM)(element) && element.errorDetails?.message) {
                const icon = element.errorDetails.responseIsFiltered ? codicons_1.Codicon.info : codicons_1.Codicon.error;
                const errorDetails = dom.append(templateData.value, $('.interactive-response-error-details', undefined, (0, iconLabels_1.renderIcon)(icon)));
                const renderedError = templateData.elementDisposables.add(this.renderer.render(new htmlContent_1.MarkdownString(element.errorDetails.message)));
                errorDetails.appendChild($('span', undefined, renderedError.element));
            }
            if ((0, chatViewModel_1.isResponseVM)(element) && element.isComplete && element.response.value.length === 0) {
                let madeChanges = false;
                for (const item of element.edits.values()) {
                    if (item.length > 0) {
                        madeChanges = true;
                        break;
                    }
                }
                if (madeChanges) {
                    dom.append(templateData.value, $('.interactive-edits-summary', undefined, (0, nls_1.localize)('editsSummary', "Made changes.")));
                }
            }
            const newHeight = templateData.rowContainer.offsetHeight;
            const fireEvent = !element.currentRenderedHeight || element.currentRenderedHeight !== newHeight;
            element.currentRenderedHeight = newHeight;
            if (fireEvent) {
                const disposable = templateData.elementDisposables.add(dom.scheduleAtNextAnimationFrame(dom.getWindow(templateData.value), () => {
                    disposable.dispose();
                    this._onDidChangeItemHeight.fire({ element, height: newHeight });
                }));
            }
        }
        renderWelcomeMessage(element, templateData) {
            dom.clearNode(templateData.value);
            dom.clearNode(templateData.referencesListContainer);
            dom.hide(templateData.referencesListContainer);
            for (const item of element.content) {
                if (Array.isArray(item)) {
                    const scopedInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, templateData.contextKeyService]));
                    templateData.elementDisposables.add(scopedInstaService.createInstance(chatFollowups_1.ChatFollowups, templateData.value, item, this.location, undefined, followup => this._onDidClickFollowup.fire(followup)));
                }
                else {
                    const result = this.renderMarkdown(item, element, templateData);
                    templateData.value.appendChild(result.element);
                    templateData.elementDisposables.add(result);
                }
            }
            const newHeight = templateData.rowContainer.offsetHeight;
            const fireEvent = !element.currentRenderedHeight || element.currentRenderedHeight !== newHeight;
            element.currentRenderedHeight = newHeight;
            if (fireEvent) {
                const disposable = templateData.elementDisposables.add(dom.scheduleAtNextAnimationFrame(dom.getWindow(templateData.value), () => {
                    disposable.dispose();
                    this._onDidChangeItemHeight.fire({ element, height: newHeight });
                }));
            }
        }
        /**
         *	@returns true if progressive rendering should be considered complete- the element's data is fully rendered or the view is not visible
         */
        doNextProgressiveRender(element, index, templateData, isInRenderElement, disposables) {
            if (!this._isVisible) {
                return true;
            }
            const renderableResponse = (0, annotations_1.annotateSpecialMarkdownContent)(element.response.value);
            let isFullyRendered = false;
            if (element.isCanceled) {
                this.traceLayout('runProgressiveRender', `canceled, index=${index}`);
                element.renderData = undefined;
                this.basicRenderElement(renderableResponse, element, index, templateData);
                isFullyRendered = true;
            }
            else {
                // Figure out what we need to render in addition to what has already been rendered
                element.renderData ??= { renderedParts: [] };
                const renderedParts = element.renderData.renderedParts;
                const wordCountResults = [];
                const partsToRender = [];
                let somePartIsNotFullyRendered = false;
                renderableResponse.forEach((part, index) => {
                    const renderedPart = renderedParts[index];
                    // Is this part completely new?
                    if (!renderedPart) {
                        if (part.kind === 'treeData') {
                            partsToRender[index] = part.treeData;
                        }
                        else if (part.kind === 'progressMessage') {
                            partsToRender[index] = {
                                progressMessage: part,
                                isAtEndOfResponse: onlyProgressMessagesAfterI(renderableResponse, index),
                                isLast: index === renderableResponse.length - 1,
                            };
                        }
                        else if (part.kind === 'command') {
                            partsToRender[index] = part;
                        }
                        else {
                            const wordCountResult = this.getDataForProgressiveRender(element, contentToMarkdown(part.content), { renderedWordCount: 0, lastRenderTime: 0 });
                            if (wordCountResult !== undefined) {
                                this.traceLayout('doNextProgressiveRender', `Rendering new part ${index}, wordCountResult=${wordCountResult.actualWordCount}, rate=${wordCountResult.rate}`);
                                partsToRender[index] = {
                                    renderedWordCount: wordCountResult.actualWordCount,
                                    lastRenderTime: Date.now(),
                                    isFullyRendered: wordCountResult.isFullString,
                                };
                                wordCountResults[index] = wordCountResult;
                            }
                        }
                    }
                    // Did this part's content change?
                    else if ((part.kind === 'markdownContent' || part.kind === 'progressMessage') && isMarkdownRenderData(renderedPart)) { // TODO
                        const wordCountResult = this.getDataForProgressiveRender(element, contentToMarkdown(part.content), renderedPart);
                        // Check if there are any new words to render
                        if (wordCountResult !== undefined && renderedPart.renderedWordCount !== wordCountResult?.actualWordCount) {
                            this.traceLayout('doNextProgressiveRender', `Rendering changed part ${index}, wordCountResult=${wordCountResult.actualWordCount}, rate=${wordCountResult.rate}`);
                            partsToRender[index] = {
                                renderedWordCount: wordCountResult.actualWordCount,
                                lastRenderTime: Date.now(),
                                isFullyRendered: wordCountResult.isFullString,
                            };
                            wordCountResults[index] = wordCountResult;
                        }
                        else if (!renderedPart.isFullyRendered && !wordCountResult) {
                            // This part is not fully rendered, but not enough time has passed to render more content
                            somePartIsNotFullyRendered = true;
                        }
                    }
                    // Is it a progress message that needs to be rerendered?
                    else if (part.kind === 'progressMessage' && isProgressMessageRenderData(renderedPart) && ((renderedPart.isAtEndOfResponse !== onlyProgressMessagesAfterI(renderableResponse, index)) ||
                        renderedPart.isLast !== (index === renderableResponse.length - 1))) {
                        partsToRender[index] = {
                            progressMessage: part,
                            isAtEndOfResponse: onlyProgressMessagesAfterI(renderableResponse, index),
                            isLast: index === renderableResponse.length - 1,
                        };
                    }
                });
                isFullyRendered = partsToRender.length === 0 && !somePartIsNotFullyRendered;
                if (isFullyRendered && element.isComplete) {
                    // Response is done and content is rendered, so do a normal render
                    this.traceLayout('runProgressiveRender', `end progressive render, index=${index} and clearing renderData, response is complete, index=${index}`);
                    element.renderData = undefined;
                    disposables.clear();
                    this.basicRenderElement(renderableResponse, element, index, templateData);
                }
                else if (!isFullyRendered) {
                    disposables.clear();
                    this.renderContentReferencesIfNeeded(element, templateData, disposables);
                    let hasRenderedOneMarkdownBlock = false;
                    partsToRender.forEach((partToRender, index) => {
                        if (!partToRender) {
                            return;
                        }
                        // Undefined => don't do anything. null => remove the rendered element
                        let result;
                        if (isInteractiveProgressTreeData(partToRender)) {
                            result = this.renderTreeData(partToRender, element, templateData, index);
                        }
                        else if (isProgressMessageRenderData(partToRender)) {
                            if (onlyProgressMessageRenderDatasAfterI(partsToRender, index)) {
                                result = this.renderProgressMessage(partToRender.progressMessage, index === partsToRender.length - 1);
                            }
                            else {
                                result = null;
                            }
                        }
                        else if (isCommandButtonRenderData(partToRender)) {
                            result = this.renderCommandButton(element, partToRender);
                        }
                        // Avoid doing progressive rendering for multiple markdown parts simultaneously
                        else if (!hasRenderedOneMarkdownBlock && wordCountResults[index]) {
                            const { value } = wordCountResults[index];
                            result = this.renderMarkdown(new htmlContent_1.MarkdownString(value), element, templateData, true);
                            hasRenderedOneMarkdownBlock = true;
                        }
                        if (result === undefined) {
                            return;
                        }
                        // Doing the progressive render
                        renderedParts[index] = partToRender;
                        const existingElement = templateData.value.children[index];
                        if (existingElement) {
                            if (result === null) {
                                templateData.value.replaceChild($('span.placeholder-for-deleted-thing'), existingElement);
                            }
                            else {
                                templateData.value.replaceChild(result.element, existingElement);
                            }
                        }
                        else if (result) {
                            templateData.value.appendChild(result.element);
                        }
                        if (result) {
                            disposables.add(result);
                        }
                    });
                }
                else {
                    // Nothing new to render, not done, keep waiting
                    return false;
                }
            }
            // Some render happened - update the height
            const height = templateData.rowContainer.offsetHeight;
            element.currentRenderedHeight = height;
            if (!isInRenderElement) {
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
            }
            return isFullyRendered;
        }
        renderTreeData(data, element, templateData, treeDataIndex) {
            const treeDisposables = new lifecycle_1.DisposableStore();
            const ref = treeDisposables.add(this._treePool.get());
            const tree = ref.object;
            treeDisposables.add(tree.onDidOpen((e) => {
                if (e.element && !('children' in e.element)) {
                    this.openerService.open(e.element.uri);
                }
            }));
            treeDisposables.add(tree.onDidChangeCollapseState(() => {
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
            }));
            treeDisposables.add(tree.onContextMenu((e) => {
                e.browserEvent.preventDefault();
                e.browserEvent.stopPropagation();
            }));
            tree.setInput(data).then(() => {
                if (!ref.isStale()) {
                    tree.layout();
                    this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
                }
            });
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                const fileTreeFocusInfo = {
                    treeDataId: data.uri.toString(),
                    treeIndex: treeDataIndex,
                    focus() {
                        tree.domFocus();
                    }
                };
                treeDisposables.add(tree.onDidFocus(() => {
                    this.focusedFileTreesByResponseId.set(element.id, fileTreeFocusInfo.treeIndex);
                }));
                const fileTrees = this.fileTreesByResponseId.get(element.id) ?? [];
                fileTrees.push(fileTreeFocusInfo);
                this.fileTreesByResponseId.set(element.id, (0, arrays_1.distinct)(fileTrees, (v) => v.treeDataId));
                treeDisposables.add((0, lifecycle_1.toDisposable)(() => this.fileTreesByResponseId.set(element.id, fileTrees.filter(v => v.treeDataId !== data.uri.toString()))));
            }
            return {
                element: tree.getHTMLElement().parentElement,
                dispose: () => {
                    treeDisposables.dispose();
                }
            };
        }
        renderContentReferencesIfNeeded(element, templateData, disposables) {
            dom.clearNode(templateData.referencesListContainer);
            if ((0, chatViewModel_1.isResponseVM)(element) && this._usedReferencesEnabled && element.contentReferences.length) {
                dom.show(templateData.referencesListContainer);
                const contentReferencesListResult = this.renderContentReferencesListData(element.contentReferences, element, templateData);
                templateData.referencesListContainer.appendChild(contentReferencesListResult.element);
                disposables.add(contentReferencesListResult);
            }
            else {
                dom.hide(templateData.referencesListContainer);
            }
        }
        renderContentReferencesListData(data, element, templateData) {
            const listDisposables = new lifecycle_1.DisposableStore();
            const referencesLabel = data.length > 1 ?
                (0, nls_1.localize)('usedReferencesPlural', "Used {0} references", data.length) :
                (0, nls_1.localize)('usedReferencesSingular', "Used {0} reference", 1);
            const iconElement = $('.chat-used-context-icon');
            const icon = (element) => element.usedReferencesExpanded ? codicons_1.Codicon.chevronDown : codicons_1.Codicon.chevronRight;
            iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon(element)));
            const buttonElement = $('.chat-used-context-label', undefined);
            const collapseButton = listDisposables.add(new button_1.Button(buttonElement, {
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined,
                buttonSecondaryBackground: undefined,
                buttonSecondaryForeground: undefined,
                buttonSecondaryHoverBackground: undefined,
                buttonSeparator: undefined
            }));
            const container = $('.chat-used-context', undefined, buttonElement);
            collapseButton.label = referencesLabel;
            collapseButton.element.append(iconElement);
            this.updateAriaLabel(collapseButton.element, referencesLabel, element.usedReferencesExpanded);
            container.classList.toggle('chat-used-context-collapsed', !element.usedReferencesExpanded);
            listDisposables.add(collapseButton.onDidClick(() => {
                iconElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(icon(element)));
                element.usedReferencesExpanded = !element.usedReferencesExpanded;
                iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon(element)));
                container.classList.toggle('chat-used-context-collapsed', !element.usedReferencesExpanded);
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
                this.updateAriaLabel(collapseButton.element, referencesLabel, element.usedReferencesExpanded);
            }));
            const ref = listDisposables.add(this._contentReferencesListPool.get());
            const list = ref.object;
            container.appendChild(list.getHTMLElement().parentElement);
            listDisposables.add(list.onDidOpen((e) => {
                if (e.element) {
                    const uriOrLocation = 'variableName' in e.element.reference ? e.element.reference.value : e.element.reference;
                    const uri = uri_1.URI.isUri(uriOrLocation) ? uriOrLocation :
                        uriOrLocation?.uri;
                    if (uri) {
                        this.openerService.open(uri, {
                            fromUserGesture: true,
                            editorOptions: {
                                ...e.editorOptions,
                                ...{
                                    selection: uriOrLocation && 'range' in uriOrLocation ? uriOrLocation.range : undefined
                                }
                            }
                        });
                    }
                }
            }));
            listDisposables.add(list.onContextMenu((e) => {
                e.browserEvent.preventDefault();
                e.browserEvent.stopPropagation();
            }));
            const maxItemsShown = 6;
            const itemsShown = Math.min(data.length, maxItemsShown);
            const height = itemsShown * 22;
            list.layout(height);
            list.getHTMLElement().style.height = `${height}px`;
            list.splice(0, list.length, data);
            return {
                element: container,
                dispose: () => {
                    listDisposables.dispose();
                }
            };
        }
        updateAriaLabel(element, label, expanded) {
            element.ariaLabel = expanded ? (0, nls_1.localize)('usedReferencesExpanded', "{0}, expanded", label) : (0, nls_1.localize)('usedReferencesCollapsed', "{0}, collapsed", label);
        }
        renderProgressMessage(progress, showSpinner) {
            if (showSpinner) {
                // this step is in progress, communicate it to SR users
                (0, aria_1.alert)(progress.content.value);
            }
            const codicon = showSpinner ? themables_1.ThemeIcon.modify(codicons_1.Codicon.sync, 'spin').id : codicons_1.Codicon.check.id;
            const markdown = new htmlContent_1.MarkdownString(`$(${codicon}) ${progress.content.value}`, {
                supportThemeIcons: true
            });
            const result = this.renderer.render(markdown);
            result.element.classList.add('progress-step');
            return result;
        }
        renderCommandButton(element, commandButton) {
            const container = $('.chat-command-button');
            const disposables = new lifecycle_1.DisposableStore();
            const enabled = !(0, chatViewModel_1.isResponseVM)(element) || !element.isStale;
            const tooltip = enabled ?
                commandButton.command.tooltip :
                (0, nls_1.localize)('commandButtonDisabled', "Button not available in restored chat");
            const button = disposables.add(new button_1.Button(container, { ...defaultStyles_1.defaultButtonStyles, supportIcons: true, title: tooltip }));
            button.label = commandButton.command.title;
            button.enabled = enabled;
            // TODO still need telemetry for command buttons
            disposables.add(button.onDidClick(() => this.commandService.executeCommand(commandButton.command.id, ...(commandButton.command.arguments ?? []))));
            return {
                dispose() {
                    disposables.dispose();
                },
                element: container
            };
        }
        renderMarkdown(markdown, element, templateData, fillInIncompleteTokens = false) {
            const disposables = new lifecycle_1.DisposableStore();
            markdown = new htmlContent_1.MarkdownString(markdown.value, {
                isTrusted: {
                    // Disable all other config options except isTrusted
                    enabledCommands: typeof markdown.isTrusted === 'object' ? markdown.isTrusted?.enabledCommands : [] ?? []
                }
            });
            // We release editors in order so that it's more likely that the same editor will be assigned if this element is re-rendered right away, like it often is during progressive rendering
            const orderedDisposablesList = [];
            const codeblocks = [];
            let codeBlockIndex = 0;
            const result = this.renderer.render(markdown, {
                fillInIncompleteTokens,
                codeBlockRendererSync: (languageId, text) => {
                    const index = codeBlockIndex++;
                    let textModel;
                    let range;
                    let vulns;
                    if ((0, strings_1.equalsIgnoreCase)(languageId, codeBlockPart_1.localFileLanguageId)) {
                        try {
                            const parsedBody = (0, codeBlockPart_1.parseLocalFileData)(text);
                            range = parsedBody.range && range_1.Range.lift(parsedBody.range);
                            textModel = this.textModelService.createModelReference(parsedBody.uri).then(ref => ref.object);
                        }
                        catch (e) {
                            return $('div');
                        }
                    }
                    else {
                        if (!(0, chatViewModel_1.isRequestVM)(element) && !(0, chatViewModel_1.isResponseVM)(element)) {
                            console.error('Trying to render code block in welcome', element.id, index);
                            return $('div');
                        }
                        const sessionId = (0, chatViewModel_1.isResponseVM)(element) || (0, chatViewModel_1.isRequestVM)(element) ? element.sessionId : '';
                        const modelEntry = this.codeBlockModelCollection.getOrCreate(sessionId, element, index);
                        vulns = modelEntry.vulns;
                        textModel = modelEntry.model;
                    }
                    const hideToolbar = (0, chatViewModel_1.isResponseVM)(element) && element.errorDetails?.responseIsFiltered;
                    const ref = this.renderCodeBlock({ languageId, textModel, codeBlockIndex: index, element, range, hideToolbar, parentContextKeyService: templateData.contextKeyService, vulns }, text);
                    // Attach this after updating text/layout of the editor, so it should only be fired when the size updates later (horizontal scrollbar, wrapping)
                    // not during a renderElement OR a progressive render (when we will be firing this event anyway at the end of the render)
                    disposables.add(ref.object.onDidChangeContentHeight(() => {
                        ref.object.layout(this._currentLayoutWidth);
                        this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
                    }));
                    if ((0, chatViewModel_1.isResponseVM)(element)) {
                        const info = {
                            codeBlockIndex: index,
                            element,
                            focus() {
                                ref.object.focus();
                            }
                        };
                        codeblocks.push(info);
                        if (ref.object.uri) {
                            const uri = ref.object.uri;
                            this.codeBlocksByEditorUri.set(uri, info);
                            disposables.add((0, lifecycle_1.toDisposable)(() => this.codeBlocksByEditorUri.delete(uri)));
                        }
                    }
                    orderedDisposablesList.push(ref);
                    return ref.object.element;
                },
                asyncRenderCallback: () => this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight }),
            });
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                this.codeBlocksByResponseId.set(element.id, codeblocks);
                disposables.add((0, lifecycle_1.toDisposable)(() => this.codeBlocksByResponseId.delete(element.id)));
            }
            this.markdownDecorationsRenderer.walkTreeAndAnnotateReferenceLinks(result.element);
            orderedDisposablesList.reverse().forEach(d => disposables.add(d));
            return {
                element: result.element,
                dispose() {
                    result.dispose();
                    disposables.dispose();
                }
            };
        }
        renderCodeBlock(data, text) {
            const ref = this._editorPool.get();
            const editorInfo = ref.object;
            if ((0, chatViewModel_1.isResponseVM)(data.element)) {
                this.codeBlockModelCollection.update(data.element.sessionId, data.element, data.codeBlockIndex, { text, languageId: data.languageId });
            }
            editorInfo.render(data, this._currentLayoutWidth, this.rendererOptions.editableCodeBlock);
            return ref;
        }
        getDataForProgressiveRender(element, data, renderData) {
            const rate = this.getProgressiveRenderRate(element);
            const numWordsToRender = renderData.lastRenderTime === 0 ?
                1 :
                renderData.renderedWordCount +
                    // Additional words to render beyond what's already rendered
                    Math.floor((Date.now() - renderData.lastRenderTime) / 1000 * rate);
            if (numWordsToRender === renderData.renderedWordCount) {
                return undefined;
            }
            return {
                ...(0, chatWordCounter_1.getNWords)(data.value, numWordsToRender),
                rate
            };
        }
        disposeElement(node, index, templateData) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
    };
    exports.ChatListItemRenderer = ChatListItemRenderer;
    exports.ChatListItemRenderer = ChatListItemRenderer = ChatListItemRenderer_1 = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, log_1.ILogService),
        __param(9, opener_1.IOpenerService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, themeService_1.IThemeService),
        __param(12, commands_1.ICommandService),
        __param(13, resolverService_1.ITextModelService)
    ], ChatListItemRenderer);
    let ChatListDelegate = class ChatListDelegate {
        constructor(defaultElementHeight, logService) {
            this.defaultElementHeight = defaultElementHeight;
            this.logService = logService;
        }
        _traceLayout(method, message) {
            if (forceVerboseLayoutTracing) {
                this.logService.info(`ChatListDelegate#${method}: ${message}`);
            }
            else {
                this.logService.trace(`ChatListDelegate#${method}: ${message}`);
            }
        }
        getHeight(element) {
            const kind = (0, chatViewModel_1.isRequestVM)(element) ? 'request' : 'response';
            const height = ('currentRenderedHeight' in element ? element.currentRenderedHeight : undefined) ?? this.defaultElementHeight;
            this._traceLayout('getHeight', `${kind}, height=${height}`);
            return height;
        }
        getTemplateId(element) {
            return ChatListItemRenderer.ID;
        }
        hasDynamicHeight(element) {
            return true;
        }
    };
    exports.ChatListDelegate = ChatListDelegate;
    exports.ChatListDelegate = ChatListDelegate = __decorate([
        __param(1, log_1.ILogService)
    ], ChatListDelegate);
    let EditorPool = class EditorPool extends lifecycle_1.Disposable {
        inUse() {
            return this._pool.inUse;
        }
        constructor(options, delegate, overflowWidgetsDomNode, instantiationService) {
            super();
            this._pool = this._register(new ResourcePool(() => {
                return instantiationService.createInstance(codeBlockPart_1.CodeBlockPart, options, actions_1.MenuId.ChatCodeBlock, delegate, overflowWidgetsDomNode);
            }));
        }
        get() {
            const codeBlock = this._pool.get();
            let stale = false;
            return {
                object: codeBlock,
                isStale: () => stale,
                dispose: () => {
                    codeBlock.reset();
                    stale = true;
                    this._pool.release(codeBlock);
                }
            };
        }
    };
    EditorPool = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], EditorPool);
    let TreePool = class TreePool extends lifecycle_1.Disposable {
        get inUse() {
            return this._pool.inUse;
        }
        constructor(_onDidChangeVisibility, instantiationService, configService, themeService) {
            super();
            this._onDidChangeVisibility = _onDidChangeVisibility;
            this.instantiationService = instantiationService;
            this.configService = configService;
            this.themeService = themeService;
            this._pool = this._register(new ResourcePool(() => this.treeFactory()));
        }
        treeFactory() {
            const resourceLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this._onDidChangeVisibility });
            const container = $('.interactive-response-progress-tree');
            this._register((0, explorerView_1.createFileIconThemableTreeContainerScope)(container, this.themeService));
            const tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'ChatListRenderer', container, new ChatListTreeDelegate(), new ChatListTreeCompressionDelegate(), [new ChatListTreeRenderer(resourceLabels, this.configService.getValue('explorer.decorations'))], new ChatListTreeDataSource(), {
                collapseByDefault: () => false,
                expandOnlyOnTwistieClick: () => false,
                identityProvider: {
                    getId: (e) => e.uri.toString()
                },
                accessibilityProvider: {
                    getAriaLabel: (element) => element.label,
                    getWidgetAriaLabel: () => (0, nls_1.localize)('treeAriaLabel', "File Tree")
                },
                alwaysConsumeMouseWheel: false
            });
            return tree;
        }
        get() {
            const object = this._pool.get();
            let stale = false;
            return {
                object,
                isStale: () => stale,
                dispose: () => {
                    stale = true;
                    this._pool.release(object);
                }
            };
        }
    };
    TreePool = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, themeService_1.IThemeService)
    ], TreePool);
    let ContentReferencesListPool = class ContentReferencesListPool extends lifecycle_1.Disposable {
        get inUse() {
            return this._pool.inUse;
        }
        constructor(_onDidChangeVisibility, instantiationService, themeService) {
            super();
            this._onDidChangeVisibility = _onDidChangeVisibility;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this._pool = this._register(new ResourcePool(() => this.listFactory()));
        }
        listFactory() {
            const resourceLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this._onDidChangeVisibility });
            const container = $('.chat-used-context-list');
            this._register((0, explorerView_1.createFileIconThemableTreeContainerScope)(container, this.themeService));
            const list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'ChatListRenderer', container, new ContentReferencesListDelegate(), [this.instantiationService.createInstance(ContentReferencesListRenderer, resourceLabels)], {
                alwaysConsumeMouseWheel: false,
                accessibilityProvider: {
                    getAriaLabel: (element) => {
                        const reference = element.reference;
                        if ('variableName' in reference) {
                            return reference.variableName;
                        }
                        else if (uri_1.URI.isUri(reference)) {
                            return (0, path_1.basename)(reference.path);
                        }
                        else {
                            return (0, path_1.basename)(reference.uri.path);
                        }
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)('usedReferences', "Used References")
                },
            });
            return list;
        }
        get() {
            const object = this._pool.get();
            let stale = false;
            return {
                object,
                isStale: () => stale,
                dispose: () => {
                    stale = true;
                    this._pool.release(object);
                }
            };
        }
    };
    ContentReferencesListPool = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService)
    ], ContentReferencesListPool);
    class ContentReferencesListDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return ContentReferencesListRenderer.TEMPLATE_ID;
        }
    }
    let ContentReferencesListRenderer = class ContentReferencesListRenderer {
        static { ContentReferencesListRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'contentReferencesListRenderer'; }
        constructor(labels, chatVariablesService) {
            this.labels = labels;
            this.chatVariablesService = chatVariablesService;
            this.templateId = ContentReferencesListRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const label = templateDisposables.add(this.labels.create(container, { supportHighlights: true }));
            return { templateDisposables, label };
        }
        renderElement(data, index, templateData, height) {
            const reference = data.reference;
            templateData.label.element.style.display = 'flex';
            if ('variableName' in reference) {
                if (reference.value) {
                    const uri = uri_1.URI.isUri(reference.value) ? reference.value : reference.value.uri;
                    templateData.label.setResource({
                        resource: uri,
                        name: (0, resources_1.basenameOrAuthority)(uri),
                        description: `#${reference.variableName}`,
                        range: 'range' in reference.value ? reference.value.range : undefined
                    });
                }
                else {
                    const variable = this.chatVariablesService.getVariable(reference.variableName);
                    templateData.label.setLabel(`#${reference.variableName}`, undefined, { title: variable?.description });
                }
            }
            else {
                const uri = 'uri' in reference ? reference.uri : reference;
                if ((0, network_1.matchesSomeScheme)(uri, network_1.Schemas.mailto, network_1.Schemas.http, network_1.Schemas.https)) {
                    templateData.label.setResource({ resource: uri, name: uri.toString() }, { icon: codicons_1.Codicon.globe });
                }
                else {
                    templateData.label.setFile(uri, {
                        fileKind: files_1.FileKind.FILE,
                        // Should not have this live-updating data on a historical reference
                        fileDecorations: { badges: false, colors: false },
                        range: 'range' in reference ? reference.range : undefined
                    });
                }
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
    };
    ContentReferencesListRenderer = ContentReferencesListRenderer_1 = __decorate([
        __param(1, chatVariables_1.IChatVariablesService)
    ], ContentReferencesListRenderer);
    class ResourcePool extends lifecycle_1.Disposable {
        get inUse() {
            return this._inUse;
        }
        constructor(_itemFactory) {
            super();
            this._itemFactory = _itemFactory;
            this.pool = [];
            this._inUse = new Set;
        }
        get() {
            if (this.pool.length > 0) {
                const item = this.pool.pop();
                this._inUse.add(item);
                return item;
            }
            const item = this._register(this._itemFactory());
            this._inUse.add(item);
            return item;
        }
        release(item) {
            this._inUse.delete(item);
            this.pool.push(item);
        }
    }
    class ChatVoteButton extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        render(container) {
            super.render(container);
            container.classList.toggle('checked', this.action.checked);
        }
    }
    class ChatListTreeDelegate {
        static { this.ITEM_HEIGHT = 22; }
        getHeight(element) {
            return ChatListTreeDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return 'chatListTreeTemplate';
        }
    }
    class ChatListTreeCompressionDelegate {
        isIncompressible(element) {
            return !element.children;
        }
    }
    class ChatListTreeRenderer {
        constructor(labels, decorations) {
            this.labels = labels;
            this.decorations = decorations;
            this.templateId = 'chatListTreeTemplate';
        }
        renderCompressedElements(element, index, templateData, height) {
            templateData.label.element.style.display = 'flex';
            const label = element.element.elements.map((e) => e.label);
            templateData.label.setResource({ resource: element.element.elements[0].uri, name: label }, {
                title: element.element.elements[0].label,
                fileKind: element.children ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                extraClasses: ['explorer-item'],
                fileDecorations: this.decorations
            });
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const label = templateDisposables.add(this.labels.create(container, { supportHighlights: true }));
            return { templateDisposables, label };
        }
        renderElement(element, index, templateData, height) {
            templateData.label.element.style.display = 'flex';
            if (!element.children.length && element.element.type !== files_1.FileType.Directory) {
                templateData.label.setFile(element.element.uri, {
                    fileKind: files_1.FileKind.FILE,
                    hidePath: true,
                    fileDecorations: this.decorations,
                });
            }
            else {
                templateData.label.setResource({ resource: element.element.uri, name: element.element.label }, {
                    title: element.element.label,
                    fileKind: files_1.FileKind.FOLDER,
                    fileDecorations: this.decorations
                });
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
    }
    class ChatListTreeDataSource {
        hasChildren(element) {
            return !!element.children;
        }
        async getChildren(element) {
            return element.children ?? [];
        }
    }
    function isInteractiveProgressTreeData(item) {
        return 'label' in item;
    }
    function contentToMarkdown(str) {
        return typeof str === 'string' ? { value: str } : str;
    }
    function isProgressMessage(item) {
        return item && 'kind' in item && item.kind === 'progressMessage';
    }
    function isProgressMessageRenderData(item) {
        return item && 'isAtEndOfResponse' in item;
    }
    function isCommandButtonRenderData(item) {
        return item && 'kind' in item && item.kind === 'command';
    }
    function isMarkdownRenderData(item) {
        return item && 'renderedWordCount' in item;
    }
    function onlyProgressMessagesAfterI(items, i) {
        return items.slice(i).every(isProgressMessage);
    }
    function onlyProgressMessageRenderDatasAfterI(items, i) {
        return items.slice(i).every(isProgressMessageRenderData);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdExpc3RSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRMaXN0UmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtFaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQXFCaEIsTUFBTSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7SUFlakMsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTs7aUJBQ25DLE9BQUUsR0FBRyxNQUFNLEFBQVQsQ0FBVTtRQTJCNUIsWUFDQyxhQUFnQyxFQUNmLFFBQTJCLEVBQzNCLGVBQTZDLEVBQzdDLFFBQStCLEVBQy9CLHdCQUFrRCxFQUNuRSxzQkFBK0MsRUFDeEIsb0JBQTRELEVBQzVELGFBQW9DLEVBQzlDLFVBQXdDLEVBQ3JDLGFBQThDLEVBQzFDLGlCQUFzRCxFQUMzRCxZQUE0QyxFQUMxQyxjQUFnRCxFQUM5QyxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFkUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBOEI7WUFDN0MsYUFBUSxHQUFSLFFBQVEsQ0FBdUI7WUFDL0IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUUzQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRXJELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDekIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUF2Q3ZELDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBQ2pFLDBCQUFxQixHQUFHLElBQUksaUJBQVcsRUFBc0IsQ0FBQztZQUU5RCwwQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztZQUMvRCxpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUt2RCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQixDQUFDLENBQUM7WUFDN0UsdUJBQWtCLEdBQXlCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFFaEUsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMkIsQ0FBQyxDQUFDO1lBQzFGLDBCQUFxQixHQUFtQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBTTNGLHdCQUFtQixHQUFXLENBQUMsQ0FBQztZQUNoQyxlQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBRWhFLDJCQUFzQixHQUFHLEtBQUssQ0FBQztZQW9CdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUNBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpRUFBK0IsQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUN6SSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdkgsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUV6SixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNENBQTRCLENBQUMsQ0FBQyxDQUFDO1lBRXZGLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLGtDQUFrQyxDQUFDLElBQUksSUFBSSxDQUFDO1lBQ2pHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN6RCxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxFQUFFLENBQUM7b0JBQ2hFLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLGtDQUFrQyxDQUFDLElBQUksSUFBSSxDQUFDO2dCQUNsRyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLHNCQUFvQixDQUFDLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQsWUFBWTtZQUNYLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRU8sV0FBVyxDQUFDLE1BQWMsRUFBRSxPQUFlO1lBQ2xELElBQUkseUJBQXlCLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLE1BQU0sS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsTUFBTSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDckUsQ0FBQztRQUNGLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxPQUErQjtZQUMvRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsb0JBQW9CLElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RGLFVBQVU7Z0JBQ1YsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNuQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBRW5CLHdLQUF3SztnQkFDeEsseUlBQXlJO2dCQUN6SSxnR0FBZ0c7Z0JBQ2hHLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQztnQkFDdEIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixHQUFHLFNBQVMsQ0FBQztnQkFDMUUsT0FBTyxJQUFBLGVBQUssRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFFRCw0QkFBNEIsQ0FBQyxRQUFnQztZQUM1RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxPQUFPLFVBQVUsSUFBSSxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELHlCQUF5QixDQUFDLEdBQVE7WUFDakMsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCwyQkFBMkIsQ0FBQyxRQUFnQztZQUMzRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5RCxPQUFPLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVELGlDQUFpQyxDQUFDLFFBQWdDO1lBQ2pFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlELE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEYsSUFBSSxTQUFTLEVBQUUsTUFBTSxJQUFJLHdCQUF3QixLQUFLLFNBQVMsSUFBSSx3QkFBd0IsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hILE9BQU8sU0FBUyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxVQUFVLENBQUMsT0FBZ0I7WUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7WUFDMUIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQWE7WUFDbkIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUN4RixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUN6QyxDQUFDO1FBQ0YsQ0FBQztRQUVELGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxNQUFNLG1CQUFtQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ2xELE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7WUFDN0UsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDcEQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUM3RCxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQztZQUN4RixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLGtCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRWpELE1BQU0saUJBQWlCLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNyRyxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLCtCQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pJLElBQUksWUFBOEMsQ0FBQztZQUNuRCxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxZQUFZLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyw4QkFBb0IsRUFBRSxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDdkksV0FBVyxFQUFFO3dCQUNaLGlCQUFpQixFQUFFLElBQUk7cUJBQ3ZCO29CQUNELGNBQWMsRUFBRTt3QkFDZixtQkFBbUIsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUM7cUJBQzNEO29CQUNELHNCQUFzQixFQUFFLENBQUMsTUFBZSxFQUFFLE9BQStCLEVBQUUsRUFBRTt3QkFDNUUsSUFBSSxNQUFNLFlBQVksd0JBQWMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLGdDQUFnQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLDhCQUE4QixDQUFDLEVBQUUsQ0FBQzs0QkFDcEosT0FBTywwQkFBMEIsQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxPQUEwQyxDQUFDLENBQUM7d0JBQ3RILENBQUM7d0JBQ0QsT0FBTyxJQUFBLDhDQUFvQixFQUFDLDBCQUEwQixFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDMUUsQ0FBQztpQkFDRCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBMEIsRUFBRSxlQUFlLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxDQUFDO1lBQzVOLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBeUMsRUFBRSxLQUFhLEVBQUUsWUFBbUM7WUFDMUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxPQUFxQixFQUFFLEtBQWEsRUFBRSxZQUFtQztZQUMzRixNQUFNLElBQUksR0FBRyxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM5QyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNuQyxTQUFTLENBQUM7WUFDWixJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxHQUFHLElBQUksV0FBVyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRTdELGtDQUFnQixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDbkYsaUNBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUEsMkJBQVcsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLHlEQUF1QyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ2pKLElBQUksSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLCtEQUE2QyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQzFJLHVDQUFxQixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyw2Q0FBK0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyw2Q0FBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcE0sQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHVDQUFxQixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEUsQ0FBQztZQUVELElBQUksWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUMvQixZQUFZLENBQUMsWUFBWSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDN0MsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDekYsMkNBQXlCLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVqRixZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsSUFBQSwyQkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEYsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzFGLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN4RixZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDNUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckosWUFBWSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELEdBQUcsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLElBQUksSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFFRCw2QkFBNkI7WUFDN0IsdUNBQXVDO1lBQ3ZDLDRCQUE0QjtZQUM1QixxQ0FBcUM7WUFDckMsaUtBQWlLO1lBQ2pLLHNEQUFzRDtZQUN0RCxJQUFJLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxSixJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSw0QkFBNEIsSUFBSSxXQUFXLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXRGLE1BQU0sK0JBQStCLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRyxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztnQkFDakYsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLE9BQWlCLEVBQUUsRUFBRTtvQkFDbEQsSUFBSSxDQUFDO3dCQUNKLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsK0JBQStCLENBQUMsRUFBRSxDQUFDOzRCQUM1RyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ2hCLENBQUM7b0JBQ0YsQ0FBQztvQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO3dCQUNkLHdGQUF3Rjt3QkFDeEYsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNmLE1BQU0sR0FBRyxDQUFDO29CQUNYLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDO2dCQUNGLEtBQUssQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUM7aUJBQU0sSUFBSSxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLDRDQUE4QixFQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzNFLENBQUM7aUJBQU0sSUFBSSxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxRQUFRLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDekIsSUFBSSxDQUFDLDJCQUEyQixDQUFDLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM3SCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUVPLFlBQVksQ0FBQyxPQUErQixFQUFFLFlBQW1DO1lBQ3hGLElBQUksV0FBVyxHQUFXLEVBQUUsQ0FBQztZQUM3QixJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLFFBQVEsR0FBRyxpQ0FBZSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNwRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDMUIsUUFBUSxJQUFJLElBQUksc0NBQW9CLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDcEUsQ0FBQztnQkFFRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDeEIsV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzNELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxPQUFPLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO2dCQUM5QixJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUMvQyxRQUFRLENBQUMsSUFBSSxDQUFDLGlDQUFlLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckQsQ0FBQztnQkFDRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDMUIsUUFBUSxDQUFDLElBQUksQ0FBQyxzQ0FBb0IsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO2dCQUNELElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNyQixJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDeEIsV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNyRSxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN2RSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2hDLFdBQVcsR0FBRyx1QkFBZ0IsQ0FBQztZQUNoQyxDQUFDO1lBRUQsWUFBWSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQzlDLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNuQixZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5SCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLE9BQXFCLEVBQUUsWUFBbUM7WUFDOUUsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFtQixVQUFVLENBQUMsQ0FBQztnQkFDMUQsYUFBYSxDQUFDLEdBQUcsR0FBRyxvQkFBVSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsRixZQUFZLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUMxRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxXQUFXLEdBQUcsSUFBQSwyQkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxPQUFPLENBQUM7Z0JBQzdFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksV0FBVyxDQUFDO2dCQUMvQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLHFCQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELFlBQVksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDdEcsQ0FBQztZQUVELElBQUksSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4RSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZELElBQUksSUFBSSxZQUFZLFNBQUcsRUFBRSxDQUFDO29CQUN6QixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFtQixVQUFVLENBQUMsQ0FBQztvQkFDdkQsVUFBVSxDQUFDLEdBQUcsR0FBRyxvQkFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2pFLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVGLENBQUM7cUJBQU0sSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDakIsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxxQkFBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxZQUFZLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNHLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUM1QyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsWUFBWSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkYsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDaEUsT0FBTyxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQztvQkFDMUMsWUFBWSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzlELFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBQSx5QkFBaUIsRUFBQyxHQUFHLEVBQUU7d0JBQzFELFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDcEYsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDcEYsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLEtBQXlCO1lBQzdDLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUM7WUFDeEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLEtBQUssbUJBQVcsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN0RyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxLQUE0RCxFQUFFLE9BQXFCLEVBQUUsS0FBYSxFQUFFLFlBQW1DO1lBQ2pLLE1BQU0sc0JBQXNCLEdBQUcsSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRSxrQkFBa0IsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFOUwsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUVwRCxJQUFJLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsSUFBSSxDQUFDLCtCQUErQixDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFN0YsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVTtvQkFDdEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxDQUFDO29CQUM1RSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxpQkFBaUI7d0JBQ2hDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxzQkFBc0IsQ0FBQzt3QkFDbEYsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCLElBQUksMEJBQTBCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLHNCQUFzQjs0QkFDN0ksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQztnQ0FDbEUsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDaEIsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDWixZQUFZLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQy9DLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzdDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQzVELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLGtCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLEtBQUssQ0FBQztnQkFDcEYsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxxQ0FBcUMsRUFBRSxTQUFTLEVBQUUsSUFBQSx1QkFBVSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0gsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLDRCQUFjLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xJLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDdkUsQ0FBQztZQUVELElBQUksSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4RixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQ3hCLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUMzQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3JCLFdBQVcsR0FBRyxJQUFJLENBQUM7d0JBQ25CLE1BQU07b0JBQ1AsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsNEJBQTRCLEVBQUUsU0FBUyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZILENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7WUFDekQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLElBQUksT0FBTyxDQUFDLHFCQUFxQixLQUFLLFNBQVMsQ0FBQztZQUNoRyxPQUFPLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1lBQzFDLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFO29CQUMvSCxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztRQUVPLG9CQUFvQixDQUFDLE9BQXFDLEVBQUUsWUFBbUM7WUFDdEcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNwRCxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBRS9DLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDekIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLElBQUkscUNBQWlCLENBQUMsQ0FBQywrQkFBa0IsRUFBRSxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlJLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQ2xDLGtCQUFrQixDQUFDLGNBQWMsQ0FDaEMsNkJBQWEsRUFDYixZQUFZLENBQUMsS0FBSyxFQUNsQixJQUFJLEVBQ0osSUFBSSxDQUFDLFFBQVEsRUFDYixTQUFTLEVBQ1QsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBdUIsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ25GLFlBQVksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDL0MsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQztZQUN6RCxNQUFNLFNBQVMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsSUFBSSxPQUFPLENBQUMscUJBQXFCLEtBQUssU0FBUyxDQUFDO1lBQ2hHLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUM7WUFDMUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUU7b0JBQy9ILFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDckIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDbEUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBRUQ7O1dBRUc7UUFDSyx1QkFBdUIsQ0FBQyxPQUErQixFQUFFLEtBQWEsRUFBRSxZQUFtQyxFQUFFLGlCQUEwQixFQUFFLFdBQTRCO1lBQzVLLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBQSw0Q0FBOEIsRUFBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xGLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztZQUM1QixJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxtQkFBbUIsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDckUsT0FBTyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUMxRSxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxrRkFBa0Y7Z0JBQ2xGLE9BQU8sQ0FBQyxVQUFVLEtBQUssRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO2dCQUN2RCxNQUFNLGdCQUFnQixHQUF1QixFQUFFLENBQUM7Z0JBQ2hELE1BQU0sYUFBYSxHQUFzQixFQUFFLENBQUM7Z0JBRTVDLElBQUksMEJBQTBCLEdBQUcsS0FBSyxDQUFDO2dCQUN2QyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQzFDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUMsK0JBQStCO29CQUMvQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQzs0QkFDOUIsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7d0JBQ3RDLENBQUM7NkJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFLENBQUM7NEJBQzVDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRztnQ0FDdEIsZUFBZSxFQUFFLElBQUk7Z0NBQ3JCLGlCQUFpQixFQUFFLDBCQUEwQixDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQztnQ0FDeEUsTUFBTSxFQUFFLEtBQUssS0FBSyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQzs2QkFDTixDQUFDO3dCQUM1QyxDQUFDOzZCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQzs0QkFDcEMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQzt3QkFDN0IsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDOzRCQUNoSixJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQ0FDbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyx5QkFBeUIsRUFBRSxzQkFBc0IsS0FBSyxxQkFBcUIsZUFBZSxDQUFDLGVBQWUsVUFBVSxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDN0osYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHO29DQUN0QixpQkFBaUIsRUFBRSxlQUFlLENBQUMsZUFBZTtvQ0FDbEQsY0FBYyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7b0NBQzFCLGVBQWUsRUFBRSxlQUFlLENBQUMsWUFBWTtpQ0FDN0MsQ0FBQztnQ0FDRixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxlQUFlLENBQUM7NEJBQzNDLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUVELGtDQUFrQzt5QkFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxpQkFBaUIsQ0FBQyxJQUFJLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPO3dCQUM3SCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQzt3QkFDakgsNkNBQTZDO3dCQUM3QyxJQUFJLGVBQWUsS0FBSyxTQUFTLElBQUksWUFBWSxDQUFDLGlCQUFpQixLQUFLLGVBQWUsRUFBRSxlQUFlLEVBQUUsQ0FBQzs0QkFDMUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyx5QkFBeUIsRUFBRSwwQkFBMEIsS0FBSyxxQkFBcUIsZUFBZSxDQUFDLGVBQWUsVUFBVSxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQzs0QkFDakssYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHO2dDQUN0QixpQkFBaUIsRUFBRSxlQUFlLENBQUMsZUFBZTtnQ0FDbEQsY0FBYyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0NBQzFCLGVBQWUsRUFBRSxlQUFlLENBQUMsWUFBWTs2QkFDN0MsQ0FBQzs0QkFDRixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxlQUFlLENBQUM7d0JBQzNDLENBQUM7NkJBQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs0QkFDOUQseUZBQXlGOzRCQUN6RiwwQkFBMEIsR0FBRyxJQUFJLENBQUM7d0JBQ25DLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCx3REFBd0Q7eUJBQ25ELElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxpQkFBaUIsSUFBSSwyQkFBMkIsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUN4RixDQUFDLFlBQVksQ0FBQyxpQkFBaUIsS0FBSywwQkFBMEIsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDMUYsWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEtBQUssS0FBSyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNyRSxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUc7NEJBQ3RCLGVBQWUsRUFBRSxJQUFJOzRCQUNyQixpQkFBaUIsRUFBRSwwQkFBMEIsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUM7NEJBQ3hFLE1BQU0sRUFBRSxLQUFLLEtBQUssa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUM7eUJBQ04sQ0FBQztvQkFDNUMsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFFSCxlQUFlLEdBQUcsYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQztnQkFFNUUsSUFBSSxlQUFlLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUMzQyxrRUFBa0U7b0JBQ2xFLElBQUksQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsaUNBQWlDLEtBQUsseURBQXlELEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQ2pKLE9BQU8sQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO29CQUMvQixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUMzRSxDQUFDO3FCQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDN0IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNwQixJQUFJLENBQUMsK0JBQStCLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDekUsSUFBSSwyQkFBMkIsR0FBRyxLQUFLLENBQUM7b0JBQ3hDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUU7d0JBQzdDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQzs0QkFDbkIsT0FBTzt3QkFDUixDQUFDO3dCQUVELHNFQUFzRTt3QkFDdEUsSUFBSSxNQUFpRSxDQUFDO3dCQUN0RSxJQUFJLDZCQUE2QixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7NEJBQ2pELE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUMxRSxDQUFDOzZCQUFNLElBQUksMkJBQTJCLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQzs0QkFDdEQsSUFBSSxvQ0FBb0MsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQ0FDaEUsTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLEtBQUssS0FBSyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUN2RyxDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsTUFBTSxHQUFHLElBQUksQ0FBQzs0QkFDZixDQUFDO3dCQUNGLENBQUM7NkJBQU0sSUFBSSx5QkFBeUIsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDOzRCQUNwRCxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQzt3QkFFRCwrRUFBK0U7NkJBQzFFLElBQUksQ0FBQywyQkFBMkIsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDOzRCQUNsRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQzFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksNEJBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUNyRiwyQkFBMkIsR0FBRyxJQUFJLENBQUM7d0JBQ3BDLENBQUM7d0JBRUQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7NEJBQzFCLE9BQU87d0JBQ1IsQ0FBQzt3QkFFRCwrQkFBK0I7d0JBQy9CLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxZQUFZLENBQUM7d0JBQ3BDLE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMzRCxJQUFJLGVBQWUsRUFBRSxDQUFDOzRCQUNyQixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztnQ0FDckIsWUFBWSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7NEJBQzNGLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxZQUFZLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNsRSxDQUFDO3dCQUNGLENBQUM7NkJBQU0sSUFBSSxNQUFNLEVBQUUsQ0FBQzs0QkFDbkIsWUFBWSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNoRCxDQUFDO3dCQUVELElBQUksTUFBTSxFQUFFLENBQUM7NEJBQ1osV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDekIsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsZ0RBQWdEO29CQUNoRCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUVELDJDQUEyQztZQUMzQyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQztZQUN0RCxPQUFPLENBQUMscUJBQXFCLEdBQUcsTUFBTSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDL0YsQ0FBQztZQUVELE9BQU8sZUFBZSxDQUFDO1FBQ3hCLENBQUM7UUFFTyxjQUFjLENBQUMsSUFBdUMsRUFBRSxPQUFxQixFQUFFLFlBQW1DLEVBQUUsYUFBcUI7WUFDaEosTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDOUMsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdEQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUV4QixlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDeEMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFO2dCQUN0RCxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDL0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNkLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDL0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxpQkFBaUIsR0FBRztvQkFDekIsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO29CQUMvQixTQUFTLEVBQUUsYUFBYTtvQkFDeEIsS0FBSzt3QkFDSixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2pCLENBQUM7aUJBQ0QsQ0FBQztnQkFFRixlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUN4QyxJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNuRSxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFBLGlCQUFRLEVBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckYsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsSixDQUFDO1lBRUQsT0FBTztnQkFDTixPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLGFBQWM7Z0JBQzdDLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMzQixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFTywrQkFBK0IsQ0FBQyxPQUFxQixFQUFFLFlBQW1DLEVBQUUsV0FBNEI7WUFDL0gsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNwRCxJQUFJLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsc0JBQXNCLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM5RixHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLDJCQUEyQixHQUFHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUMzSCxZQUFZLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN0RixXQUFXLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNGLENBQUM7UUFFTywrQkFBK0IsQ0FBQyxJQUEwQyxFQUFFLE9BQStCLEVBQUUsWUFBbUM7WUFDdkosTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDOUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sSUFBSSxHQUFHLENBQUMsT0FBK0IsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxZQUFZLENBQUM7WUFDOUgsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxxQkFBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRS9ELE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFNLENBQUMsYUFBYSxFQUFFO2dCQUNwRSxnQkFBZ0IsRUFBRSxTQUFTO2dCQUMzQixZQUFZLEVBQUUsU0FBUztnQkFDdkIsZ0JBQWdCLEVBQUUsU0FBUztnQkFDM0IscUJBQXFCLEVBQUUsU0FBUztnQkFDaEMseUJBQXlCLEVBQUUsU0FBUztnQkFDcEMseUJBQXlCLEVBQUUsU0FBUztnQkFDcEMsOEJBQThCLEVBQUUsU0FBUztnQkFDekMsZUFBZSxFQUFFLFNBQVM7YUFDMUIsQ0FBQyxDQUFDLENBQUM7WUFDSixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3BFLGNBQWMsQ0FBQyxLQUFLLEdBQUcsZUFBZSxDQUFDO1lBQ3ZDLGNBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDOUYsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUMzRixlQUFlLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNsRCxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLHFCQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0UsT0FBTyxDQUFDLHNCQUFzQixHQUFHLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO2dCQUNqRSxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLHFCQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDM0YsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RixJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQy9GLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDeEIsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsYUFBYyxDQUFDLENBQUM7WUFFNUQsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNmLE1BQU0sYUFBYSxHQUFHLGNBQWMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztvQkFDOUcsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQ3JELGFBQWEsRUFBRSxHQUFHLENBQUM7b0JBQ3BCLElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQ3RCLEdBQUcsRUFDSDs0QkFDQyxlQUFlLEVBQUUsSUFBSTs0QkFDckIsYUFBYSxFQUFFO2dDQUNkLEdBQUcsQ0FBQyxDQUFDLGFBQWE7Z0NBQ2xCLEdBQUc7b0NBQ0YsU0FBUyxFQUFFLGFBQWEsSUFBSSxPQUFPLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTO2lDQUN0Rjs2QkFDRDt5QkFDRCxDQUFDLENBQUM7b0JBQ0wsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDeEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sTUFBTSxHQUFHLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDO1lBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbEMsT0FBTztnQkFDTixPQUFPLEVBQUUsU0FBUztnQkFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzNCLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVPLGVBQWUsQ0FBQyxPQUFvQixFQUFFLEtBQWEsRUFBRSxRQUFrQjtZQUM5RSxPQUFPLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxSixDQUFDO1FBRU8scUJBQXFCLENBQUMsUUFBOEIsRUFBRSxXQUFvQjtZQUNqRixJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQix1REFBdUQ7Z0JBQ3ZELElBQUEsWUFBSyxFQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMscUJBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDM0YsTUFBTSxRQUFRLEdBQUcsSUFBSSw0QkFBYyxDQUFDLEtBQUssT0FBTyxLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzlFLGlCQUFpQixFQUFFLElBQUk7YUFDdkIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzlDLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLG1CQUFtQixDQUFDLE9BQXFCLEVBQUUsYUFBaUM7WUFDbkYsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDNUMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQzNELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDO2dCQUN4QixhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQixJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsR0FBRyxtQ0FBbUIsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEgsTUFBTSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUMzQyxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUV6QixnREFBZ0Q7WUFDaEQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuSixPQUFPO2dCQUNOLE9BQU87b0JBQ04sV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN2QixDQUFDO2dCQUNELE9BQU8sRUFBRSxTQUFTO2FBQ2xCLENBQUM7UUFDSCxDQUFDO1FBRU8sY0FBYyxDQUFDLFFBQXlCLEVBQUUsT0FBcUIsRUFBRSxZQUFtQyxFQUFFLHNCQUFzQixHQUFHLEtBQUs7WUFDM0ksTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsUUFBUSxHQUFHLElBQUksNEJBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFO2dCQUM3QyxTQUFTLEVBQUU7b0JBQ1Ysb0RBQW9EO29CQUNwRCxlQUFlLEVBQUUsT0FBTyxRQUFRLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFO2lCQUN4RzthQUNELENBQUMsQ0FBQztZQUVILHNMQUFzTDtZQUN0TCxNQUFNLHNCQUFzQixHQUFrQixFQUFFLENBQUM7WUFDakQsTUFBTSxVQUFVLEdBQXlCLEVBQUUsQ0FBQztZQUM1QyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2dCQUM3QyxzQkFBc0I7Z0JBQ3RCLHFCQUFxQixFQUFFLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFFO29CQUMzQyxNQUFNLEtBQUssR0FBRyxjQUFjLEVBQUUsQ0FBQztvQkFDL0IsSUFBSSxTQUE0QyxDQUFDO29CQUNqRCxJQUFJLEtBQXdCLENBQUM7b0JBQzdCLElBQUksS0FBb0QsQ0FBQztvQkFDekQsSUFBSSxJQUFBLDBCQUFnQixFQUFDLFVBQVUsRUFBRSxtQ0FBbUIsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZELElBQUksQ0FBQzs0QkFDSixNQUFNLFVBQVUsR0FBRyxJQUFBLGtDQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDOzRCQUM1QyxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDekQsU0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNoRyxDQUFDO3dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7NEJBQ1osT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ2pCLENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDckQsT0FBTyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUMzRSxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDakIsQ0FBQzt3QkFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLElBQUksSUFBQSwyQkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3pGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDeEYsS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7d0JBQ3pCLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO29CQUM5QixDQUFDO29CQUVELE1BQU0sV0FBVyxHQUFHLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDO29CQUN0RixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFFdEwsZ0pBQWdKO29CQUNoSix5SEFBeUg7b0JBQ3pILFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUU7d0JBQ3hELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO3dCQUM1QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7b0JBQy9GLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRUosSUFBSSxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0IsTUFBTSxJQUFJLEdBQXVCOzRCQUNoQyxjQUFjLEVBQUUsS0FBSzs0QkFDckIsT0FBTzs0QkFDUCxLQUFLO2dDQUNKLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ3BCLENBQUM7eUJBQ0QsQ0FBQzt3QkFDRixVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN0QixJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQ3BCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDOzRCQUMzQixJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQzs0QkFDMUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdFLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2pDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7Z0JBQzNCLENBQUM7Z0JBQ0QsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQzthQUN4SCxDQUFDLENBQUM7WUFFSCxJQUFJLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixDQUFDO1lBRUQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGlDQUFpQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVuRixzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEUsT0FBTztnQkFDTixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLE9BQU87b0JBQ04sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNqQixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVPLGVBQWUsQ0FBQyxJQUFvQixFQUFFLElBQVk7WUFDekQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNuQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQzlCLElBQUksSUFBQSw0QkFBWSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDeEksQ0FBQztZQUVELFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFMUYsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRU8sMkJBQTJCLENBQUMsT0FBK0IsRUFBRSxJQUFxQixFQUFFLFVBQXlGO1lBQ3BMLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxjQUFjLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELENBQUMsQ0FBQyxDQUFDO2dCQUNILFVBQVUsQ0FBQyxpQkFBaUI7b0JBQzVCLDREQUE0RDtvQkFDNUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBRXBFLElBQUksZ0JBQWdCLEtBQUssVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPO2dCQUNOLEdBQUcsSUFBQSwyQkFBUyxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQzFDLElBQUk7YUFDSixDQUFDO1FBQ0gsQ0FBQztRQUVELGNBQWMsQ0FBQyxJQUF5QyxFQUFFLEtBQWEsRUFBRSxZQUFtQztZQUMzRyxZQUFZLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVELGVBQWUsQ0FBQyxZQUFtQztZQUNsRCxZQUFZLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUMsQ0FBQzs7SUF4NEJXLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBbUM5QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsWUFBQSwrQkFBa0IsQ0FBQTtRQUNsQixZQUFBLDRCQUFhLENBQUE7UUFDYixZQUFBLDBCQUFlLENBQUE7UUFDZixZQUFBLG1DQUFpQixDQUFBO09BMUNQLG9CQUFvQixDQXk0QmhDO0lBRU0sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7UUFDNUIsWUFDa0Isb0JBQTRCLEVBQ2YsVUFBdUI7WUFEcEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFRO1lBQ2YsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUNsRCxDQUFDO1FBRUcsWUFBWSxDQUFDLE1BQWMsRUFBRSxPQUFlO1lBQ25ELElBQUkseUJBQXlCLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLE1BQU0sS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsTUFBTSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDakUsQ0FBQztRQUNGLENBQUM7UUFFRCxTQUFTLENBQUMsT0FBcUI7WUFDOUIsTUFBTSxJQUFJLEdBQUcsSUFBQSwyQkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztZQUMzRCxNQUFNLE1BQU0sR0FBRyxDQUFDLHVCQUF1QixJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUM7WUFDN0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLFlBQVksTUFBTSxFQUFFLENBQUMsQ0FBQztZQUM1RCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBcUI7WUFDbEMsT0FBTyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELGdCQUFnQixDQUFDLE9BQXFCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUNELENBQUE7SUE1QlksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFHMUIsV0FBQSxpQkFBVyxDQUFBO09BSEQsZ0JBQWdCLENBNEI1QjtJQVFELElBQU0sVUFBVSxHQUFoQixNQUFNLFVBQVcsU0FBUSxzQkFBVTtRQUkzQixLQUFLO1lBQ1gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUN6QixDQUFDO1FBRUQsWUFDQyxPQUEwQixFQUMxQixRQUErQixFQUMvQixzQkFBK0MsRUFDeEIsb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRTtnQkFDakQsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkJBQWEsRUFBRSxPQUFPLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDNUgsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxHQUFHO1lBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNuQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbEIsT0FBTztnQkFDTixNQUFNLEVBQUUsU0FBUztnQkFDakIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUs7Z0JBQ3BCLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNsQixLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBakNLLFVBQVU7UUFZYixXQUFBLHFDQUFxQixDQUFBO09BWmxCLFVBQVUsQ0FpQ2Y7SUFFRCxJQUFNLFFBQVEsR0FBZCxNQUFNLFFBQVMsU0FBUSxzQkFBVTtRQUdoQyxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxZQUNTLHNCQUFzQyxFQUNOLG9CQUEyQyxFQUMzQyxhQUFvQyxFQUM1QyxZQUEyQjtZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQUxBLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBZ0I7WUFDTix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUM1QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUczRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRU8sV0FBVztZQUNsQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUFjLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1lBRXhJLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx1REFBd0MsRUFBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFdkYsTUFBTSxJQUFJLEdBQTZHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQzlKLGdEQUFrQyxFQUNsQyxrQkFBa0IsRUFDbEIsU0FBUyxFQUNULElBQUksb0JBQW9CLEVBQUUsRUFDMUIsSUFBSSwrQkFBK0IsRUFBRSxFQUNyQyxDQUFDLElBQUksb0JBQW9CLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUMvRixJQUFJLHNCQUFzQixFQUFFLEVBQzVCO2dCQUNDLGlCQUFpQixFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUs7Z0JBQzlCLHdCQUF3QixFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUs7Z0JBQ3JDLGdCQUFnQixFQUFFO29CQUNqQixLQUFLLEVBQUUsQ0FBQyxDQUFvQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTtpQkFDakU7Z0JBQ0QscUJBQXFCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxDQUFDLE9BQTBDLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLO29CQUMzRSxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsV0FBVyxDQUFDO2lCQUNoRTtnQkFDRCx1QkFBdUIsRUFBRSxLQUFLO2FBQzlCLENBQUMsQ0FBQztZQUVKLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEdBQUc7WUFDRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNsQixPQUFPO2dCQUNOLE1BQU07Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUs7Z0JBQ3BCLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDYixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDNUIsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQTtJQTNESyxRQUFRO1FBU1gsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsNEJBQWEsQ0FBQTtPQVhWLFFBQVEsQ0EyRGI7SUFFRCxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHNCQUFVO1FBR2pELElBQVcsS0FBSztZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDekIsQ0FBQztRQUVELFlBQ1Msc0JBQXNDLEVBQ04sb0JBQTJDLEVBQ25ELFlBQTJCO1lBRTNELEtBQUssRUFBRSxDQUFDO1lBSkEsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFnQjtZQUNOLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFHM0QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVPLFdBQVc7WUFDbEIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1QkFBYyxFQUFFLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQztZQUV4SSxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsdURBQXdDLEVBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBRXZGLE1BQU0sSUFBSSxHQUF5QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUMxRiwyQkFBYSxFQUNiLGtCQUFrQixFQUNsQixTQUFTLEVBQ1QsSUFBSSw2QkFBNkIsRUFBRSxFQUNuQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkJBQTZCLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFDekY7Z0JBQ0MsdUJBQXVCLEVBQUUsS0FBSztnQkFDOUIscUJBQXFCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxDQUFDLE9BQThCLEVBQUUsRUFBRTt3QkFDaEQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQzt3QkFDcEMsSUFBSSxjQUFjLElBQUksU0FBUyxFQUFFLENBQUM7NEJBQ2pDLE9BQU8sU0FBUyxDQUFDLFlBQVksQ0FBQzt3QkFDL0IsQ0FBQzs2QkFBTSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzs0QkFDakMsT0FBTyxJQUFBLGVBQVEsRUFBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ2pDLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxPQUFPLElBQUEsZUFBUSxFQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3JDLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQztpQkFDdkU7YUFDRCxDQUFDLENBQUM7WUFFSixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxHQUFHO1lBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNoQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbEIsT0FBTztnQkFDTixNQUFNO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLO2dCQUNwQixPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLEtBQUssR0FBRyxJQUFJLENBQUM7b0JBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUE3REsseUJBQXlCO1FBUzVCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw0QkFBYSxDQUFBO09BVlYseUJBQXlCLENBNkQ5QjtJQUVELE1BQU0sNkJBQTZCO1FBQ2xDLFNBQVMsQ0FBQyxPQUE4QjtZQUN2QyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBOEI7WUFDM0MsT0FBTyw2QkFBNkIsQ0FBQyxXQUFXLENBQUM7UUFDbEQsQ0FBQztLQUNEO0lBT0QsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7O2lCQUMzQixnQkFBVyxHQUFHLCtCQUErQixBQUFsQyxDQUFtQztRQUdyRCxZQUNTLE1BQXNCLEVBQ1Asb0JBQTREO1lBRDNFLFdBQU0sR0FBTixNQUFNLENBQWdCO1lBQ1UseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUozRSxlQUFVLEdBQVcsK0JBQTZCLENBQUMsV0FBVyxDQUFDO1FBS3BFLENBQUM7UUFFTCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNsRCxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBRUQsYUFBYSxDQUFDLElBQTJCLEVBQUUsS0FBYSxFQUFFLFlBQStDLEVBQUUsTUFBMEI7WUFDcEksTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNqQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUNsRCxJQUFJLGNBQWMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3JCLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztvQkFDL0UsWUFBWSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQzdCO3dCQUNDLFFBQVEsRUFBRSxHQUFHO3dCQUNiLElBQUksRUFBRSxJQUFBLCtCQUFtQixFQUFDLEdBQUcsQ0FBQzt3QkFDOUIsV0FBVyxFQUFFLElBQUksU0FBUyxDQUFDLFlBQVksRUFBRTt3QkFDekMsS0FBSyxFQUFFLE9BQU8sSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUztxQkFDckUsQ0FBQyxDQUFDO2dCQUNMLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDL0UsWUFBWSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sR0FBRyxHQUFHLEtBQUssSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDM0QsSUFBSSxJQUFBLDJCQUFpQixFQUFDLEdBQUcsRUFBRSxpQkFBTyxDQUFDLE1BQU0sRUFBRSxpQkFBTyxDQUFDLElBQUksRUFBRSxpQkFBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3pFLFlBQVksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO3dCQUMvQixRQUFRLEVBQUUsZ0JBQVEsQ0FBQyxJQUFJO3dCQUN2QixvRUFBb0U7d0JBQ3BFLGVBQWUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTt3QkFDakQsS0FBSyxFQUFFLE9BQU8sSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVM7cUJBQ3pELENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlLENBQUMsWUFBK0M7WUFDOUQsWUFBWSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVDLENBQUM7O0lBakRJLDZCQUE2QjtRQU1oQyxXQUFBLHFDQUFxQixDQUFBO09BTmxCLDZCQUE2QixDQWtEbEM7SUFFRCxNQUFNLFlBQW9DLFNBQVEsc0JBQVU7UUFJM0QsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxZQUNrQixZQUFxQjtZQUV0QyxLQUFLLEVBQUUsQ0FBQztZQUZTLGlCQUFZLEdBQVosWUFBWSxDQUFTO1lBUnRCLFNBQUksR0FBUSxFQUFFLENBQUM7WUFFeEIsV0FBTSxHQUFHLElBQUksR0FBTSxDQUFDO1FBUzVCLENBQUM7UUFFRCxHQUFHO1lBQ0YsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUcsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsT0FBTyxDQUFDLElBQU87WUFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixDQUFDO0tBQ0Q7SUFFRCxNQUFNLGNBQWUsU0FBUSxpREFBdUI7UUFDMUMsTUFBTSxDQUFDLFNBQXNCO1lBQ3JDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDeEIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUQsQ0FBQztLQUNEO0lBRUQsTUFBTSxvQkFBb0I7aUJBQ1QsZ0JBQVcsR0FBRyxFQUFFLENBQUM7UUFFakMsU0FBUyxDQUFDLE9BQTBDO1lBQ25ELE9BQU8sb0JBQW9CLENBQUMsV0FBVyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBMEM7WUFDdkQsT0FBTyxzQkFBc0IsQ0FBQztRQUMvQixDQUFDOztJQUdGLE1BQU0sK0JBQStCO1FBQ3BDLGdCQUFnQixDQUFDLE9BQTBDO1lBQzFELE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQzFCLENBQUM7S0FDRDtJQU9ELE1BQU0sb0JBQW9CO1FBR3pCLFlBQW9CLE1BQXNCLEVBQVUsV0FBMkQ7WUFBM0YsV0FBTSxHQUFOLE1BQU0sQ0FBZ0I7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0Q7WUFGL0csZUFBVSxHQUFXLHNCQUFzQixDQUFDO1FBRXVFLENBQUM7UUFFcEgsd0JBQXdCLENBQUMsT0FBZ0YsRUFBRSxLQUFhLEVBQUUsWUFBMkMsRUFBRSxNQUEwQjtZQUNoTSxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUNsRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzRCxZQUFZLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUMxRixLQUFLLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztnQkFDeEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGdCQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxnQkFBUSxDQUFDLElBQUk7Z0JBQzVELFlBQVksRUFBRSxDQUFDLGVBQWUsQ0FBQztnQkFDL0IsZUFBZSxFQUFFLElBQUksQ0FBQyxXQUFXO2FBQ2pDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNsRCxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBQ0QsYUFBYSxDQUFDLE9BQTJELEVBQUUsS0FBYSxFQUFFLFlBQTJDLEVBQUUsTUFBMEI7WUFDaEssWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLGdCQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzdFLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO29CQUMvQyxRQUFRLEVBQUUsZ0JBQVEsQ0FBQyxJQUFJO29CQUN2QixRQUFRLEVBQUUsSUFBSTtvQkFDZCxlQUFlLEVBQUUsSUFBSSxDQUFDLFdBQVc7aUJBQ2pDLENBQUMsQ0FBQztZQUNKLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxZQUFZLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRTtvQkFDOUYsS0FBSyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSztvQkFDNUIsUUFBUSxFQUFFLGdCQUFRLENBQUMsTUFBTTtvQkFDekIsZUFBZSxFQUFFLElBQUksQ0FBQyxXQUFXO2lCQUNqQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUNELGVBQWUsQ0FBQyxZQUEyQztZQUMxRCxZQUFZLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUMsQ0FBQztLQUNEO0lBRUQsTUFBTSxzQkFBc0I7UUFDM0IsV0FBVyxDQUFDLE9BQTBDO1lBQ3JELE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBMEM7WUFDM0QsT0FBTyxPQUFPLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUMvQixDQUFDO0tBQ0Q7SUFFRCxTQUFTLDZCQUE2QixDQUFDLElBQVk7UUFDbEQsT0FBTyxPQUFPLElBQUksSUFBSSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFDLEdBQTZCO1FBQ3ZELE9BQU8sT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFDLElBQVM7UUFDbkMsT0FBTyxJQUFJLElBQUksTUFBTSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGlCQUFpQixDQUFDO0lBQ2xFLENBQUM7SUFFRCxTQUFTLDJCQUEyQixDQUFDLElBQXFCO1FBQ3pELE9BQU8sSUFBSSxJQUFJLG1CQUFtQixJQUFJLElBQUksQ0FBQztJQUM1QyxDQUFDO0lBRUQsU0FBUyx5QkFBeUIsQ0FBQyxJQUFxQjtRQUN2RCxPQUFPLElBQUksSUFBSSxNQUFNLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO0lBQzFELENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQXFCO1FBQ2xELE9BQU8sSUFBSSxJQUFJLG1CQUFtQixJQUFJLElBQUksQ0FBQztJQUM1QyxDQUFDO0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxLQUE0RCxFQUFFLENBQVM7UUFDMUcsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxTQUFTLG9DQUFvQyxDQUFDLEtBQXFDLEVBQUUsQ0FBUztRQUM3RixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDMUQsQ0FBQyJ9