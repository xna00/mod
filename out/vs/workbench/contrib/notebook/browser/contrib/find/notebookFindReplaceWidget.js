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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/findinput/findInput", "vs/base/browser/ui/progressbar/progressbar", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/editor/contrib/find/browser/findState", "vs/editor/contrib/find/browser/findWidget", "vs/nls", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/editor/contrib/find/browser/replacePattern", "vs/base/common/codicons", "vs/platform/configuration/common/configuration", "vs/base/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/workbench/contrib/notebook/browser/contrib/find/findFilters", "vs/base/common/platform", "vs/base/browser/ui/sash/sash", "vs/platform/theme/browser/defaultStyles", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/css!./notebookFindReplaceWidget"], function (require, exports, dom, findInput_1, progressbar_1, widget_1, async_1, findState_1, findWidget_1, nls, contextScopedHistoryWidget_1, contextkey_1, contextView_1, iconRegistry_1, themeService_1, themables_1, replacePattern_1, codicons_1, configuration_1, actions_1, instantiation_1, menuEntryActionViewItem_1, dropdownActionViewItem_1, actionbar_1, extensionsIcons_1, findFilters_1, platform_1, sash_1, defaultStyles_1, lifecycle_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleFindReplaceWidget = exports.NotebookFindInput = exports.NotebookFindInputFilterButton = exports.findFilterButton = void 0;
    const NLS_FIND_INPUT_LABEL = nls.localize('label.find', "Find");
    const NLS_FIND_INPUT_PLACEHOLDER = nls.localize('placeholder.find', "Find");
    const NLS_PREVIOUS_MATCH_BTN_LABEL = nls.localize('label.previousMatchButton', "Previous Match");
    // const NLS_FILTER_BTN_LABEL = nls.localize('label.findFilterButton', "Search in View");
    const NLS_NEXT_MATCH_BTN_LABEL = nls.localize('label.nextMatchButton', "Next Match");
    const NLS_CLOSE_BTN_LABEL = nls.localize('label.closeButton', "Close");
    const NLS_TOGGLE_REPLACE_MODE_BTN_LABEL = nls.localize('label.toggleReplaceButton', "Toggle Replace");
    const NLS_REPLACE_INPUT_LABEL = nls.localize('label.replace', "Replace");
    const NLS_REPLACE_INPUT_PLACEHOLDER = nls.localize('placeholder.replace', "Replace");
    const NLS_REPLACE_BTN_LABEL = nls.localize('label.replaceButton', "Replace");
    const NLS_REPLACE_ALL_BTN_LABEL = nls.localize('label.replaceAllButton', "Replace All");
    exports.findFilterButton = (0, iconRegistry_1.registerIcon)('find-filter', codicons_1.Codicon.filter, nls.localize('findFilterIcon', 'Icon for Find Filter in find widget.'));
    const NOTEBOOK_FIND_FILTERS = nls.localize('notebook.find.filter.filterAction', "Find Filters");
    const NOTEBOOK_FIND_IN_MARKUP_INPUT = nls.localize('notebook.find.filter.findInMarkupInput', "Markdown Source");
    const NOTEBOOK_FIND_IN_MARKUP_PREVIEW = nls.localize('notebook.find.filter.findInMarkupPreview', "Rendered Markdown");
    const NOTEBOOK_FIND_IN_CODE_INPUT = nls.localize('notebook.find.filter.findInCodeInput', "Code Cell Source");
    const NOTEBOOK_FIND_IN_CODE_OUTPUT = nls.localize('notebook.find.filter.findInCodeOutput', "Code Cell Output");
    const NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH = 318;
    const NOTEBOOK_FIND_WIDGET_INITIAL_HORIZONTAL_PADDING = 4;
    let NotebookFindFilterActionViewItem = class NotebookFindFilterActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(filters, action, options, actionRunner, contextMenuService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, {
                ...options,
                actionRunner,
                classNames: action.class,
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */
            });
            this.filters = filters;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
        }
        getActions() {
            const markdownInput = {
                checked: this.filters.markupInput,
                class: undefined,
                enabled: true,
                id: 'findInMarkdownInput',
                label: NOTEBOOK_FIND_IN_MARKUP_INPUT,
                run: async () => {
                    this.filters.markupInput = !this.filters.markupInput;
                },
                tooltip: ''
            };
            const markdownPreview = {
                checked: this.filters.markupPreview,
                class: undefined,
                enabled: true,
                id: 'findInMarkdownInput',
                label: NOTEBOOK_FIND_IN_MARKUP_PREVIEW,
                run: async () => {
                    this.filters.markupPreview = !this.filters.markupPreview;
                },
                tooltip: ''
            };
            const codeInput = {
                checked: this.filters.codeInput,
                class: undefined,
                enabled: true,
                id: 'findInCodeInput',
                label: NOTEBOOK_FIND_IN_CODE_INPUT,
                run: async () => {
                    this.filters.codeInput = !this.filters.codeInput;
                },
                tooltip: ''
            };
            const codeOutput = {
                checked: this.filters.codeOutput,
                class: undefined,
                enabled: true,
                id: 'findInCodeOutput',
                label: NOTEBOOK_FIND_IN_CODE_OUTPUT,
                run: async () => {
                    this.filters.codeOutput = !this.filters.codeOutput;
                },
                tooltip: '',
                dispose: () => null
            };
            if (platform_1.isSafari) {
                return [
                    markdownInput,
                    codeInput
                ];
            }
            else {
                return [
                    markdownInput,
                    markdownPreview,
                    new actions_1.Separator(),
                    codeInput,
                    codeOutput,
                ];
            }
        }
        updateChecked() {
            this.element.classList.toggle('checked', this._action.checked);
        }
    };
    NotebookFindFilterActionViewItem = __decorate([
        __param(4, contextView_1.IContextMenuService)
    ], NotebookFindFilterActionViewItem);
    class NotebookFindInputFilterButton extends lifecycle_1.Disposable {
        constructor(filters, contextMenuService, instantiationService, options, tooltip = NOTEBOOK_FIND_FILTERS) {
            super();
            this.filters = filters;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this._actionbar = null;
            this._toggleStyles = options.toggleStyles;
            this._filtersAction = new actions_1.Action('notebookFindFilterAction', tooltip, 'notebook-filters ' + themables_1.ThemeIcon.asClassName(extensionsIcons_1.filterIcon));
            this._filtersAction.checked = false;
            this._filterButtonContainer = dom.$('.find-filter-button');
            this._filterButtonContainer.classList.add('monaco-custom-toggle');
            this.createFilters(this._filterButtonContainer);
        }
        get container() {
            return this._filterButtonContainer;
        }
        get width() {
            return 2 /*margin left*/ + 2 /*border*/ + 2 /*padding*/ + 16 /* icon width */;
        }
        enable() {
            this.container.setAttribute('aria-disabled', String(false));
        }
        disable() {
            this.container.setAttribute('aria-disabled', String(true));
        }
        applyStyles(filterChecked) {
            const toggleStyles = this._toggleStyles;
            this._filterButtonContainer.style.border = '1px solid transparent';
            this._filterButtonContainer.style.borderRadius = '3px';
            this._filterButtonContainer.style.borderColor = (filterChecked && toggleStyles.inputActiveOptionBorder) || '';
            this._filterButtonContainer.style.color = (filterChecked && toggleStyles.inputActiveOptionForeground) || 'inherit';
            this._filterButtonContainer.style.backgroundColor = (filterChecked && toggleStyles.inputActiveOptionBackground) || '';
        }
        createFilters(container) {
            this._actionbar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === this._filtersAction.id) {
                        return this.instantiationService.createInstance(NotebookFindFilterActionViewItem, this.filters, action, options, new actions_1.ActionRunner());
                    }
                    return undefined;
                }
            }));
            this._actionbar.push(this._filtersAction, { icon: true, label: false });
        }
    }
    exports.NotebookFindInputFilterButton = NotebookFindInputFilterButton;
    class NotebookFindInput extends findInput_1.FindInput {
        constructor(filters, contextKeyService, contextMenuService, instantiationService, parent, contextViewProvider, options) {
            super(parent, contextViewProvider, options);
            this.filters = filters;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this._filterChecked = false;
            this._register((0, contextScopedHistoryWidget_1.registerAndCreateHistoryNavigationContext)(contextKeyService, this.inputBox));
            this._findFilter = this._register(new NotebookFindInputFilterButton(filters, contextMenuService, instantiationService, options));
            this.inputBox.paddingRight = (this.caseSensitive?.width() ?? 0) + (this.wholeWords?.width() ?? 0) + (this.regex?.width() ?? 0) + this._findFilter.width;
            this.controls.appendChild(this._findFilter.container);
        }
        setEnabled(enabled) {
            super.setEnabled(enabled);
            if (enabled && !this._filterChecked) {
                this.regex?.enable();
            }
            else {
                this.regex?.disable();
            }
        }
        updateFilterState(changed) {
            this._filterChecked = changed;
            if (this.regex) {
                if (this._filterChecked) {
                    this.regex.disable();
                    this.regex.domNode.tabIndex = -1;
                    this.regex.domNode.classList.toggle('disabled', true);
                }
                else {
                    this.regex.enable();
                    this.regex.domNode.tabIndex = 0;
                    this.regex.domNode.classList.toggle('disabled', false);
                }
            }
            this._findFilter.applyStyles(this._filterChecked);
        }
        getCellToolbarActions(menu) {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
            return result;
        }
    }
    exports.NotebookFindInput = NotebookFindInput;
    let SimpleFindReplaceWidget = class SimpleFindReplaceWidget extends widget_1.Widget {
        constructor(_contextViewService, contextKeyService, _configurationService, contextMenuService, instantiationService, _state = new findState_1.FindReplaceState(), _notebookEditor) {
            super();
            this._contextViewService = _contextViewService;
            this._configurationService = _configurationService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this._state = _state;
            this._notebookEditor = _notebookEditor;
            this._resizeOriginalWidth = NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH;
            this._isVisible = false;
            this._isReplaceVisible = false;
            this.foundMatch = false;
            const findScope = this._configurationService.getValue(notebookCommon_1.NotebookSetting.findScope) ?? { markupSource: true, markupPreview: true, codeSource: true, codeOutput: true };
            this._filters = new findFilters_1.NotebookFindFilters(findScope.markupSource, findScope.markupPreview, findScope.codeSource, findScope.codeOutput);
            this._state.change({ filters: this._filters }, false);
            this._filters.onDidChange(() => {
                this._state.change({ filters: this._filters }, false);
            });
            this._domNode = document.createElement('div');
            this._domNode.classList.add('simple-fr-find-part-wrapper');
            this._register(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this._scopedContextKeyService = contextKeyService.createScoped(this._domNode);
            const progressContainer = dom.$('.find-replace-progress');
            this._progressBar = new progressbar_1.ProgressBar(progressContainer, defaultStyles_1.defaultProgressBarStyles);
            this._domNode.appendChild(progressContainer);
            const isInteractiveWindow = contextKeyService.getContextKeyValue('notebookType') === 'interactive';
            // Toggle replace button
            this._toggleReplaceBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_TOGGLE_REPLACE_MODE_BTN_LABEL,
                className: 'codicon toggle left',
                onTrigger: isInteractiveWindow ? () => { } :
                    () => {
                        this._isReplaceVisible = !this._isReplaceVisible;
                        this._state.change({ isReplaceRevealed: this._isReplaceVisible }, false);
                        this._updateReplaceViewDisplay();
                    }
            }));
            this._toggleReplaceBtn.setEnabled(!isInteractiveWindow);
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            this._domNode.appendChild(this._toggleReplaceBtn.domNode);
            this._innerFindDomNode = document.createElement('div');
            this._innerFindDomNode.classList.add('simple-fr-find-part');
            this._findInput = this._register(new NotebookFindInput(this._filters, this._scopedContextKeyService, this.contextMenuService, this.instantiationService, null, this._contextViewService, {
                label: NLS_FIND_INPUT_LABEL,
                placeholder: NLS_FIND_INPUT_PLACEHOLDER,
                validation: (value) => {
                    if (value.length === 0 || !this._findInput.getRegex()) {
                        return null;
                    }
                    try {
                        new RegExp(value);
                        return null;
                    }
                    catch (e) {
                        this.foundMatch = false;
                        this.updateButtons(this.foundMatch);
                        return { content: e.message };
                    }
                },
                flexibleWidth: true,
                showCommonFindToggles: true,
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                toggleStyles: defaultStyles_1.defaultToggleStyles
            }));
            // Find History with update delayer
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this.oninput(this._findInput.domNode, (e) => {
                this.foundMatch = this.onInputChanged();
                this.updateButtons(this.foundMatch);
                this._delayedUpdateHistory();
            });
            this._register(this._findInput.inputBox.onDidChange(() => {
                this._state.change({ searchString: this._findInput.getValue() }, true);
            }));
            this._findInput.setRegex(!!this._state.isRegex);
            this._findInput.setCaseSensitive(!!this._state.matchCase);
            this._findInput.setWholeWords(!!this._state.wholeWord);
            this._register(this._findInput.onDidOptionChange(() => {
                this._state.change({
                    isRegex: this._findInput.getRegex(),
                    wholeWord: this._findInput.getWholeWords(),
                    matchCase: this._findInput.getCaseSensitive()
                }, true);
            }));
            this._register(this._state.onFindReplaceStateChange(() => {
                this._findInput.setRegex(this._state.isRegex);
                this._findInput.setWholeWords(this._state.wholeWord);
                this._findInput.setCaseSensitive(this._state.matchCase);
                this._replaceInput.setPreserveCase(this._state.preserveCase);
                this.findFirst();
            }));
            this._matchesCount = document.createElement('div');
            this._matchesCount.className = 'matchesCount';
            this._updateMatchesCount();
            this.prevBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_PREVIOUS_MATCH_BTN_LABEL,
                icon: findWidget_1.findPreviousMatchIcon,
                onTrigger: () => {
                    this.find(true);
                }
            }));
            this.nextBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_NEXT_MATCH_BTN_LABEL,
                icon: findWidget_1.findNextMatchIcon,
                onTrigger: () => {
                    this.find(false);
                }
            }));
            const closeBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_CLOSE_BTN_LABEL,
                icon: iconRegistry_1.widgetClose,
                onTrigger: () => {
                    this.hide();
                }
            }));
            this._innerFindDomNode.appendChild(this._findInput.domNode);
            this._innerFindDomNode.appendChild(this._matchesCount);
            this._innerFindDomNode.appendChild(this.prevBtn.domNode);
            this._innerFindDomNode.appendChild(this.nextBtn.domNode);
            this._innerFindDomNode.appendChild(closeBtn.domNode);
            // _domNode wraps _innerDomNode, ensuring that
            this._domNode.appendChild(this._innerFindDomNode);
            this.onkeyup(this._innerFindDomNode, e => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                    e.preventDefault();
                    return;
                }
            });
            this._focusTracker = this._register(dom.trackFocus(this._domNode));
            this._register(this._focusTracker.onDidFocus(this.onFocusTrackerFocus.bind(this)));
            this._register(this._focusTracker.onDidBlur(this.onFocusTrackerBlur.bind(this)));
            this._findInputFocusTracker = this._register(dom.trackFocus(this._findInput.domNode));
            this._register(this._findInputFocusTracker.onDidFocus(this.onFindInputFocusTrackerFocus.bind(this)));
            this._register(this._findInputFocusTracker.onDidBlur(this.onFindInputFocusTrackerBlur.bind(this)));
            this._register(dom.addDisposableListener(this._innerFindDomNode, 'click', (event) => {
                event.stopPropagation();
            }));
            // Replace
            this._innerReplaceDomNode = document.createElement('div');
            this._innerReplaceDomNode.classList.add('simple-fr-replace-part');
            this._replaceInput = this._register(new contextScopedHistoryWidget_1.ContextScopedReplaceInput(null, undefined, {
                label: NLS_REPLACE_INPUT_LABEL,
                placeholder: NLS_REPLACE_INPUT_PLACEHOLDER,
                history: [],
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                toggleStyles: defaultStyles_1.defaultToggleStyles
            }, contextKeyService, false));
            this._innerReplaceDomNode.appendChild(this._replaceInput.domNode);
            this._replaceInputFocusTracker = this._register(dom.trackFocus(this._replaceInput.domNode));
            this._register(this._replaceInputFocusTracker.onDidFocus(this.onReplaceInputFocusTrackerFocus.bind(this)));
            this._register(this._replaceInputFocusTracker.onDidBlur(this.onReplaceInputFocusTrackerBlur.bind(this)));
            this._register(this._replaceInput.inputBox.onDidChange(() => {
                this._state.change({ replaceString: this._replaceInput.getValue() }, true);
            }));
            this._domNode.appendChild(this._innerReplaceDomNode);
            this._updateReplaceViewDisplay();
            this._replaceBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_REPLACE_BTN_LABEL,
                icon: findWidget_1.findReplaceIcon,
                onTrigger: () => {
                    this.replaceOne();
                }
            }));
            // Replace all button
            this._replaceAllBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_REPLACE_ALL_BTN_LABEL,
                icon: findWidget_1.findReplaceAllIcon,
                onTrigger: () => {
                    this.replaceAll();
                }
            }));
            this._innerReplaceDomNode.appendChild(this._replaceBtn.domNode);
            this._innerReplaceDomNode.appendChild(this._replaceAllBtn.domNode);
            this._resizeSash = this._register(new sash_1.Sash(this._domNode, { getVerticalSashLeft: () => 0 }, { orientation: 0 /* Orientation.VERTICAL */, size: 2 }));
            this._register(this._resizeSash.onDidStart(() => {
                this._resizeOriginalWidth = this._getDomWidth();
            }));
            this._register(this._resizeSash.onDidChange((evt) => {
                let width = this._resizeOriginalWidth + evt.startX - evt.currentX;
                if (width < NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH) {
                    width = NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH;
                }
                const maxWidth = this._getMaxWidth();
                if (width > maxWidth) {
                    width = maxWidth;
                }
                this._domNode.style.width = `${width}px`;
                if (this._isReplaceVisible) {
                    this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                }
                this._findInput.inputBox.layout();
            }));
            this._register(this._resizeSash.onDidReset(() => {
                // users double click on the sash
                // try to emulate what happens with editor findWidget
                const currentWidth = this._getDomWidth();
                let width = NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH;
                if (currentWidth <= NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH) {
                    width = this._getMaxWidth();
                }
                this._domNode.style.width = `${width}px`;
                if (this._isReplaceVisible) {
                    this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                }
                this._findInput.inputBox.layout();
            }));
        }
        _getMaxWidth() {
            return this._notebookEditor.getLayoutInfo().width - 64;
        }
        _getDomWidth() {
            return dom.getTotalWidth(this._domNode) - (NOTEBOOK_FIND_WIDGET_INITIAL_HORIZONTAL_PADDING * 2);
        }
        getCellToolbarActions(menu) {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
            return result;
        }
        get inputValue() {
            return this._findInput.getValue();
        }
        get replaceValue() {
            return this._replaceInput.getValue();
        }
        get replacePattern() {
            if (this._state.isRegex) {
                return (0, replacePattern_1.parseReplaceString)(this.replaceValue);
            }
            return replacePattern_1.ReplacePattern.fromStaticValue(this.replaceValue);
        }
        get focusTracker() {
            return this._focusTracker;
        }
        _onStateChanged(e) {
            this._updateButtons();
            this._updateMatchesCount();
        }
        _updateButtons() {
            this._findInput.setEnabled(this._isVisible);
            this._replaceInput.setEnabled(this._isVisible && this._isReplaceVisible);
            const findInputIsNonEmpty = (this._state.searchString.length > 0);
            this._replaceBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._replaceAllBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._domNode.classList.toggle('replaceToggled', this._isReplaceVisible);
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            this.foundMatch = this._state.matchesCount > 0;
            this.updateButtons(this.foundMatch);
        }
        _updateMatchesCount() {
        }
        dispose() {
            super.dispose();
            if (this._domNode && this._domNode.parentElement) {
                this._domNode.parentElement.removeChild(this._domNode);
            }
        }
        getDomNode() {
            return this._domNode;
        }
        reveal(initialInput) {
            if (initialInput) {
                this._findInput.setValue(initialInput);
            }
            if (this._isVisible) {
                this._findInput.select();
                return;
            }
            this._isVisible = true;
            this.updateButtons(this.foundMatch);
            setTimeout(() => {
                this._domNode.classList.add('visible', 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                this._findInput.select();
            }, 0);
        }
        focus() {
            this._findInput.focus();
        }
        show(initialInput, options) {
            if (initialInput) {
                this._findInput.setValue(initialInput);
            }
            this._isVisible = true;
            setTimeout(() => {
                this._domNode.classList.add('visible', 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                if (options?.focus ?? true) {
                    this.focus();
                }
            }, 0);
        }
        showWithReplace(initialInput, replaceInput) {
            if (initialInput) {
                this._findInput.setValue(initialInput);
            }
            if (replaceInput) {
                this._replaceInput.setValue(replaceInput);
            }
            this._isVisible = true;
            this._isReplaceVisible = true;
            this._state.change({ isReplaceRevealed: this._isReplaceVisible }, false);
            this._updateReplaceViewDisplay();
            setTimeout(() => {
                this._domNode.classList.add('visible', 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                this._updateButtons();
                this._replaceInput.focus();
            }, 0);
        }
        _updateReplaceViewDisplay() {
            if (this._isReplaceVisible) {
                this._innerReplaceDomNode.style.display = 'flex';
            }
            else {
                this._innerReplaceDomNode.style.display = 'none';
            }
            this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
        }
        hide() {
            if (this._isVisible) {
                this._domNode.classList.remove('visible-transition');
                this._domNode.setAttribute('aria-hidden', 'true');
                // Need to delay toggling visibility until after Transition, then visibility hidden - removes from tabIndex list
                setTimeout(() => {
                    this._isVisible = false;
                    this.updateButtons(this.foundMatch);
                    this._domNode.classList.remove('visible');
                }, 200);
            }
        }
        _delayedUpdateHistory() {
            this._updateHistoryDelayer.trigger(this._updateHistory.bind(this));
        }
        _updateHistory() {
            this._findInput.inputBox.addToHistory();
        }
        _getRegexValue() {
            return this._findInput.getRegex();
        }
        _getWholeWordValue() {
            return this._findInput.getWholeWords();
        }
        _getCaseSensitiveValue() {
            return this._findInput.getCaseSensitive();
        }
        updateButtons(foundMatch) {
            const hasInput = this.inputValue.length > 0;
            this.prevBtn.setEnabled(this._isVisible && hasInput && foundMatch);
            this.nextBtn.setEnabled(this._isVisible && hasInput && foundMatch);
        }
    };
    exports.SimpleFindReplaceWidget = SimpleFindReplaceWidget;
    exports.SimpleFindReplaceWidget = SimpleFindReplaceWidget = __decorate([
        __param(0, contextView_1.IContextViewService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService)
    ], SimpleFindReplaceWidget);
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        collector.addRule(`
	.notebook-editor {
		--notebook-find-width: ${NOTEBOOK_FIND_WIDGET_INITIAL_WIDTH}px;
		--notebook-find-horizontal-padding: ${NOTEBOOK_FIND_WIDGET_INITIAL_HORIZONTAL_PADDING}px;
	}
	`);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tGaW5kUmVwbGFjZVdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2ZpbmQvbm90ZWJvb2tGaW5kUmVwbGFjZVdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5Q2hHLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEUsTUFBTSwwQkFBMEIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzVFLE1BQU0sNEJBQTRCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2pHLHlGQUF5RjtJQUN6RixNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDckYsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZFLE1BQU0saUNBQWlDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RHLE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDekUsTUFBTSw2QkFBNkIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3JGLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxTQUFT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