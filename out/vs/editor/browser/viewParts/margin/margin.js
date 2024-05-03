/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/css!./margin"], function (require, exports, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Margin = void 0;
    class Margin extends viewPart_1.ViewPart {
        static { this.CLASS_NAME = 'glyph-margin'; }
        static { this.OUTER_CLASS_NAME = 'margin'; }
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._canUseLayerHinting = !options.get(32 /* EditorOption.disableLayerHinting */);
            this._contentLeft = layoutInfo.contentLeft;
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setClassName(Margin.OUTER_CLASS_NAME);
            this._domNode.setPosition('absolute');
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._glyphMarginBackgroundDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._glyphMarginBackgroundDomNode.setClassName(Margin.CLASS_NAME);
            this._domNode.appendChild(this._glyphMarginBackgroundDomNode);
        }
        dispose() {
            super.dispose();
        }
        getDomNode() {
            return this._domNode;
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._canUseLayerHinting = !options.get(32 /* EditorOption.disableLayerHinting */);
            this._contentLeft = layoutInfo.contentLeft;
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            return true;
        }
        onScrollChanged(e) {
            return super.onScrollChanged(e) || e.scrollTopChanged;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            this._domNode.setLayerHinting(this._canUseLayerHinting);
            this._domNode.setContain('strict');
            const adjustedScrollTop = ctx.scrollTop - ctx.bigNumbersDelta;
            this._domNode.setTop(-adjustedScrollTop);
            const height = Math.min(ctx.scrollHeight, 1000000);
            this._domNode.setHeight(height);
            this._domNode.setWidth(this._contentLeft);
            this._glyphMarginBackgroundDomNode.setLeft(this._glyphMarginLeft);
            this._glyphMarginBackgroundDomNode.setWidth(this._glyphMarginWidth);
            this._glyphMarginBackgroundDomNode.setHeight(height);
        }
    }
    exports.Margin = Margin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyZ2luLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvbWFyZ2luL21hcmdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxNQUFPLFNBQVEsbUJBQVE7aUJBRVosZUFBVSxHQUFHLGNBQWMsQ0FBQztpQkFDNUIscUJBQWdCLEdBQUcsUUFBUSxDQUFDO1FBU25ELFlBQVksT0FBb0I7WUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2YsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBRXhELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLDJDQUFrQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUMzQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQztZQUNuRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixDQUFDO1lBRXJELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxD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