/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/css!./blockDecorations"], function (require, exports, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BlockDecorations = void 0;
    class BlockDecorations extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this.blocks = [];
            this.contentWidth = -1;
            this.contentLeft = 0;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.domNode.setClassName('blockDecorations-container');
            this.update();
        }
        update() {
            let didChange = false;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const newContentWidth = layoutInfo.contentWidth - layoutInfo.verticalScrollbarWidth;
            if (this.contentWidth !== newContentWidth) {
                this.contentWidth = newContentWidth;
                didChange = true;
            }
            const newContentLeft = layoutInfo.contentLeft;
            if (this.contentLeft !== newContentLeft) {
                this.contentLeft = newContentLeft;
                didChange = true;
            }
            return didChange;
        }
        dispose() {
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            return this.update();
        }
        onScrollChanged(e) {
            return e.scrollTopChanged || e.scrollLeftChanged;
        }
        onDecorationsChanged(e) {
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            let count = 0;
            const decorations = ctx.getDecorationsInViewport();
            for (const decoration of decorations) {
                if (!decoration.options.blockClassName) {
                    continue;
                }
                let block = this.blocks[count];
                if (!block) {
                    block = this.blocks[count] = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                    this.domNode.appendChild(block);
                }
                let top;
                let bottom;
                if (decoration.options.blockIsAfterEnd) {
                    // range must be empty
                    top = ctx.getVerticalOffsetAfterLineNumber(decoration.range.endLineNumber, false);
                    bottom = ctx.getVerticalOffsetAfterLineNumber(decoration.range.endLineNumber, true);
                }
                else {
                    top = ctx.getVerticalOffsetForLineNumber(decoration.range.startLineNumber, true);
                    bottom = decoration.range.isEmpty() && !decoration.options.blockDoesNotCollapse
                        ? ctx.getVerticalOffsetForLineNumber(decoration.range.startLineNumber, false)
                        : ctx.getVerticalOffsetAfterLineNumber(decoration.range.endLineNumber, true);
                }
                const [paddingTop, paddingRight, paddingBottom, paddingLeft] = decoration.options.blockPadding ?? [0, 0, 0, 0];
                block.setClassName('blockDecorations-block ' + decoration.options.blockClassName);
                block.setLeft(this.contentLeft - paddingLeft);
                block.setWidth(this.contentWidth + paddingLeft + paddingRight);
                block.setTop(top - ctx.scrollTop - paddingTop);
                block.setHeight(bottom - top + paddingTop + paddingBottom);
                count++;
            }
            for (let i = count; i < this.blocks.length; i++) {
                this.blocks[i].domNode.remove();
            }
            this.blocks.length = count;
        }
    }
    exports.BlockDecorations = BlockDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2tEZWNvcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL2Jsb2NrRGVjb3JhdGlvbnMvYmxvY2tEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxnQkFBaUIsU0FBUSxtQkFBUTtRQVM3QyxZQUFZLE9BQW9CO1lBQy9CLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQU5DLFdBQU0sR0FBK0IsRUFBRSxDQUFDO1lBRWpELGlCQUFZLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDMUIsZ0JBQVcsR0FBVyxDQUFDLENBQUM7WUFLL0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLCtCQUFpQixFQUFjLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFFeEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVPLE1BQU07WUFDYixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLHNCQUFz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