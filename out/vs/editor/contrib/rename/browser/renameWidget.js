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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/browser/config/domFontInfo", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./renameWidget"], function (require, exports, dom, aria, iconLabels_1, listWidget_1, arrays, async_1, cancellation_1, codicons_1, event_1, lifecycle_1, stopwatch_1, types_1, domFontInfo_1, position_1, range_1, languages_1, nls_1, contextkey_1, keybinding_1, log_1, defaultStyles_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameWidget = exports.CONTEXT_RENAME_INPUT_FOCUSED = exports.CONTEXT_RENAME_INPUT_VISIBLE = void 0;
    /** for debugging */
    const _sticky = false;
    exports.CONTEXT_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('renameInputVisible', false, (0, nls_1.localize)('renameInputVisible', "Whether the rename input widget is visible"));
    exports.CONTEXT_RENAME_INPUT_FOCUSED = new contextkey_1.RawContextKey('renameInputFocused', false, (0, nls_1.localize)('renameInputFocused', "Whether the rename input widget is focused"));
    let RenameWidget = class RenameWidget {
        constructor(_editor, _acceptKeybindings, _themeService, _keybindingService, contextKeyService, _logService) {
            this._editor = _editor;
            this._acceptKeybindings = _acceptKeybindings;
            this._themeService = _themeService;
            this._keybindingService = _keybindingService;
            this._logService = _logService;
            // implement IContentWidget
            this.allowEditorOverflow = true;
            this._disposables = new lifecycle_1.DisposableStore();
            this._visibleContextKey = exports.CONTEXT_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._isEditingRenameCandidate = false;
            this._beforeFirstInputFieldEditSW = new stopwatch_1.StopWatch();
            this._input = new RenameInput();
            this._disposables.add(this._input);
            this._editor.addContentWidget(this);
            this._disposables.add(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._updateFont();
                }
            }));
            this._disposables.add(_themeService.onDidColorThemeChange(this._updateStyles, this));
        }
        dispose() {
            this._disposables.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return '__renameInputWidget';
        }
        getDomNode() {
            if (!this._domNode) {
                this._domNode = document.createElement('div');
                this._domNode.className = 'monaco-editor rename-box';
                this._domNode.appendChild(this._input.domNode);
                this._renameCandidateListView = this._disposables.add(new RenameCandidateListView(this._domNode, {
                    fontInfo: this._editor.getOption(50 /* EditorOption.fontInfo */),
                    onFocusChange: (newSymbolName) => {
                        this._input.domNode.value = newSymbolName;
                        this._isEditingRenameCandidate = false; // @ulugbekna: reset
                    },
                    onSelectionChange: () => {
                        this._isEditingRenameCandidate = false; // @ulugbekna: because user picked a rename suggestion
                        this.acceptInput(false); // we don't allow preview with mouse click for now
                    }
                }));
                this._disposables.add(this._input.onDidChange(() => {
                    if (this._renameCandidateListView?.focusedCandidate !== undefined) {
                        this._isEditingRenameCandidate = true;
                    }
                    this._timeBeforeFirstInputFieldEdit ??= this._beforeFirstInputFieldEditSW.elapsed();
                    if (this._renameCandidateProvidersCts?.token.isCancellationRequested === false) {
                        this._renameCandidateProvidersCts.cancel();
                    }
                    this._renameCandidateListView?.clearFocus();
                }));
                this._label = document.createElement('div');
                this._label.className = 'rename-label';
                this._domNode.appendChild(this._label);
                this._updateFont();
                this._updateStyles(this._themeService.getColorTheme());
            }
            return this._domNode;
        }
        _updateStyles(theme) {
            if (!this._domNode) {
                return;
            }
            const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
            const widgetBorderColor = theme.getColor(colorRegistry_1.widgetBorder);
            this._domNode.style.backgroundColor = String(theme.getColor(colorRegistry_1.editorWidgetBackground) ?? '');
            this._domNode.style.boxShadow = widgetShadowColor ? ` 0 0 8px 2px ${widgetShadowColor}` : '';
            this._domNode.style.border = widgetBorderColor ? `1px solid ${widgetBorderColor}` : '';
            this._domNode.style.color = String(theme.getColor(colorRegistry_1.inputForeground) ?? '');
            this._input.domNode.style.backgroundColor = String(theme.getColor(colorRegistry_1.inputBackground) ?? '');
            // this._input.style.color = String(theme.getColor(inputForeground) ?? '');
            const border = theme.getColor(colorRegistry_1.inputBorder);
            this._input.domNode.style.borderWidth = border ? '1px' : '0px';
            this._input.domNode.style.borderStyle = border ? 'solid' : 'none';
            this._input.domNode.style.borderColor = border?.toString() ?? 'none';
        }
        _updateFont() {
            if (this._domNode === undefined) {
                return;
            }
            (0, types_1.assertType)(this._label !== undefined, 'RenameWidget#_updateFont: _label must not be undefined given _domNode is defined');
            this._editor.applyFontInfo(this._input.domNode);
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            this._label.style.fontSize = `${this._computeLabelFontSize(fontInfo.fontSize)}px`;
        }
        _computeLabelFontSize(editorFontSize) {
            return editorFontSize * 0.8;
        }
        getPosition() {
            if (!this._visible) {
                return null;
            }
            if (!this._editor.hasModel() || // @ulugbekna: shouldn't happen
                !this._editor.getDomNode() // @ulugbekna: can happen during tests based on suggestWidget's similar predicate check
            ) {
                return null;
            }
            const bodyBox = dom.getClientArea(this.getDomNode().ownerDocument.body);
            const editorBox = dom.getDomNodePagePosition(this._editor.getDomNode());
            const cursorBoxTop = this._getTopForPosition();
            this._nPxAvailableAbove = cursorBoxTop + editorBox.top;
            this._nPxAvailableBelow = bodyBox.height - this._nPxAvailableAbove;
            const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            const { totalHeight: candidateViewHeight } = RenameCandidateView.getLayoutInfo({ lineHeight });
            const positionPreference = this._nPxAvailableBelow > candidateViewHeight * 6 /* approximate # of candidates to fit in (inclusive of rename input box & rename label) */
                ? [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */]
                : [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */];
            return {
                position: this._position,
                preference: positionPreference,
            };
        }
        beforeRender() {
            const [accept, preview] = this._acceptKeybindings;
            this._label.innerText = (0, nls_1.localize)({ key: 'label', comment: ['placeholders are keybindings, e.g "F2 to Rename, Shift+F2 to Preview"'] }, "{0} to Rename, {1} to Preview", this._keybindingService.lookupKeybinding(accept)?.getLabel(), this._keybindingService.lookupKeybinding(preview)?.getLabel());
            this._domNode.style.minWidth = `200px`; // to prevent from widening when candidates come in
            return null;
        }
        afterRender(position) {
            this._trace('invoking afterRender, position: ', position ? 'not null' : 'null');
            if (position === null) {
                // cancel rename when input widget isn't rendered anymore
                this.cancelInput(true, 'afterRender (because position is null)');
                return;
            }
            if (!this._editor.hasModel() || // shouldn't happen
                !this._editor.getDomNode() // can happen during tests based on suggestWidget's similar predicate check
            ) {
                return;
            }
            (0, types_1.assertType)(this._renameCandidateListView);
            (0, types_1.assertType)(this._nPxAvailableAbove !== undefined);
            (0, types_1.assertType)(this._nPxAvailableBelow !== undefined);
            const inputBoxHeight = dom.getTotalHeight(this._input.domNode);
            const labelHeight = dom.getTotalHeight(this._label);
            let totalHeightAvailable;
            if (position === 2 /* ContentWidgetPositionPreference.BELOW */) {
                totalHeightAvailable = this._nPxAvailableBelow;
            }
            else {
                totalHeightAvailable = this._nPxAvailableAbove;
            }
            this._renameCandidateListView.layout({
                height: totalHeightAvailable - labelHeight - inputBoxHeight,
                width: dom.getTotalWidth(this._input.domNode),
            });
        }
        acceptInput(wantsPreview) {
            this._trace(`invoking acceptInput`);
            this._currentAcceptInput?.(wantsPreview);
        }
        cancelInput(focusEditor, caller) {
            this._trace(`invoking cancelInput, caller: ${caller}, _currentCancelInput: ${this._currentAcceptInput ? 'not undefined' : 'undefined'}`);
            this._currentCancelInput?.(focusEditor);
        }
        focusNextRenameSuggestion() {
            if (!this._renameCandidateListView?.focusNext()) {
                this._input.domNode.value = this._currentName;
            }
        }
        focusPreviousRenameSuggestion() {
            if (!this._renameCandidateListView?.focusPrevious()) {
                this._input.domNode.value = this._currentName;
            }
        }
        getInput(where, currentName, supportPreview, requestRenameCandidates, cts) {
            const { start: selectionStart, end: selectionEnd } = this._getSelection(where, currentName);
            this._renameCandidateProvidersCts = new cancellation_1.CancellationTokenSource();
            const candidates = requestRenameCandidates(this._renameCandidateProvidersCts.token);
            this._updateRenameCandidates(candidates, currentName, cts.token);
            this._isEditingRenameCandidate = false;
            this._domNode.classList.toggle('preview', supportPreview);
            this._position = new position_1.Position(where.startLineNumber, where.startColumn);
            this._currentName = currentName;
            this._input.domNode.value = currentName;
            this._input.domNode.setAttribute('selectionStart', selectionStart.toString());
            this._input.domNode.setAttribute('selectionEnd', selectionEnd.toString());
            this._input.domNode.size = Math.max((where.endColumn - where.startColumn) * 1.1, 20); // determines width
            this._beforeFirstInputFieldEditSW.reset();
            const disposeOnDone = new lifecycle_1.DisposableStore();
            disposeOnDone.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true))); // @ulugbekna: this may result in `this.cancelInput` being called twice, but it should be safe since we set it to undefined after 1st call
            disposeOnDone.add((0, lifecycle_1.toDisposable)(() => {
                if (this._renameCandidateProvidersCts !== undefined) {
                    this._renameCandidateProvidersCts.dispose(true);
                    this._renameCandidateProvidersCts = undefined;
                }
            }));
            const inputResult = new async_1.DeferredPromise();
            inputResult.p.finally(() => {
                disposeOnDone.dispose();
                this._hide();
            });
            this._currentCancelInput = (focusEditor) => {
                this._trace('invoking _currentCancelInput');
                this._currentAcceptInput = undefined;
                this._currentCancelInput = undefined;
                this._renameCandidateListView?.clearCandidates();
                inputResult.complete(focusEditor);
                return true;
            };
            this._currentAcceptInput = (wantsPreview) => {
                this._trace('invoking _currentAcceptInput');
                (0, types_1.assertType)(this._renameCandidateListView !== undefined);
                const nRenameSuggestions = this._renameCandidateListView.nCandidates;
                let newName;
                let source;
                const focusedCandidate = this._renameCandidateListView.focusedCandidate;
                if (focusedCandidate !== undefined) {
                    this._trace('using new name from renameSuggestion');
                    newName = focusedCandidate;
                    source = { k: 'renameSuggestion' };
                }
                else {
                    this._trace('using new name from inputField');
                    newName = this._input.domNode.value;
                    source = this._isEditingRenameCandidate ? { k: 'userEditedRenameSuggestion' } : { k: 'inputField' };
                }
                if (newName === currentName || newName.trim().length === 0 /* is just whitespace */) {
                    this.cancelInput(true, '_currentAcceptInput (because newName === value || newName.trim().length === 0)');
                    return;
                }
                this._currentAcceptInput = undefined;
                this._currentCancelInput = undefined;
                this._renameCandidateListView.clearCandidates();
                inputResult.complete({
                    newName,
                    wantsPreview: supportPreview && wantsPreview,
                    stats: {
                        source,
                        nRenameSuggestions,
                        timeBeforeFirstInputFieldEdit: this._timeBeforeFirstInputFieldEdit,
                    }
                });
            };
            disposeOnDone.add(cts.token.onCancellationRequested(() => this.cancelInput(true, 'cts.token.onCancellationRequested')));
            if (!_sticky) {
                disposeOnDone.add(this._editor.onDidBlurEditorWidget(() => this.cancelInput(!this._domNode?.ownerDocument.hasFocus(), 'editor.onDidBlurEditorWidget')));
            }
            this._show();
            return inputResult.p;
        }
        /**
         * This allows selecting only part of the symbol name in the input field based on the selection in the editor
         */
        _getSelection(where, currentName) {
            (0, types_1.assertType)(this._editor.hasModel());
            const selection = this._editor.getSelection();
            let start = 0;
            let end = currentName.length;
            if (!range_1.Range.isEmpty(selection) && !range_1.Range.spansMultipleLines(selection) && range_1.Range.containsRange(where, selection)) {
                start = Math.max(0, selection.startColumn - where.startColumn);
                end = Math.min(where.endColumn, selection.endColumn) - where.startColumn;
            }
            return { start, end };
        }
        _show() {
            this._trace('invoking _show');
            this._editor.revealLineInCenterIfOutsideViewport(this._position.lineNumber, 0 /* ScrollType.Smooth */);
            this._visible = true;
            this._visibleContextKey.set(true);
            this._editor.layoutContentWidget(this);
            // TODO@ulugbekna: could this be simply run in `afterRender`?
            setTimeout(() => {
                this._input.domNode.focus();
                this._input.domNode.setSelectionRange(parseInt(this._input.domNode.getAttribute('selectionStart')), parseInt(this._input.domNode.getAttribute('selectionEnd')));
            }, 100);
        }
        async _updateRenameCandidates(candidates, currentName, token) {
            const trace = (...args) => this._trace('_updateRenameCandidates', ...args);
            trace('start');
            const namesListResults = await (0, async_1.raceCancellation)(Promise.allSettled(candidates), token);
            if (namesListResults === undefined) {
                trace('returning early - received updateRenameCandidates results - undefined');
                return;
            }
            const newNames = namesListResults.flatMap(namesListResult => namesListResult.status === 'fulfilled' && (0, types_1.isDefined)(namesListResult.value)
                ? namesListResult.value
                : []);
            trace(`received updateRenameCandidates results - total (unfiltered) ${newNames.length} candidates.`);
            // deduplicate and filter out the current value
            const distinctNames = arrays.distinct(newNames, v => v.newSymbolName);
            trace(`distinct candidates - ${distinctNames.length} candidates.`);
            const validDistinctNames = distinctNames.filter(({ newSymbolName }) => newSymbolName.trim().length > 0 && newSymbolName !== this._input.domNode.value && newSymbolName !== currentName);
            trace(`valid distinct candidates - ${newNames.length} candidates.`);
            if (validDistinctNames.length < 1) {
                trace('returning early - no valid distinct candidates');
                return;
            }
            // show the candidates
            trace('setting candidates');
            this._renameCandidateListView.setCandidates(validDistinctNames);
            // ask editor to re-layout given that the widget is now of a different size after rendering rename candidates
            trace('asking editor to re-layout');
            this._editor.layoutContentWidget(this);
        }
        _hide() {
            this._trace('invoked _hide');
            this._visible = false;
            this._visibleContextKey.reset();
            this._editor.layoutContentWidget(this);
        }
        _getTopForPosition() {
            const visibleRanges = this._editor.getVisibleRanges();
            let firstLineInViewport;
            if (visibleRanges.length > 0) {
                firstLineInViewport = visibleRanges[0].startLineNumber;
            }
            else {
                this._logService.warn('RenameWidget#_getTopForPosition: this should not happen - visibleRanges is empty');
                firstLineInViewport = Math.max(1, this._position.lineNumber - 5); // @ulugbekna: fallback to current line minus 5
            }
            return this._editor.getTopForLineNumber(this._position.lineNumber) - this._editor.getTopForLineNumber(firstLineInViewport);
        }
        _trace(...args) {
            this._logService.trace('RenameWidget', ...args);
        }
    };
    exports.RenameWidget = RenameWidget;
    exports.RenameWidget = RenameWidget = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, log_1.ILogService)
    ], RenameWidget);
    class RenameCandidateListView {
        // FIXME@ulugbekna: rewrite using event emitters
        constructor(parent, opts) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._availableHeight = 0;
            this._minimumWidth = 0;
            this._lineHeight = opts.fontInfo.lineHeight;
            this._typicalHalfwidthCharacterWidth = opts.fontInfo.typicalHalfwidthCharacterWidth;
            this._listContainer = document.createElement('div');
            parent.appendChild(this._listContainer);
            this._listWidget = RenameCandidateListView._createListWidget(this._listContainer, this._candidateViewHeight, opts.fontInfo);
            this._listWidget.onDidChangeFocus(e => {
                if (e.elements.length === 1) {
                    opts.onFocusChange(e.elements[0].newSymbolName);
                }
            }, this._disposables);
            this._listWidget.onDidChangeSelection(e => {
                if (e.elements.length === 1) {
                    opts.onSelectionChange();
                }
            }, this._disposables);
            this._disposables.add(this._listWidget.onDidBlur(e => {
                this._listWidget.setFocus([]);
            }));
            this._listWidget.style((0, defaultStyles_1.getListStyles)({
                listInactiveFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                listInactiveFocusBackground: colorRegistry_1.quickInputListFocusBackground,
            }));
        }
        dispose() {
            this._listWidget.dispose();
            this._disposables.dispose();
        }
        // height - max height allowed by parent element
        layout({ height, width }) {
            this._availableHeight = height;
            this._minimumWidth = width;
        }
        setCandidates(candidates) {
            // insert candidates into list widget
            this._listWidget.splice(0, 0, candidates);
            // adjust list widget layout
            const height = this._pickListHeight(candidates.length);
            const width = this._pickListWidth(candidates);
            this._listWidget.layout(height, width);
            // adjust list container layout
            this._listContainer.style.height = `${height}px`;
            this._listContainer.style.width = `${width}px`;
            aria.status((0, nls_1.localize)('renameSuggestionsReceivedAria', "Received {0} rename suggestions", candidates.length));
        }
        clearCandidates() {
            this._listContainer.style.height = '0px';
            this._listContainer.style.width = '0px';
            this._listWidget.splice(0, this._listWidget.length, []);
        }
        get nCandidates() {
            return this._listWidget.length;
        }
        get focusedCandidate() {
            if (this._listWidget.length === 0) {
                return;
            }
            const selectedElement = this._listWidget.getSelectedElements()[0];
            if (selectedElement !== undefined) {
                return selectedElement.newSymbolName;
            }
            const focusedElement = this._listWidget.getFocusedElements()[0];
            if (focusedElement !== undefined) {
                return focusedElement.newSymbolName;
            }
            return;
        }
        focusNext() {
            if (this._listWidget.length === 0) {
                return false;
            }
            const focusedIxs = this._listWidget.getFocus();
            if (focusedIxs.length === 0) {
                this._listWidget.focusFirst();
                return true;
            }
            else {
                if (focusedIxs[0] === this._listWidget.length - 1) {
                    this._listWidget.setFocus([]);
                    return false;
                }
                else {
                    this._listWidget.focusNext();
                    return true;
                }
            }
        }
        /**
         * @returns true if focus is moved to previous element
         */
        focusPrevious() {
            if (this._listWidget.length === 0) {
                return false;
            }
            const focusedIxs = this._listWidget.getFocus();
            if (focusedIxs.length === 0) {
                this._listWidget.focusLast();
                return true;
            }
            else {
                if (focusedIxs[0] === 0) {
                    this._listWidget.setFocus([]);
                    return false;
                }
                else {
                    this._listWidget.focusPrevious();
                    return true;
                }
            }
        }
        clearFocus() {
            this._listWidget.setFocus([]);
        }
        get _candidateViewHeight() {
            const { totalHeight } = RenameCandidateView.getLayoutInfo({ lineHeight: this._lineHeight });
            return totalHeight;
        }
        _pickListHeight(nCandidates) {
            const heightToFitAllCandidates = this._candidateViewHeight * nCandidates;
            const MAX_N_CANDIDATES = 7; // @ulugbekna: max # of candidates we want to show at once
            const height = Math.min(heightToFitAllCandidates, this._availableHeight, this._candidateViewHeight * MAX_N_CANDIDATES);
            return height;
        }
        _pickListWidth(candidates) {
            const longestCandidateWidth = Math.ceil(Math.max(...candidates.map(c => c.newSymbolName.length)) * this._typicalHalfwidthCharacterWidth);
            const width = Math.max(this._minimumWidth, 4 /* padding */ + 16 /* sparkle icon */ + 5 /* margin-left */ + longestCandidateWidth + 10 /* (possibly visible) scrollbar width */ // TODO@ulugbekna: approximate calc - clean this up
            );
            return width;
        }
        static _createListWidget(container, candidateViewHeight, fontInfo) {
            const virtualDelegate = new class {
                getTemplateId(element) {
                    return 'candidate';
                }
                getHeight(element) {
                    return candidateViewHeight;
                }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'candidate';
                }
                renderTemplate(container) {
                    return new RenameCandidateView(container, fontInfo);
                }
                renderElement(candidate, index, templateData) {
                    templateData.populate(candidate);
                }
                disposeTemplate(templateData) {
                    templateData.dispose();
                }
            };
            return new listWidget_1.List('NewSymbolNameCandidates', container, virtualDelegate, [renderer], {
                keyboardSupport: false, // @ulugbekna: because we handle keyboard events through proper commands & keybinding service, see `rename.ts`
                mouseSupport: true,
                multipleSelectionSupport: false,
            });
        }
    }
    /**
     * @remarks lazily creates the DOM node
     */
    class RenameInput {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        get domNode() {
            if (!this._domNode) {
                this._domNode = document.createElement('input');
                this._domNode.className = 'rename-input';
                this._domNode.type = 'text';
                this._domNode.setAttribute('aria-label', (0, nls_1.localize)('renameAriaLabel', "Rename input. Type new name and press Enter to commit."));
                this._disposables.add(dom.addDisposableListener(this._domNode, 'input', () => this._onDidChange.fire()));
            }
            return this._domNode;
        }
        dispose() {
            this._onDidChange.dispose();
            this._disposables.dispose();
        }
    }
    class RenameCandidateView {
        static { this._PADDING = 2; }
        constructor(parent, fontInfo) {
            this._domNode = document.createElement('div');
            this._domNode.style.display = `flex`;
            this._domNode.style.columnGap = `5px`;
            this._domNode.style.alignItems = `center`;
            this._domNode.style.height = `${fontInfo.lineHeight}px`;
            this._domNode.style.padding = `${RenameCandidateView._PADDING}px`;
            // @ulugbekna: needed to keep space when the `icon.style.display` is set to `none`
            const iconContainer = document.createElement('div');
            iconContainer.style.display = `flex`;
            iconContainer.style.alignItems = `center`;
            iconContainer.style.width = iconContainer.style.height = `${fontInfo.lineHeight * 0.8}px`;
            this._domNode.appendChild(iconContainer);
            this._icon = (0, iconLabels_1.renderIcon)(codicons_1.Codicon.sparkle);
            this._icon.style.display = `none`;
            iconContainer.appendChild(this._icon);
            this._label = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(this._label, fontInfo);
            this._domNode.appendChild(this._label);
            parent.appendChild(this._domNode);
        }
        populate(value) {
            this._updateIcon(value);
            this._updateLabel(value);
        }
        _updateIcon(value) {
            const isAIGenerated = !!value.tags?.includes(languages_1.NewSymbolNameTag.AIGenerated);
            this._icon.style.display = isAIGenerated ? 'inherit' : 'none';
        }
        _updateLabel(value) {
            this._label.innerText = value.newSymbolName;
        }
        static getLayoutInfo({ lineHeight }) {
            const totalHeight = lineHeight + RenameCandidateView._PADDING * 2 /* top & bottom padding */;
            return { totalHeight };
        }
        dispose() {
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuYW1lV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9yZW5hbWUvYnJvd3Nlci9yZW5hbWVXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMENoRyxvQkFBb0I7SUFDcEIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUVuQjtJQUdXLFFBQUEsNEJBQTRCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG9CQUFvQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDLENBQUM7SUFDckssUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztJQWtEM0ssSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBWTtRQXNDeEIsWUFDa0IsT0FBb0IsRUFDcEIsa0JBQW9DLEVBQ3RDLGFBQTZDLEVBQ3hDLGtCQUF1RCxFQUN2RCxpQkFBcUMsRUFDNUMsV0FBeUM7WUFMckMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQWtCO1lBQ3JCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFFN0MsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUExQ3ZELDJCQUEyQjtZQUNsQix3QkFBbUIsR0FBWSxJQUFJLENBQUM7WUFpQzVCLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFVckQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLG9DQUE0QixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRWpG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