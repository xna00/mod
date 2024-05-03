/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/css!./scrollDecoration"], function (require, exports, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollDecorationViewPart = void 0;
    class ScrollDecorationViewPart extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._scrollTop = 0;
            this._width = 0;
            this._updateWidth();
            this._shouldShow = false;
            const options = this._context.configuration.options;
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            this._useShadows = scrollbar.useShadows;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
        }
        dispose() {
            super.dispose();
        }
        _updateShouldShow() {
            const newShouldShow = (this._useShadows && this._scrollTop > 0);
            if (this._shouldShow !== newShouldShow) {
                this._shouldShow = newShouldShow;
                return true;
            }
            return false;
        }
        getDomNode() {
            return this._domNode;
        }
        _updateWidth() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            if (layoutInfo.minimap.renderMinimap === 0 || (layoutInfo.minimap.minimapWidth > 0 && layoutInfo.minimap.minimapLeft === 0)) {
                this._width = layoutInfo.width;
            }
            else {
                this._width = layoutInfo.width - layoutInfo.verticalScrollbarWidth;
            }
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            this._useShadows = scrollbar.useShadows;
            this._updateWidth();
            this._updateShouldShow();
            return true;
        }
        onScrollChanged(e) {
            this._scrollTop = e.scrollTop;
            return this._updateShouldShow();
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            this._domNode.setWidth(this._width);
            this._domNode.setClassName(this._shouldShow ? 'scroll-decoration' : '');
        }
    }
    exports.ScrollDecorationViewPart = ScrollDecorationViewPart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsRGVjb3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL3Njcm9sbERlY29yYXRpb24vc2Nyb2xsRGVjb3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSx3QkFBeUIsU0FBUSxtQkFBUTtRQVFyRCxZQUFZLE9BQW9CO1lBQy9CLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVmLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsa0NBQXdCLENBQUM7WUFDdEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRWUsT0FBTztZQUN0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssYUFBYSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxXQUFXLEdBQUcsYUFBYSxDQUFDO2dCQUNqQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxVQUFVO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRU8sWUFBWTtZQUNuQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsbUNBQXlCLENBQUM7WUFFeEQsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDN0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLHNCQUFzQixDQUFDO1lBQ3BFLENBQUM7UUFDRixDQUFDO1FBRUQsMkJBQTJCO1FBRVgsc0JBQXNCLENBQUMsQ0FBMkM7WUFDakYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLGtDQUF3QixDQUFDO1lBQ3RELElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUN4QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDekIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ2UsZUFBZSxDQUFDLENBQW9DO1lBQ25FLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFRCx5QkFBeUI7UUFFbEIsYUFBYSxDQUFDLEdBQXFCO1lBQ3pDLGtCQUFrQjtRQUNuQixDQUFDO1FBRU0sTUFBTSxDQUFDLEdBQStCO1lBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekUsQ0FBQztLQUNEO0lBNUVELDREQTRFQyJ9