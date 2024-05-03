/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/types", "vs/base/browser/ui/sash/sash", "vs/base/browser/ui/splitview/splitview", "vs/css!./gridview"], function (require, exports, dom_1, splitview_1, arrays_1, color_1, event_1, lifecycle_1, numbers_1, types_1, sash_1, splitview_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GridView = exports.Sizing = exports.LayoutPriority = exports.Orientation = void 0;
    exports.orthogonal = orthogonal;
    exports.isGridBranchNode = isGridBranchNode;
    Object.defineProperty(exports, "Orientation", { enumerable: true, get: function () { return sash_1.Orientation; } });
    Object.defineProperty(exports, "LayoutPriority", { enumerable: true, get: function () { return splitview_2.LayoutPriority; } });
    Object.defineProperty(exports, "Sizing", { enumerable: true, get: function () { return splitview_2.Sizing; } });
    const defaultStyles = {
        separatorBorder: color_1.Color.transparent
    };
    function orthogonal(orientation) {
        return orientation === 0 /* Orientation.VERTICAL */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
    }
    function isGridBranchNode(node) {
        return !!node.children;
    }
    class LayoutController {
        constructor(isLayoutEnabled) {
            this.isLayoutEnabled = isLayoutEnabled;
        }
    }
    function toAbsoluteBoundarySashes(sashes, orientation) {
        if (orientation === 1 /* Orientation.HORIZONTAL */) {
            return { left: sashes.start, right: sashes.end, top: sashes.orthogonalStart, bottom: sashes.orthogonalEnd };
        }
        else {
            return { top: sashes.start, bottom: sashes.end, left: sashes.orthogonalStart, right: sashes.orthogonalEnd };
        }
    }
    function fromAbsoluteBoundarySashes(sashes, orientation) {
        if (orientation === 1 /* Orientation.HORIZONTAL */) {
            return { start: sashes.left, end: sashes.right, orthogonalStart: sashes.top, orthogonalEnd: sashes.bottom };
        }
        else {
            return { start: sashes.top, end: sashes.bottom, orthogonalStart: sashes.left, orthogonalEnd: sashes.right };
        }
    }
    function validateIndex(index, numChildren) {
        if (Math.abs(index) > numChildren) {
            throw new Error('Invalid index');
        }
        return (0, numbers_1.rot)(index, numChildren + 1);
    }
    class BranchNode {
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        get absoluteOffset() { return this._absoluteOffset; }
        get absoluteOrthogonalOffset() { return this._absoluteOrthogonalOffset; }
        get styles() { return this._styles; }
        get width() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.size : this.orthogonalSize;
        }
        get height() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.orthogonalSize : this.size;
        }
        get top() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._absoluteOffset : this._absoluteOrthogonalOffset;
        }
        get left() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._absoluteOrthogonalOffset : this._absoluteOffset;
        }
        get minimumSize() {
            return this.children.length === 0 ? 0 : Math.max(...this.children.map((c, index) => this.splitview.isViewVisible(index) ? c.minimumOrthogonalSize : 0));
        }
        get maximumSize() {
            return Math.min(...this.children.map((c, index) => this.splitview.isViewVisible(index) ? c.maximumOrthogonalSize : Number.POSITIVE_INFINITY));
        }
        get priority() {
            if (this.children.length === 0) {
                return 0 /* LayoutPriority.Normal */;
            }
            const priorities = this.children.map(c => typeof c.priority === 'undefined' ? 0 /* LayoutPriority.Normal */ : c.priority);
            if (priorities.some(p => p === 2 /* LayoutPriority.High */)) {
                return 2 /* LayoutPriority.High */;
            }
            else if (priorities.some(p => p === 1 /* LayoutPriority.Low */)) {
                return 1 /* LayoutPriority.Low */;
            }
            return 0 /* LayoutPriority.Normal */;
        }
        get proportionalLayout() {
            if (this.children.length === 0) {
                return true;
            }
            return this.children.every(c => c.proportionalLayout);
        }
        get minimumOrthogonalSize() {
            return this.splitview.minimumSize;
        }
        get maximumOrthogonalSize() {
            return this.splitview.maximumSize;
        }
        get minimumWidth() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumOrthogonalSize : this.minimumSize;
        }
        get minimumHeight() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumSize : this.minimumOrthogonalSize;
        }
        get maximumWidth() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumOrthogonalSize : this.maximumSize;
        }
        get maximumHeight() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumSize : this.maximumOrthogonalSize;
        }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            if (this._boundarySashes.start === boundarySashes.start
                && this._boundarySashes.end === boundarySashes.end
                && this._boundarySashes.orthogonalStart === boundarySashes.orthogonalStart
                && this._boundarySashes.orthogonalEnd === boundarySashes.orthogonalEnd) {
                return;
            }
            this._boundarySashes = boundarySashes;
            this.splitview.orthogonalStartSash = boundarySashes.orthogonalStart;
            this.splitview.orthogonalEndSash = boundarySashes.orthogonalEnd;
            for (let index = 0; index < this.children.length; index++) {
                const child = this.children[index];
                const first = index === 0;
                const last = index === this.children.length - 1;
                child.boundarySashes = {
                    start: boundarySashes.orthogonalStart,
                    end: boundarySashes.orthogonalEnd,
                    orthogonalStart: first ? boundarySashes.start : child.boundarySashes.orthogonalStart,
                    orthogonalEnd: last ? boundarySashes.end : child.boundarySashes.orthogonalEnd,
                };
            }
        }
        get edgeSnapping() { return this._edgeSnapping; }
        set edgeSnapping(edgeSnapping) {
            if (this._edgeSnapping === edgeSnapping) {
                return;
            }
            this._edgeSnapping = edgeSnapping;
            for (const child of this.children) {
                if (child instanceof BranchNode) {
                    child.edgeSnapping = edgeSnapping;
                }
            }
            this.updateSplitviewEdgeSnappingEnablement();
        }
        constructor(orientation, layoutController, styles, splitviewProportionalLayout, size = 0, orthogonalSize = 0, edgeSnapping = false, childDescriptors) {
            this.orientation = orientation;
            this.layoutController = layoutController;
            this.splitviewProportionalLayout = splitviewProportionalLayout;
            this.children = [];
            this._absoluteOffset = 0;
            this._absoluteOrthogonalOffset = 0;
            this.absoluteOrthogonalSize = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._onDidVisibilityChange = new event_1.Emitter();
            this.onDidVisibilityChange = this._onDidVisibilityChange.event;
            this.childrenVisibilityChangeDisposable = new lifecycle_1.DisposableStore();
            this._onDidScroll = new event_1.Emitter();
            this.onDidScrollDisposable = lifecycle_1.Disposable.None;
            this.onDidScroll = this._onDidScroll.event;
            this.childrenChangeDisposable = lifecycle_1.Disposable.None;
            this._onDidSashReset = new event_1.Emitter();
            this.onDidSashReset = this._onDidSashReset.event;
            this.splitviewSashResetDisposable = lifecycle_1.Disposable.None;
            this.childrenSashResetDisposable = lifecycle_1.Disposable.None;
            this._boundarySashes = {};
            this._edgeSnapping = false;
            this._styles = styles;
            this._size = size;
            this._orthogonalSize = orthogonalSize;
            this.element = (0, dom_1.$)('.monaco-grid-branch-node');
            if (!childDescriptors) {
                // Normal behavior, we have no children yet, just set up the splitview
                this.splitview = new splitview_1.SplitView(this.element, { orientation, styles, proportionalLayout: splitviewProportionalLayout });
                this.splitview.layout(size, { orthogonalSize, absoluteOffset: 0, absoluteOrthogonalOffset: 0, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
            }
            else {
                // Reconstruction behavior, we want to reconstruct a splitview
                const descriptor = {
                    views: childDescriptors.map(childDescriptor => {
                        return {
                            view: childDescriptor.node,
                            size: childDescriptor.node.size,
                            visible: childDescriptor.visible !== false
                        };
                    }),
                    size: this.orthogonalSize
                };
                const options = { proportionalLayout: splitviewProportionalLayout, orientation, styles };
                this.children = childDescriptors.map(c => c.node);
                this.splitview = new splitview_1.SplitView(this.element, { ...options, descriptor });
                this.children.forEach((node, index) => {
                    const first = index === 0;
                    const last = index === this.children.length;
                    node.boundarySashes = {
                        start: this.boundarySashes.orthogonalStart,
                        end: this.boundarySashes.orthogonalEnd,
                        orthogonalStart: first ? this.boundarySashes.start : this.splitview.sashes[index - 1],
                        orthogonalEnd: last ? this.boundarySashes.end : this.splitview.sashes[index],
                    };
                });
            }
            const onDidSashReset = event_1.Event.map(this.splitview.onDidSashReset, i => [i]);
            this.splitviewSashResetDisposable = onDidSashReset(this._onDidSashReset.fire, this._onDidSashReset);
            this.updateChildrenEvents();
        }
        style(styles) {
            this._styles = styles;
            this.splitview.style(styles);
            for (const child of this.children) {
                if (child instanceof BranchNode) {
                    child.style(styles);
                }
            }
        }
        layout(size, offset, ctx) {
            if (!this.layoutController.isLayoutEnabled) {
                return;
            }
            if (typeof ctx === 'undefined') {
                throw new Error('Invalid state');
            }
            // branch nodes should flip the normal/orthogonal directions
            this._size = ctx.orthogonalSize;
            this._orthogonalSize = size;
            this._absoluteOffset = ctx.absoluteOffset + offset;
            this._absoluteOrthogonalOffset = ctx.absoluteOrthogonalOffset;
            this.absoluteOrthogonalSize = ctx.absoluteOrthogonalSize;
            this.splitview.layout(ctx.orthogonalSize, {
                orthogonalSize: size,
                absoluteOffset: this._absoluteOrthogonalOffset,
                absoluteOrthogonalOffset: this._absoluteOffset,
                absoluteSize: ctx.absoluteOrthogonalSize,
                absoluteOrthogonalSize: ctx.absoluteSize
            });
            this.updateSplitviewEdgeSnappingEnablement();
        }
        setVisible(visible) {
            for (const child of this.children) {
                child.setVisible(visible);
            }
        }
        addChild(node, size, index, skipLayout) {
            index = validateIndex(index, this.children.length);
            this.splitview.addView(node, size, index, skipLayout);
            this.children.splice(index, 0, node);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
        }
        removeChild(index, sizing) {
            index = validateIndex(index, this.children.length);
            const result = this.splitview.removeView(index, sizing);
            this.children.splice(index, 1);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
            return result;
        }
        removeAllChildren() {
            const result = this.splitview.removeAllViews();
            this.children.splice(0, this.children.length);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
            return result;
        }
        moveChild(from, to) {
            from = validateIndex(from, this.children.length);
            to = validateIndex(to, this.children.length);
            if (from === to) {
                return;
            }
            if (from < to) {
                to -= 1;
            }
            this.splitview.moveView(from, to);
            this.children.splice(to, 0, this.children.splice(from, 1)[0]);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
        }
        swapChildren(from, to) {
            from = validateIndex(from, this.children.length);
            to = validateIndex(to, this.children.length);
            if (from === to) {
                return;
            }
            this.splitview.swapViews(from, to);
            // swap boundary sashes
            [this.children[from].boundarySashes, this.children[to].boundarySashes]
                = [this.children[from].boundarySashes, this.children[to].boundarySashes];
            // swap children
            [this.children[from], this.children[to]] = [this.children[to], this.children[from]];
            this.onDidChildrenChange();
        }
        resizeChild(index, size) {
            index = validateIndex(index, this.children.length);
            this.splitview.resizeView(index, size);
        }
        isChildExpanded(index) {
            return this.splitview.isViewExpanded(index);
        }
        distributeViewSizes(recursive = false) {
            this.splitview.distributeViewSizes();
            if (recursive) {
                for (const child of this.children) {
                    if (child instanceof BranchNode) {
                        child.distributeViewSizes(true);
                    }
                }
            }
        }
        getChildSize(index) {
            index = validateIndex(index, this.children.length);
            return this.splitview.getViewSize(index);
        }
        isChildVisible(index) {
            index = validateIndex(index, this.children.length);
            return this.splitview.isViewVisible(index);
        }
        setChildVisible(index, visible) {
            index = validateIndex(index, this.children.length);
            if (this.splitview.isViewVisible(index) === visible) {
                return;
            }
            const wereAllChildrenHidden = this.splitview.contentSize === 0;
            this.splitview.setViewVisible(index, visible);
            const areAllChildrenHidden = this.splitview.contentSize === 0;
            // If all children are hidden then the parent should hide the entire splitview
            // If the entire splitview is hidden then the parent should show the splitview when a child is shown
            if ((visible && wereAllChildrenHidden) || (!visible && areAllChildrenHidden)) {
                this._onDidVisibilityChange.fire(visible);
            }
        }
        getChildCachedVisibleSize(index) {
            index = validateIndex(index, this.children.length);
            return this.splitview.getViewCachedVisibleSize(index);
        }
        updateBoundarySashes() {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].boundarySashes = {
                    start: this.boundarySashes.orthogonalStart,
                    end: this.boundarySashes.orthogonalEnd,
                    orthogonalStart: i === 0 ? this.boundarySashes.start : this.splitview.sashes[i - 1],
                    orthogonalEnd: i === this.children.length - 1 ? this.boundarySashes.end : this.splitview.sashes[i],
                };
            }
        }
        onDidChildrenChange() {
            this.updateChildrenEvents();
            this._onDidChange.fire(undefined);
        }
        updateChildrenEvents() {
            const onDidChildrenChange = event_1.Event.map(event_1.Event.any(...this.children.map(c => c.onDidChange)), () => undefined);
            this.childrenChangeDisposable.dispose();
            this.childrenChangeDisposable = onDidChildrenChange(this._onDidChange.fire, this._onDidChange);
            const onDidChildrenSashReset = event_1.Event.any(...this.children.map((c, i) => event_1.Event.map(c.onDidSashReset, location => [i, ...location])));
            this.childrenSashResetDisposable.dispose();
            this.childrenSashResetDisposable = onDidChildrenSashReset(this._onDidSashReset.fire, this._onDidSashReset);
            const onDidScroll = event_1.Event.any(event_1.Event.signal(this.splitview.onDidScroll), ...this.children.map(c => c.onDidScroll));
            this.onDidScrollDisposable.dispose();
            this.onDidScrollDisposable = onDidScroll(this._onDidScroll.fire, this._onDidScroll);
            this.childrenVisibilityChangeDisposable.clear();
            this.children.forEach((child, index) => {
                if (child instanceof BranchNode) {
                    this.childrenVisibilityChangeDisposable.add(child.onDidVisibilityChange((visible) => {
                        this.setChildVisible(index, visible);
                    }));
                }
            });
        }
        trySet2x2(other) {
            if (this.children.length !== 2 || other.children.length !== 2) {
                return lifecycle_1.Disposable.None;
            }
            if (this.getChildSize(0) !== other.getChildSize(0)) {
                return lifecycle_1.Disposable.None;
            }
            const [firstChild, secondChild] = this.children;
            const [otherFirstChild, otherSecondChild] = other.children;
            if (!(firstChild instanceof LeafNode) || !(secondChild instanceof LeafNode)) {
                return lifecycle_1.Disposable.None;
            }
            if (!(otherFirstChild instanceof LeafNode) || !(otherSecondChild instanceof LeafNode)) {
                return lifecycle_1.Disposable.None;
            }
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                secondChild.linkedWidthNode = otherFirstChild.linkedHeightNode = firstChild;
                firstChild.linkedWidthNode = otherSecondChild.linkedHeightNode = secondChild;
                otherSecondChild.linkedWidthNode = firstChild.linkedHeightNode = otherFirstChild;
                otherFirstChild.linkedWidthNode = secondChild.linkedHeightNode = otherSecondChild;
            }
            else {
                otherFirstChild.linkedWidthNode = secondChild.linkedHeightNode = firstChild;
                otherSecondChild.linkedWidthNode = firstChild.linkedHeightNode = secondChild;
                firstChild.linkedWidthNode = otherSecondChild.linkedHeightNode = otherFirstChild;
                secondChild.linkedWidthNode = otherFirstChild.linkedHeightNode = otherSecondChild;
            }
            const mySash = this.splitview.sashes[0];
            const otherSash = other.splitview.sashes[0];
            mySash.linkedSash = otherSash;
            otherSash.linkedSash = mySash;
            this._onDidChange.fire(undefined);
            other._onDidChange.fire(undefined);
            return (0, lifecycle_1.toDisposable)(() => {
                mySash.linkedSash = otherSash.linkedSash = undefined;
                firstChild.linkedHeightNode = firstChild.linkedWidthNode = undefined;
                secondChild.linkedHeightNode = secondChild.linkedWidthNode = undefined;
                otherFirstChild.linkedHeightNode = otherFirstChild.linkedWidthNode = undefined;
                otherSecondChild.linkedHeightNode = otherSecondChild.linkedWidthNode = undefined;
            });
        }
        updateSplitviewEdgeSnappingEnablement() {
            this.splitview.startSnappingEnabled = this._edgeSnapping || this._absoluteOrthogonalOffset > 0;
            this.splitview.endSnappingEnabled = this._edgeSnapping || this._absoluteOrthogonalOffset + this._size < this.absoluteOrthogonalSize;
        }
        dispose() {
            for (const child of this.children) {
                child.dispose();
            }
            this._onDidChange.dispose();
            this._onDidSashReset.dispose();
            this._onDidVisibilityChange.dispose();
            this.childrenVisibilityChangeDisposable.dispose();
            this.splitviewSashResetDisposable.dispose();
            this.childrenSashResetDisposable.dispose();
            this.childrenChangeDisposable.dispose();
            this.onDidScrollDisposable.dispose();
            this.splitview.dispose();
        }
    }
    /**
     * Creates a latched event that avoids being fired when the view
     * constraints do not change at all.
     */
    function createLatchedOnDidChangeViewEvent(view) {
        const [onDidChangeViewConstraints, onDidSetViewSize] = event_1.Event.split(view.onDidChange, types_1.isUndefined);
        return event_1.Event.any(onDidSetViewSize, event_1.Event.map(event_1.Event.latch(event_1.Event.map(onDidChangeViewConstraints, _ => ([view.minimumWidth, view.maximumWidth, view.minimumHeight, view.maximumHeight])), arrays_1.equals), _ => undefined));
    }
    class LeafNode {
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        get linkedWidthNode() { return this._linkedWidthNode; }
        set linkedWidthNode(node) {
            this._onDidLinkedWidthNodeChange.input = node ? node._onDidViewChange : event_1.Event.None;
            this._linkedWidthNode = node;
            this._onDidSetLinkedNode.fire(undefined);
        }
        get linkedHeightNode() { return this._linkedHeightNode; }
        set linkedHeightNode(node) {
            this._onDidLinkedHeightNodeChange.input = node ? node._onDidViewChange : event_1.Event.None;
            this._linkedHeightNode = node;
            this._onDidSetLinkedNode.fire(undefined);
        }
        constructor(view, orientation, layoutController, orthogonalSize, size = 0) {
            this.view = view;
            this.orientation = orientation;
            this.layoutController = layoutController;
            this._size = 0;
            this.absoluteOffset = 0;
            this.absoluteOrthogonalOffset = 0;
            this.onDidScroll = event_1.Event.None;
            this.onDidSashReset = event_1.Event.None;
            this._onDidLinkedWidthNodeChange = new event_1.Relay();
            this._linkedWidthNode = undefined;
            this._onDidLinkedHeightNodeChange = new event_1.Relay();
            this._linkedHeightNode = undefined;
            this._onDidSetLinkedNode = new event_1.Emitter();
            this.disposables = new lifecycle_1.DisposableStore();
            this._boundarySashes = {};
            this.cachedWidth = 0;
            this.cachedHeight = 0;
            this.cachedTop = 0;
            this.cachedLeft = 0;
            this._orthogonalSize = orthogonalSize;
            this._size = size;
            const onDidChange = createLatchedOnDidChangeViewEvent(view);
            this._onDidViewChange = event_1.Event.map(onDidChange, e => e && (this.orientation === 0 /* Orientation.VERTICAL */ ? e.width : e.height), this.disposables);
            this.onDidChange = event_1.Event.any(this._onDidViewChange, this._onDidSetLinkedNode.event, this._onDidLinkedWidthNodeChange.event, this._onDidLinkedHeightNodeChange.event);
        }
        get width() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.orthogonalSize : this.size;
        }
        get height() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.size : this.orthogonalSize;
        }
        get top() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.absoluteOffset : this.absoluteOrthogonalOffset;
        }
        get left() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.absoluteOrthogonalOffset : this.absoluteOffset;
        }
        get element() {
            return this.view.element;
        }
        get minimumWidth() {
            return this.linkedWidthNode ? Math.max(this.linkedWidthNode.view.minimumWidth, this.view.minimumWidth) : this.view.minimumWidth;
        }
        get maximumWidth() {
            return this.linkedWidthNode ? Math.min(this.linkedWidthNode.view.maximumWidth, this.view.maximumWidth) : this.view.maximumWidth;
        }
        get minimumHeight() {
            return this.linkedHeightNode ? Math.max(this.linkedHeightNode.view.minimumHeight, this.view.minimumHeight) : this.view.minimumHeight;
        }
        get maximumHeight() {
            return this.linkedHeightNode ? Math.min(this.linkedHeightNode.view.maximumHeight, this.view.maximumHeight) : this.view.maximumHeight;
        }
        get minimumSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumHeight : this.minimumWidth;
        }
        get maximumSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumHeight : this.maximumWidth;
        }
        get priority() {
            return this.view.priority;
        }
        get proportionalLayout() {
            return this.view.proportionalLayout ?? true;
        }
        get snap() {
            return this.view.snap;
        }
        get minimumOrthogonalSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumWidth : this.minimumHeight;
        }
        get maximumOrthogonalSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumWidth : this.maximumHeight;
        }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            this.view.setBoundarySashes?.(toAbsoluteBoundarySashes(boundarySashes, this.orientation));
        }
        layout(size, offset, ctx) {
            if (!this.layoutController.isLayoutEnabled) {
                return;
            }
            if (typeof ctx === 'undefined') {
                throw new Error('Invalid state');
            }
            this._size = size;
            this._orthogonalSize = ctx.orthogonalSize;
            this.absoluteOffset = ctx.absoluteOffset + offset;
            this.absoluteOrthogonalOffset = ctx.absoluteOrthogonalOffset;
            this._layout(this.width, this.height, this.top, this.left);
        }
        _layout(width, height, top, left) {
            if (this.cachedWidth === width && this.cachedHeight === height && this.cachedTop === top && this.cachedLeft === left) {
                return;
            }
            this.cachedWidth = width;
            this.cachedHeight = height;
            this.cachedTop = top;
            this.cachedLeft = left;
            this.view.layout(width, height, top, left);
        }
        setVisible(visible) {
            this.view.setVisible?.(visible);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    function flipNode(node, size, orthogonalSize) {
        if (node instanceof BranchNode) {
            const result = new BranchNode(orthogonal(node.orientation), node.layoutController, node.styles, node.splitviewProportionalLayout, size, orthogonalSize, node.edgeSnapping);
            let totalSize = 0;
            for (let i = node.children.length - 1; i >= 0; i--) {
                const child = node.children[i];
                const childSize = child instanceof BranchNode ? child.orthogonalSize : child.size;
                let newSize = node.size === 0 ? 0 : Math.round((size * childSize) / node.size);
                totalSize += newSize;
                // The last view to add should adjust to rounding errors
                if (i === 0) {
                    newSize += size - totalSize;
                }
                result.addChild(flipNode(child, orthogonalSize, newSize), newSize, 0, true);
            }
            node.dispose();
            return result;
        }
        else {
            const result = new LeafNode(node.view, orthogonal(node.orientation), node.layoutController, orthogonalSize);
            node.dispose();
            return result;
        }
    }
    /**
     * The {@link GridView} is the UI component which implements a two dimensional
     * flex-like layout algorithm for a collection of {@link IView} instances, which
     * are mostly HTMLElement instances with size constraints. A {@link GridView} is a
     * tree composition of multiple {@link SplitView} instances, orthogonal between
     * one another. It will respect view's size contraints, just like the SplitView.
     *
     * It has a low-level index based API, allowing for fine grain performant operations.
     * Look into the {@link Grid} widget for a higher-level API.
     *
     * Features:
     * - flex-like layout algorithm
     * - snap support
     * - corner sash support
     * - Alt key modifier behavior, macOS style
     * - layout (de)serialization
     */
    class GridView {
        get root() { return this._root; }
        set root(root) {
            const oldRoot = this._root;
            if (oldRoot) {
                this.element.removeChild(oldRoot.element);
                oldRoot.dispose();
            }
            this._root = root;
            this.element.appendChild(root.element);
            this.onDidSashResetRelay.input = root.onDidSashReset;
            this._onDidChange.input = event_1.Event.map(root.onDidChange, () => undefined); // TODO
            this._onDidScroll.input = root.onDidScroll;
        }
        /**
         * The width of the grid.
         */
        get width() { return this.root.width; }
        /**
         * The height of the grid.
         */
        get height() { return this.root.height; }
        /**
         * The minimum width of the grid.
         */
        get minimumWidth() { return this.root.minimumWidth; }
        /**
         * The minimum height of the grid.
         */
        get minimumHeight() { return this.root.minimumHeight; }
        /**
         * The maximum width of the grid.
         */
        get maximumWidth() { return this.root.maximumHeight; }
        /**
         * The maximum height of the grid.
         */
        get maximumHeight() { return this.root.maximumHeight; }
        get orientation() { return this._root.orientation; }
        get boundarySashes() { return this._boundarySashes; }
        /**
         * The orientation of the grid. Matches the orientation of the root
         * {@link SplitView} in the grid's tree model.
         */
        set orientation(orientation) {
            if (this._root.orientation === orientation) {
                return;
            }
            const { size, orthogonalSize, absoluteOffset, absoluteOrthogonalOffset } = this._root;
            this.root = flipNode(this._root, orthogonalSize, size);
            this.root.layout(size, 0, { orthogonalSize, absoluteOffset: absoluteOrthogonalOffset, absoluteOrthogonalOffset: absoluteOffset, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
            this.boundarySashes = this.boundarySashes;
        }
        /**
         * A collection of sashes perpendicular to each edge of the grid.
         * Corner sashes will be created for each intersection.
         */
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            this.root.boundarySashes = fromAbsoluteBoundarySashes(boundarySashes, this.orientation);
        }
        /**
         * Enable/disable edge snapping across all grid views.
         */
        set edgeSnapping(edgeSnapping) {
            this.root.edgeSnapping = edgeSnapping;
        }
        /**
         * Create a new {@link GridView} instance.
         *
         * @remarks It's the caller's responsibility to append the
         * {@link GridView.element} to the page's DOM.
         */
        constructor(options = {}) {
            this.onDidSashResetRelay = new event_1.Relay();
            this._onDidScroll = new event_1.Relay();
            this._onDidChange = new event_1.Relay();
            this._boundarySashes = {};
            this.disposable2x2 = lifecycle_1.Disposable.None;
            /**
             * Fires whenever the user double clicks a {@link Sash sash}.
             */
            this.onDidSashReset = this.onDidSashResetRelay.event;
            /**
             * Fires whenever the user scrolls a {@link SplitView} within
             * the grid.
             */
            this.onDidScroll = this._onDidScroll.event;
            /**
             * Fires whenever a view within the grid changes its size constraints.
             */
            this.onDidChange = this._onDidChange.event;
            this.maximizedNode = undefined;
            this._onDidChangeViewMaximized = new event_1.Emitter();
            this.onDidChangeViewMaximized = this._onDidChangeViewMaximized.event;
            this.element = (0, dom_1.$)('.monaco-grid-view');
            this.styles = options.styles || defaultStyles;
            this.proportionalLayout = typeof options.proportionalLayout !== 'undefined' ? !!options.proportionalLayout : true;
            this.layoutController = new LayoutController(false);
            this.root = new BranchNode(0 /* Orientation.VERTICAL */, this.layoutController, this.styles, this.proportionalLayout);
        }
        style(styles) {
            this.styles = styles;
            this.root.style(styles);
        }
        /**
         * Layout the {@link GridView}.
         *
         * Optionally provide a `top` and `left` positions, those will propagate
         * as an origin for positions passed to {@link IView.layout}.
         *
         * @param width The width of the {@link GridView}.
         * @param height The height of the {@link GridView}.
         * @param top Optional, the top location of the {@link GridView}.
         * @param left Optional, the left location of the {@link GridView}.
         */
        layout(width, height, top = 0, left = 0) {
            this.layoutController.isLayoutEnabled = true;
            const [size, orthogonalSize, offset, orthogonalOffset] = this.root.orientation === 1 /* Orientation.HORIZONTAL */ ? [height, width, top, left] : [width, height, left, top];
            this.root.layout(size, 0, { orthogonalSize, absoluteOffset: offset, absoluteOrthogonalOffset: orthogonalOffset, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
        }
        /**
         * Add a {@link IView view} to this {@link GridView}.
         *
         * @param view The view to add.
         * @param size Either a fixed size, or a dynamic {@link Sizing} strategy.
         * @param location The {@link GridLocation location} to insert the view on.
         */
        addView(view, size, location) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (parent instanceof BranchNode) {
                const node = new LeafNode(view, orthogonal(parent.orientation), this.layoutController, parent.orthogonalSize);
                try {
                    parent.addChild(node, size, index);
                }
                catch (err) {
                    node.dispose();
                    throw err;
                }
            }
            else {
                const [, grandParent] = (0, arrays_1.tail2)(pathToParent);
                const [, parentIndex] = (0, arrays_1.tail2)(rest);
                let newSiblingSize = 0;
                const newSiblingCachedVisibleSize = grandParent.getChildCachedVisibleSize(parentIndex);
                if (typeof newSiblingCachedVisibleSize === 'number') {
                    newSiblingSize = splitview_1.Sizing.Invisible(newSiblingCachedVisibleSize);
                }
                const oldChild = grandParent.removeChild(parentIndex);
                oldChild.dispose();
                const newParent = new BranchNode(parent.orientation, parent.layoutController, this.styles, this.proportionalLayout, parent.size, parent.orthogonalSize, grandParent.edgeSnapping);
                grandParent.addChild(newParent, parent.size, parentIndex);
                const newSibling = new LeafNode(parent.view, grandParent.orientation, this.layoutController, parent.size);
                newParent.addChild(newSibling, newSiblingSize, 0);
                if (typeof size !== 'number' && size.type === 'split') {
                    size = splitview_1.Sizing.Split(0);
                }
                const node = new LeafNode(view, grandParent.orientation, this.layoutController, parent.size);
                newParent.addChild(node, size, index);
            }
            this.trySet2x2();
        }
        /**
         * Remove a {@link IView view} from this {@link GridView}.
         *
         * @param location The {@link GridLocation location} of the {@link IView view}.
         * @param sizing Whether to distribute other {@link IView view}'s sizes.
         */
        removeView(location, sizing) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            const node = parent.children[index];
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            parent.removeChild(index, sizing);
            node.dispose();
            if (parent.children.length === 0) {
                throw new Error('Invalid grid state');
            }
            if (parent.children.length > 1) {
                this.trySet2x2();
                return node.view;
            }
            if (pathToParent.length === 0) { // parent is root
                const sibling = parent.children[0];
                if (sibling instanceof LeafNode) {
                    return node.view;
                }
                // we must promote sibling to be the new root
                parent.removeChild(0);
                parent.dispose();
                this.root = sibling;
                this.boundarySashes = this.boundarySashes;
                this.trySet2x2();
                return node.view;
            }
            const [, grandParent] = (0, arrays_1.tail2)(pathToParent);
            const [, parentIndex] = (0, arrays_1.tail2)(rest);
            const isSiblingVisible = parent.isChildVisible(0);
            const sibling = parent.removeChild(0);
            const sizes = grandParent.children.map((_, i) => grandParent.getChildSize(i));
            grandParent.removeChild(parentIndex, sizing);
            parent.dispose();
            if (sibling instanceof BranchNode) {
                sizes.splice(parentIndex, 1, ...sibling.children.map(c => c.size));
                const siblingChildren = sibling.removeAllChildren();
                for (let i = 0; i < siblingChildren.length; i++) {
                    grandParent.addChild(siblingChildren[i], siblingChildren[i].size, parentIndex + i);
                }
            }
            else {
                const newSibling = new LeafNode(sibling.view, orthogonal(sibling.orientation), this.layoutController, sibling.size);
                const sizing = isSiblingVisible ? sibling.orthogonalSize : splitview_1.Sizing.Invisible(sibling.orthogonalSize);
                grandParent.addChild(newSibling, sizing, parentIndex);
            }
            sibling.dispose();
            for (let i = 0; i < sizes.length; i++) {
                grandParent.resizeChild(i, sizes[i]);
            }
            this.trySet2x2();
            return node.view;
        }
        /**
         * Move a {@link IView view} within its parent.
         *
         * @param parentLocation The {@link GridLocation location} of the {@link IView view}'s parent.
         * @param from The index of the {@link IView view} to move.
         * @param to The index where the {@link IView view} should move to.
         */
        moveView(parentLocation, from, to) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [, parent] = this.getNode(parentLocation);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            parent.moveChild(from, to);
            this.trySet2x2();
        }
        /**
         * Swap two {@link IView views} within the {@link GridView}.
         *
         * @param from The {@link GridLocation location} of one view.
         * @param to The {@link GridLocation location} of another view.
         */
        swapViews(from, to) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [fromRest, fromIndex] = (0, arrays_1.tail2)(from);
            const [, fromParent] = this.getNode(fromRest);
            if (!(fromParent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            const fromSize = fromParent.getChildSize(fromIndex);
            const fromNode = fromParent.children[fromIndex];
            if (!(fromNode instanceof LeafNode)) {
                throw new Error('Invalid from location');
            }
            const [toRest, toIndex] = (0, arrays_1.tail2)(to);
            const [, toParent] = this.getNode(toRest);
            if (!(toParent instanceof BranchNode)) {
                throw new Error('Invalid to location');
            }
            const toSize = toParent.getChildSize(toIndex);
            const toNode = toParent.children[toIndex];
            if (!(toNode instanceof LeafNode)) {
                throw new Error('Invalid to location');
            }
            if (fromParent === toParent) {
                fromParent.swapChildren(fromIndex, toIndex);
            }
            else {
                fromParent.removeChild(fromIndex);
                toParent.removeChild(toIndex);
                fromParent.addChild(toNode, fromSize, fromIndex);
                toParent.addChild(fromNode, toSize, toIndex);
            }
            this.trySet2x2();
        }
        /**
         * Resize a {@link IView view}.
         *
         * @param location The {@link GridLocation location} of the view.
         * @param size The size the view should be. Optionally provide a single dimension.
         */
        resizeView(location, size) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            if (!size.width && !size.height) {
                return;
            }
            const [parentSize, grandParentSize] = parent.orientation === 1 /* Orientation.HORIZONTAL */ ? [size.width, size.height] : [size.height, size.width];
            if (typeof grandParentSize === 'number' && pathToParent.length > 0) {
                const [, grandParent] = (0, arrays_1.tail2)(pathToParent);
                const [, parentIndex] = (0, arrays_1.tail2)(rest);
                grandParent.resizeChild(parentIndex, grandParentSize);
            }
            if (typeof parentSize === 'number') {
                parent.resizeChild(index, parentSize);
            }
            this.trySet2x2();
        }
        /**
         * Get the size of a {@link IView view}.
         *
         * @param location The {@link GridLocation location} of the view. Provide `undefined` to get
         * the size of the grid itself.
         */
        getViewSize(location) {
            if (!location) {
                return { width: this.root.width, height: this.root.height };
            }
            const [, node] = this.getNode(location);
            return { width: node.width, height: node.height };
        }
        /**
         * Get the cached visible size of a {@link IView view}. This was the size
         * of the view at the moment it last became hidden.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        getViewCachedVisibleSize(location) {
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            return parent.getChildCachedVisibleSize(index);
        }
        /**
         * Maximize the size of a {@link IView view} by collapsing all other views
         * to their minimum sizes.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        expandView(location) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [ancestors, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            for (let i = 0; i < ancestors.length; i++) {
                ancestors[i].resizeChild(location[i], Number.POSITIVE_INFINITY);
            }
        }
        /**
         * Returns whether all other {@link IView views} are at their minimum size.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        isViewExpanded(location) {
            if (this.hasMaximizedView()) {
                // No view can be expanded when a view is maximized
                return false;
            }
            const [ancestors, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            for (let i = 0; i < ancestors.length; i++) {
                if (!ancestors[i].isChildExpanded(location[i])) {
                    return false;
                }
            }
            return true;
        }
        maximizeView(location) {
            const [, nodeToMaximize] = this.getNode(location);
            if (!(nodeToMaximize instanceof LeafNode)) {
                throw new Error('Location is not a LeafNode');
            }
            if (this.maximizedNode === nodeToMaximize) {
                return;
            }
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            function hideAllViewsBut(parent, exclude) {
                for (let i = 0; i < parent.children.length; i++) {
                    const child = parent.children[i];
                    if (child instanceof LeafNode) {
                        if (child !== exclude) {
                            parent.setChildVisible(i, false);
                        }
                    }
                    else {
                        hideAllViewsBut(child, exclude);
                    }
                }
            }
            hideAllViewsBut(this.root, nodeToMaximize);
            this.maximizedNode = nodeToMaximize;
            this._onDidChangeViewMaximized.fire(true);
        }
        exitMaximizedView() {
            if (!this.maximizedNode) {
                return;
            }
            this.maximizedNode = undefined;
            // When hiding a view, it's previous size is cached.
            // To restore the sizes of all views, they need to be made visible in reverse order.
            function showViewsInReverseOrder(parent) {
                for (let index = parent.children.length - 1; index >= 0; index--) {
                    const child = parent.children[index];
                    if (child instanceof LeafNode) {
                        parent.setChildVisible(index, true);
                    }
                    else {
                        showViewsInReverseOrder(child);
                    }
                }
            }
            showViewsInReverseOrder(this.root);
            this._onDidChangeViewMaximized.fire(false);
        }
        hasMaximizedView() {
            return this.maximizedNode !== undefined;
        }
        /**
         * Returns whether the {@link IView view} is maximized.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        isViewMaximized(location) {
            const [, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Location is not a LeafNode');
            }
            return node === this.maximizedNode;
        }
        /**
         * Distribute the size among all {@link IView views} within the entire
         * grid or within a single {@link SplitView}.
         *
         * @param location The {@link GridLocation location} of a view containing
         * children views, which will have their sizes distributed within the parent
         * view's size. Provide `undefined` to recursively distribute all views' sizes
         * in the entire grid.
         */
        distributeViewSizes(location) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            if (!location) {
                this.root.distributeViewSizes(true);
                return;
            }
            const [, node] = this.getNode(location);
            if (!(node instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            node.distributeViewSizes();
            this.trySet2x2();
        }
        /**
         * Returns whether a {@link IView view} is visible.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        isViewVisible(location) {
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            return parent.isChildVisible(index);
        }
        /**
         * Set the visibility state of a {@link IView view}.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        setViewVisible(location, visible) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
                return;
            }
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            parent.setChildVisible(index, visible);
        }
        getView(location) {
            const node = location ? this.getNode(location)[1] : this._root;
            return this._getViews(node, this.orientation);
        }
        /**
         * Construct a new {@link GridView} from a JSON object.
         *
         * @param json The JSON object.
         * @param deserializer A deserializer which can revive each view.
         * @returns A new {@link GridView} instance.
         */
        static deserialize(json, deserializer, options = {}) {
            if (typeof json.orientation !== 'number') {
                throw new Error('Invalid JSON: \'orientation\' property must be a number.');
            }
            else if (typeof json.width !== 'number') {
                throw new Error('Invalid JSON: \'width\' property must be a number.');
            }
            else if (typeof json.height !== 'number') {
                throw new Error('Invalid JSON: \'height\' property must be a number.');
            }
            else if (json.root?.type !== 'branch') {
                throw new Error('Invalid JSON: \'root\' property must have \'type\' value of branch.');
            }
            const orientation = json.orientation;
            const height = json.height;
            const result = new GridView(options);
            result._deserialize(json.root, orientation, deserializer, height);
            return result;
        }
        _deserialize(root, orientation, deserializer, orthogonalSize) {
            this.root = this._deserializeNode(root, orientation, deserializer, orthogonalSize);
        }
        _deserializeNode(node, orientation, deserializer, orthogonalSize) {
            let result;
            if (node.type === 'branch') {
                const serializedChildren = node.data;
                const children = serializedChildren.map(serializedChild => {
                    return {
                        node: this._deserializeNode(serializedChild, orthogonal(orientation), deserializer, node.size),
                        visible: serializedChild.visible
                    };
                });
                result = new BranchNode(orientation, this.layoutController, this.styles, this.proportionalLayout, node.size, orthogonalSize, undefined, children);
            }
            else {
                result = new LeafNode(deserializer.fromJSON(node.data), orientation, this.layoutController, orthogonalSize, node.size);
                if (node.maximized && !this.maximizedNode) {
                    this.maximizedNode = result;
                    this._onDidChangeViewMaximized.fire(true);
                }
            }
            return result;
        }
        _getViews(node, orientation, cachedVisibleSize) {
            const box = { top: node.top, left: node.left, width: node.width, height: node.height };
            if (node instanceof LeafNode) {
                return { view: node.view, box, cachedVisibleSize, maximized: this.maximizedNode === node };
            }
            const children = [];
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const cachedVisibleSize = node.getChildCachedVisibleSize(i);
                children.push(this._getViews(child, orthogonal(orientation), cachedVisibleSize));
            }
            return { children, box };
        }
        getNode(location, node = this.root, path = []) {
            if (location.length === 0) {
                return [path, node];
            }
            if (!(node instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            const [index, ...rest] = location;
            if (index < 0 || index >= node.children.length) {
                throw new Error('Invalid location');
            }
            const child = node.children[index];
            path.push(node);
            return this.getNode(rest, child, path);
        }
        /**
         * Attempt to lock the {@link Sash sashes} in this {@link GridView} so
         * the grid behaves as a 2x2 matrix, with a corner sash in the middle.
         *
         * In case the grid isn't a 2x2 grid _and_ all sashes are not aligned,
         * this method is a no-op.
         */
        trySet2x2() {
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            if (this.root.children.length !== 2) {
                return;
            }
            const [first, second] = this.root.children;
            if (!(first instanceof BranchNode) || !(second instanceof BranchNode)) {
                return;
            }
            this.disposable2x2 = first.trySet2x2(second);
        }
        /**
         * Populate a map with views to DOM nodes.
         * @remarks To be used internally only.
         */
        getViewMap(map, node) {
            if (!node) {
                node = this.root;
            }
            if (node instanceof BranchNode) {
                node.children.forEach(child => this.getViewMap(map, child));
            }
            else {
                map.set(node.view, node.element);
            }
        }
        dispose() {
            this.onDidSashResetRelay.dispose();
            this.root.dispose();
            this.element.parentElement?.removeChild(this.element);
        }
    }
    exports.GridView = GridView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9ncmlkL2dyaWR2aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNLaEcsZ0NBRUM7SUF1QkQsNENBRUM7SUFwTFEsbUdBQUEsV0FBVyxPQUFBO0lBQ1gsMkdBQUEsY0FBYyxPQUFBO0lBQUUsbUdBQUEsTUFBTSxPQUFBO0lBSS9CLE1BQU0sYUFBYSxHQUFvQjtRQUN0QyxlQUFlLEVBQUUsYUFBSyxDQUFDLFdBQVc7S0FDbEMsQ0FBQztJQWtKRixTQUFnQixVQUFVLENBQUMsV0FBd0I7UUFDbEQsT0FBTyxXQUFXLGlDQUF5QixDQUFDLENBQUMsZ0NBQXdCLENBQUMsNkJBQXFCLENBQUM7SUFDN0YsQ0FBQztJQXVCRCxTQUFnQixnQkFBZ0IsQ0FBQyxJQUFjO1FBQzlDLE9BQU8sQ0FBQyxDQUFFLElBQVksQ0FBQyxRQUFRLENBQUM7SUFDakMsQ0FBQztJQUVELE1BQU0sZ0JBQWdCO1FBQ3JCLFlBQW1CLGVBQXdCO1lBQXhCLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1FBQUksQ0FBQztLQUNoRDtJQXlCRCxTQUFTLHdCQUF3QixDQUFDLE1BQStCLEVBQUUsV0FBd0I7UUFDMUYsSUFBSSxXQUFXLG1DQUEyQixFQUFFLENBQUM7WUFDNUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDN0csQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0s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