/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, DOM, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewWindowDragMonitor = void 0;
    /**
     * Allows webviews to monitor when an element in the VS Code editor is being dragged/dropped.
     *
     * This is required since webview end up eating the drag event. VS Code needs to see this
     * event so it can handle editor element drag drop.
     */
    class WebviewWindowDragMonitor extends lifecycle_1.Disposable {
        constructor(targetWindow, getWebview) {
            super();
            this._register(DOM.addDisposableListener(targetWindow, DOM.EventType.DRAG_START, () => {
                getWebview()?.windowDidDragStart();
            }));
            const onDragEnd = () => {
                getWebview()?.windowDidDragEnd();
            };
            this._register(DOM.addDisposableListener(targetWindow, DOM.EventType.DRAG_END, onDragEnd));
            this._register(DOM.addDisposableListener(targetWindow, DOM.EventType.MOUSE_MOVE, currentEvent => {
                if (currentEvent.buttons === 0) {
                    onDragEnd();
                }
            }));
        }
    }
    exports.WebviewWindowDragMonitor = WebviewWindowDragMonitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1dpbmRvd0RyYWdNb25pdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2Jyb3dzZXIvd2Vidmlld1dpbmRvd0RyYWdNb25pdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRzs7Ozs7T0FLRztJQUNILE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFDdkQsWUFBWSxZQUF3QixFQUFFLFVBQXNDO1lBQzNFLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDckYsVUFBVSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO2dCQUN0QixVQUFVLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2xDLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsRUFBRTtnQkFDL0YsSUFBSSxZQUFZLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNoQyxTQUFTLEVBQUUsQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRDtJQW5CRCw0REFtQkMifQ==