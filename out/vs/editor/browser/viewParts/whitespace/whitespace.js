/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/base/common/strings", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/core/position", "vs/editor/common/core/editorColorRegistry", "vs/css!./whitespace"], function (require, exports, dynamicViewOverlay_1, strings, viewLineRenderer_1, position_1, editorColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WhitespaceOverlay = void 0;
    class WhitespaceOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            this._options = new WhitespaceOptions(this._context.configuration);
            this._selection = [];
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const newOptions = new WhitespaceOptions(this._context.configuration);
            if (this._options.equals(newOptions)) {
                return e.hasChanged(145 /* EditorOption.layoutInfo */);
            }
            this._options = newOptions;
            return true;
        }
        onCursorStateChanged(e) {
            this._selection = e.selections;
            if (this._options.renderWhitespace === 'selection') {
                return true;
            }
            return false;
        }
        onDecorationsChanged(e) {
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            if (this._options.renderWhitespace === 'none') {
                this._renderResult = null;
                return;
            }
            const startLineNumber = ctx.visibleRange.startLineNumber;
            const endLineNumber = ctx.visibleRange.endLineNumber;
            const lineCount = endLineNumber - startLineNumber + 1;
            const needed = new Array(lineCount);
            for (let i = 0; i < lineCount; i++) {
                needed[i] = true;
            }
            const viewportData = this._context.viewModel.getMinimapLinesRenderingData(ctx.viewportData.startLineNumber, ctx.viewportData.endLineNumber, needed);
            this._renderResult = [];
            for (let lineNumber = ctx.viewportData.startLineNumber; lineNumber <= ctx.viewportData.endLineNumber; lineNumber++) {
                const lineIndex = lineNumber - ctx.viewportData.startLineNumber;
                const lineData = viewportData.data[lineIndex];
                let selectionsOnLine = null;
                if (this._options.renderWhitespace === 'selection') {
                    const selections = this._selection;
                    for (const selection of selections) {
                        if (selection.endLineNumber < lineNumber || selection.startLineNumber > lineNumber) {
                            // Selection does not intersect line
                            continue;
                        }
                        const startColumn = (selection.startLineNumber === lineNumber ? selection.startColumn : lineData.minColumn);
                        const endColumn = (selection.endLineNumber === lineNumber ? selection.endColumn : lineData.maxColumn);
                        if (startColumn < endColumn) {
                            if (!selectionsOnLine) {
                                selectionsOnLine = [];
                            }
                            selectionsOnLine.push(new viewLineRenderer_1.LineRange(startColumn - 1, endColumn - 1));
                        }
                    }
                }
                this._renderResult[lineIndex] = this._applyRenderWhitespace(ctx, lineNumber, selectionsOnLine, lineData);
            }
        }
        _applyRenderWhitespace(ctx, lineNumber, selections, lineData) {
            if (this._options.renderWhitespace === 'selection' && !selections) {
                return '';
            }
            if (this._options.renderWhitespace === 'trailing' && lineData.continuesWithWrappedLine) {
                return '';
            }
            const color = this._context.theme.getColor(editorColorRegistry_1.editorWhitespaces);
            const USE_SVG = this._options.renderWithSVG;
            const lineContent = lineData.content;
            const len = (this._options.stopRenderingLineAfter === -1 ? lineContent.length : Math.min(this._options.stopRenderingLineAfter, lineContent.length));
            const continuesWithWrappedLine = lineData.continuesWithWrappedLine;
            const fauxIndentLength = lineData.minColumn - 1;
            const onlyBoundary = (this._options.renderWhitespace === 'boundary');
            const onlyTrailing = (this._options.renderWhitespace === 'trailing');
            const lineHeight = this._options.lineHeight;
            const middotWidth = this._options.middotWidth;
            const wsmiddotWidth = this._options.wsmiddotWidth;
            const spaceWidth = this._options.spaceWidth;
            const wsmiddotDiff = Math.abs(wsmiddotWidth - spaceWidth);
            const middotDiff = Math.abs(middotWidth - spaceWidth);
            // U+2E31 - WORD SEPARATOR MIDDLE DOT
            // U+00B7 - MIDDLE DOT
            const renderSpaceCharCode = (wsmiddotDiff < middotDiff ? 0x2E31 : 0xB7);
            const canUseHalfwidthRightwardsArrow = this._options.canUseHalfwidthRightwardsArrow;
            let result = '';
            let lineIsEmptyOrWhitespace = false;
            let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
            let lastNonWhitespaceIndex;
            if (firstNonWhitespaceIndex === -1) {
                lineIsEmptyOrWhitespace = true;
                firstNonWhitespaceIndex = len;
                lastNonWhitespaceIndex = len;
            }
            else {
                lastNonWhitespaceIndex = strings.lastNonWhitespaceIndex(lineContent);
            }
            let currentSelectionIndex = 0;
            let currentSelection = selections && selections[currentSelectionIndex];
            let maxLeft = 0;
            for (let charIndex = fauxIndentLength; charIndex < len; charIndex++) {
                const chCode = lineContent.charCodeAt(charIndex);
                if (currentSelection && charIndex >= currentSelection.endOffset) {
                    currentSelectionIndex++;
                    currentSelection = selections && selections[currentSelectionIndex];
                }
                if (chCode !== 9 /* CharCode.Tab */ && chCode !== 32 /* CharCode.Space */) {
                    continue;
                }
                if (onlyTrailing && !lineIsEmptyOrWhitespace && charIndex <= lastNonWhitespaceIndex) {
                    // If rendering only trailing whitespace, check that the charIndex points to trailing whitespace.
                    continue;
                }
                if (onlyBoundary && charIndex >= firstNonWhitespaceIndex && charIndex <= lastNonWhitespaceIndex && chCode === 32 /* CharCode.Space */) {
                    // rendering only boundary whitespace
                    const prevChCode = (charIndex - 1 >= 0 ? lineContent.charCodeAt(charIndex - 1) : 0 /* CharCode.Null */);
                    const nextChCode = (charIndex + 1 < len ? lineContent.charCodeAt(charIndex + 1) : 0 /* CharCode.Null */);
                    if (prevChCode !== 32 /* CharCode.Space */ && nextChCode !== 32 /* CharCode.Space */) {
                        continue;
                    }
                }
                if (onlyBoundary && continuesWithWrappedLine && charIndex === len - 1) {
                    const prevCharCode = (charIndex - 1 >= 0 ? lineContent.charCodeAt(charIndex - 1) : 0 /* CharCode.Null */);
                    const isSingleTrailingSpace = (chCode === 32 /* CharCode.Space */ && (prevCharCode !== 32 /* CharCode.Space */ && prevCharCode !== 9 /* CharCode.Tab */));
                    if (isSingleTrailingSpace) {
                        continue;
                    }
                }
                if (selections && (!currentSelection || currentSelection.startOffset > charIndex || currentSelection.endOffset <= charIndex)) {
                    // If rendering whitespace on selection, check that the charIndex falls within a selection
                    continue;
                }
                const visibleRange = ctx.visibleRangeForPosition(new position_1.Position(lineNumber, charIndex + 1));
                if (!visibleRange) {
                    continue;
                }
                if (USE_SVG) {
                    maxLeft = Math.max(maxLeft, visibleRange.left);
                    if (chCode === 9 /* CharCode.Tab */) {
                        result += this._renderArrow(lineHeight, spaceWidth, visibleRange.left);
                    }
                    else {
                        result += `<circle cx="${(visibleRange.left + spaceWidth / 2).toFixed(2)}" cy="${(lineHeight / 2).toFixed(2)}" r="${(spaceWidth / 7).toFixed(2)}" />`;
                    }
                }
                else {
                    if (chCode === 9 /* CharCode.Tab */) {
                        result += `<div class="mwh" style="left:${visibleRange.left}px;height:${lineHeight}px;">${canUseHalfwidthRightwardsArrow ? String.fromCharCode(0xFFEB) : String.fromCharCode(0x2192)}</div>`;
                    }
                    else {
                        result += `<div class="mwh" style="left:${visibleRange.left}px;height:${lineHeight}px;">${String.fromCharCode(renderSpaceCharCode)}</div>`;
                    }
                }
            }
            if (USE_SVG) {
                maxLeft = Math.round(maxLeft + spaceWidth);
                return (`<svg style="bottom:0;position:absolute;width:${maxLeft}px;height:${lineHeight}px" viewBox="0 0 ${maxLeft} ${lineHeight}" xmlns="http://www.w3.org/2000/svg" fill="${color}">`
                    + result
                    + `</svg>`);
            }
            return result;
        }
        _renderArrow(lineHeight, spaceWidth, left) {
            const strokeWidth = spaceWidth / 7;
            const width = spaceWidth;
            const dy = lineHeight / 2;
            const dx = left;
            const p1 = { x: 0, y: strokeWidth / 2 };
            const p2 = { x: 100 / 125 * width, y: p1.y };
            const p3 = { x: p2.x - 0.2 * p2.x, y: p2.y + 0.2 * p2.x };
            const p4 = { x: p3.x + 0.1 * p2.x, y: p3.y + 0.1 * p2.x };
            const p5 = { x: p4.x + 0.35 * p2.x, y: p4.y - 0.35 * p2.x };
            const p6 = { x: p5.x, y: -p5.y };
            const p7 = { x: p4.x, y: -p4.y };
            const p8 = { x: p3.x, y: -p3.y };
            const p9 = { x: p2.x, y: -p2.y };
            const p10 = { x: p1.x, y: -p1.y };
            const p = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];
            const parts = p.map((p) => `${(dx + p.x).toFixed(2)} ${(dy + p.y).toFixed(2)}`).join(' L ');
            return `<path d="M ${parts}" />`;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.WhitespaceOverlay = WhitespaceOverlay;
    class WhitespaceOptions {
        constructor(config) {
            const options = config.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const experimentalWhitespaceRendering = options.get(38 /* EditorOption.experimentalWhitespaceRendering */);
            if (experimentalWhitespaceRendering === 'off') {
                // whitespace is rendered in the view line
                this.renderWhitespace = 'none';
                this.renderWithSVG = false;
            }
            else if (experimentalWhitespaceRendering === 'svg') {
                this.renderWhitespace = options.get(99 /* EditorOption.renderWhitespace */);
                this.renderWithSVG = true;
            }
            else {
                this.renderWhitespace = options.get(99 /* EditorOption.renderWhitespace */);
                this.renderWithSVG = false;
            }
            this.spaceWidth = fontInfo.spaceWidth;
            this.middotWidth = fontInfo.middotWidth;
            this.wsmiddotWidth = fontInfo.wsmiddotWidth;
            this.canUseHalfwidthRightwardsArrow = fontInfo.canUseHalfwidthRightwardsArrow;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.stopRenderingLineAfter = options.get(117 /* EditorOption.stopRenderingLineAfter */);
        }
        equals(other) {
            return (this.renderWhitespace === other.renderWhitespace
                && this.renderWithSVG === other.renderWithSVG
                && this.spaceWidth === other.spaceWidth
                && this.middotWidth === other.middotWidth
                && this.wsmiddotWidth === other.wsmiddotWidth
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.lineHeight === other.lineHeight
                && this.stopRenderingLineAfter === other.stopRenderingLineAfter);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hpdGVzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL3doaXRlc3BhY2Uvd2hpdGVzcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsaUJBQWtCLFNBQVEsdUNBQWtCO1FBT3hELFlBQVksT0FBb0I7WUFDL0IsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1lBQzFCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRUQsMkJBQTJCO1FBRVgsc0JBQXNCLENBQUMsQ0FBMkM7WUFDakYsTUFBTSxVQUFVLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLENBQUMsVUFBVSxtQ0FBeUIsQ0FBQztZQUM5QyxDQUFDO1lBQ0QsSUFB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QUMsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDN0MsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzFELE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMxRCxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDNUQsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDakMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDakMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDakMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFD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