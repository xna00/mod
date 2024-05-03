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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/list/splice", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/color", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/platform", "vs/base/common/types", "./list", "./listView", "vs/base/browser/mouseEvent", "vs/base/common/observable", "vs/css!./list"], function (require, exports, dom_1, event_1, keyboardEvent_1, touch_1, aria_1, splice_1, arrays_1, async_1, color_1, decorators_1, event_2, filters_1, lifecycle_1, numbers_1, platform, types_1, list_1, listView_1, mouseEvent_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.List = exports.unthemedListStyles = exports.DefaultStyleController = exports.MouseController = exports.DefaultKeyboardNavigationDelegate = exports.TypeNavigationMode = void 0;
    exports.isInputElement = isInputElement;
    exports.isMonacoEditor = isMonacoEditor;
    exports.isMonacoCustomToggle = isMonacoCustomToggle;
    exports.isActionItem = isActionItem;
    exports.isMonacoTwistie = isMonacoTwistie;
    exports.isStickyScrollElement = isStickyScrollElement;
    exports.isStickyScrollContainer = isStickyScrollContainer;
    exports.isButton = isButton;
    exports.isSelectionSingleChangeEvent = isSelectionSingleChangeEvent;
    exports.isSelectionRangeChangeEvent = isSelectionRangeChangeEvent;
    class TraitRenderer {
        constructor(trait) {
            this.trait = trait;
            this.renderedElements = [];
        }
        get templateId() {
            return `template:${this.trait.name}`;
        }
        renderTemplate(container) {
            return container;
        }
        renderElement(element, index, templateData) {
            const renderedElementIndex = this.renderedElements.findIndex(el => el.templateData === templateData);
            if (renderedElementIndex >= 0) {
                const rendered = this.renderedElements[renderedElementIndex];
                this.trait.unrender(templateData);
                rendered.index = index;
            }
            else {
                const rendered = { index, templateData };
                this.renderedElements.push(rendered);
            }
            this.trait.renderIndex(index, templateData);
        }
        splice(start, deleteCount, insertCount) {
            const rendered = [];
            for (const renderedElement of this.renderedElements) {
                if (renderedElement.index < start) {
                    rendered.push(renderedElement);
                }
                else if (renderedElement.index >= start + deleteCount) {
                    rendered.push({
                        index: renderedElement.index + insertCount - deleteCount,
                        templateData: renderedElement.templateData
                    });
                }
            }
            this.renderedElements = rendered;
        }
        renderIndexes(indexes) {
            for (const { index, templateData } of this.renderedElements) {
                if (indexes.indexOf(index) > -1) {
                    this.trait.renderIndex(index, templateData);
                }
            }
        }
        disposeTemplate(templateData) {
            const index = this.renderedElements.findIndex(el => el.templateData === templateData);
            if (index < 0) {
                return;
            }
            this.renderedElements.splice(index, 1);
        }
    }
    class Trait {
        get name() { return this._trait; }
        get renderer() {
            return new TraitRenderer(this);
        }
        constructor(_trait) {
            this._trait = _trait;
            this.indexes = [];
            this.sortedIndexes = [];
            this._onChange = new event_2.Emitter();
            this.onChange = this._onChange.event;
        }
        splice(start, deleteCount, elements) {
            const diff = elements.length - deleteCount;
            const end = start + deleteCount;
            const sortedIndexes = [];
            let i = 0;
            while (i < this.sortedIndexes.length && this.sortedIndexes[i] < start) {
                sortedIndexes.push(this.sortedIndexes[i++]);
            }
            for (let j = 0; j < elements.length; j++) {
                if (elements[j]) {
                    sortedIndexes.push(j + start);
                }
            }
            while (i < this.sortedIndexes.length && this.sortedIndexes[i] >= end) {
                sortedIndexes.push(this.sortedIndexes[i++] + diff);
            }
            this.renderer.splice(start, deleteCount, elements.length);
            this._set(sortedIndexes, sortedIndexes);
        }
        renderIndex(index, container) {
            container.classList.toggle(this._trait, this.contains(index));
        }
        unrender(container) {
            container.classList.remove(this._trait);
        }
        /**
         * Sets the indexes which should have this trait.
         *
         * @param indexes Indexes which should have this trait.
         * @return The old indexes which had this trait.
         */
        set(indexes, browserEvent) {
            return this._set(indexes, [...indexes].sort(numericSort), browserEvent);
        }
        _set(indexes, sortedIndexes, browserEvent) {
            const result = this.indexes;
            const sortedResult = this.sortedIndexes;
            this.indexes = indexes;
            this.sortedIndexes = sortedIndexes;
            const toRender = disjunction(sortedResult, indexes);
            this.renderer.renderIndexes(toRender);
            this._onChange.fire({ indexes, browserEvent });
            return result;
        }
        get() {
            return this.indexes;
        }
        contains(index) {
            return (0, arrays_1.binarySearch)(this.sortedIndexes, index, numericSort) >= 0;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._onChange);
        }
    }
    __decorate([
        decorators_1.memoize
    ], Trait.prototype, "renderer", null);
    class SelectionTrait extends Trait {
        constructor(setAriaSelected) {
            super('selected');
            this.setAriaSelected = setAriaSelected;
        }
        renderIndex(index, container) {
            super.renderIndex(index, container);
            if (this.setAriaSelected) {
                if (this.contains(index)) {
                    container.setAttribute('aria-selected', 'true');
                }
                else {
                    container.setAttribute('aria-selected', 'false');
                }
            }
        }
    }
    /**
     * The TraitSpliceable is used as a util class to be able
     * to preserve traits across splice calls, given an identity
     * provider.
     */
    class TraitSpliceable {
        constructor(trait, view, identityProvider) {
            this.trait = trait;
            this.view = view;
            this.identityProvider = identityProvider;
        }
        splice(start, deleteCount, elements) {
            if (!this.identityProvider) {
                return this.trait.splice(start, deleteCount, new Array(elements.length).fill(false));
            }
            const pastElementsWithTrait = this.trait.get().map(i => this.identityProvider.getId(this.view.element(i)).toString());
            if (pastElementsWithTrait.length === 0) {
                return this.trait.splice(start, deleteCount, new Array(elements.length).fill(false));
            }
            const pastElementsWithTraitSet = new Set(pastElementsWithTrait);
            const elementsWithTrait = elements.map(e => pastElementsWithTraitSet.has(this.identityProvider.getId(e).toString()));
            this.trait.splice(start, deleteCount, elementsWithTrait);
        }
    }
    function isInputElement(e) {
        return e.tagName === 'INPUT' || e.tagName === 'TEXTAREA';
    }
    function isListElementDescendantOfClass(e, className) {
        if (e.classList.contains(className)) {
            return true;
        }
        if (e.classList.contains('monaco-list')) {
            return false;
        }
        if (!e.parentElement) {
            return false;
        }
        return isListElementDescendantOfClass(e.parentElement, className);
    }
    function isMonacoEditor(e) {
        return isListElementDescendantOfClass(e, 'monaco-editor');
    }
    function isMonacoCustomToggle(e) {
        return isListElementDescendantOfClass(e, 'monaco-custom-toggle');
    }
    function isActionItem(e) {
        return isListElementDescendantOfClass(e, 'action-item');
    }
    function isMonacoTwistie(e) {
        return isListElementDescendantOfClass(e, 'monaco-tl-twistie');
    }
    function isStickyScrollElement(e) {
        return isListElementDescendantOfClass(e, 'monaco-tree-sticky-row');
    }
    function isStickyScrollContainer(e) {
        return e.classList.contains('monaco-tree-sticky-container');
    }
    function isButton(e) {
        if ((e.tagName === 'A' && e.classList.contains('monaco-button')) ||
            (e.tagName === 'DIV' && e.classList.contains('monaco-button-dropdown'))) {
            return true;
        }
        if (e.classList.contains('monaco-list')) {
            return false;
        }
        if (!e.parentElement) {
            return false;
        }
        return isButton(e.parentElement);
    }
    class KeyboardController {
        get onKeyDown() {
            return event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event, $ => $.filter(e => !isInputElement(e.target))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
        }
        constructor(list, view, options) {
            this.list = list;
            this.view = view;
            this.disposables = new lifecycle_1.DisposableStore();
            this.multipleSelectionDisposables = new lifecycle_1.DisposableStore();
            this.multipleSelectionSupport = options.multipleSelectionSupport;
            this.disposables.add(this.onKeyDown(e => {
                switch (e.keyCode) {
                    case 3 /* KeyCode.Enter */:
                        return this.onEnter(e);
                    case 16 /* KeyCode.UpArrow */:
                        return this.onUpArrow(e);
                    case 18 /* KeyCode.DownArrow */:
                        return this.onDownArrow(e);
                    case 11 /* KeyCode.PageUp */:
                        return this.onPageUpArrow(e);
                    case 12 /* KeyCode.PageDown */:
                        return this.onPageDownArrow(e);
                    case 9 /* KeyCode.Escape */:
                        return this.onEscape(e);
                    case 31 /* KeyCode.KeyA */:
                        if (this.multipleSelectionSupport && (platform.isMacintosh ? e.metaKey : e.ctrlKey)) {
                            this.onCtrlA(e);
                        }
                }
            }));
        }
        updateOptions(optionsUpdate) {
            if (optionsUpdate.multipleSelectionSupport !== undefined) {
                this.multipleSelectionSupport = optionsUpdate.multipleSelectionSupport;
            }
        }
        onEnter(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection(this.list.getFocus(), e.browserEvent);
        }
        onUpArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusPrevious(1, false, e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onDownArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusNext(1, false, e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onPageUpArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusPreviousPage(e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onPageDownArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusNextPage(e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onCtrlA(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection((0, arrays_1.range)(this.list.length), e.browserEvent);
            this.list.setAnchor(undefined);
            this.view.domNode.focus();
        }
        onEscape(e) {
            if (this.list.getSelection().length) {
                e.preventDefault();
                e.stopPropagation();
                this.list.setSelection([], e.browserEvent);
                this.list.setAnchor(undefined);
                this.view.domNode.focus();
            }
        }
        dispose() {
            this.disposables.dispose();
            this.multipleSelectionDisposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], KeyboardController.prototype, "onKeyDown", null);
    var TypeNavigationMode;
    (function (TypeNavigationMode) {
        TypeNavigationMode[TypeNavigationMode["Automatic"] = 0] = "Automatic";
        TypeNavigationMode[TypeNavigationMode["Trigger"] = 1] = "Trigger";
    })(TypeNavigationMode || (exports.TypeNavigationMode = TypeNavigationMode = {}));
    var TypeNavigationControllerState;
    (function (TypeNavigationControllerState) {
        TypeNavigationControllerState[TypeNavigationControllerState["Idle"] = 0] = "Idle";
        TypeNavigationControllerState[TypeNavigationControllerState["Typing"] = 1] = "Typing";
    })(TypeNavigationControllerState || (TypeNavigationControllerState = {}));
    exports.DefaultKeyboardNavigationDelegate = new class {
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return false;
            }
            return (event.keyCode >= 31 /* KeyCode.KeyA */ && event.keyCode <= 56 /* KeyCode.KeyZ */)
                || (event.keyCode >= 21 /* KeyCode.Digit0 */ && event.keyCode <= 30 /* KeyCode.Digit9 */)
                || (event.keyCode >= 98 /* KeyCode.Numpad0 */ && event.keyCode <= 107 /* KeyCode.Numpad9 */)
                || (event.keyCode >= 85 /* KeyCode.Semicolon */ && event.keyCode <= 95 /* KeyCode.Quote */);
        }
    };
    class TypeNavigationController {
        constructor(list, view, keyboardNavigationLabelProvider, keyboardNavigationEventFilter, delegate) {
            this.list = list;
            this.view = view;
            this.keyboardNavigationLabelProvider = keyboardNavigationLabelProvider;
            this.keyboardNavigationEventFilter = keyboardNavigationEventFilter;
            this.delegate = delegate;
            this.enabled = false;
            this.state = TypeNavigationControllerState.Idle;
            this.mode = TypeNavigationMode.Automatic;
            this.triggered = false;
            this.previouslyFocused = -1;
            this.enabledDisposables = new lifecycle_1.DisposableStore();
            this.disposables = new lifecycle_1.DisposableStore();
            this.updateOptions(list.options);
        }
        updateOptions(options) {
            if (options.typeNavigationEnabled ?? true) {
                this.enable();
            }
            else {
                this.disable();
            }
            this.mode = options.typeNavigationMode ?? TypeNavigationMode.Automatic;
        }
        trigger() {
            this.triggered = !this.triggered;
        }
        enable() {
            if (this.enabled) {
                return;
            }
            let typing = false;
            const onChar = event_2.Event.chain(this.enabledDisposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event, $ => $.filter(e => !isInputElement(e.target))
                .filter(() => this.mode === TypeNavigationMode.Automatic || this.triggered)
                .map(event => new keyboardEvent_1.StandardKeyboardEvent(event))
                .filter(e => typing || this.keyboardNavigationEventFilter(e))
                .filter(e => this.delegate.mightProducePrintableCharacter(e))
                .forEach(e => dom_1.EventHelper.stop(e, true))
                .map(event => event.browserEvent.key));
            const onClear = event_2.Event.debounce(onChar, () => null, 800, undefined, undefined, undefined, this.enabledDisposables);
            const onInput = event_2.Event.reduce(event_2.Event.any(onChar, onClear), (r, i) => i === null ? null : ((r || '') + i), undefined, this.enabledDisposables);
            onInput(this.onInput, this, this.enabledDisposables);
            onClear(this.onClear, this, this.enabledDisposables);
            onChar(() => typing = true, undefined, this.enabledDisposables);
            onClear(() => typing = false, undefined, this.enabledDisposables);
            this.enabled = true;
            this.triggered = false;
        }
        disable() {
            if (!this.enabled) {
                return;
            }
            this.enabledDisposables.clear();
            this.enabled = false;
            this.triggered = false;
        }
        onClear() {
            const focus = this.list.getFocus();
            if (focus.length > 0 && focus[0] === this.previouslyFocused) {
                // List: re-announce element on typing end since typed keys will interrupt aria label of focused element
                // Do not announce if there was a focus change at the end to prevent duplication https://github.com/microsoft/vscode/issues/95961
                const ariaLabel = this.list.options.accessibilityProvider?.getAriaLabel(this.list.element(focus[0]));
                if (typeof ariaLabel === 'string') {
                    (0, aria_1.alert)(ariaLabel);
                }
                else if (ariaLabel) {
                    (0, aria_1.alert)(ariaLabel.get());
                }
            }
            this.previouslyFocused = -1;
        }
        onInput(word) {
            if (!word) {
                this.state = TypeNavigationControllerState.Idle;
                this.triggered = false;
                return;
            }
            const focus = this.list.getFocus();
            const start = focus.length > 0 ? focus[0] : 0;
            const delta = this.state === TypeNavigationControllerState.Idle ? 1 : 0;
            this.state = TypeNavigationControllerState.Typing;
            for (let i = 0; i < this.list.length; i++) {
                const index = (start + i + delta) % this.list.length;
                const label = this.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(this.view.element(index));
                const labelStr = label && label.toString();
                if (this.list.options.typeNavigationEnabled) {
                    if (typeof labelStr !== 'undefined') {
                        // If prefix is found, focus and return early
                        if ((0, filters_1.matchesPrefix)(word, labelStr)) {
                            this.previouslyFocused = start;
                            this.list.setFocus([index]);
                            this.list.reveal(index);
                            return;
                        }
                        const fuzzy = (0, filters_1.matchesFuzzy2)(word, labelStr);
                        if (fuzzy) {
                            const fuzzyScore = fuzzy[0].end - fuzzy[0].start;
                            // ensures that when fuzzy matching, doesn't clash with prefix matching (1 input vs 1+ should be prefix and fuzzy respecitvely). Also makes sure that exact matches are prioritized.
                            if (fuzzyScore > 1 && fuzzy.length === 1) {
                                this.previouslyFocused = start;
                                this.list.setFocus([index]);
                                this.list.reveal(index);
                                return;
                            }
                        }
                    }
                }
                else if (typeof labelStr === 'undefined' || (0, filters_1.matchesPrefix)(word, labelStr)) {
                    this.previouslyFocused = start;
                    this.list.setFocus([index]);
                    this.list.reveal(index);
                    return;
                }
            }
        }
        dispose() {
            this.disable();
            this.enabledDisposables.dispose();
            this.disposables.dispose();
        }
    }
    class DOMFocusController {
        constructor(list, view) {
            this.list = list;
            this.view = view;
            this.disposables = new lifecycle_1.DisposableStore();
            const onKeyDown = event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(view.domNode, 'keydown')).event, $ => $
                .filter(e => !isInputElement(e.target))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
            const onTab = event_2.Event.chain(onKeyDown, $ => $.filter(e => e.keyCode === 2 /* KeyCode.Tab */ && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey));
            onTab(this.onTab, this, this.disposables);
        }
        onTab(e) {
            if (e.target !== this.view.domNode) {
                return;
            }
            const focus = this.list.getFocus();
            if (focus.length === 0) {
                return;
            }
            const focusedDomElement = this.view.domElement(focus[0]);
            if (!focusedDomElement) {
                return;
            }
            const tabIndexElement = focusedDomElement.querySelector('[tabIndex]');
            if (!tabIndexElement || !(tabIndexElement instanceof HTMLElement) || tabIndexElement.tabIndex === -1) {
                return;
            }
            const style = (0, dom_1.getWindow)(tabIndexElement).getComputedStyle(tabIndexElement);
            if (style.visibility === 'hidden' || style.display === 'none') {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            tabIndexElement.focus();
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    function isSelectionSingleChangeEvent(event) {
        return platform.isMacintosh ? event.browserEvent.metaKey : event.browserEvent.ctrlKey;
    }
    function isSelectionRangeChangeEvent(event) {
        return event.browserEvent.shiftKey;
    }
    function isMouseRightClick(event) {
        return (0, dom_1.isMouseEvent)(event) && event.button === 2;
    }
    const DefaultMultipleSelectionController = {
        isSelectionSingleChangeEvent,
        isSelectionRangeChangeEvent
    };
    class MouseController {
        constructor(list) {
            this.list = list;
            this.disposables = new lifecycle_1.DisposableStore();
            this._onPointer = new event_2.Emitter();
            this.onPointer = this._onPointer.event;
            if (list.options.multipleSelectionSupport !== false) {
                this.multipleSelectionController = this.list.options.multipleSelectionController || DefaultMultipleSelectionController;
            }
            this.mouseSupport = typeof list.options.mouseSupport === 'undefined' || !!list.options.mouseSupport;
            if (this.mouseSupport) {
                list.onMouseDown(this.onMouseDown, this, this.disposables);
                list.onContextMenu(this.onContextMenu, this, this.disposables);
                list.onMouseDblClick(this.onDoubleClick, this, this.disposables);
                list.onTouchStart(this.onMouseDown, this, this.disposables);
                this.disposables.add(touch_1.Gesture.addTarget(list.getHTMLElement()));
            }
            event_2.Event.any(list.onMouseClick, list.onMouseMiddleClick, list.onTap)(this.onViewPointer, this, this.disposables);
        }
        updateOptions(optionsUpdate) {
            if (optionsUpdate.multipleSelectionSupport !== undefined) {
                this.multipleSelectionController = undefined;
                if (optionsUpdate.multipleSelectionSupport) {
                    this.multipleSelectionController = this.list.options.multipleSelectionController || DefaultMultipleSelectionController;
                }
            }
        }
        isSelectionSingleChangeEvent(event) {
            if (!this.multipleSelectionController) {
                return false;
            }
            return this.multipleSelectionController.isSelectionSingleChangeEvent(event);
        }
        isSelectionRangeChangeEvent(event) {
            if (!this.multipleSelectionController) {
                return false;
            }
            return this.multipleSelectionController.isSelectionRangeChangeEvent(event);
        }
        isSelectionChangeEvent(event) {
            return this.isSelectionSingleChangeEvent(event) || this.isSelectionRangeChangeEvent(event);
        }
        onMouseDown(e) {
            if (isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            if ((0, dom_1.getActiveElement)() !== e.browserEvent.target) {
                this.list.domFocus();
            }
        }
        onContextMenu(e) {
            if (isInputElement(e.browserEvent.target) || isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            const focus = typeof e.index === 'undefined' ? [] : [e.index];
            this.list.setFocus(focus, e.browserEvent);
        }
        onViewPointer(e) {
            if (!this.mouseSupport) {
                return;
            }
            if (isInputElement(e.browserEvent.target) || isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            if (e.browserEvent.isHandledByList) {
                return;
            }
            e.browserEvent.isHandledByList = true;
            const focus = e.index;
            if (typeof focus === 'undefined') {
                this.list.setFocus([], e.browserEvent);
                this.list.setSelection([], e.browserEvent);
                this.list.setAnchor(undefined);
                return;
            }
            if (this.isSelectionChangeEvent(e)) {
                return this.changeSelection(e);
            }
            this.list.setFocus([focus], e.browserEvent);
            this.list.setAnchor(focus);
            if (!isMouseRightClick(e.browserEvent)) {
                this.list.setSelection([focus], e.browserEvent);
            }
            this._onPointer.fire(e);
        }
        onDoubleClick(e) {
            if (isInputElement(e.browserEvent.target) || isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            if (this.isSelectionChangeEvent(e)) {
                return;
            }
            if (e.browserEvent.isHandledByList) {
                return;
            }
            e.browserEvent.isHandledByList = true;
            const focus = this.list.getFocus();
            this.list.setSelection(focus, e.browserEvent);
        }
        changeSelection(e) {
            const focus = e.index;
            let anchor = this.list.getAnchor();
            if (this.isSelectionRangeChangeEvent(e)) {
                if (typeof anchor === 'undefined') {
                    const currentFocus = this.list.getFocus()[0];
                    anchor = currentFocus ?? focus;
                    this.list.setAnchor(anchor);
                }
                const min = Math.min(anchor, focus);
                const max = Math.max(anchor, focus);
                const rangeSelection = (0, arrays_1.range)(min, max + 1);
                const selection = this.list.getSelection();
                const contiguousRange = getContiguousRangeContaining(disjunction(selection, [anchor]), anchor);
                if (contiguousRange.length === 0) {
                    return;
                }
                const newSelection = disjunction(rangeSelection, relativeComplement(selection, contiguousRange));
                this.list.setSelection(newSelection, e.browserEvent);
                this.list.setFocus([focus], e.browserEvent);
            }
            else if (this.isSelectionSingleChangeEvent(e)) {
                const selection = this.list.getSelection();
                const newSelection = selection.filter(i => i !== focus);
                this.list.setFocus([focus]);
                this.list.setAnchor(focus);
                if (selection.length === newSelection.length) {
                    this.list.setSelection([...newSelection, focus], e.browserEvent);
                }
                else {
                    this.list.setSelection(newSelection, e.browserEvent);
                }
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.MouseController = MouseController;
    class DefaultStyleController {
        constructor(styleElement, selectorSuffix) {
            this.styleElement = styleElement;
            this.selectorSuffix = selectorSuffix;
        }
        style(styles) {
            const suffix = this.selectorSuffix && `.${this.selectorSuffix}`;
            const content = [];
            if (styles.listBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-rows { background: ${styles.listBackground}; }`);
            }
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listActiveSelectionIconForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected .codicon { color: ${styles.listActiveSelectionIconForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { color:  ${styles.listInactiveFocusForeground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.focused:hover { color:  ${styles.listInactiveFocusForeground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionIconForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused .codicon { color:  ${styles.listInactiveSelectionIconForeground}; }`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target):not(.dragging) .monaco-list-row:hover:not(.selected):not(.focused) { background-color: ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix}:not(.drop-target):not(.dragging) .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            /**
             * Outlines
             */
            const focusAndSelectionOutline = (0, dom_1.asCssValueWithDefault)(styles.listFocusAndSelectionOutline, (0, dom_1.asCssValueWithDefault)(styles.listSelectionOutline, styles.listFocusOutline ?? ''));
            if (focusAndSelectionOutline) { // default: listFocusOutline
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused.selected { outline: 1px solid ${focusAndSelectionOutline}; outline-offset: -1px;}`);
            }
            if (styles.listFocusOutline) { // default: set
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
				.monaco-workbench.context-menu-visible .monaco-list${suffix}.last-focused .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            const inactiveFocusAndSelectionOutline = (0, dom_1.asCssValueWithDefault)(styles.listSelectionOutline, styles.listInactiveFocusOutline ?? '');
            if (inactiveFocusAndSelectionOutline) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused.selected { outline: 1px dotted ${inactiveFocusAndSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listSelectionOutline) { // default: activeContrastBorder
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listInactiveFocusOutline) { // default: null
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) { // default: activeContrastBorder
                content.push(`.monaco-list${suffix} .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropOverBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} .monaco-list-rows.drop-target,
				.monaco-list${suffix} .monaco-list-row.drop-target { background-color: ${styles.listDropOverBackground} !important; color: inherit !important; }
			`);
            }
            if (styles.listDropBetweenBackground) {
                content.push(`
			.monaco-list${suffix} .monaco-list-rows.drop-target-before .monaco-list-row:first-child::before,
			.monaco-list${suffix} .monaco-list-row.drop-target-before::before {
				content: ""; position: absolute; top: 0px; left: 0px; width: 100%; height: 1px;
				background-color: ${styles.listDropBetweenBackground};
			}`);
                content.push(`
			.monaco-list${suffix} .monaco-list-rows.drop-target-after .monaco-list-row:last-child::after,
			.monaco-list${suffix} .monaco-list-row.drop-target-after::after {
				content: ""; position: absolute; bottom: 0px; left: 0px; width: 100%; height: 1px;
				background-color: ${styles.listDropBetweenBackground};
			}`);
            }
            if (styles.tableColumnsBorder) {
                content.push(`
				.monaco-table > .monaco-split-view2,
				.monaco-table > .monaco-split-view2 .monaco-sash.vertical::before,
				.monaco-workbench:not(.reduce-motion) .monaco-table:hover > .monaco-split-view2,
				.monaco-workbench:not(.reduce-motion) .monaco-table:hover > .monaco-split-view2 .monaco-sash.vertical::before {
					border-color: ${styles.tableColumnsBorder};
				}

				.monaco-workbench:not(.reduce-motion) .monaco-table > .monaco-split-view2,
				.monaco-workbench:not(.reduce-motion) .monaco-table > .monaco-split-view2 .monaco-sash.vertical::before {
					border-color: transparent;
				}
			`);
            }
            if (styles.tableOddRowsBackgroundColor) {
                content.push(`
				.monaco-table .monaco-list-row[data-parity=odd]:not(.focused):not(.selected):not(:hover) .monaco-table-tr,
				.monaco-table .monaco-list:not(:focus) .monaco-list-row[data-parity=odd].focused:not(.selected):not(:hover) .monaco-table-tr,
				.monaco-table .monaco-list:not(.focused) .monaco-list-row[data-parity=odd].focused:not(.selected):not(:hover) .monaco-table-tr {
					background-color: ${styles.tableOddRowsBackgroundColor};
				}
			`);
            }
            this.styleElement.textContent = content.join('\n');
        }
    }
    exports.DefaultStyleController = DefaultStyleController;
    exports.unthemedListStyles = {
        listFocusBackground: '#7FB0D0',
        listActiveSelectionBackground: '#0E639C',
        listActiveSelectionForeground: '#FFFFFF',
        listActiveSelectionIconForeground: '#FFFFFF',
        listFocusAndSelectionOutline: '#90C2F9',
        listFocusAndSelectionBackground: '#094771',
        listFocusAndSelectionForeground: '#FFFFFF',
        listInactiveSelectionBackground: '#3F3F46',
        listInactiveSelectionIconForeground: '#FFFFFF',
        listHoverBackground: '#2A2D2E',
        listDropOverBackground: '#383B3D',
        listDropBetweenBackground: '#EEEEEE',
        treeIndentGuidesStroke: '#a9a9a9',
        treeInactiveIndentGuidesStroke: color_1.Color.fromHex('#a9a9a9').transparent(0.4).toString(),
        tableColumnsBorder: color_1.Color.fromHex('#cccccc').transparent(0.2).toString(),
        tableOddRowsBackgroundColor: color_1.Color.fromHex('#cccccc').transparent(0.04).toString(),
        listBackground: undefined,
        listFocusForeground: undefined,
        listInactiveSelectionForeground: undefined,
        listInactiveFocusForeground: undefined,
        listInactiveFocusBackground: undefined,
        listHoverForeground: undefined,
        listFocusOutline: undefined,
        listInactiveFocusOutline: undefined,
        listSelectionOutline: undefined,
        listHoverOutline: undefined
    };
    const DefaultOptions = {
        keyboardSupport: true,
        mouseSupport: true,
        multipleSelectionSupport: true,
        dnd: {
            getDragURI() { return null; },
            onDragStart() { },
            onDragOver() { return false; },
            drop() { },
            dispose() { }
        }
    };
    // TODO@Joao: move these utils into a SortedArray class
    function getContiguousRangeContaining(range, value) {
        const index = range.indexOf(value);
        if (index === -1) {
            return [];
        }
        const result = [];
        let i = index - 1;
        while (i >= 0 && range[i] === value - (index - i)) {
            result.push(range[i--]);
        }
        result.reverse();
        i = index;
        while (i < range.length && range[i] === value + (i - index)) {
            result.push(range[i++]);
        }
        return result;
    }
    /**
     * Given two sorted collections of numbers, returns the intersection
     * between them (OR).
     */
    function disjunction(one, other) {
        const result = [];
        let i = 0, j = 0;
        while (i < one.length || j < other.length) {
            if (i >= one.length) {
                result.push(other[j++]);
            }
            else if (j >= other.length) {
                result.push(one[i++]);
            }
            else if (one[i] === other[j]) {
                result.push(one[i]);
                i++;
                j++;
                continue;
            }
            else if (one[i] < other[j]) {
                result.push(one[i++]);
            }
            else {
                result.push(other[j++]);
            }
        }
        return result;
    }
    /**
     * Given two sorted collections of numbers, returns the relative
     * complement between them (XOR).
     */
    function relativeComplement(one, other) {
        const result = [];
        let i = 0, j = 0;
        while (i < one.length || j < other.length) {
            if (i >= one.length) {
                result.push(other[j++]);
            }
            else if (j >= other.length) {
                result.push(one[i++]);
            }
            else if (one[i] === other[j]) {
                i++;
                j++;
                continue;
            }
            else if (one[i] < other[j]) {
                result.push(one[i++]);
            }
            else {
                j++;
            }
        }
        return result;
    }
    const numericSort = (a, b) => a - b;
    class PipelineRenderer {
        constructor(_templateId, renderers) {
            this._templateId = _templateId;
            this.renderers = renderers;
        }
        get templateId() {
            return this._templateId;
        }
        renderTemplate(container) {
            return this.renderers.map(r => r.renderTemplate(container));
        }
        renderElement(element, index, templateData, height) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.renderElement(element, index, templateData[i++], height);
            }
        }
        disposeElement(element, index, templateData, height) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.disposeElement?.(element, index, templateData[i], height);
                i += 1;
            }
        }
        disposeTemplate(templateData) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.disposeTemplate(templateData[i++]);
            }
        }
    }
    class AccessibiltyRenderer {
        constructor(accessibilityProvider) {
            this.accessibilityProvider = accessibilityProvider;
            this.templateId = 'a18n';
        }
        renderTemplate(container) {
            return { container, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(element, index, data) {
            const ariaLabel = this.accessibilityProvider.getAriaLabel(element);
            const observable = (ariaLabel && typeof ariaLabel !== 'string') ? ariaLabel : (0, observable_1.constObservable)(ariaLabel);
            data.disposables.add((0, observable_1.autorun)(reader => {
                this.setAriaLabel(reader.readObservable(observable), data.container);
            }));
            const ariaLevel = this.accessibilityProvider.getAriaLevel && this.accessibilityProvider.getAriaLevel(element);
            if (typeof ariaLevel === 'number') {
                data.container.setAttribute('aria-level', `${ariaLevel}`);
            }
            else {
                data.container.removeAttribute('aria-level');
            }
        }
        setAriaLabel(ariaLabel, element) {
            if (ariaLabel) {
                element.setAttribute('aria-label', ariaLabel);
            }
            else {
                element.removeAttribute('aria-label');
            }
        }
        disposeElement(element, index, templateData, height) {
            templateData.disposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    }
    class ListViewDragAndDrop {
        constructor(list, dnd) {
            this.list = list;
            this.dnd = dnd;
        }
        getDragElements(element) {
            const selection = this.list.getSelectedElements();
            const elements = selection.indexOf(element) > -1 ? selection : [element];
            return elements;
        }
        getDragURI(element) {
            return this.dnd.getDragURI(element);
        }
        getDragLabel(elements, originalEvent) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(elements, originalEvent);
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            this.dnd.onDragStart?.(data, originalEvent);
        }
        onDragOver(data, targetElement, targetIndex, targetSector, originalEvent) {
            return this.dnd.onDragOver(data, targetElement, targetIndex, targetSector, originalEvent);
        }
        onDragLeave(data, targetElement, targetIndex, originalEvent) {
            this.dnd.onDragLeave?.(data, targetElement, targetIndex, originalEvent);
        }
        onDragEnd(originalEvent) {
            this.dnd.onDragEnd?.(originalEvent);
        }
        drop(data, targetElement, targetIndex, targetSector, originalEvent) {
            this.dnd.drop(data, targetElement, targetIndex, targetSector, originalEvent);
        }
        dispose() {
            this.dnd.dispose();
        }
    }
    /**
     * The {@link List} is a virtual scrolling widget, built on top of the {@link ListView}
     * widget.
     *
     * Features:
     * - Customizable keyboard and mouse support
     * - Element traits: focus, selection, achor
     * - Accessibility support
     * - Touch support
     * - Performant template-based rendering
     * - Horizontal scrolling
     * - Variable element height support
     * - Dynamic element height support
     * - Drag-and-drop support
     */
    class List {
        get onDidChangeFocus() {
            return event_2.Event.map(this.eventBufferer.wrapEvent(this.focus.onChange), e => this.toListEvent(e), this.disposables);
        }
        get onDidChangeSelection() {
            return event_2.Event.map(this.eventBufferer.wrapEvent(this.selection.onChange), e => this.toListEvent(e), this.disposables);
        }
        get domId() { return this.view.domId; }
        get onDidScroll() { return this.view.onDidScroll; }
        get onMouseClick() { return this.view.onMouseClick; }
        get onMouseDblClick() { return this.view.onMouseDblClick; }
        get onMouseMiddleClick() { return this.view.onMouseMiddleClick; }
        get onPointer() { return this.mouseController.onPointer; }
        get onMouseUp() { return this.view.onMouseUp; }
        get onMouseDown() { return this.view.onMouseDown; }
        get onMouseOver() { return this.view.onMouseOver; }
        get onMouseMove() { return this.view.onMouseMove; }
        get onMouseOut() { return this.view.onMouseOut; }
        get onTouchStart() { return this.view.onTouchStart; }
        get onTap() { return this.view.onTap; }
        /**
         * Possible context menu trigger events:
         * - ContextMenu key
         * - Shift F10
         * - Ctrl Option Shift M (macOS with VoiceOver)
         * - Mouse right click
         */
        get onContextMenu() {
            let didJustPressContextMenuKey = false;
            const fromKeyDown = event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event, $ => $.map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => didJustPressContextMenuKey = e.keyCode === 58 /* KeyCode.ContextMenu */ || (e.shiftKey && e.keyCode === 68 /* KeyCode.F10 */))
                .map(e => dom_1.EventHelper.stop(e, true))
                .filter(() => false));
            const fromKeyUp = event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keyup')).event, $ => $.forEach(() => didJustPressContextMenuKey = false)
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => e.keyCode === 58 /* KeyCode.ContextMenu */ || (e.shiftKey && e.keyCode === 68 /* KeyCode.F10 */))
                .map(e => dom_1.EventHelper.stop(e, true))
                .map(({ browserEvent }) => {
                const focus = this.getFocus();
                const index = focus.length ? focus[0] : undefined;
                const element = typeof index !== 'undefined' ? this.view.element(index) : undefined;
                const anchor = typeof index !== 'undefined' ? this.view.domElement(index) : this.view.domNode;
                return { index, element, anchor, browserEvent };
            }));
            const fromMouse = event_2.Event.chain(this.view.onContextMenu, $ => $.filter(_ => !didJustPressContextMenuKey)
                .map(({ element, index, browserEvent }) => ({ element, index, anchor: new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.view.domNode), browserEvent), browserEvent })));
            return event_2.Event.any(fromKeyDown, fromKeyUp, fromMouse);
        }
        get onKeyDown() { return this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event; }
        get onKeyUp() { return this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keyup')).event; }
        get onKeyPress() { return this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keypress')).event; }
        get onDidFocus() { return event_2.Event.signal(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'focus', true)).event); }
        get onDidBlur() { return event_2.Event.signal(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'blur', true)).event); }
        constructor(user, container, virtualDelegate, renderers, _options = DefaultOptions) {
            this.user = user;
            this._options = _options;
            this.focus = new Trait('focused');
            this.anchor = new Trait('anchor');
            this.eventBufferer = new event_2.EventBufferer();
            this._ariaLabel = '';
            this.disposables = new lifecycle_1.DisposableStore();
            this._onDidDispose = new event_2.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            const role = this._options.accessibilityProvider && this._options.accessibilityProvider.getWidgetRole ? this._options.accessibilityProvider?.getWidgetRole() : 'list';
            this.selection = new SelectionTrait(role !== 'listbox');
            const baseRenderers = [this.focus.renderer, this.selection.renderer];
            this.accessibilityProvider = _options.accessibilityProvider;
            if (this.accessibilityProvider) {
                baseRenderers.push(new AccessibiltyRenderer(this.accessibilityProvider));
                this.accessibilityProvider.onDidChangeActiveDescendant?.(this.onDidChangeActiveDescendant, this, this.disposables);
            }
            renderers = renderers.map(r => new PipelineRenderer(r.templateId, [...baseRenderers, r]));
            const viewOptions = {
                ..._options,
                dnd: _options.dnd && new ListViewDragAndDrop(this, _options.dnd)
            };
            this.view = this.createListView(container, virtualDelegate, renderers, viewOptions);
            this.view.domNode.setAttribute('role', role);
            if (_options.styleController) {
                this.styleController = _options.styleController(this.view.domId);
            }
            else {
                const styleElement = (0, dom_1.createStyleSheet)(this.view.domNode);
                this.styleController = new DefaultStyleController(styleElement, this.view.domId);
            }
            this.spliceable = new splice_1.CombinedSpliceable([
                new TraitSpliceable(this.focus, this.view, _options.identityProvider),
                new TraitSpliceable(this.selection, this.view, _options.identityProvider),
                new TraitSpliceable(this.anchor, this.view, _options.identityProvider),
                this.view
            ]);
            this.disposables.add(this.focus);
            this.disposables.add(this.selection);
            this.disposables.add(this.anchor);
            this.disposables.add(this.view);
            this.disposables.add(this._onDidDispose);
            this.disposables.add(new DOMFocusController(this, this.view));
            if (typeof _options.keyboardSupport !== 'boolean' || _options.keyboardSupport) {
                this.keyboardController = new KeyboardController(this, this.view, _options);
                this.disposables.add(this.keyboardController);
            }
            if (_options.keyboardNavigationLabelProvider) {
                const delegate = _options.keyboardNavigationDelegate || exports.DefaultKeyboardNavigationDelegate;
                this.typeNavigationController = new TypeNavigationController(this, this.view, _options.keyboardNavigationLabelProvider, _options.keyboardNavigationEventFilter ?? (() => true), delegate);
                this.disposables.add(this.typeNavigationController);
            }
            this.mouseController = this.createMouseController(_options);
            this.disposables.add(this.mouseController);
            this.onDidChangeFocus(this._onFocusChange, this, this.disposables);
            this.onDidChangeSelection(this._onSelectionChange, this, this.disposables);
            if (this.accessibilityProvider) {
                this.ariaLabel = this.accessibilityProvider.getWidgetAriaLabel();
            }
            if (this._options.multipleSelectionSupport !== false) {
                this.view.domNode.setAttribute('aria-multiselectable', 'true');
            }
        }
        createListView(container, virtualDelegate, renderers, viewOptions) {
            return new listView_1.ListView(container, virtualDelegate, renderers, viewOptions);
        }
        createMouseController(options) {
            return new MouseController(this);
        }
        updateOptions(optionsUpdate = {}) {
            this._options = { ...this._options, ...optionsUpdate };
            this.typeNavigationController?.updateOptions(this._options);
            if (this._options.multipleSelectionController !== undefined) {
                if (this._options.multipleSelectionSupport) {
                    this.view.domNode.setAttribute('aria-multiselectable', 'true');
                }
                else {
                    this.view.domNode.removeAttribute('aria-multiselectable');
                }
            }
            this.mouseController.updateOptions(optionsUpdate);
            this.keyboardController?.updateOptions(optionsUpdate);
            this.view.updateOptions(optionsUpdate);
        }
        get options() {
            return this._options;
        }
        splice(start, deleteCount, elements = []) {
            if (start < 0 || start > this.view.length) {
                throw new list_1.ListError(this.user, `Invalid start index: ${start}`);
            }
            if (deleteCount < 0) {
                throw new list_1.ListError(this.user, `Invalid delete count: ${deleteCount}`);
            }
            if (deleteCount === 0 && elements.length === 0) {
                return;
            }
            this.eventBufferer.bufferEvents(() => this.spliceable.splice(start, deleteCount, elements));
        }
        updateWidth(index) {
            this.view.updateWidth(index);
        }
        updateElementHeight(index, size) {
            this.view.updateElementHeight(index, size, null);
        }
        rerender() {
            this.view.rerender();
        }
        element(index) {
            return this.view.element(index);
        }
        indexOf(element) {
            return this.view.indexOf(element);
        }
        indexAt(position) {
            return this.view.indexAt(position);
        }
        get length() {
            return this.view.length;
        }
        get contentHeight() {
            return this.view.contentHeight;
        }
        get contentWidth() {
            return this.view.contentWidth;
        }
        get onDidChangeContentHeight() {
            return this.view.onDidChangeContentHeight;
        }
        get onDidChangeContentWidth() {
            return this.view.onDidChangeContentWidth;
        }
        get scrollTop() {
            return this.view.getScrollTop();
        }
        set scrollTop(scrollTop) {
            this.view.setScrollTop(scrollTop);
        }
        get scrollLeft() {
            return this.view.getScrollLeft();
        }
        set scrollLeft(scrollLeft) {
            this.view.setScrollLeft(scrollLeft);
        }
        get scrollHeight() {
            return this.view.scrollHeight;
        }
        get renderHeight() {
            return this.view.renderHeight;
        }
        get firstVisibleIndex() {
            return this.view.firstVisibleIndex;
        }
        get firstMostlyVisibleIndex() {
            return this.view.firstMostlyVisibleIndex;
        }
        get lastVisibleIndex() {
            return this.view.lastVisibleIndex;
        }
        get ariaLabel() {
            return this._ariaLabel;
        }
        set ariaLabel(value) {
            this._ariaLabel = value;
            this.view.domNode.setAttribute('aria-label', value);
        }
        domFocus() {
            this.view.domNode.focus({ preventScroll: true });
        }
        layout(height, width) {
            this.view.layout(height, width);
        }
        triggerTypeNavigation() {
            this.typeNavigationController?.trigger();
        }
        setSelection(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this.selection.set(indexes, browserEvent);
        }
        getSelection() {
            return this.selection.get();
        }
        getSelectedElements() {
            return this.getSelection().map(i => this.view.element(i));
        }
        setAnchor(index) {
            if (typeof index === 'undefined') {
                this.anchor.set([]);
                return;
            }
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            this.anchor.set([index]);
        }
        getAnchor() {
            return (0, arrays_1.firstOrDefault)(this.anchor.get(), undefined);
        }
        getAnchorElement() {
            const anchor = this.getAnchor();
            return typeof anchor === 'undefined' ? undefined : this.element(anchor);
        }
        setFocus(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this.focus.set(indexes, browserEvent);
        }
        focusNext(n = 1, loop = false, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const focus = this.focus.get();
            const index = this.findNextIndex(focus.length > 0 ? focus[0] + n : 0, loop, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusPrevious(n = 1, loop = false, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const focus = this.focus.get();
            const index = this.findPreviousIndex(focus.length > 0 ? focus[0] - n : 0, loop, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        async focusNextPage(browserEvent, filter) {
            let lastPageIndex = this.view.indexAt(this.view.getScrollTop() + this.view.renderHeight);
            lastPageIndex = lastPageIndex === 0 ? 0 : lastPageIndex - 1;
            const currentlyFocusedElementIndex = this.getFocus()[0];
            if (currentlyFocusedElementIndex !== lastPageIndex && (currentlyFocusedElementIndex === undefined || lastPageIndex > currentlyFocusedElementIndex)) {
                const lastGoodPageIndex = this.findPreviousIndex(lastPageIndex, false, filter);
                if (lastGoodPageIndex > -1 && currentlyFocusedElementIndex !== lastGoodPageIndex) {
                    this.setFocus([lastGoodPageIndex], browserEvent);
                }
                else {
                    this.setFocus([lastPageIndex], browserEvent);
                }
            }
            else {
                const previousScrollTop = this.view.getScrollTop();
                let nextpageScrollTop = previousScrollTop + this.view.renderHeight;
                if (lastPageIndex > currentlyFocusedElementIndex) {
                    // scroll last page element to the top only if the last page element is below the focused element
                    nextpageScrollTop -= this.view.elementHeight(lastPageIndex);
                }
                this.view.setScrollTop(nextpageScrollTop);
                if (this.view.getScrollTop() !== previousScrollTop) {
                    this.setFocus([]);
                    // Let the scroll event listener run
                    await (0, async_1.timeout)(0);
                    await this.focusNextPage(browserEvent, filter);
                }
            }
        }
        async focusPreviousPage(browserEvent, filter, getPaddingTop = () => 0) {
            let firstPageIndex;
            const paddingTop = getPaddingTop();
            const scrollTop = this.view.getScrollTop() + paddingTop;
            if (scrollTop === 0) {
                firstPageIndex = this.view.indexAt(scrollTop);
            }
            else {
                firstPageIndex = this.view.indexAfter(scrollTop - 1);
            }
            const currentlyFocusedElementIndex = this.getFocus()[0];
            if (currentlyFocusedElementIndex !== firstPageIndex && (currentlyFocusedElementIndex === undefined || currentlyFocusedElementIndex >= firstPageIndex)) {
                const firstGoodPageIndex = this.findNextIndex(firstPageIndex, false, filter);
                if (firstGoodPageIndex > -1 && currentlyFocusedElementIndex !== firstGoodPageIndex) {
                    this.setFocus([firstGoodPageIndex], browserEvent);
                }
                else {
                    this.setFocus([firstPageIndex], browserEvent);
                }
            }
            else {
                const previousScrollTop = scrollTop;
                this.view.setScrollTop(scrollTop - this.view.renderHeight - paddingTop);
                if (this.view.getScrollTop() + getPaddingTop() !== previousScrollTop) {
                    this.setFocus([]);
                    // Let the scroll event listener run
                    await (0, async_1.timeout)(0);
                    await this.focusPreviousPage(browserEvent, filter, getPaddingTop);
                }
            }
        }
        focusLast(browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const index = this.findPreviousIndex(this.length - 1, false, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusFirst(browserEvent, filter) {
            this.focusNth(0, browserEvent, filter);
        }
        focusNth(n, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const index = this.findNextIndex(n, false, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        findNextIndex(index, loop = false, filter) {
            for (let i = 0; i < this.length; i++) {
                if (index >= this.length && !loop) {
                    return -1;
                }
                index = index % this.length;
                if (!filter || filter(this.element(index))) {
                    return index;
                }
                index++;
            }
            return -1;
        }
        findPreviousIndex(index, loop = false, filter) {
            for (let i = 0; i < this.length; i++) {
                if (index < 0 && !loop) {
                    return -1;
                }
                index = (this.length + (index % this.length)) % this.length;
                if (!filter || filter(this.element(index))) {
                    return index;
                }
                index--;
            }
            return -1;
        }
        getFocus() {
            return this.focus.get();
        }
        getFocusedElements() {
            return this.getFocus().map(i => this.view.element(i));
        }
        reveal(index, relativeTop, paddingTop = 0) {
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            const scrollTop = this.view.getScrollTop();
            const elementTop = this.view.elementTop(index);
            const elementHeight = this.view.elementHeight(index);
            if ((0, types_1.isNumber)(relativeTop)) {
                // y = mx + b
                const m = elementHeight - this.view.renderHeight + paddingTop;
                this.view.setScrollTop(m * (0, numbers_1.clamp)(relativeTop, 0, 1) + elementTop - paddingTop);
            }
            else {
                const viewItemBottom = elementTop + elementHeight;
                const scrollBottom = scrollTop + this.view.renderHeight;
                if (elementTop < scrollTop + paddingTop && viewItemBottom >= scrollBottom) {
                    // The element is already overflowing the viewport, no-op
                }
                else if (elementTop < scrollTop + paddingTop || (viewItemBottom >= scrollBottom && elementHeight >= this.view.renderHeight)) {
                    this.view.setScrollTop(elementTop - paddingTop);
                }
                else if (viewItemBottom >= scrollBottom) {
                    this.view.setScrollTop(viewItemBottom - this.view.renderHeight);
                }
            }
        }
        /**
         * Returns the relative position of an element rendered in the list.
         * Returns `null` if the element isn't *entirely* in the visible viewport.
         */
        getRelativeTop(index, paddingTop = 0) {
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            const scrollTop = this.view.getScrollTop();
            const elementTop = this.view.elementTop(index);
            const elementHeight = this.view.elementHeight(index);
            if (elementTop < scrollTop + paddingTop || elementTop + elementHeight > scrollTop + this.view.renderHeight) {
                return null;
            }
            // y = mx + b
            const m = elementHeight - this.view.renderHeight + paddingTop;
            return Math.abs((scrollTop + paddingTop - elementTop) / m);
        }
        isDOMFocused() {
            return (0, dom_1.isActiveElement)(this.view.domNode);
        }
        getHTMLElement() {
            return this.view.domNode;
        }
        getScrollableElement() {
            return this.view.scrollableElementDomNode;
        }
        getElementID(index) {
            return this.view.getElementDomId(index);
        }
        getElementTop(index) {
            return this.view.elementTop(index);
        }
        style(styles) {
            this.styleController.style(styles);
        }
        toListEvent({ indexes, browserEvent }) {
            return { indexes, elements: indexes.map(i => this.view.element(i)), browserEvent };
        }
        _onFocusChange() {
            const focus = this.focus.get();
            this.view.domNode.classList.toggle('element-focused', focus.length > 0);
            this.onDidChangeActiveDescendant();
        }
        onDidChangeActiveDescendant() {
            const focus = this.focus.get();
            if (focus.length > 0) {
                let id;
                if (this.accessibilityProvider?.getActiveDescendantId) {
                    id = this.accessibilityProvider.getActiveDescendantId(this.view.element(focus[0]));
                }
                this.view.domNode.setAttribute('aria-activedescendant', id || this.view.getElementDomId(focus[0]));
            }
            else {
                this.view.domNode.removeAttribute('aria-activedescendant');
            }
        }
        _onSelectionChange() {
            const selection = this.selection.get();
            this.view.domNode.classList.toggle('selection-none', selection.length === 0);
            this.view.domNode.classList.toggle('selection-single', selection.length === 1);
            this.view.domNode.classList.toggle('selection-multiple', selection.length > 1);
        }
        dispose() {
            this._onDidDispose.fire();
            this.disposables.dispose();
            this._onDidDispose.dispose();
        }
    }
    exports.List = List;
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidChangeFocus", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidChangeSelection", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onContextMenu", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onKeyDown", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onKeyUp", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onKeyPress", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidFocus", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidBlur", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2xpc3QvbGlzdFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFxUGhHLHdDQUVDO0lBa0JELHdDQUVDO0lBRUQsb0RBRUM7SUFFRCxvQ0FFQztJQUVELDBDQUVDO0lBRUQsc0RBRUM7SUFFRCwwREFFQztJQUVELDRCQWVDO0lBNlZELG9FQUVDO0lBRUQsa0VBRUM7SUFybUJELE1BQU0sYUFBYTtRQUdsQixZQUFvQixLQUFlO1lBQWYsVUFBSyxHQUFMLEtBQUssQ0FBVTtZQUYzQixxQkFBZ0IsR0FBeUIsRUFBRSxDQUFDO1FBRWIsQ0FBQztRQUV4QyxJQUFJLFVBQVU7WUFDYixPQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRUQsY0FBYyxDQUFDLFNBQXNCO1lBQ3BDLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBVSxFQUFFLEtBQWEsRUFBRSxZQUFnQztZQUN4RSxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxLQUFLLFlBQVksQ0FBQyxDQUFDO1lBRXJHLElBQUksb0JBQW9CLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDbEMsUUFBUSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDeEIsQ0FBQztp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