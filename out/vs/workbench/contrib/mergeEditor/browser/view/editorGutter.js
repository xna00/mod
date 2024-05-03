/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/workbench/contrib/mergeEditor/browser/model/lineRange"], function (require, exports, dom_1, lifecycle_1, observable_1, lineRange_1) {
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
            if (visibleRanges.length > 0) {
                const visibleRange = visibleRanges[0];
                const visibleRange2 = new lineRange_1.LineRange(visibleRange.startLineNumber, visibleRange.endLineNumber - visibleRange.startLineNumber).deltaEnd(1);
                const gutterItems = this.itemProvider.getIntersectingGutterItems(visibleRange2, reader);
                for (const gutterItem of gutterItems) {
                    if (!gutterItem.range.touches(visibleRange2)) {
                        continue;
                    }
                    unusedIds.delete(gutterItem.id);
                    let view = this.views.get(gutterItem.id);
                    if (!view) {
                        const viewDomNode = document.createElement('div');
                        this._domNode.appendChild(viewDomNode);
                        const itemView = this.itemProvider.createView(gutterItem, viewDomNode);
                        view = new ManagedGutterItemView(itemView, viewDomNode);
                        this.views.set(gutterItem.id, view);
                    }
                    else {
                        view.gutterItemView.update(gutterItem);
                    }
                    const top = gutterItem.range.startLineNumber <= this._editor.getModel().getLineCount()
                        ? this._editor.getTopForLineNumber(gutterItem.range.startLineNumber, true) - scrollTop
                        : this._editor.getBottomForLineNumber(gutterItem.range.startLineNumber - 1, false) - scrollTop;
                    const bottom = this._editor.getBottomForLineNumber(gutterItem.range.endLineNumberExclusive - 1, true) - scrollTop;
                    const height = bottom - top;
                    view.domNode.style.top = `${top}px`;
                    view.domNode.style.height = `${height}px`;
                    view.gutterItemView.layout(top, height, 0, this._domNode.clientHeight);
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
        constructor(gutterItemView, domNode) {
            this.gutterItemView = gutterItemView;
            this.domNode = domNode;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3V0dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvZWRpdG9yR3V0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLFlBQTBELFNBQVEsc0JBQVU7UUFleEYsWUFDa0IsT0FBeUIsRUFDekIsUUFBcUIsRUFDckIsWUFBb0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFKUyxZQUFPLEdBQVAsT0FBTyxDQUFrQjtZQUN6QixhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUF3QjtZQWpCckMsY0FBUyxHQUFHLElBQUEsZ0NBQW1CLEVBQy9DLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQzlCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUMvRSxDQUFDO1lBQ2Usb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsbUNBQW1DLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLGtCQUFhLEdBQUcsSUFBQSxnQ0FBbUIsRUFDbkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFDN0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLDJDQUEyQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQzFFLENBQUM7WUFFZSwrQkFBMEIsR0FBRyxJQUFBLHNDQUF5QixFQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNsSCxpQ0FBNEIsR0FBRyxJ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