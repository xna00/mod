/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/ui/contextview/contextview", "vs/base/common/lifecycle", "vs/platform/layout/browser/layoutService", "vs/base/browser/dom"], function (require, exports, contextview_1, lifecycle_1, layoutService_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextViewService = exports.ContextViewHandler = void 0;
    let ContextViewHandler = class ContextViewHandler extends lifecycle_1.Disposable {
        constructor(layoutService) {
            super();
            this.layoutService = layoutService;
            this.currentViewDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.contextView = this._register(new contextview_1.ContextView(this.layoutService.mainContainer, 1 /* ContextViewDOMPosition.ABSOLUTE */));
            this.layout();
            this._register(layoutService.onDidLayoutContainer(() => this.layout()));
        }
        // ContextView
        showContextView(delegate, container, shadowRoot) {
            let domPosition;
            if (container) {
                if (container === this.layoutService.getContainer((0, dom_1.getWindow)(container))) {
                    domPosition = 1 /* ContextViewDOMPosition.ABSOLUTE */;
                }
                else if (shadowRoot) {
                    domPosition = 3 /* ContextViewDOMPosition.FIXED_SHADOW */;
                }
                else {
                    domPosition = 2 /* ContextViewDOMPosition.FIXED */;
                }
            }
            else {
                domPosition = 1 /* ContextViewDOMPosition.ABSOLUTE */;
            }
            this.contextView.setContainer(container ?? this.layoutService.activeContainer, domPosition);
            this.contextView.show(delegate);
            const disposable = (0, lifecycle_1.toDisposable)(() => {
                if (this.currentViewDisposable === disposable) {
                    this.hideContextView();
                }
            });
            this.currentViewDisposable.value = disposable;
            return disposable;
        }
        layout() {
            this.contextView.layout();
        }
        hideContextView(data) {
            this.contextView.hide(data);
        }
    };
    exports.ContextViewHandler = ContextViewHandler;
    exports.ContextViewHandler = ContextViewHandler = __decorate([
        __param(0, layoutService_1.ILayoutService)
    ], ContextViewHandler);
    class ContextViewService extends ContextViewHandler {
        getContextViewElement() {
            return this.contextView.getViewElement();
        }
    }
    exports.ContextViewService = ContextViewService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dFZpZXdTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb250ZXh0dmlldy9icm93c2VyL2NvbnRleHRWaWV3U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUtqRCxZQUNpQixhQUE4QztZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQUZ5QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFKdkQsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFlLENBQUMsQ0FBQztZQUNsRSxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSwwQ0FBa0MsQ0FBQyxDQUFDO1lBT25JLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELGNBQWM7UUFFZCxlQUFlLENBQUMsUUFBOEIsRUFBRSxTQUF1QixFQUFFLFVBQW9CO1lBQzVGLElBQUksV0FBbUMsQ0FBQztZQUN4QyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksU0FBUyxLQUFLLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUEsZUFBUyxFQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDekUsV0FBVywwQ0FBa0MsQ0FBQztnQkFDL0MsQ0FBQztxQkFBTSxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUN2QixXQUFXLDhDQUFzQyxDQUFDO2dCQUNuRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsV0FBVyx1Q0FBK0IsQ0FBQztnQkFDNUMsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxXQUFXLDBDQUFrQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFNUYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFaEMsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDcEMsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssVUFBVSxFQUFFLENBQUM7b0JBQy9DLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssR0FBRyxVQUFVLENBQUM7WUFDOUMsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxlQUFlLENBQUMsSUFBVTtZQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixDQUFDO0tBQ0QsQ0FBQTtJQW5EWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQU01QixXQUFBLDhCQUFjLENBQUE7T0FOSixrQkFBa0IsQ0FtRDlCO0lBRUQsTUFBYSxrQkFBbUIsU0FBUSxrQkFBa0I7UUFJekQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxQyxDQUFDO0tBQ0Q7SUFQRCxnREFPQyJ9