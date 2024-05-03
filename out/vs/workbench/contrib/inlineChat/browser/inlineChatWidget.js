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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/components/accessibleDiffViewer", "vs/editor/browser/widget/diffEditor/embeddedDiffEditorWidget", "vs/editor/common/core/lineRange", "vs/editor/common/diff/rangeMapping", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/buttonbar", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/browser/chatFollowups", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/inlineChat/browser/utils", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatColors", "vs/editor/common/core/selection", "vs/workbench/contrib/chat/common/chatAgents", "vs/base/common/arrays", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/contrib/chat/common/chatService", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/platform/instantiation/common/serviceCollection", "vs/css!./media/inlineChat"], function (require, exports, dom_1, iconLabels_1, progressbar_1, event_1, htmlContent_1, lazy_1, lifecycle_1, observable_1, accessibleDiffViewer_1, embeddedDiffEditorWidget_1, lineRange_1, rangeMapping_1, resolverService_1, nls_1, accessibility_1, buttonbar_1, toolbar_1, actions_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, colorRegistry_1, accessibleView_1, chatFollowups_1, chatModel_1, chatViewModel_1, utils_1, inlineChat_1, chatWidget_1, chatColors_1, selection_1, chatAgents_1, arrays_1, editorExtensions_1, snippetController2_1, suggestController_1, chatService_1, updatableHoverWidget_1, hoverDelegateFactory_1, serviceCollection_1) {
    "use strict";
    var HunkAccessibleDiffViewer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorBasedInlineChatWidget = exports.InlineChatWidget = void 0;
    let InlineChatWidget = class InlineChatWidget {
        constructor(location, options, _instantiationService, _contextKeyService, _keybindingService, _accessibilityService, _configurationService, _accessibleViewService, _textModelResolverService, _chatService) {
            // Share hover delegates between toolbars to support instant hover between both
            // TODO@jrieken move into chat widget
            // const hoverDelegate = this._store.add(createInstantHoverDelegate());
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this._accessibleViewService = _accessibleViewService;
            this._textModelResolverService = _textModelResolverService;
            this._chatService = _chatService;
            this._elements = (0, dom_1.h)('div.inline-chat@root', [
                (0, dom_1.h)('div.chat-widget@chatWidget'),
                (0, dom_1.h)('div.progress@progress'),
                (0, dom_1.h)('div.followUps.hidden@followUps'),
                (0, dom_1.h)('div.previewDiff.hidden@previewDiff'),
                (0, dom_1.h)('div.accessibleViewer@accessibleViewer'),
                (0, dom_1.h)('div.status@status', [
                    (0, dom_1.h)('div.label.info.hidden@infoLabel'),
                    (0, dom_1.h)('div.actions.hidden@statusToolbar'),
                    (0, dom_1.h)('div.label.status.hidden@statusLabel'),
                    (0, dom_1.h)('div.actions.hidden@feedbackToolbar'),
                ]),
            ]);
            this._store = new lifecycle_1.DisposableStore();
            this._onDidChangeHeight = this._store.add(new event_1.Emitter());
            this.onDidChangeHeight = event_1.Event.filter(this._onDidChangeHeight.event, _ => !this._isLayouting);
            this._onDidChangeInput = this._store.add(new event_1.Emitter());
            this.onDidChangeInput = this._onDidChangeInput.event;
            this._isLayouting = false;
            this._followUpDisposables = this._store.add(new lifecycle_1.DisposableStore());
            this._store.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */)) {
                    this._updateAriaLabel();
                    // TODO@jrieken	FIX THIS
                    // this._chatWidget.ariaLabel = this._accessibleViewService.getOpenAriaHint(AccessibilityVerbositySettingId.InlineChat);
                    this._elements.followUps.ariaLabel = this._accessibleViewService.getOpenAriaHint("accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */);
                }
            }));
            // toolbars
            this._progressBar = new progressbar_1.ProgressBar(this._elements.progress);
            this._store.add(this._progressBar);
            let allowRequests = false;
            const scopedInstaService = _instantiationService.createChild(new serviceCollection_1.ServiceCollection([
                contextkey_1.IContextKeyService,
                this._store.add(_contextKeyService.createScoped(this._elements.chatWidget))
            ]));
            this._chatWidget = scopedInstaService.createInstance(chatWidget_1.ChatWidget, location, { resource: true }, {
                defaultElementHeight: 32,
                renderStyle: 'compact',
                renderInputOnTop: true,
                supportsFileReferences: true,
                editorOverflowWidgetsDomNode: options.editorOverflowWidgetsDomNode,
                editableCodeBlocks: options.editableCodeBlocks,
                menus: {
                    executeToolbar: options.inputMenuId,
                    inputSideToolbar: options.widgetMenuId,
                    telemetrySource: options.telemetrySource
                },
                filter: item => {
                    if ((0, chatViewModel_1.isWelcomeVM)(item)) {
                        return false;
                    }
                    if ((0, chatViewModel_1.isRequestVM)(item)) {
                        return allowRequests;
                    }
                    return true;
                },
            }, {
                listForeground: colorRegistry_1.editorForeground,
                listBackground: inlineChat_1.inlineChatBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            });
            this._chatWidget.render(this._elements.chatWidget);
            this._elements.chatWidget.style.setProperty((0, colorRegistry_1.asCssVariableName)(chatColors_1.chatRequestBackground), (0, colorRegistry_1.asCssVariable)(inlineChat_1.inlineChatBackground));
            this._chatWidget.setVisible(true);
            this._store.add(this._chatWidget);
            const viewModelListener = this._store.add(new lifecycle_1.MutableDisposable());
            this._store.add(this._chatWidget.onDidChangeViewModel(() => {
                const model = this._chatWidget.viewModel;
                if (!model) {
                    allowRequests = false;
                    viewModelListener.clear();
                    return;
                }
                const updateAllowRequestsFilter = () => {
                    let requestCount = 0;
                    for (const item of model.getItems()) {
                        if ((0, chatViewModel_1.isRequestVM)(item)) {
                            if (++requestCount >= 2) {
                                break;
                            }
                        }
                    }
                    const newAllowRequest = requestCount >= 2;
                    if (newAllowRequest !== allowRequests) {
                        allowRequests = newAllowRequest;
                        this._chatWidget.refilter();
                    }
                };
                viewModelListener.value = model.onDidChange(updateAllowRequestsFilter);
            }));
            const viewModelStore = this._store.add(new lifecycle_1.DisposableStore());
            this._store.add(this._chatWidget.onDidChangeViewModel(() => {
                viewModelStore.clear();
                const viewModel = this._chatWidget.viewModel;
                if (viewModel) {
                    viewModelStore.add(viewModel.onDidChange(() => this._onDidChangeHeight.fire()));
                }
                this._onDidChangeHeight.fire();
            }));
            this._store.add(this.chatWidget.onDidChangeContentHeight(() => {
                this._onDidChangeHeight.fire();
            }));
            // context keys
            this._ctxResponseFocused = inlineChat_1.CTX_INLINE_CHAT_RESPONSE_FOCUSED.bindTo(this._contextKeyService);
            const tracker = this._store.add((0, dom_1.trackFocus)(this.domNode));
            this._store.add(tracker.onDidBlur(() => this._ctxResponseFocused.set(false)));
            this._store.add(tracker.onDidFocus(() => this._ctxResponseFocused.set(true)));
            this._ctxInputEditorFocused = inlineChat_1.CTX_INLINE_CHAT_FOCUSED.bindTo(_contextKeyService);
            this._store.add(this._chatWidget.inputEditor.onDidFocusEditorWidget(() => this._ctxInputEditorFocused.set(true)));
            this._store.add(this._chatWidget.inputEditor.onDidBlurEditorWidget(() => this._ctxInputEditorFocused.set(false)));
            const statusMenuId = options.statusMenuId instanceof actions_1.MenuId ? options.statusMenuId : options.statusMenuId.menu;
            const statusMenuOptions = options.statusMenuId instanceof actions_1.MenuId ? undefined : options.statusMenuId.options;
            const statusButtonBar = this._instantiationService.createInstance(buttonbar_1.MenuWorkbenchButtonBar, this._elements.statusToolbar, statusMenuId, statusMenuOptions);
            this._store.add(statusButtonBar.onDidChange(() => this._onDidChangeHeight.fire()));
            this._store.add(statusButtonBar);
            const workbenchToolbarOptions = {
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                toolbarOptions: {
                    primaryGroup: () => true,
                    useSeparatorsInPrimaryActions: true
                }
            };
            const feedbackToolbar = this._instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this._elements.feedbackToolbar, options.feedbackMenuId, { ...workbenchToolbarOptions, hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */ });
            this._store.add(feedbackToolbar.onDidChangeMenuItems(() => this._onDidChangeHeight.fire()));
            this._store.add(feedbackToolbar);
            this._elements.followUps.tabIndex = 0;
            this._elements.followUps.ariaLabel = this._accessibleViewService.getOpenAriaHint("accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */);
            this._elements.statusLabel.tabIndex = 0;
            // this._elements.status
            this._store.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), this._elements.statusLabel, () => {
                return this._elements.statusLabel.dataset['title'];
            }));
            this._store.add(this._chatService.onDidPerformUserAction(e => {
                if (e.sessionId === this._chatWidget.viewModel?.model.sessionId && e.action.kind === 'vote') {
                    this.updateStatus('Thank you for your feedback!', { resetAfter: 1250 });
                }
            }));
            // LEGACY - default chat model
            // this is only here for as long as we offer updateChatMessage
            this._defaultChatModel = this._store.add(this._instantiationService.createInstance(chatModel_1.ChatModel, `inlineChatDefaultModel/${location}`, undefined));
            this._defaultChatModel.startInitialize();
            this._defaultChatModel.initialize({ id: 1 }, undefined);
            this.setChatModel(this._defaultChatModel);
        }
        _updateAriaLabel() {
            if (!this._accessibilityService.isScreenReaderOptimized()) {
                return;
            }
            let label = defaultAriaLabel;
            if (this._configurationService.getValue("accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */)) {
                const kbLabel = this._keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
                label = kbLabel ? (0, nls_1.localize)('inlineChat.accessibilityHelp', "Inline Chat Input, Use {0} for Inline Chat Accessibility Help.", kbLabel) : (0, nls_1.localize)('inlineChat.accessibilityHelpNoKb', "Inline Chat Input, Run the Inline Chat Accessibility Help command for more information.");
            }
            this._chatWidget.inputEditor.updateOptions({ ariaLabel: label });
        }
        dispose() {
            this._store.dispose();
        }
        get domNode() {
            return this._elements.root;
        }
        get chatWidget() {
            return this._chatWidget;
        }
        saveState() {
            this._chatWidget.saveState();
        }
        layout(widgetDim) {
            this._isLayouting = true;
            try {
                this._doLayout(widgetDim);
            }
            finally {
                this._isLayouting = false;
            }
        }
        _doLayout(dimension) {
            const extraHeight = this._getExtraHeight();
            const progressHeight = (0, dom_1.getTotalHeight)(this._elements.progress);
            const followUpsHeight = (0, dom_1.getTotalHeight)(this._elements.followUps);
            const statusHeight = (0, dom_1.getTotalHeight)(this._elements.status);
            // console.log('ZONE#Widget#layout', { height: dimension.height, extraHeight, progressHeight, followUpsHeight, statusHeight, LIST: dimension.height - progressHeight - followUpsHeight - statusHeight - extraHeight });
            this._elements.root.style.height = `${dimension.height - extraHeight}px`;
            this._elements.root.style.width = `${dimension.width}px`;
            this._elements.progress.style.width = `${dimension.width}px`;
            this._chatWidget.layout(dimension.height - progressHeight - followUpsHeight - statusHeight - extraHeight, dimension.width);
        }
        /**
         * The content height of this widget is the size that would require no scrolling
         */
        get contentHeight() {
            const data = {
                followUpsHeight: (0, dom_1.getTotalHeight)(this._elements.followUps),
                chatWidgetContentHeight: this._chatWidget.contentHeight,
                progressHeight: (0, dom_1.getTotalHeight)(this._elements.progress),
                statusHeight: (0, dom_1.getTotalHeight)(this._elements.status),
                extraHeight: this._getExtraHeight()
            };
            const result = data.progressHeight + data.chatWidgetContentHeight + data.followUpsHeight + data.statusHeight + data.extraHeight;
            return result;
        }
        get minHeight() {
            // The chat widget is variable height and supports scrolling. It
            // should be at least 100px high and at most the content height.
            let value = this.contentHeight;
            value -= this._chatWidget.contentHeight;
            value += Math.min(100, this._chatWidget.contentHeight);
            return value;
        }
        _getExtraHeight() {
            return 12 /* padding */ + 2 /*border*/ + 12 /*shadow*/;
        }
        updateProgress(show) {
            if (show) {
                this._progressBar.show();
                this._progressBar.infinite();
            }
            else {
                this._progressBar.stop();
                this._progressBar.hide();
            }
        }
        get value() {
            return this._chatWidget.getInput();
        }
        set value(value) {
            this._chatWidget.setInput(value);
        }
        selectAll(includeSlashCommand = true) {
            // DEBT@jrieken
            // REMOVE when agents are adopted
            let startColumn = 1;
            if (!includeSlashCommand) {
                const match = /^(\/\w+)\s*/.exec(this._chatWidget.inputEditor.getModel().getLineContent(1));
                if (match) {
                    startColumn = match[1].length + 1;
                }
            }
            this._chatWidget.inputEditor.setSelection(new selection_1.Selection(1, startColumn, Number.MAX_SAFE_INTEGER, 1));
        }
        set placeholder(value) {
            this._chatWidget.setInputPlaceholder(value);
        }
        updateToolbar(show) {
            this._elements.statusToolbar.classList.toggle('hidden', !show);
            this._elements.feedbackToolbar.classList.toggle('hidden', !show);
            this._elements.status.classList.toggle('actions', show);
            this._elements.infoLabel.classList.toggle('hidden', show);
            this._onDidChangeHeight.fire();
        }
        async getCodeBlockInfo(codeBlockIndex) {
            const { viewModel } = this._chatWidget;
            if (!viewModel) {
                return undefined;
            }
            for (const item of viewModel.getItems()) {
                if ((0, chatViewModel_1.isResponseVM)(item)) {
                    return viewModel.codeBlockModelCollection.get(viewModel.sessionId, item, codeBlockIndex)?.model;
                }
            }
            return undefined;
        }
        get responseContent() {
            const requests = this._chatWidget.viewModel?.model.getRequests();
            if (!(0, arrays_1.isNonEmptyArray)(requests)) {
                return undefined;
            }
            return (0, arrays_1.tail)(requests).response?.response.asString();
        }
        getChatModel() {
            return this._chatWidget.viewModel?.model ?? this._defaultChatModel;
        }
        setChatModel(chatModel) {
            this._chatWidget.setModel(chatModel, { inputValue: undefined });
        }
        /**
         * @deprecated use `setChatModel` instead
         */
        addToHistory(input) {
            if (this._chatWidget.viewModel?.model === this._defaultChatModel) {
                this._chatWidget.input.acceptInput(input);
            }
        }
        updateChatMessage(message, isIncomplete, isCodeBlockEditable) {
            if (!this._chatWidget.viewModel || this._chatWidget.viewModel.model !== this._defaultChatModel) {
                // this can only be used with the default chat model
                return;
            }
            const model = this._defaultChatModel;
            if (!message?.message.value) {
                for (const request of model.getRequests()) {
                    model.removeRequest(request.id);
                }
                return;
            }
            const chatRequest = model.addRequest({ parts: [], text: '' }, { variables: [] });
            model.acceptResponseProgress(chatRequest, {
                kind: 'markdownContent',
                content: message.message
            });
            if (!isIncomplete) {
                model.completeResponse(chatRequest);
                return;
            }
            return {
                cancel: () => model.cancelRequest(chatRequest),
                complete: () => model.completeResponse(chatRequest),
                appendContent: (fragment) => {
                    model.acceptResponseProgress(chatRequest, {
                        kind: 'markdownContent',
                        content: new htmlContent_1.MarkdownString(fragment)
                    });
                }
            };
        }
        updateFollowUps(items, onFollowup) {
            this._followUpDisposables.clear();
            this._elements.followUps.classList.toggle('hidden', !items || items.length === 0);
            (0, dom_1.reset)(this._elements.followUps);
            if (items && items.length > 0 && onFollowup) {
                this._followUpDisposables.add(this._instantiationService.createInstance(chatFollowups_1.ChatFollowups, this._elements.followUps, items, chatAgents_1.ChatAgentLocation.Editor, undefined, onFollowup));
            }
            this._onDidChangeHeight.fire();
        }
        updateSlashCommands(commands) {
            // this._inputWidget.updateSlashCommands(commands);
            // TODO@jrieken
        }
        updateInfo(message) {
            this._elements.infoLabel.classList.toggle('hidden', !message);
            const renderedMessage = (0, iconLabels_1.renderLabelWithIcons)(message);
            (0, dom_1.reset)(this._elements.infoLabel, ...renderedMessage);
            this._onDidChangeHeight.fire();
        }
        updateStatus(message, ops = {}) {
            const isTempMessage = typeof ops.resetAfter === 'number';
            if (isTempMessage && !this._elements.statusLabel.dataset['state']) {
                const statusLabel = this._elements.statusLabel.innerText;
                const title = this._elements.statusLabel.dataset['title'];
                const classes = Array.from(this._elements.statusLabel.classList.values());
                setTimeout(() => {
                    this.updateStatus(statusLabel, { classes, keepMessage: true, title });
                }, ops.resetAfter);
            }
            const renderedMessage = (0, iconLabels_1.renderLabelWithIcons)(message);
            (0, dom_1.reset)(this._elements.statusLabel, ...renderedMessage);
            this._elements.statusLabel.className = `label status ${(ops.classes ?? []).join(' ')}`;
            this._elements.statusLabel.classList.toggle('hidden', !message);
            if (isTempMessage) {
                this._elements.statusLabel.dataset['state'] = 'temp';
            }
            else {
                delete this._elements.statusLabel.dataset['state'];
            }
            if (ops.title) {
                this._elements.statusLabel.dataset['title'] = ops.title;
            }
            else {
                delete this._elements.statusLabel.dataset['title'];
            }
            this._onDidChangeHeight.fire();
        }
        reset() {
            this._chatWidget.saveState();
            this.updateChatMessage(undefined);
            this.updateFollowUps(undefined);
            (0, dom_1.reset)(this._elements.statusLabel);
            this._elements.statusLabel.classList.toggle('hidden', true);
            this._elements.statusToolbar.classList.add('hidden');
            this._elements.feedbackToolbar.classList.add('hidden');
            this.updateInfo('');
            this._elements.accessibleViewer.classList.toggle('hidden', true);
            this._onDidChangeHeight.fire();
        }
        focus() {
            this._chatWidget.focusInput();
        }
        hasFocus() {
            return this.domNode.contains((0, dom_1.getActiveElement)());
        }
    };
    exports.InlineChatWidget = InlineChatWidget;
    exports.InlineChatWidget = InlineChatWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, accessibility_1.IAccessibilityService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, accessibleView_1.IAccessibleViewService),
        __param(8, resolverService_1.ITextModelService),
        __param(9, chatService_1.IChatService)
    ], InlineChatWidget);
    const defaultAriaLabel = (0, nls_1.localize)('aria-label', "Inline Chat Input");
    const codeEditorWidgetOptions = {
        isSimpleWidget: true,
        contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
            snippetController2_1.SnippetController2.ID,
            suggestController_1.SuggestController.ID
        ])
    };
    const _previewEditorEditorOptions = {
        scrollbar: { useShadows: false, alwaysConsumeMouseWheel: false, ignoreHorizontalScrollbarInContentHeight: true, },
        renderMarginRevertIcon: false,
        diffCodeLens: false,
        scrollBeyondLastLine: false,
        stickyScroll: { enabled: false },
        originalAriaLabel: (0, nls_1.localize)('original', 'Original'),
        modifiedAriaLabel: (0, nls_1.localize)('modified', 'Modified'),
        diffAlgorithm: 'advanced',
        readOnly: true,
        isInEmbeddedEditor: true
    };
    let EditorBasedInlineChatWidget = class EditorBasedInlineChatWidget extends InlineChatWidget {
        constructor(_parentEditor, options, contextKeyService, keybindingService, instantiationService, accessibilityService, configurationService, accessibleViewService, textModelResolverService, chatService) {
            super(chatAgents_1.ChatAgentLocation.Editor, { ...options, editorOverflowWidgetsDomNode: _parentEditor.getOverflowWidgetsDomNode() }, instantiationService, contextKeyService, keybindingService, accessibilityService, configurationService, accessibleViewService, textModelResolverService, chatService);
            this._parentEditor = _parentEditor;
            this._accessibleViewer = this._store.add(new lifecycle_1.MutableDisposable());
            this._previewDiffModel = this._store.add(new lifecycle_1.MutableDisposable());
            // preview editors
            this._previewDiffEditor = new lazy_1.Lazy(() => this._store.add(instantiationService.createInstance(embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget, this._elements.previewDiff, {
                useInlineViewWhenSpaceIsLimited: false,
                ..._previewEditorEditorOptions,
                onlyShowAccessibleDiffViewer: accessibilityService.isScreenReaderOptimized(),
            }, { modifiedEditor: codeEditorWidgetOptions, originalEditor: codeEditorWidgetOptions }, _parentEditor)));
        }
        // --- layout
        get contentHeight() {
            let result = super.contentHeight;
            if (this._previewDiffEditor.hasValue && this._previewDiffEditor.value.getModel()) {
                result += 14 + Math.min(300, this._previewDiffEditor.value.getContentHeight());
            }
            if (this._accessibleViewer.value) {
                result += this._accessibleViewer.value.height;
            }
            return result;
        }
        _doLayout(dimension) {
            let newHeight = dimension.height;
            if (this._previewDiffEditor.hasValue) {
                const previewDiffDim = new dom_1.Dimension(dimension.width - 12, Math.min(300, this._previewDiffEditor.value.getContentHeight()));
                this._elements.previewDiff.style.width = `${previewDiffDim.width}px`;
                this._elements.previewDiff.style.height = `${previewDiffDim.height}px`;
                this._previewDiffEditor.value.layout(previewDiffDim);
                newHeight -= previewDiffDim.height + 14;
            }
            if (this._accessibleViewer.value) {
                this._accessibleViewer.value.width = dimension.width - 12;
                newHeight -= this._accessibleViewer.value.height;
            }
            super._doLayout(dimension.with(undefined, newHeight));
            // update/fix the height of the zone which was set to newHeight in super._doLayout
            this._elements.root.style.height = `${dimension.height - this._getExtraHeight()}px`;
        }
        reset() {
            this.hideEditsPreview();
            this._accessibleViewer.clear();
            super.reset();
        }
        // --- accessible viewer
        showAccessibleHunk(session, hunkData) {
            this._elements.accessibleViewer.classList.remove('hidden');
            this._accessibleViewer.clear();
            this._accessibleViewer.value = this._instantiationService.createInstance(HunkAccessibleDiffViewer, this._elements.accessibleViewer, session, hunkData, new AccessibleHunk(this._parentEditor, session, hunkData));
            this._onDidChangeHeight.fire();
        }
        // --- preview
        showEditsPreview(hunks, textModel0, textModelN) {
            if (hunks.size === 0) {
                this.hideEditsPreview();
                return;
            }
            this._elements.previewDiff.classList.remove('hidden');
            this._previewDiffEditor.value.setModel({ original: textModel0, modified: textModelN });
            // joined ranges
            let originalLineRange;
            let modifiedLineRange;
            for (const item of hunks.getInfo()) {
                const [first0] = item.getRanges0();
                const [firstN] = item.getRangesN();
                originalLineRange = !originalLineRange ? lineRange_1.LineRange.fromRangeInclusive(first0) : originalLineRange.join(lineRange_1.LineRange.fromRangeInclusive(first0));
                modifiedLineRange = !modifiedLineRange ? lineRange_1.LineRange.fromRangeInclusive(firstN) : modifiedLineRange.join(lineRange_1.LineRange.fromRangeInclusive(firstN));
            }
            if (!originalLineRange || !modifiedLineRange) {
                this.hideEditsPreview();
                return;
            }
            const hiddenOriginal = (0, utils_1.invertLineRange)(originalLineRange, textModel0);
            const hiddenModified = (0, utils_1.invertLineRange)(modifiedLineRange, textModelN);
            this._previewDiffEditor.value.getOriginalEditor().setHiddenAreas(hiddenOriginal.map(lr => (0, utils_1.asRange)(lr, textModel0)), 'diff-hidden');
            this._previewDiffEditor.value.getModifiedEditor().setHiddenAreas(hiddenModified.map(lr => (0, utils_1.asRange)(lr, textModelN)), 'diff-hidden');
            this._previewDiffEditor.value.revealLine(modifiedLineRange.startLineNumber, 1 /* ScrollType.Immediate */);
            this._onDidChangeHeight.fire();
        }
        hideEditsPreview() {
            this._elements.previewDiff.classList.add('hidden');
            if (this._previewDiffEditor.hasValue) {
                this._previewDiffEditor.value.setModel(null);
            }
            this._previewDiffModel.clear();
            this._onDidChangeHeight.fire();
        }
        showsAnyPreview() {
            return !this._elements.previewDiff.classList.contains('hidden');
        }
    };
    exports.EditorBasedInlineChatWidget = EditorBasedInlineChatWidget;
    exports.EditorBasedInlineChatWidget = EditorBasedInlineChatWidget = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, accessibility_1.IAccessibilityService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, accessibleView_1.IAccessibleViewService),
        __param(8, resolverService_1.ITextModelService),
        __param(9, chatService_1.IChatService)
    ], EditorBasedInlineChatWidget);
    let HunkAccessibleDiffViewer = HunkAccessibleDiffViewer_1 = class HunkAccessibleDiffViewer extends accessibleDiffViewer_1.AccessibleDiffViewer {
        set width(value) {
            this._width2.set(value, undefined);
        }
        constructor(parentNode, session, hunk, models, instantiationService) {
            const width = (0, observable_1.observableValue)('width', 0);
            const diff = (0, observable_1.observableValue)('diff', HunkAccessibleDiffViewer_1._asMapping(hunk));
            const diffs = (0, observable_1.derived)(r => [diff.read(r)]);
            const lines = Math.min(10, 8 + diff.get().changedLineCount);
            const height = models.getModifiedOptions().get(67 /* EditorOption.lineHeight */) * lines;
            super(parentNode, (0, observable_1.constObservable)(true), () => { }, (0, observable_1.constObservable)(false), width, (0, observable_1.constObservable)(height), diffs, models, instantiationService);
            this.height = height;
            this._width2 = width;
            this._store.add(session.textModelN.onDidChangeContent(() => {
                diff.set(HunkAccessibleDiffViewer_1._asMapping(hunk), undefined);
            }));
        }
        static _asMapping(hunk) {
            const ranges0 = hunk.getRanges0();
            const rangesN = hunk.getRangesN();
            const originalLineRange = lineRange_1.LineRange.fromRangeInclusive(ranges0[0]);
            const modifiedLineRange = lineRange_1.LineRange.fromRangeInclusive(rangesN[0]);
            const innerChanges = [];
            for (let i = 1; i < ranges0.length; i++) {
                innerChanges.push(new rangeMapping_1.RangeMapping(ranges0[i], rangesN[i]));
            }
            return new rangeMapping_1.DetailedLineRangeMapping(originalLineRange, modifiedLineRange, innerChanges);
        }
    };
    HunkAccessibleDiffViewer = HunkAccessibleDiffViewer_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], HunkAccessibleDiffViewer);
    class AccessibleHunk {
        constructor(_editor, _session, _hunk) {
            this._editor = _editor;
            this._session = _session;
            this._hunk = _hunk;
        }
        getOriginalModel() {
            return this._session.textModel0;
        }
        getModifiedModel() {
            return this._session.textModelN;
        }
        getOriginalOptions() {
            return this._editor.getOptions();
        }
        getModifiedOptions() {
            return this._editor.getOptions();
        }
        originalReveal(range) {
            // throw new Error('Method not implemented.');
        }
        modifiedReveal(range) {
            this._editor.revealRangeInCenterIfOutsideViewport(range || this._hunk.getRangesN()[0], 0 /* ScrollType.Smooth */);
        }
        modifiedSetSelection(range) {
            // this._editor.revealRangeInCenterIfOutsideViewport(range, ScrollType.Smooth);
            // this._editor.setSelection(range);
        }
        modifiedFocus() {
            this._editor.focus();
        }
        getModifiedPosition() {
            return this._hunk.getRangesN()[0].getStartPosition();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9icm93c2VyL2lubGluZUNoYXRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJHekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7UUFxQzVCLFlBQ0MsUUFBMkIsRUFDM0IsT0FBNkMsRUFDdEIscUJBQStELEVBQ2xFLGtCQUF1RCxFQUN2RCxrQkFBdUQsRUFDcEQscUJBQTZELEVBQzdELHFCQUE2RCxFQUM1RCxzQkFBK0QsRUFDcEUseUJBQStELEVBQ3BFLFlBQTJDO1lBRXpELCtFQUErRTtZQUMvRSxxQ0FBcUM7WUFDckMsdUVBQXVFO1lBWDdCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDakQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN0Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ25DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMzQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ2pELDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBbUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWM7WUE3Q3ZDLGNBQVMsR0FBRyxJQUFBLE9BQUMsRUFDL0Isc0JBQXNCLEVBQ3RCO2dCQUNDLElBQUEsT0FBQyxFQUFDLDRCQUE0QixDQUFDO2dCQUMvQixJQUFBLE9BQUMsRUFBQyx1QkFBdUIsQ0FBQztnQkFDMUIsSUFBQSxPQUFDLEVBQUMsZ0NBQWdDLENBQUM7Z0JBQ25DLElBQUEsT0FBQyxFQUFDLG9DQUFvQyxDQUFDO2dCQUN2QyxJQUFBLE9BQUMsRUFB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