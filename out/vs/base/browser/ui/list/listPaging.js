/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "./listWidget", "vs/base/browser/dom", "vs/css!./list"], function (require, exports, arrays_1, cancellation_1, event_1, lifecycle_1, listWidget_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PagedList = void 0;
    class PagedRenderer {
        get templateId() { return this.renderer.templateId; }
        constructor(renderer, modelProvider) {
            this.renderer = renderer;
            this.modelProvider = modelProvider;
        }
        renderTemplate(container) {
            const data = this.renderer.renderTemplate(container);
            return { data, disposable: lifecycle_1.Disposable.None };
        }
        renderElement(index, _, data, height) {
            data.disposable?.dispose();
            if (!data.data) {
                return;
            }
            const model = this.modelProvider();
            if (model.isResolved(index)) {
                return this.renderer.renderElement(model.get(index), index, data.data, height);
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const promise = model.resolve(index, cts.token);
            data.disposable = { dispose: () => cts.cancel() };
            this.renderer.renderPlaceholder(index, data.data);
            promise.then(entry => this.renderer.renderElement(entry, index, data.data, height));
        }
        disposeTemplate(data) {
            if (data.disposable) {
                data.disposable.dispose();
                data.disposable = undefined;
            }
            if (data.data) {
                this.renderer.disposeTemplate(data.data);
                data.data = undefined;
            }
        }
    }
    class PagedAccessibilityProvider {
        constructor(modelProvider, accessibilityProvider) {
            this.modelProvider = modelProvider;
            this.accessibilityProvider = accessibilityProvider;
        }
        getWidgetAriaLabel() {
            return this.accessibilityProvider.getWidgetAriaLabel();
        }
        getAriaLabel(index) {
            const model = this.modelProvider();
            if (!model.isResolved(index)) {
                return null;
            }
            return this.accessibilityProvider.getAriaLabel(model.get(index));
        }
    }
    function fromPagedListOptions(modelProvider, options) {
        return {
            ...options,
            accessibilityProvider: options.accessibilityProvider && new PagedAccessibilityProvider(modelProvider, options.accessibilityProvider)
        };
    }
    class PagedList {
        constructor(user, container, virtualDelegate, renderers, options = {}) {
            const modelProvider = () => this.model;
            const pagedRenderers = renderers.map(r => new PagedRenderer(r, modelProvider));
            this.list = new listWidget_1.List(user, container, virtualDelegate, pagedRenderers, fromPagedListOptions(modelProvider, options));
        }
        updateOptions(options) {
            this.list.updateOptions(options);
        }
        getHTMLElement() {
            return this.list.getHTMLElement();
        }
        isDOMFocused() {
            return (0, dom_1.isActiveElement)(this.getHTMLElement());
        }
        domFocus() {
            this.list.domFocus();
        }
        get onDidFocus() {
            return this.list.onDidFocus;
        }
        get onDidBlur() {
            return this.list.onDidBlur;
        }
        get widget() {
            return this.list;
        }
        get onDidDispose() {
            return this.list.onDidDispose;
        }
        get onMouseClick() {
            return event_1.Event.map(this.list.onMouseClick, ({ element, index, browserEvent }) => ({ element: element === undefined ? undefined : this._model.get(element), index, browserEvent }));
        }
        get onMouseDblClick() {
            return event_1.Event.map(this.list.onMouseDblClick, ({ element, index, browserEvent }) => ({ element: element === undefined ? undefined : this._model.get(element), index, browserEvent }));
        }
        get onTap() {
            return event_1.Event.map(this.list.onTap, ({ element, index, browserEvent }) => ({ element: element === undefined ? undefined : this._model.get(element), index, browserEvent }));
        }
        get onPointer() {
            return event_1.Event.map(this.list.onPointer, ({ element, index, browserEvent }) => ({ element: element === undefined ? undefined : this._model.get(element), index, browserEvent }));
        }
        get onDidChangeFocus() {
            return event_1.Event.map(this.list.onDidChangeFocus, ({ elements, indexes, browserEvent }) => ({ elements: elements.map(e => this._model.get(e)), indexes, browserEvent }));
        }
        get onDidChangeSelection() {
            return event_1.Event.map(this.list.onDidChangeSelection, ({ elements, indexes, browserEvent }) => ({ elements: elements.map(e => this._model.get(e)), indexes, browserEvent }));
        }
        get onContextMenu() {
            return event_1.Event.map(this.list.onContextMenu, ({ element, index, anchor, browserEvent }) => (typeof element === 'undefined' ? { element, index, anchor, browserEvent } : { element: this._model.get(element), index, anchor, browserEvent }));
        }
        get model() {
            return this._model;
        }
        set model(model) {
            this._model = model;
            this.list.splice(0, this.list.length, (0, arrays_1.range)(model.length));
        }
        get length() {
            return this.list.length;
        }
        get scrollTop() {
            return this.list.scrollTop;
        }
        set scrollTop(scrollTop) {
            this.list.scrollTop = scrollTop;
        }
        get scrollLeft() {
            return this.list.scrollLeft;
        }
        set scrollLeft(scrollLeft) {
            this.list.scrollLeft = scrollLeft;
        }
        setAnchor(index) {
            this.list.setAnchor(index);
        }
        getAnchor() {
            return this.list.getAnchor();
        }
        setFocus(indexes) {
            this.list.setFocus(indexes);
        }
        focusNext(n, loop) {
            this.list.focusNext(n, loop);
        }
        focusPrevious(n, loop) {
            this.list.focusPrevious(n, loop);
        }
        focusNextPage() {
            return this.list.focusNextPage();
        }
        focusPreviousPage() {
            return this.list.focusPreviousPage();
        }
        focusLast() {
            this.list.focusLast();
        }
        focusFirst() {
            this.list.focusFirst();
        }
        getFocus() {
            return this.list.getFocus();
        }
        setSelection(indexes, browserEvent) {
            this.list.setSelection(indexes, browserEvent);
        }
        getSelection() {
            return this.list.getSelection();
        }
        getSelectedElements() {
            return this.getSelection().map(i => this.model.get(i));
        }
        layout(height, width) {
            this.list.layout(height, width);
        }
        triggerTypeNavigation() {
            this.list.triggerTypeNavigation();
        }
        reveal(index, relativeTop) {
            this.list.reveal(index, relativeTop);
        }
        style(styles) {
            this.list.style(styles);
        }
        dispose() {
            this.list.dispose();
        }
    }
    exports.PagedList = PagedList;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFBhZ2luZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2xpc3QvbGlzdFBhZ2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQmhHLE1BQU0sYUFBYTtRQUVsQixJQUFJLFVBQVUsS0FBYSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUU3RCxZQUNTLFFBQWlELEVBQ2pELGFBQTBDO1lBRDFDLGFBQVEsR0FBUixRQUFRLENBQXlDO1lBQ2pELGtCQUFhLEdBQWIsYUFBYSxDQUE2QjtRQUMvQyxDQUFDO1FBRUwsY0FBYyxDQUFDLFNBQXNCO1lBQ3BDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLHNCQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUMsQ0FBQztRQUVELGFBQWEsQ0FBQyxLQUFhLEVBQUUsQ0FBUyxFQUFFLElBQWtDLEVBQUUsTUFBMEI7WUFDckcsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUUzQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUVuQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1B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