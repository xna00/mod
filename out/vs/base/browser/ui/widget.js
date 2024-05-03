/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/common/lifecycle"], function (require, exports, dom, keyboardEvent_1, mouseEvent_1, touch_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Widget = void 0;
    class Widget extends lifecycle_1.Disposable {
        onclick(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.CLICK, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onmousedown(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_DOWN, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onmouseover(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_OVER, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onmouseleave(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_LEAVE, (e) => listener(new mouseEvent_1.StandardMouseEvent(dom.getWindow(domNode), e))));
        }
        onkeydown(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => listener(new keyboardEvent_1.StandardKeyboardEvent(e))));
        }
        onkeyup(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e) => listener(new keyboardEvent_1.StandardKeyboardEvent(e))));
        }
        oninput(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.INPUT, listener));
        }
        onblur(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.BLUR, listener));
        }
        onfocus(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.FOCUS, listener));
        }
        onchange(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.CHANGE, listener));
        }
        ignoreGesture(domNode) {
            return touch_1.Gesture.ignoreTarget(domNode);
        }
    }
    exports.Widget = Widget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvd2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFzQixNQUFPLFNBQVEsc0JBQVU7UUFFcEMsT0FBTyxDQUFDLE9BQW9CLEVBQUUsUUFBa0M7WUFDekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSwrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pKLENBQUM7UUFFUyxXQUFXLENBQUMsT0FBb0IsRUFBRSxRQUFrQztZQUM3RSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLCtCQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUosQ0FBQztRQUVTLFdBQVcsQ0FBQyxPQUFvQixFQUFFLFFBQWtDO1lBQzdFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQWEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksK0JBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5SixDQUFDO1FBRVMsWUFBWSxDQUFDLE9BQW9CLEVBQUUsUUFBa0M7WUFDOUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSwrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9KLENBQUM7UUFFUyxTQUFTLENBQUMsT0FBb0IsRUFBRSxRQUFxQztZQUM5RSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFnQixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxxQ0FBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxSSxDQUFDO1FBRVMsT0FBTyxDQUFDLE9BQW9CLEVBQUUsUUFBcUM7WUFDNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBZ0IsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEksQ0FBQztRQUVTLE9BQU8sQ0FBQyxPQUFvQixFQUFFLFFBQTRCO1lBQ25FLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFFUyxNQUFNLENBQUMsT0FBb0IsRUFBRSxRQUE0QjtZQUNsRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRVMsT0FBTyxDQUFDLE9BQW9CLEVBQUUsUUFBNEI7WUFDbkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVTLFFBQVEsQ0FBQyxPQUFvQixFQUFFLFFBQTRCO1lBQ3BFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFUyxhQUFhLENBQUMsT0FBb0I7WUFDM0MsT0FBTyxlQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRDtJQTdDRCx3QkE2Q0MifQ==