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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arraysFind", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/base/common/scrollable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/offsetRange", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "./diffEditorItemTemplate", "./objectPool", "vs/base/common/errors", "vs/css!./style"], function (require, exports, dom_1, scrollableElement_1, arraysFind_1, lifecycle_1, observable_1, base_1, scrollable_1, utils_1, offsetRange_1, selection_1, editorContextKeys_1, contextkey_1, instantiation_1, serviceCollection_1, diffEditorItemTemplate_1, objectPool_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditorWidgetImpl = void 0;
    let MultiDiffEditorWidgetImpl = class MultiDiffEditorWidgetImpl extends lifecycle_1.Disposable {
        constructor(_element, _dimension, _viewModel, _workbenchUIElementFactory, _parentContextKeyService, _parentInstantiationService) {
            super();
            this._element = _element;
            this._dimension = _dimension;
            this._viewModel = _viewModel;
            this._workbenchUIElementFactory = _workbenchUIElementFactory;
            this._parentContextKeyService = _parentContextKeyService;
            this._parentInstantiationService = _parentInstantiationService;
            this._elements = (0, dom_1.h)('div.monaco-component.multiDiffEditor', [
                (0, dom_1.h)('div@content', {
                    style: {
                        overflow: 'hidden',
                    }
                }),
                (0, dom_1.h)('div.monaco-editor@overflowWidgetsDomNode', {}),
            ]);
            this._sizeObserver = this._register(new utils_1.ObservableElementSizeObserver(this._element, undefined));
            this._objectPool = this._register(new objectPool_1.ObjectPool((data) => {
                const template = this._instantiationService.createInstance(diffEditorItemTemplate_1.DiffEditorItemTemplate, this._elements.content, this._elements.overflowWidgetsDomNode, this._workbenchUIElementFactory);
                template.setData(data);
                return template;
            }));
            this._scrollable = this._register(new scrollable_1.Scrollable({
                forceIntegerValues: false,
                scheduleAtNextAnimationFrame: (cb) => (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this._element), cb),
                smoothScrollDuration: 100,
            }));
            this._scrollableElement = this._register(new scrollableElement_1.SmoothScrollableElement(this._elements.root, {
                vertical: 1 /* ScrollbarVisibility.Auto */,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                useShadows: false,
            }, this._scrollable));
            this.scrollTop = (0, observable_1.observableFromEvent)(this._scrollableElement.onScroll, () => /** @description scrollTop */ this._scrollableElement.getScrollPosition().scrollTop);
            this.scrollLeft = (0, observable_1.observableFromEvent)(this._scrollableElement.onScroll, () => /** @description scrollLeft */ this._scrollableElement.getScrollPosition().scrollLeft);
            this._viewItems = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                const vm = this._viewModel.read(reader);
                if (!vm) {
                    return [];
                }
                const items = vm.items.read(reader);
                return items.map(d => {
                    const item = store.add(new VirtualizedViewItem(d, this._objectPool, this.scrollLeft, delta => {
                        this._scrollableElement.setScrollPosition({ scrollTop: this._scrollableElement.getScrollPosition().scrollTop + delta });
                    }));
                    const data = this._lastDocStates?.[item.getKey()];
                    if (data) {
                        (0, base_1.transaction)(tx => {
                            item.setViewState(data, tx);
                        });
                    }
                    return item;
                });
            });
            this._spaceBetweenPx = 0;
            this._totalHeight = this._viewItems.map(this, (items, reader) => items.reduce((r, i) => r + i.contentHeight.read(reader) + this._spaceBetweenPx, 0));
            this.activeDiffItem = (0, observable_1.derived)(this, reader => this._viewItems.read(reader).find(i => i.template.read(reader)?.isFocused.read(reader)));
            this.lastActiveDiffItem = (0, observable_1.derivedObservableWithCache)((reader, lastValue) => this.activeDiffItem.read(reader) ?? lastValue);
            this.activeControl = (0, observable_1.derived)(this, reader => this.lastActiveDiffItem.read(reader)?.template.read(reader)?.editor);
            this._contextKeyService = this._register(this._parentContextKeyService.createScoped(this._element));
            this._instantiationService = this._parentInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            /** This accounts for documents that are not loaded yet. */
            this._lastDocStates = {};
            this._contextKeyService.createKey(editorContextKeys_1.EditorContextKeys.inMultiDiffEditor.key, true);
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                const viewModel = this._viewModel.read(reader);
                if (viewModel && viewModel.contextKeys) {
                    for (const [key, value] of Object.entries(viewModel.contextKeys)) {
                        const contextKey = this._contextKeyService.createKey(key, undefined);
                        contextKey.set(value);
                        store.add((0, lifecycle_1.toDisposable)(() => contextKey.reset()));
                    }
                }
            }));
            const ctxAllCollapsed = this._parentContextKeyService.createKey(editorContextKeys_1.EditorContextKeys.multiDiffEditorAllCollapsed.key, false);
            this._register((0, observable_1.autorun)((reader) => {
                const viewModel = this._viewModel.read(reader);
                if (viewModel) {
                    const allCollapsed = viewModel.items.read(reader).every(item => item.collapsed.read(reader));
                    ctxAllCollapsed.set(allCollapsed);
                }
            }));
            this._register((0, observable_1.autorun)((reader) => {
                const lastActiveDiffItem = this.lastActiveDiffItem.read(reader);
                (0, base_1.transaction)(tx => {
                    this._viewModel.read(reader)?.activeDiffItem.set(lastActiveDiffItem?.viewModel, tx);
                });
            }));
            this._register((0, observable_1.autorun)((reader) => {
                /** @description Update widget dimension */
                const dimension = this._dimension.read(reader);
                this._sizeObserver.observe(dimension);
            }));
            this._elements.content.style.position = 'relative';
            this._register((0, observable_1.autorun)((reader) => {
                /** @description Update scroll dimensions */
                const height = this._sizeObserver.height.read(reader);
                this._elements.root.style.height = `${height}px`;
                const totalHeight = this._totalHeight.read(reader);
                this._elements.content.style.height = `${totalHeight}px`;
                const width = this._sizeObserver.width.read(reader);
                let scrollWidth = width;
                const viewItems = this._viewItems.read(reader);
                const max = (0, arraysFind_1.findFirstMaxBy)(viewItems, i => i.maxScroll.read(reader).maxScroll);
                if (max) {
                    const maxScroll = max.maxScroll.read(reader);
                    scrollWidth = width + maxScroll.maxScroll;
                }
                this._scrollableElement.setScrollDimensions({
                    width: width,
                    height: height,
                    scrollHeight: totalHeight,
                    scrollWidth,
                });
            }));
            _element.replaceChildren(this._scrollableElement.getDomNode());
            this._register((0, lifecycle_1.toDisposable)(() => {
                _element.replaceChildren();
            }));
            this._register(this._register((0, observable_1.autorun)(reader => {
                /** @description Render all */
                (0, base_1.globalTransaction)(tx => {
                    this.render(reader);
                });
            })));
        }
        setScrollState(scrollState) {
            this._scrollableElement.setScrollPosition({ scrollLeft: scrollState.left, scrollTop: scrollState.top });
        }
        reveal(resource, options) {
            const viewItems = this._viewItems.get();
            const index = viewItems.findIndex((item) => item.viewModel.originalUri?.toString() === resource.original?.toString()
                && item.viewModel.modifiedUri?.toString() === resource.modified?.toString());
            if (index === -1) {
                throw new errors_1.BugIndicatingError('Resource not found in diff editor');
            }
            let scrollTop = 0;
            for (let i = 0; i < index; i++) {
                scrollTop += viewItems[i].contentHeight.get() + this._spaceBetweenPx;
            }
            this._scrollableElement.setScrollPosition({ scrollTop });
            const diffEditor = viewItems[index].template.get()?.editor;
            const editor = 'original' in resource ? diffEditor?.getOriginalEditor() : diffEditor?.getModifiedEditor();
            if (editor && options?.range) {
                editor.revealRangeInCenter(options.range);
                highlightRange(editor, options.range);
            }
        }
        getViewState() {
            return {
                scrollState: {
                    top: this.scrollTop.get(),
                    left: this.scrollLeft.get(),
                },
                docStates: Object.fromEntries(this._viewItems.get().map(i => [i.getKey(), i.getViewState()])),
            };
        }
        setViewState(viewState) {
            this.setScrollState(viewState.scrollState);
            this._lastDocStates = viewState.docStates;
            (0, base_1.transaction)(tx => {
                /** setViewState */
                if (viewState.docStates) {
                    for (const i of this._viewItems.get()) {
                        const state = viewState.docStates[i.getKey()];
                        if (state) {
                            i.setViewState(state, tx);
                        }
                    }
                }
            });
        }
        tryGetCodeEditor(resource) {
            const item = this._viewItems.get().find(v => v.viewModel.diffEditorViewModel.model.modified.uri.toString() === resource.toString()
                || v.viewModel.diffEditorViewModel.model.original.uri.toString() === resource.toString());
            const editor = item?.template.get()?.editor;
            if (!editor) {
                return undefined;
            }
            if (item.viewModel.diffEditorViewModel.model.modified.uri.toString() === resource.toString()) {
                return { diffEditor: editor, editor: editor.getModifiedEditor() };
            }
            else {
                return { diffEditor: editor, editor: editor.getOriginalEditor() };
            }
        }
        render(reader) {
            const scrollTop = this.scrollTop.read(reader);
            let contentScrollOffsetToScrollOffset = 0;
            let itemHeightSumBefore = 0;
            let itemContentHeightSumBefore = 0;
            const viewPortHeight = this._sizeObserver.height.read(reader);
            const contentViewPort = offsetRange_1.OffsetRange.ofStartAndLength(scrollTop, viewPortHeight);
            const width = this._sizeObserver.width.read(reader);
            for (const v of this._viewItems.read(reader)) {
                const itemContentHeight = v.contentHeight.read(reader);
                const itemHeight = Math.min(itemContentHeight, viewPortHeight);
                const itemRange = offsetRange_1.OffsetRange.ofStartAndLength(itemHeightSumBefore, itemHeight);
                const itemContentRange = offsetRange_1.OffsetRange.ofStartAndLength(itemContentHeightSumBefore, itemContentHeight);
                if (itemContentRange.isBefore(contentViewPort)) {
                    contentScrollOffsetToScrollOffset -= itemContentHeight - itemHeight;
                    v.hide();
                }
                else if (itemContentRange.isAfter(contentViewPort)) {
                    v.hide();
                }
                else {
                    const scroll = Math.max(0, Math.min(contentViewPort.start - itemContentRange.start, itemContentHeight - itemHeight));
                    contentScrollOffsetToScrollOffset -= scroll;
                    const viewPort = offsetRange_1.OffsetRange.ofStartAndLength(scrollTop + contentScrollOffsetToScrollOffset, viewPortHeight);
                    v.render(itemRange, scroll, width, viewPort);
                }
                itemHeightSumBefore += itemHeight + this._spaceBetweenPx;
                itemContentHeightSumBefore += itemContentHeight + this._spaceBetweenPx;
            }
            this._elements.content.style.transform = `translateY(${-(scrollTop + contentScrollOffsetToScrollOffset)}px)`;
        }
    };
    exports.MultiDiffEditorWidgetImpl = MultiDiffEditorWidgetImpl;
    exports.MultiDiffEditorWidgetImpl = MultiDiffEditorWidgetImpl = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService)
    ], MultiDiffEditorWidgetImpl);
    function highlightRange(targetEditor, range) {
        const modelNow = targetEditor.getModel();
        const decorations = targetEditor.createDecorationsCollection([{ range, options: { description: 'symbol-navigate-action-highlight', className: 'symbolHighlight' } }]);
        setTimeout(() => {
            if (targetEditor.getModel() === modelNow) {
                decorations.clear();
            }
        }, 350);
    }
    class VirtualizedViewItem extends lifecycle_1.Disposable {
        constructor(viewModel, _objectPool, _scrollLeft, _deltaScrollVertical) {
            super();
            this.viewModel = viewModel;
            this._objectPool = _objectPool;
            this._scrollLeft = _scrollLeft;
            this._deltaScrollVertical = _deltaScrollVertical;
            this._templateRef = this._register((0, base_1.disposableObservableValue)(this, undefined));
            this.contentHeight = (0, observable_1.derived)(this, reader => this._templateRef.read(reader)?.object.contentHeight?.read(reader) ?? this.viewModel.lastTemplateData.read(reader).contentHeight);
            this.maxScroll = (0, observable_1.derived)(this, reader => this._templateRef.read(reader)?.object.maxScroll.read(reader) ?? { maxScroll: 0, scrollWidth: 0 });
            this.template = (0, observable_1.derived)(this, reader => this._templateRef.read(reader)?.object);
            this._isHidden = (0, observable_1.observableValue)(this, false);
            this._register((0, observable_1.autorun)((reader) => {
                const scrollLeft = this._scrollLeft.read(reader);
                this._templateRef.read(reader)?.object.setScrollLeft(scrollLeft);
            }));
            this._register((0, observable_1.autorun)(reader => {
                const ref = this._templateRef.read(reader);
                if (!ref) {
                    return;
                }
                const isHidden = this._isHidden.read(reader);
                if (!isHidden) {
                    return;
                }
                const isFocused = ref.object.isFocused.read(reader);
                if (isFocused) {
                    return;
                }
                this._clear();
            }));
        }
        dispose() {
            this._clear();
            super.dispose();
        }
        toString() {
            return `VirtualViewItem(${this.viewModel.entry.value.modified?.uri.toString()})`;
        }
        getKey() {
            return this.viewModel.getKey();
        }
        getViewState() {
            (0, base_1.transaction)(tx => {
                this._updateTemplateData(tx);
            });
            return {
                collapsed: this.viewModel.collapsed.get(),
                selections: this.viewModel.lastTemplateData.get().selections,
            };
        }
        setViewState(viewState, tx) {
            this.viewModel.collapsed.set(viewState.collapsed, tx);
            this._updateTemplateData(tx);
            const data = this.viewModel.lastTemplateData.get();
            const selections = viewState.selections?.map(selection_1.Selection.liftSelection);
            this.viewModel.lastTemplateData.set({
                ...data,
                selections,
            }, tx);
            const ref = this._templateRef.get();
            if (ref) {
                if (selections) {
                    ref.object.editor.setSelections(selections);
                }
            }
        }
        _updateTemplateData(tx) {
            const ref = this._templateRef.get();
            if (!ref) {
                return;
            }
            this.viewModel.lastTemplateData.set({
                contentHeight: ref.object.contentHeight.get(),
                selections: ref.object.editor.getSelections() ?? undefined,
            }, tx);
        }
        _clear() {
            const ref = this._templateRef.get();
            if (!ref) {
                return;
            }
            (0, base_1.transaction)(tx => {
                this._updateTemplateData(tx);
                ref.object.hide();
                this._templateRef.set(undefined, tx);
            });
        }
        hide() {
            this._isHidden.set(true, undefined);
        }
        render(verticalSpace, offset, width, viewPort) {
            this._isHidden.set(false, undefined);
            let ref = this._templateRef.get();
            if (!ref) {
                ref = this._objectPool.getUnusedObj(new diffEditorItemTemplate_1.TemplateData(this.viewModel, this._deltaScrollVertical));
                this._templateRef.set(ref, undefined);
                const selections = this.viewModel.lastTemplateData.get().selections;
                if (selections) {
                    ref.object.editor.setSelections(selections);
                }
            }
            ref.object.render(verticalSpace, width, offset, viewPort);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yV2lkZ2V0SW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L211bHRpRGlmZkVkaXRvci9tdWx0aURpZmZFZGl0b3JXaWRnZXRJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZCekYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtRQXlFeEQsWUFDa0IsUUFBcUIsRUFDckIsVUFBOEMsRUFDOUMsVUFBNkQsRUFDN0QsMEJBQXNELEVBQ25ELHdCQUE2RCxFQUMxRCwyQkFBbUU7WUFFMUYsS0FBSyxFQUFFLENBQUM7WUFQUyxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGVBQVUsR0FBVixVQUFVLENBQW9DO1lBQzlDLGVBQVUsR0FBVixVQUFVLENBQW1EO1lBQzdELCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNEI7WUFDbEMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFvQjtZQUN6QyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQXVCO1lBOUUxRSxjQUFTLEdBQUcsSUFBQSxPQUFDLEVBQUMsc0NBQXNDLEVBQUU7Z0JBQ3RFLElBQUEsT0FBQyxFQUFDLGFBQWEsRUFBRTtvQkFDaEIsS0FBSyxFQUFFO3dCQUNOLFFBQVEsRUFBRSxRQUFRO3FCQUNsQjtpQkFDRCxDQUFDO2dCQUNGLElBQUEsT0FBQyxFQUFDLDBDQUEwQyxFQUFFLEVBQzdDLENBQUM7YUFDRixDQUFDLENBQUM7WUFFYyxrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQ0FBNkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFNUYsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxD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