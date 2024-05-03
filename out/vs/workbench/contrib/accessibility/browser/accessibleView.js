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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/base/common/platform", "vs/base/common/themables", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/services/model", "vs/editor/common/standaloneStrings", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/layout/browser/layoutService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions"], function (require, exports, dom_1, keyboardEvent_1, aria_1, codicons_1, lifecycle_1, marked_1, platform_1, themables_1, uri_1, editorExtensions_1, codeEditorWidget_1, position_1, model_1, standaloneStrings_1, codeActionController_1, nls_1, accessibility_1, menuEntryActionViewItem_1, toolbar_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, layoutService_1, opener_1, quickInput_1, accessibilityConfiguration_1, chat_1, simpleEditorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleViewService = exports.AccessibleView = exports.NavigationType = exports.AccessibleViewType = exports.IAccessibleViewService = void 0;
    var DIMENSIONS;
    (function (DIMENSIONS) {
        DIMENSIONS[DIMENSIONS["MAX_WIDTH"] = 600] = "MAX_WIDTH";
    })(DIMENSIONS || (DIMENSIONS = {}));
    exports.IAccessibleViewService = (0, instantiation_1.createDecorator)('accessibleViewService');
    var AccessibleViewType;
    (function (AccessibleViewType) {
        AccessibleViewType["Help"] = "help";
        AccessibleViewType["View"] = "view";
    })(AccessibleViewType || (exports.AccessibleViewType = AccessibleViewType = {}));
    var NavigationType;
    (function (NavigationType) {
        NavigationType["Previous"] = "previous";
        NavigationType["Next"] = "next";
    })(NavigationType || (exports.NavigationType = NavigationType = {}));
    let AccessibleView = class AccessibleView extends lifecycle_1.Disposable {
        get editorWidget() { return this._editorWidget; }
        constructor(_openerService, _instantiationService, _configurationService, _modelService, _contextViewService, _contextKeyService, _accessibilityService, _keybindingService, _layoutService, _menuService, _commandService, _codeBlockContextProviderService) {
            super();
            this._openerService = _openerService;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._modelService = _modelService;
            this._contextViewService = _contextViewService;
            this._contextKeyService = _contextKeyService;
            this._accessibilityService = _accessibilityService;
            this._keybindingService = _keybindingService;
            this._layoutService = _layoutService;
            this._menuService = _menuService;
            this._commandService = _commandService;
            this._codeBlockContextProviderService = _codeBlockContextProviderService;
            this._accessiblityHelpIsShown = accessibilityConfiguration_1.accessibilityHelpIsShown.bindTo(this._contextKeyService);
            this._accessibleViewIsShown = accessibilityConfiguration_1.accessibleViewIsShown.bindTo(this._contextKeyService);
            this._accessibleViewSupportsNavigation = accessibilityConfiguration_1.accessibleViewSupportsNavigation.bindTo(this._contextKeyService);
            this._accessibleViewVerbosityEnabled = accessibilityConfiguration_1.accessibleViewVerbosityEnabled.bindTo(this._contextKeyService);
            this._accessibleViewGoToSymbolSupported = accessibilityConfiguration_1.accessibleViewGoToSymbolSupported.bindTo(this._contextKeyService);
            this._accessibleViewCurrentProviderId = accessibilityConfiguration_1.accessibleViewCurrentProviderId.bindTo(this._contextKeyService);
            this._accessibleViewInCodeBlock = accessibilityConfiguration_1.accessibleViewInCodeBlock.bindTo(this._contextKeyService);
            this._accessibleViewContainsCodeBlocks = accessibilityConfiguration_1.accessibleViewContainsCodeBlocks.bindTo(this._contextKeyService);
            this._onLastLine = accessibilityConfiguration_1.accessibleViewOnLastLine.bindTo(this._contextKeyService);
            this._container = document.createElement('div');
            this._container.classList.add('accessible-view');
            if (this._configurationService.getValue("accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */)) {
                this._container.classList.add('hide');
            }
            const codeEditorWidgetOptions = {
                contributions: editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => c.id !== codeActionController_1.CodeActionController.ID)
            };
            const titleBar = document.createElement('div');
            titleBar.classList.add('accessible-view-title-bar');
            this._title = document.createElement('div');
            this._title.classList.add('accessible-view-title');
            titleBar.appendChild(this._title);
            const actionBar = document.createElement('div');
            actionBar.classList.add('accessible-view-action-bar');
            titleBar.appendChild(actionBar);
            this._container.appendChild(titleBar);
            this._toolbar = this._register(_instantiationService.createInstance(toolbar_1.WorkbenchToolBar, actionBar, { orientation: 0 /* ActionsOrientation.HORIZONTAL */ }));
            this._toolbar.context = { viewId: 'accessibleView' };
            const toolbarElt = this._toolbar.getElement();
            toolbarElt.tabIndex = 0;
            const editorOptions = {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this._configurationService),
                lineDecorationsWidth: 6,
                dragAndDrop: false,
                cursorWidth: 1,
                wrappingStrategy: 'advanced',
                wrappingIndent: 'none',
                padding: { top: 2, bottom: 2 },
                quickSuggestions: false,
                renderWhitespace: 'none',
                dropIntoEditor: { enabled: false },
                readOnly: true,
                fontFamily: 'var(--monaco-monospace-font)'
            };
            this._editorWidget = this._register(this._instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._container, editorOptions, codeEditorWidgetOptions));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                if (this._currentProvider && this._accessiblityHelpIsShown.get()) {
                    this.show(this._currentProvider);
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (this._currentProvider && e.affectsConfiguration(this._currentProvider.verbositySettingKey)) {
                    if (this._accessiblityHelpIsShown.get()) {
                        this.show(this._currentProvider);
                    }
                    this._accessibleViewVerbosityEnabled.set(this._configurationService.getValue(this._currentProvider.verbositySettingKey));
                    this._updateToolbar(this._currentProvider.actions, this._currentProvider.options.type);
                }
                if (e.affectsConfiguration("accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */)) {
                    this._container.classList.toggle('hide', this._configurationService.getValue("accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */));
                }
            }));
            this._register(this._editorWidget.onDidDispose(() => this._resetContextKeys()));
            this._register(this._editorWidget.onDidChangeCursorPosition(() => {
                this._onLastLine.set(this._editorWidget.getPosition()?.lineNumber === this._editorWidget.getModel()?.getLineCount());
            }));
            this._register(this._editorWidget.onDidChangeCursorPosition(() => {
                const cursorPosition = this._editorWidget.getPosition()?.lineNumber;
                if (this._codeBlocks && cursorPosition !== undefined) {
                    const inCodeBlock = this._codeBlocks.find(c => c.startLine <= cursorPosition && c.endLine >= cursorPosition) !== undefined;
                    this._accessibleViewInCodeBlock.set(inCodeBlock);
                }
            }));
        }
        _resetContextKeys() {
            this._accessiblityHelpIsShown.reset();
            this._accessibleViewIsShown.reset();
            this._accessibleViewSupportsNavigation.reset();
            this._accessibleViewVerbosityEnabled.reset();
            this._accessibleViewGoToSymbolSupported.reset();
            this._accessibleViewCurrentProviderId.reset();
        }
        getPosition(id) {
            if (!id || !this._lastProvider || this._lastProvider.id !== id) {
                return undefined;
            }
            return this._editorWidget.getPosition() || undefined;
        }
        setPosition(position, reveal) {
            this._editorWidget.setPosition(position);
            if (reveal) {
                this._editorWidget.revealPosition(position);
            }
        }
        getCodeBlockContext() {
            const position = this._editorWidget.getPosition();
            if (!this._codeBlocks?.length || !position) {
                return;
            }
            const codeBlockIndex = this._codeBlocks?.findIndex(c => c.startLine <= position?.lineNumber && c.endLine >= position?.lineNumber);
            const codeBlock = codeBlockIndex !== undefined && codeBlockIndex > -1 ? this._codeBlocks[codeBlockIndex] : undefined;
            if (!codeBlock || codeBlockIndex === undefined) {
                return;
            }
            return { code: codeBlock.code, languageId: codeBlock.languageId, codeBlockIndex, element: undefined };
        }
        showLastProvider(id) {
            if (!this._lastProvider || this._lastProvider.options.id !== id) {
                return;
            }
            this.show(this._lastProvider);
        }
        show(provider, symbol, showAccessibleViewHelp, position) {
            provider = provider ?? this._currentProvider;
            if (!provider) {
                return;
            }
            const delegate = {
                getAnchor: () => { return { x: ((0, dom_1.getActiveWindow)().innerWidth / 2) - ((Math.min(this._layoutService.activeContainerDimension.width * 0.62 /* golden cut */, 600 /* DIMENSIONS.MAX_WIDTH */)) / 2), y: this._layoutService.activeContainerOffset.quickPickTop }; },
                render: (container) => {
                    container.classList.add('accessible-view-container');
                    return this._render(provider, container, showAccessibleViewHelp);
                },
                onHide: () => {
                    if (!showAccessibleViewHelp) {
                        this._updateLastProvider();
                        this._currentProvider = undefined;
                        this._resetContextKeys();
                    }
                }
            };
            this._contextViewService.showContextView(delegate);
            if (position) {
                // Context view takes time to show up, so we need to wait for it to show up before we can set the position
                setTimeout(() => {
                    this._editorWidget.revealLine(position.lineNumber);
                    this._editorWidget.setSelection({ startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column });
                }, 10);
            }
            if (symbol && this._currentProvider) {
                this.showSymbol(this._currentProvider, symbol);
            }
            if (provider.onDidRequestClearLastProvider) {
                this._register(provider.onDidRequestClearLastProvider((id) => {
                    if (this._lastProvider?.options.id === id) {
                        this._lastProvider = undefined;
                    }
                }));
            }
            if (provider.options.id) {
                // only cache a provider with an ID so that it will eventually be cleared.
                this._lastProvider = provider;
            }
            if (provider.id === "panelChat" /* AccessibleViewProviderId.Chat */) {
                this._register(this._codeBlockContextProviderService.registerProvider({ getCodeBlockContext: () => this.getCodeBlockContext() }, 'accessibleView'));
            }
        }
        previous() {
            if (!this._currentProvider) {
                return;
            }
            this._currentProvider.previous?.();
        }
        next() {
            if (!this._currentProvider) {
                return;
            }
            this._currentProvider.next?.();
        }
        goToSymbol() {
            if (!this._currentProvider) {
                return;
            }
            this._instantiationService.createInstance(AccessibleViewSymbolQuickPick, this).show(this._currentProvider);
        }
        calculateCodeBlocks(markdown) {
            if (this._currentProvider?.id !== "panelChat" /* AccessibleViewProviderId.Chat */) {
                return;
            }
            if (this._currentProvider.options.language && this._currentProvider.options.language !== 'markdown') {
                // Symbols haven't been provided and we cannot parse this language
                return;
            }
            const lines = markdown.split('\n');
            this._codeBlocks = [];
            let inBlock = false;
            let startLine = 0;
            let languageId;
            lines.forEach((line, i) => {
                if (!inBlock && line.startsWith('```')) {
                    inBlock = true;
                    startLine = i + 1;
                    languageId = line.substring(3).trim();
                }
                else if (inBlock && line.startsWith('```')) {
                    inBlock = false;
                    const endLine = i;
                    const code = lines.slice(startLine, endLine).join('\n');
                    this._codeBlocks?.push({ startLine, endLine, code, languageId });
                }
            });
            this._accessibleViewContainsCodeBlocks.set(this._codeBlocks.length > 0);
        }
        getSymbols() {
            if (!this._currentProvider || !this._currentContent) {
                return;
            }
            const symbols = this._currentProvider.getSymbols?.() || [];
            if (symbols?.length) {
                return symbols;
            }
            if (this._currentProvider.options.language && this._currentProvider.options.language !== 'markdown') {
                // Symbols haven't been provided and we cannot parse this language
                return;
            }
            const markdownTokens = marked_1.marked.lexer(this._currentContent);
            if (!markdownTokens) {
                return;
            }
            this._convertTokensToSymbols(markdownTokens, symbols);
            return symbols.length ? symbols : undefined;
        }
        _convertTokensToSymbols(tokens, symbols) {
            let firstListItem;
            for (const token of tokens) {
                let label = undefined;
                if ('type' in token) {
                    switch (token.type) {
                        case 'heading':
                        case 'paragraph':
                        case 'code':
                            label = token.text;
                            break;
                        case 'list': {
                            const firstItem = token.items?.[0];
                            if (!firstItem) {
                                break;
                            }
                            firstListItem = `- ${firstItem.text}`;
                            label = token.items?.map(i => i.text).join(', ');
                            break;
                        }
                    }
                }
                if (label) {
                    symbols.push({ markdownToParse: label, label: (0, nls_1.localize)('symbolLabel', "({0}) {1}", token.type, label), ariaLabel: (0, nls_1.localize)('symbolLabelAria', "({0}) {1}", token.type, label), firstListItem });
                    firstListItem = undefined;
                }
            }
        }
        showSymbol(provider, symbol) {
            if (!this._currentContent) {
                return;
            }
            let lineNumber = symbol.lineNumber;
            const markdownToParse = symbol.markdownToParse;
            if (lineNumber === undefined && markdownToParse === undefined) {
                // No symbols provided and we cannot parse this language
                return;
            }
            if (lineNumber === undefined && markdownToParse) {
                // Note that this scales poorly, thus isn't used for worst case scenarios like the terminal, for which a line number will always be provided.
                // Parse the markdown to find the line number
                const index = this._currentContent.split('\n').findIndex(line => line.includes(markdownToParse.split('\n')[0]) || (symbol.firstListItem && line.includes(symbol.firstListItem))) ?? -1;
                if (index >= 0) {
                    lineNumber = index + 1;
                }
            }
            if (lineNumber === undefined) {
                return;
            }
            this.show(provider, undefined, undefined, { lineNumber, column: 1 });
            this._updateContextKeys(provider, true);
        }
        disableHint() {
            if (!this._currentProvider) {
                return;
            }
            this._configurationService.updateValue(this._currentProvider?.verbositySettingKey, false);
            (0, aria_1.alert)((0, nls_1.localize)('disableAccessibilityHelp', '{0} accessibility verbosity is now disabled', this._currentProvider.verbositySettingKey));
        }
        _updateContextKeys(provider, shown) {
            if (provider.options.type === "help" /* AccessibleViewType.Help */) {
                this._accessiblityHelpIsShown.set(shown);
                this._accessibleViewIsShown.reset();
            }
            else {
                this._accessibleViewIsShown.set(shown);
                this._accessiblityHelpIsShown.reset();
            }
            if (provider.next && provider.previous) {
                this._accessibleViewSupportsNavigation.set(true);
            }
            else {
                this._accessibleViewSupportsNavigation.reset();
            }
            const verbosityEnabled = this._configurationService.getValue(provider.verbositySettingKey);
            this._accessibleViewVerbosityEnabled.set(verbosityEnabled);
            this._accessibleViewGoToSymbolSupported.set(this._goToSymbolsSupported() ? this.getSymbols()?.length > 0 : false);
        }
        _render(provider, container, showAccessibleViewHelp) {
            this._currentProvider = provider;
            this._accessibleViewCurrentProviderId.set(provider.id);
            const value = this._configurationService.getValue(provider.verbositySettingKey);
            const readMoreLink = provider.options.readMoreUrl ? (0, nls_1.localize)("openDoc", "\n\nOpen a browser window with more information related to accessibility (H).") : '';
            let disableHelpHint = '';
            if (provider.options.type === "help" /* AccessibleViewType.Help */ && !!value) {
                disableHelpHint = this._getDisableVerbosityHint(provider.verbositySettingKey);
            }
            const accessibilitySupport = this._accessibilityService.isScreenReaderOptimized();
            let message = '';
            if (provider.options.type === "help" /* AccessibleViewType.Help */) {
                const turnOnMessage = (platform_1.isMacintosh
                    ? standaloneStrings_1.AccessibilityHelpNLS.changeConfigToOnMac
                    : standaloneStrings_1.AccessibilityHelpNLS.changeConfigToOnWinLinux);
                if (accessibilitySupport && provider.verbositySettingKey === "accessibility.verbosity.editor" /* AccessibilityVerbositySettingId.Editor */) {
                    message = standaloneStrings_1.AccessibilityHelpNLS.auto_on;
                    message += '\n';
                }
                else if (!accessibilitySupport) {
                    message = standaloneStrings_1.AccessibilityHelpNLS.auto_off + '\n' + turnOnMessage;
                    message += '\n';
                }
            }
            const verbose = this._configurationService.getValue(provider.verbositySettingKey);
            const exitThisDialogHint = verbose && !provider.options.position ? (0, nls_1.localize)('exit', '\n\nExit this dialog (Escape).') : '';
            const newContent = message + provider.provideContent() + readMoreLink + disableHelpHint + exitThisDialogHint;
            this.calculateCodeBlocks(newContent);
            this._currentContent = newContent;
            this._updateContextKeys(provider, true);
            const widgetIsFocused = this._editorWidget.hasTextFocus() || this._editorWidget.hasWidgetFocus();
            this._getTextModel(uri_1.URI.from({ path: `accessible-view-${provider.verbositySettingKey}`, scheme: 'accessible-view', fragment: this._currentContent })).then((model) => {
                if (!model) {
                    return;
                }
                this._editorWidget.setModel(model);
                const domNode = this._editorWidget.getDomNode();
                if (!domNode) {
                    return;
                }
                model.setLanguage(provider.options.language ?? 'markdown');
                container.appendChild(this._container);
                let actionsHint = '';
                const verbose = this._configurationService.getValue(provider.verbositySettingKey);
                const hasActions = this._accessibleViewSupportsNavigation.get() || this._accessibleViewVerbosityEnabled.get() || this._accessibleViewGoToSymbolSupported.get() || this._currentProvider?.actions;
                if (verbose && !showAccessibleViewHelp && hasActions) {
                    actionsHint = provider.options.position ? (0, nls_1.localize)('ariaAccessibleViewActionsBottom', 'Explore actions such as disabling this hint (Shift+Tab), use Escape to exit this dialog.') : (0, nls_1.localize)('ariaAccessibleViewActions', 'Explore actions such as disabling this hint (Shift+Tab).');
                }
                let ariaLabel = provider.options.type === "help" /* AccessibleViewType.Help */ ? (0, nls_1.localize)('accessibility-help', "Accessibility Help") : (0, nls_1.localize)('accessible-view', "Accessible View");
                this._title.textContent = ariaLabel;
                if (actionsHint && provider.options.type === "view" /* AccessibleViewType.View */) {
                    ariaLabel = (0, nls_1.localize)('accessible-view-hint', "Accessible View, {0}", actionsHint);
                }
                else if (actionsHint) {
                    ariaLabel = (0, nls_1.localize)('accessibility-help-hint', "Accessibility Help, {0}", actionsHint);
                }
                if (platform_1.isWindows && widgetIsFocused) {
                    // prevent the screen reader on windows from reading
                    // the aria label again when it's refocused
                    ariaLabel = '';
                }
                this._editorWidget.updateOptions({ ariaLabel });
                this._editorWidget.focus();
                if (this._currentProvider?.options.position) {
                    const position = this._editorWidget.getPosition();
                    const isDefaultPosition = position?.lineNumber === 1 && position.column === 1;
                    if (this._currentProvider.options.position === 'bottom' || this._currentProvider.options.position === 'initial-bottom' && isDefaultPosition) {
                        const lastLine = this.editorWidget.getModel()?.getLineCount();
                        const position = lastLine !== undefined && lastLine > 0 ? new position_1.Position(lastLine, 1) : undefined;
                        if (position) {
                            this._editorWidget.setPosition(position);
                            this._editorWidget.revealLine(position.lineNumber);
                        }
                    }
                }
            });
            this._updateToolbar(provider.actions, provider.options.type);
            const hide = (e) => {
                provider.onClose();
                e.stopPropagation();
                this._contextViewService.hideContextView();
                this._updateContextKeys(provider, false);
                this._lastProvider = undefined;
                this._currentContent = undefined;
            };
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(this._editorWidget.onKeyDown((e) => {
                if (e.keyCode === 3 /* KeyCode.Enter */) {
                    this._commandService.executeCommand('editor.action.openLink');
                }
                else if (e.keyCode === 9 /* KeyCode.Escape */ || shouldHide(e.browserEvent, this._keybindingService, this._configurationService)) {
                    hide(e);
                }
                else if (e.keyCode === 38 /* KeyCode.KeyH */ && provider.options.readMoreUrl) {
                    const url = provider.options.readMoreUrl;
                    (0, aria_1.alert)(standaloneStrings_1.AccessibilityHelpNLS.openingDocs);
                    this._openerService.open(uri_1.URI.parse(url));
                    e.preventDefault();
                    e.stopPropagation();
                }
                provider.onKeyDown?.(e);
            }));
            disposableStore.add((0, dom_1.addDisposableListener)(this._toolbar.getElement(), dom_1.EventType.KEY_DOWN, (e) => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (keyboardEvent.equals(9 /* KeyCode.Escape */)) {
                    hide(e);
                }
            }));
            disposableStore.add(this._editorWidget.onDidBlurEditorWidget(() => {
                if (!(0, dom_1.isActiveElement)(this._toolbar.getElement())) {
                    this._contextViewService.hideContextView();
                }
            }));
            disposableStore.add(this._editorWidget.onDidContentSizeChange(() => this._layout()));
            disposableStore.add(this._layoutService.onDidLayoutActiveContainer(() => this._layout()));
            return disposableStore;
        }
        _updateToolbar(providedActions, type) {
            this._toolbar.setAriaLabel(type === "help" /* AccessibleViewType.Help */ ? (0, nls_1.localize)('accessibleHelpToolbar', 'Accessibility Help') : (0, nls_1.localize)('accessibleViewToolbar', "Accessible View"));
            const menuActions = [];
            const toolbarMenu = this._register(this._menuService.createMenu(actions_1.MenuId.AccessibleView, this._contextKeyService));
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(toolbarMenu, {}, menuActions);
            if (providedActions) {
                for (const providedAction of providedActions) {
                    providedAction.class = providedAction.class || themables_1.ThemeIcon.asClassName(codicons_1.Codicon.primitiveSquare);
                    providedAction.checked = undefined;
                }
                this._toolbar.setActions([...providedActions, ...menuActions]);
            }
            else {
                this._toolbar.setActions(menuActions);
            }
        }
        _layout() {
            const dimension = this._layoutService.activeContainerDimension;
            const maxHeight = dimension.height && dimension.height * .4;
            const height = Math.min(maxHeight, this._editorWidget.getContentHeight());
            const width = Math.min(dimension.width * 0.62 /* golden cut */, 600 /* DIMENSIONS.MAX_WIDTH */);
            this._editorWidget.layout({ width, height });
        }
        async _getTextModel(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, null, resource, false);
        }
        _goToSymbolsSupported() {
            if (!this._currentProvider) {
                return false;
            }
            return this._currentProvider.options.type === "help" /* AccessibleViewType.Help */ || this._currentProvider.options.language === 'markdown' || this._currentProvider.options.language === undefined || !!this._currentProvider.getSymbols?.();
        }
        _updateLastProvider() {
            if (!this._currentProvider) {
                return;
            }
            const lastProvider = Object.assign({}, this._currentProvider);
            lastProvider.provideContent = this._currentProvider.provideContent.bind(lastProvider);
            lastProvider.options = Object.assign({}, this._currentProvider.options);
            lastProvider.verbositySettingKey = this._currentProvider.verbositySettingKey;
            return lastProvider;
        }
        showAccessibleViewHelp() {
            const lastProvider = this._updateLastProvider();
            if (!lastProvider) {
                return;
            }
            const accessibleViewHelpProvider = {
                id: lastProvider.id,
                provideContent: () => lastProvider.options.customHelp ? lastProvider?.options.customHelp() : this._getAccessibleViewHelpDialogContent(this._goToSymbolsSupported()),
                onClose: () => this.show(lastProvider),
                options: { type: "help" /* AccessibleViewType.Help */ },
                verbositySettingKey: lastProvider.verbositySettingKey
            };
            this._contextViewService.hideContextView();
            // HACK: Delay to allow the context view to hide #186514
            setTimeout(() => this.show(accessibleViewHelpProvider, undefined, true), 100);
        }
        _getAccessibleViewHelpDialogContent(providerHasSymbols) {
            const navigationHint = this._getNavigationHint();
            const goToSymbolHint = this._getGoToSymbolHint(providerHasSymbols);
            const toolbarHint = (0, nls_1.localize)('toolbar', "Navigate to the toolbar (Shift+Tab).");
            const chatHints = this._getChatHints();
            let hint = (0, nls_1.localize)('intro', "In the accessible view, you can:\n");
            if (navigationHint) {
                hint += ' - ' + navigationHint + '\n';
            }
            if (goToSymbolHint) {
                hint += ' - ' + goToSymbolHint + '\n';
            }
            if (toolbarHint) {
                hint += ' - ' + toolbarHint + '\n';
            }
            if (chatHints) {
                hint += chatHints;
            }
            return hint;
        }
        _getChatHints() {
            if (this._currentProvider?.id !== "panelChat" /* AccessibleViewProviderId.Chat */) {
                return;
            }
            let hint = '';
            const insertAtCursorKb = this._keybindingService.lookupKeybinding('workbench.action.chat.insertCodeBlock')?.getAriaLabel();
            const insertIntoNewFileKb = this._keybindingService.lookupKeybinding('workbench.action.chat.insertIntoNewFile')?.getAriaLabel();
            const runInTerminalKb = this._keybindingService.lookupKeybinding('workbench.action.chat.runInTerminal')?.getAriaLabel();
            if (insertAtCursorKb) {
                hint += (0, nls_1.localize)('insertAtCursor', " - Insert the code block at the cursor ({0}).\n", insertAtCursorKb);
            }
            else {
                hint += (0, nls_1.localize)('insertAtCursorNoKb', " - Insert the code block at the cursor by configuring a keybinding for the Chat: Insert Code Block command.\n");
            }
            if (insertIntoNewFileKb) {
                hint += (0, nls_1.localize)('insertIntoNewFile', " - Insert the code block into a new file ({0}).\n", insertIntoNewFileKb);
            }
            else {
                hint += (0, nls_1.localize)('insertIntoNewFileNoKb', " - Insert the code block into a new file by configuring a keybinding for the Chat: Insert into New File command.\n");
            }
            if (runInTerminalKb) {
                hint += (0, nls_1.localize)('runInTerminal', " - Run the code block in the terminal ({0}).\n", runInTerminalKb);
            }
            else {
                hint += (0, nls_1.localize)('runInTerminalNoKb', " - Run the coe block in the terminal by configuring a keybinding for the Chat: Insert into Terminal command.\n");
            }
            return hint;
        }
        _getNavigationHint() {
            let hint = '';
            const nextKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleViewNext" /* AccessibilityCommandId.ShowNext */)?.getAriaLabel();
            const previousKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleViewPrevious" /* AccessibilityCommandId.ShowPrevious */)?.getAriaLabel();
            if (nextKeybinding && previousKeybinding) {
                hint = (0, nls_1.localize)('accessibleViewNextPreviousHint', "Show the next ({0}) or previous ({1}) item.", nextKeybinding, previousKeybinding);
            }
            else {
                hint = (0, nls_1.localize)('chatAccessibleViewNextPreviousHintNoKb', "Show the next or previous item by configuring keybindings for the Show Next & Previous in Accessible View commands.");
            }
            return hint;
        }
        _getDisableVerbosityHint(verbositySettingKey) {
            if (!this._configurationService.getValue(verbositySettingKey)) {
                return '';
            }
            let hint = '';
            const disableKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleViewDisableHint" /* AccessibilityCommandId.DisableVerbosityHint */, this._contextKeyService)?.getAriaLabel();
            if (disableKeybinding) {
                hint = (0, nls_1.localize)('acessibleViewDisableHint', "\n\nDisable accessibility verbosity for this feature ({0}).", disableKeybinding);
            }
            else {
                hint = (0, nls_1.localize)('accessibleViewDisableHintNoKb', "\n\nAdd a keybinding for the command Disable Accessible View Hint, which disables accessibility verbosity for this feature.s");
            }
            return hint;
        }
        _getGoToSymbolHint(providerHasSymbols) {
            const goToSymbolKb = this._keybindingService.lookupKeybinding("editor.action.accessibleViewGoToSymbol" /* AccessibilityCommandId.GoToSymbol */)?.getAriaLabel();
            let goToSymbolHint = '';
            if (providerHasSymbols) {
                if (goToSymbolKb) {
                    goToSymbolHint = (0, nls_1.localize)('goToSymbolHint', 'Go to a symbol ({0}).', goToSymbolKb);
                }
                else {
                    goToSymbolHint = (0, nls_1.localize)('goToSymbolHintNoKb', 'To go to a symbol, configure a keybinding for the command Go To Symbol in Accessible View');
                }
            }
            return goToSymbolHint;
        }
    };
    exports.AccessibleView = AccessibleView;
    exports.AccessibleView = AccessibleView = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, model_1.IModelService),
        __param(4, contextView_1.IContextViewService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, layoutService_1.ILayoutService),
        __param(9, actions_1.IMenuService),
        __param(10, commands_1.ICommandService),
        __param(11, chat_1.IChatCodeBlockContextProviderService)
    ], AccessibleView);
    let AccessibleViewService = class AccessibleViewService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _configurationService, _keybindingService) {
            super();
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._keybindingService = _keybindingService;
        }
        show(provider, position) {
            if (!this._accessibleView) {
                this._accessibleView = this._register(this._instantiationService.createInstance(AccessibleView));
            }
            this._accessibleView.show(provider, undefined, undefined, position);
        }
        showLastProvider(id) {
            this._accessibleView?.showLastProvider(id);
        }
        next() {
            this._accessibleView?.next();
        }
        previous() {
            this._accessibleView?.previous();
        }
        goToSymbol() {
            this._accessibleView?.goToSymbol();
        }
        getOpenAriaHint(verbositySettingKey) {
            if (!this._configurationService.getValue(verbositySettingKey)) {
                return null;
            }
            const keybinding = this._keybindingService.lookupKeybinding("editor.action.accessibleView" /* AccessibilityCommandId.OpenAccessibleView */)?.getAriaLabel();
            let hint = null;
            if (keybinding) {
                hint = (0, nls_1.localize)('acessibleViewHint', "Inspect this in the accessible view with {0}", keybinding);
            }
            else {
                hint = (0, nls_1.localize)('acessibleViewHintNoKbEither', "Inspect this in the accessible view via the command Open Accessible View which is currently not triggerable via keybinding.");
            }
            return hint;
        }
        disableHint() {
            this._accessibleView?.disableHint();
        }
        showAccessibleViewHelp() {
            this._accessibleView?.showAccessibleViewHelp();
        }
        getPosition(id) {
            return this._accessibleView?.getPosition(id) ?? undefined;
        }
        getLastPosition() {
            const lastLine = this._accessibleView?.editorWidget.getModel()?.getLineCount();
            return lastLine !== undefined && lastLine > 0 ? new position_1.Position(lastLine, 1) : undefined;
        }
        setPosition(position, reveal) {
            const editorWidget = this._accessibleView?.editorWidget;
            editorWidget?.setPosition(position);
            if (reveal) {
                editorWidget?.revealLine(position.lineNumber);
            }
        }
        getCodeBlockContext() {
            return this._accessibleView?.getCodeBlockContext();
        }
    };
    exports.AccessibleViewService = AccessibleViewService;
    exports.AccessibleViewService = AccessibleViewService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, keybinding_1.IKeybindingService)
    ], AccessibleViewService);
    let AccessibleViewSymbolQuickPick = class AccessibleViewSymbolQuickPick {
        constructor(_accessibleView, _quickInputService) {
            this._accessibleView = _accessibleView;
            this._quickInputService = _quickInputService;
        }
        show(provider) {
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.placeholder = (0, nls_1.localize)('accessibleViewSymbolQuickPickPlaceholder', "Type to search symbols");
            quickPick.title = (0, nls_1.localize)('accessibleViewSymbolQuickPickTitle', "Go to Symbol Accessible View");
            const picks = [];
            const symbols = this._accessibleView.getSymbols();
            if (!symbols) {
                return;
            }
            for (const symbol of symbols) {
                picks.push({
                    label: symbol.label,
                    ariaLabel: symbol.ariaLabel
                });
            }
            quickPick.canSelectMany = false;
            quickPick.items = symbols;
            quickPick.show();
            quickPick.onDidAccept(() => {
                this._accessibleView.showSymbol(provider, quickPick.selectedItems[0]);
                quickPick.hide();
            });
            quickPick.onDidHide(() => {
                if (quickPick.selectedItems.length === 0) {
                    // this was escaped, so refocus the accessible view
                    this._accessibleView.show(provider);
                }
            });
        }
    };
    AccessibleViewSymbolQuickPick = __decorate([
        __param(1, quickInput_1.IQuickInputService)
    ], AccessibleViewSymbolQuickPick);
    function shouldHide(event, keybindingService, configurationService) {
        if (!configurationService.getValue("accessibility.accessibleView.closeOnKeyPress" /* AccessibilityWorkbenchSettingId.AccessibleViewCloseOnKeyPress */)) {
            return false;
        }
        const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(event);
        const resolveResult = keybindingService.softDispatch(standardKeyboardEvent, standardKeyboardEvent.target);
        const isValidChord = resolveResult.kind === 1 /* ResultKind.MoreChordsNeeded */;
        if (keybindingService.inChordMode || isValidChord) {
            return false;
        }
        return shouldHandleKey(event) && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    }
    function shouldHandleKey(event) {
        return !!event.code.match(/^(Key[A-Z]|Digit[0-9]|Equal|Comma|Period|Slash|Quote|Backquote|Backslash|Minus|Semicolon|Space|Enter)$/);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZVZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9hY2Nlc3NpYmxlVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2Q2hHLElBQVcsVUFFVjtJQUZELFdBQVcsVUFBVTtRQUNwQix1REFBZSxDQUFBO0lBQ2hCLENBQUMsRUFGVSxVQUFVLEtBQVYsVUFBVSxRQUVwQjtJQTBCWSxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsdUJBQXVCLENBQUMsQ0FBQztJQXNCdkcsSUFBa0Isa0JBR2pCO0lBSEQsV0FBa0Isa0JBQWtCO1FBQ25DLG1DQUFhLENBQUE7UUFDYixtQ0FBYSxDQUFBO0lBQ2QsQ0FBQyxFQUhpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQUduQztJQUVELElBQWtCLGNBR2pCO0lBSEQsV0FBa0IsY0FBYztRQUMvQix1Q0FBcUIsQ0FBQTtRQUNyQiwrQkFBYSxDQUFBO0lBQ2QsQ0FBQyxFQUhpQixjQUFjLDhCQUFkLGNBQWMsUUFHL0I7SUFpQ00sSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBYzdDLElBQUksWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFVakQsWUFDa0MsY0FBOEIsRUFDdkIscUJBQTRDLEVBQzVDLHFCQUE0QyxFQUNwRCxhQUE0QixFQUN0QixtQkFBd0MsRUFDekMsa0JBQXNDLEVBQ25DLHFCQUE0QyxFQUMvQyxrQkFBc0MsRUFDMUMsY0FBOEIsRUFDaEMsWUFBMEIsRUFDdkIsZUFBZ0MsRUFDWCxnQ0FBc0U7WUFFN0gsS0FBSyxFQUFFLENBQUM7WUFieUIsbUJBQWMsR0FBZCxjQUFjLENB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