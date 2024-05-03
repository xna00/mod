/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/css!./rulers"], function (require, exports, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rulers = void 0;
    class Rulers extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.domNode.setClassName('view-rulers');
            this._renderedRulers = [];
            const options = this._context.configuration.options;
            this._rulers = options.get(102 /* EditorOption.rulers */);
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
        }
        dispose() {
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._rulers = options.get(102 /* EditorOption.rulers */);
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            return true;
        }
        onScrollChanged(e) {
            return e.scrollHeightChanged;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        _ensureRulersCount() {
            const currentCount = this._renderedRulers.length;
            const desiredCount = this._rulers.length;
            if (currentCount === desiredCount) {
                // Nothing to do
                return;
            }
            if (currentCount < desiredCount) {
                const { tabSize } = this._context.viewModel.model.getOptions();
                const rulerWidth = tabSize;
                let addCount = desiredCount - currentCount;
                while (addCount > 0) {
                    const node = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                    node.setClassName('view-ruler');
                    node.setWidth(rulerWidth);
                    this.domNode.appendChild(node);
                    this._renderedRulers.push(node);
                    addCount--;
                }
                return;
            }
            let removeCount = currentCount - desiredCount;
            while (removeCount > 0) {
                const node = this._renderedRulers.pop();
                this.domNode.removeChild(node);
                removeCount--;
            }
        }
        render(ctx) {
            this._ensureRulersCount();
            for (let i = 0, len = this._rulers.length; i < len; i++) {
                const node = this._renderedRulers[i];
                const ruler = this._rulers[i];
                node.setBoxShadow(ruler.color ? `1px 0 0 0 ${ruler.color} inset` : ``);
                node.setHeight(Math.min(ctx.scrollHeight, 1000000));
                node.setLeft(ruler.column * this._typicalHalfwidthCharacterWidth);
            }
        }
    }
    exports.Rulers = Rulers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvcnVsZXJzL3J1bGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxNQUFPLFNBQVEsbUJBQVE7UUFPbkMsWUFBWSxPQUFvQjtZQUMvQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsK0JBQWlCLEVBQWMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsK0JBQXFCLENBQUM7WUFDaEQsSUFBSSxDQUFDLCtCQUErQixHQUFHLE9BQU8sQ0FBQyxHQUFHLGdDQUF1QixDQUFDLDhCQUE4QixDQUFDO1FBQzFHLENBQUM7UUFFZSxPQUFPO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRUQsMkJBQTJCO1FBRVgsc0JBQXNCLENBQUMsQ0FBMkM7WUFDakYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMs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