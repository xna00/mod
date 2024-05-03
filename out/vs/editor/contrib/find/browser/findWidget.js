/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/sash/sash", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/contrib/find/browser/findModel", "vs/nls", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/history/browser/historyWidgetKeybindingHint", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/theme", "vs/base/common/types", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./findWidget"], function (require, exports, dom, aria_1, toggle_1, sash_1, widget_1, async_1, codicons_1, errors_1, lifecycle_1, platform, strings, range_1, findModel_1, nls, contextScopedHistoryWidget_1, historyWidgetKeybindingHint_1, colorRegistry_1, iconRegistry_1, themeService_1, themables_1, theme_1, types_1, defaultStyles_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleButton = exports.FindWidget = exports.FindWidgetViewZone = exports.NLS_NO_RESULTS = exports.NLS_MATCHES_LOCATION = exports.findNextMatchIcon = exports.findPreviousMatchIcon = exports.findReplaceAllIcon = exports.findReplaceIcon = void 0;
    const findSelectionIcon = (0, iconRegistry_1.registerIcon)('find-selection', codicons_1.Codicon.selection, nls.localize('findSelectionIcon', 'Icon for \'Find in Selection\' in the editor find widget.'));
    const findCollapsedIcon = (0, iconRegistry_1.registerIcon)('find-collapsed', codicons_1.Codicon.chevronRight, nls.localize('findCollapsedIcon', 'Icon to indicate that the editor find widget is collapsed.'));
    const findExpandedIcon = (0, iconRegistry_1.registerIcon)('find-expanded', codicons_1.Codicon.chevronDown, nls.localize('findExpandedIcon', 'Icon to indicate that the editor find widget is expanded.'));
    exports.findReplaceIcon = (0, iconRegistry_1.registerIcon)('find-replace', codicons_1.Codicon.replace, nls.localize('findReplaceIcon', 'Icon for \'Replace\' in the editor find widget.'));
    exports.findReplaceAllIcon = (0, iconRegistry_1.registerIcon)('find-replace-all', codicons_1.Codicon.replaceAll, nls.localize('findReplaceAllIcon', 'Icon for \'Replace All\' in the editor find widget.'));
    exports.findPreviousMatchIcon = (0, iconRegistry_1.registerIcon)('find-previous-match', codicons_1.Codicon.arrowUp, nls.localize('findPreviousMatchIcon', 'Icon for \'Find Previous\' in the editor find widget.'));
    exports.findNextMatchIcon = (0, iconRegistry_1.registerIcon)('find-next-match', codicons_1.Codicon.arrowDown, nls.localize('findNextMatchIcon', 'Icon for \'Find Next\' in the editor find widget.'));
    const NLS_FIND_DIALOG_LABEL = nls.localize('label.findDialog', "Find / Replace");
    const NLS_FIND_INPUT_LABEL = nls.localize('label.find', "Find");
    const NLS_FIND_INPUT_PLACEHOLDER = nls.localize('placeholder.find', "Find");
    const NLS_PREVIOUS_MATCH_BTN_LABEL = nls.localize('label.previousMatchButton', "Previous Match");
    const NLS_NEXT_MATCH_BTN_LABEL = nls.localize('label.nextMatchButton', "Next Match");
    const NLS_TOGGLE_SELECTION_FIND_TITLE = nls.localize('label.toggleSelectionFind', "Find in Selection");
    const NLS_CLOSE_BTN_LABEL = nls.localize('label.closeButton', "Close");
    const NLS_REPLACE_INPUT_LABEL = nls.localize('label.replace', "Replace");
    const NLS_REPLACE_INPUT_PLACEHOLDER = nls.localize('placeholder.replace', "Replace");
    const NLS_REPLACE_BTN_LABEL = nls.localize('label.replaceButton', "Replace");
    const NLS_REPLACE_ALL_BTN_LABEL = nls.localize('label.replaceAllButton', "Replace All");
    const NLS_TOGGLE_REPLACE_MODE_BTN_LABEL = nls.localize('label.toggleReplaceButton', "Toggle Replace");
    const NLS_MATCHES_COUNT_LIMIT_TITLE = nls.localize('title.matchesCountLimit', "Only the first {0} results are highlighted, but all find operations work on the entire text.", findModel_1.MATCHES_LIMIT);
    exports.NLS_MATCHES_LOCATION = nls.localize('label.matchesLocation', "{0} of {1}");
    exports.NLS_NO_RESULTS = nls.localize('label.noResults', "No results");
    const FIND_WIDGET_INITIAL_WIDTH = 419;
    const PART_WIDTH = 275;
    const FIND_INPUT_AREA_WIDTH = PART_WIDTH - 54;
    let MAX_MATCHES_COUNT_WIDTH = 69;
    // let FIND_ALL_CONTROLS_WIDTH = 17/** Find Input margin-left */ + (MAX_MATCHES_COUNT_WIDTH + 3 + 1) /** Match Results */ + 23 /** Button */ * 4 + 2/** sash */;
    const FIND_INPUT_AREA_HEIGHT = 33; // The height of Find Widget when Replace Input is not visible.
    const ctrlEnterReplaceAllWarningPromptedKey = 'ctrlEnterReplaceAll.windows.donotask';
    const ctrlKeyMod = (platform.isMacintosh ? 256 /* KeyMod.WinCtrl */ : 2048 /* KeyMod.CtrlCmd */);
    class FindWidgetViewZone {
        constructor(afterLineNumber) {
            this.afterLineNumber = afterLineNumber;
            this.heightInPx = FIND_INPUT_AREA_HEIGHT;
            this.suppressMouseDown = false;
            this.domNode = document.createElement('div');
            this.domNode.className = 'dock-find-viewzone';
        }
    }
    exports.FindWidgetViewZone = FindWidgetViewZone;
    function stopPropagationForMultiLineUpwards(event, value, textarea) {
        const isMultiline = !!value.match(/\n/);
        if (textarea && isMultiline && textarea.selectionStart > 0) {
            event.stopPropagation();
            return;
        }
    }
    function stopPropagationForMultiLineDownwards(event, value, textarea) {
        const isMultiline = !!value.match(/\n/);
        if (textarea && isMultiline && textarea.selectionEnd < textarea.value.length) {
            event.stopPropagation();
            return;
        }
    }
    class FindWidget extends widget_1.Widget {
        static { this.ID = 'editor.contrib.findWidget'; }
        constructor(codeEditor, controller, state, contextViewProvider, keybindingService, contextKeyService, themeService, storageService, notificationService) {
            super();
            this._cachedHeight = null;
            this._revealTimeouts = [];
            this._codeEditor = codeEditor;
            this._controller = controller;
            this._state = state;
            this._contextViewProvider = contextViewProvider;
            this._keybindingService = keybindingService;
            this._contextKeyService = contextKeyService;
            this._storageService = storageService;
            this._notificationService = notificationService;
            this._ctrlEnterReplaceAllWarningPrompted = !!storageService.getBoolean(ctrlEnterReplaceAllWarningPromptedKey, 0 /* StorageScope.PROFILE */);
            this._isVisible = false;
            this._isReplaceVisible = false;
            this._ignoreChangeEvent = false;
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this._register((0, lifecycle_1.toDisposable)(() => this._updateHistoryDelayer.cancel()));
            this._register(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this._buildDomNode();
            this._updateButtons();
            this._tryUpdateWidgetWidth();
            this._findInput.inputBox.layout();
            this._register(this._codeEditor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(91 /* EditorOption.readOnly */)) {
                    if (this._codeEditor.getOption(91 /* EditorOption.readOnly */)) {
                        // Hide replace part if editor becomes read only
                        this._state.change({ isReplaceRevealed: false }, false);
                    }
                    this._updateButtons();
                }
                if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                    this._tryUpdateWidgetWidth();
                }
                if (e.hasChanged(2 /* EditorOption.accessibilitySupport */)) {
                    this.updateAccessibilitySupport();
                }
                if (e.hasChanged(41 /* EditorOption.find */)) {
                    const supportLoop = this._codeEditor.getOption(41 /* EditorOption.find */).loop;
                    this._state.change({ loop: supportLoop }, false);
                    const addExtraSpaceOnTop = this._codeEditor.getOption(41 /* EditorOption.find */).addExtraSpaceOnTop;
                    if (addExtraSpaceOnTop && !this._viewZone) {
                        this._viewZone = new FindWidgetViewZone(0);
                        this._showViewZone();
                    }
                    if (!addExtraSpaceOnTop && this._viewZone) {
                        this._removeViewZone();
                    }
                }
            }));
            this.updateAccessibilitySupport();
            this._register(this._codeEditor.onDidChangeCursorSelection(() => {
                if (this._isVisible) {
                    this._updateToggleSelectionFindButton();
                }
            }));
            this._register(this._codeEditor.onDidFocusEditorWidget(async () => {
                if (this._isVisible) {
                    const globalBufferTerm = await this._controller.getGlobalBufferTerm();
                    if (globalBufferTerm && globalBufferTerm !== this._state.searchString) {
                        this._state.change({ searchString: globalBufferTerm }, false);
                        this._findInput.select();
                    }
                }
            }));
            this._findInputFocused = findModel_1.CONTEXT_FIND_INPUT_FOCUSED.bindTo(contextKeyService);
            this._findFocusTracker = this._register(dom.trackFocus(this._findInput.inputBox.inputElement));
            this._register(this._findFocusTracker.onDidFocus(() => {
                this._findInputFocused.set(true);
                this._updateSearchScope();
            }));
            this._register(this._findFocusTracker.onDidBlur(() => {
                this._findInputFocused.set(false);
            }));
            this._replaceInputFocused = findModel_1.CONTEXT_REPLACE_INPUT_FOCUSED.bindTo(contextKeyService);
            this._replaceFocusTracker = this._register(dom.trackFocus(this._replaceInput.inputBox.inputElement));
            this._register(this._replaceFocusTracker.onDidFocus(() => {
                this._replaceInputFocused.set(true);
                this._updateSearchScope();
            }));
            this._register(this._replaceFocusTracker.onDidBlur(() => {
                this._replaceInputFocused.set(false);
            }));
            this._codeEditor.addOverlayWidget(this);
            if (this._codeEditor.getOption(41 /* EditorOption.find */).addExtraSpaceOnTop) {
                this._viewZone = new FindWidgetViewZone(0); // Put it before the first line then users can scroll beyond the first line.
            }
            this._register(this._codeEditor.onDidChangeModel(() => {
                if (!this._isVisible) {
                    return;
                }
                this._viewZoneId = undefined;
            }));
            this._register(this._codeEditor.onDidScrollChange((e) => {
                if (e.scrollTopChanged) {
                    this._layoutViewZone();
                    return;
                }
                // for other scroll changes, layout the viewzone in next tick to avoid ruining current rendering.
                setTimeout(() => {
                    this._layoutViewZone();
                }, 0);
            }));
        }
        // ----- IOverlayWidget API
        getId() {
            return FindWidget.ID;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            if (this._isVisible) {
                return {
                    preference: 0 /* OverlayWidgetPositionPreference.TOP_RIGHT_CORNER */
                };
            }
            return null;
        }
        // ----- React to state changes
        _onStateChanged(e) {
            if (e.searchString) {
                try {
                    this._ignoreChangeEvent = true;
                    this._findInput.setValue(this._state.searchString);
                }
                finally {
                    this._ignoreChangeEvent = false;
                }
                this._updateButtons();
            }
            if (e.replaceString) {
                this._replaceInput.inputBox.value = this._state.replaceString;
            }
            if (e.isRevealed) {
                if (this._state.isRevealed) {
                    this._reveal();
                }
                else {
                    this._hide(true);
                }
            }
            if (e.isReplaceRevealed) {
                if (this._state.isReplaceRevealed) {
                    if (!this._codeEditor.getOption(91 /* EditorOption.readOnly */) && !this._isReplaceVisible) {
                        this._isReplaceVisible = true;
                        this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                        this._updateButtons();
                        this._replaceInput.inputBox.layout();
                    }
                }
                else {
                    if (this._isReplaceVisible) {
                        this._isReplaceVisible = false;
                        this._updateButtons();
                    }
                }
            }
            if ((e.isRevealed || e.isReplaceRevealed) && (this._state.isRevealed || this._state.isReplaceRevealed)) {
                if (this._tryUpdateHeight()) {
                    this._showViewZone();
                }
            }
            if (e.isRegex) {
                this._findInput.setRegex(this._state.isRegex);
            }
            if (e.wholeWord) {
                this._findInput.setWholeWords(this._state.wholeWord);
            }
            if (e.matchCase) {
                this._findInput.setCaseSensitive(this._state.matchCase);
            }
            if (e.preserveCase) {
                this._replaceInput.setPreserveCase(this._state.preserveCase);
            }
            if (e.searchScope) {
                if (this._state.searchScope) {
                    this._toggleSelectionFind.checked = true;
                }
                else {
                    this._toggleSelectionFind.checked = false;
                }
                this._updateToggleSelectionFindButton();
            }
            if (e.searchString || e.matchesCount || e.matchesPosition) {
                const showRedOutline = (this._state.searchString.length > 0 && this._state.matchesCount === 0);
                this._domNode.classList.toggle('no-results', showRedOutline);
                this._updateMatchesCount();
                this._updateButtons();
            }
            if (e.searchString || e.currentMatch) {
                this._layoutViewZone();
            }
            if (e.updateHistory) {
                this._delayedUpdateHistory();
            }
            if (e.loop) {
                this._updateButtons();
            }
        }
        _delayedUpdateHistory() {
            this._updateHistoryDelayer.trigger(this._updateHistory.bind(this)).then(undefined, errors_1.onUnexpectedError);
        }
        _updateHistory() {
            if (this._state.searchString) {
                this._findInput.inputBox.addToHistory();
            }
            if (this._state.replaceString) {
                this._replaceInput.inputBox.addToHistory();
            }
        }
        _updateMatchesCount() {
            this._matchesCount.style.minWidth = MAX_MATCHES_COUNT_WIDTH + 'px';
            if (this._state.matchesCount >= findModel_1.MATCHES_LIMIT) {
                this._matchesCount.title = NLS_MATCHES_COUNT_LIMIT_TITLE;
            }
            else {
                this._matchesCount.title = '';
            }
            // remove previous content
            if (this._matchesCount.firstChild) {
                this._matchesCount.removeChild(this._matchesCount.firstChild);
            }
            let label;
            if (this._state.matchesCount > 0) {
                let matchesCount = String(this._state.matchesCount);
                if (this._state.matchesCount >= findModel_1.MATCHES_LIMIT) {
                    matchesCount += '+';
                }
                let matchesPosition = String(this._state.matchesPosition);
                if (matchesPosition === '0') {
                    matchesPosition = '?';
                }
                label = strings.format(exports.NLS_MATCHES_LOCATION, matchesPosition, matchesCount);
            }
            else {
                label = exports.NLS_NO_RESULTS;
            }
            this._matchesCount.appendChild(document.createTextNode(label));
            (0, aria_1.alert)(this._getAriaLabel(label, this._state.currentMatch, this._state.searchString));
            MAX_MATCHES_COUNT_WIDTH = Math.max(MAX_MATCHES_COUNT_WIDTH, this._matchesCount.clientWidth);
        }
        // ----- actions
        _getAriaLabel(label, currentMatch, searchString) {
            if (label === exports.NLS_NO_RESULTS) {
                return searchString === ''
                    ? nls.localize('ariaSearchNoResultEmpty', "{0} found", label)
                    : nls.localize('ariaSearchNoResult', "{0} found for '{1}'", label, searchString);
            }
            if (currentMatch) {
                const ariaLabel = nls.localize('ariaSearchNoResultWithLineNum', "{0} found for '{1}', at {2}", label, searchString, currentMatch.startLineNumber + ':' + currentMatch.startColumn);
                const model = this._codeEditor.getModel();
                if (model && (currentMatch.startLineNumber <= model.getLineCount()) && (currentMatch.startLineNumber >= 1)) {
                    const lineContent = model.getLineContent(currentMatch.startLineNumber);
                    return `${lineContent}, ${ariaLabel}`;
                }
                return ariaLabel;
            }
            return nls.localize('ariaSearchNoResultWithLineNumNoCurrentMatch', "{0} found for '{1}'", label, searchString);
        }
        /**
         * If 'selection find' is ON we should not disable the button (its function is to cancel 'selection find').
         * If 'selection find' is OFF we enable the button only if there is a selection.
         */
        _updateToggleSelectionFindButton() {
            const selection = this._codeEditor.getSelection();
            const isSelection = selection ? (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn) : false;
            const isChecked = this._toggleSelectionFind.checked;
            if (this._isVisible && (isChecked || isSelection)) {
                this._toggleSelectionFind.enable();
            }
            else {
                this._toggleSelectionFind.disable();
            }
        }
        _updateButtons() {
            this._findInput.setEnabled(this._isVisible);
            this._replaceInput.setEnabled(this._isVisible && this._isReplaceVisible);
            this._updateToggleSelectionFindButton();
            this._closeBtn.setEnabled(this._isVisible);
            const findInputIsNonEmpty = (this._state.searchString.length > 0);
            const matchesCount = this._state.matchesCount ? true : false;
            this._prevBtn.setEnabled(this._isVisible && findInputIsNonEmpty && matchesCount && this._state.canNavigateBack());
            this._nextBtn.setEnabled(this._isVisible && findInputIsNonEmpty && matchesCount && this._state.canNavigateForward());
            this._replaceBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._replaceAllBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._domNode.classList.toggle('replaceToggled', this._isReplaceVisible);
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            const canReplace = !this._codeEditor.getOption(91 /* EditorOption.readOnly */);
            this._toggleReplaceBtn.setEnabled(this._isVisible && canReplace);
        }
        _reveal() {
            this._revealTimeouts.forEach(e => {
                clearTimeout(e);
            });
            this._revealTimeouts = [];
            if (!this._isVisible) {
                this._isVisible = true;
                const selection = this._codeEditor.getSelection();
                switch (this._codeEditor.getOption(41 /* EditorOption.find */).autoFindInSelection) {
                    case 'always':
                        this._toggleSelectionFind.checked = true;
                        break;
                    case 'never':
                        this._toggleSelectionFind.checked = false;
                        break;
                    case 'multiline': {
                        const isSelectionMultipleLine = !!selection && selection.startLineNumber !== selection.endLineNumber;
                        this._toggleSelectionFind.checked = isSelectionMultipleLine;
                        break;
                    }
                    default:
                        break;
                }
                this._tryUpdateWidgetWidth();
                this._updateButtons();
                this._revealTimeouts.push(setTimeout(() => {
                    this._domNode.classList.add('visible');
                    this._domNode.setAttribute('aria-hidden', 'false');
                }, 0));
                // validate query again as it's being dismissed when we hide the find widget.
                this._revealTimeouts.push(setTimeout(() => {
                    this._findInput.validate();
                }, 200));
                this._codeEditor.layoutOverlayWidget(this);
                let adjustEditorScrollTop = true;
                if (this._codeEditor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection && selection) {
                    const domNode = this._codeEditor.getDomNode();
                    if (domNode) {
                        const editorCoords = dom.getDomNodePagePosition(domNode);
                        const startCoords = this._codeEditor.getScrolledVisiblePosition(selection.getStartPosition());
                        const startLeft = editorCoords.left + (startCoords ? startCoords.left : 0);
                        const startTop = startCoords ? startCoords.top : 0;
                        if (this._viewZone && startTop < this._viewZone.heightInPx) {
                            if (selection.endLineNumber > selection.startLineNumber) {
                                adjustEditorScrollTop = false;
                            }
                            const leftOfFindWidget = dom.getTopLeftOffset(this._domNode).left;
                            if (startLeft > leftOfFindWidget) {
                                adjustEditorScrollTop = false;
                            }
                            const endCoords = this._codeEditor.getScrolledVisiblePosition(selection.getEndPosition());
                            const endLeft = editorCoords.left + (endCoords ? endCoords.left : 0);
                            if (endLeft > leftOfFindWidget) {
                                adjustEditorScrollTop = false;
                            }
                        }
                    }
                }
                this._showViewZone(adjustEditorScrollTop);
            }
        }
        _hide(focusTheEditor) {
            this._revealTimeouts.forEach(e => {
                clearTimeout(e);
            });
            this._revealTimeouts = [];
            if (this._isVisible) {
                this._isVisible = false;
                this._updateButtons();
                this._domNode.classList.remove('visible');
                this._domNode.setAttribute('aria-hidden', 'true');
                this._findInput.clearMessage();
                if (focusTheEditor) {
                    this._codeEditor.focus();
                }
                this._codeEditor.layoutOverlayWidget(this);
                this._removeViewZone();
            }
        }
        _layoutViewZone(targetScrollTop) {
            const addExtraSpaceOnTop = this._codeEditor.getOption(41 /* EditorOption.find */).addExtraSpaceOnTop;
            if (!addExtraSpaceOnTop) {
                this._removeViewZone();
                return;
            }
            if (!this._isVisible) {
                return;
            }
            const viewZone = this._viewZone;
            if (this._viewZoneId !== undefined || !viewZone) {
                return;
            }
            this._codeEditor.changeViewZones((accessor) => {
                viewZone.heightInPx = this._getHeight();
                this._viewZoneId = accessor.addZone(viewZone);
                // scroll top adjust to make sure the editor doesn't scroll when adding viewzone at the beginning.
                this._codeEditor.setScrollTop(targetScrollTop || this._codeEditor.getScrollTop() + viewZone.heightInPx);
            });
        }
        _showViewZone(adjustScroll = true) {
            if (!this._isVisible) {
                return;
            }
            const addExtraSpaceOnTop = this._codeEditor.getOption(41 /* EditorOption.find */).addExtraSpaceOnTop;
            if (!addExtraSpaceOnTop) {
                return;
            }
            if (this._viewZone === undefined) {
                this._viewZone = new FindWidgetViewZone(0);
            }
            const viewZone = this._viewZone;
            this._codeEditor.changeViewZones((accessor) => {
                if (this._viewZoneId !== undefined) {
                    // the view zone already exists, we need to update the height
                    const newHeight = this._getHeight();
                    if (newHeight === viewZone.heightInPx) {
                        return;
                    }
                    const scrollAdjustment = newHeight - viewZone.heightInPx;
                    viewZone.heightInPx = newHeight;
                    accessor.layoutZone(this._viewZoneId);
                    if (adjustScroll) {
                        this._codeEditor.setScrollTop(this._codeEditor.getScrollTop() + scrollAdjustment);
                    }
                    return;
                }
                else {
                    let scrollAdjustment = this._getHeight();
                    // if the editor has top padding, factor that into the zone height
                    scrollAdjustment -= this._codeEditor.getOption(84 /* EditorOption.padding */).top;
                    if (scrollAdjustment <= 0) {
                        return;
                    }
                    viewZone.heightInPx = scrollAdjustment;
                    this._viewZoneId = accessor.addZone(viewZone);
                    if (adjustScroll) {
                        this._codeEditor.setScrollTop(this._codeEditor.getScrollTop() + scrollAdjustment);
                    }
                }
            });
        }
        _removeViewZone() {
            this._codeEditor.changeViewZones((accessor) => {
                if (this._viewZoneId !== undefined) {
                    accessor.removeZone(this._viewZoneId);
                    this._viewZoneId = undefined;
                    if (this._viewZone) {
                        this._codeEditor.setScrollTop(this._codeEditor.getScrollTop() - this._viewZone.heightInPx);
                        this._viewZone = undefined;
                    }
                }
            });
        }
        _tryUpdateWidgetWidth() {
            if (!this._isVisible) {
                return;
            }
            if (!this._domNode.isConnected) {
                // the widget is not in the DOM
                return;
            }
            const layoutInfo = this._codeEditor.getLayoutInfo();
            const editorContentWidth = layoutInfo.contentWidth;
            if (editorContentWidth <= 0) {
                // for example, diff view original editor
                this._domNode.classList.add('hiddenEditor');
                return;
            }
            else if (this._domNode.classList.contains('hiddenEditor')) {
                this._domNode.classList.remove('hiddenEditor');
            }
            const editorWidth = layoutInfo.width;
            const minimapWidth = layoutInfo.minimap.minimapWidth;
            let collapsedFindWidget = false;
            let reducedFindWidget = false;
            let narrowFindWidget = false;
            if (this._resized) {
                const widgetWidth = dom.getTotalWidth(this._domNode);
                if (widgetWidth > FIND_WIDGET_INITIAL_WIDTH) {
                    // as the widget is resized by users, we may need to change the max width of the widget as the editor width changes.
                    this._domNode.style.maxWidth = `${editorWidth - 28 - minimapWidth - 15}px`;
                    this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                    return;
                }
            }
            if (FIND_WIDGET_INITIAL_WIDTH + 28 + minimapWidth >= editorWidth) {
                reducedFindWidget = true;
            }
            if (FIND_WIDGET_INITIAL_WIDTH + 28 + minimapWidth - MAX_MATCHES_COUNT_WIDTH >= editorWidth) {
                narrowFindWidget = true;
            }
            if (FIND_WIDGET_INITIAL_WIDTH + 28 + minimapWidth - MAX_MATCHES_COUNT_WIDTH >= editorWidth + 50) {
                collapsedFindWidget = true;
            }
            this._domNode.classList.toggle('collapsed-find-widget', collapsedFindWidget);
            this._domNode.classList.toggle('narrow-find-widget', narrowFindWidget);
            this._domNode.classList.toggle('reduced-find-widget', reducedFindWidget);
            if (!narrowFindWidget && !collapsedFindWidget) {
                // the minimal left offset of findwidget is 15px.
                this._domNode.style.maxWidth = `${editorWidth - 28 - minimapWidth - 15}px`;
            }
            this._findInput.layout({ collapsedFindWidget, narrowFindWidget, reducedFindWidget });
            if (this._resized) {
                const findInputWidth = this._findInput.inputBox.element.clientWidth;
                if (findInputWidth > 0) {
                    this._replaceInput.width = findInputWidth;
                }
            }
            else if (this._isReplaceVisible) {
                this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
            }
        }
        _getHeight() {
            let totalheight = 0;
            // find input margin top
            totalheight += 4;
            // find input height
            totalheight += this._findInput.inputBox.height + 2 /** input box border */;
            if (this._isReplaceVisible) {
                // replace input margin
                totalheight += 4;
                totalheight += this._replaceInput.inputBox.height + 2 /** input box border */;
            }
            // margin bottom
            totalheight += 4;
            return totalheight;
        }
        _tryUpdateHeight() {
            const totalHeight = this._getHeight();
            if (this._cachedHeight !== null && this._cachedHeight === totalHeight) {
                return false;
            }
            this._cachedHeight = totalHeight;
            this._domNode.style.height = `${totalHeight}px`;
            return true;
        }
        // ----- Public
        focusFindInput() {
            this._findInput.select();
            // Edge browser requires focus() in addition to select()
            this._findInput.focus();
        }
        focusReplaceInput() {
            this._replaceInput.select();
            // Edge browser requires focus() in addition to select()
            this._replaceInput.focus();
        }
        highlightFindOptions() {
            this._findInput.highlightFindOptions();
        }
        _updateSearchScope() {
            if (!this._codeEditor.hasModel()) {
                return;
            }
            if (this._toggleSelectionFind.checked) {
                const selections = this._codeEditor.getSelections();
                selections.map(selection => {
                    if (selection.endColumn === 1 && selection.endLineNumber > selection.startLineNumber) {
                        selection = selection.setEndPosition(selection.endLineNumber - 1, this._codeEditor.getModel().getLineMaxColumn(selection.endLineNumber - 1));
                    }
                    const currentMatch = this._state.currentMatch;
                    if (selection.startLineNumber !== selection.endLineNumber) {
                        if (!range_1.Range.equalsRange(selection, currentMatch)) {
                            return selection;
                        }
                    }
                    return null;
                }).filter(element => !!element);
                if (selections.length) {
                    this._state.change({ searchScope: selections }, true);
                }
            }
        }
        _onFindInputMouseDown(e) {
            // on linux, middle key does pasting.
            if (e.middleButton) {
                e.stopPropagation();
            }
        }
        _onFindInputKeyDown(e) {
            if (e.equals(ctrlKeyMod | 3 /* KeyCode.Enter */)) {
                if (this._keybindingService.dispatchEvent(e, e.target)) {
                    e.preventDefault();
                    return;
                }
                else {
                    this._findInput.inputBox.insertAtCursor('\n');
                    e.preventDefault();
                    return;
                }
            }
            if (e.equals(2 /* KeyCode.Tab */)) {
                if (this._isReplaceVisible) {
                    this._replaceInput.focus();
                }
                else {
                    this._findInput.focusOnCaseSensitive();
                }
                e.preventDefault();
                return;
            }
            if (e.equals(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */)) {
                this._codeEditor.focus();
                e.preventDefault();
                return;
            }
            if (e.equals(16 /* KeyCode.UpArrow */)) {
                return stopPropagationForMultiLineUpwards(e, this._findInput.getValue(), this._findInput.domNode.querySelector('textarea'));
            }
            if (e.equals(18 /* KeyCode.DownArrow */)) {
                return stopPropagationForMultiLineDownwards(e, this._findInput.getValue(), this._findInput.domNode.querySelector('textarea'));
            }
        }
        _onReplaceInputKeyDown(e) {
            if (e.equals(ctrlKeyMod | 3 /* KeyCode.Enter */)) {
                if (this._keybindingService.dispatchEvent(e, e.target)) {
                    e.preventDefault();
                    return;
                }
                else {
                    if (platform.isWindows && platform.isNative && !this._ctrlEnterReplaceAllWarningPrompted) {
                        // this is the first time when users press Ctrl + Enter to replace all
                        this._notificationService.info(nls.localize('ctrlEnter.keybindingChanged', 'Ctrl+Enter now inserts line break instead of replacing all. You can modify the keybinding for editor.action.replaceAll to override this behavior.'));
                        this._ctrlEnterReplaceAllWarningPrompted = true;
                        this._storageService.store(ctrlEnterReplaceAllWarningPromptedKey, true, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                    }
                    this._replaceInput.inputBox.insertAtCursor('\n');
                    e.preventDefault();
                    return;
                }
            }
            if (e.equals(2 /* KeyCode.Tab */)) {
                this._findInput.focusOnCaseSensitive();
                e.preventDefault();
                return;
            }
            if (e.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                this._findInput.focus();
                e.preventDefault();
                return;
            }
            if (e.equals(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */)) {
                this._codeEditor.focus();
                e.preventDefault();
                return;
            }
            if (e.equals(16 /* KeyCode.UpArrow */)) {
                return stopPropagationForMultiLineUpwards(e, this._replaceInput.inputBox.value, this._replaceInput.inputBox.element.querySelector('textarea'));
            }
            if (e.equals(18 /* KeyCode.DownArrow */)) {
                return stopPropagationForMultiLineDownwards(e, this._replaceInput.inputBox.value, this._replaceInput.inputBox.element.querySelector('textarea'));
            }
        }
        // ----- sash
        getVerticalSashLeft(_sash) {
            return 0;
        }
        // ----- initialization
        _keybindingLabelFor(actionId) {
            const kb = this._keybindingService.lookupKeybinding(actionId);
            if (!kb) {
                return '';
            }
            return ` (${kb.getLabel()})`;
        }
        _buildDomNode() {
            const flexibleHeight = true;
            const flexibleWidth = true;
            // Find input
            this._findInput = this._register(new contextScopedHistoryWidget_1.ContextScopedFindInput(null, this._contextViewProvider, {
                width: FIND_INPUT_AREA_WIDTH,
                label: NLS_FIND_INPUT_LABEL,
                placeholder: NLS_FIND_INPUT_PLACEHOLDER,
                appendCaseSensitiveLabel: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleCaseSensitiveCommand),
                appendWholeWordsLabel: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleWholeWordCommand),
                appendRegexLabel: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleRegexCommand),
                validation: (value) => {
                    if (value.length === 0 || !this._findInput.getRegex()) {
                        return null;
                    }
                    try {
                        // use `g` and `u` which are also used by the TextModel search
                        new RegExp(value, 'gu');
                        return null;
                    }
                    catch (e) {
                        return { content: e.message };
                    }
                },
                flexibleHeight,
                flexibleWidth,
                flexibleMaxHeight: 118,
                showCommonFindToggles: true,
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this._keybindingService),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                toggleStyles: defaultStyles_1.defaultToggleStyles
            }, this._contextKeyService));
            this._findInput.setRegex(!!this._state.isRegex);
            this._findInput.setCaseSensitive(!!this._state.matchCase);
            this._findInput.setWholeWords(!!this._state.wholeWord);
            this._register(this._findInput.onKeyDown((e) => this._onFindInputKeyDown(e)));
            this._register(this._findInput.inputBox.onDidChange(() => {
                if (this._ignoreChangeEvent) {
                    return;
                }
                this._state.change({ searchString: this._findInput.getValue() }, true);
            }));
            this._register(this._findInput.onDidOptionChange(() => {
                this._state.change({
                    isRegex: this._findInput.getRegex(),
                    wholeWord: this._findInput.getWholeWords(),
                    matchCase: this._findInput.getCaseSensitive()
                }, true);
            }));
            this._register(this._findInput.onCaseSensitiveKeyDown((e) => {
                if (e.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                    if (this._isReplaceVisible) {
                        this._replaceInput.focus();
                        e.preventDefault();
                    }
                }
            }));
            this._register(this._findInput.onRegexKeyDown((e) => {
                if (e.equals(2 /* KeyCode.Tab */)) {
                    if (this._isReplaceVisible) {
                        this._replaceInput.focusOnPreserve();
                        e.preventDefault();
                    }
                }
            }));
            this._register(this._findInput.inputBox.onDidHeightChange((e) => {
                if (this._tryUpdateHeight()) {
                    this._showViewZone();
                }
            }));
            if (platform.isLinux) {
                this._register(this._findInput.onMouseDown((e) => this._onFindInputMouseDown(e)));
            }
            this._matchesCount = document.createElement('div');
            this._matchesCount.className = 'matchesCount';
            this._updateMatchesCount();
            // Create a scoped hover delegate for all find related buttons
            const hoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            // Previous button
            this._prevBtn = this._register(new SimpleButton({
                label: NLS_PREVIOUS_MATCH_BTN_LABEL + this._keybindingLabelFor(findModel_1.FIND_IDS.PreviousMatchFindAction),
                icon: exports.findPreviousMatchIcon,
                hoverDelegate,
                onTrigger: () => {
                    (0, types_1.assertIsDefined)(this._codeEditor.getAction(findModel_1.FIND_IDS.PreviousMatchFindAction)).run().then(undefined, errors_1.onUnexpectedError);
                }
            }));
            // Next button
            this._nextBtn = this._register(new SimpleButton({
                label: NLS_NEXT_MATCH_BTN_LABEL + this._keybindingLabelFor(findModel_1.FIND_IDS.NextMatchFindAction),
                icon: exports.findNextMatchIcon,
                hoverDelegate,
                onTrigger: () => {
                    (0, types_1.assertIsDefined)(this._codeEditor.getAction(findModel_1.FIND_IDS.NextMatchFindAction)).run().then(undefined, errors_1.onUnexpectedError);
                }
            }));
            const findPart = document.createElement('div');
            findPart.className = 'find-part';
            findPart.appendChild(this._findInput.domNode);
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'find-actions';
            findPart.appendChild(actionsContainer);
            actionsContainer.appendChild(this._matchesCount);
            actionsContainer.appendChild(this._prevBtn.domNode);
            actionsContainer.appendChild(this._nextBtn.domNode);
            // Toggle selection button
            this._toggleSelectionFind = this._register(new toggle_1.Toggle({
                icon: findSelectionIcon,
                title: NLS_TOGGLE_SELECTION_FIND_TITLE + this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleSearchScopeCommand),
                isChecked: false,
                hoverDelegate: hoverDelegate,
                inputActiveOptionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBackground),
                inputActiveOptionBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionForeground),
            }));
            this._register(this._toggleSelectionFind.onChange(() => {
                if (this._toggleSelectionFind.checked) {
                    if (this._codeEditor.hasModel()) {
                        let selections = this._codeEditor.getSelections();
                        selections = selections.map(selection => {
                            if (selection.endColumn === 1 && selection.endLineNumber > selection.startLineNumber) {
                                selection = selection.setEndPosition(selection.endLineNumber - 1, this._codeEditor.getModel().getLineMaxColumn(selection.endLineNumber - 1));
                            }
                            if (!selection.isEmpty()) {
                                return selection;
                            }
                            return null;
                        }).filter((element) => !!element);
                        if (selections.length) {
                            this._state.change({ searchScope: selections }, true);
                        }
                    }
                }
                else {
                    this._state.change({ searchScope: null }, true);
                }
            }));
            actionsContainer.appendChild(this._toggleSelectionFind.domNode);
            // Close button
            this._closeBtn = this._register(new SimpleButton({
                label: NLS_CLOSE_BTN_LABEL + this._keybindingLabelFor(findModel_1.FIND_IDS.CloseFindWidgetCommand),
                icon: iconRegistry_1.widgetClose,
                hoverDelegate,
                onTrigger: () => {
                    this._state.change({ isRevealed: false, searchScope: null }, false);
                },
                onKeyDown: (e) => {
                    if (e.equals(2 /* KeyCode.Tab */)) {
                        if (this._isReplaceVisible) {
                            if (this._replaceBtn.isEnabled()) {
                                this._replaceBtn.focus();
                            }
                            else {
                                this._codeEditor.focus();
                            }
                            e.preventDefault();
                        }
                    }
                }
            }));
            // Replace input
            this._replaceInput = this._register(new contextScopedHistoryWidget_1.ContextScopedReplaceInput(null, undefined, {
                label: NLS_REPLACE_INPUT_LABEL,
                placeholder: NLS_REPLACE_INPUT_PLACEHOLDER,
                appendPreserveCaseLabel: this._keybindingLabelFor(findModel_1.FIND_IDS.TogglePreserveCaseCommand),
                history: [],
                flexibleHeight,
                flexibleWidth,
                flexibleMaxHeight: 118,
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this._keybindingService),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                toggleStyles: defaultStyles_1.defaultToggleStyles
            }, this._contextKeyService, true));
            this._replaceInput.setPreserveCase(!!this._state.preserveCase);
            this._register(this._replaceInput.onKeyDown((e) => this._onReplaceInputKeyDown(e)));
            this._register(this._replaceInput.inputBox.onDidChange(() => {
                this._state.change({ replaceString: this._replaceInput.inputBox.value }, false);
            }));
            this._register(this._replaceInput.inputBox.onDidHeightChange((e) => {
                if (this._isReplaceVisible && this._tryUpdateHeight()) {
                    this._showViewZone();
                }
            }));
            this._register(this._replaceInput.onDidOptionChange(() => {
                this._state.change({
                    preserveCase: this._replaceInput.getPreserveCase()
                }, true);
            }));
            this._register(this._replaceInput.onPreserveCaseKeyDown((e) => {
                if (e.equals(2 /* KeyCode.Tab */)) {
                    if (this._prevBtn.isEnabled()) {
                        this._prevBtn.focus();
                    }
                    else if (this._nextBtn.isEnabled()) {
                        this._nextBtn.focus();
                    }
                    else if (this._toggleSelectionFind.enabled) {
                        this._toggleSelectionFind.focus();
                    }
                    else if (this._closeBtn.isEnabled()) {
                        this._closeBtn.focus();
                    }
                    e.preventDefault();
                }
            }));
            // Create scoped hover delegate for replace actions
            const replaceHoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            // Replace one button
            this._replaceBtn = this._register(new SimpleButton({
                label: NLS_REPLACE_BTN_LABEL + this._keybindingLabelFor(findModel_1.FIND_IDS.ReplaceOneAction),
                icon: exports.findReplaceIcon,
                hoverDelegate: replaceHoverDelegate,
                onTrigger: () => {
                    this._controller.replace();
                },
                onKeyDown: (e) => {
                    if (e.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                        this._closeBtn.focus();
                        e.preventDefault();
                    }
                }
            }));
            // Replace all button
            this._replaceAllBtn = this._register(new SimpleButton({
                label: NLS_REPLACE_ALL_BTN_LABEL + this._keybindingLabelFor(findModel_1.FIND_IDS.ReplaceAllAction),
                icon: exports.findReplaceAllIcon,
                hoverDelegate: replaceHoverDelegate,
                onTrigger: () => {
                    this._controller.replaceAll();
                }
            }));
            const replacePart = document.createElement('div');
            replacePart.className = 'replace-part';
            replacePart.appendChild(this._replaceInput.domNode);
            const replaceActionsContainer = document.createElement('div');
            replaceActionsContainer.className = 'replace-actions';
            replacePart.appendChild(replaceActionsContainer);
            replaceActionsContainer.appendChild(this._replaceBtn.domNode);
            replaceActionsContainer.appendChild(this._replaceAllBtn.domNode);
            // Toggle replace button
            this._toggleReplaceBtn = this._register(new SimpleButton({
                label: NLS_TOGGLE_REPLACE_MODE_BTN_LABEL,
                className: 'codicon toggle left',
                onTrigger: () => {
                    this._state.change({ isReplaceRevealed: !this._isReplaceVisible }, false);
                    if (this._isReplaceVisible) {
                        this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                        this._replaceInput.inputBox.layout();
                    }
                    this._showViewZone();
                }
            }));
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            // Widget
            this._domNode = document.createElement('div');
            this._domNode.className = 'editor-widget find-widget';
            this._domNode.setAttribute('aria-hidden', 'true');
            this._domNode.ariaLabel = NLS_FIND_DIALOG_LABEL;
            this._domNode.role = 'dialog';
            // We need to set this explicitly, otherwise on IE11, the width inheritence of flex doesn't work.
            this._domNode.style.width = `${FIND_WIDGET_INITIAL_WIDTH}px`;
            this._domNode.appendChild(this._toggleReplaceBtn.domNode);
            this._domNode.appendChild(findPart);
            this._domNode.appendChild(this._closeBtn.domNode);
            this._domNode.appendChild(replacePart);
            this._resizeSash = this._register(new sash_1.Sash(this._domNode, this, { orientation: 0 /* Orientation.VERTICAL */, size: 2 }));
            this._resized = false;
            let originalWidth = FIND_WIDGET_INITIAL_WIDTH;
            this._register(this._resizeSash.onDidStart(() => {
                originalWidth = dom.getTotalWidth(this._domNode);
            }));
            this._register(this._resizeSash.onDidChange((evt) => {
                this._resized = true;
                const width = originalWidth + evt.startX - evt.currentX;
                if (width < FIND_WIDGET_INITIAL_WIDTH) {
                    // narrow down the find widget should be handled by CSS.
                    return;
                }
                const maxWidth = parseFloat(dom.getComputedStyle(this._domNode).maxWidth) || 0;
                if (width > maxWidth) {
                    return;
                }
                this._domNode.style.width = `${width}px`;
                if (this._isReplaceVisible) {
                    this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                }
                this._findInput.inputBox.layout();
                this._tryUpdateHeight();
            }));
            this._register(this._resizeSash.onDidReset(() => {
                // users double click on the sash
                const currentWidth = dom.getTotalWidth(this._domNode);
                if (currentWidth < FIND_WIDGET_INITIAL_WIDTH) {
                    // The editor is narrow and the width of the find widget is controlled fully by CSS.
                    return;
                }
                let width = FIND_WIDGET_INITIAL_WIDTH;
                if (!this._resized || currentWidth === FIND_WIDGET_INITIAL_WIDTH) {
                    // 1. never resized before, double click should maximizes it
                    // 2. users resized it already but its width is the same as default
                    const layoutInfo = this._codeEditor.getLayoutInfo();
                    width = layoutInfo.width - 28 - layoutInfo.minimap.minimapWidth - 15;
                    this._resized = true;
                }
                else {
                    /**
                     * no op, the find widget should be shrinked to its default size.
                     */
                }
                this._domNode.style.width = `${width}px`;
                if (this._isReplaceVisible) {
                    this._replaceInput.width = dom.getTotalWidth(this._findInput.domNode);
                }
                this._findInput.inputBox.layout();
            }));
        }
        updateAccessibilitySupport() {
            const value = this._codeEditor.getOption(2 /* EditorOption.accessibilitySupport */);
            this._findInput.setFocusInputOnOptionClick(value !== 2 /* AccessibilitySupport.Enabled */);
        }
        getViewState() {
            let widgetViewZoneVisible = false;
            if (this._viewZone && this._viewZoneId) {
                widgetViewZoneVisible = this._viewZone.heightInPx > this._codeEditor.getScrollTop();
            }
            return {
                widgetViewZoneVisible,
                scrollTop: this._codeEditor.getScrollTop()
            };
        }
        setViewState(state) {
            if (!state) {
                return;
            }
            if (state.widgetViewZoneVisible) {
                // we should add the view zone
                this._layoutViewZone(state.scrollTop);
            }
        }
    }
    exports.FindWidget = FindWidget;
    class SimpleButton extends widget_1.Widget {
        constructor(opts) {
            super();
            this._opts = opts;
            let className = 'button';
            if (this._opts.className) {
                className = className + ' ' + this._opts.className;
            }
            if (this._opts.icon) {
                className = className + ' ' + themables_1.ThemeIcon.asClassName(this._opts.icon);
            }
            this._domNode = document.createElement('div');
            this._domNode.tabIndex = 0;
            this._domNode.className = className;
            this._domNode.setAttribute('role', 'button');
            this._domNode.setAttribute('aria-label', this._opts.label);
            this._register((0, updatableHoverWidget_1.setupCustomHover)(opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), this._domNode, this._opts.label));
            this.onclick(this._domNode, (e) => {
                this._opts.onTrigger();
                e.preventDefault();
            });
            this.onkeydown(this._domNode, (e) => {
                if (e.equals(10 /* KeyCode.Space */) || e.equals(3 /* KeyCode.Enter */)) {
                    this._opts.onTrigger();
                    e.preventDefault();
                    return;
                }
                this._opts.onKeyDown?.(e);
            });
        }
        get domNode() {
            return this._domNode;
        }
        isEnabled() {
            return (this._domNode.tabIndex >= 0);
        }
        focus() {
            this._domNode.focus();
        }
        setEnabled(enabled) {
            this._domNode.classList.toggle('disabled', !enabled);
            this._domNode.setAttribute('aria-disabled', String(!enabled));
            this._domNode.tabIndex = enabled ? 0 : -1;
        }
        setExpanded(expanded) {
            this._domNode.setAttribute('aria-expanded', String(!!expanded));
            if (expanded) {
                this._domNode.classList.remove(...themables_1.ThemeIcon.asClassNameArray(findCollapsedIcon));
                this._domNode.classList.add(...themables_1.ThemeIcon.asClassNameArray(findExpandedIcon));
            }
            else {
                this._domNode.classList.remove(...themables_1.ThemeIcon.asClassNameArray(findExpandedIcon));
                this._domNode.classList.add(...themables_1.ThemeIcon.asClassNameArray(findCollapsedIcon));
            }
        }
    }
    exports.SimpleButton = SimpleButton;
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const findMatchHighlightBorder = theme.getColor(colorRegistry_1.editorFindMatchHighlightBorder);
        if (findMatchHighlightBorder) {
            collector.addRule(`.monaco-editor .findMatch { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dotted' : 'solid'} ${findMatchHighlightBorder}; box-sizing: border-box; }`);
        }
        const findRangeHighlightBorder = theme.getColor(colorRegistry_1.editorFindRangeHighlightBorder);
        if (findRangeHighlightBorder) {
            collector.addRule(`.monaco-editor .findScope { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dashed' : 'solid'} ${findRangeHighlightBorder}; }`);
        }
        const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
        if (hcBorder) {
            collector.addRule(`.monaco-editor .find-widget { border: 1px solid ${hcBorder}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZmluZC9icm93c2VyL2ZpbmRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOENoRyxNQUFNLGlCQUFpQixHQUFHLElBQUEsMkJBQVksRUFBQyxnQkFBZ0IsRUFBRSxrQkFBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLDJEQUEyRCxDQUFDLENBQUMsQ0FBQztJQUM1SyxNQUFNLGlCQUFpQixHQUFHLElBQUEsMkJBQVksRUFBQyxnQkFBZ0IsRUFBRSxrQkFBTyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLDREQUE0RCxDQUFDLENBQUMsQ0FBQztJQUNoTCxNQUFNLGdCQUFnQixHQUFHLElBQUEsMkJBQVksRUFBQyxlQUFlLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLENBQUM7SUFFOUosUUFBQSxlQUFlLEdBQUcsSUFBQSwyQkFBWSxFQUFDLGNBQWMsRUFBRSxrQkFBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLGlEQUFpRCxDQUFDLENBQUMsQ0FBQztJQUNwSixRQUFBLGtCQUFrQixHQUFHLElBQUEsMkJBQVksRUFBQyxrQkFBa0IsRUFBRSxrQkFBTyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLHFEQUFxRCxDQUFDLENBQUMsQ0FBQztJQUNySyxRQUFBLHFCQUFxQixHQUFHLElBQUEsMkJBQVksRUFBQyxxQkFBcUIsRUFBRSxrQkFBTyxDQUFDLE9BQU8s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