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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fonts", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/toggle/toggle", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/history", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/services/model", "vs/editor/contrib/hover/browser/hover", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatExecuteActions", "vs/workbench/contrib/chat/browser/chatFollowups", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions"], function (require, exports, dom, fonts_1, aria, toggle_1, codicons_1, event_1, history_1, lifecycle_1, platform_1, uri_1, editorExtensions_1, codeEditorWidget_1, model_1, hover_1, nls_1, accessibility_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, toolbar_1, actions_1, configuration_1, contextkey_1, contextView_1, contextScopedHistoryWidget_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, defaultStyles_1, colorRegistry_1, themeService_1, chatActions_1, chatExecuteActions_1, chatFollowups_1, chatAgents_1, chatContextKeys_1, chatWidgetHistoryService_1, simpleEditorOptions_1) {
    "use strict";
    var ChatInputPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatInputPart = void 0;
    const $ = dom.$;
    const INPUT_EDITOR_MAX_HEIGHT = 250;
    let ChatInputPart = class ChatInputPart extends lifecycle_1.Disposable {
        static { ChatInputPart_1 = this; }
        static { this.INPUT_SCHEME = 'chatSessionInput'; }
        static { this._counter = 0; }
        get implicitContextEnabled() {
            return this.implicitContextCheckbox.checked;
        }
        get inputPartHeight() {
            return this._inputPartHeight;
        }
        get inputEditor() {
            return this._inputEditor;
        }
        constructor(
        // private readonly editorOptions: ChatEditorOptions, // TODO this should be used
        location, options, historyService, modelService, instantiationService, contextKeyService, configurationService, keybindingService, accessibilityService) {
            super();
            this.location = location;
            this.options = options;
            this.historyService = historyService;
            this.modelService = modelService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.accessibilityService = accessibilityService;
            this._onDidLoadInputState = this._register(new event_1.Emitter());
            this.onDidLoadInputState = this._onDidLoadInputState.event;
            this._onDidChangeHeight = this._register(new event_1.Emitter());
            this.onDidChangeHeight = this._onDidChangeHeight.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidAcceptFollowup = this._register(new event_1.Emitter());
            this.onDidAcceptFollowup = this._onDidAcceptFollowup.event;
            this.inputEditorHeight = 0;
            this.followupsDisposables = this._register(new lifecycle_1.DisposableStore());
            this.implicitContextSettingEnabled = false;
            this._inputPartHeight = 0;
            this.onHistoryEntry = false;
            this.inHistoryNavigation = false;
            this.inputUri = uri_1.URI.parse(`${ChatInputPart_1.INPUT_SCHEME}:input-${ChatInputPart_1._counter++}`);
            this.inputEditorHasText = chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT.bindTo(contextKeyService);
            this.chatCursorAtTop = chatContextKeys_1.CONTEXT_CHAT_INPUT_CURSOR_AT_TOP.bindTo(contextKeyService);
            this.inputEditorHasFocus = chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_FOCUS.bindTo(contextKeyService);
            this.history = new history_1.HistoryNavigator([], 5);
            this._register(this.historyService.onDidClearHistory(() => this.history.clear()));
            this.implicitContextSettingEnabled = this.configurationService.getValue('chat.experimental.implicitContext');
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */)) {
                    this.inputEditor.updateOptions({ ariaLabel: this._getAriaLabel() });
                }
                if (e.affectsConfiguration('chat.experimental.implicitContext')) {
                    this.implicitContextSettingEnabled = this.configurationService.getValue('chat.experimental.implicitContext');
                }
            }));
        }
        _getAriaLabel() {
            const verbose = this.configurationService.getValue("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */);
            if (verbose) {
                const kbLabel = this.keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
                return kbLabel ? (0, nls_1.localize)('actions.chat.accessibiltyHelp', "Chat Input,  Type to ask questions or type / for topics, press enter to send out the request. Use {0} for Chat Accessibility Help.", kbLabel) : (0, nls_1.localize)('chatInput.accessibilityHelpNoKb', "Chat Input,  Type code here and press Enter to run. Use the Chat Accessibility Help command for more information.");
            }
            return (0, nls_1.localize)('chatInput', "Chat Input");
        }
        setState(providerId, inputValue) {
            this.providerId = providerId;
            const history = this.historyService.getHistory(providerId);
            this.history = new history_1.HistoryNavigator(history, 50);
            if (typeof inputValue === 'string') {
                this.setValue(inputValue);
            }
        }
        get element() {
            return this.container;
        }
        showPreviousValue() {
            this.navigateHistory(true);
        }
        showNextValue() {
            this.navigateHistory(false);
        }
        navigateHistory(previous) {
            const historyEntry = (previous ?
                (this.history.previous() ?? this.history.first()) : this.history.next())
                ?? { text: '' };
            this.onHistoryEntry = previous || this.history.current() !== null;
            aria.status(historyEntry.text);
            this.inHistoryNavigation = true;
            this.setValue(historyEntry.text);
            this.inHistoryNavigation = false;
            this._onDidLoadInputState.fire(historyEntry.state);
            if (previous) {
                this._inputEditor.setPosition({ lineNumber: 1, column: 1 });
            }
            else {
                const model = this._inputEditor.getModel();
                if (!model) {
                    return;
                }
                this._inputEditor.setPosition(getLastPosition(model));
            }
        }
        setValue(value) {
            this.inputEditor.setValue(value);
            // always leave cursor at the end
            this.inputEditor.setPosition({ lineNumber: 1, column: value.length + 1 });
        }
        focus() {
            this._inputEditor.focus();
        }
        hasFocus() {
            return this._inputEditor.hasWidgetFocus();
        }
        /**
         * Reset the input and update history.
         * @param userQuery If provided, this will be added to the history. Followups and programmatic queries should not be passed.
         */
        async acceptInput(userQuery, inputState) {
            if (userQuery) {
                let element = this.history.getHistory().find(candidate => candidate.text === userQuery);
                if (!element) {
                    element = { text: userQuery, state: inputState };
                }
                else {
                    element.state = inputState;
                }
                this.history.add(element);
            }
            if (this.accessibilityService.isScreenReaderOptimized() && platform_1.isMacintosh) {
                this._acceptInputForVoiceover();
            }
            else {
                this._inputEditor.focus();
                this._inputEditor.setValue('');
            }
        }
        _acceptInputForVoiceover() {
            const domNode = this._inputEditor.getDomNode();
            if (!domNode) {
                return;
            }
            // Remove the input editor from the DOM temporarily to prevent VoiceOver
            // from reading the cleared text (the request) to the user.
            this._inputEditorElement.removeChild(domNode);
            this._inputEditor.setValue('');
            this._inputEditorElement.appendChild(domNode);
            this._inputEditor.focus();
        }
        render(container, initialValue, widget) {
            this.container = dom.append(container, $('.interactive-input-part'));
            this.container.classList.toggle('compact', this.options.renderStyle === 'compact');
            this.followupsContainer = dom.append(this.container, $('.interactive-input-followups'));
            this.implicitContextContainer = dom.append(this.container, $('.chat-implicit-context'));
            this.initImplicitContext(this.implicitContextContainer);
            const inputAndSideToolbar = dom.append(this.container, $('.interactive-input-and-side-toolbar'));
            const inputContainer = dom.append(inputAndSideToolbar, $('.interactive-input-and-execute-toolbar'));
            const inputScopedContextKeyService = this._register(this.contextKeyService.createScoped(inputContainer));
            chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.bindTo(inputScopedContextKeyService).set(true);
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, inputScopedContextKeyService]));
            const { historyNavigationBackwardsEnablement, historyNavigationForwardsEnablement } = this._register((0, contextScopedHistoryWidget_1.registerAndCreateHistoryNavigationContext)(inputScopedContextKeyService, this));
            this.historyNavigationBackwardsEnablement = historyNavigationBackwardsEnablement;
            this.historyNavigationForewardsEnablement = historyNavigationForwardsEnablement;
            const options = (0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService);
            options.overflowWidgetsDomNode = this.options.editorOverflowWidgetsDomNode;
            options.readOnly = false;
            options.ariaLabel = this._getAriaLabel();
            options.fontFamily = fonts_1.DEFAULT_FONT_FAMILY;
            options.fontSize = 13;
            options.lineHeight = 20;
            options.padding = this.options.renderStyle === 'compact' ? { top: 2, bottom: 2 } : { top: 8, bottom: 8 };
            options.cursorWidth = 1;
            options.wrappingStrategy = 'advanced';
            options.bracketPairColorization = { enabled: false };
            options.suggest = {
                showIcons: false,
                showSnippets: false,
                showWords: true,
                showStatusBar: false,
                insertMode: 'replace',
            };
            options.scrollbar = { ...(options.scrollbar ?? {}), vertical: 'hidden' };
            this._inputEditorElement = dom.append(inputContainer, $('.interactive-input-editor'));
            const editorOptions = (0, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions)();
            editorOptions.contributions?.push(...editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([hover_1.HoverController.ID]));
            this._inputEditor = this._register(scopedInstantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._inputEditorElement, options, editorOptions));
            this._register(this._inputEditor.onDidChangeModelContent(() => {
                const currentHeight = Math.min(this._inputEditor.getContentHeight(), INPUT_EDITOR_MAX_HEIGHT);
                if (currentHeight !== this.inputEditorHeight) {
                    this.inputEditorHeight = currentHeight;
                    this._onDidChangeHeight.fire();
                }
                // Only allow history navigation when the input is empty.
                // (If this model change happened as a result of a history navigation, this is canceled out by a call in this.navigateHistory)
                const model = this._inputEditor.getModel();
                const inputHasText = !!model && model.getValue().trim().length > 0;
                this.inputEditorHasText.set(inputHasText);
                // If the user is typing on a history entry, then reset the onHistoryEntry flag so that history navigation can be disabled
                if (!this.inHistoryNavigation) {
                    this.onHistoryEntry = false;
                }
                if (!this.onHistoryEntry) {
                    this.historyNavigationForewardsEnablement.set(!inputHasText);
                    this.historyNavigationBackwardsEnablement.set(!inputHasText);
                }
            }));
            this._register(this._inputEditor.onDidFocusEditorText(() => {
                this.inputEditorHasFocus.set(true);
                this._onDidFocus.fire();
                inputContainer.classList.toggle('focused', true);
            }));
            this._register(this._inputEditor.onDidBlurEditorText(() => {
                this.inputEditorHasFocus.set(false);
                inputContainer.classList.toggle('focused', false);
                this._onDidBlur.fire();
            }));
            this._register(this._inputEditor.onDidChangeCursorPosition(e => {
                const model = this._inputEditor.getModel();
                if (!model) {
                    return;
                }
                const atTop = e.position.column === 1 && e.position.lineNumber === 1;
                this.chatCursorAtTop.set(atTop);
                if (this.onHistoryEntry) {
                    this.historyNavigationBackwardsEnablement.set(atTop);
                    this.historyNavigationForewardsEnablement.set(e.position.equals(getLastPosition(model)));
                }
            }));
            this.toolbar = this._register(this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, inputContainer, this.options.menus.executeToolbar, {
                telemetrySource: this.options.menus.telemetrySource,
                menuOptions: {
                    shouldForwardArgs: true
                },
                hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */, // keep it lean when hiding items and avoid a "..." overflow menu
                actionViewItemProvider: (action, options) => {
                    if (this.location === chatAgents_1.ChatAgentLocation.Panel) {
                        if ((action.id === chatExecuteActions_1.SubmitAction.ID || action.id === chatExecuteActions_1.CancelAction.ID) && action instanceof actions_1.MenuItemAction) {
                            const dropdownAction = this.instantiationService.createInstance(actions_1.MenuItemAction, { id: 'chat.moreExecuteActions', title: (0, nls_1.localize)('notebook.moreExecuteActionsLabel', "More..."), icon: codicons_1.Codicon.chevronDown }, undefined, undefined, undefined);
                            return this.instantiationService.createInstance(ChatSubmitDropdownActionItem, action, dropdownAction);
                        }
                    }
                    return undefined;
                }
            }));
            this.toolbar.getElement().classList.add('interactive-execute-toolbar');
            this.toolbar.context = { widget };
            this._register(this.toolbar.onDidChangeMenuItems(() => {
                if (this.cachedDimensions && typeof this.cachedToolbarWidth === 'number' && this.cachedToolbarWidth !== this.toolbar.getItemsWidth()) {
                    this.layout(this.cachedDimensions.height, this.cachedDimensions.width);
                }
            }));
            if (this.options.menus.inputSideToolbar) {
                const toolbarSide = this._register(this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, inputAndSideToolbar, this.options.menus.inputSideToolbar, {
                    telemetrySource: this.options.menus.telemetrySource,
                    menuOptions: {
                        shouldForwardArgs: true
                    }
                }));
                this.inputSideToolbarContainer = toolbarSide.getElement();
                toolbarSide.getElement().classList.add('chat-side-toolbar');
                toolbarSide.context = { widget };
            }
            let inputModel = this.modelService.getModel(this.inputUri);
            if (!inputModel) {
                inputModel = this.modelService.createModel('', null, this.inputUri, true);
                this._register(inputModel);
            }
            this.inputModel = inputModel;
            this.inputModel.updateOptions({ bracketColorizationOptions: { enabled: false, independentColorPoolPerBracketType: false } });
            this._inputEditor.setModel(this.inputModel);
            if (initialValue) {
                this.inputModel.setValue(initialValue);
                const lineNumber = this.inputModel.getLineCount();
                this._inputEditor.setPosition({ lineNumber, column: this.inputModel.getLineMaxColumn(lineNumber) });
            }
        }
        initImplicitContext(container) {
            this.implicitContextCheckbox = new toggle_1.Checkbox('#selection', true, { ...defaultStyles_1.defaultCheckboxStyles, checkboxBorder: (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.checkboxBorder, colorRegistry_1.inputBackground) });
            container.append(this.implicitContextCheckbox.domNode);
            this.implicitContextLabel = dom.append(container, $('span.chat-implicit-context-label'));
            this.implicitContextLabel.textContent = '#selection';
        }
        setImplicitContextKinds(kinds) {
            dom.setVisibility(this.implicitContextSettingEnabled && kinds.length > 0, this.implicitContextContainer);
            this.implicitContextLabel.textContent = (0, nls_1.localize)('use', "Use") + ' ' + kinds.map(k => `#${k}`).join(', ');
        }
        async renderFollowups(items, response) {
            if (!this.options.renderFollowups) {
                return;
            }
            this.followupsDisposables.clear();
            dom.clearNode(this.followupsContainer);
            if (items && items.length > 0) {
                this.followupsDisposables.add(this.instantiationService.createInstance(chatFollowups_1.ChatFollowups, this.followupsContainer, items, this.location, undefined, followup => this._onDidAcceptFollowup.fire({ followup, response })));
            }
        }
        layout(height, width) {
            this.cachedDimensions = new dom.Dimension(width, height);
            return this._layout(height, width);
        }
        _layout(height, width, allowRecurse = true) {
            const followupsHeight = this.followupsContainer.offsetHeight;
            const inputPartBorder = 0;
            const inputPartHorizontalPadding = this.options.renderStyle === 'compact' ? 8 : 40;
            const inputPartVerticalPadding = this.options.renderStyle === 'compact' ? 12 : 24;
            const inputEditorHeight = Math.min(this._inputEditor.getContentHeight(), height - followupsHeight - inputPartVerticalPadding - inputPartBorder, INPUT_EDITOR_MAX_HEIGHT);
            const implicitContextHeight = this.implicitContextContainer.offsetHeight;
            const inputEditorBorder = 2;
            this._inputPartHeight = followupsHeight + inputEditorHeight + inputPartVerticalPadding + inputPartBorder + inputEditorBorder + implicitContextHeight;
            const editorBorder = 2;
            const editorPadding = 12;
            const executeToolbarWidth = this.cachedToolbarWidth = this.toolbar.getItemsWidth();
            const toolbarPadding = 4;
            const sideToolbarWidth = this.inputSideToolbarContainer ? dom.getTotalWidth(this.inputSideToolbarContainer) + 4 /*gap*/ : 0;
            const initialEditorScrollWidth = this._inputEditor.getScrollWidth();
            const newEditorWidth = width - inputPartHorizontalPadding - editorBorder - editorPadding - executeToolbarWidth - sideToolbarWidth - toolbarPadding;
            const newDimension = { width: newEditorWidth, height: inputEditorHeight };
            if (!this.previousInputEditorDimension || (this.previousInputEditorDimension.width !== newDimension.width || this.previousInputEditorDimension.height !== newDimension.height)) {
                // This layout call has side-effects that are hard to understand. eg if we are calling this inside a onDidChangeContent handler, this can trigger the next onDidChangeContent handler
                // to be invoked, and we have a lot of these on this editor. Only doing a layout this when the editor size has actually changed makes it much easier to follow.
                this._inputEditor.layout(newDimension);
                this.previousInputEditorDimension = newDimension;
            }
            if (allowRecurse && initialEditorScrollWidth < 10) {
                // This is probably the initial layout. Now that the editor is layed out with its correct width, it should report the correct contentHeight
                return this._layout(height, width, false);
            }
        }
        saveState() {
            const inputHistory = this.history.getHistory();
            this.historyService.saveHistory(this.providerId, inputHistory);
        }
    };
    exports.ChatInputPart = ChatInputPart;
    exports.ChatInputPart = ChatInputPart = ChatInputPart_1 = __decorate([
        __param(2, chatWidgetHistoryService_1.IChatWidgetHistoryService),
        __param(3, model_1.IModelService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, accessibility_1.IAccessibilityService)
    ], ChatInputPart);
    function getLastPosition(model) {
        return { lineNumber: model.getLineCount(), column: model.getLineLength(model.getLineCount()) + 1 };
    }
    // This does seems like a lot just to customize an item with dropdown. This whole class exists just because we need an
    // onDidChange listener on the submenu, which is apparently not needed in other cases.
    let ChatSubmitDropdownActionItem = class ChatSubmitDropdownActionItem extends dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem {
        constructor(action, dropdownAction, menuService, contextMenuService, chatAgentService, contextKeyService, keybindingService, notificationService, themeService, accessibilityService) {
            super(action, dropdownAction, [], '', contextMenuService, {
                getKeyBinding: (action) => keybindingService.lookupKeybinding(action.id, contextKeyService)
            }, keybindingService, notificationService, contextKeyService, themeService, accessibilityService);
            const menu = menuService.createMenu(actions_1.MenuId.ChatExecuteSecondary, contextKeyService);
            const setActions = () => {
                const secondary = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, secondary);
                const secondaryAgent = chatAgentService.getSecondaryAgent();
                if (secondaryAgent) {
                    secondary.forEach(a => {
                        if (a.id === chatActions_1.ChatSubmitSecondaryAgentEditorAction.ID) {
                            a.label = (0, nls_1.localize)('chat.submitToSecondaryAgent', "Send to @{0}", secondaryAgent.name);
                        }
                        return a;
                    });
                }
                this.update(dropdownAction, secondary);
            };
            setActions();
            this._register(menu.onDidChange(() => setActions()));
        }
    };
    ChatSubmitDropdownActionItem = __decorate([
        __param(2, actions_1.IMenuService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, chatAgents_1.IChatAgentService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, notification_1.INotificationService),
        __param(8, themeService_1.IThemeService),
        __param(9, accessibility_1.IAccessibilityService)
    ], ChatSubmitDropdownActionItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdElucHV0UGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRJbnB1dFBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9EaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixNQUFNLHVCQUF1QixHQUFHLEdBQUcsQ0FBQztJQWE3QixJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7O2lCQUM1QixpQkFBWSxHQUFHLGtCQUFrQixBQUFyQixDQUFzQjtpQkFDbkMsYUFBUSxHQUFHLENBQUMsQUFBSixDQUFLO1FBNkI1QixJQUFJLHNCQUFzQjtZQUN6QixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUM7UUFDN0MsQ0FBQztRQUdELElBQUksZUFBZTtZQUNsQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBT0QsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFrQkQ7UUFDQyxpRkFBaUY7UUFDaEUsUUFBMkIsRUFDM0IsT0FBOEIsRUFDcEIsY0FBMEQsRUFDdEUsWUFBNEMsRUFDcEMsb0JBQTRELEVBQy9ELGlCQUFzRCxFQUNuRCxvQkFBNEQsRUFDL0QsaUJBQXNELEVBQ25ELG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQVZTLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLFlBQU8sR0FBUCxPQUFPLENBQXVCO1lBQ0gsbUJBQWMsR0FBZCxjQUFjLENBQTJCO1lBQ3JELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ25CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMs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