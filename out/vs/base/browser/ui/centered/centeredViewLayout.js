/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom_1, splitview_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CenteredViewLayout = void 0;
    const defaultState = {
        targetWidth: 900,
        leftMarginRatio: 0.1909,
        rightMarginRatio: 0.1909,
    };
    const distributeSizing = { type: 'distribute' };
    function createEmptyView(background) {
        const element = (0, dom_1.$)('.centered-layout-margin');
        element.style.height = '100%';
        if (background) {
            element.style.backgroundColor = background.toString();
        }
        return {
            element,
            layout: () => undefined,
            minimumSize: 60,
            maximumSize: Number.POSITIVE_INFINITY,
            onDidChange: event_1.Event.None
        };
    }
    function toSplitViewView(view, getHeight) {
        return {
            element: view.element,
            get maximumSize() { return view.maximumWidth; },
            get minimumSize() { return view.minimumWidth; },
            onDidChange: event_1.Event.map(view.onDidChange, e => e && e.width),
            layout: (size, offset, ctx) => view.layout(size, getHeight(), ctx?.top ?? 0, (ctx?.left ?? 0) + offset)
        };
    }
    class CenteredViewLayout {
        constructor(container, view, state = { ...defaultState }, centeredLayoutFixedWidth = false) {
            this.container = container;
            this.view = view;
            this.state = state;
            this.centeredLayoutFixedWidth = centeredLayoutFixedWidth;
            this.lastLayoutPosition = { width: 0, height: 0, left: 0, top: 0 };
            this.didLayout = false;
            this.splitViewDisposables = new lifecycle_1.DisposableStore();
            this._boundarySashes = {};
            this.container.appendChild(this.view.element);
            // Make sure to hide the split view overflow like sashes #52892
            this.container.style.overflow = 'hidden';
        }
        get minimumWidth() { return this.splitView ? this.splitView.minimumSize : this.view.minimumWidth; }
        get maximumWidth() { return this.splitView ? this.splitView.maximumSize : this.view.maximumWidth; }
        get minimumHeight() { return this.view.minimumHeight; }
        get maximumHeight() { return this.view.maximumHeight; }
        get onDidChange() { return this.view.onDidChange; }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            if (!this.splitView) {
                return;
            }
            this.splitView.orthogonalStartSash = boundarySashes.top;
            this.splitView.orthogonalEndSash = boundarySashes.bottom;
        }
        layout(width, height, top, left) {
            this.lastLayoutPosition = { width, height, top, left };
            if (this.splitView) {
                this.splitView.layout(width, this.lastLayoutPosition);
                if (!this.didLayout || this.centeredLayoutFixedWidth) {
                    this.resizeSplitViews();
                }
            }
            else {
                this.view.layout(width, height, top, left);
            }
            this.didLayout = true;
        }
        resizeSplitViews() {
            if (!this.splitView) {
                return;
            }
            if (this.centeredLayoutFixedWidth) {
                const centerViewWidth = Math.min(this.lastLayoutPosition.width, this.state.targetWidth);
                const marginWidthFloat = (this.lastLayoutPosition.width - centerViewWidth) / 2;
                this.splitView.resizeView(0, Math.floor(marginWidthFloat));
                this.splitView.resizeView(1, centerViewWidth);
                this.splitView.resizeView(2, Math.ceil(marginWidthFloat));
            }
            else {
                const leftMargin = this.state.leftMarginRatio * this.lastLayoutPosition.width;
                const rightMargin = this.state.rightMarginRatio * this.lastLayoutPosition.width;
                const center = this.lastLayoutPosition.width - leftMargin - rightMargin;
                this.splitView.resizeView(0, leftMargin);
                this.splitView.resizeView(1, center);
                this.splitView.resizeView(2, rightMargin);
            }
        }
        setFixedWidth(option) {
            this.centeredLayoutFixedWidth = option;
            if (!!this.splitView) {
                this.updateState();
                this.resizeSplitViews();
            }
        }
        updateState() {
            if (!!this.splitView) {
                this.state.targetWidth = this.splitView.getViewSize(1);
                this.state.leftMarginRatio = this.splitView.getViewSize(0) / this.lastLayoutPosition.width;
                this.state.rightMarginRatio = this.splitView.getViewSize(2) / this.lastLayoutPosition.width;
            }
        }
        isActive() {
            return !!this.splitView;
        }
        styles(style) {
            this.style = style;
            if (this.splitView && this.emptyViews) {
                this.splitView.style(this.style);
                this.emptyViews[0].element.style.backgroundColor = this.style.background.toString();
                this.emptyViews[1].element.style.backgroundColor = this.style.background.toString();
            }
        }
        activate(active) {
            if (active === this.isActive()) {
                return;
            }
            if (active) {
                this.container.removeChild(this.view.element);
                this.splitView = new splitview_1.SplitView(this.container, {
                    inverseAltBehavior: true,
                    orientation: 1 /* Orientation.HORIZONTAL */,
                    styles: this.style
                });
                this.splitView.orthogonalStartSash = this.boundarySashes.top;
                this.splitView.orthogonalEndSash = this.boundarySashes.bottom;
                this.splitViewDisposables.add(this.splitView.onDidSashChange(() => {
                    if (!!this.splitView) {
                        this.updateState();
                    }
                }));
                this.splitViewDisposables.add(this.splitView.onDidSashReset(() => {
                    this.state = { ...defaultState };
                    this.resizeSplitViews();
                }));
                this.splitView.layout(this.lastLayoutPosition.width, this.lastLayoutPosition);
                const backgroundColor = this.style ? this.style.background : undefined;
                this.emptyViews = [createEmptyView(backgroundColor), createEmptyView(backgroundColor)];
                this.splitView.addView(this.emptyViews[0], distributeSizing, 0);
                this.splitView.addView(toSplitViewView(this.view, () => this.lastLayoutPosition.height), distributeSizing, 1);
                this.splitView.addView(this.emptyViews[1], distributeSizing, 2);
                this.resizeSplitViews();
            }
            else {
                if (this.splitView) {
                    this.container.removeChild(this.splitView.el);
                }
                this.splitViewDisposables.clear();
                this.splitView?.dispose();
                this.splitView = undefined;
                this.emptyViews = undefined;
                this.container.appendChild(this.view.element);
                this.view.layout(this.lastLayoutPosition.width, this.lastLayoutPosition.height, this.lastLayoutPosition.top, this.lastLayoutPosition.left);
            }
        }
        isDefault(state) {
            if (this.centeredLayoutFixedWidth) {
                return state.targetWidth === defaultState.targetWidth;
            }
            else {
                return state.leftMarginRatio === defaultState.leftMarginRatio
                    && state.rightMarginRatio === defaultState.rightMarginRatio;
            }
        }
        dispose() {
            this.splitViewDisposables.dispose();
            if (this.splitView) {
                this.splitView.dispose();
                this.splitView = undefined;
            }
        }
    }
    exports.CenteredViewLayout = CenteredViewLayout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VudGVyZWRWaWV3TGF5b3V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvY2VudGVyZWQvY2VudGVyZWRWaWV3TGF5b3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBTSxZQUFZLEdBQXNCO1FBQ3ZDLFdBQVcsRUFBRSxHQUFHO1FBQ2hCLGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLGdCQUFnQixFQUFFLE1BQU07S0FDeEIsQ0FBQztJQUVGLE1BQU0sZ0JBQWdCLEdBQXFCLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDO0lBRWxFLFNBQVMsZUFBZSxDQUFDLFVBQTZCO1FBQ3JELE1BQU0sT0FBTyxHQUFHLElBQUEsT0FBQyxFQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQzlCLElBQUksVUFBVSxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxPQUFPO1lBQ04sT0FBTztZQUNQLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO1lBQ3ZCLFdBQVcsRUFBRSxFQUFFO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7WUFDckMsV0FBVyxFQUFFLGFBQUssQ0FBQyxJQUFJO1NBQ3ZCLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsSUFBVyxFQUFFLFNBQXVCO1FBQzVELE9BQU87WUFDTixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDckIsSUFBSSxXQUFXLEtBQUssT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMvQyxJQUFJ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