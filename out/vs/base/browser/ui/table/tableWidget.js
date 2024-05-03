/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/base/common/lifecycle", "vs/css!./table"], function (require, exports, dom_1, hoverDelegateFactory_1, updatableHoverWidget_1, listWidget_1, splitview_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Table = void 0;
    class TableListRenderer {
        static { this.TemplateId = 'row'; }
        constructor(columns, renderers, getColumnSize) {
            this.columns = columns;
            this.getColumnSize = getColumnSize;
            this.templateId = TableListRenderer.TemplateId;
            this.renderedTemplates = new Set();
            const rendererMap = new Map(renderers.map(r => [r.templateId, r]));
            this.renderers = [];
            for (const column of columns) {
                const renderer = rendererMap.get(column.templateId);
                if (!renderer) {
                    throw new Error(`Table cell renderer for template id ${column.templateId} not found.`);
                }
                this.renderers.push(renderer);
            }
        }
        renderTemplate(container) {
            const rowContainer = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-table-tr'));
            const cellContainers = [];
            const cellTemplateData = [];
            for (let i = 0; i < this.columns.length; i++) {
                const renderer = this.renderers[i];
                const cellContainer = (0, dom_1.append)(rowContainer, (0, dom_1.$)('.monaco-table-td', { 'data-col-index': i }));
                cellContainer.style.width = `${this.getColumnSize(i)}px`;
                cellContainers.push(cellContainer);
                cellTemplateData.push(renderer.renderTemplate(cellContainer));
            }
            const result = { container, cellContainers, cellTemplateData };
            this.renderedTemplates.add(result);
            return result;
        }
        renderElement(element, index, templateData, height) {
            for (let i = 0; i < this.columns.length; i++) {
                const column = this.columns[i];
                const cell = column.project(element);
                const renderer = this.renderers[i];
                renderer.renderElement(cell, index, templateData.cellTemplateData[i], height);
            }
        }
        disposeElement(element, index, templateData, height) {
            for (let i = 0; i < this.columns.length; i++) {
                const renderer = this.renderers[i];
                if (renderer.disposeElement) {
                    const column = this.columns[i];
                    const cell = column.project(element);
                    renderer.disposeElement(cell, index, templateData.cellTemplateData[i], height);
                }
            }
        }
        disposeTemplate(templateData) {
            for (let i = 0; i < this.columns.length; i++) {
                const renderer = this.renderers[i];
                renderer.disposeTemplate(templateData.cellTemplateData[i]);
            }
            (0, dom_1.clearNode)(templateData.container);
            this.renderedTemplates.delete(templateData);
        }
        layoutColumn(index, size) {
            for (const { cellContainers } of this.renderedTemplates) {
                cellContainers[index].style.width = `${size}px`;
            }
        }
    }
    function asListVirtualDelegate(delegate) {
        return {
            getHeight(row) { return delegate.getHeight(row); },
            getTemplateId() { return TableListRenderer.TemplateId; },
        };
    }
    class ColumnHeader extends lifecycle_1.Disposable {
        get minimumSize() { return this.column.minimumWidth ?? 120; }
        get maximumSize() { return this.column.maximumWidth ?? Number.POSITIVE_INFINITY; }
        get onDidChange() { return this.column.onDidChangeWidthConstraints ?? event_1.Event.None; }
        constructor(column, index) {
            super();
            this.column = column;
            this.index = index;
            this._onDidLayout = new event_1.Emitter();
            this.onDidLayout = this._onDidLayout.event;
            this.element = (0, dom_1.$)('.monaco-table-th', { 'data-col-index': index }, column.label);
            if (column.tooltip) {
                this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.element, column.tooltip));
            }
        }
        layout(size) {
            this._onDidLayout.fire([this.index, size]);
        }
    }
    class Table {
        static { this.InstanceCount = 0; }
        get onDidChangeFocus() { return this.list.onDidChangeFocus; }
        get onDidChangeSelection() { return this.list.onDidChangeSelection; }
        get onDidScroll() { return this.list.onDidScroll; }
        get onMouseClick() { return this.list.onMouseClick; }
        get onMouseDblClick() { return this.list.onMouseDblClick; }
        get onMouseMiddleClick() { return this.list.onMouseMiddleClick; }
        get onPointer() { return this.list.onPointer; }
        get onMouseUp() { return this.list.onMouseUp; }
        get onMouseDown() { return this.list.onMouseDown; }
        get onMouseOver() { return this.list.onMouseOver; }
        get onMouseMove() { return this.list.onMouseMove; }
        get onMouseOut() { return this.list.onMouseOut; }
        get onTouchStart() { return this.list.onTouchStart; }
        get onTap() { return this.list.onTap; }
        get onContextMenu() { return this.list.onContextMenu; }
        get onDidFocus() { return this.list.onDidFocus; }
        get onDidBlur() { return this.list.onDidBlur; }
        get scrollTop() { return this.list.scrollTop; }
        set scrollTop(scrollTop) { this.list.scrollTop = scrollTop; }
        get scrollLeft() { return this.list.scrollLeft; }
        set scrollLeft(scrollLeft) { this.list.scrollLeft = scrollLeft; }
        get scrollHeight() { return this.list.scrollHeight; }
        get renderHeight() { return this.list.renderHeight; }
        get onDidDispose() { return this.list.onDidDispose; }
        constructor(user, container, virtualDelegate, columns, renderers, _options) {
            this.virtualDelegate = virtualDelegate;
            this.domId = `table_id_${++Table.InstanceCount}`;
            this.disposables = new lifecycle_1.DisposableStore();
            this.cachedWidth = 0;
            this.cachedHeight = 0;
            this.domNode = (0, dom_1.append)(container, (0, dom_1.$)(`.monaco-table.${this.domId}`));
            const headers = columns.map((c, i) => this.disposables.add(new ColumnHeader(c, i)));
            const descriptor = {
                size: headers.reduce((a, b) => a + b.column.weight, 0),
                views: headers.map(view => ({ size: view.column.weight, view }))
            };
            this.splitview = this.disposables.add(new splitview_1.SplitView(this.domNode, {
                orientation: 1 /* Orientation.HORIZONTAL */,
                scrollbarVisibility: 2 /* ScrollbarVisibility.Hidden */,
                getSashOrthogonalSize: () => this.cachedHeight,
                descriptor
            }));
            this.splitview.el.style.height = `${virtualDelegate.headerRowHeight}px`;
            this.splitview.el.style.lineHeight = `${virtualDelegate.headerRowHeight}px`;
            const renderer = new TableListRenderer(columns, renderers, i => this.splitview.getViewSize(i));
            this.list = this.disposables.add(new listWidget_1.List(user, this.domNode, asListVirtualDelegate(virtualDelegate), [renderer], _options));
            event_1.Event.any(...headers.map(h => h.onDidLayout))(([index, size]) => renderer.layoutColumn(index, size), null, this.disposables);
            this.splitview.onDidSashReset(index => {
                const totalWeight = columns.reduce((r, c) => r + c.weight, 0);
                const size = columns[index].weight / totalWeight * this.cachedWidth;
                this.splitview.resizeView(index, size);
            }, null, this.disposables);
            this.styleElement = (0, dom_1.createStyleSheet)(this.domNode);
            this.style(listWidget_1.unthemedListStyles);
        }
        updateOptions(options) {
            this.list.updateOptions(options);
        }
        splice(start, deleteCount, elements = []) {
            this.list.splice(start, deleteCount, elements);
        }
        rerender() {
            this.list.rerender();
        }
        row(index) {
            return this.list.element(index);
        }
        indexOf(element) {
            return this.list.indexOf(element);
        }
        get length() {
            return this.list.length;
        }
        getHTMLElement() {
            return this.domNode;
        }
        layout(height, width) {
            height = height ?? (0, dom_1.getContentHeight)(this.domNode);
            width = width ?? (0, dom_1.getContentWidth)(this.domNode);
            this.cachedWidth = width;
            this.cachedHeight = height;
            this.splitview.layout(width);
            const listHeight = height - this.virtualDelegate.headerRowHeight;
            this.list.getHTMLElement().style.height = `${listHeight}px`;
            this.list.layout(listHeight, width);
        }
        triggerTypeNavigation() {
            this.list.triggerTypeNavigation();
        }
        style(styles) {
            const content = [];
            content.push(`.monaco-table.${this.domId} > .monaco-split-view2 .monaco-sash.vertical::before {
			top: ${this.virtualDelegate.headerRowHeight + 1}px;
			height: calc(100% - ${this.virtualDelegate.headerRowHeight}px);
		}`);
            this.styleElement.textContent = content.join('\n');
            this.list.style(styles);
        }
        domFocus() {
            this.list.domFocus();
        }
        setAnchor(index) {
            this.list.setAnchor(index);
        }
        getAnchor() {
            return this.list.getAnchor();
        }
        getSelectedElements() {
            return this.list.getSelectedElements();
        }
        setSelection(indexes, browserEvent) {
            this.list.setSelection(indexes, browserEvent);
        }
        getSelection() {
            return this.list.getSelection();
        }
        setFocus(indexes, browserEvent) {
            this.list.setFocus(indexes, browserEvent);
        }
        focusNext(n = 1, loop = false, browserEvent) {
            this.list.focusNext(n, loop, browserEvent);
        }
        focusPrevious(n = 1, loop = false, browserEvent) {
            this.list.focusPrevious(n, loop, browserEvent);
        }
        focusNextPage(browserEvent) {
            return this.list.focusNextPage(browserEvent);
        }
        focusPreviousPage(browserEvent) {
            return this.list.focusPreviousPage(browserEvent);
        }
        focusFirst(browserEvent) {
            this.list.focusFirst(browserEvent);
        }
        focusLast(browserEvent) {
            this.list.focusLast(browserEvent);
        }
        getFocus() {
            return this.list.getFocus();
        }
        getFocusedElements() {
            return this.list.getFocusedElements();
        }
        getRelativeTop(index) {
            return this.list.getRelativeTop(index);
        }
        reveal(index, relativeTop) {
            this.list.reveal(index, relativeTop);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.Table = Table;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS90YWJsZS90YWJsZVdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLE1BQU0saUJBQWlCO2lCQUVmLGVBQVUsR0FBRyxLQUFLLEFBQVIsQ0FBUztRQUsxQixZQUNTLE9BQW9DLEVBQzVDLFNBQTJDLEVBQ25DLGFBQXdDO1lBRnhDLFlBQU8sR0FBUCxPQUFPLENBQTZCO1lBRXBDLGtCQUFhLEdBQWIsYUFBYSxDQUEyQjtZQVB4QyxlQUFVLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDO1lBRTNDLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1lBT3RELE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBRXBCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUVwRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsTUFBTSxDQUFDLFVBQVUsYUFBYSxDQUFDLENBQUM7Z0JBQ3hGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFRCxjQUFjLENBQUMsU0FBc0I7WUFD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