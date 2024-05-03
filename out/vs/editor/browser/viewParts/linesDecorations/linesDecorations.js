/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/viewParts/glyphMargin/glyphMargin", "vs/css!./linesDecorations"], function (require, exports, glyphMargin_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinesDecorationsOverlay = void 0;
    class LinesDecorationsOverlay extends glyphMargin_1.DedupOverlay {
        constructor(context) {
            super();
            this._context = context;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._decorationsLeft = layoutInfo.decorationsLeft;
            this._decorationsWidth = layoutInfo.decorationsWidth;
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
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._decorationsLeft = layoutInfo.decorationsLeft;
            this._decorationsWidth = layoutInfo.decorationsWidth;
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
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        _getDecorations(ctx) {
            const decorations = ctx.getDecorationsInViewport();
            const r = [];
            let rLen = 0;
            for (let i = 0, len = decorations.length; i < len; i++) {
                const d = decorations[i];
                const linesDecorationsClassName = d.options.linesDecorationsClassName;
                const zIndex = d.options.zIndex;
                if (linesDecorationsClassName) {
                    r[rLen++] = new glyphMargin_1.DecorationToRender(d.range.startLineNumber, d.range.endLineNumber, linesDecorationsClassName, d.options.linesDecorationsTooltip ?? null, zIndex);
                }
                const firstLineDecorationClassName = d.options.firstLineDecorationClassName;
                if (firstLineDecorationClassName) {
                    r[rLen++] = new glyphMargin_1.DecorationToRender(d.range.startLineNumber, d.range.startLineNumber, firstLineDecorationClassName, d.options.linesDecorationsTooltip ?? null, zIndex);
                }
            }
            return r;
        }
        prepareRender(ctx) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const toRender = this._render(visibleStartLineNumber, visibleEndLineNumber, this._getDecorations(ctx));
            const left = this._decorationsLeft.toString();
            const width = this._decorationsWidth.toString();
            const common = '" style="left:' + left + 'px;width:' + width + 'px;"></div>';
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                const decorations = toRender[lineIndex].getDecorations();
                let lineOutput = '';
                for (const decoration of decorations) {
                    let addition = '<div class="cldr ' + decoration.className;
                    if (decoration.tooltip !== null) {
                        addition += '" title="' + decoration.tooltip; // The tooltip is already escaped.
                    }
                    addition += common;
                    lineOutput += addition;
                }
                output[lineIndex] = lineOutput;
            }
            this._renderResult = output;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            return this._renderResult[lineNumber - startLineNumber];
        }
    }
    exports.LinesDecorationsOverlay = LinesDecorationsOverlay;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNEZWNvcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL2xpbmVzRGVjb3JhdGlvbnMvbGluZXNEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSx1QkFBd0IsU0FBUSwwQkFBWTtRQVF4RCxZQUFZLE9BQW9CO1lBQy9CLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO1lBQ25ELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUM7WUFDckQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVELDJCQUEyQjtRQUVYLHNCQUFzQixDQUFDLENBQTJDO1lBQ2pGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxP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