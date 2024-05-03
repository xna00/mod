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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/resizable/resizable", "vs/workbench/services/suggest/browser/simpleSuggestWidgetRenderer", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/suggest/browser/suggestWidgetStatus", "vs/css!./media/suggest"], function (require, exports, dom, listWidget_1, resizable_1, simpleSuggestWidgetRenderer_1, async_1, event_1, lifecycle_1, numbers_1, nls_1, instantiation_1, suggestWidgetStatus_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleSuggestWidget = void 0;
    const $ = dom.$;
    var State;
    (function (State) {
        State[State["Hidden"] = 0] = "Hidden";
        State[State["Loading"] = 1] = "Loading";
        State[State["Empty"] = 2] = "Empty";
        State[State["Open"] = 3] = "Open";
        State[State["Frozen"] = 4] = "Frozen";
        State[State["Details"] = 5] = "Details";
    })(State || (State = {}));
    var WidgetPositionPreference;
    (function (WidgetPositionPreference) {
        WidgetPositionPreference[WidgetPositionPreference["Above"] = 0] = "Above";
        WidgetPositionPreference[WidgetPositionPreference["Below"] = 1] = "Below";
    })(WidgetPositionPreference || (WidgetPositionPreference = {}));
    let SimpleSuggestWidget = class SimpleSuggestWidget {
        get list() { return this._list; }
        constructor(_container, _persistedSize, options, instantiationService) {
            this._container = _container;
            this._persistedSize = _persistedSize;
            this._state = 0 /* State.Hidden */;
            this._forceRenderingAbove = false;
            this._pendingLayout = new lifecycle_1.MutableDisposable();
            this._showTimeout = new async_1.TimeoutTimer();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidSelect = new event_1.Emitter();
            this.onDidSelect = this._onDidSelect.event;
            this._onDidHide = new event_1.Emitter();
            this.onDidHide = this._onDidHide.event;
            this._onDidShow = new event_1.Emitter();
            this.onDidShow = this._onDidShow.event;
            this.element = new resizable_1.ResizableHTMLElement();
            this.element.domNode.classList.add('workbench-suggest-widget');
            this._container.appendChild(this.element.domNode);
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
                // this._preferenceLocked = true;
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
                    const { itemHeight, defaultSize } = this._getLayoutInfo();
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
                // this._preferenceLocked = false;
                state = undefined;
            }));
            const renderer = new simpleSuggestWidgetRenderer_1.SimpleSuggestWidgetItemRenderer();
            this._disposables.add(renderer);
            this._listElement = dom.append(this.element.domNode, $('.tree'));
            this._list = new listWidget_1.List('SuggestWidget', this._listElement, {
                getHeight: (_element) => this._getLayoutInfo().itemHeight,
                getTemplateId: (_element) => 'suggestion'
            }, [renderer], {
                alwaysConsumeMouseWheel: true,
                useShadows: false,
                mouseSupport: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getRole: () => 'option',
                    getWidgetAriaLabel: () => (0, nls_1.localize)('suggest', "Suggest"),
                    getWidgetRole: () => 'listbox',
                    getAriaLabel: (item) => {
                        let label = item.completion.label;
                        if (typeof item.completion.label !== 'string') {
                            const { detail, description } = item.completion.label;
                            if (detail && description) {
                                label = (0, nls_1.localize)('label.full', '{0}{1}, {2}', label, detail, description);
                            }
                            else if (detail) {
                                label = (0, nls_1.localize)('label.detail', '{0}{1}', label, detail);
                            }
                            else if (description) {
                                label = (0, nls_1.localize)('label.desc', '{0}, {1}', label, description);
                            }
                        }
                        const { detail } = item.completion;
                        return (0, nls_1.localize)('ariaCurrenttSuggestionReadDetails', '{0}, docs: {1}', label, detail);
                        // if (!item.isResolved || !this._isDetailsVisible()) {
                        // 	return label;
                        // }
                        // const { documentation, detail } = item.completion;
                        // const docs = strings.format(
                        // 	'{0}{1}',
                        // 	detail || '',
                        // 	documentation ? (typeof documentation === 'string' ? documentation : documentation.value) : '');
                        // return nls.localize('ariaCurrenttSuggestionReadDetails', "{0}, docs: {1}", label, docs);
                    },
                }
            });
            if (options.statusBarMenuId) {
                this._status = instantiationService.createInstance(suggestWidgetStatus_1.SuggestWidgetStatus, this.element.domNode, options.statusBarMenuId);
                this.element.domNode.classList.toggle('with-status-bar', true);
            }
            this._disposables.add(this._list.onMouseDown(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onTap(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onDidChangeSelection(e => this._onListSelection(e)));
        }
        dispose() {
            this._disposables.dispose();
            this._status?.dispose();
            this.element.dispose();
        }
        showSuggestions(completionModel, selectionIndex, isFrozen, isAuto, cursorPosition) {
            this._cursorPosition = cursorPosition;
            // this._contentWidget.setPosition(this.editor.getPosition());
            // this._loadingTimeout?.dispose();
            // this._currentSuggestionDetails?.cancel();
            // this._currentSuggestionDetails = undefined;
            if (this._completionModel !== completionModel) {
                this._completionModel = completionModel;
            }
            if (isFrozen && this._state !== 2 /* State.Empty */ && this._state !== 0 /* State.Hidden */) {
                this._setState(4 /* State.Frozen */);
                return;
            }
            const visibleCount = this._completionModel.items.length;
            const isEmpty = visibleCount === 0;
            // this._ctxSuggestWidgetMultipleSuggestions.set(visibleCount > 1);
            if (isEmpty) {
                this._setState(isAuto ? 0 /* State.Hidden */ : 2 /* State.Empty */);
                this._completionModel = undefined;
                return;
            }
            // this._focusedItem = undefined;
            // calling list.splice triggers focus event which this widget forwards. That can lead to
            // suggestions being cancelled and the widget being cleared (and hidden). All this happens
            // before revealing and focusing is done which means revealing and focusing will fail when
            // they get run.
            // this._onDidFocus.pause();
            // this._onDidSelect.pause();
            try {
                this._list.splice(0, this._list.length, this._completionModel.items);
                this._setState(isFrozen ? 4 /* State.Frozen */ : 3 /* State.Open */);
                this._list.reveal(selectionIndex, 0);
                this._list.setFocus([selectionIndex]);
                // this._list.setFocus(noFocus ? [] : [selectionIndex]);
            }
            finally {
                // this._onDidFocus.resume();
                // this._onDidSelect.resume();
            }
            this._pendingLayout.value = dom.runAtThisOrScheduleAtNextAnimationFrame(dom.getWindow(this.element.domNode), () => {
                this._pendingLayout.clear();
                this._layout(this.element.size);
                // Reset focus border
                // this._details.widget.domNode.classList.remove('focused');
            });
        }
        setLineContext(lineContext) {
            if (this._completionModel) {
                this._completionModel.lineContext = lineContext;
            }
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
                    // dom.hide(this._messageElement, this._listElement, this._status.element);
                    dom.hide(this._listElement);
                    if (this._status) {
                        dom.hide(this._status?.element);
                    }
                    // this._details.hide(true);
                    this._status?.hide();
                    // this._contentWidget.hide();
                    // this._ctxSuggestWidgetVisible.reset();
                    // this._ctxSuggestWidgetMultipleSuggestions.reset();
                    // this._ctxSuggestWidgetHasFocusedSuggestion.reset();
                    this._showTimeout.cancel();
                    this.element.domNode.classList.remove('visible');
                    this._list.splice(0, this._list.length);
                    // this._focusedItem = undefined;
                    this._cappedHeight = undefined;
                    // this._explainMode = false;
                    break;
                case 1 /* State.Loading */:
                    this.element.domNode.classList.add('message');
                    // this._messageElement.textContent = SuggestWidget.LOADING_MESSAGE;
                    dom.hide(this._listElement);
                    if (this._status) {
                        dom.hide(this._status?.element);
                    }
                    // dom.show(this._messageElement);
                    // this._details.hide();
                    this._show();
                    // this._focusedItem = undefined;
                    break;
                case 2 /* State.Empty */:
                    this.element.domNode.classList.add('message');
                    // this._messageElement.textContent = SuggestWidget.NO_SUGGESTIONS_MESSAGE;
                    dom.hide(this._listElement);
                    if (this._status) {
                        dom.hide(this._status?.element);
                    }
                    // dom.show(this._messageElement);
                    // this._details.hide();
                    this._show();
                    // this._focusedItem = undefined;
                    break;
                case 3 /* State.Open */:
                    // dom.hide(this._messageElement);
                    dom.show(this._listElement);
                    if (this._status) {
                        dom.show(this._status?.element);
                    }
                    this._show();
                    break;
                case 4 /* State.Frozen */:
                    // dom.hide(this._messageElement);
                    dom.show(this._listElement);
                    if (this._status) {
                        dom.show(this._status?.element);
                    }
                    this._show();
                    break;
                case 5 /* State.Details */:
                    // dom.hide(this._messageElement);
                    dom.show(this._listElement);
                    if (this._status) {
                        dom.show(this._status?.element);
                    }
                    // this._details.show();
                    this._show();
                    break;
            }
        }
        _show() {
            // this._layout(this._persistedSize.restore());
            // dom.show(this.element.domNode);
            // this._onDidShow.fire();
            this._status?.show();
            // this._contentWidget.show();
            dom.show(this.element.domNode);
            this._layout(this._persistedSize.restore());
            // this._ctxSuggestWidgetVisible.set(true);
            this._showTimeout.cancelAndSet(() => {
                this.element.domNode.classList.add('visible');
                this._onDidShow.fire(this);
            }, 100);
        }
        hide() {
            this._pendingLayout.clear();
            // this._pendingShowDetails.clear();
            // this._loadingTimeout?.dispose();
            this._setState(0 /* State.Hidden */);
            this._onDidHide.fire(this);
            dom.hide(this.element.domNode);
            this.element.clearSashHoverState();
            // ensure that a reasonable widget height is persisted so that
            // accidential "resize-to-single-items" cases aren't happening
            const dim = this._persistedSize.restore();
            const minPersistedHeight = Math.ceil(this._getLayoutInfo().itemHeight * 4.3);
            if (dim && dim.height < minPersistedHeight) {
                this._persistedSize.store(dim.with(undefined, minPersistedHeight));
            }
        }
        _layout(size) {
            if (!this._cursorPosition) {
                return;
            }
            // if (!this.editor.hasModel()) {
            // 	return;
            // }
            // if (!this.editor.getDomNode()) {
            // 	// happens when running tests
            // 	return;
            // }
            const bodyBox = dom.getClientArea(this._container.ownerDocument.body);
            const info = this._getLayoutInfo();
            if (!size) {
                size = info.defaultSize;
            }
            let height = size.height;
            let width = size.width;
            // status bar
            if (this._status) {
                this._status.element.style.lineHeight = `${info.itemHeight}px`;
            }
            // if (this._state === State.Empty || this._state === State.Loading) {
            // 	// showing a message only
            // 	height = info.itemHeight + info.borderHeight;
            // 	width = info.defaultSize.width / 2;
            // 	this.element.enableSashes(false, false, false, false);
            // 	this.element.minSize = this.element.maxSize = new dom.Dimension(width, height);
            // 	this._contentWidget.setPreference(ContentWidgetPositionPreference.BELOW);
            // } else {
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
            // const editorBox = dom.getDomNodePagePosition(this.editor.getDomNode());
            // const cursorBox = this.editor.getScrolledVisiblePosition(this.editor.getPosition());
            const editorBox = dom.getDomNodePagePosition(this._container);
            const cursorBox = this._cursorPosition; //this.editor.getScrolledVisiblePosition(this.editor.getPosition());
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
                this._preference = 0 /* WidgetPositionPreference.Above */;
                this.element.enableSashes(true, true, false, false);
                maxHeight = maxHeightAbove;
            }
            else {
                this._preference = 1 /* WidgetPositionPreference.Below */;
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
            // }
            this.element.domNode.style.left = `${this._cursorPosition.left}px`;
            if (this._preference === 0 /* WidgetPositionPreference.Above */) {
                this.element.domNode.style.top = `${this._cursorPosition.top - height - info.borderHeight}px`;
            }
            else {
                this.element.domNode.style.top = `${this._cursorPosition.top + this._cursorPosition.height}px`;
            }
            this._resize(width, height);
        }
        _resize(width, height) {
            const { width: maxWidth, height: maxHeight } = this.element.maxSize;
            width = Math.min(maxWidth, width);
            if (maxHeight) {
                height = Math.min(maxHeight, height);
            }
            const { statusBarHeight } = this._getLayoutInfo();
            this._list.layout(height - statusBarHeight, width);
            this._listElement.style.height = `${height - statusBarHeight}px`;
            this._listElement.style.width = `${width}px`;
            this._listElement.style.height = `${height}px`;
            this.element.layout(height, width);
            // this._positionDetails();
            // TODO: Position based on preference
        }
        _getLayoutInfo() {
            const fontInfo = {
                lineHeight: 20,
                typicalHalfwidthCharacterWidth: 10
            }; //this.editor.getOption(EditorOption.fontInfo);
            const itemHeight = (0, numbers_1.clamp)(fontInfo.lineHeight, 8, 1000);
            const statusBarHeight = 0; //!this.editor.getOption(EditorOption.suggest).showStatusBar || this._state === State.Empty || this._state === State.Loading ? 0 : itemHeight;
            const borderWidth = 1; //this._details.widget.borderWidth;
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
        _onListMouseDownOrTap(e) {
            if (typeof e.element === 'undefined' || typeof e.index === 'undefined') {
                return;
            }
            // prevent stealing browser focus from the terminal
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
            }
        }
        selectNext() {
            this._list.focusNext(1, true);
            const focus = this._list.getFocus();
            if (focus.length > 0) {
                this._list.reveal(focus[0]);
            }
            return true;
        }
        selectNextPage() {
            this._list.focusNextPage();
            const focus = this._list.getFocus();
            if (focus.length > 0) {
                this._list.reveal(focus[0]);
            }
            return true;
        }
        selectPrevious() {
            this._list.focusPrevious(1, true);
            const focus = this._list.getFocus();
            if (focus.length > 0) {
                this._list.reveal(focus[0]);
            }
            return true;
        }
        selectPreviousPage() {
            this._list.focusPreviousPage();
            const focus = this._list.getFocus();
            if (focus.length > 0) {
                this._list.reveal(focus[0]);
            }
            return true;
        }
        getFocusedItem() {
            if (this._completionModel) {
                return {
                    item: this._list.getFocusedElements()[0],
                    index: this._list.getFocus()[0],
                    model: this._completionModel
                };
            }
            return undefined;
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
    exports.SimpleSuggestWidget = SimpleSuggestWidget;
    exports.SimpleSuggestWidget = SimpleSuggestWidget = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], SimpleSuggestWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlU3VnZ2VzdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3N1Z2dlc3QvYnJvd3Nlci9zaW1wbGVTdWdnZXN0V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixJQUFXLEtBT1Y7SUFQRCxXQUFXLEtBQUs7UUFDZixxQ0FBTSxDQUFBO1FBQ04sdUNBQU8sQ0FBQTtRQUNQLG1DQUFLLENBQUE7UUFDTCxpQ0FBSSxDQUFBO1FBQ0oscUNBQU0sQ0FBQTtRQUNOLHVDQUFPLENBQUE7SUFDUixDQUFDLEVBUFUsS0FBSyxLQUFMLEtBQUssUUFPZjtJQWNELElBQVcsd0JBR1Y7SUFIRCxXQUFXLHdCQUF3QjtRQUNsQyx5RUFBSyxDQUFBO1FBQ0wseUVBQUssQ0FBQTtJQUNOLENBQUMsRUFIVSx3QkFBd0IsS0FBeEIsd0JBQXdCLFFBR2xDO0lBVU0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7UUF3Qi9CLElBQUksSUFBSSxLQUFpQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRTdELFlBQ2tCLFVBQXVCLEVBQ3ZCLGNBQTRDLEVBQzdELE9BQXVDLEVBQ2hCLG9CQUEyQztZQUhqRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3ZCLG1CQUFjLEdBQWQsY0FBYyxDQUE4QjtZQTFCdEQsV0FBTSx3QkFBdUI7WUFHN0IseUJBQW9CLEdBQVksS0FBSyxDQUFDO1lBRTdCLG1CQUFjLEdBQUcsSUFBSSw2QkFBaUIsRUFBRSxDQUFDO1lBT3pDLGlCQUFZLEdBQUcsSUFBSSxvQkFBWSxFQUFFLENBQUM7WUFDbEMsaUJBQVksR0FBRyxJQUFJ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