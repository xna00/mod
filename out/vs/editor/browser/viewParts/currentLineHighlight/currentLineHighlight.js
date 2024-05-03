/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/common/core/editorColorRegistry", "vs/base/common/arrays", "vs/platform/theme/common/themeService", "vs/editor/common/core/selection", "vs/platform/theme/common/theme", "vs/editor/common/core/position", "vs/css!./currentLineHighlight"], function (require, exports, dynamicViewOverlay_1, editorColorRegistry_1, arrays, themeService_1, selection_1, theme_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CurrentLineMarginHighlightOverlay = exports.CurrentLineHighlightOverlay = exports.AbstractLineHighlightOverlay = void 0;
    class AbstractLineHighlightOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._renderLineHighlight = options.get(96 /* EditorOption.renderLineHighlight */);
            this._renderLineHighlightOnlyWhenFocus = options.get(97 /* EditorOption.renderLineHighlightOnlyWhenFocus */);
            this._wordWrap = layoutInfo.isViewportWrapping;
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._selectionIsEmpty = true;
            this._focused = false;
            this._cursorLineNumbers = [1];
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            this._renderData = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
        _readFromSelections() {
            let hasChanged = false;
            const lineNumbers = new Set();
            for (const selection of this._selections) {
                lineNumbers.add(selection.positionLineNumber);
            }
            const cursorsLineNumbers = Array.from(lineNumbers);
            cursorsLineNumbers.sort((a, b) => a - b);
            if (!arrays.equals(this._cursorLineNumbers, cursorsLineNumbers)) {
                this._cursorLineNumbers = cursorsLineNumbers;
                hasChanged = true;
            }
            const selectionIsEmpty = this._selections.every(s => s.isEmpty());
            if (this._selectionIsEmpty !== selectionIsEmpty) {
                this._selectionIsEmpty = selectionIsEmpty;
                hasChanged = true;
            }
            return hasChanged;
        }
        // --- begin event handlers
        onThemeChanged(e) {
            return this._readFromSelections();
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._renderLineHighlight = options.get(96 /* EditorOption.renderLineHighlight */);
            this._renderLineHighlightOnlyWhenFocus = options.get(97 /* EditorOption.renderLineHighlightOnlyWhenFocus */);
            this._wordWrap = layoutInfo.isViewportWrapping;
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            return this._readFromSelections();
        }
        onFlushed(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollWidthChanged || e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        onFocusChanged(e) {
            if (!this._renderLineHighlightOnlyWhenFocus) {
                return false;
            }
            this._focused = e.isFocused;
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            if (!this._shouldRenderThis()) {
                this._renderData = null;
                return;
            }
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            // initialize renderData
            const renderData = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                renderData[lineIndex] = '';
            }
            if (this._wordWrap) {
                // do a first pass to render wrapped lines
                const renderedLineWrapped = this._renderOne(ctx, false);
                for (const cursorLineNumber of this._cursorLineNumbers) {
                    const coordinatesConverter = this._context.viewModel.coordinatesConverter;
                    const modelLineNumber = coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(cursorLineNumber, 1)).lineNumber;
                    const firstViewLineNumber = coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelLineNumber, 1)).lineNumber;
                    const lastViewLineNumber = coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelLineNumber, this._context.viewModel.model.getLineMaxColumn(modelLineNumber))).lineNumber;
                    const firstLine = Math.max(firstViewLineNumber, visibleStartLineNumber);
                    const lastLine = Math.min(lastViewLineNumber, visibleEndLineNumber);
                    for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber++) {
                        const lineIndex = lineNumber - visibleStartLineNumber;
                        renderData[lineIndex] = renderedLineWrapped;
                    }
                }
            }
            // do a second pass to render exact lines
            const renderedLineExact = this._renderOne(ctx, true);
            for (const cursorLineNumber of this._cursorLineNumbers) {
                if (cursorLineNumber < visibleStartLineNumber || cursorLineNumber > visibleEndLineNumber) {
                    continue;
                }
                const lineIndex = cursorLineNumber - visibleStartLineNumber;
                renderData[lineIndex] = renderedLineExact;
            }
            this._renderData = renderData;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderData) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex >= this._renderData.length) {
                return '';
            }
            return this._renderData[lineIndex];
        }
        _shouldRenderInMargin() {
            return ((this._renderLineHighlight === 'gutter' || this._renderLineHighlight === 'all')
                && (!this._renderLineHighlightOnlyWhenFocus || this._focused));
        }
        _shouldRenderInContent() {
            return ((this._renderLineHighlight === 'line' || this._renderLineHighlight === 'all')
                && this._selectionIsEmpty
                && (!this._renderLineHighlightOnlyWhenFocus || this._focused));
        }
    }
    exports.AbstractLineHighlightOverlay = AbstractLineHighlightOverlay;
    class CurrentLineHighlightOverlay extends AbstractLineHighlightOverlay {
        _renderOne(ctx, exact) {
            const className = 'current-line' + (this._shouldRenderInMargin() ? ' current-line-both' : '') + (exact ? ' current-line-exact' : '');
            return `<div class="${className}" style="width:${Math.max(ctx.scrollWidth, this._contentWidth)}px;"></div>`;
        }
        _shouldRenderThis() {
            return this._shouldRenderInContent();
        }
        _shouldRenderOther() {
            return this._shouldRenderInMargin();
        }
    }
    exports.CurrentLineHighlightOverlay = CurrentLineHighlightOverlay;
    class CurrentLineMarginHighlightOverlay extends AbstractLineHighlightOverlay {
        _renderOne(ctx, exact) {
            const className = 'current-line' + (this._shouldRenderInMargin() ? ' current-line-margin' : '') + (this._shouldRenderOther() ? ' current-line-margin-both' : '') + (this._shouldRenderInMargin() && exact ? ' current-line-exact-margin' : '');
            return `<div class="${className}" style="width:${this._contentLeft}px"></div>`;
        }
        _shouldRenderThis() {
            return true;
        }
        _shouldRenderOther() {
            return this._shouldRenderInContent();
        }
    }
    exports.CurrentLineMarginHighlightOverlay = CurrentLineMarginHighlightOverlay;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const lineHighlight = theme.getColor(editorColorRegistry_1.editorLineHighlight);
        if (lineHighlight) {
            collector.addRule(`.monaco-editor .view-overlays .current-line { background-color: ${lineHighlight}; }`);
            collector.addRule(`.monaco-editor .margin-view-overlays .current-line-margin { background-color: ${lineHighlight}; border: none; }`);
        }
        if (!lineHighlight || lineHighlight.isTransparent() || theme.defines(editorColorRegistry_1.editorLineHighlightBorder)) {
            const lineHighlightBorder = theme.getColor(editorColorRegistry_1.editorLineHighlightBorder);
            if (lineHighlightBorder) {
                collector.addRule(`.monaco-editor .view-overlays .current-line-exact { border: 2px solid ${lineHighlightBorder}; }`);
                collector.addRule(`.monaco-editor .margin-view-overlays .current-line-exact-margin { border: 2px solid ${lineHighlightBorder}; }`);
                if ((0, theme_1.isHighContrast)(theme.type)) {
                    collector.addRule(`.monaco-editor .view-overlays .current-line-exact { border-width: 1px; }`);
                    collector.addRule(`.monaco-editor .margin-view-overlays .current-line-exact-margin { border-width: 1px; }`);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VycmVudExpbmVIaWdobGlnaHQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9jdXJyZW50TGluZUhpZ2hsaWdodC9jdXJyZW50TGluZUhpZ2hsaWdodC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBc0IsNEJBQTZCLFNBQVEsdUNBQWtCO1FBZ0I1RSxZQUFZLE9BQW9CO1lBQy9CLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFFeEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxPQUFPLENBQUMsR0FBRywyQ0FBa0MsQ0FBQztZQUMxRSxJQUFJLENBQUMsaUNBQWlDLEdBQUcsT0FBTyxDQUFDLEdBQUcsd0RBQStDLENBQUM7WUFDcEcsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsa0JBQWtCLENBQUM7WUFDL0MsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQzNDLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUM3QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxD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