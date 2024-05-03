/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/lifecycle", "vs/css!./breadcrumbsWidget"], function (require, exports, dom, scrollableElement_1, arrays_1, themables_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsWidget = exports.BreadcrumbsItem = void 0;
    class BreadcrumbsItem {
    }
    exports.BreadcrumbsItem = BreadcrumbsItem;
    class BreadcrumbsWidget {
        constructor(container, horizontalScrollbarSize, separatorIcon, styles) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidSelectItem = new event_1.Emitter();
            this._onDidFocusItem = new event_1.Emitter();
            this._onDidChangeFocus = new event_1.Emitter();
            this.onDidSelectItem = this._onDidSelectItem.event;
            this.onDidFocusItem = this._onDidFocusItem.event;
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._items = new Array();
            this._nodes = new Array();
            this._freeNodes = new Array();
            this._enabled = true;
            this._focusedItemIdx = -1;
            this._selectedItemIdx = -1;
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-breadcrumbs';
            this._domNode.tabIndex = 0;
            this._domNode.setAttribute('role', 'list');
            this._scrollable = new scrollableElement_1.DomScrollableElement(this._domNode, {
                vertical: 2 /* ScrollbarVisibility.Hidden */,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                horizontalScrollbarSize,
                useShadows: false,
                scrollYToX: true
            });
            this._separatorIcon = separatorIcon;
            this._disposables.add(this._scrollable);
            this._disposables.add(dom.addStandardDisposableListener(this._domNode, 'click', e => this._onClick(e)));
            container.appendChild(this._scrollable.getDomNode());
            const styleElement = dom.createStyleSheet(this._domNode);
            this._style(styleElement, styles);
            const focusTracker = dom.trackFocus(this._domNode);
            this._disposables.add(focusTracker);
            this._disposables.add(focusTracker.onDidBlur(_ => this._onDidChangeFocus.fire(false)));
            this._disposables.add(focusTracker.onDidFocus(_ => this._onDidChangeFocus.fire(true)));
        }
        setHorizontalScrollbarSize(size) {
            this._scrollable.updateOptions({
                horizontalScrollbarSize: size
            });
        }
        dispose() {
            this._disposables.dispose();
            this._pendingLayout?.dispose();
            this._pendingDimLayout?.dispose();
            this._onDidSelectItem.dispose();
            this._onDidFocusItem.dispose();
            this._onDidChangeFocus.dispose();
            this._domNode.remove();
            this._nodes.length = 0;
            this._freeNodes.length = 0;
        }
        layout(dim) {
            if (dim && dom.Dimension.equals(dim, this._dimension)) {
                return;
            }
            if (dim) {
                // only measure
                this._pendingDimLayout?.dispose();
                this._pendingDimLayout = this._updateDimensions(dim);
            }
            else {
                this._pendingLayout?.dispose();
                this._pendingLayout = this._updateScrollbar();
            }
        }
        _updateDimensions(dim) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(dom.modify(dom.getWindow(this._domNode), () => {
                this._dimension = dim;
                this._domNode.style.width = `${dim.width}px`;
                this._domNode.style.height = `${dim.height}px`;
                disposables.add(this._updateScrollbar());
            }));
            return disposables;
        }
        _updateScrollbar() {
            return dom.measure(dom.getWindow(this._domNode), () => {
                dom.measure(dom.getWindow(this._domNode), () => {
                    this._scrollable.setRevealOnScroll(false);
                    this._scrollable.scanDomNode();
                    this._scrollable.setRevealOnScroll(true);
                });
            });
        }
        _style(styleElement, style) {
            let content = '';
            if (style.breadcrumbsBackground) {
                content += `.monaco-breadcrumbs { background-color: ${style.breadcrumbsBackground}}`;
            }
            if (style.breadcrumbsForeground) {
                content += `.monaco-breadcrumbs .monaco-breadcrumb-item { color: ${style.breadcrumbsForeground}}\n`;
            }
            if (style.breadcrumbsFocusForeground) {
                content += `.monaco-breadcrumbs .monaco-breadcrumb-item.focused { color: ${style.breadcrumbsFocusForeground}}\n`;
            }
            if (style.breadcrumbsFocusAndSelectionForeground) {
                content += `.monaco-breadcrumbs .monaco-breadcrumb-item.focused.selected { color: ${style.breadcrumbsFocusAndSelectionForeground}}\n`;
            }
            if (style.breadcrumbsHoverForeground) {
                content += `.monaco-breadcrumbs:not(.disabled	) .monaco-breadcrumb-item:hover:not(.focused):not(.selected) { color: ${style.breadcrumbsHoverForeground}}\n`;
            }
            styleElement.innerText = content;
        }
        setEnabled(value) {
            this._enabled = value;
            this._domNode.classList.toggle('disabled', !this._enabled);
        }
        domFocus() {
            const idx = this._focusedItemIdx >= 0 ? this._focusedItemIdx : this._items.length - 1;
            if (idx >= 0 && idx < this._items.length) {
                this._focus(idx, undefined);
            }
            else {
                this._domNode.focus();
            }
        }
        isDOMFocused() {
            return dom.isAncestorOfActiveElement(this._domNode);
        }
        getFocused() {
            return this._items[this._focusedItemIdx];
        }
        setFocused(item, payload) {
            this._focus(this._items.indexOf(item), payload);
        }
        focusPrev(payload) {
            if (this._focusedItemIdx > 0) {
                this._focus(this._focusedItemIdx - 1, payload);
            }
        }
        focusNext(payload) {
            if (this._focusedItemIdx + 1 < this._nodes.length) {
                this._focus(this._focusedItemIdx + 1, payload);
            }
        }
        _focus(nth, payload) {
            this._focusedItemIdx = -1;
            for (let i = 0; i < this._nodes.length; i++) {
                const node = this._nodes[i];
                if (i !== nth) {
                    node.classList.remove('focused');
                }
                else {
                    this._focusedItemIdx = i;
                    node.classList.add('focused');
                    node.focus();
                }
            }
            this._reveal(this._focusedItemIdx, true);
            this._onDidFocusItem.fire({ type: 'focus', item: this._items[this._focusedItemIdx], node: this._nodes[this._focusedItemIdx], payload });
        }
        reveal(item) {
            const idx = this._items.indexOf(item);
            if (idx >= 0) {
                this._reveal(idx, false);
            }
        }
        revealLast() {
            this._reveal(this._items.length - 1, false);
        }
        _reveal(nth, minimal) {
            if (nth < 0 || nth >= this._nodes.length) {
                return;
            }
            const node = this._nodes[nth];
            if (!node) {
                return;
            }
            const { width } = this._scrollable.getScrollDimensions();
            const { scrollLeft } = this._scrollable.getScrollPosition();
            if (!minimal || node.offsetLeft > scrollLeft + width || node.offsetLeft < scrollLeft) {
                this._scrollable.setRevealOnScroll(false);
                this._scrollable.setScrollPosition({ scrollLeft: node.offsetLeft });
                this._scrollable.setRevealOnScroll(true);
            }
        }
        getSelection() {
            return this._items[this._selectedItemIdx];
        }
        setSelection(item, payload) {
            this._select(this._items.indexOf(item), payload);
        }
        _select(nth, payload) {
            this._selectedItemIdx = -1;
            for (let i = 0; i < this._nodes.length; i++) {
                const node = this._nodes[i];
                if (i !== nth) {
                    node.classList.remove('selected');
                }
                else {
                    this._selectedItemIdx = i;
                    node.classList.add('selected');
                }
            }
            this._onDidSelectItem.fire({ type: 'select', item: this._items[this._selectedItemIdx], node: this._nodes[this._selectedItemIdx], payload });
        }
        getItems() {
            return this._items;
        }
        setItems(items) {
            let prefix;
            let removed = [];
            try {
                prefix = (0, arrays_1.commonPrefixLength)(this._items, items, (a, b) => a.equals(b));
                removed = this._items.splice(prefix, this._items.length - prefix, ...items.slice(prefix));
                this._render(prefix);
                (0, lifecycle_1.dispose)(removed);
                this._focus(-1, undefined);
            }
            catch (e) {
                const newError = new Error(`BreadcrumbsItem#setItems: newItems: ${items.length}, prefix: ${prefix}, removed: ${removed.length}`);
                newError.name = e.name;
                newError.stack = e.stack;
                throw newError;
            }
        }
        _render(start) {
            let didChange = false;
            for (; start < this._items.length && start < this._nodes.length; start++) {
                const item = this._items[start];
                const node = this._nodes[start];
                this._renderItem(item, node);
                didChange = true;
            }
            // case a: more nodes -> remove them
            while (start < this._nodes.length) {
                const free = this._nodes.pop();
                if (free) {
                    this._freeNodes.push(free);
                    free.remove();
                    didChange = true;
                }
            }
            // case b: more items -> render them
            for (; start < this._items.length; start++) {
                const item = this._items[start];
                const node = this._freeNodes.length > 0 ? this._freeNodes.pop() : document.createElement('div');
                if (node) {
                    this._renderItem(item, node);
                    this._domNode.appendChild(node);
                    this._nodes.push(node);
                    didChange = true;
                }
            }
            if (didChange) {
                this.layout(undefined);
            }
        }
        _renderItem(item, container) {
            dom.clearNode(container);
            container.className = '';
            try {
                item.render(container);
            }
            catch (err) {
                container.innerText = '<<RENDER ERROR>>';
                console.error(err);
            }
            container.tabIndex = -1;
            container.setAttribute('role', 'listitem');
            container.classList.add('monaco-breadcrumb-item');
            const iconContainer = dom.$(themables_1.ThemeIcon.asCSSSelector(this._separatorIcon));
            container.appendChild(iconContainer);
        }
        _onClick(event) {
            if (!this._enabled) {
                return;
            }
            for (let el = event.target; el; el = el.parentElement) {
                const idx = this._nodes.indexOf(el);
                if (idx >= 0) {
                    this._focus(idx, event);
                    this._select(idx, event);
                    break;
                }
            }
        }
    }
    exports.BreadcrumbsWidget = BreadcrumbsWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYnNXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9icmVhZGNydW1icy9icmVhZGNydW1ic1dpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBc0IsZUFBZTtLQUlwQztJQUpELDBDQUlDO0lBaUJELE1BQWEsaUJBQWlCO1FBMkI3QixZQUNDLFNBQXNCLEVBQ3RCLHVCQUErQixFQUMvQixhQUF3QixFQUN4QixNQUFnQztZQTdCaEIsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUlyQyxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBeUIsQ0FBQztZQUN4RCxvQkFBZSxHQUFHLElBQUksZUFBTyxFQUF5QixDQUFDO1lBQ3ZELHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFXLENBQUM7WUFFbkQsb0JBQWUsR0FBaUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUM1RSxtQkFBYyxHQUFpQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztZQUMxRSxxQkFBZ0IsR0FBbUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV4RCxXQUFNLEdBQUcsSUFBSSxLQUFLLEVBQW1CLENBQUM7WUFDdEMsV0FBTSxHQUFHLElBQUksS0FBSyxFQUFrQixDQUFDO1lBQ3JDLGVBQVUsR0FBRyxJQUFJLEtBQUssRUFBa0IsQ0FBQztZQUdsRCxhQUFRLEdBQVksSUFBSSxDQUFDO1lBQ3pCLG9CQUFlLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDN0IscUJBQWdCLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFZckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlD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