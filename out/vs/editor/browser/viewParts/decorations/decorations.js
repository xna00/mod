/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/browser/view/renderingContext", "vs/editor/common/core/range", "vs/css!./decorations"], function (require, exports, dynamicViewOverlay_1, renderingContext_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsOverlay = void 0;
    class DecorationsOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            const options = this._context.configuration.options;
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
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
            const options = this._context.configuration.options;
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            return true;
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
            return e.scrollTopChanged || e.scrollWidthChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            const _decorations = ctx.getDecorationsInViewport();
            // Keep only decorations with `className`
            let decorations = [];
            let decorationsLen = 0;
            for (let i = 0, len = _decorations.length; i < len; i++) {
                const d = _decorations[i];
                if (d.options.className) {
                    decorations[decorationsLen++] = d;
                }
            }
            // Sort decorations for consistent render output
            decorations = decorations.sort((a, b) => {
                if (a.options.zIndex < b.options.zIndex) {
                    return -1;
                }
                if (a.options.zIndex > b.options.zIndex) {
                    return 1;
                }
                const aClassName = a.options.className;
                const bClassName = b.options.className;
                if (aClassName < bClassName) {
                    return -1;
                }
                if (aClassName > bClassName) {
                    return 1;
                }
                return range_1.Range.compareRangesUsingStarts(a.range, b.range);
            });
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = '';
            }
            // Render first whole line decorations and then regular decorations
            this._renderWholeLineDecorations(ctx, decorations, output);
            this._renderNormalDecorations(ctx, decorations, output);
            this._renderResult = output;
        }
        _renderWholeLineDecorations(ctx, decorations, output) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            for (let i = 0, lenI = decorations.length; i < lenI; i++) {
                const d = decorations[i];
                if (!d.options.isWholeLine) {
                    continue;
                }
                const decorationOutput = ('<div class="cdr '
                    + d.options.className
                    + '" style="left:0;width:100%;"></div>');
                const startLineNumber = Math.max(d.range.startLineNumber, visibleStartLineNumber);
                const endLineNumber = Math.min(d.range.endLineNumber, visibleEndLineNumber);
                for (let j = startLineNumber; j <= endLineNumber; j++) {
                    const lineIndex = j - visibleStartLineNumber;
                    output[lineIndex] += decorationOutput;
                }
            }
        }
        _renderNormalDecorations(ctx, decorations, output) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            let prevClassName = null;
            let prevShowIfCollapsed = false;
            let prevRange = null;
            let prevShouldFillLineOnLineBreak = false;
            for (let i = 0, lenI = decorations.length; i < lenI; i++) {
                const d = decorations[i];
                if (d.options.isWholeLine) {
                    continue;
                }
                const className = d.options.className;
                const showIfCollapsed = Boolean(d.options.showIfCollapsed);
                let range = d.range;
                if (showIfCollapsed && range.endColumn === 1 && range.endLineNumber !== range.startLineNumber) {
                    range = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber - 1, this._context.viewModel.getLineMaxColumn(range.endLineNumber - 1));
                }
                if (prevClassName === className && prevShowIfCollapsed === showIfCollapsed && range_1.Range.areIntersectingOrTouching(prevRange, range)) {
                    // merge into previous decoration
                    prevRange = range_1.Range.plusRange(prevRange, range);
                    continue;
                }
                // flush previous decoration
                if (prevClassName !== null) {
                    this._renderNormalDecoration(ctx, prevRange, prevClassName, prevShouldFillLineOnLineBreak, prevShowIfCollapsed, visibleStartLineNumber, output);
                }
                prevClassName = className;
                prevShowIfCollapsed = showIfCollapsed;
                prevRange = range;
                prevShouldFillLineOnLineBreak = d.options.shouldFillLineOnLineBreak ?? false;
            }
            if (prevClassName !== null) {
                this._renderNormalDecoration(ctx, prevRange, prevClassName, prevShouldFillLineOnLineBreak, prevShowIfCollapsed, visibleStartLineNumber, output);
            }
        }
        _renderNormalDecoration(ctx, range, className, shouldFillLineOnLineBreak, showIfCollapsed, visibleStartLineNumber, output) {
            const linesVisibleRanges = ctx.linesVisibleRangesForRange(range, /*TODO@Alex*/ className === 'findMatch');
            if (!linesVisibleRanges) {
                return;
            }
            for (let j = 0, lenJ = linesVisibleRanges.length; j < lenJ; j++) {
                const lineVisibleRanges = linesVisibleRanges[j];
                if (lineVisibleRanges.outsideRenderedLine) {
                    continue;
                }
                const lineIndex = lineVisibleRanges.lineNumber - visibleStartLineNumber;
                if (showIfCollapsed && lineVisibleRanges.ranges.length === 1) {
                    const singleVisibleRange = lineVisibleRanges.ranges[0];
                    if (singleVisibleRange.width < this._typicalHalfwidthCharacterWidth) {
                        // collapsed/very small range case => make the decoration visible by expanding its width
                        // expand its size on both sides (both to the left and to the right, keeping it centered)
                        const center = Math.round(singleVisibleRange.left + singleVisibleRange.width / 2);
                        const left = Math.max(0, Math.round(center - this._typicalHalfwidthCharacterWidth / 2));
                        lineVisibleRanges.ranges[0] = new renderingContext_1.HorizontalRange(left, this._typicalHalfwidthCharacterWidth);
                    }
                }
                for (let k = 0, lenK = lineVisibleRanges.ranges.length; k < lenK; k++) {
                    const expandToLeft = shouldFillLineOnLineBreak && lineVisibleRanges.continuesOnNextLine && lenK === 1;
                    const visibleRange = lineVisibleRanges.ranges[k];
                    const decorationOutput = ('<div class="cdr '
                        + className
                        + '" style="left:'
                        + String(visibleRange.left)
                        + 'px;width:'
                        + (expandToLeft ?
                            '100%;' :
                            (String(visibleRange.width) + 'px;'))
                        + '"></div>');
                    output[lineIndex] += decorationOutput;
                }
            }
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
    exports.DecorationsOverlay = DecorationsOverlay;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9kZWNvcmF0aW9ucy9kZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxrQkFBbUIsU0FBUSx1Q0FBa0I7UUFNekQsWUFBWSxPQUFvQjtZQUMvQixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxJQUFJLENBQUMsK0JBQStCLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUMsOEJBQThCLENBQUM7WUFDekcsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFFMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVELDJCQUEyQjtRQUVYLHNCQUFzQixDQUFDLENBQTJDO1lBQ2pGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxJQUFJLENBQUMsK0JBQStCLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUMsOEJBQThCLENBQUM7WUFDekcsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ2Usb0JBQW9CLENBQUMs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