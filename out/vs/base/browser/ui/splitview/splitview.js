/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/ui/sash/sash", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/scrollable", "vs/base/common/types", "vs/base/browser/ui/sash/sash", "vs/css!./splitview"], function (require, exports, dom_1, event_1, sash_1, scrollableElement_1, arrays_1, color_1, event_2, lifecycle_1, numbers_1, scrollable_1, types, sash_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SplitView = exports.Sizing = exports.LayoutPriority = exports.Orientation = void 0;
    Object.defineProperty(exports, "Orientation", { enumerable: true, get: function () { return sash_2.Orientation; } });
    const defaultStyles = {
        separatorBorder: color_1.Color.transparent
    };
    var LayoutPriority;
    (function (LayoutPriority) {
        LayoutPriority[LayoutPriority["Normal"] = 0] = "Normal";
        LayoutPriority[LayoutPriority["Low"] = 1] = "Low";
        LayoutPriority[LayoutPriority["High"] = 2] = "High";
    })(LayoutPriority || (exports.LayoutPriority = LayoutPriority = {}));
    class ViewItem {
        set size(size) {
            this._size = size;
        }
        get size() {
            return this._size;
        }
        get cachedVisibleSize() { return this._cachedVisibleSize; }
        get visible() {
            return typeof this._cachedVisibleSize === 'undefined';
        }
        setVisible(visible, size) {
            if (visible === this.visible) {
                return;
            }
            if (visible) {
                this.size = (0, numbers_1.clamp)(this._cachedVisibleSize, this.viewMinimumSize, this.viewMaximumSize);
                this._cachedVisibleSize = undefined;
            }
            else {
                this._cachedVisibleSize = typeof size === 'number' ? size : this.size;
                this.size = 0;
            }
            this.container.classList.toggle('visible', visible);
            try {
                this.view.setVisible?.(visible);
            }
            catch (e) {
                console.error('Splitview: Failed to set visible view');
                console.error(e);
            }
        }
        get minimumSize() { return this.visible ? this.view.minimumSize : 0; }
        get viewMinimumSize() { return this.view.minimumSize; }
        get maximumSize() { return this.visible ? this.view.maximumSize : 0; }
        get viewMaximumSize() { return this.view.maximumSize; }
        get priority() { return this.view.priority; }
        get proportionalLayout() { return this.view.proportionalLayout ?? true; }
        get snap() { return !!this.view.snap; }
        set enabled(enabled) {
            this.container.style.pointerEvents = enabled ? '' : 'none';
        }
        constructor(container, view, size, disposable) {
            this.container = container;
            this.view = view;
            this.disposable = disposable;
            this._cachedVisibleSize = undefined;
            if (typeof size === 'number') {
                this._size = size;
                this._cachedVisibleSize = undefined;
                container.classList.add('visible');
            }
            else {
                this._size = 0;
                this._cachedVisibleSize = size.cachedVisibleSize;
            }
        }
        layout(offset, layoutContext) {
            this.layoutContainer(offset);
            try {
                this.view.layout(this.size, offset, layoutContext);
            }
            catch (e) {
                console.error('Splitview: Failed to layout view');
                console.error(e);
            }
        }
        dispose() {
            this.disposable.dispose();
        }
    }
    class VerticalViewItem extends ViewItem {
        layoutContainer(offset) {
            this.container.style.top = `${offset}px`;
            this.container.style.height = `${this.size}px`;
        }
    }
    class HorizontalViewItem extends ViewItem {
        layoutContainer(offset) {
            this.container.style.left = `${offset}px`;
            this.container.style.width = `${this.size}px`;
        }
    }
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Busy"] = 1] = "Busy";
    })(State || (State = {}));
    var Sizing;
    (function (Sizing) {
        /**
         * When adding or removing views, distribute the delta space among
         * all other views.
         */
        Sizing.Distribute = { type: 'distribute' };
        /**
         * When adding or removing views, split the delta space with another
         * specific view, indexed by the provided `index`.
         */
        function Split(index) { return { type: 'split', index }; }
        Sizing.Split = Split;
        /**
         * When adding a view, use DistributeSizing when all pre-existing views are
         * distributed evenly, otherwise use SplitSizing.
         */
        function Auto(index) { return { type: 'auto', index }; }
        Sizing.Auto = Auto;
        /**
         * When adding or removing views, assume the view is invisible.
         */
        function Invisible(cachedVisibleSize) { return { type: 'invisible', cachedVisibleSize }; }
        Sizing.Invisible = Invisible;
    })(Sizing || (exports.Sizing = Sizing = {}));
    /**
     * The {@link SplitView} is the UI component which implements a one dimensional
     * flex-like layout algorithm for a collection of {@link IView} instances, which
     * are essentially HTMLElement instances with the following size constraints:
     *
     * - {@link IView.minimumSize}
     * - {@link IView.maximumSize}
     * - {@link IView.priority}
     * - {@link IView.snap}
     *
     * In case the SplitView doesn't have enough size to fit all views, it will overflow
     * its content with a scrollbar.
     *
     * In between each pair of views there will be a {@link Sash} allowing the user
     * to resize the views, making sure the constraints are respected.
     *
     * An optional {@link TLayoutContext layout context type} may be used in order to
     * pass along layout contextual data from the {@link SplitView.layout} method down
     * to each view's {@link IView.layout} calls.
     *
     * Features:
     * - Flex-like layout algorithm
     * - Snap support
     * - Orthogonal sash support, for corner sashes
     * - View hide/show support
     * - View swap/move support
     * - Alt key modifier behavior, macOS style
     */
    class SplitView extends lifecycle_1.Disposable {
        /**
         * The sum of all views' sizes.
         */
        get contentSize() { return this._contentSize; }
        /**
         * The amount of views in this {@link SplitView}.
         */
        get length() {
            return this.viewItems.length;
        }
        /**
         * The minimum size of this {@link SplitView}.
         */
        get minimumSize() {
            return this.viewItems.reduce((r, item) => r + item.minimumSize, 0);
        }
        /**
         * The maximum size of this {@link SplitView}.
         */
        get maximumSize() {
            return this.length === 0 ? Number.POSITIVE_INFINITY : this.viewItems.reduce((r, item) => r + item.maximumSize, 0);
        }
        get orthogonalStartSash() { return this._orthogonalStartSash; }
        get orthogonalEndSash() { return this._orthogonalEndSash; }
        get startSnappingEnabled() { return this._startSnappingEnabled; }
        get endSnappingEnabled() { return this._endSnappingEnabled; }
        /**
         * A reference to a sash, perpendicular to all sashes in this {@link SplitView},
         * located at the left- or top-most side of the SplitView.
         * Corner sashes will be created automatically at the intersections.
         */
        set orthogonalStartSash(sash) {
            for (const sashItem of this.sashItems) {
                sashItem.sash.orthogonalStartSash = sash;
            }
            this._orthogonalStartSash = sash;
        }
        /**
         * A reference to a sash, perpendicular to all sashes in this {@link SplitView},
         * located at the right- or bottom-most side of the SplitView.
         * Corner sashes will be created automatically at the intersections.
         */
        set orthogonalEndSash(sash) {
            for (const sashItem of this.sashItems) {
                sashItem.sash.orthogonalEndSash = sash;
            }
            this._orthogonalEndSash = sash;
        }
        /**
         * The internal sashes within this {@link SplitView}.
         */
        get sashes() {
            return this.sashItems.map(s => s.sash);
        }
        /**
         * Enable/disable snapping at the beginning of this {@link SplitView}.
         */
        set startSnappingEnabled(startSnappingEnabled) {
            if (this._startSnappingEnabled === startSnappingEnabled) {
                return;
            }
            this._startSnappingEnabled = startSnappingEnabled;
            this.updateSashEnablement();
        }
        /**
         * Enable/disable snapping at the end of this {@link SplitView}.
         */
        set endSnappingEnabled(endSnappingEnabled) {
            if (this._endSnappingEnabled === endSnappingEnabled) {
                return;
            }
            this._endSnappingEnabled = endSnappingEnabled;
            this.updateSashEnablement();
        }
        /**
         * Create a new {@link SplitView} instance.
         */
        constructor(container, options = {}) {
            super();
            this.size = 0;
            this._contentSize = 0;
            this.proportions = undefined;
            this.viewItems = [];
            this.sashItems = []; // used in tests
            this.state = State.Idle;
            this._onDidSashChange = this._register(new event_2.Emitter());
            this._onDidSashReset = this._register(new event_2.Emitter());
            this._startSnappingEnabled = true;
            this._endSnappingEnabled = true;
            /**
             * Fires whenever the user resizes a {@link Sash sash}.
             */
            this.onDidSashChange = this._onDidSashChange.event;
            /**
             * Fires whenever the user double clicks a {@link Sash sash}.
             */
            this.onDidSashReset = this._onDidSashReset.event;
            this.orientation = options.orientation ?? 0 /* Orientation.VERTICAL */;
            this.inverseAltBehavior = options.inverseAltBehavior ?? false;
            this.proportionalLayout = options.proportionalLayout ?? true;
            this.getSashOrthogonalSize = options.getSashOrthogonalSize;
            this.el = document.createElement('div');
            this.el.classList.add('monaco-split-view2');
            this.el.classList.add(this.orientation === 0 /* Orientation.VERTICAL */ ? 'vertical' : 'horizontal');
            container.appendChild(this.el);
            this.sashContainer = (0, dom_1.append)(this.el, (0, dom_1.$)('.sash-container'));
            this.viewContainer = (0, dom_1.$)('.split-view-container');
            this.scrollable = this._register(new scrollable_1.Scrollable({
                forceIntegerValues: true,
                smoothScrollDuration: 125,
                scheduleAtNextAnimationFrame: callback => (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.el), callback),
            }));
            this.scrollableElement = this._register(new scrollableElement_1.SmoothScrollableElement(this.viewContainer, {
                vertical: this.orientation === 0 /* Orientation.VERTICAL */ ? (options.scrollbarVisibility ?? 1 /* ScrollbarVisibility.Auto */) : 2 /* ScrollbarVisibility.Hidden */,
                horizontal: this.orientation === 1 /* Orientation.HORIZONTAL */ ? (options.scrollbarVisibility ?? 1 /* ScrollbarVisibility.Auto */) : 2 /* ScrollbarVisibility.Hidden */
            }, this.scrollable));
            // https://github.com/microsoft/vscode/issues/157737
            const onDidScrollViewContainer = this._register(new event_1.DomEmitter(this.viewContainer, 'scroll')).event;
            this._register(onDidScrollViewContainer(_ => {
                const position = this.scrollableElement.getScrollPosition();
                const scrollLeft = Math.abs(this.viewContainer.scrollLeft - position.scrollLeft) <= 1 ? undefined : this.viewContainer.scrollLeft;
                const scrollTop = Math.abs(this.viewContainer.scrollTop - position.scrollTop) <= 1 ? undefined : this.viewContainer.scrollTop;
                if (scrollLeft !== undefined || scrollTop !== undefined) {
                    this.scrollableElement.setScrollPosition({ scrollLeft, scrollTop });
                }
            }));
            this.onDidScroll = this.scrollableElement.onScroll;
            this._register(this.onDidScroll(e => {
                if (e.scrollTopChanged) {
                    this.viewContainer.scrollTop = e.scrollTop;
                }
                if (e.scrollLeftChanged) {
                    this.viewContainer.scrollLeft = e.scrollLeft;
                }
            }));
            (0, dom_1.append)(this.el, this.scrollableElement.getDomNode());
            this.style(options.styles || defaultStyles);
            // We have an existing set of view, add them now
            if (options.descriptor) {
                this.size = options.descriptor.size;
                options.descriptor.views.forEach((viewDescriptor, index) => {
                    const sizing = types.isUndefined(viewDescriptor.visible) || viewDescriptor.visible ? viewDescriptor.size : { type: 'invisible', cachedVisibleSize: viewDescriptor.size };
                    const view = viewDescriptor.view;
                    this.doAddView(view, sizing, index, true);
                });
                // Initialize content size and proportions for first layout
                this._contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
                this.saveProportions();
            }
        }
        style(styles) {
            if (styles.separatorBorder.isTransparent()) {
                this.el.classList.remove('separator-border');
                this.el.style.removeProperty('--separator-border');
            }
            else {
                this.el.classList.add('separator-border');
                this.el.style.setProperty('--separator-border', styles.separatorBorder.toString());
            }
        }
        /**
         * Add a {@link IView view} to this {@link SplitView}.
         *
         * @param view The view to add.
         * @param size Either a fixed size, or a dynamic {@link Sizing} strategy.
         * @param index The index to insert the view on.
         * @param skipLayout Whether layout should be skipped.
         */
        addView(view, size, index = this.viewItems.length, skipLayout) {
            this.doAddView(view, size, index, skipLayout);
        }
        /**
         * Remove a {@link IView view} from this {@link SplitView}.
         *
         * @param index The index where the {@link IView view} is located.
         * @param sizing Whether to distribute other {@link IView view}'s sizes.
         */
        removeView(index, sizing) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            try {
                if (sizing?.type === 'auto') {
                    if (this.areViewsDistributed()) {
                        sizing = { type: 'distribute' };
                    }
                    else {
                        sizing = { type: 'split', index: sizing.index };
                    }
                }
                // Save referene view, in case of `split` sizing
                const referenceViewItem = sizing?.type === 'split' ? this.viewItems[sizing.index] : undefined;
                // Remove view
                const viewItemToRemove = this.viewItems.splice(index, 1)[0];
                // Resize reference view, in case of `split` sizing
                if (referenceViewItem) {
                    referenceViewItem.size += viewItemToRemove.size;
                }
                // Remove sash
                if (this.viewItems.length >= 1) {
                    const sashIndex = Math.max(index - 1, 0);
                    const sashItem = this.sashItems.splice(sashIndex, 1)[0];
                    sashItem.disposable.dispose();
                }
                this.relayout();
                if (sizing?.type === 'distribute') {
                    this.distributeViewSizes();
                }
                const result = viewItemToRemove.view;
                viewItemToRemove.dispose();
                return result;
            }
            finally {
                this.state = State.Idle;
            }
        }
        removeAllViews() {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            try {
                const viewItems = this.viewItems.splice(0, this.viewItems.length);
                for (const viewItem of viewItems) {
                    viewItem.dispose();
                }
                const sashItems = this.sashItems.splice(0, this.sashItems.length);
                for (const sashItem of sashItems) {
                    sashItem.disposable.dispose();
                }
                this.relayout();
                return viewItems.map(i => i.view);
            }
            finally {
                this.state = State.Idle;
            }
        }
        /**
         * Move a {@link IView view} to a different index.
         *
         * @param from The source index.
         * @param to The target index.
         */
        moveView(from, to) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            const cachedVisibleSize = this.getViewCachedVisibleSize(from);
            const sizing = typeof cachedVisibleSize === 'undefined' ? this.getViewSize(from) : Sizing.Invisible(cachedVisibleSize);
            const view = this.removeView(from);
            this.addView(view, sizing, to);
        }
        /**
         * Swap two {@link IView views}.
         *
         * @param from The source index.
         * @param to The target index.
         */
        swapViews(from, to) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            if (from > to) {
                return this.swapViews(to, from);
            }
            const fromSize = this.getViewSize(from);
            const toSize = this.getViewSize(to);
            const toView = this.removeView(to);
            const fromView = this.removeView(from);
            this.addView(toView, fromSize, from);
            this.addView(fromView, toSize, to);
        }
        /**
         * Returns whether the {@link IView view} is visible.
         *
         * @param index The {@link IView view} index.
         */
        isViewVisible(index) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            const viewItem = this.viewItems[index];
            return viewItem.visible;
        }
        /**
         * Set a {@link IView view}'s visibility.
         *
         * @param index The {@link IView view} index.
         * @param visible Whether the {@link IView view} should be visible.
         */
        setViewVisible(index, visible) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            const viewItem = this.viewItems[index];
            viewItem.setVisible(visible);
            this.distributeEmptySpace(index);
            this.layoutViews();
            this.saveProportions();
        }
        /**
         * Returns the {@link IView view}'s size previously to being hidden.
         *
         * @param index The {@link IView view} index.
         */
        getViewCachedVisibleSize(index) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            const viewItem = this.viewItems[index];
            return viewItem.cachedVisibleSize;
        }
        /**
         * Layout the {@link SplitView}.
         *
         * @param size The entire size of the {@link SplitView}.
         * @param layoutContext An optional layout context to pass along to {@link IView views}.
         */
        layout(size, layoutContext) {
            const previousSize = Math.max(this.size, this._contentSize);
            this.size = size;
            this.layoutContext = layoutContext;
            if (!this.proportions) {
                const indexes = (0, arrays_1.range)(this.viewItems.length);
                const lowPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 1 /* LayoutPriority.Low */);
                const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* LayoutPriority.High */);
                this.resize(this.viewItems.length - 1, size - previousSize, undefined, lowPriorityIndexes, highPriorityIndexes);
            }
            else {
                let total = 0;
                for (let i = 0; i < this.viewItems.length; i++) {
                    const item = this.viewItems[i];
                    const proportion = this.proportions[i];
                    if (typeof proportion === 'number') {
                        total += proportion;
                    }
                    else {
                        size -= item.size;
                    }
                }
                for (let i = 0; i < this.viewItems.length; i++) {
                    const item = this.viewItems[i];
                    const proportion = this.proportions[i];
                    if (typeof proportion === 'number' && total > 0) {
                        item.size = (0, numbers_1.clamp)(Math.round(proportion * size / total), item.minimumSize, item.maximumSize);
                    }
                }
            }
            this.distributeEmptySpace();
            this.layoutViews();
        }
        saveProportions() {
            if (this.proportionalLayout && this._contentSize > 0) {
                this.proportions = this.viewItems.map(v => v.proportionalLayout && v.visible ? v.size / this._contentSize : undefined);
            }
        }
        onSashStart({ sash, start, alt }) {
            for (const item of this.viewItems) {
                item.enabled = false;
            }
            const index = this.sashItems.findIndex(item => item.sash === sash);
            // This way, we can press Alt while we resize a sash, macOS style!
            const disposable = (0, lifecycle_1.combinedDisposable)((0, dom_1.addDisposableListener)(this.el.ownerDocument.body, 'keydown', e => resetSashDragState(this.sashDragState.current, e.altKey)), (0, dom_1.addDisposableListener)(this.el.ownerDocument.body, 'keyup', () => resetSashDragState(this.sashDragState.current, false)));
            const resetSashDragState = (start, alt) => {
                const sizes = this.viewItems.map(i => i.size);
                let minDelta = Number.NEGATIVE_INFINITY;
                let maxDelta = Number.POSITIVE_INFINITY;
                if (this.inverseAltBehavior) {
                    alt = !alt;
                }
                if (alt) {
                    // When we're using the last sash with Alt, we're resizing
                    // the view to the left/up, instead of right/down as usual
                    // Thus, we must do the inverse of the usual
                    const isLastSash = index === this.sashItems.length - 1;
                    if (isLastSash) {
                        const viewItem = this.viewItems[index];
                        minDelta = (viewItem.minimumSize - viewItem.size) / 2;
                        maxDelta = (viewItem.maximumSize - viewItem.size) / 2;
                    }
                    else {
                        const viewItem = this.viewItems[index + 1];
                        minDelta = (viewItem.size - viewItem.maximumSize) / 2;
                        maxDelta = (viewItem.size - viewItem.minimumSize) / 2;
                    }
                }
                let snapBefore;
                let snapAfter;
                if (!alt) {
                    const upIndexes = (0, arrays_1.range)(index, -1);
                    const downIndexes = (0, arrays_1.range)(index + 1, this.viewItems.length);
                    const minDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].minimumSize - sizes[i]), 0);
                    const maxDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].viewMaximumSize - sizes[i]), 0);
                    const maxDeltaDown = downIndexes.length === 0 ? Number.POSITIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].minimumSize), 0);
                    const minDeltaDown = downIndexes.length === 0 ? Number.NEGATIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].viewMaximumSize), 0);
                    const minDelta = Math.max(minDeltaUp, minDeltaDown);
                    const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
                    const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                    const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                    if (typeof snapBeforeIndex === 'number') {
                        const viewItem = this.viewItems[snapBeforeIndex];
                        const halfSize = Math.floor(viewItem.viewMinimumSize / 2);
                        snapBefore = {
                            index: snapBeforeIndex,
                            limitDelta: viewItem.visible ? minDelta - halfSize : minDelta + halfSize,
                            size: viewItem.size
                        };
                    }
                    if (typeof snapAfterIndex === 'number') {
                        const viewItem = this.viewItems[snapAfterIndex];
                        const halfSize = Math.floor(viewItem.viewMinimumSize / 2);
                        snapAfter = {
                            index: snapAfterIndex,
                            limitDelta: viewItem.visible ? maxDelta + halfSize : maxDelta - halfSize,
                            size: viewItem.size
                        };
                    }
                }
                this.sashDragState = { start, current: start, index, sizes, minDelta, maxDelta, alt, snapBefore, snapAfter, disposable };
            };
            resetSashDragState(start, alt);
        }
        onSashChange({ current }) {
            const { index, start, sizes, alt, minDelta, maxDelta, snapBefore, snapAfter } = this.sashDragState;
            this.sashDragState.current = current;
            const delta = current - start;
            const newDelta = this.resize(index, delta, sizes, undefined, undefined, minDelta, maxDelta, snapBefore, snapAfter);
            if (alt) {
                const isLastSash = index === this.sashItems.length - 1;
                const newSizes = this.viewItems.map(i => i.size);
                const viewItemIndex = isLastSash ? index : index + 1;
                const viewItem = this.viewItems[viewItemIndex];
                const newMinDelta = viewItem.size - viewItem.maximumSize;
                const newMaxDelta = viewItem.size - viewItem.minimumSize;
                const resizeIndex = isLastSash ? index - 1 : index + 1;
                this.resize(resizeIndex, -newDelta, newSizes, undefined, undefined, newMinDelta, newMaxDelta);
            }
            this.distributeEmptySpace();
            this.layoutViews();
        }
        onSashEnd(index) {
            this._onDidSashChange.fire(index);
            this.sashDragState.disposable.dispose();
            this.saveProportions();
            for (const item of this.viewItems) {
                item.enabled = true;
            }
        }
        onViewChange(item, size) {
            const index = this.viewItems.indexOf(item);
            if (index < 0 || index >= this.viewItems.length) {
                return;
            }
            size = typeof size === 'number' ? size : item.size;
            size = (0, numbers_1.clamp)(size, item.minimumSize, item.maximumSize);
            if (this.inverseAltBehavior && index > 0) {
                // In this case, we want the view to grow or shrink both sides equally
                // so we just resize the "left" side by half and let `resize` do the clamping magic
                this.resize(index - 1, Math.floor((item.size - size) / 2));
                this.distributeEmptySpace();
                this.layoutViews();
            }
            else {
                item.size = size;
                this.relayout([index], undefined);
            }
        }
        /**
         * Resize a {@link IView view} within the {@link SplitView}.
         *
         * @param index The {@link IView view} index.
         * @param size The {@link IView view} size.
         */
        resizeView(index, size) {
            if (index < 0 || index >= this.viewItems.length) {
                return;
            }
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            try {
                const indexes = (0, arrays_1.range)(this.viewItems.length).filter(i => i !== index);
                const lowPriorityIndexes = [...indexes.filter(i => this.viewItems[i].priority === 1 /* LayoutPriority.Low */), index];
                const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* LayoutPriority.High */);
                const item = this.viewItems[index];
                size = Math.round(size);
                size = (0, numbers_1.clamp)(size, item.minimumSize, Math.min(item.maximumSize, this.size));
                item.size = size;
                this.relayout(lowPriorityIndexes, highPriorityIndexes);
            }
            finally {
                this.state = State.Idle;
            }
        }
        /**
         * Returns whether all other {@link IView views} are at their minimum size.
         */
        isViewExpanded(index) {
            if (index < 0 || index >= this.viewItems.length) {
                return false;
            }
            for (const item of this.viewItems) {
                if (item !== this.viewItems[index] && item.size > item.minimumSize) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Distribute the entire {@link SplitView} size among all {@link IView views}.
         */
        distributeViewSizes() {
            const flexibleViewItems = [];
            let flexibleSize = 0;
            for (const item of this.viewItems) {
                if (item.maximumSize - item.minimumSize > 0) {
                    flexibleViewItems.push(item);
                    flexibleSize += item.size;
                }
            }
            const size = Math.floor(flexibleSize / flexibleViewItems.length);
            for (const item of flexibleViewItems) {
                item.size = (0, numbers_1.clamp)(size, item.minimumSize, item.maximumSize);
            }
            const indexes = (0, arrays_1.range)(this.viewItems.length);
            const lowPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 1 /* LayoutPriority.Low */);
            const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* LayoutPriority.High */);
            this.relayout(lowPriorityIndexes, highPriorityIndexes);
        }
        /**
         * Returns the size of a {@link IView view}.
         */
        getViewSize(index) {
            if (index < 0 || index >= this.viewItems.length) {
                return -1;
            }
            return this.viewItems[index].size;
        }
        doAddView(view, size, index = this.viewItems.length, skipLayout) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            try {
                // Add view
                const container = (0, dom_1.$)('.split-view-view');
                if (index === this.viewItems.length) {
                    this.viewContainer.appendChild(container);
                }
                else {
                    this.viewContainer.insertBefore(container, this.viewContainer.children.item(index));
                }
                const onChangeDisposable = view.onDidChange(size => this.onViewChange(item, size));
                const containerDisposable = (0, lifecycle_1.toDisposable)(() => this.viewContainer.removeChild(container));
                const disposable = (0, lifecycle_1.combinedDisposable)(onChangeDisposable, containerDisposable);
                let viewSize;
                if (typeof size === 'number') {
                    viewSize = size;
                }
                else {
                    if (size.type === 'auto') {
                        if (this.areViewsDistributed()) {
                            size = { type: 'distribute' };
                        }
                        else {
                            size = { type: 'split', index: size.index };
                        }
                    }
                    if (size.type === 'split') {
                        viewSize = this.getViewSize(size.index) / 2;
                    }
                    else if (size.type === 'invisible') {
                        viewSize = { cachedVisibleSize: size.cachedVisibleSize };
                    }
                    else {
                        viewSize = view.minimumSize;
                    }
                }
                const item = this.orientation === 0 /* Orientation.VERTICAL */
                    ? new VerticalViewItem(container, view, viewSize, disposable)
                    : new HorizontalViewItem(container, view, viewSize, disposable);
                this.viewItems.splice(index, 0, item);
                // Add sash
                if (this.viewItems.length > 1) {
                    const opts = { orthogonalStartSash: this.orthogonalStartSash, orthogonalEndSash: this.orthogonalEndSash };
                    const sash = this.orientation === 0 /* Orientation.VERTICAL */
                        ? new sash_1.Sash(this.sashContainer, { getHorizontalSashTop: s => this.getSashPosition(s), getHorizontalSashWidth: this.getSashOrthogonalSize }, { ...opts, orientation: 1 /* Orientation.HORIZONTAL */ })
                        : new sash_1.Sash(this.sashContainer, { getVerticalSashLeft: s => this.getSashPosition(s), getVerticalSashHeight: this.getSashOrthogonalSize }, { ...opts, orientation: 0 /* Orientation.VERTICAL */ });
                    const sashEventMapper = this.orientation === 0 /* Orientation.VERTICAL */
                        ? (e) => ({ sash, start: e.startY, current: e.currentY, alt: e.altKey })
                        : (e) => ({ sash, start: e.startX, current: e.currentX, alt: e.altKey });
                    const onStart = event_2.Event.map(sash.onDidStart, sashEventMapper);
                    const onStartDisposable = onStart(this.onSashStart, this);
                    const onChange = event_2.Event.map(sash.onDidChange, sashEventMapper);
                    const onChangeDisposable = onChange(this.onSashChange, this);
                    const onEnd = event_2.Event.map(sash.onDidEnd, () => this.sashItems.findIndex(item => item.sash === sash));
                    const onEndDisposable = onEnd(this.onSashEnd, this);
                    const onDidResetDisposable = sash.onDidReset(() => {
                        const index = this.sashItems.findIndex(item => item.sash === sash);
                        const upIndexes = (0, arrays_1.range)(index, -1);
                        const downIndexes = (0, arrays_1.range)(index + 1, this.viewItems.length);
                        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                        if (typeof snapBeforeIndex === 'number' && !this.viewItems[snapBeforeIndex].visible) {
                            return;
                        }
                        if (typeof snapAfterIndex === 'number' && !this.viewItems[snapAfterIndex].visible) {
                            return;
                        }
                        this._onDidSashReset.fire(index);
                    });
                    const disposable = (0, lifecycle_1.combinedDisposable)(onStartDisposable, onChangeDisposable, onEndDisposable, onDidResetDisposable, sash);
                    const sashItem = { sash, disposable };
                    this.sashItems.splice(index - 1, 0, sashItem);
                }
                container.appendChild(view.element);
                let highPriorityIndexes;
                if (typeof size !== 'number' && size.type === 'split') {
                    highPriorityIndexes = [size.index];
                }
                if (!skipLayout) {
                    this.relayout([index], highPriorityIndexes);
                }
                if (!skipLayout && typeof size !== 'number' && size.type === 'distribute') {
                    this.distributeViewSizes();
                }
            }
            finally {
                this.state = State.Idle;
            }
        }
        relayout(lowPriorityIndexes, highPriorityIndexes) {
            const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            this.resize(this.viewItems.length - 1, this.size - contentSize, undefined, lowPriorityIndexes, highPriorityIndexes);
            this.distributeEmptySpace();
            this.layoutViews();
            this.saveProportions();
        }
        resize(index, delta, sizes = this.viewItems.map(i => i.size), lowPriorityIndexes, highPriorityIndexes, overloadMinDelta = Number.NEGATIVE_INFINITY, overloadMaxDelta = Number.POSITIVE_INFINITY, snapBefore, snapAfter) {
            if (index < 0 || index >= this.viewItems.length) {
                return 0;
            }
            const upIndexes = (0, arrays_1.range)(index, -1);
            const downIndexes = (0, arrays_1.range)(index + 1, this.viewItems.length);
            if (highPriorityIndexes) {
                for (const index of highPriorityIndexes) {
                    (0, arrays_1.pushToStart)(upIndexes, index);
                    (0, arrays_1.pushToStart)(downIndexes, index);
                }
            }
            if (lowPriorityIndexes) {
                for (const index of lowPriorityIndexes) {
                    (0, arrays_1.pushToEnd)(upIndexes, index);
                    (0, arrays_1.pushToEnd)(downIndexes, index);
                }
            }
            const upItems = upIndexes.map(i => this.viewItems[i]);
            const upSizes = upIndexes.map(i => sizes[i]);
            const downItems = downIndexes.map(i => this.viewItems[i]);
            const downSizes = downIndexes.map(i => sizes[i]);
            const minDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].minimumSize - sizes[i]), 0);
            const maxDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].maximumSize - sizes[i]), 0);
            const maxDeltaDown = downIndexes.length === 0 ? Number.POSITIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].minimumSize), 0);
            const minDeltaDown = downIndexes.length === 0 ? Number.NEGATIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].maximumSize), 0);
            const minDelta = Math.max(minDeltaUp, minDeltaDown, overloadMinDelta);
            const maxDelta = Math.min(maxDeltaDown, maxDeltaUp, overloadMaxDelta);
            let snapped = false;
            if (snapBefore) {
                const snapView = this.viewItems[snapBefore.index];
                const visible = delta >= snapBefore.limitDelta;
                snapped = visible !== snapView.visible;
                snapView.setVisible(visible, snapBefore.size);
            }
            if (!snapped && snapAfter) {
                const snapView = this.viewItems[snapAfter.index];
                const visible = delta < snapAfter.limitDelta;
                snapped = visible !== snapView.visible;
                snapView.setVisible(visible, snapAfter.size);
            }
            if (snapped) {
                return this.resize(index, delta, sizes, lowPriorityIndexes, highPriorityIndexes, overloadMinDelta, overloadMaxDelta);
            }
            delta = (0, numbers_1.clamp)(delta, minDelta, maxDelta);
            for (let i = 0, deltaUp = delta; i < upItems.length; i++) {
                const item = upItems[i];
                const size = (0, numbers_1.clamp)(upSizes[i] + deltaUp, item.minimumSize, item.maximumSize);
                const viewDelta = size - upSizes[i];
                deltaUp -= viewDelta;
                item.size = size;
            }
            for (let i = 0, deltaDown = delta; i < downItems.length; i++) {
                const item = downItems[i];
                const size = (0, numbers_1.clamp)(downSizes[i] - deltaDown, item.minimumSize, item.maximumSize);
                const viewDelta = size - downSizes[i];
                deltaDown += viewDelta;
                item.size = size;
            }
            return delta;
        }
        distributeEmptySpace(lowPriorityIndex) {
            const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            let emptyDelta = this.size - contentSize;
            const indexes = (0, arrays_1.range)(this.viewItems.length - 1, -1);
            const lowPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 1 /* LayoutPriority.Low */);
            const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* LayoutPriority.High */);
            for (const index of highPriorityIndexes) {
                (0, arrays_1.pushToStart)(indexes, index);
            }
            for (const index of lowPriorityIndexes) {
                (0, arrays_1.pushToEnd)(indexes, index);
            }
            if (typeof lowPriorityIndex === 'number') {
                (0, arrays_1.pushToEnd)(indexes, lowPriorityIndex);
            }
            for (let i = 0; emptyDelta !== 0 && i < indexes.length; i++) {
                const item = this.viewItems[indexes[i]];
                const size = (0, numbers_1.clamp)(item.size + emptyDelta, item.minimumSize, item.maximumSize);
                const viewDelta = size - item.size;
                emptyDelta -= viewDelta;
                item.size = size;
            }
        }
        layoutViews() {
            // Save new content size
            this._contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            // Layout views
            let offset = 0;
            for (const viewItem of this.viewItems) {
                viewItem.layout(offset, this.layoutContext);
                offset += viewItem.size;
            }
            // Layout sashes
            this.sashItems.forEach(item => item.sash.layout());
            this.updateSashEnablement();
            this.updateScrollableElement();
        }
        updateScrollableElement() {
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                this.scrollableElement.setScrollDimensions({
                    height: this.size,
                    scrollHeight: this._contentSize
                });
            }
            else {
                this.scrollableElement.setScrollDimensions({
                    width: this.size,
                    scrollWidth: this._contentSize
                });
            }
        }
        updateSashEnablement() {
            let previous = false;
            const collapsesDown = this.viewItems.map(i => previous = (i.size - i.minimumSize > 0) || previous);
            previous = false;
            const expandsDown = this.viewItems.map(i => previous = (i.maximumSize - i.size > 0) || previous);
            const reverseViews = [...this.viewItems].reverse();
            previous = false;
            const collapsesUp = reverseViews.map(i => previous = (i.size - i.minimumSize > 0) || previous).reverse();
            previous = false;
            const expandsUp = reverseViews.map(i => previous = (i.maximumSize - i.size > 0) || previous).reverse();
            let position = 0;
            for (let index = 0; index < this.sashItems.length; index++) {
                const { sash } = this.sashItems[index];
                const viewItem = this.viewItems[index];
                position += viewItem.size;
                const min = !(collapsesDown[index] && expandsUp[index + 1]);
                const max = !(expandsDown[index] && collapsesUp[index + 1]);
                if (min && max) {
                    const upIndexes = (0, arrays_1.range)(index, -1);
                    const downIndexes = (0, arrays_1.range)(index + 1, this.viewItems.length);
                    const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                    const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                    const snappedBefore = typeof snapBeforeIndex === 'number' && !this.viewItems[snapBeforeIndex].visible;
                    const snappedAfter = typeof snapAfterIndex === 'number' && !this.viewItems[snapAfterIndex].visible;
                    if (snappedBefore && collapsesUp[index] && (position > 0 || this.startSnappingEnabled)) {
                        sash.state = 1 /* SashState.AtMinimum */;
                    }
                    else if (snappedAfter && collapsesDown[index] && (position < this._contentSize || this.endSnappingEnabled)) {
                        sash.state = 2 /* SashState.AtMaximum */;
                    }
                    else {
                        sash.state = 0 /* SashState.Disabled */;
                    }
                }
                else if (min && !max) {
                    sash.state = 1 /* SashState.AtMinimum */;
                }
                else if (!min && max) {
                    sash.state = 2 /* SashState.AtMaximum */;
                }
                else {
                    sash.state = 3 /* SashState.Enabled */;
                }
            }
        }
        getSashPosition(sash) {
            let position = 0;
            for (let i = 0; i < this.sashItems.length; i++) {
                position += this.viewItems[i].size;
                if (this.sashItems[i].sash === sash) {
                    return position;
                }
            }
            return 0;
        }
        findFirstSnapIndex(indexes) {
            // visible views first
            for (const index of indexes) {
                const viewItem = this.viewItems[index];
                if (!viewItem.visible) {
                    continue;
                }
                if (viewItem.snap) {
                    return index;
                }
            }
            // then, hidden views
            for (const index of indexes) {
                const viewItem = this.viewItems[index];
                if (viewItem.visible && viewItem.maximumSize - viewItem.minimumSize > 0) {
                    return undefined;
                }
                if (!viewItem.visible && viewItem.snap) {
                    return index;
                }
            }
            return undefined;
        }
        areViewsDistributed() {
            let min = undefined, max = undefined;
            for (const view of this.viewItems) {
                min = min === undefined ? view.size : Math.min(min, view.size);
                max = max === undefined ? view.size : Math.max(max, view.size);
                if (max - min > 2) {
                    return false;
                }
            }
            return true;
        }
        dispose() {
            this.sashDragState?.disposable.dispose();
            (0, lifecycle_1.dispose)(this.viewItems);
            this.viewItems = [];
            this.sashItems.forEach(i => i.disposable.dispose());
            this.sashItems = [];
            super.dispose();
        }
    }
    exports.SplitView = SplitView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsaXR2aWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvc3BsaXR2aWV3L3NwbGl0dmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjdkYsbUdBQUEsV0FBVyxPQUFBO0lBTXBCLE1BQU0sYUFBYSxHQUFxQjtRQUN2QyxlQUFlLEVBQUUsYUFBSyxDQUFDLFdBQVc7S0FDbEMsQ0FBQztJQUVGLElBQWtCLGNBSWpCO0lBSkQsV0FBa0IsY0FBYztRQUMvQix1REFBTSxDQUFBO1FBQ04saURBQUcsQ0FBQTtRQUNILG1EQUFJLENBQUE7SUFDTCxDQUFDLEVBSmlCLGNBQWMsOEJBQWQsY0FBYyxRQUkvQjtJQWtMRCxNQUFlLFFBQVE7UUFHdEIsSUFBSSxJQUFJLENBQUMsSUFBWTtZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFHRCxJQUFJLGlCQUFpQixLQUF5QixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFFL0UsSUFBSSxPQUFPO1lBQ1YsT0FBTyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsS0FBSyxXQUFXLENBQUM7UUFDdkQsQ0FBQztRQUVELFVBQVUsQ0FBQyxPQUFnQixFQUFFLElBQWE7WUFDekMsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFBLGVBQUssRUFBQyxJQUFJLENBQUMsa0JBQW1CLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJ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