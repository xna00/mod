/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/range", "vs/css!./contextview"], function (require, exports, canIUse_1, DOM, lifecycle_1, platform, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextView = exports.LayoutAnchorMode = exports.LayoutAnchorPosition = exports.AnchorAxisAlignment = exports.AnchorPosition = exports.AnchorAlignment = exports.ContextViewDOMPosition = void 0;
    exports.isAnchor = isAnchor;
    exports.layout = layout;
    var ContextViewDOMPosition;
    (function (ContextViewDOMPosition) {
        ContextViewDOMPosition[ContextViewDOMPosition["ABSOLUTE"] = 1] = "ABSOLUTE";
        ContextViewDOMPosition[ContextViewDOMPosition["FIXED"] = 2] = "FIXED";
        ContextViewDOMPosition[ContextViewDOMPosition["FIXED_SHADOW"] = 3] = "FIXED_SHADOW";
    })(ContextViewDOMPosition || (exports.ContextViewDOMPosition = ContextViewDOMPosition = {}));
    function isAnchor(obj) {
        const anchor = obj;
        return !!anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number';
    }
    var AnchorAlignment;
    (function (AnchorAlignment) {
        AnchorAlignment[AnchorAlignment["LEFT"] = 0] = "LEFT";
        AnchorAlignment[AnchorAlignment["RIGHT"] = 1] = "RIGHT";
    })(AnchorAlignment || (exports.AnchorAlignment = AnchorAlignment = {}));
    var AnchorPosition;
    (function (AnchorPosition) {
        AnchorPosition[AnchorPosition["BELOW"] = 0] = "BELOW";
        AnchorPosition[AnchorPosition["ABOVE"] = 1] = "ABOVE";
    })(AnchorPosition || (exports.AnchorPosition = AnchorPosition = {}));
    var AnchorAxisAlignment;
    (function (AnchorAxisAlignment) {
        AnchorAxisAlignment[AnchorAxisAlignment["VERTICAL"] = 0] = "VERTICAL";
        AnchorAxisAlignment[AnchorAxisAlignment["HORIZONTAL"] = 1] = "HORIZONTAL";
    })(AnchorAxisAlignment || (exports.AnchorAxisAlignment = AnchorAxisAlignment = {}));
    var LayoutAnchorPosition;
    (function (LayoutAnchorPosition) {
        LayoutAnchorPosition[LayoutAnchorPosition["Before"] = 0] = "Before";
        LayoutAnchorPosition[LayoutAnchorPosition["After"] = 1] = "After";
    })(LayoutAnchorPosition || (exports.LayoutAnchorPosition = LayoutAnchorPosition = {}));
    var LayoutAnchorMode;
    (function (LayoutAnchorMode) {
        LayoutAnchorMode[LayoutAnchorMode["AVOID"] = 0] = "AVOID";
        LayoutAnchorMode[LayoutAnchorMode["ALIGN"] = 1] = "ALIGN";
    })(LayoutAnchorMode || (exports.LayoutAnchorMode = LayoutAnchorMode = {}));
    /**
     * Lays out a one dimensional view next to an anchor in a viewport.
     *
     * @returns The view offset within the viewport.
     */
    function layout(viewportSize, viewSize, anchor) {
        const layoutAfterAnchorBoundary = anchor.mode === LayoutAnchorMode.ALIGN ? anchor.offset : anchor.offset + anchor.size;
        const layoutBeforeAnchorBoundary = anchor.mode === LayoutAnchorMode.ALIGN ? anchor.offset + anchor.size : anchor.offset;
        if (anchor.position === 0 /* LayoutAnchorPosition.Before */) {
            if (viewSize <= viewportSize - layoutAfterAnchorBoundary) {
                return layoutAfterAnchorBoundary; // happy case, lay it out after the anchor
            }
            if (viewSize <= layoutBeforeAnchorBoundary) {
                return layoutBeforeAnchorBoundary - viewSize; // ok case, lay it out before the anchor
            }
            return Math.max(viewportSize - viewSize, 0); // sad case, lay it over the anchor
        }
        else {
            if (viewSize <= layoutBeforeAnchorBoundary) {
                return layoutBeforeAnchorBoundary - viewSize; // happy case, lay it out before the anchor
            }
            if (viewSize <= viewportSize - layoutAfterAnchorBoundary) {
                return layoutAfterAnchorBoundary; // ok case, lay it out after the anchor
            }
            return 0; // sad case, lay it over the anchor
        }
    }
    class ContextView extends lifecycle_1.Disposable {
        static { this.BUBBLE_UP_EVENTS = ['click', 'keydown', 'focus', 'blur']; }
        static { this.BUBBLE_DOWN_EVENTS = ['click']; }
        constructor(container, domPosition) {
            super();
            this.container = null;
            this.useFixedPosition = false;
            this.useShadowDOM = false;
            this.delegate = null;
            this.toDisposeOnClean = lifecycle_1.Disposable.None;
            this.toDisposeOnSetContainer = lifecycle_1.Disposable.None;
            this.shadowRoot = null;
            this.shadowRootHostElement = null;
            this.view = DOM.$('.context-view');
            DOM.hide(this.view);
            this.setContainer(container, domPosition);
            this._register((0, lifecycle_1.toDisposable)(() => this.setContainer(null, 1 /* ContextViewDOMPosition.ABSOLUTE */)));
        }
        setContainer(container, domPosition) {
            this.useFixedPosition = domPosition !== 1 /* ContextViewDOMPosition.ABSOLUTE */;
            const usedShadowDOM = this.useShadowDOM;
            this.useShadowDOM = domPosition === 3 /* ContextViewDOMPosition.FIXED_SHADOW */;
            if (container === this.container && usedShadowDOM === this.useShadowDOM) {
                return; // container is the same and no shadow DOM usage has changed
            }
            if (this.container) {
                this.toDisposeOnSetContainer.dispose();
                if (this.shadowRoot) {
                    this.shadowRoot.removeChild(this.view);
                    this.shadowRoot = null;
                    this.shadowRootHostElement?.remove();
                    this.shadowRootHostElement = null;
                }
                else {
                    this.container.removeChild(this.view);
                }
                this.container = null;
            }
            if (container) {
                this.container = container;
                if (this.useShadowDOM) {
                    this.shadowRootHostElement = DOM.$('.shadow-root-host');
                    this.container.appendChild(this.shadowRootHostElement);
                    this.shadowRoot = this.shadowRootHostElement.attachShadow({ mode: 'open' });
                    const style = document.createElement('style');
                    style.textContent = SHADOW_ROOT_CSS;
                    this.shadowRoot.appendChild(style);
                    this.shadowRoot.appendChild(this.view);
                    this.shadowRoot.appendChild(DOM.$('slot'));
                }
                else {
                    this.container.appendChild(this.view);
                }
                const toDisposeOnSetContainer = new lifecycle_1.DisposableStore();
                ContextView.BUBBLE_UP_EVENTS.forEach(event => {
                    toDisposeOnSetContainer.add(DOM.addStandardDisposableListener(this.container, event, e => {
                        this.onDOMEvent(e, false);
                    }));
                });
                ContextView.BUBBLE_DOWN_EVENTS.forEach(event => {
                    toDisposeOnSetContainer.add(DOM.addStandardDisposableListener(this.container, event, e => {
                        this.onDOMEvent(e, true);
                    }, true));
                });
                this.toDisposeOnSetContainer = toDisposeOnSetContainer;
            }
        }
        show(delegate) {
            if (this.isVisible()) {
                this.hide();
            }
            // Show static box
            DOM.clearNode(this.view);
            this.view.className = 'context-view';
            this.view.style.top = '0px';
            this.view.style.left = '0px';
            this.view.style.zIndex = `${2575 + (delegate.layer ?? 0)}`;
            this.view.style.position = this.useFixedPosition ? 'fixed' : 'absolute';
            DOM.show(this.view);
            // Render content
            this.toDisposeOnClean = delegate.render(this.view) || lifecycle_1.Disposable.None;
            // Set active delegate
            this.delegate = delegate;
            // Layout
            this.doLayout();
            // Focus
            this.delegate.focus?.();
        }
        getViewElement() {
            return this.view;
        }
        layout() {
            if (!this.isVisible()) {
                return;
            }
            if (this.delegate.canRelayout === false && !(platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents)) {
                this.hide();
                return;
            }
            this.delegate?.layout?.();
            this.doLayout();
        }
        doLayout() {
            // Check that we still have a delegate - this.delegate.layout may have hidden
            if (!this.isVisible()) {
                return;
            }
            // Get anchor
            const anchor = this.delegate.getAnchor();
            // Compute around
            let around;
            // Get the element's position and size (to anchor the view)
            if (anchor instanceof HTMLElement) {
                const elementPosition = DOM.getDomNodePagePosition(anchor);
                // In areas where zoom is applied to the element or its ancestors, we need to adjust the size of the element
                // e.g. The title bar has counter zoom behavior meaning it applies the inverse of zoom level.
                // Window Zoom Level: 1.5, Title Bar Zoom: 1/1.5, Size Multiplier: 1.5
                const zoom = DOM.getDomNodeZoomLevel(anchor);
                around = {
                    top: elementPosition.top * zoom,
                    left: elementPosition.left * zoom,
                    width: elementPosition.width * zoom,
                    height: elementPosition.height * zoom
                };
            }
            else if (isAnchor(anchor)) {
                around = {
                    top: anchor.y,
                    left: anchor.x,
                    width: anchor.width || 1,
                    height: anchor.height || 2
                };
            }
            else {
                around = {
                    top: anchor.posy,
                    left: anchor.posx,
                    // We are about to position the context view where the mouse
                    // cursor is. To prevent the view being exactly under the mouse
                    // when showing and thus potentially triggering an action within,
                    // we treat the mouse location like a small sized block element.
                    width: 2,
                    height: 2
                };
            }
            const viewSizeWidth = DOM.getTotalWidth(this.view);
            const viewSizeHeight = DOM.getTotalHeight(this.view);
            const anchorPosition = this.delegate.anchorPosition || 0 /* AnchorPosition.BELOW */;
            const anchorAlignment = this.delegate.anchorAlignment || 0 /* AnchorAlignment.LEFT */;
            const anchorAxisAlignment = this.delegate.anchorAxisAlignment || 0 /* AnchorAxisAlignment.VERTICAL */;
            let top;
            let left;
            const activeWindow = DOM.getActiveWindow();
            if (anchorAxisAlignment === 0 /* AnchorAxisAlignment.VERTICAL */) {
                const verticalAnchor = { offset: around.top - activeWindow.pageYOffset, size: around.height, position: anchorPosition === 0 /* AnchorPosition.BELOW */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */ };
                const horizontalAnchor = { offset: around.left, size: around.width, position: anchorAlignment === 0 /* AnchorAlignment.LEFT */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */, mode: LayoutAnchorMode.ALIGN };
                top = layout(activeWindow.innerHeight, viewSizeHeight, verticalAnchor) + activeWindow.pageYOffset;
                // if view intersects vertically with anchor,  we must avoid the anchor
                if (range_1.Range.intersects({ start: top, end: top + viewSizeHeight }, { start: verticalAnchor.offset, end: verticalAnchor.offset + verticalAnchor.size })) {
                    horizontalAnchor.mode = LayoutAnchorMode.AVOID;
                }
                left = layout(activeWindow.innerWidth, viewSizeWidth, horizontalAnchor);
            }
            else {
                const horizontalAnchor = { offset: around.left, size: around.width, position: anchorAlignment === 0 /* AnchorAlignment.LEFT */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */ };
                const verticalAnchor = { offset: around.top, size: around.height, position: anchorPosition === 0 /* AnchorPosition.BELOW */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */, mode: LayoutAnchorMode.ALIGN };
                left = layout(activeWindow.innerWidth, viewSizeWidth, horizontalAnchor);
                // if view intersects horizontally with anchor, we must avoid the anchor
                if (range_1.Range.intersects({ start: left, end: left + viewSizeWidth }, { start: horizontalAnchor.offset, end: horizontalAnchor.offset + horizontalAnchor.size })) {
                    verticalAnchor.mode = LayoutAnchorMode.AVOID;
                }
                top = layout(activeWindow.innerHeight, viewSizeHeight, verticalAnchor) + activeWindow.pageYOffset;
            }
            this.view.classList.remove('top', 'bottom', 'left', 'right');
            this.view.classList.add(anchorPosition === 0 /* AnchorPosition.BELOW */ ? 'bottom' : 'top');
            this.view.classList.add(anchorAlignment === 0 /* AnchorAlignment.LEFT */ ? 'left' : 'right');
            this.view.classList.toggle('fixed', this.useFixedPosition);
            const containerPosition = DOM.getDomNodePagePosition(this.container);
            this.view.style.top = `${top - (this.useFixedPosition ? DOM.getDomNodePagePosition(this.view).top : containerPosition.top)}px`;
            this.view.style.left = `${left - (this.useFixedPosition ? DOM.getDomNodePagePosition(this.view).left : containerPosition.left)}px`;
            this.view.style.width = 'initial';
        }
        hide(data) {
            const delegate = this.delegate;
            this.delegate = null;
            if (delegate?.onHide) {
                delegate.onHide(data);
            }
            this.toDisposeOnClean.dispose();
            DOM.hide(this.view);
        }
        isVisible() {
            return !!this.delegate;
        }
        onDOMEvent(e, onCapture) {
            if (this.delegate) {
                if (this.delegate.onDOMEvent) {
                    this.delegate.onDOMEvent(e, DOM.getWindow(e).document.activeElement);
                }
                else if (onCapture && !DOM.isAncestor(e.target, this.container)) {
                    this.hide();
                }
            }
        }
        dispose() {
            this.hide();
            super.dispose();
        }
    }
    exports.ContextView = ContextView;
    const SHADOW_ROOT_CSS = /* css */ `
	:host {
		all: initial; /* 1st rule so subsequent properties are reset. */
	}

	.codicon[class*='codicon-'] {
		font: normal normal normal 16px/1 codicon;
		display: inline-block;
		text-decoration: none;
		text-rendering: auto;
		text-align: center;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	:host {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "HelveticaNeue-Light", system-ui, "Ubuntu", "Droid Sans", sans-serif;
	}

	:host-context(.mac) { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
	:host-context(.mac:lang(zh-Hans)) { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif; }
	:host-context(.mac:lang(zh-Hant)) { font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif; }
	:host-context(.mac:lang(ja)) { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic Pro", sans-serif; }
	:host-context(.mac:lang(ko)) { font-family: -apple-system, BlinkMacSystemFont, "Nanum Gothic", "Apple SD Gothic Neo", "AppleGothic", sans-serif; }

	:host-context(.windows) { font-family: "Segoe WPC", "Segoe UI", sans-serif; }
	:host-context(.windows:lang(zh-Hans)) { font-family: "Segoe WPC", "Segoe UI", "Microsoft YaHei", sans-serif; }
	:host-context(.windows:lang(zh-Hant)) { font-family: "Segoe WPC", "Segoe UI", "Microsoft Jhenghei", sans-serif; }
	:host-context(.windows:lang(ja)) { font-family: "Segoe WPC", "Segoe UI", "Yu Gothic UI", "Meiryo UI", sans-serif; }
	:host-context(.windows:lang(ko)) { font-family: "Segoe WPC", "Segoe UI", "Malgun Gothic", "Dotom", sans-serif; }

	:host-context(.linux) { font-family: system-ui, "Ubuntu", "Droid Sans", sans-serif; }
	:host-context(.linux:lang(zh-Hans)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans SC", "Source Han Sans CN", "Source Han Sans", sans-serif; }
	:host-context(.linux:lang(zh-Hant)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans TC", "Source Han Sans TW", "Source Han Sans", sans-serif; }
	:host-context(.linux:lang(ja)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans J", "Source Han Sans JP", "Source Han Sans", sans-serif; }
	:host-context(.linux:lang(ko)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans K", "Source Han Sans JR", "Source Han Sans", "UnDotum", "FBaekmuk Gulim", sans-serif; }
`;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dHZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9jb250ZXh0dmlldy9jb250ZXh0dmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLDRCQUlDO0lBNEVELHdCQXlCQztJQXRIRCxJQUFrQixzQkFJakI7SUFKRCxXQUFrQixzQkFBc0I7UUFDdkMsMkVBQVksQ0FBQTtRQUNaLHFFQUFLLENBQUE7UUFDTCxtRkFBWSxDQUFBO0lBQ2IsQ0FBQyxFQUppQixzQkFBc0Isc0NBQXRCLHNCQUFzQixRQUl2QztJQVNELFNBQWdCLFFBQVEsQ0FBQyxHQUFZO1FBQ3BDLE1BQU0sTUFBTSxHQUFHLEdBQWtELENBQUM7UUFFbEUsT0FBTyxDQUFDLENBQUMsTUFBTSxJQUFJLE9BQU8sTUFBTSxDQUFDLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxNQUFNLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQztJQUNqRixDQUFDO0lBRUQsSUFBa0IsZUFFakI7SUFGRCxXQUFrQixlQUFlO1FBQ2hDLHFEQUFJLENBQUE7UUFBRSx1REFBSyxDQUFBO0lBQ1osQ0FBQyxFQUZpQixlQUFlLCtCQUFmLGVBQWUsUUFFaEM7SUFFRCxJQUFrQixjQUVqQjtJQUZELFdBQWtCLGNBQWM7UUFDL0IscURBQUssQ0FBQTtRQUFFLHFEQUFLLENBQUE7SUFDYixDQUFDLEVBRmlCLGNBQWMsOEJBQWQsY0FBYyxRQUUvQjtJQUVELElBQWtCLG1CQUVqQjtJQUZELFdBQWtCLG1CQUFtQjtRQUNwQyxxRUFBUSxDQUFBO1FBQUUseUVBQVUsQ0FBQTtJQUNyQixDQUFDLEVBRmlCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBRXBDO0lBMENELElBQWtCLG9CQUdqQjtJQUhELFdBQWtCLG9CQUFvQjtRQUNyQyxtRUFBTSxDQUFBO1FBQ04saUVBQUssQ0FBQTtJQUNOLENBQUMsRUFIaUIsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFHckM7SUFFRCxJQUFZLGdCQUdYO0lBSEQsV0FBWSxnQkFBZ0I7UUFDM0IseURBQUssQ0FBQTtRQUNMLHlEQUFLLENBQUE7SUFDTixDQUFDLEVBSFcsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFHM0I7SUFTRDs7OztPQUlHO0lBQ0gsU0FBZ0IsTUFBTSxDQUFDLFlBQW9CLEVBQUUsUUFBZ0IsRUFBRSxNQUFxQjtRQUNuRixNQUFNLHlCQUF5QixHQUFHLE1BQU0sQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDdkgsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLENBQUMsSUFBSSxLQUFLLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRXhILElBQUksTUFBTSxDQUFDLFFBQVEsd0NBQWdDLEVBQUUsQ0FBQztZQUNyRCxJQUFJLFFBQVEsSUFBSSxZQUFZLEdBQUcseUJBQXlCLEVBQUUsQ0FBQztnQkFDMUQsT0FBTyx5QkFBeUIsQ0FBQyxDQUFDLDBDQUEwQztZQUM3RSxDQUFDO1lBRUQsSUFBSSxRQUFRLElBQUksMEJBQTBCLEVBQUUsQ0FBQztnQkFDNUMsT0FBTywwQkFBMEIsR0FBRyxRQUFRLENBQUMsQ0FBQyx3Q0FBd0M7WUFDdkYsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUNBQW1DO1FBQ2pGLENBQUM7YUFBTSxDQUFDO1lBQ1AsSUFBSSxRQUFRLElBQUksMEJBQTBCLEVBQUUsQ0FBQztnQkFDNUMsT0FBTywwQkFBMEIsR0FBRyxRQUFRLENBQUMsQ0FBQywyQ0FBMkM7WUFDMUYsQ0FBQztZQUVELElBQUksUUFBUSxJQUFJLFlBQVksR0FBRyx5QkFBeUIsRUFBRSxDQUFDO2dCQUMxRCxPQUFPLHlCQUF5QixDQUFDLENBQUMsdUNBQXVDO1lBQzFFLENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBQyxDQUFDLG1DQUFtQztRQUM5QyxDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQWEsV0FBWSxTQUFRLHNCQUFVO2lCQUVsQixxQkFBZ0IsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxBQUF4QyxDQUF5QztpQkFDekQsdUJBQWtCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQUFBWixDQUFhO1FBWXZELFlBQVksU0FBc0IsRUFBRSxXQUFtQztZQUN0RSxLQUFLLEVBQUUsQ0FBQztZQVhELGNBQVMsR0FBdUIsSUFBSSxDQUFDO1lBRXJDLHFCQUFnQixHQUFHLEtBQUssQ0FBQztZQUN6QixpQkFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQixhQUFRLEdBQXFCLElBQUksQ0FBQztZQUNsQyxxQkFBZ0IsR0FBZ0Isc0JBQVUsQ0FBQyxJQUFJLENBQUM7WUFDaEQsNEJBQXVCLEdBQWdCLHNCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3ZELGVBQVUsR0FBc0IsSUFBSSxDQUFDO1lBQ3JDLDBCQUFxQixHQUF1QixJQUFJLENBQUM7WUFLeEQsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBCLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSwwQ0FBa0MsQ0FBQyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVELFlBQVksQ0FBQyxTQUE2QixFQUFFLFdBQW1DO1lBQzlFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLDRDQUFvQyxDQUFDO1lBQ3hFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDeEMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLGdEQUF3QyxDQUFDO1lBRXhFLElBQUksU0FBUyxLQUFLLElBQUksQ0FBQyxTQUFTLElBQUksYUFBYSxLQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDekUsT0FBTyxDQUFDLDREQUE0RDtZQUNyRSxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFdkMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztnQkFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN2QixDQUFDO1lBRUQsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFFM0IsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUM7b0JBQ3hELElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDNUUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDOUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxlQUFlLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztnQkFFRCxNQUFNLHVCQUF1QixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO2dCQUV0RCxXQUFXLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUM1Qyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxTQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFO3dCQUN6RixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFFSCxXQUFXLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUM5Qyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxTQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFO3dCQUN6RixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDMUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO1lBQ3hELENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxDQUFDLFFBQW1CO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNiLENBQUM7WUFFRCxrQkFBa0I7WUFDbEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsY0FBYyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDeEUsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFcEIsaUJBQWlCO1lBQ2pCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUV0RSxzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFFekIsU0FBUztZQUNULElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUVoQixRQUFRO1lBQ1IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO2dCQUN2QixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFFBQVMsQ0FBQyxXQUFXLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLHlCQUFlLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDaEcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNaLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBRTFCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU8sUUFBUTtZQUNmLDZFQUE2RTtZQUM3RSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDUixDQUFDO1lBRUQsYUFBYTtZQUNiLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7WUFFMUMsaUJBQWlCO1lBQ2pCLElBQUksTUFBYSxDQUFDO1lBRWxCLDJEQUEyRDtZQUMzRCxJQUFJLE1BQU0sWUFBWSxXQUFXLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUUzRCw0R0FBNEc7Z0JBQzVHLDZGQUE2RjtnQkFDN0Ysc0VBQXNFO2dCQUN0RSxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTdDLE1BQU0sR0FBRztvQkFDUixHQUFHLEVBQUUsZUFBZSxDQUFDLEdBQUcsR0FBRyxJQUFJO29CQUMvQixJQUFJLEVBQUUsZUFBZSxDQUFDLElBQUksR0FBRyxJQUFJO29CQUNqQyxLQUFLLEVBQUUsZUFBZSxDQUFDLEtBQUssR0FBRyxJQUFJO29CQUNuQyxNQUFNLEVBQUUsZUFBZSxDQUFDLE1BQU0sR0FBRyxJQUFJO2lCQUNyQyxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUM3QixNQUFNLEdBQUc7b0JBQ1IsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUNiLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDZCxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDO29CQUN4QixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDO2lCQUMxQixDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sR0FBRztvQkFDUixHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUk7b0JBQ2hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDakIsNERBQTREO29CQUM1RCwrREFBK0Q7b0JBQy9ELGlFQUFpRTtvQkFDakUsZ0VBQWdFO29CQUNoRSxLQUFLLEVBQUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsQ0FBQztpQkFDVCxDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFTLENBQUMsY0FBYyxnQ0FBd0IsQ0FBQztZQUM3RSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsUUFBUyxDQUFDLGVBQWUsZ0NBQXdCLENBQUM7WUFDL0UsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsUUFBUyxDQUFDLG1CQUFtQix3Q0FBZ0MsQ0FBQztZQUUvRixJQUFJLEdBQVcsQ0FBQztZQUNoQixJQUFJLElBQVksQ0FBQztZQUVqQixNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDM0MsSUFBSSxtQkFBbUIseUNBQWlDLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxjQUFjLEdBQWtCLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsY0FBYyxpQ0FBeUIsQ0FBQyxDQUFDLHFDQUE2QixDQUFDLG1DQUEyQixFQUFFLENBQUM7Z0JBQzNOLE1BQU0sZ0JBQWdCLEdBQWtCLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLGVBQWUsaUNBQXlCLENBQUMsQ0FBQyxxQ0FBNkIsQ0FBQyxtQ0FBMkIsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRWpPLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQztnQkFFbEcsdUVBQXVFO2dCQUN2RSxJQUFJLGFBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsY0FBYyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsY0FBYyxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNySixnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO2dCQUNoRCxDQUFDO2dCQUVELElBQUksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUN6RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxnQkFBZ0IsR0FBa0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsZUFBZSxpQ0FBeUIsQ0FBQyxDQUFDLHFDQUE2QixDQUFDLG1DQUEyQixFQUFFLENBQUM7Z0JBQ25NLE1BQU0sY0FBYyxHQUFrQixFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxjQUFjLGlDQUF5QixDQUFDLENBQUMscUNBQTZCLENBQUMsbUNBQTJCLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUU5TixJQUFJLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBRXhFLHdFQUF3RTtnQkFDeEUsSUFBSSxhQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxHQUFHLGFBQWEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDNUosY0FBYyxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7Z0JBQzlDLENBQUM7Z0JBRUQsR0FBRyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDO1lBQ25HLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsaUNBQXlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGVBQWUsaUNBQXlCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUzRCxNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsU0FBVSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUMvSCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ25JLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFjO1lBQ2xCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFFckIsSUFBSSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7Z0JBQ3RCLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRU8sU0FBUztZQUNoQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3hCLENBQUM7UUFFTyxVQUFVLENBQUMsQ0FBVSxFQUFFLFNBQWtCO1lBQ2hELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBZSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbkYsQ0FBQztxQkFBTSxJQUFJLFNBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQWMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDaEYsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFWixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQzs7SUEvUEYsa0NBZ1FDO0lBRUQsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1Q2pDLENBQUMifQ==