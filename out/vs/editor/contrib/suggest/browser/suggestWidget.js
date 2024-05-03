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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/strings", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/contrib/suggest/browser/suggestWidgetStatus", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/base/browser/ui/resizable/resizable", "./suggest", "./suggestWidgetDetails", "./suggestWidgetRenderer", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/codicons/codiconStyles", "vs/css!./media/suggest", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, dom, listWidget_1, async_1, errors_1, event_1, lifecycle_1, numbers_1, strings, embeddedCodeEditorWidget_1, suggestWidgetStatus_1, nls, contextkey_1, instantiation_1, storage_1, colorRegistry_1, theme_1, themeService_1, resizable_1, suggest_1, suggestWidgetDetails_1, suggestWidgetRenderer_1, defaultStyles_1, aria_1) {
    "use strict";
    var SuggestWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestContentWidget = exports.SuggestWidget = exports.editorSuggestWidgetSelectedBackground = void 0;
    /**
     * Suggest widget colors
     */
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.background', { dark: colorRegistry_1.editorWidgetBackground, light: colorRegistry_1.editorWidgetBackground, hcDark: colorRegistry_1.editorWidgetBackground, hcLight: colorRegistry_1.editorWidgetBackground }, nls.localize('editorSuggestWidgetBackground', 'Background color of the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.border', { dark: colorRegistry_1.editorWidgetBorder, light: colorRegistry_1.editorWidgetBorder, hcDark: colorRegistry_1.editorWidgetBorder, hcLight: colorRegistry_1.editorWidgetBorder }, nls.localize('editorSuggestWidgetBorder', 'Border color of the suggest widget.'));
    const editorSuggestWidgetForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.foreground', { dark: colorRegistry_1.editorForeground, light: colorRegistry_1.editorForeground, hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, nls.localize('editorSuggestWidgetForeground', 'Foreground color of the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedForeground', { dark: colorRegistry_1.quickInputListFocusForeground, light: colorRegistry_1.quickInputListFocusForeground, hcDark: colorRegistry_1.quickInputListFocusForeground, hcLight: colorRegistry_1.quickInputListFocusForeground }, nls.localize('editorSuggestWidgetSelectedForeground', 'Foreground color of the selected entry in the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedIconForeground', { dark: colorRegistry_1.quickInputListFocusIconForeground, light: colorRegistry_1.quickInputListFocusIconForeground, hcDark: colorRegistry_1.quickInputListFocusIconForeground, hcLight: colorRegistry_1.quickInputListFocusIconForeground }, nls.localize('editorSuggestWidgetSelectedIconForeground', 'Icon foreground color of the selected entry in the suggest widget.'));
    exports.editorSuggestWidgetSelectedBackground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedBackground', { dark: colorRegistry_1.quickInputListFocusBackground, light: colorRegistry_1.quickInputListFocusBackground, hcDark: colorRegistry_1.quickInputListFocusBackground, hcLight: colorRegistry_1.quickInputListFocusBackground }, nls.localize('editorSuggestWidgetSelectedBackground', 'Background color of the selected entry in the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.highlightForeground', { dark: colorRegistry_1.listHighlightForeground, light: colorRegistry_1.listHighlightForeground, hcDark: colorRegistry_1.listHighlightForeground, hcLight: colorRegistry_1.listHighlightForeground }, nls.localize('editorSuggestWidgetHighlightForeground', 'Color of the match highlights in the suggest widget.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidget.focusHighlightForeground', { dark: colorRegistry_1.listFocusHighlightForeground, light: colorRegistry_1.listFocusHighlightForeground, hcDark: colorRegistry_1.listFocusHighlightForeground, hcLight: colorRegistry_1.listFocusHighlightForeground }, nls.localize('editorSuggestWidgetFocusHighlightForeground', 'Color of the match highlights in the suggest widget when an item is focused.'));
    (0, colorRegistry_1.registerColor)('editorSuggestWidgetStatus.foreground', { dark: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5), light: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5), hcDark: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5), hcLight: (0, colorRegistry_1.transparent)(editorSuggestWidgetForeground, .5) }, nls.localize('editorSuggestWidgetStatusForeground', 'Foreground color of the suggest widget status.'));
    var State;
    (function (State) {
        State[State["Hidden"] = 0] = "Hidden";
        State[State["Loading"] = 1] = "Loading";
        State[State["Empty"] = 2] = "Empty";
        State[State["Open"] = 3] = "Open";
        State[State["Frozen"] = 4] = "Frozen";
        State[State["Details"] = 5] = "Details";
    })(State || (State = {}));
    class PersistedWidgetSize {
        constructor(_service, editor) {
            this._service = _service;
            this._key = `suggestWidget.size/${editor.getEditorType()}/${editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget}`;
        }
        restore() {
            const raw = this._service.get(this._key, 0 /* StorageScope.PROFILE */) ?? '';
            try {
                const obj = JSON.parse(raw);
                if (dom.Dimension.is(obj)) {
                    return dom.Dimension.lift(obj);
                }
            }
            catch {
                // ignore
            }
            return undefined;
        }
        store(size) {
            this._service.store(this._key, JSON.stringify(size), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        reset() {
            this._service.remove(this._key, 0 /* StorageScope.PROFILE */);
        }
    }
    let SuggestWidget = class SuggestWidget {
        static { SuggestWidget_1 = this; }
        static { this.LOADING_MESSAGE = nls.localize('suggestWidget.loading', "Loading..."); }
        static { this.NO_SUGGESTIONS_MESSAGE = nls.localize('suggestWidget.noSuggestions', "No suggestions."); }
        constructor(editor, _storageService, _contextKeyService, _themeService, instantiationService) {
            this.editor = editor;
            this._storageService = _storageService;
            this._state = 0 /* State.Hidden */;
            this._isAuto = false;
            this._pendingLayout = new lifecycle_1.MutableDisposable();
            this._pendingShowDetails = new lifecycle_1.MutableDisposable();
            this._ignoreFocusEvents = false;
            this._forceRenderingAbove = false;
            this._explainMode = false;
            this._showTimeout = new async_1.TimeoutTimer();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidSelect = new event_1.PauseableEmitter();
            this._onDidFocus = new event_1.PauseableEmitter();
            this._onDidHide = new event_1.Emitter();
            this._onDidShow = new event_1.Emitter();
            this.onDidSelect = this._onDidSelect.event;
            this.onDidFocus = this._onDidFocus.event;
            this.onDidHide = this._onDidHide.event;
            this.onDidShow = this._onDidShow.event;
            this._onDetailsKeydown = new event_1.Emitter();
            this.onDetailsKeyDown = this._onDetailsKeydown.event;
            this.element = new resizable_1.ResizableHTMLElement();
            this.element.domNode.classList.add('editor-widget', 'suggest-widget');
            this._contentWidget = new SuggestContentWidget(this, editor);
            this._persistedSize = new PersistedWidgetSize(_storageService, editor);
            class ResizeState {
                constructor(persistedSize, currentSize, persistHeight = false, persistWidth = false) {
                    this.persistedSize = persistedSize;
                    this.currentSize = currentSize;
                    this.persistHeight = persistHeight;
                    this.persistWidth = persistWidth;
                }
            }
            let state;
            this._disposables.add(this.element.onDidWillResize(() => {
                this._contentWidget.lockPreference();
                state = new ResizeState(this._persistedSize.restore(), this.element.size);
            }));
            this._disposables.add(this.element.onDidResize(e => {
                this._resize(e.dimension.width, e.dimension.height);
                if (state) {
                    state.persistHeight = state.persistHeight || !!e.north || !!e.south;
                    state.persistWidth = state.persistWidth || !!e.east || !!e.west;
                }
                if (!e.done) {
                    return;
                }
                if (state) {
                    // only store width or height value that have changed and also
                    // only store changes that are above a certain threshold
                    const { itemHeight, defaultSize } = this.getLayoutInfo();
                    const threshold = Math.round(itemHeight / 2);
                    let { width, height } = this.element.size;
                    if (!state.persistHeight || Math.abs(state.currentSize.height - height) <= threshold) {
                        height = state.persistedSize?.height ?? defaultSize.height;
                    }
                    if (!state.persistWidth || Math.abs(state.currentSize.width - width) <= threshold) {
                        width = state.persistedSize?.width ?? defaultSize.width;
                    }
                    this._persistedSize.store(new dom.Dimension(width, height));
                }
                // reset working state
                this._contentWidget.unlockPreference();
                state = undefined;
            }));
            this._messageElement = dom.append(this.element.domNode, dom.$('.message'));
            this._listElement = dom.append(this.element.domNode, dom.$('.tree'));
            const details = this._disposables.add(instantiationService.createInstance(suggestWidgetDetails_1.SuggestDetailsWidget, this.editor));
            details.onDidClose(this.toggleDetails, this, this._disposables);
            this._details = new suggestWidgetDetails_1.SuggestDetailsOverlay(details, this.editor);
            const applyIconStyle = () => this.element.domNode.classList.toggle('no-icons', !this.editor.getOption(118 /* EditorOption.suggest */).showIcons);
            applyIconStyle();
            const renderer = instantiationService.createInstance(suggestWidgetRenderer_1.ItemRenderer, this.editor);
            this._disposables.add(renderer);
            this._disposables.add(renderer.onDidToggleDetails(() => this.toggleDetails()));
            this._list = new listWidget_1.List('SuggestWidget', this._listElement, {
                getHeight: (_element) => this.getLayoutInfo().itemHeight,
                getTemplateId: (_element) => 'suggestion'
            }, [renderer], {
                alwaysConsumeMouseWheel: true,
                useShadows: false,
                mouseSupport: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getRole: () => 'option',
                    getWidgetAriaLabel: () => nls.localize('suggest', "Suggest"),
                    getWidgetRole: () => 'listbox',
                    getAriaLabel: (item) => {
                        let label = item.textLabel;
                        if (typeof item.completion.label !== 'string') {
                            const { detail, description } = item.completion.label;
                            if (detail && description) {
                                label = nls.localize('label.full', '{0} {1}, {2}', label, detail, description);
                            }
                            else if (detail) {
                                label = nls.localize('label.detail', '{0} {1}', label, detail);
                            }
                            else if (description) {
                                label = nls.localize('label.desc', '{0}, {1}', label, description);
                            }
                        }
                        if (!item.isResolved || !this._isDetailsVisible()) {
                            return label;
                        }
                        const { documentation, detail } = item.completion;
                        const docs = strings.format('{0}{1}', detail || '', documentation ? (typeof documentation === 'string' ? documentation : documentation.value) : '');
                        return nls.localize('ariaCurrenttSuggestionReadDetails', "{0}, docs: {1}", label, docs);
                    },
                }
            });
            this._list.style((0, defaultStyles_1.getListStyles)({
                listInactiveFocusBackground: exports.editorSuggestWidgetSelectedBackground,
                listInactiveFocusOutline: colorRegistry_1.activeContrastBorder
            }));
            this._status = instantiationService.createInstance(suggestWidgetStatus_1.SuggestWidgetStatus, this.element.domNode, suggest_1.suggestWidgetStatusbarMenu);
            const applyStatusBarStyle = () => this.element.domNode.classList.toggle('with-status-bar', this.editor.getOption(118 /* EditorOption.suggest */).showStatusBar);
            applyStatusBarStyle();
            this._disposables.add(_themeService.onDidColorThemeChange(t => this._onThemeChange(t)));
            this._onThemeChange(_themeService.getColorTheme());
            this._disposables.add(this._list.onMouseDown(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onTap(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onDidChangeSelection(e => this._onListSelection(e)));
            this._disposables.add(this._list.onDidChangeFocus(e => this._onListFocus(e)));
            this._disposables.add(this.editor.onDidChangeCursorSelection(() => this._onCursorSelectionChanged()));
            this._disposables.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(118 /* EditorOption.suggest */)) {
                    applyStatusBarStyle();
                    applyIconStyle();
                }
                if (this._completionModel && (e.hasChanged(50 /* EditorOption.fontInfo */) || e.hasChanged(119 /* EditorOption.suggestFontSize */) || e.hasChanged(120 /* EditorOption.suggestLineHeight */))) {
                    this._list.splice(0, this._list.length, this._completionModel.items);
                }
            }));
            this._ctxSuggestWidgetVisible = suggest_1.Context.Visible.bindTo(_contextKeyService);
            this._ctxSuggestWidgetDetailsVisible = suggest_1.Context.DetailsVisible.bindTo(_contextKeyService);
            this._ctxSuggestWidgetMultipleSuggestions = suggest_1.Context.MultipleSuggestions.bindTo(_contextKeyService);
            this._ctxSuggestWidgetHasFocusedSuggestion = suggest_1.Context.HasFocusedSuggestion.bindTo(_contextKeyService);
            this._disposables.add(dom.addStandardDisposableListener(this._details.widget.domNode, 'keydown', e => {
                this._onDetailsKeydown.fire(e);
            }));
            this._disposables.add(this.editor.onMouseDown((e) => this._onEditorMouseDown(e)));
        }
        dispose() {
            this._details.widget.dispose();
            this._details.dispose();
            this._list.dispose();
            this._status.dispose();
            this._disposables.dispose();
            this._loadingTimeout?.dispose();
            this._pendingLayout.dispose();
            this._pendingShowDetails.dispose();
            this._showTimeout.dispose();
            this._contentWidget.dispose();
            this.element.dispose();
        }
        _onEditorMouseDown(mouseEvent) {
            if (this._details.widget.domNode.contains(mouseEvent.target.element)) {
                // Clicking inside details
                this._details.widget.domNode.focus();
            }
            else {
                // Clicking outside details and inside suggest
                if (this.element.domNode.contains(mouseEvent.target.element)) {
                    this.editor.focus();
                }
            }
        }
        _onCursorSelectionChanged() {
            if (this._state !== 0 /* State.Hidden */) {
                this._contentWidget.layout();
            }
        }
        _onListMouseDownOrTap(e) {
            if (typeof e.element === 'undefined' || typeof e.index === 'undefined') {
                return;
            }
            // prevent stealing browser focus from the editor
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this._select(e.element, e.index);
        }
        _onListSelection(e) {
            if (e.elements.length) {
                this._select(e.elements[0], e.indexes[0]);
            }
        }
        _select(item, index) {
            const completionModel = this._completionModel;
            if (completionModel) {
                this._onDidSelect.fire({ item, index, model: completionModel });
                this.editor.focus();
            }
        }
        _onThemeChange(theme) {
            this._details.widget.borderWidth = (0, theme_1.isHighContrast)(theme.type) ? 2 : 1;
        }
        _onListFocus(e) {
            if (this._ignoreFocusEvents) {
                return;
            }
            if (!e.elements.length) {
                if (this._currentSuggestionDetails) {
                    this._currentSuggestionDetails.cancel();
                    this._currentSuggestionDetails = undefined;
                    this._focusedItem = undefined;
                }
                this.editor.setAriaOptions({ activeDescendant: undefined });
                this._ctxSuggestWidgetHasFocusedSuggestion.set(false);
                return;
            }
            if (!this._completionModel) {
                return;
            }
            this._ctxSuggestWidgetHasFocusedSuggestion.set(true);
            const item = e.elements[0];
            const index = e.indexes[0];
            if (item !== this._focusedItem) {
                this._currentSuggestionDetails?.cancel();
                this._currentSuggestionDetails = undefined;
                this._focusedItem = item;
                this._list.reveal(index);
                this._currentSuggestionDetails = (0, async_1.createCancelablePromise)(async (token) => {
                    const loading = (0, async_1.disposableTimeout)(() => {
                        if (this._isDetailsVisible()) {
                            this.showDetails(true);
                        }
                    }, 250);
                    const sub = token.onCancellationRequested(() => loading.dispose());
                    try {
                        return await item.resolve(token);
                    }
                    finally {
                        loading.dispose();
                        sub.dispose();
                    }
                });
                this._currentSuggestionDetails.then(() => {
                    if (index >= this._list.length || item !== this._list.element(index)) {
                        return;
                    }
                    // item can have extra information, so re-render
                    this._ignoreFocusEvents = true;
                    this._list.splice(index, 1, [item]);
                    this._list.setFocus([index]);
                    this._ignoreFocusEvents = false;
                    if (this._isDetailsVisible()) {
                        this.showDetails(false);
                    }
                    else {
                        this.element.domNode.classList.remove('docs-side');
                    }
                    this.editor.setAriaOptions({ activeDescendant: (0, suggestWidgetRenderer_1.getAriaId)(index) });
                }).catch(errors_1.onUnexpectedError);
            }
            // emit an event
            this._onDidFocus.fire({ item, index, model: this._completionModel });
        }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            this._state = state;
            this.element.domNode.classList.toggle('frozen', state === 4 /* State.Frozen */);
            this.element.domNode.classList.remove('message');
            switch (state) {
                case 0 /* State.Hidden */:
                    dom.hide(this._messageElement, this._listElement, this._status.element);
                    this._details.hide(true);
                    this._status.hide();
                    this._contentWidget.hide();
                    this._ctxSuggestWidgetVisible.reset();
                    this._ctxSuggestWidgetMultipleSuggestions.reset();
                    this._ctxSuggestWidgetHasFocusedSuggestion.reset();
                    this._showTimeout.cancel();
                    this.element.domNode.classList.remove('visible');
                    this._list.splice(0, this._list.length);
                    this._focusedItem = undefined;
                    this._cappedHeight = undefined;
                    this._explainMode = false;
                    break;
                case 1 /* State.Loading */:
                    this.element.domNode.classList.add('message');
                    this._messageElement.textContent = SuggestWidget_1.LOADING_MESSAGE;
                    dom.hide(this._listElement, this._status.element);
                    dom.show(this._messageElement);
                    this._details.hide();
                    this._show();
                    this._focusedItem = undefined;
                    (0, aria_1.status)(SuggestWidget_1.LOADING_MESSAGE);
                    break;
                case 2 /* State.Empty */:
                    this.element.domNode.classList.add('message');
                    this._messageElement.textContent = SuggestWidget_1.NO_SUGGESTIONS_MESSAGE;
                    dom.hide(this._listElement, this._status.element);
                    dom.show(this._messageElement);
                    this._details.hide();
                    this._show();
                    this._focusedItem = undefined;
                    (0, aria_1.status)(SuggestWidget_1.NO_SUGGESTIONS_MESSAGE);
                    break;
                case 3 /* State.Open */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._show();
                    break;
                case 4 /* State.Frozen */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._show();
                    break;
                case 5 /* State.Details */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._details.show();
                    this._show();
                    break;
            }
        }
        _show() {
            this._status.show();
            this._contentWidget.show();
            this._layout(this._persistedSize.restore());
            this._ctxSuggestWidgetVisible.set(true);
            this._showTimeout.cancelAndSet(() => {
                this.element.domNode.classList.add('visible');
                this._onDidShow.fire(this);
            }, 100);
        }
        showTriggered(auto, delay) {
            if (this._state !== 0 /* State.Hidden */) {
                return;
            }
            this._contentWidget.setPosition(this.editor.getPosition());
            this._isAuto = !!auto;
            if (!this._isAuto) {
                this._loadingTimeout = (0, async_1.disposableTimeout)(() => this._setState(1 /* State.Loading */), delay);
            }
        }
        showSuggestions(completionModel, selectionIndex, isFrozen, isAuto, noFocus) {
            this._contentWidget.setPosition(this.editor.getPosition());
            this._loadingTimeout?.dispose();
            this._currentSuggestionDetails?.cancel();
            this._currentSuggestionDetails = undefined;
            if (this._completionModel !== completionModel) {
                this._completionModel = completionModel;
            }
            if (isFrozen && this._state !== 2 /* State.Empty */ && this._state !== 0 /* State.Hidden */) {
                this._setState(4 /* State.Frozen */);
                return;
            }
            const visibleCount = this._completionModel.items.length;
            const isEmpty = visibleCount === 0;
            this._ctxSuggestWidgetMultipleSuggestions.set(visibleCount > 1);
            if (isEmpty) {
                this._setState(isAuto ? 0 /* State.Hidden */ : 2 /* State.Empty */);
                this._completionModel = undefined;
                return;
            }
            this._focusedItem = undefined;
            // calling list.splice triggers focus event which this widget forwards. That can lead to
            // suggestions being cancelled and the widget being cleared (and hidden). All this happens
            // before revealing and focusing is done which means revealing and focusing will fail when
            // they get run.
            this._onDidFocus.pause();
            this._onDidSelect.pause();
            try {
                this._list.splice(0, this._list.length, this._completionModel.items);
                this._setState(isFrozen ? 4 /* State.Frozen */ : 3 /* State.Open */);
                this._list.reveal(selectionIndex, 0);
                this._list.setFocus(noFocus ? [] : [selectionIndex]);
            }
            finally {
                this._onDidFocus.resume();
                this._onDidSelect.resume();
            }
            this._pendingLayout.value = dom.runAtThisOrScheduleAtNextAnimationFrame(dom.getWindow(this.element.domNode), () => {
                this._pendingLayout.clear();
                this._layout(this.element.size);
                // Reset focus border
                this._details.widget.domNode.classList.remove('focused');
            });
        }
        focusSelected() {
            if (this._list.length > 0) {
                this._list.setFocus([0]);
            }
        }
        selectNextPage() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.pageDown();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusNextPage();
                    return true;
            }
        }
        selectNext() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusNext(1, true);
                    return true;
            }
        }
        selectLast() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.scrollBottom();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusLast();
                    return true;
            }
        }
        selectPreviousPage() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.pageUp();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusPreviousPage();
                    return true;
            }
        }
        selectPrevious() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusPrevious(1, true);
                    return false;
            }
        }
        selectFirst() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.scrollTop();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusFirst();
                    return true;
            }
        }
        getFocusedItem() {
            if (this._state !== 0 /* State.Hidden */
                && this._state !== 2 /* State.Empty */
                && this._state !== 1 /* State.Loading */
                && this._completionModel
                && this._list.getFocus().length > 0) {
                return {
                    item: this._list.getFocusedElements()[0],
                    index: this._list.getFocus()[0],
                    model: this._completionModel
                };
            }
            return undefined;
        }
        toggleDetailsFocus() {
            if (this._state === 5 /* State.Details */) {
                this._setState(3 /* State.Open */);
                this._details.widget.domNode.classList.remove('focused');
            }
            else if (this._state === 3 /* State.Open */ && this._isDetailsVisible()) {
                this._setState(5 /* State.Details */);
                this._details.widget.domNode.classList.add('focused');
            }
        }
        toggleDetails() {
            if (this._isDetailsVisible()) {
                // hide details widget
                this._pendingShowDetails.clear();
                this._ctxSuggestWidgetDetailsVisible.set(false);
                this._setDetailsVisible(false);
                this._details.hide();
                this.element.domNode.classList.remove('shows-details');
            }
            else if (((0, suggestWidgetDetails_1.canExpandCompletionItem)(this._list.getFocusedElements()[0]) || this._explainMode) && (this._state === 3 /* State.Open */ || this._state === 5 /* State.Details */ || this._state === 4 /* State.Frozen */)) {
                // show details widget (iff possible)
                this._ctxSuggestWidgetDetailsVisible.set(true);
                this._setDetailsVisible(true);
                this.showDetails(false);
            }
        }
        showDetails(loading) {
            this._pendingShowDetails.value = dom.runAtThisOrScheduleAtNextAnimationFrame(dom.getWindow(this.element.domNode), () => {
                this._pendingShowDetails.clear();
                this._details.show();
                if (loading) {
                    this._details.widget.renderLoading();
                }
                else {
                    this._details.widget.renderItem(this._list.getFocusedElements()[0], this._explainMode);
                }
                if (!this._details.widget.isEmpty) {
                    this._positionDetails();
                    this.element.domNode.classList.add('shows-details');
                }
                else {
                    this._details.hide();
                }
                this.editor.focus();
            });
        }
        toggleExplainMode() {
            if (this._list.getFocusedElements()[0]) {
                this._explainMode = !this._explainMode;
                if (!this._isDetailsVisible()) {
                    this.toggleDetails();
                }
                else {
                    this.showDetails(false);
                }
            }
        }
        resetPersistedSize() {
            this._persistedSize.reset();
        }
        hideWidget() {
            this._pendingLayout.clear();
            this._pendingShowDetails.clear();
            this._loadingTimeout?.dispose();
            this._setState(0 /* State.Hidden */);
            this._onDidHide.fire(this);
            this.element.clearSashHoverState();
            // ensure that a reasonable widget height is persisted so that
            // accidential "resize-to-single-items" cases aren't happening
            const dim = this._persistedSize.restore();
            const minPersistedHeight = Math.ceil(this.getLayoutInfo().itemHeight * 4.3);
            if (dim && dim.height < minPersistedHeight) {
                this._persistedSize.store(dim.with(undefined, minPersistedHeight));
            }
        }
        isFrozen() {
            return this._state === 4 /* State.Frozen */;
        }
        _afterRender(position) {
            if (position === null) {
                if (this._isDetailsVisible()) {
                    this._details.hide(); //todo@jrieken soft-hide
                }
                return;
            }
            if (this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */) {
                // no special positioning when widget isn't showing list
                return;
            }
            if (this._isDetailsVisible() && !this._details.widget.isEmpty) {
                this._details.show();
            }
            this._positionDetails();
        }
        _layout(size) {
            if (!this.editor.hasModel()) {
                return;
            }
            if (!this.editor.getDomNode()) {
                // happens when running tests
                return;
            }
            const bodyBox = dom.getClientArea(this.element.domNode.ownerDocument.body);
            const info = this.getLayoutInfo();
            if (!size) {
                size = info.defaultSize;
            }
            let height = size.height;
            let width = size.width;
            // status bar
            this._status.element.style.height = `${info.itemHeight}px`;
            if (this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */) {
                // showing a message only
                height = info.itemHeight + info.borderHeight;
                width = info.defaultSize.width / 2;
                this.element.enableSashes(false, false, false, false);
                this.element.minSize = this.element.maxSize = new dom.Dimension(width, height);
                this._contentWidget.setPreference(2 /* ContentWidgetPositionPreference.BELOW */);
            }
            else {
                // showing items
                // width math
                const maxWidth = bodyBox.width - info.borderHeight - 2 * info.horizontalPadding;
                if (width > maxWidth) {
                    width = maxWidth;
                }
                const preferredWidth = this._completionModel ? this._completionModel.stats.pLabelLen * info.typicalHalfwidthCharacterWidth : width;
                // height math
                const fullHeight = info.statusBarHeight + this._list.contentHeight + info.borderHeight;
                const minHeight = info.itemHeight + info.statusBarHeight;
                const editorBox = dom.getDomNodePagePosition(this.editor.getDomNode());
                const cursorBox = this.editor.getScrolledVisiblePosition(this.editor.getPosition());
                const cursorBottom = editorBox.top + cursorBox.top + cursorBox.height;
                const maxHeightBelow = Math.min(bodyBox.height - cursorBottom - info.verticalPadding, fullHeight);
                const availableSpaceAbove = editorBox.top + cursorBox.top - info.verticalPadding;
                const maxHeightAbove = Math.min(availableSpaceAbove, fullHeight);
                let maxHeight = Math.min(Math.max(maxHeightAbove, maxHeightBelow) + info.borderHeight, fullHeight);
                if (height === this._cappedHeight?.capped) {
                    // Restore the old (wanted) height when the current
                    // height is capped to fit
                    height = this._cappedHeight.wanted;
                }
                if (height < minHeight) {
                    height = minHeight;
                }
                if (height > maxHeight) {
                    height = maxHeight;
                }
                const forceRenderingAboveRequiredSpace = 150;
                if (height > maxHeightBelow || (this._forceRenderingAbove && availableSpaceAbove > forceRenderingAboveRequiredSpace)) {
                    this._contentWidget.setPreference(1 /* ContentWidgetPositionPreference.ABOVE */);
                    this.element.enableSashes(true, true, false, false);
                    maxHeight = maxHeightAbove;
                }
                else {
                    this._contentWidget.setPreference(2 /* ContentWidgetPositionPreference.BELOW */);
                    this.element.enableSashes(false, true, true, false);
                    maxHeight = maxHeightBelow;
                }
                this.element.preferredSize = new dom.Dimension(preferredWidth, info.defaultSize.height);
                this.element.maxSize = new dom.Dimension(maxWidth, maxHeight);
                this.element.minSize = new dom.Dimension(220, minHeight);
                // Know when the height was capped to fit and remember
                // the wanted height for later. This is required when going
                // left to widen suggestions.
                this._cappedHeight = height === fullHeight
                    ? { wanted: this._cappedHeight?.wanted ?? size.height, capped: height }
                    : undefined;
            }
            this._resize(width, height);
        }
        _resize(width, height) {
            const { width: maxWidth, height: maxHeight } = this.element.maxSize;
            width = Math.min(maxWidth, width);
            height = Math.min(maxHeight, height);
            const { statusBarHeight } = this.getLayoutInfo();
            this._list.layout(height - statusBarHeight, width);
            this._listElement.style.height = `${height - statusBarHeight}px`;
            this.element.layout(height, width);
            this._contentWidget.layout();
            this._positionDetails();
        }
        _positionDetails() {
            if (this._isDetailsVisible()) {
                this._details.placeAtAnchor(this.element.domNode, this._contentWidget.getPosition()?.preference[0] === 2 /* ContentWidgetPositionPreference.BELOW */);
            }
        }
        getLayoutInfo() {
            const fontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            const itemHeight = (0, numbers_1.clamp)(this.editor.getOption(120 /* EditorOption.suggestLineHeight */) || fontInfo.lineHeight, 8, 1000);
            const statusBarHeight = !this.editor.getOption(118 /* EditorOption.suggest */).showStatusBar || this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */ ? 0 : itemHeight;
            const borderWidth = this._details.widget.borderWidth;
            const borderHeight = 2 * borderWidth;
            return {
                itemHeight,
                statusBarHeight,
                borderWidth,
                borderHeight,
                typicalHalfwidthCharacterWidth: fontInfo.typicalHalfwidthCharacterWidth,
                verticalPadding: 22,
                horizontalPadding: 14,
                defaultSize: new dom.Dimension(430, statusBarHeight + 12 * itemHeight + borderHeight)
            };
        }
        _isDetailsVisible() {
            return this._storageService.getBoolean('expandSuggestionDocs', 0 /* StorageScope.PROFILE */, false);
        }
        _setDetailsVisible(value) {
            this._storageService.store('expandSuggestionDocs', value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        forceRenderingAbove() {
            if (!this._forceRenderingAbove) {
                this._forceRenderingAbove = true;
                this._layout(this._persistedSize.restore());
            }
        }
        stopForceRenderingAbove() {
            this._forceRenderingAbove = false;
        }
    };
    exports.SuggestWidget = SuggestWidget;
    exports.SuggestWidget = SuggestWidget = SuggestWidget_1 = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService)
    ], SuggestWidget);
    class SuggestContentWidget {
        constructor(_widget, _editor) {
            this._widget = _widget;
            this._editor = _editor;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._preferenceLocked = false;
            this._added = false;
            this._hidden = false;
        }
        dispose() {
            if (this._added) {
                this._added = false;
                this._editor.removeContentWidget(this);
            }
        }
        getId() {
            return 'editor.widget.suggestWidget';
        }
        getDomNode() {
            return this._widget.element.domNode;
        }
        show() {
            this._hidden = false;
            if (!this._added) {
                this._added = true;
                this._editor.addContentWidget(this);
            }
        }
        hide() {
            if (!this._hidden) {
                this._hidden = true;
                this.layout();
            }
        }
        layout() {
            this._editor.layoutContentWidget(this);
        }
        getPosition() {
            if (this._hidden || !this._position || !this._preference) {
                return null;
            }
            return {
                position: this._position,
                preference: [this._preference]
            };
        }
        beforeRender() {
            const { height, width } = this._widget.element.size;
            const { borderWidth, horizontalPadding } = this._widget.getLayoutInfo();
            return new dom.Dimension(width + 2 * borderWidth + horizontalPadding, height + 2 * borderWidth);
        }
        afterRender(position) {
            this._widget._afterRender(position);
        }
        setPreference(preference) {
            if (!this._preferenceLocked) {
                this._preference = preference;
            }
        }
        lockPreference() {
            this._preferenceLocked = true;
        }
        unlockPreference() {
            this._preferenceLocked = false;
        }
        setPosition(position) {
            this._position = position;
        }
    }
    exports.SuggestContentWidget = SuggestContentWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1DaEc7O09BRUc7SUFDSCxJQUFBLDZCQUFhLEVBQUMsZ0NBQWdDLEVBQUUsRUFBRSxJQUFJLEVBQUUsc0NBQXNCLEVBQUUsS0FBSyxFQUFFLHNDQUFzQixFQUFFLE1BQU0sRUFBRSxzQ0FBc0IsRUFBRSxPQUFPLEVBQUUsc0NBQXNCLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLCtCQUErQixFQUFFLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztJQUM1USxJQUFBLDZCQUFhLEVBQUMsNEJBQTRCLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0NBQWtCLEVBQUUsS0FBSyxFQUFFLGtDQUFrQixFQUFFLE1BQU0sRUFBRSxrQ0FBa0IsRUFBRSxPQUFPLEVBQUUsa0NBQWtCLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLHFDQUFxQyxDQUFDLENBQUMsQ0FBQztJQUNoUCxNQUFNLDZCQUE2QixHQUFHLElBQUEsNkJBQWEsRUFBQyxnQ0FBZ0MsRUFBRSxFQUFFLElBQUksRUFBRSxnQ0FBZ0IsRUFBRSxLQUFLLEVBQUUsZ0NBQWdCLEVBQUUsTUFBTSxFQUFFLGdDQUFnQixFQUFFLE9BQU8sRUFBRSxnQ0FBZ0IsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUseUNBQXlDLENBQUMsQ0FBQyxDQUFDO0lBQzFSLElBQUEsNkJBQWEsRUFBQyx3Q0FBd0MsRUFBRSxFQUFFLElBQUksRUFBRSw2Q0FBNkIsRUFBRSxLQUFLLEVBQUUsNkNBQTZCLEVBQUUsTUFB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