/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/platform/theme/common/themeService", "vs/editor/common/core/editorColorRegistry", "vs/css!./lineNumbers"], function (require, exports, platform, dynamicViewOverlay_1, position_1, range_1, themeService_1, editorColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineNumbersOverlay = void 0;
    class LineNumbersOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        static { this.CLASS_NAME = 'line-numbers'; }
        constructor(context) {
            super();
            this._context = context;
            this._readConfig();
            this._lastCursorModelPosition = new position_1.Position(1, 1);
            this._renderResult = null;
            this._activeLineNumber = 1;
            this._context.addEventHandler(this);
        }
        _readConfig() {
            const options = this._context.configuration.options;
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            const lineNumbers = options.get(68 /* EditorOption.lineNumbers */);
            this._renderLineNumbers = lineNumbers.renderType;
            this._renderCustomLineNumbers = lineNumbers.renderFn;
            this._renderFinalNewline = options.get(95 /* EditorOption.renderFinalNewline */);
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._lineNumbersLeft = layoutInfo.lineNumbersLeft;
            this._lineNumbersWidth = layoutInfo.lineNumbersWidth;
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            this._readConfig();
            return true;
        }
        onCursorStateChanged(e) {
            const primaryViewPosition = e.selections[0].getPosition();
            this._lastCursorModelPosition = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(primaryViewPosition);
            let shouldRender = false;
            if (this._activeLineNumber !== primaryViewPosition.lineNumber) {
                this._activeLineNumber = primaryViewPosition.lineNumber;
                shouldRender = true;
            }
            if (this._renderLineNumbers === 2 /* RenderLineNumbersType.Relative */ || this._renderLineNumbers === 3 /* RenderLineNumbersType.Interval */) {
                shouldRender = true;
            }
            return shouldRender;
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
        onDecorationsChanged(e) {
            return e.affectsLineNumber;
        }
        // --- end event handlers
        _getLineRenderLineNumber(viewLineNumber) {
            const modelPosition = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(viewLineNumber, 1));
            if (modelPosition.column !== 1) {
                return '';
            }
            const modelLineNumber = modelPosition.lineNumber;
            if (this._renderCustomLineNumbers) {
                return this._renderCustomLineNumbers(modelLineNumber);
            }
            if (this._renderLineNumbers === 2 /* RenderLineNumbersType.Relative */) {
                const diff = Math.abs(this._lastCursorModelPosition.lineNumber - modelLineNumber);
                if (diff === 0) {
                    return '<span class="relative-current-line-number">' + modelLineNumber + '</span>';
                }
                return String(diff);
            }
            if (this._renderLineNumbers === 3 /* RenderLineNumbersType.Interval */) {
                if (this._lastCursorModelPosition.lineNumber === modelLineNumber) {
                    return String(modelLineNumber);
                }
                if (modelLineNumber % 10 === 0) {
                    return String(modelLineNumber);
                }
                const finalLineNumber = this._context.viewModel.getLineCount();
                if (modelLineNumber === finalLineNumber) {
                    return String(modelLineNumber);
                }
                return '';
            }
            return String(modelLineNumber);
        }
        prepareRender(ctx) {
            if (this._renderLineNumbers === 0 /* RenderLineNumbersType.Off */) {
                this._renderResult = null;
                return;
            }
            const lineHeightClassName = (platform.isLinux ? (this._lineHeight % 2 === 0 ? ' lh-even' : ' lh-odd') : '');
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const lineNoDecorations = this._context.viewModel.getDecorationsInViewport(ctx.visibleRange).filter(d => !!d.options.lineNumberClassName);
            lineNoDecorations.sort((a, b) => range_1.Range.compareRangesUsingEnds(a.range, b.range));
            let decorationStartIndex = 0;
            const lineCount = this._context.viewModel.getLineCount();
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                let renderLineNumber = this._getLineRenderLineNumber(lineNumber);
                let extraClassNames = '';
                // skip decorations whose end positions we've already passed
                while (decorationStartIndex < lineNoDecorations.length && lineNoDecorations[decorationStartIndex].range.endLineNumber < lineNumber) {
                    decorationStartIndex++;
                }
                for (let i = decorationStartIndex; i < lineNoDecorations.length; i++) {
                    const { range, options } = lineNoDecorations[i];
                    if (range.startLineNumber <= lineNumber) {
                        extraClassNames += ' ' + options.lineNumberClassName;
                    }
                }
                if (!renderLineNumber && !extraClassNames) {
                    output[lineIndex] = '';
                    continue;
                }
                if (lineNumber === lineCount && this._context.viewModel.getLineLength(lineNumber) === 0) {
                    // this is the last line
                    if (this._renderFinalNewline === 'off') {
                        renderLineNumber = '';
                    }
                    if (this._renderFinalNewline === 'dimmed') {
                        extraClassNames += ' dimmed-line-number';
                    }
                }
                if (lineNumber === this._activeLineNumber) {
                    extraClassNames += ' active-line-number';
                }
                output[lineIndex] = (`<div class="${LineNumbersOverlay.CLASS_NAME}${lineHeightClassName}${extraClassNames}" style="left:${this._lineNumbersLeft}px;width:${this._lineNumbersWidth}px;">${renderLineNumber}</div>`);
            }
            this._renderResult = output;
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
    exports.LineNumbersOverlay = LineNumbersOverlay;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorLineNumbersColor = theme.getColor(editorColorRegistry_1.editorLineNumbers);
        const editorDimmedLineNumberColor = theme.getColor(editorColorRegistry_1.editorDimmedLineNumber);
        if (editorDimmedLineNumberColor) {
            collector.addRule(`.monaco-editor .line-numbers.dimmed-line-number { color: ${editorDimmedLineNumberColor}; }`);
        }
        else if (editorLineNumbersColor) {
            collector.addRule(`.monaco-editor .line-numbers.dimmed-line-number { color: ${editorLineNumbersColor.transparent(0.4)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZU51bWJlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9saW5lTnVtYmVycy9saW5lTnVtYmVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxrQkFBbUIsU0FBUSx1Q0FBa0I7aUJBRWxDLGVBQVUsR0FBRyxjQUFjLENBQUM7UUFjbkQsWUFBWSxPQUFvQjtZQUMvQixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBRXhCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVuQixJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTyxXQUFXO1lBQ2xCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLGtDQUF5QixDQUFDO1lBQ3hELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUEwQixDQUFDO1lBQzFELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDO1lBQ2pELElBQUksQ0FBQyx3QkFBd0IsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO1lBQ3JELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRywwQ0FB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