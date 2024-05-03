/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, lifecycle_1, observable_1, mapping_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollSynchronizer = void 0;
    class ScrollSynchronizer extends lifecycle_1.Disposable {
        get model() { return this.viewModel.get()?.model; }
        get shouldAlignResult() { return this.layout.get().kind === 'columns'; }
        get shouldAlignBase() { return this.layout.get().kind === 'mixed' && !this.layout.get().showBaseAtTop; }
        constructor(viewModel, input1View, input2View, baseView, inputResultView, layout) {
            super();
            this.viewModel = viewModel;
            this.input1View = input1View;
            this.input2View = input2View;
            this.baseView = baseView;
            this.inputResultView = inputResultView;
            this.layout = layout;
            this.reentrancyBarrier = new utils_1.ReentrancyBarrier();
            const handleInput1OnScroll = this.updateScrolling = () => {
                if (!this.model) {
                    return;
                }
                this.input2View.editor.setScrollTop(this.input1View.editor.getScrollTop(), 1 /* ScrollType.Immediate */);
                if (this.shouldAlignResult) {
                    this.inputResultView.editor.setScrollTop(this.input1View.editor.getScrollTop(), 1 /* ScrollType.Immediate */);
                }
                else {
                    const mappingInput1Result = this.model.input1ResultMapping.get();
                    this.synchronizeScrolling(this.input1View.editor, this.inputResultView.editor, mappingInput1Result);
                }
                const baseView = this.baseView.get();
                if (baseView) {
                    if (this.shouldAlignBase) {
                        this.baseView.get()?.editor.setScrollTop(this.input1View.editor.getScrollTop(), 1 /* ScrollType.Immediate */);
                    }
                    else {
                        const mapping = new mapping_1.DocumentLineRangeMap(this.model.baseInput1Diffs.get(), -1).reverse();
                        this.synchronizeScrolling(this.input1View.editor, baseView.editor, mapping);
                    }
                }
            };
            this._store.add(this.input1View.editor.onDidScrollChange(this.reentrancyBarrier.makeExclusive((c) => {
                if (c.scrollTopChanged) {
                    handleInput1OnScroll();
                }
                if (c.scrollLeftChanged) {
                    this.baseView.get()?.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                    this.input2View.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                    this.inputResultView.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                }
            })));
            this._store.add(this.input2View.editor.onDidScrollChange(this.reentrancyBarrier.makeExclusive((c) => {
                if (!this.model) {
                    return;
                }
                if (c.scrollTopChanged) {
                    this.input1View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                    if (this.shouldAlignResult) {
                        this.inputResultView.editor.setScrollTop(this.input2View.editor.getScrollTop(), 1 /* ScrollType.Immediate */);
                    }
                    else {
                        const mappingInput2Result = this.model.input2ResultMapping.get();
                        this.synchronizeScrolling(this.input2View.editor, this.inputResultView.editor, mappingInput2Result);
                    }
                    const baseView = this.baseView.get();
                    if (baseView && this.model) {
                        if (this.shouldAlignBase) {
                            this.baseView.get()?.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                        }
                        else {
                            const mapping = new mapping_1.DocumentLineRangeMap(this.model.baseInput2Diffs.get(), -1).reverse();
                            this.synchronizeScrolling(this.input2View.editor, baseView.editor, mapping);
                        }
                    }
                }
                if (c.scrollLeftChanged) {
                    this.baseView.get()?.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                    this.input1View.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                    this.inputResultView.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                }
            })));
            this._store.add(this.inputResultView.editor.onDidScrollChange(this.reentrancyBarrier.makeExclusive((c) => {
                if (c.scrollTopChanged) {
                    if (this.shouldAlignResult) {
                        this.input1View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                        this.input2View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                    }
                    else {
                        const mapping1 = this.model?.resultInput1Mapping.get();
                        this.synchronizeScrolling(this.inputResultView.editor, this.input1View.editor, mapping1);
                        const mapping2 = this.model?.resultInput2Mapping.get();
                        this.synchronizeScrolling(this.inputResultView.editor, this.input2View.editor, mapping2);
                    }
                    const baseMapping = this.model?.resultBaseMapping.get();
                    const baseView = this.baseView.get();
                    if (baseView && this.model) {
                        this.synchronizeScrolling(this.inputResultView.editor, baseView.editor, baseMapping);
                    }
                }
                if (c.scrollLeftChanged) {
                    this.baseView.get()?.editor?.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                    this.input1View.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                    this.input2View.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                }
            })));
            this._store.add((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description set baseViewEditor.onDidScrollChange */
                const baseView = this.baseView.read(reader);
                if (baseView) {
                    store.add(baseView.editor.onDidScrollChange(this.reentrancyBarrier.makeExclusive((c) => {
                        if (c.scrollTopChanged) {
                            if (!this.model) {
                                return;
                            }
                            if (this.shouldAlignBase) {
                                this.input1View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                                this.input2View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                            }
                            else {
                                const baseInput1Mapping = new mapping_1.DocumentLineRangeMap(this.model.baseInput1Diffs.get(), -1);
                                this.synchronizeScrolling(baseView.editor, this.input1View.editor, baseInput1Mapping);
                                const baseInput2Mapping = new mapping_1.DocumentLineRangeMap(this.model.baseInput2Diffs.get(), -1);
                                this.synchronizeScrolling(baseView.editor, this.input2View.editor, baseInput2Mapping);
                            }
                            const baseMapping = this.model?.baseResultMapping.get();
                            this.synchronizeScrolling(baseView.editor, this.inputResultView.editor, baseMapping);
                        }
                        if (c.scrollLeftChanged) {
                            this.inputResultView.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                            this.input1View.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                            this.input2View.editor.setScrollLeft(c.scrollLeft, 1 /* ScrollType.Immediate */);
                        }
                    })));
                }
            }));
        }
        synchronizeScrolling(scrollingEditor, targetEditor, mapping) {
            if (!mapping) {
                return;
            }
            const visibleRanges = scrollingEditor.getVisibleRanges();
            if (visibleRanges.length === 0) {
                return;
            }
            const topLineNumber = visibleRanges[0].startLineNumber - 1;
            const result = mapping.project(topLineNumber);
            const sourceRange = result.inputRange;
            const targetRange = result.outputRange;
            const resultStartTopPx = targetEditor.getTopForLineNumber(targetRange.startLineNumber);
            const resultEndPx = targetEditor.getTopForLineNumber(targetRange.endLineNumberExclusive);
            const sourceStartTopPx = scrollingEditor.getTopForLineNumber(sourceRange.startLineNumber);
            const sourceEndPx = scrollingEditor.getTopForLineNumber(sourceRange.endLineNumberExclusive);
            const factor = Math.min((scrollingEditor.getScrollTop() - sourceStartTopPx) / (sourceEndPx - sourceStartTopPx), 1);
            const resultScrollPosition = resultStartTopPx + (resultEndPx - resultStartTopPx) * factor;
            targetEditor.setScrollTop(resultScrollPosition, 1 /* ScrollType.Immediate */);
        }
    }
    exports.ScrollSynchronizer = ScrollSynchronizer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsU3luY2hyb25pemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvc2Nyb2xsU3luY2hyb25pemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBQ2pELElBQVksS0FBSyxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBTTNELElBQVksaUJBQWlCLEtBQUssT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLElBQVksZUFBZSxLQUFLLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBRWhILFlBQ2tCLFNBQXdELEVBQ3hELFVBQStCLEVBQy9CLFVBQStCLEVBQy9CLFFBQXFELEVBQ3JELGVBQXFDLEVBQ3JDLE1BQXVDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBUFMsY0FBUyxHQUFULFNBQVMsQ0FBK0M7WUFDeEQsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7WUFDL0IsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7WUFDL0IsYUFBUSxHQUFSLFFBQVEsQ0FBNkM7WUFDckQsb0JBQWUsR0FBZixlQUFlLENBQXNCO1lBQ3JDLFdBQU0sR0FBTixNQUFNLENBQWlDO1lBYnhDLHNCQUFpQixHQUFHLElBQUkseUJBQWlCLEVBQUUsQ0FBQztZQWlCNUQsTUFBTSxvQkFB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