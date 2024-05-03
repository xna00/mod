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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/touch", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/range", "vs/base/common/scrollable", "vs/base/browser/ui/list/rangeMap", "vs/base/browser/ui/list/rowCache", "vs/base/common/errors", "vs/base/common/numbers"], function (require, exports, dnd_1, dom_1, event_1, touch_1, scrollableElement_1, arrays_1, async_1, decorators_1, event_2, lifecycle_1, range_1, scrollable_1, rangeMap_1, rowCache_1, errors_1, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListView = exports.NativeDragAndDropData = exports.ExternalElementsDragAndDropData = exports.ElementsDragAndDropData = exports.ListViewTargetSector = void 0;
    const StaticDND = {
        CurrentDragAndDropData: undefined
    };
    var ListViewTargetSector;
    (function (ListViewTargetSector) {
        // drop position relative to the top of the item
        ListViewTargetSector[ListViewTargetSector["TOP"] = 0] = "TOP";
        ListViewTargetSector[ListViewTargetSector["CENTER_TOP"] = 1] = "CENTER_TOP";
        ListViewTargetSector[ListViewTargetSector["CENTER_BOTTOM"] = 2] = "CENTER_BOTTOM";
        ListViewTargetSector[ListViewTargetSector["BOTTOM"] = 3] = "BOTTOM"; // [75%-100%)
    })(ListViewTargetSector || (exports.ListViewTargetSector = ListViewTargetSector = {}));
    const DefaultOptions = {
        useShadows: true,
        verticalScrollMode: 1 /* ScrollbarVisibility.Auto */,
        setRowLineHeight: true,
        setRowHeight: true,
        supportDynamicHeights: false,
        dnd: {
            getDragElements(e) { return [e]; },
            getDragURI() { return null; },
            onDragStart() { },
            onDragOver() { return false; },
            drop() { },
            dispose() { }
        },
        horizontalScrolling: false,
        transformOptimization: true,
        alwaysConsumeMouseWheel: true,
    };
    class ElementsDragAndDropData {
        get context() {
            return this._context;
        }
        set context(value) {
            this._context = value;
        }
        constructor(elements) {
            this.elements = elements;
        }
        update() { }
        getData() {
            return this.elements;
        }
    }
    exports.ElementsDragAndDropData = ElementsDragAndDropData;
    class ExternalElementsDragAndDropData {
        constructor(elements) {
            this.elements = elements;
        }
        update() { }
        getData() {
            return this.elements;
        }
    }
    exports.ExternalElementsDragAndDropData = ExternalElementsDragAndDropData;
    class NativeDragAndDropData {
        constructor() {
            this.types = [];
            this.files = [];
        }
        update(dataTransfer) {
            if (dataTransfer.types) {
                this.types.splice(0, this.types.length, ...dataTransfer.types);
            }
            if (dataTransfer.files) {
                this.files.splice(0, this.files.length);
                for (let i = 0; i < dataTransfer.files.length; i++) {
                    const file = dataTransfer.files.item(i);
                    if (file && (file.size || file.type)) {
                        this.files.push(file);
                    }
                }
            }
        }
        getData() {
            return {
                types: this.types,
                files: this.files
            };
        }
    }
    exports.NativeDragAndDropData = NativeDragAndDropData;
    function equalsDragFeedback(f1, f2) {
        if (Array.isArray(f1) && Array.isArray(f2)) {
            return (0, arrays_1.equals)(f1, f2);
        }
        return f1 === f2;
    }
    class ListViewAccessibilityProvider {
        constructor(accessibilityProvider) {
            if (accessibilityProvider?.getSetSize) {
                this.getSetSize = accessibilityProvider.getSetSize.bind(accessibilityProvider);
            }
            else {
                this.getSetSize = (e, i, l) => l;
            }
            if (accessibilityProvider?.getPosInSet) {
                this.getPosInSet = accessibilityProvider.getPosInSet.bind(accessibilityProvider);
            }
            else {
                this.getPosInSet = (e, i) => i + 1;
            }
            if (accessibilityProvider?.getRole) {
                this.getRole = accessibilityProvider.getRole.bind(accessibilityProvider);
            }
            else {
                this.getRole = _ => 'listitem';
            }
            if (accessibilityProvider?.isChecked) {
                this.isChecked = accessibilityProvider.isChecked.bind(accessibilityProvider);
            }
            else {
                this.isChecked = _ => undefined;
            }
        }
    }
    /**
     * The {@link ListView} is a virtual scrolling engine.
     *
     * Given that it only renders elements within its viewport, it can hold large
     * collections of elements and stay very performant. The performance bottleneck
     * usually lies within the user's rendering code for each element.
     *
     * @remarks It is a low-level widget, not meant to be used directly. Refer to the
     * List widget instead.
     */
    class ListView {
        static { this.InstanceCount = 0; }
        get contentHeight() { return this.rangeMap.size; }
        get contentWidth() { return this.scrollWidth ?? 0; }
        get onDidScroll() { return this.scrollableElement.onScroll; }
        get onWillScroll() { return this.scrollableElement.onWillScroll; }
        get containerDomNode() { return this.rowsContainer; }
        get scrollableElementDomNode() { return this.scrollableElement.getDomNode(); }
        get horizontalScrolling() { return this._horizontalScrolling; }
        set horizontalScrolling(value) {
            if (value === this._horizontalScrolling) {
                return;
            }
            if (value && this.supportDynamicHeights) {
                throw new Error('Horizontal scrolling and dynamic heights not supported simultaneously');
            }
            this._horizontalScrolling = value;
            this.domNode.classList.toggle('horizontal-scrolling', this._horizontalScrolling);
            if (this._horizontalScrolling) {
                for (const item of this.items) {
                    this.measureItemWidth(item);
                }
                this.updateScrollWidth();
                this.scrollableElement.setScrollDimensions({ width: (0, dom_1.getContentWidth)(this.domNode) });
                this.rowsContainer.style.width = `${Math.max(this.scrollWidth || 0, this.renderWidth)}px`;
            }
            else {
                this.scrollableElementWidthDelayer.cancel();
                this.scrollableElement.setScrollDimensions({ width: this.renderWidth, scrollWidth: this.renderWidth });
                this.rowsContainer.style.width = '';
            }
        }
        constructor(container, virtualDelegate, renderers, options = DefaultOptions) {
            this.virtualDelegate = virtualDelegate;
            this.domId = `list_id_${++ListView.InstanceCount}`;
            this.renderers = new Map();
            this.renderWidth = 0;
            this._scrollHeight = 0;
            this.scrollableElementUpdateDisposable = null;
            this.scrollableElementWidthDelayer = new async_1.Delayer(50);
            this.splicing = false;
            this.dragOverAnimationStopDisposable = lifecycle_1.Disposable.None;
            this.dragOverMouseY = 0;
            this.canDrop = false;
            this.currentDragFeedbackDisposable = lifecycle_1.Disposable.None;
            this.onDragLeaveTimeout = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this._onDidChangeContentHeight = new event_2.Emitter();
            this._onDidChangeContentWidth = new event_2.Emitter();
            this.onDidChangeContentHeight = event_2.Event.latch(this._onDidChangeContentHeight.event, undefined, this.disposables);
            this.onDidChangeContentWidth = event_2.Event.latch(this._onDidChangeContentWidth.event, undefined, this.disposables);
            this._horizontalScrolling = false;
            if (options.horizontalScrolling && options.supportDynamicHeights) {
                throw new Error('Horizontal scrolling and dynamic heights not supported simultaneously');
            }
            this.items = [];
            this.itemId = 0;
            this.rangeMap = this.createRangeMap(options.paddingTop ?? 0);
            for (const renderer of renderers) {
                this.renderers.set(renderer.templateId, renderer);
            }
            this.cache = this.disposables.add(new rowCache_1.RowCache(this.renderers));
            this.lastRenderTop = 0;
            this.lastRenderHeight = 0;
            this.domNode = document.createElement('div');
            this.domNode.className = 'monaco-list';
            this.domNode.classList.add(this.domId);
            this.domNode.tabIndex = 0;
            this.domNode.classList.toggle('mouse-support', typeof options.mouseSupport === 'boolean' ? options.mouseSupport : true);
            this._horizontalScrolling = options.horizontalScrolling ?? DefaultOptions.horizontalScrolling;
            this.domNode.classList.toggle('horizontal-scrolling', this._horizontalScrolling);
            this.paddingBottom = typeof options.paddingBottom === 'undefined' ? 0 : options.paddingBottom;
            this.accessibilityProvider = new ListViewAccessibilityProvider(options.accessibilityProvider);
            this.rowsContainer = document.createElement('div');
            this.rowsContainer.className = 'monaco-list-rows';
            const transformOptimization = options.transformOptimization ?? DefaultOptions.transformOptimization;
            if (transformOptimization) {
                this.rowsContainer.style.transform = 'translate3d(0px, 0px, 0px)';
                this.rowsContainer.style.overflow = 'hidden';
                this.rowsContainer.style.contain = 'strict';
            }
            this.disposables.add(touch_1.Gesture.addTarget(this.rowsContainer));
            this.scrollable = this.disposables.add(new scrollable_1.Scrollable({
                forceIntegerValues: true,
                smoothScrollDuration: (options.smoothScrolling ?? false) ? 125 : 0,
                scheduleAtNextAnimationFrame: cb => (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.domNode), cb)
            }));
            this.scrollableElement = this.disposables.add(new scrollableElement_1.SmoothScrollableElement(this.rowsContainer, {
                alwaysConsumeMouseWheel: options.alwaysConsumeMouseWheel ?? DefaultOptions.alwaysConsumeMouseWheel,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                vertical: options.verticalScrollMode ?? DefaultOptions.verticalScrollMode,
                useShadows: options.useShadows ?? DefaultOptions.useShadows,
                mouseWheelScrollSensitivity: options.mouseWheelScrollSensitivity,
                fastScrollSensitivity: options.fastScrollSensitivity,
                scrollByPage: options.scrollByPage
            }, this.scrollable));
            this.domNode.appendChild(this.scrollableElement.getDomNode());
            container.appendChild(this.domNode);
            this.scrollableElement.onScroll(this.onScroll, this, this.disposables);
            this.disposables.add((0, dom_1.addDisposableListener)(this.rowsContainer, touch_1.EventType.Change, e => this.onTouchChange(e)));
            // Prevent the monaco-scrollable-element from scrolling
            // https://github.com/microsoft/vscode/issues/44181
            this.disposables.add((0, dom_1.addDisposableListener)(this.scrollableElement.getDomNode(), 'scroll', e => e.target.scrollTop = 0));
            this.disposables.add((0, dom_1.addDisposableListener)(this.domNode, 'dragover', e => this.onDragOver(this.toDragEvent(e))));
            this.disposables.add((0, dom_1.addDisposableListener)(this.domNode, 'drop', e => this.onDrop(this.toDragEvent(e))));
            this.disposables.add((0, dom_1.addDisposableListener)(this.domNode, 'dragleave', e => this.onDragLeave(this.toDragEvent(e))));
            this.disposables.add((0, dom_1.addDisposableListener)(this.domNode, 'dragend', e => this.onDragEnd(e)));
            this.setRowLineHeight = options.setRowLineHeight ?? DefaultOptions.setRowLineHeight;
            this.setRowHeight = options.setRowHeight ?? DefaultOptions.setRowHeight;
            this.supportDynamicHeights = options.supportDynamicHeights ?? DefaultOptions.supportDynamicHeights;
            this.dnd = options.dnd ?? this.disposables.add(DefaultOptions.dnd);
            this.layout(options.initialSize?.height, options.initialSize?.width);
        }
        updateOptions(options) {
            if (options.paddingBottom !== undefined) {
                this.paddingBottom = options.paddingBottom;
                this.scrollableElement.setScrollDimensions({ scrollHeight: this.scrollHeight });
            }
            if (options.smoothScrolling !== undefined) {
                this.scrollable.setSmoothScrollDuration(options.smoothScrolling ? 125 : 0);
            }
            if (options.horizontalScrolling !== undefined) {
                this.horizontalScrolling = options.horizontalScrolling;
            }
            let scrollableOptions;
            if (options.scrollByPage !== undefined) {
                scrollableOptions = { ...(scrollableOptions ?? {}), scrollByPage: options.scrollByPage };
            }
            if (options.mouseWheelScrollSensitivity !== undefined) {
                scrollableOptions = { ...(scrollableOptions ?? {}), mouseWheelScrollSensitivity: options.mouseWheelScrollSensitivity };
            }
            if (options.fastScrollSensitivity !== undefined) {
                scrollableOptions = { ...(scrollableOptions ?? {}), fastScrollSensitivity: options.fastScrollSensitivity };
            }
            if (scrollableOptions) {
                this.scrollableElement.updateOptions(scrollableOptions);
            }
            if (options.paddingTop !== undefined && options.paddingTop !== this.rangeMap.paddingTop) {
                // trigger a rerender
                const lastRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
                const offset = options.paddingTop - this.rangeMap.paddingTop;
                this.rangeMap.paddingTop = options.paddingTop;
                this.render(lastRenderRange, Math.max(0, this.lastRenderTop + offset), this.lastRenderHeight, undefined, undefined, true);
                this.setScrollTop(this.lastRenderTop);
                this.eventuallyUpdateScrollDimensions();
                if (this.supportDynamicHeights) {
                    this._rerender(this.lastRenderTop, this.lastRenderHeight);
                }
            }
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            this.scrollableElement.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this.scrollableElement.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        updateElementHeight(index, size, anchorIndex) {
            if (index < 0 || index >= this.items.length) {
                return;
            }
            const originalSize = this.items[index].size;
            if (typeof size === 'undefined') {
                if (!this.supportDynamicHeights) {
                    console.warn('Dynamic heights not supported');
                    return;
                }
                this.items[index].lastDynamicHeightWidth = undefined;
                size = originalSize + this.probeDynamicHeight(index);
            }
            if (originalSize === size) {
                return;
            }
            const lastRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            let heightDiff = 0;
            if (index < lastRenderRange.start) {
                // do not scroll the viewport if resized element is out of viewport
                heightDiff = size - originalSize;
            }
            else {
                if (anchorIndex !== null && anchorIndex > index && anchorIndex < lastRenderRange.end) {
                    // anchor in viewport
                    // resized element in viewport and above the anchor
                    heightDiff = size - originalSize;
                }
                else {
                    heightDiff = 0;
                }
            }
            this.rangeMap.splice(index, 1, [{ size: size }]);
            this.items[index].size = size;
            this.render(lastRenderRange, Math.max(0, this.lastRenderTop + heightDiff), this.lastRenderHeight, undefined, undefined, true);
            this.setScrollTop(this.lastRenderTop);
            this.eventuallyUpdateScrollDimensions();
            if (this.supportDynamicHeights) {
                this._rerender(this.lastRenderTop, this.lastRenderHeight);
            }
        }
        createRangeMap(paddingTop) {
            return new rangeMap_1.RangeMap(paddingTop);
        }
        splice(start, deleteCount, elements = []) {
            if (this.splicing) {
                throw new Error('Can\'t run recursive splices.');
            }
            this.splicing = true;
            try {
                return this._splice(start, deleteCount, elements);
            }
            finally {
                this.splicing = false;
                this._onDidChangeContentHeight.fire(this.contentHeight);
            }
        }
        _splice(start, deleteCount, elements = []) {
            const previousRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            const deleteRange = { start, end: start + deleteCount };
            const removeRange = range_1.Range.intersect(previousRenderRange, deleteRange);
            // try to reuse rows, avoid removing them from DOM
            const rowsToDispose = new Map();
            for (let i = removeRange.end - 1; i >= removeRange.start; i--) {
                const item = this.items[i];
                item.dragStartDisposable.dispose();
                item.checkedDisposable.dispose();
                if (item.row) {
                    let rows = rowsToDispose.get(item.templateId);
                    if (!rows) {
                        rows = [];
                        rowsToDispose.set(item.templateId, rows);
                    }
                    const renderer = this.renderers.get(item.templateId);
                    if (renderer && renderer.disposeElement) {
                        renderer.disposeElement(item.element, i, item.row.templateData, item.size);
                    }
                    rows.push(item.row);
                }
                item.row = null;
                item.stale = true;
            }
            const previousRestRange = { start: start + deleteCount, end: this.items.length };
            const previousRenderedRestRange = range_1.Range.intersect(previousRestRange, previousRenderRange);
            const previousUnrenderedRestRanges = range_1.Range.relativeComplement(previousRestRange, previousRenderRange);
            const inserted = elements.map(element => ({
                id: String(this.itemId++),
                element,
                templateId: this.virtualDelegate.getTemplateId(element),
                size: this.virtualDelegate.getHeight(element),
                width: undefined,
                hasDynamicHeight: !!this.virtualDelegate.hasDynamicHeight && this.virtualDelegate.hasDynamicHeight(element),
                lastDynamicHeightWidth: undefined,
                row: null,
                uri: undefined,
                dropTarget: false,
                dragStartDisposable: lifecycle_1.Disposable.None,
                checkedDisposable: lifecycle_1.Disposable.None,
                stale: false
            }));
            let deleted;
            // TODO@joao: improve this optimization to catch even more cases
            if (start === 0 && deleteCount >= this.items.length) {
                this.rangeMap = this.createRangeMap(this.rangeMap.paddingTop);
                this.rangeMap.splice(0, 0, inserted);
                deleted = this.items;
                this.items = inserted;
            }
            else {
                this.rangeMap.splice(start, deleteCount, inserted);
                deleted = this.items.splice(start, deleteCount, ...inserted);
            }
            const delta = elements.length - deleteCount;
            const renderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            const renderedRestRange = (0, rangeMap_1.shift)(previousRenderedRestRange, delta);
            const updateRange = range_1.Range.intersect(renderRange, renderedRestRange);
            for (let i = updateRange.start; i < updateRange.end; i++) {
                this.updateItemInDOM(this.items[i], i);
            }
            const removeRanges = range_1.Range.relativeComplement(renderedRestRange, renderRange);
            for (const range of removeRanges) {
                for (let i = range.start; i < range.end; i++) {
                    this.removeItemFromDOM(i);
                }
            }
            const unrenderedRestRanges = previousUnrenderedRestRanges.map(r => (0, rangeMap_1.shift)(r, delta));
            const elementsRange = { start, end: start + elements.length };
            const insertRanges = [elementsRange, ...unrenderedRestRanges].map(r => range_1.Range.intersect(renderRange, r)).reverse();
            for (const range of insertRanges) {
                for (let i = range.end - 1; i >= range.start; i--) {
                    const item = this.items[i];
                    const rows = rowsToDispose.get(item.templateId);
                    const row = rows?.pop();
                    this.insertItemInDOM(i, row);
                }
            }
            for (const rows of rowsToDispose.values()) {
                for (const row of rows) {
                    this.cache.release(row);
                }
            }
            this.eventuallyUpdateScrollDimensions();
            if (this.supportDynamicHeights) {
                this._rerender(this.scrollTop, this.renderHeight);
            }
            return deleted.map(i => i.element);
        }
        eventuallyUpdateScrollDimensions() {
            this._scrollHeight = this.contentHeight;
            this.rowsContainer.style.height = `${this._scrollHeight}px`;
            if (!this.scrollableElementUpdateDisposable) {
                this.scrollableElementUpdateDisposable = (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.domNode), () => {
                    this.scrollableElement.setScrollDimensions({ scrollHeight: this.scrollHeight });
                    this.updateScrollWidth();
                    this.scrollableElementUpdateDisposable = null;
                });
            }
        }
        eventuallyUpdateScrollWidth() {
            if (!this.horizontalScrolling) {
                this.scrollableElementWidthDelayer.cancel();
                return;
            }
            this.scrollableElementWidthDelayer.trigger(() => this.updateScrollWidth());
        }
        updateScrollWidth() {
            if (!this.horizontalScrolling) {
                return;
            }
            let scrollWidth = 0;
            for (const item of this.items) {
                if (typeof item.width !== 'undefined') {
                    scrollWidth = Math.max(scrollWidth, item.width);
                }
            }
            this.scrollWidth = scrollWidth;
            this.scrollableElement.setScrollDimensions({ scrollWidth: scrollWidth === 0 ? 0 : (scrollWidth + 10) });
            this._onDidChangeContentWidth.fire(this.scrollWidth);
        }
        updateWidth(index) {
            if (!this.horizontalScrolling || typeof this.scrollWidth === 'undefined') {
                return;
            }
            const item = this.items[index];
            this.measureItemWidth(item);
            if (typeof item.width !== 'undefined' && item.width > this.scrollWidth) {
                this.scrollWidth = item.width;
                this.scrollableElement.setScrollDimensions({ scrollWidth: this.scrollWidth + 10 });
                this._onDidChangeContentWidth.fire(this.scrollWidth);
            }
        }
        rerender() {
            if (!this.supportDynamicHeights) {
                return;
            }
            for (const item of this.items) {
                item.lastDynamicHeightWidth = undefined;
            }
            this._rerender(this.lastRenderTop, this.lastRenderHeight);
        }
        get length() {
            return this.items.length;
        }
        get renderHeight() {
            const scrollDimensions = this.scrollableElement.getScrollDimensions();
            return scrollDimensions.height;
        }
        get firstVisibleIndex() {
            const range = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            return range.start;
        }
        get firstMostlyVisibleIndex() {
            const firstVisibleIndex = this.firstVisibleIndex;
            const firstElTop = this.rangeMap.positionAt(firstVisibleIndex);
            const nextElTop = this.rangeMap.positionAt(firstVisibleIndex + 1);
            if (nextElTop !== -1) {
                const firstElMidpoint = (nextElTop - firstElTop) / 2 + firstElTop;
                if (firstElMidpoint < this.scrollTop) {
                    return firstVisibleIndex + 1;
                }
            }
            return firstVisibleIndex;
        }
        get lastVisibleIndex() {
            const range = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            return range.end - 1;
        }
        element(index) {
            return this.items[index].element;
        }
        indexOf(element) {
            return this.items.findIndex(item => item.element === element);
        }
        domElement(index) {
            const row = this.items[index].row;
            return row && row.domNode;
        }
        elementHeight(index) {
            return this.items[index].size;
        }
        elementTop(index) {
            return this.rangeMap.positionAt(index);
        }
        indexAt(position) {
            return this.rangeMap.indexAt(position);
        }
        indexAfter(position) {
            return this.rangeMap.indexAfter(position);
        }
        layout(height, width) {
            const scrollDimensions = {
                height: typeof height === 'number' ? height : (0, dom_1.getContentHeight)(this.domNode)
            };
            if (this.scrollableElementUpdateDisposable) {
                this.scrollableElementUpdateDisposable.dispose();
                this.scrollableElementUpdateDisposable = null;
                scrollDimensions.scrollHeight = this.scrollHeight;
            }
            this.scrollableElement.setScrollDimensions(scrollDimensions);
            if (typeof width !== 'undefined') {
                this.renderWidth = width;
                if (this.supportDynamicHeights) {
                    this._rerender(this.scrollTop, this.renderHeight);
                }
            }
            if (this.horizontalScrolling) {
                this.scrollableElement.setScrollDimensions({
                    width: typeof width === 'number' ? width : (0, dom_1.getContentWidth)(this.domNode)
                });
            }
        }
        // Render
        render(previousRenderRange, renderTop, renderHeight, renderLeft, scrollWidth, updateItemsInDOM = false) {
            const renderRange = this.getRenderRange(renderTop, renderHeight);
            const rangesToInsert = range_1.Range.relativeComplement(renderRange, previousRenderRange).reverse();
            const rangesToRemove = range_1.Range.relativeComplement(previousRenderRange, renderRange);
            if (updateItemsInDOM) {
                const rangesToUpdate = range_1.Range.intersect(previousRenderRange, renderRange);
                for (let i = rangesToUpdate.start; i < rangesToUpdate.end; i++) {
                    this.updateItemInDOM(this.items[i], i);
                }
            }
            this.cache.transact(() => {
                for (const range of rangesToRemove) {
                    for (let i = range.start; i < range.end; i++) {
                        this.removeItemFromDOM(i);
                    }
                }
                for (const range of rangesToInsert) {
                    for (let i = range.end - 1; i >= range.start; i--) {
                        this.insertItemInDOM(i);
                    }
                }
            });
            if (renderLeft !== undefined) {
                this.rowsContainer.style.left = `-${renderLeft}px`;
            }
            this.rowsContainer.style.top = `-${renderTop}px`;
            if (this.horizontalScrolling && scrollWidth !== undefined) {
                this.rowsContainer.style.width = `${Math.max(scrollWidth, this.renderWidth)}px`;
            }
            this.lastRenderTop = renderTop;
            this.lastRenderHeight = renderHeight;
        }
        // DOM operations
        insertItemInDOM(index, row) {
            const item = this.items[index];
            if (!item.row) {
                if (row) {
                    item.row = row;
                    item.stale = true;
                }
                else {
                    const result = this.cache.alloc(item.templateId);
                    item.row = result.row;
                    item.stale ||= result.isReusingConnectedDomNode;
                }
            }
            const role = this.accessibilityProvider.getRole(item.element) || 'listitem';
            item.row.domNode.setAttribute('role', role);
            const checked = this.accessibilityProvider.isChecked(item.element);
            if (typeof checked === 'boolean') {
                item.row.domNode.setAttribute('aria-checked', String(!!checked));
            }
            else if (checked) {
                const update = (checked) => item.row.domNode.setAttribute('aria-checked', String(!!checked));
                update(checked.value);
                item.checkedDisposable = checked.onDidChange(update);
            }
            if (item.stale || !item.row.domNode.parentElement) {
                const referenceNode = this.items.at(index + 1)?.row?.domNode ?? null;
                this.rowsContainer.insertBefore(item.row.domNode, referenceNode);
                item.stale = false;
            }
            this.updateItemInDOM(item, index);
            const renderer = this.renderers.get(item.templateId);
            if (!renderer) {
                throw new Error(`No renderer found for template id ${item.templateId}`);
            }
            renderer?.renderElement(item.element, index, item.row.templateData, item.size);
            const uri = this.dnd.getDragURI(item.element);
            item.dragStartDisposable.dispose();
            item.row.domNode.draggable = !!uri;
            if (uri) {
                item.dragStartDisposable = (0, dom_1.addDisposableListener)(item.row.domNode, 'dragstart', event => this.onDragStart(item.element, uri, event));
            }
            if (this.horizontalScrolling) {
                this.measureItemWidth(item);
                this.eventuallyUpdateScrollWidth();
            }
        }
        measureItemWidth(item) {
            if (!item.row || !item.row.domNode) {
                return;
            }
            item.row.domNode.style.width = 'fit-content';
            item.width = (0, dom_1.getContentWidth)(item.row.domNode);
            const style = (0, dom_1.getWindow)(item.row.domNode).getComputedStyle(item.row.domNode);
            if (style.paddingLeft) {
                item.width += parseFloat(style.paddingLeft);
            }
            if (style.paddingRight) {
                item.width += parseFloat(style.paddingRight);
            }
            item.row.domNode.style.width = '';
        }
        updateItemInDOM(item, index) {
            item.row.domNode.style.top = `${this.elementTop(index)}px`;
            if (this.setRowHeight) {
                item.row.domNode.style.height = `${item.size}px`;
            }
            if (this.setRowLineHeight) {
                item.row.domNode.style.lineHeight = `${item.size}px`;
            }
            item.row.domNode.setAttribute('data-index', `${index}`);
            item.row.domNode.setAttribute('data-last-element', index === this.length - 1 ? 'true' : 'false');
            item.row.domNode.setAttribute('data-parity', index % 2 === 0 ? 'even' : 'odd');
            item.row.domNode.setAttribute('aria-setsize', String(this.accessibilityProvider.getSetSize(item.element, index, this.length)));
            item.row.domNode.setAttribute('aria-posinset', String(this.accessibilityProvider.getPosInSet(item.element, index)));
            item.row.domNode.setAttribute('id', this.getElementDomId(index));
            item.row.domNode.classList.toggle('drop-target', item.dropTarget);
        }
        removeItemFromDOM(index) {
            const item = this.items[index];
            item.dragStartDisposable.dispose();
            item.checkedDisposable.dispose();
            if (item.row) {
                const renderer = this.renderers.get(item.templateId);
                if (renderer && renderer.disposeElement) {
                    renderer.disposeElement(item.element, index, item.row.templateData, item.size);
                }
                this.cache.release(item.row);
                item.row = null;
            }
            if (this.horizontalScrolling) {
                this.eventuallyUpdateScrollWidth();
            }
        }
        getScrollTop() {
            const scrollPosition = this.scrollableElement.getScrollPosition();
            return scrollPosition.scrollTop;
        }
        setScrollTop(scrollTop, reuseAnimation) {
            if (this.scrollableElementUpdateDisposable) {
                this.scrollableElementUpdateDisposable.dispose();
                this.scrollableElementUpdateDisposable = null;
                this.scrollableElement.setScrollDimensions({ scrollHeight: this.scrollHeight });
            }
            this.scrollableElement.setScrollPosition({ scrollTop, reuseAnimation });
        }
        getScrollLeft() {
            const scrollPosition = this.scrollableElement.getScrollPosition();
            return scrollPosition.scrollLeft;
        }
        setScrollLeft(scrollLeft) {
            if (this.scrollableElementUpdateDisposable) {
                this.scrollableElementUpdateDisposable.dispose();
                this.scrollableElementUpdateDisposable = null;
                this.scrollableElement.setScrollDimensions({ scrollWidth: this.scrollWidth });
            }
            this.scrollableElement.setScrollPosition({ scrollLeft });
        }
        get scrollTop() {
            return this.getScrollTop();
        }
        set scrollTop(scrollTop) {
            this.setScrollTop(scrollTop);
        }
        get scrollHeight() {
            return this._scrollHeight + (this.horizontalScrolling ? 10 : 0) + this.paddingBottom;
        }
        // Events
        get onMouseClick() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'click')).event, e => this.toMouseEvent(e), this.disposables); }
        get onMouseDblClick() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'dblclick')).event, e => this.toMouseEvent(e), this.disposables); }
        get onMouseMiddleClick() { return event_2.Event.filter(event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'auxclick')).event, e => this.toMouseEvent(e), this.disposables), e => e.browserEvent.button === 1, this.disposables); }
        get onMouseUp() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'mouseup')).event, e => this.toMouseEvent(e), this.disposables); }
        get onMouseDown() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'mousedown')).event, e => this.toMouseEvent(e), this.disposables); }
        get onMouseOver() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'mouseover')).event, e => this.toMouseEvent(e), this.disposables); }
        get onMouseMove() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'mousemove')).event, e => this.toMouseEvent(e), this.disposables); }
        get onMouseOut() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'mouseout')).event, e => this.toMouseEvent(e), this.disposables); }
        get onContextMenu() { return event_2.Event.any(event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'contextmenu')).event, e => this.toMouseEvent(e), this.disposables), event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, touch_1.EventType.Contextmenu)).event, e => this.toGestureEvent(e), this.disposables)); }
        get onTouchStart() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.domNode, 'touchstart')).event, e => this.toTouchEvent(e), this.disposables); }
        get onTap() { return event_2.Event.map(this.disposables.add(new event_1.DomEmitter(this.rowsContainer, touch_1.EventType.Tap)).event, e => this.toGestureEvent(e), this.disposables); }
        toMouseEvent(browserEvent) {
            const index = this.getItemIndexFromEventTarget(browserEvent.target || null);
            const item = typeof index === 'undefined' ? undefined : this.items[index];
            const element = item && item.element;
            return { browserEvent, index, element };
        }
        toTouchEvent(browserEvent) {
            const index = this.getItemIndexFromEventTarget(browserEvent.target || null);
            const item = typeof index === 'undefined' ? undefined : this.items[index];
            const element = item && item.element;
            return { browserEvent, index, element };
        }
        toGestureEvent(browserEvent) {
            const index = this.getItemIndexFromEventTarget(browserEvent.initialTarget || null);
            const item = typeof index === 'undefined' ? undefined : this.items[index];
            const element = item && item.element;
            return { browserEvent, index, element };
        }
        toDragEvent(browserEvent) {
            const index = this.getItemIndexFromEventTarget(browserEvent.target || null);
            const item = typeof index === 'undefined' ? undefined : this.items[index];
            const element = item && item.element;
            const sector = this.getTargetSector(browserEvent, index);
            return { browserEvent, index, element, sector };
        }
        onScroll(e) {
            try {
                const previousRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
                this.render(previousRenderRange, e.scrollTop, e.height, e.scrollLeft, e.scrollWidth);
                if (this.supportDynamicHeights) {
                    this._rerender(e.scrollTop, e.height, e.inSmoothScrolling);
                }
            }
            catch (err) {
                console.error('Got bad scroll event:', e);
                throw err;
            }
        }
        onTouchChange(event) {
            event.preventDefault();
            event.stopPropagation();
            this.scrollTop -= event.translationY;
        }
        // DND
        onDragStart(element, uri, event) {
            if (!event.dataTransfer) {
                return;
            }
            const elements = this.dnd.getDragElements(element);
            event.dataTransfer.effectAllowed = 'copyMove';
            event.dataTransfer.setData(dnd_1.DataTransfers.TEXT, uri);
            if (event.dataTransfer.setDragImage) {
                let label;
                if (this.dnd.getDragLabel) {
                    label = this.dnd.getDragLabel(elements, event);
                }
                if (typeof label === 'undefined') {
                    label = String(elements.length);
                }
                const dragImage = (0, dom_1.$)('.monaco-drag-image');
                dragImage.textContent = label;
                const getDragImageContainer = (e) => {
                    while (e && !e.classList.contains('monaco-workbench')) {
                        e = e.parentElement;
                    }
                    return e || this.domNode.ownerDocument;
                };
                const container = getDragImageContainer(this.domNode);
                container.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, -10, -10);
                setTimeout(() => container.removeChild(dragImage), 0);
            }
            this.domNode.classList.add('dragging');
            this.currentDragData = new ElementsDragAndDropData(elements);
            StaticDND.CurrentDragAndDropData = new ExternalElementsDragAndDropData(elements);
            this.dnd.onDragStart?.(this.currentDragData, event);
        }
        onDragOver(event) {
            event.browserEvent.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
            this.onDragLeaveTimeout.dispose();
            if (StaticDND.CurrentDragAndDropData && StaticDND.CurrentDragAndDropData.getData() === 'vscode-ui') {
                return false;
            }
            this.setupDragAndDropScrollTopAnimation(event.browserEvent);
            if (!event.browserEvent.dataTransfer) {
                return false;
            }
            // Drag over from outside
            if (!this.currentDragData) {
                if (StaticDND.CurrentDragAndDropData) {
                    // Drag over from another list
                    this.currentDragData = StaticDND.CurrentDragAndDropData;
                }
                else {
                    // Drag over from the desktop
                    if (!event.browserEvent.dataTransfer.types) {
                        return false;
                    }
                    this.currentDragData = new NativeDragAndDropData();
                }
            }
            const result = this.dnd.onDragOver(this.currentDragData, event.element, event.index, event.sector, event.browserEvent);
            this.canDrop = typeof result === 'boolean' ? result : result.accept;
            if (!this.canDrop) {
                this.currentDragFeedback = undefined;
                this.currentDragFeedbackDisposable.dispose();
                return false;
            }
            event.browserEvent.dataTransfer.dropEffect = (typeof result !== 'boolean' && result.effect?.type === 0 /* ListDragOverEffectType.Copy */) ? 'copy' : 'move';
            let feedback;
            if (typeof result !== 'boolean' && result.feedback) {
                feedback = result.feedback;
            }
            else {
                if (typeof event.index === 'undefined') {
                    feedback = [-1];
                }
                else {
                    feedback = [event.index];
                }
            }
            // sanitize feedback list
            feedback = (0, arrays_1.distinct)(feedback).filter(i => i >= -1 && i < this.length).sort((a, b) => a - b);
            feedback = feedback[0] === -1 ? [-1] : feedback;
            let dragOverEffectPosition = typeof result !== 'boolean' && result.effect && result.effect.position ? result.effect.position : "drop-target" /* ListDragOverEffectPosition.Over */;
            if (equalsDragFeedback(this.currentDragFeedback, feedback) && this.currentDragFeedbackPosition === dragOverEffectPosition) {
                return true;
            }
            this.currentDragFeedback = feedback;
            this.currentDragFeedbackPosition = dragOverEffectPosition;
            this.currentDragFeedbackDisposable.dispose();
            if (feedback[0] === -1) { // entire list feedback
                this.domNode.classList.add(dragOverEffectPosition);
                this.rowsContainer.classList.add(dragOverEffectPosition);
                this.currentDragFeedbackDisposable = (0, lifecycle_1.toDisposable)(() => {
                    this.domNode.classList.remove(dragOverEffectPosition);
                    this.rowsContainer.classList.remove(dragOverEffectPosition);
                });
            }
            else {
                if (feedback.length > 1 && dragOverEffectPosition !== "drop-target" /* ListDragOverEffectPosition.Over */) {
                    throw new Error('Can\'t use multiple feedbacks with position different than \'over\'');
                }
                // Make sure there is no flicker when moving between two items
                // Always use the before feedback if possible
                if (dragOverEffectPosition === "drop-target-after" /* ListDragOverEffectPosition.After */) {
                    if (feedback[0] < this.length - 1) {
                        feedback[0] += 1;
                        dragOverEffectPosition = "drop-target-before" /* ListDragOverEffectPosition.Before */;
                    }
                }
                for (const index of feedback) {
                    const item = this.items[index];
                    item.dropTarget = true;
                    item.row?.domNode.classList.add(dragOverEffectPosition);
                }
                this.currentDragFeedbackDisposable = (0, lifecycle_1.toDisposable)(() => {
                    for (const index of feedback) {
                        const item = this.items[index];
                        item.dropTarget = false;
                        item.row?.domNode.classList.remove(dragOverEffectPosition);
                    }
                });
            }
            return true;
        }
        onDragLeave(event) {
            this.onDragLeaveTimeout.dispose();
            this.onDragLeaveTimeout = (0, async_1.disposableTimeout)(() => this.clearDragOverFeedback(), 100, this.disposables);
            if (this.currentDragData) {
                this.dnd.onDragLeave?.(this.currentDragData, event.element, event.index, event.browserEvent);
            }
        }
        onDrop(event) {
            if (!this.canDrop) {
                return;
            }
            const dragData = this.currentDragData;
            this.teardownDragAndDropScrollTopAnimation();
            this.clearDragOverFeedback();
            this.domNode.classList.remove('dragging');
            this.currentDragData = undefined;
            StaticDND.CurrentDragAndDropData = undefined;
            if (!dragData || !event.browserEvent.dataTransfer) {
                return;
            }
            event.browserEvent.preventDefault();
            dragData.update(event.browserEvent.dataTransfer);
            this.dnd.drop(dragData, event.element, event.index, event.sector, event.browserEvent);
        }
        onDragEnd(event) {
            this.canDrop = false;
            this.teardownDragAndDropScrollTopAnimation();
            this.clearDragOverFeedback();
            this.domNode.classList.remove('dragging');
            this.currentDragData = undefined;
            StaticDND.CurrentDragAndDropData = undefined;
            this.dnd.onDragEnd?.(event);
        }
        clearDragOverFeedback() {
            this.currentDragFeedback = undefined;
            this.currentDragFeedbackPosition = undefined;
            this.currentDragFeedbackDisposable.dispose();
            this.currentDragFeedbackDisposable = lifecycle_1.Disposable.None;
        }
        // DND scroll top animation
        setupDragAndDropScrollTopAnimation(event) {
            if (!this.dragOverAnimationDisposable) {
                const viewTop = (0, dom_1.getTopLeftOffset)(this.domNode).top;
                this.dragOverAnimationDisposable = (0, dom_1.animate)((0, dom_1.getWindow)(this.domNode), this.animateDragAndDropScrollTop.bind(this, viewTop));
            }
            this.dragOverAnimationStopDisposable.dispose();
            this.dragOverAnimationStopDisposable = (0, async_1.disposableTimeout)(() => {
                if (this.dragOverAnimationDisposable) {
                    this.dragOverAnimationDisposable.dispose();
                    this.dragOverAnimationDisposable = undefined;
                }
            }, 1000, this.disposables);
            this.dragOverMouseY = event.pageY;
        }
        animateDragAndDropScrollTop(viewTop) {
            if (this.dragOverMouseY === undefined) {
                return;
            }
            const diff = this.dragOverMouseY - viewTop;
            const upperLimit = this.renderHeight - 35;
            if (diff < 35) {
                this.scrollTop += Math.max(-14, Math.floor(0.3 * (diff - 35)));
            }
            else if (diff > upperLimit) {
                this.scrollTop += Math.min(14, Math.floor(0.3 * (diff - upperLimit)));
            }
        }
        teardownDragAndDropScrollTopAnimation() {
            this.dragOverAnimationStopDisposable.dispose();
            if (this.dragOverAnimationDisposable) {
                this.dragOverAnimationDisposable.dispose();
                this.dragOverAnimationDisposable = undefined;
            }
        }
        // Util
        getTargetSector(browserEvent, targetIndex) {
            if (targetIndex === undefined) {
                return undefined;
            }
            const relativePosition = browserEvent.offsetY / this.items[targetIndex].size;
            const sector = Math.floor(relativePosition / 0.25);
            return (0, numbers_1.clamp)(sector, 0, 3);
        }
        getItemIndexFromEventTarget(target) {
            const scrollableElement = this.scrollableElement.getDomNode();
            let element = target;
            while (element instanceof HTMLElement && element !== this.rowsContainer && scrollableElement.contains(element)) {
                const rawIndex = element.getAttribute('data-index');
                if (rawIndex) {
                    const index = Number(rawIndex);
                    if (!isNaN(index)) {
                        return index;
                    }
                }
                element = element.parentElement;
            }
            return undefined;
        }
        getRenderRange(renderTop, renderHeight) {
            return {
                start: this.rangeMap.indexAt(renderTop),
                end: this.rangeMap.indexAfter(renderTop + renderHeight - 1)
            };
        }
        /**
         * Given a stable rendered state, checks every rendered element whether it needs
         * to be probed for dynamic height. Adjusts scroll height and top if necessary.
         */
        _rerender(renderTop, renderHeight, inSmoothScrolling) {
            const previousRenderRange = this.getRenderRange(renderTop, renderHeight);
            // Let's remember the second element's position, this helps in scrolling up
            // and preserving a linear upwards scroll movement
            let anchorElementIndex;
            let anchorElementTopDelta;
            if (renderTop === this.elementTop(previousRenderRange.start)) {
                anchorElementIndex = previousRenderRange.start;
                anchorElementTopDelta = 0;
            }
            else if (previousRenderRange.end - previousRenderRange.start > 1) {
                anchorElementIndex = previousRenderRange.start + 1;
                anchorElementTopDelta = this.elementTop(anchorElementIndex) - renderTop;
            }
            let heightDiff = 0;
            while (true) {
                const renderRange = this.getRenderRange(renderTop, renderHeight);
                let didChange = false;
                for (let i = renderRange.start; i < renderRange.end; i++) {
                    const diff = this.probeDynamicHeight(i);
                    if (diff !== 0) {
                        this.rangeMap.splice(i, 1, [this.items[i]]);
                    }
                    heightDiff += diff;
                    didChange = didChange || diff !== 0;
                }
                if (!didChange) {
                    if (heightDiff !== 0) {
                        this.eventuallyUpdateScrollDimensions();
                    }
                    const unrenderRanges = range_1.Range.relativeComplement(previousRenderRange, renderRange);
                    for (const range of unrenderRanges) {
                        for (let i = range.start; i < range.end; i++) {
                            if (this.items[i].row) {
                                this.removeItemFromDOM(i);
                            }
                        }
                    }
                    const renderRanges = range_1.Range.relativeComplement(renderRange, previousRenderRange).reverse();
                    for (const range of renderRanges) {
                        for (let i = range.end - 1; i >= range.start; i--) {
                            this.insertItemInDOM(i);
                        }
                    }
                    for (let i = renderRange.start; i < renderRange.end; i++) {
                        if (this.items[i].row) {
                            this.updateItemInDOM(this.items[i], i);
                        }
                    }
                    if (typeof anchorElementIndex === 'number') {
                        // To compute a destination scroll top, we need to take into account the current smooth scrolling
                        // animation, and then reuse it with a new target (to avoid prolonging the scroll)
                        // See https://github.com/microsoft/vscode/issues/104144
                        // See https://github.com/microsoft/vscode/pull/104284
                        // See https://github.com/microsoft/vscode/issues/107704
                        const deltaScrollTop = this.scrollable.getFutureScrollPosition().scrollTop - renderTop;
                        const newScrollTop = this.elementTop(anchorElementIndex) - anchorElementTopDelta + deltaScrollTop;
                        this.setScrollTop(newScrollTop, inSmoothScrolling);
                    }
                    this._onDidChangeContentHeight.fire(this.contentHeight);
                    return;
                }
            }
        }
        probeDynamicHeight(index) {
            const item = this.items[index];
            if (!!this.virtualDelegate.getDynamicHeight) {
                const newSize = this.virtualDelegate.getDynamicHeight(item.element);
                if (newSize !== null) {
                    const size = item.size;
                    item.size = newSize;
                    item.lastDynamicHeightWidth = this.renderWidth;
                    return newSize - size;
                }
            }
            if (!item.hasDynamicHeight || item.lastDynamicHeightWidth === this.renderWidth) {
                return 0;
            }
            if (!!this.virtualDelegate.hasDynamicHeight && !this.virtualDelegate.hasDynamicHeight(item.element)) {
                return 0;
            }
            const size = item.size;
            if (item.row) {
                item.row.domNode.style.height = '';
                item.size = item.row.domNode.offsetHeight;
                if (item.size === 0 && !(0, dom_1.isAncestor)(item.row.domNode, (0, dom_1.getWindow)(item.row.domNode).document.body)) {
                    console.warn('Measuring item node that is not in DOM! Add ListView to the DOM before measuring row height!');
                }
                item.lastDynamicHeightWidth = this.renderWidth;
                return item.size - size;
            }
            const { row } = this.cache.alloc(item.templateId);
            row.domNode.style.height = '';
            this.rowsContainer.appendChild(row.domNode);
            const renderer = this.renderers.get(item.templateId);
            if (!renderer) {
                throw new errors_1.BugIndicatingError('Missing renderer for templateId: ' + item.templateId);
            }
            renderer.renderElement(item.element, index, row.templateData, undefined);
            item.size = row.domNode.offsetHeight;
            renderer.disposeElement?.(item.element, index, row.templateData, undefined);
            this.virtualDelegate.setDynamicHeight?.(item.element, item.size);
            item.lastDynamicHeightWidth = this.renderWidth;
            this.rowsContainer.removeChild(row.domNode);
            this.cache.release(row);
            return item.size - size;
        }
        getElementDomId(index) {
            return `${this.domId}_${index}`;
        }
        // Dispose
        dispose() {
            for (const item of this.items) {
                item.dragStartDisposable.dispose();
                item.checkedDisposable.dispose();
                if (item.row) {
                    const renderer = this.renderers.get(item.row.templateId);
                    if (renderer) {
                        renderer.disposeElement?.(item.element, -1, item.row.templateData, undefined);
                        renderer.disposeTemplate(item.row.templateData);
                    }
                }
            }
            this.items = [];
            if (this.domNode && this.domNode.parentNode) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
            this.dragOverAnimationDisposable?.dispose();
            this.disposables.dispose();
        }
    }
    exports.ListView = ListView;
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseClick", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseDblClick", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseMiddleClick", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseUp", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseDown", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseOver", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseMove", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onMouseOut", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onContextMenu", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onTouchStart", null);
    __decorate([
        decorators_1.memoize
    ], ListView.prototype, "onTap", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9saXN0L2xpc3RWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQXlDaEcsTUFBTSxTQUFTLEdBQUc7UUFDakIsc0JBQXNCLEVBQUUsU0FBeUM7S0FDakUsQ0FBQztJQU1GLElBQWtCLG9CQU1qQjtJQU5ELFdBQWtCLG9CQUFvQjtRQUNyQyxnREFBZ0Q7UUFDaEQsNkRBQU8sQ0FBQTtRQUNQLDJFQUFjLENBQUE7UUFDZCxpRkFBaUIsQ0FBQTtRQUNqQixtRUFBVSxDQUFBLENBQUksYUFBYTtJQUM1QixDQUFDLEVBTmlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBTXJDO0lBaUNELE1BQU0sY0FBYyxHQUFHO1FBQ3RCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLGtCQUFrQixrQ0FBMEI7UUFDNUMsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixZQUFZLEVBQUUsSUFBSTtRQUNsQixxQkFBcUIsRUFBRSxLQUFLO1FBQzVCLEdBQUcsRUFBRTtZQUNKLGVBQWUsQ0FBSSxDQUFJLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxVQUFVLEtBQUssT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdCLFdBQVcsS0FBVyxDQUFDO1lBQ3ZCLFVBQVUsS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxLQUFLLENBQUM7WUFDVixPQUFPLEtBQUssQ0FBQztTQUNiO1FBQ0QsbUJBQW1CLEVBQUUsS0FBSztRQUMxQixxQkFBcUIsRUFBRSxJQUFJO1FBQzNCLHVCQUF1QixFQUFFLElBQUk7S0FDN0IsQ0FBQztJQUVGLE1BQWEsdUJBQXVCO1FBS25DLElBQVcsT0FBTztZQUNq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