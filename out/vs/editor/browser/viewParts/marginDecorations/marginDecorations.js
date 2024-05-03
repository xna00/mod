/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/viewParts/glyphMargin/glyphMargin", "vs/css!./marginDecorations"], function (require, exports, glyphMargin_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarginViewLineDecorationsOverlay = void 0;
    class MarginViewLineDecorationsOverlay extends glyphMargin_1.DedupOverlay {
        constructor(context) {
            super();
            this._context = context;
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
                const marginClassName = d.options.marginClassName;
                const zIndex = d.options.zIndex;
                if (marginClassName) {
                    r[rLen++] = new glyphMargin_1.DecorationToRender(d.range.startLineNumber, d.range.endLineNumber, marginClassName, null, zIndex);
                }
            }
            return r;
        }
        prepareRender(ctx) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const toRender = this._render(visibleStartLineNumber, visibleEndLineNumber, this._getDecorations(ctx));
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                const decorations = toRender[lineIndex].getDecorations();
                let lineOutput = '';
                for (const decoration of decorations) {
                    lineOutput += '<div class="cmdr ' + decoration.className + '" style=""></div>';
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
    exports.MarginViewLineDecorationsOverlay = MarginViewLineDecorationsOverlay;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyZ2luRGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9tYXJnaW5EZWNvcmF0aW9ucy9tYXJnaW5EZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxnQ0FBaUMsU0FBUSwwQkFBWTtRQUlqRSxZQUFZLE9BQW9CO1lBQy9CLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVELDJCQUEyQjtRQUVYLHNCQUFzQixDQUFDLENBQTJDO1lBQ2pGLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNlLG9CQUFvQixDQUFDLENBQXlDO1lBQzdFLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNlLFNBQVMsQ0FBQyxDQUE4QjtZQUN2RCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDZSxjQUFjLENBQUMsQ0FBbUM7WUFDakUsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ2UsY0FBYyxDQUFDLENBQW1DO1lBQ2pFLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNlLGVBQWUsQ0FBQyxDQUFvQztZQUNuRSxPQUFPLElBQUksQ0FBQztRQUNi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