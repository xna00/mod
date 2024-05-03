/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "./splitview", "vs/css!./paneview"], function (require, exports, browser_1, dnd_1, dom_1, event_1, keyboardEvent_1, touch_1, color_1, event_2, lifecycle_1, nls_1, splitview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneView = exports.DefaultPaneDndController = exports.Pane = void 0;
    /**
     * A Pane is a structured SplitView view.
     *
     * WARNING: You must call `render()` after you construct it.
     * It can't be done automatically at the end of the ctor
     * because of the order of property initialization in TypeScript.
     * Subclasses wouldn't be able to set own properties
     * before the `render()` call, thus forbidding their use.
     */
    class Pane extends lifecycle_1.Disposable {
        static { this.HEADER_SIZE = 22; }
        get ariaHeaderLabel() {
            return this._ariaHeaderLabel;
        }
        set ariaHeaderLabel(newLabel) {
            this._ariaHeaderLabel = newLabel;
            this.header.setAttribute('aria-label', this.ariaHeaderLabel);
        }
        get draggableElement() {
            return this.header;
        }
        get dropTargetElement() {
            return this.element;
        }
        get dropBackground() {
            return this.styles.dropBackground;
        }
        get minimumBodySize() {
            return this._minimumBodySize;
        }
        set minimumBodySize(size) {
            this._minimumBodySize = size;
            this._onDidChange.fire(undefined);
        }
        get maximumBodySize() {
            return this._maximumBodySize;
        }
        set maximumBodySize(size) {
            this._maximumBodySize = size;
            this._onDidChange.fire(undefined);
        }
        get headerSize() {
            return this.headerVisible ? Pane.HEADER_SIZE : 0;
        }
        get minimumSize() {
            const headerSize = this.headerSize;
            const expanded = !this.headerVisible || this.isExpanded();
            const minimumBodySize = expanded ? this.minimumBodySize : 0;
            return headerSize + minimumBodySize;
        }
        get maximumSize() {
            const headerSize = this.headerSize;
            const expanded = !this.headerVisible || this.isExpanded();
            const maximumBodySize = expanded ? this.maximumBodySize : 0;
            return headerSize + maximumBodySize;
        }
        constructor(options) {
            super();
            this.expandedSize = undefined;
            this._headerVisible = true;
            this._collapsible = true;
            this._bodyRendered = false;
            this.styles = {
                dropBackground: undefined,
                headerBackground: undefined,
                headerBorder: undefined,
                headerForeground: undefined,
                leftBorder: undefined
            };
            this.animationTimer = undefined;
            this._onDidChange = this._register(new event_2.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidChangeExpansionState = this._register(new event_2.Emitter());
            this.onDidChangeExpansionState = this._onDidChangeExpansionState.event;
            this.orthogonalSize = 0;
            this._expanded = typeof options.expanded === 'undefined' ? true : !!options.expanded;
            this._orientation = typeof options.orientation === 'undefined' ? 0 /* Orientation.VERTICAL */ : options.orientation;
            this._ariaHeaderLabel = (0, nls_1.localize)('viewSection', "{0} Section", options.title);
            this._minimumBodySize = typeof options.minimumBodySize === 'number' ? options.minimumBodySize : this._orientation === 1 /* Orientation.HORIZONTAL */ ? 200 : 120;
            this._maximumBodySize = typeof options.maximumBodySize === 'number' ? options.maximumBodySize : Number.POSITIVE_INFINITY;
            this.element = (0, dom_1.$)('.pane');
        }
        isExpanded() {
            return this._expanded;
        }
        setExpanded(expanded) {
            if (!expanded && !this.collapsible) {
                return false;
            }
            if (this._expanded === !!expanded) {
                return false;
            }
            this.element?.classList.toggle('expanded', expanded);
            this._expanded = !!expanded;
            this.updateHeader();
            if (expanded) {
                if (!this._bodyRendered) {
                    this.renderBody(this.body);
                    this._bodyRendered = true;
                }
                if (typeof this.animationTimer === 'number') {
                    (0, dom_1.getWindow)(this.element).clearTimeout(this.animationTimer);
                }
                (0, dom_1.append)(this.element, this.body);
            }
            else {
                this.animationTimer = (0, dom_1.getWindow)(this.element).setTimeout(() => {
                    this.body.remove();
                }, 200);
            }
            this._onDidChangeExpansionState.fire(expanded);
            this._onDidChange.fire(expanded ? this.expandedSize : undefined);
            return true;
        }
        get headerVisible() {
            return this._headerVisible;
        }
        set headerVisible(visible) {
            if (this._headerVisible === !!visible) {
                return;
            }
            this._headerVisible = !!visible;
            this.updateHeader();
            this._onDidChange.fire(undefined);
        }
        get collapsible() {
            return this._collapsible;
        }
        set collapsible(collapsible) {
            if (this._collapsible === !!collapsible) {
                return;
            }
            this._collapsible = !!collapsible;
            this.updateHeader();
        }
        get orientation() {
            return this._orientation;
        }
        set orientation(orientation) {
            if (this._orientation === orientation) {
                return;
            }
            this._orientation = orientation;
            if (this.element) {
                this.element.classList.toggle('horizontal', this.orientation === 1 /* Orientation.HORIZONTAL */);
                this.element.classList.toggle('vertical', this.orientation === 0 /* Orientation.VERTICAL */);
            }
            if (this.header) {
                this.updateHeader();
            }
        }
        render() {
            this.element.classList.toggle('expanded', this.isExpanded());
            this.element.classList.toggle('horizontal', this.orientation === 1 /* Orientation.HORIZONTAL */);
            this.element.classList.toggle('vertical', this.orientation === 0 /* Orientation.VERTICAL */);
            this.header = (0, dom_1.$)('.pane-header');
            (0, dom_1.append)(this.element, this.header);
            this.header.setAttribute('tabindex', '0');
            // Use role button so the aria-expanded state gets read https://github.com/microsoft/vscode/issues/95996
            this.header.setAttribute('role', 'button');
            this.header.setAttribute('aria-label', this.ariaHeaderLabel);
            this.renderHeader(this.header);
            const focusTracker = (0, dom_1.trackFocus)(this.header);
            this._register(focusTracker);
            this._register(focusTracker.onDidFocus(() => this.header.classList.add('focused'), null));
            this._register(focusTracker.onDidBlur(() => this.header.classList.remove('focused'), null));
            this.updateHeader();
            const eventDisposables = this._register(new lifecycle_1.DisposableStore());
            const onKeyDown = this._register(new event_1.DomEmitter(this.header, 'keydown'));
            const onHeaderKeyDown = event_2.Event.map(onKeyDown.event, e => new keyboardEvent_1.StandardKeyboardEvent(e), eventDisposables);
            this._register(event_2.Event.filter(onHeaderKeyDown, e => e.keyCode === 3 /* KeyCode.Enter */ || e.keyCode === 10 /* KeyCode.Space */, eventDisposables)(() => this.setExpanded(!this.isExpanded()), null));
            this._register(event_2.Event.filter(onHeaderKeyDown, e => e.keyCode === 15 /* KeyCode.LeftArrow */, eventDisposables)(() => this.setExpanded(false), null));
            this._register(event_2.Event.filter(onHeaderKeyDown, e => e.keyCode === 17 /* KeyCode.RightArrow */, eventDisposables)(() => this.setExpanded(true), null));
            this._register(touch_1.Gesture.addTarget(this.header));
            [dom_1.EventType.CLICK, touch_1.EventType.Tap].forEach(eventType => {
                this._register((0, dom_1.addDisposableListener)(this.header, eventType, e => {
                    if (!e.defaultPrevented) {
                        this.setExpanded(!this.isExpanded());
                    }
                }));
            });
            this.body = (0, dom_1.append)(this.element, (0, dom_1.$)('.pane-body'));
            // Only render the body if it will be visible
            // Otherwise, render it when the pane is expanded
            if (!this._bodyRendered && this.isExpanded()) {
                this.renderBody(this.body);
                this._bodyRendered = true;
            }
            if (!this.isExpanded()) {
                this.body.remove();
            }
        }
        layout(size) {
            const headerSize = this.headerVisible ? Pane.HEADER_SIZE : 0;
            const width = this._orientation === 0 /* Orientation.VERTICAL */ ? this.orthogonalSize : size;
            const height = this._orientation === 0 /* Orientation.VERTICAL */ ? size - headerSize : this.orthogonalSize - headerSize;
            if (this.isExpanded()) {
                this.body.classList.toggle('wide', width >= 600);
                this.layoutBody(height, width);
                this.expandedSize = size;
            }
        }
        style(styles) {
            this.styles = styles;
            if (!this.header) {
                return;
            }
            this.updateHeader();
        }
        updateHeader() {
            const expanded = !this.headerVisible || this.isExpanded();
            if (this.collapsible) {
                this.header.setAttribute('tabindex', '0');
                this.header.setAttribute('role', 'button');
            }
            else {
                this.header.removeAttribute('tabindex');
                this.header.removeAttribute('role');
            }
            this.header.style.lineHeight = `${this.headerSize}px`;
            this.header.classList.toggle('hidden', !this.headerVisible);
            this.header.classList.toggle('expanded', expanded);
            this.header.classList.toggle('not-collapsible', !this.collapsible);
            this.header.setAttribute('aria-expanded', String(expanded));
            this.header.style.color = this.collapsible ? this.styles.headerForeground ?? '' : '';
            this.header.style.backgroundColor = (this.collapsible ? this.styles.headerBackground : 'transparent') ?? '';
            this.header.style.borderTop = this.styles.headerBorder && this.orientation === 0 /* Orientation.VERTICAL */ ? `1px solid ${this.styles.headerBorder}` : '';
            this.element.style.borderLeft = this.styles.leftBorder && this.orientation === 1 /* Orientation.HORIZONTAL */ ? `1px solid ${this.styles.leftBorder}` : '';
        }
    }
    exports.Pane = Pane;
    class PaneDraggable extends lifecycle_1.Disposable {
        static { this.DefaultDragOverBackgroundColor = new color_1.Color(new color_1.RGBA(128, 128, 128, 0.5)); }
        constructor(pane, dnd, context) {
            super();
            this.pane = pane;
            this.dnd = dnd;
            this.context = context;
            this.dragOverCounter = 0; // see https://github.com/microsoft/vscode/issues/14470
            this._onDidDrop = this._register(new event_2.Emitter());
            this.onDidDrop = this._onDidDrop.event;
            pane.draggableElement.draggable = true;
            this._register((0, dom_1.addDisposableListener)(pane.draggableElement, 'dragstart', e => this.onDragStart(e)));
            this._register((0, dom_1.addDisposableListener)(pane.dropTargetElement, 'dragenter', e => this.onDragEnter(e)));
            this._register((0, dom_1.addDisposableListener)(pane.dropTargetElement, 'dragleave', e => this.onDragLeave(e)));
            this._register((0, dom_1.addDisposableListener)(pane.dropTargetElement, 'dragend', e => this.onDragEnd(e)));
            this._register((0, dom_1.addDisposableListener)(pane.dropTargetElement, 'drop', e => this.onDrop(e)));
        }
        onDragStart(e) {
            if (!this.dnd.canDrag(this.pane) || !e.dataTransfer) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            e.dataTransfer.effectAllowed = 'move';
            if (browser_1.isFirefox) {
                // Firefox: requires to set a text data transfer to get going
                e.dataTransfer?.setData(dnd_1.DataTransfers.TEXT, this.pane.draggableElement.textContent || '');
            }
            const dragImage = (0, dom_1.append)(this.pane.element.ownerDocument.body, (0, dom_1.$)('.monaco-drag-image', {}, this.pane.draggableElement.textContent || ''));
            e.dataTransfer.setDragImage(dragImage, -10, -10);
            setTimeout(() => this.pane.element.ownerDocument.body.removeChild(dragImage), 0);
            this.context.draggable = this;
        }
        onDragEnter(e) {
            if (!this.context.draggable || this.context.draggable === this) {
                return;
            }
            if (!this.dnd.canDrop(this.context.draggable.pane, this.pane)) {
                return;
            }
            this.dragOverCounter++;
            this.render();
        }
        onDragLeave(e) {
            if (!this.context.draggable || this.context.draggable === this) {
                return;
            }
            if (!this.dnd.canDrop(this.context.draggable.pane, this.pane)) {
                return;
            }
            this.dragOverCounter--;
            if (this.dragOverCounter === 0) {
                this.render();
            }
        }
        onDragEnd(e) {
            if (!this.context.draggable) {
                return;
            }
            this.dragOverCounter = 0;
            this.render();
            this.context.draggable = null;
        }
        onDrop(e) {
            if (!this.context.draggable) {
                return;
            }
            dom_1.EventHelper.stop(e);
            this.dragOverCounter = 0;
            this.render();
            if (this.dnd.canDrop(this.context.draggable.pane, this.pane) && this.context.draggable !== this) {
                this._onDidDrop.fire({ from: this.context.draggable.pane, to: this.pane });
            }
            this.context.draggable = null;
        }
        render() {
            let backgroundColor = null;
            if (this.dragOverCounter > 0) {
                backgroundColor = this.pane.dropBackground ?? PaneDraggable.DefaultDragOverBackgroundColor.toString();
            }
            this.pane.dropTargetElement.style.backgroundColor = backgroundColor || '';
        }
    }
    class DefaultPaneDndController {
        canDrag(pane) {
            return true;
        }
        canDrop(pane, overPane) {
            return true;
        }
    }
    exports.DefaultPaneDndController = DefaultPaneDndController;
    class PaneView extends lifecycle_1.Disposable {
        constructor(container, options = {}) {
            super();
            this.dndContext = { draggable: null };
            this.paneItems = [];
            this.orthogonalSize = 0;
            this.size = 0;
            this.animationTimer = undefined;
            this._onDidDrop = this._register(new event_2.Emitter());
            this.onDidDrop = this._onDidDrop.event;
            this.dnd = options.dnd;
            this.orientation = options.orientation ?? 0 /* Orientation.VERTICAL */;
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-pane-view'));
            this.splitview = this._register(new splitview_1.SplitView(this.element, { orientation: this.orientation }));
            this.onDidSashReset = this.splitview.onDidSashReset;
            this.onDidSashChange = this.splitview.onDidSashChange;
            this.onDidScroll = this.splitview.onDidScroll;
            const eventDisposables = this._register(new lifecycle_1.DisposableStore());
            const onKeyDown = this._register(new event_1.DomEmitter(this.element, 'keydown'));
            const onHeaderKeyDown = event_2.Event.map(event_2.Event.filter(onKeyDown.event, e => e.target instanceof HTMLElement && e.target.classList.contains('pane-header'), eventDisposables), e => new keyboardEvent_1.StandardKeyboardEvent(e), eventDisposables);
            this._register(event_2.Event.filter(onHeaderKeyDown, e => e.keyCode === 16 /* KeyCode.UpArrow */, eventDisposables)(() => this.focusPrevious()));
            this._register(event_2.Event.filter(onHeaderKeyDown, e => e.keyCode === 18 /* KeyCode.DownArrow */, eventDisposables)(() => this.focusNext()));
        }
        addPane(pane, size, index = this.splitview.length) {
            const disposables = new lifecycle_1.DisposableStore();
            pane.onDidChangeExpansionState(this.setupAnimation, this, disposables);
            const paneItem = { pane: pane, disposable: disposables };
            this.paneItems.splice(index, 0, paneItem);
            pane.orientation = this.orientation;
            pane.orthogonalSize = this.orthogonalSize;
            this.splitview.addView(pane, size, index);
            if (this.dnd) {
                const draggable = new PaneDraggable(pane, this.dnd, this.dndContext);
                disposables.add(draggable);
                disposables.add(draggable.onDidDrop(this._onDidDrop.fire, this._onDidDrop));
            }
        }
        removePane(pane) {
            const index = this.paneItems.findIndex(item => item.pane === pane);
            if (index === -1) {
                return;
            }
            this.splitview.removeView(index, pane.isExpanded() ? splitview_1.Sizing.Distribute : undefined);
            const paneItem = this.paneItems.splice(index, 1)[0];
            paneItem.disposable.dispose();
        }
        movePane(from, to) {
            const fromIndex = this.paneItems.findIndex(item => item.pane === from);
            const toIndex = this.paneItems.findIndex(item => item.pane === to);
            if (fromIndex === -1 || toIndex === -1) {
                return;
            }
            const [paneItem] = this.paneItems.splice(fromIndex, 1);
            this.paneItems.splice(toIndex, 0, paneItem);
            this.splitview.moveView(fromIndex, toIndex);
        }
        resizePane(pane, size) {
            const index = this.paneItems.findIndex(item => item.pane === pane);
            if (index === -1) {
                return;
            }
            this.splitview.resizeView(index, size);
        }
        getPaneSize(pane) {
            const index = this.paneItems.findIndex(item => item.pane === pane);
            if (index === -1) {
                return -1;
            }
            return this.splitview.getViewSize(index);
        }
        layout(height, width) {
            this.orthogonalSize = this.orientation === 0 /* Orientation.VERTICAL */ ? width : height;
            this.size = this.orientation === 1 /* Orientation.HORIZONTAL */ ? width : height;
            for (const paneItem of this.paneItems) {
                paneItem.pane.orthogonalSize = this.orthogonalSize;
            }
            this.splitview.layout(this.size);
        }
        setBoundarySashes(sashes) {
            this.boundarySashes = sashes;
            this.updateSplitviewOrthogonalSashes(sashes);
        }
        updateSplitviewOrthogonalSashes(sashes) {
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                this.splitview.orthogonalStartSash = sashes?.left;
                this.splitview.orthogonalEndSash = sashes?.right;
            }
            else {
                this.splitview.orthogonalEndSash = sashes?.bottom;
            }
        }
        flipOrientation(height, width) {
            this.orientation = this.orientation === 0 /* Orientation.VERTICAL */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            const paneSizes = this.paneItems.map(pane => this.getPaneSize(pane.pane));
            this.splitview.dispose();
            (0, dom_1.clearNode)(this.element);
            this.splitview = this._register(new splitview_1.SplitView(this.element, { orientation: this.orientation }));
            this.updateSplitviewOrthogonalSashes(this.boundarySashes);
            const newOrthogonalSize = this.orientation === 0 /* Orientation.VERTICAL */ ? width : height;
            const newSize = this.orientation === 1 /* Orientation.HORIZONTAL */ ? width : height;
            this.paneItems.forEach((pane, index) => {
                pane.pane.orthogonalSize = newOrthogonalSize;
                pane.pane.orientation = this.orientation;
                const viewSize = this.size === 0 ? 0 : (newSize * paneSizes[index]) / this.size;
                this.splitview.addView(pane.pane, viewSize, index);
            });
            this.size = newSize;
            this.orthogonalSize = newOrthogonalSize;
            this.splitview.layout(this.size);
        }
        setupAnimation() {
            if (typeof this.animationTimer === 'number') {
                (0, dom_1.getWindow)(this.element).clearTimeout(this.animationTimer);
            }
            this.element.classList.add('animated');
            this.animationTimer = (0, dom_1.getWindow)(this.element).setTimeout(() => {
                this.animationTimer = undefined;
                this.element.classList.remove('animated');
            }, 200);
        }
        getPaneHeaderElements() {
            return [...this.element.querySelectorAll('.pane-header')];
        }
        focusPrevious() {
            const headers = this.getPaneHeaderElements();
            const index = headers.indexOf(this.element.ownerDocument.activeElement);
            if (index === -1) {
                return;
            }
            headers[Math.max(index - 1, 0)].focus();
        }
        focusNext() {
            const headers = this.getPaneHeaderElements();
            const index = headers.indexOf(this.element.ownerDocument.activeElement);
            if (index === -1) {
                return;
            }
            headers[Math.min(index + 1, headers.length - 1)].focus();
        }
        dispose() {
            super.dispose();
            this.paneItems.forEach(i => i.disposable.dispose());
        }
    }
    exports.PaneView = PaneView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZXZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zcGxpdHZpZXcvcGFuZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUNoRzs7Ozs7Ozs7T0FRRztJQUNILE1BQXNCLElBQUssU0FBUSxzQkFBVTtpQkFFcEIsZ0JBQVcsR0FBRyxFQUFFLEFBQUwsQ0FBTTtRQStCekMsSUFBSSxlQUFlO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFJLGVBQWUsQ0FBQyxRQUFnQjtZQUNuQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxpQkFBaUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxJQUFJLGNBQWM7WUFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFJLGVBQWUsQ0FBQyxJQUFZO1lBQy9CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksZUFBZTtZQUNsQixPQUFPLElBQUksQ0FBQyxnQkFBZ0Is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