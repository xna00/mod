/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange"], function (require, exports, dom_1, lifecycle_1, observable_1, lineRange_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGutter = void 0;
    class EditorGutter extends lifecycle_1.Disposable {
        constructor(_editor, _domNode, itemProvider) {
            super();
            this._editor = _editor;
            this._domNode = _domNode;
            this.itemProvider = itemProvider;
            this.scrollTop = (0, observable_1.observableFromEvent)(this._editor.onDidScrollChange, (e) => /** @description editor.onDidScrollChange */ this._editor.getScrollTop());
            this.isScrollTopZero = this.scrollTop.map((scrollTop) => /** @description isScrollTopZero */ scrollTop === 0);
            this.modelAttached = (0, observable_1.observableFromEvent)(this._editor.onDidChangeModel, (e) => /** @description editor.onDidChangeModel */ this._editor.hasModel());
            this.editorOnDidChangeViewZones = (0, observable_1.observableSignalFromEvent)('onDidChangeViewZones', this._editor.onDidChangeViewZones);
            this.editorOnDidContentSizeChange = (0, observable_1.observableSignalFromEvent)('onDidContentSizeChange', this._editor.onDidContentSizeChange);
            this.domNodeSizeChanged = (0, observable_1.observableSignal)('domNodeSizeChanged');
            this.views = new Map();
            this._domNode.className = 'gutter monaco-editor';
            const scrollDecoration = this._domNode.appendChild((0, dom_1.h)('div.scroll-decoration', { role: 'presentation', ariaHidden: 'true', style: { width: '100%' } })
                .root);
            const o = new ResizeObserver(() => {
                (0, observable_1.transaction)(tx => {
                    /** @description ResizeObserver: size changed */
                    this.domNodeSizeChanged.trigger(tx);
                });
            });
            o.observe(this._domNode);
            this._register((0, lifecycle_1.toDisposable)(() => o.disconnect()));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update scroll decoration */
                scrollDecoration.className = this.isScrollTopZero.read(reader) ? '' : 'scroll-decoration';
            }));
            this._register((0, observable_1.autorun)(reader => /** @description EditorGutter.Render */ this.render(reader)));
        }
        dispose() {
            super.dispose();
            (0, dom_1.reset)(this._domNode);
        }
        render(reader) {
            if (!this.modelAttached.read(reader)) {
                return;
            }
            this.domNodeSizeChanged.read(reader);
            this.editorOnDidChangeViewZones.read(reader);
            this.editorOnDidContentSizeChange.read(reader);
            const scrollTop = this.scrollTop.read(reader);
            const visibleRanges = this._editor.getVisibleRanges();
            const unusedIds = new Set(this.views.keys());
            const viewRange = offsetRange_1.OffsetRange.ofStartAndLength(0, this._domNode.clientHeight);
            if (!viewRange.isEmpty) {
                for (const visibleRange of visibleRanges) {
                    const visibleRange2 = new lineRange_1.LineRange(visibleRange.startLineNumber, visibleRange.endLineNumber + 1);
                    const gutterItems = this.itemProvider.getIntersectingGutterItems(visibleRange2, reader);
                    (0, observable_1.transaction)(tx => {
                        /** EditorGutter.render */
                        for (const gutterItem of gutterItems) {
                            if (!gutterItem.range.intersect(visibleRange2)) {
                                continue;
                            }
                            unusedIds.delete(gutterItem.id);
                            let view = this.views.get(gutterItem.id);
                            if (!view) {
                                const viewDomNode = document.createElement('div');
                                this._domNode.appendChild(viewDomNode);
                                const gutterItemObs = (0, observable_1.observableValue)('item', gutterItem);
                                const itemView = this.itemProvider.createView(gutterItemObs, viewDomNode);
                                view = new ManagedGutterItemView(gutterItemObs, itemView, viewDomNode);
                                this.views.set(gutterItem.id, view);
                            }
                            else {
                                view.item.set(gutterItem, tx);
                            }
                            const top = gutterItem.range.startLineNumber <= this._editor.getModel().getLineCount()
                                ? this._editor.getTopForLineNumber(gutterItem.range.startLineNumber, true) - scrollTop
                                : this._editor.getBottomForLineNumber(gutterItem.range.startLineNumber - 1, false) - scrollTop;
                            const bottom = gutterItem.range.isEmpty
                                // Don't trust that `getBottomForLineNumber` for the previous line equals `getTopForLineNumber` for the current one.
                                ? top
                                : (this._editor.getBottomForLineNumber(gutterItem.range.endLineNumberExclusive - 1, true) - scrollTop);
                            const height = bottom - top;
                            view.domNode.style.top = `${top}px`;
                            view.domNode.style.height = `${height}px`;
                            view.gutterItemView.layout(offsetRange_1.OffsetRange.ofStartAndLength(top, height), viewRange);
                        }
                    });
                }
            }
            for (const id of unusedIds) {
                const view = this.views.get(id);
                view.gutterItemView.dispose();
                this._domNode.removeChild(view.domNode);
                this.views.delete(id);
            }
        }
    }
    exports.EditorGutter = EditorGutter;
    class ManagedGutterItemView {
        constructor(item, gutterItemView, domNode) {
            this.item = item;
            this.gutterItemView = gutterItemView;
            this.domNode = domNode;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3V0dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci91dGlscy9lZGl0b3JHdXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsWUFBMEQsU0FBUSxzQkFBVTtRQWV4RixZQUNrQixPQUF5QixFQUN6QixRQUFxQixFQUNyQixZQUFvQztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUpTLFlBQU8sR0FBUCxPQUFPLENBQWtCO1lBQ3pCLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDckIsaUJBQVksR0FBWixZQUFZLENBQXdCO1lBakJyQyxjQUFTLEdBQUcsSUFBQSxnQ0FBbUIsRUFDL0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFDOUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLDRDQUE0QyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQy9FLENBQUM7WUFDZSxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxtQ0FBbUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekcsa0JBQWEsR0FBRyxJQUFBLGdDQUFtQixFQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUM3QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsMkNBQTJDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FDMUUsQ0FBQztZQUVlLCtCQUEwQixHQUFHLElBQUEsc0NBQXlCLEVBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2xILGlDQUE0QixHQUFHLElBQUEs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