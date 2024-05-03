/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/sash/sash", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom_1, sash_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResizableHTMLElement = void 0;
    class ResizableHTMLElement {
        constructor() {
            this._onDidWillResize = new event_1.Emitter();
            this.onDidWillResize = this._onDidWillResize.event;
            this._onDidResize = new event_1.Emitter();
            this.onDidResize = this._onDidResize.event;
            this._sashListener = new lifecycle_1.DisposableStore();
            this._size = new dom_1.Dimension(0, 0);
            this._minSize = new dom_1.Dimension(0, 0);
            this._maxSize = new dom_1.Dimension(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            this.domNode = document.createElement('div');
            this._eastSash = new sash_1.Sash(this.domNode, { getVerticalSashLeft: () => this._size.width }, { orientation: 0 /* Orientation.VERTICAL */ });
            this._westSash = new sash_1.Sash(this.domNode, { getVerticalSashLeft: () => 0 }, { orientation: 0 /* Orientation.VERTICAL */ });
            this._northSash = new sash_1.Sash(this.domNode, { getHorizontalSashTop: () => 0 }, { orientation: 1 /* Orientation.HORIZONTAL */, orthogonalEdge: sash_1.OrthogonalEdge.North });
            this._southSash = new sash_1.Sash(this.domNode, { getHorizontalSashTop: () => this._size.height }, { orientation: 1 /* Orientation.HORIZONTAL */, orthogonalEdge: sash_1.OrthogonalEdge.South });
            this._northSash.orthogonalStartSash = this._westSash;
            this._northSash.orthogonalEndSash = this._eastSash;
            this._southSash.orthogonalStartSash = this._westSash;
            this._southSash.orthogonalEndSash = this._eastSash;
            let currentSize;
            let deltaY = 0;
            let deltaX = 0;
            this._sashListener.add(event_1.Event.any(this._northSash.onDidStart, this._eastSash.onDidStart, this._southSash.onDidStart, this._westSash.onDidStart)(() => {
                if (currentSize === undefined) {
                    this._onDidWillResize.fire();
                    currentSize = this._size;
                    deltaY = 0;
                    deltaX = 0;
                }
            }));
            this._sashListener.add(event_1.Event.any(this._northSash.onDidEnd, this._eastSash.onDidEnd, this._southSash.onDidEnd, this._westSash.onDidEnd)(() => {
                if (currentSize !== undefined) {
                    currentSize = undefined;
                    deltaY = 0;
                    deltaX = 0;
                    this._onDidResize.fire({ dimension: this._size, done: true });
                }
            }));
            this._sashListener.add(this._eastSash.onDidChange(e => {
                if (currentSize) {
                    deltaX = e.currentX - e.startX;
                    this.layout(currentSize.height + deltaY, currentSize.width + deltaX);
                    this._onDidResize.fire({ dimension: this._size, done: false, east: true });
                }
            }));
            this._sashListener.add(this._westSash.onDidChange(e => {
                if (currentSize) {
                    deltaX = -(e.currentX - e.startX);
                    this.layout(currentSize.height + deltaY, currentSize.width + deltaX);
                    this._onDidResize.fire({ dimension: this._size, done: false, west: true });
                }
            }));
            this._sashListener.add(this._northSash.onDidChange(e => {
                if (currentSize) {
                    deltaY = -(e.currentY - e.startY);
                    this.layout(currentSize.height + deltaY, currentSize.width + deltaX);
                    this._onDidResize.fire({ dimension: this._size, done: false, north: true });
                }
            }));
            this._sashListener.add(this._southSash.onDidChange(e => {
                if (currentSize) {
                    deltaY = e.currentY - e.startY;
                    this.layout(currentSize.height + deltaY, currentSize.width + deltaX);
                    this._onDidResize.fire({ dimension: this._size, done: false, south: true });
                }
            }));
            this._sashListener.add(event_1.Event.any(this._eastSash.onDidReset, this._westSash.onDidReset)(e => {
                if (this._preferredSize) {
                    this.layout(this._size.height, this._preferredSize.width);
                    this._onDidResize.fire({ dimension: this._size, done: true });
                }
            }));
            this._sashListener.add(event_1.Event.any(this._northSash.onDidReset, this._southSash.onDidReset)(e => {
                if (this._preferredSize) {
                    this.layout(this._preferredSize.height, this._size.width);
                    this._onDidResize.fire({ dimension: this._size, done: true });
                }
            }));
        }
        dispose() {
            this._northSash.dispose();
            this._southSash.dispose();
            this._eastSash.dispose();
            this._westSash.dispose();
            this._sashListener.dispose();
            this._onDidResize.dispose();
            this._onDidWillResize.dispose();
            this.domNode.remove();
        }
        enableSashes(north, east, south, west) {
            this._northSash.state = north ? 3 /* SashState.Enabled */ : 0 /* SashState.Disabled */;
            this._eastSash.state = east ? 3 /* SashState.Enabled */ : 0 /* SashState.Disabled */;
            this._southSash.state = south ? 3 /* SashState.Enabled */ : 0 /* SashState.Disabled */;
            this._westSash.state = west ? 3 /* SashState.Enabled */ : 0 /* SashState.Disabled */;
        }
        layout(height = this.size.height, width = this.size.width) {
            const { height: minHeight, width: minWidth } = this._minSize;
            const { height: maxHeight, width: maxWidth } = this._maxSize;
            height = Math.max(minHeight, Math.min(maxHeight, height));
            width = Math.max(minWidth, Math.min(maxWidth, width));
            const newSize = new dom_1.Dimension(width, height);
            if (!dom_1.Dimension.equals(newSize, this._size)) {
                this.domNode.style.height = height + 'px';
                this.domNode.style.width = width + 'px';
                this._size = newSize;
                this._northSash.layout();
                this._eastSash.layout();
                this._southSash.layout();
                this._westSash.layout();
            }
        }
        clearSashHoverState() {
            this._eastSash.clearSashHoverState();
            this._westSash.clearSashHoverState();
            this._northSash.clearSashHoverState();
            this._southSash.clearSashHoverState();
        }
        get size() {
            return this._size;
        }
        set maxSize(value) {
            this._maxSize = value;
        }
        get maxSize() {
            return this._maxSize;
        }
        set minSize(value) {
            this._minSize = value;
        }
        get minSize() {
            return this._minSize;
        }
        set preferredSize(value) {
            this._preferredSize = value;
        }
        get preferredSize() {
            return this._preferredSize;
        }
    }
    exports.ResizableHTMLElement = ResizableHTMLElement;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXphYmxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvcmVzaXphYmxlL3Jlc2l6YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsb0JBQW9CO1FBcUJoQztZQWpCaUIscUJBQWdCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUMvQyxvQkFBZSxHQUFnQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRW5ELGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQWdCLENBQUM7WUFDbkQsZ0JBQVcsR0FBd0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFNbkQsa0JBQWEsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUvQyxVQUFLLEdBQUcsSUFBSSxlQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLGFBQVEsR0FBRyxJQUFJLGVBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsYUFBUSxHQUFHLElBQUksZUFBUyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUlsRixJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFdBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLFdBQVcsOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxXQUFJLENBQUMsSUFB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LEVBQUUsS0FBYyxFQUFFLElBQWE7WUFDeEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsMkJBQW1CLENBQUMsMkJBQW1CLENBQUM7WUFDdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsMkJBQW1CLENBQUMsMkJBQW1CLENBQUM7WUFDckUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsMkJBQW1CLENBQUMsMkJBQW1CLENBQUM7WUFDdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsMkJBQW1CLENBQUMsMkJBQW1CLENBQUM7UUFDdEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUs7WUFFeEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDN0QsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFFN0QsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDMUQsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFdEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFTLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxlQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztnQkFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QixDQUFDO1FBQ0YsQ0FBQztRQUVELG1CQUFtQjtZQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksSUFBSTtZQUNQLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsS0FBZ0I7WUFDM0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsS0FBZ0I7WUFDM0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxhQUFhLENBQUMsS0FBNEI7WUFDN0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBektELG9EQXlLQyJ9