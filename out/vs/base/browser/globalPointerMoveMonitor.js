/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, dom, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalPointerMoveMonitor = void 0;
    class GlobalPointerMoveMonitor {
        constructor() {
            this._hooks = new lifecycle_1.DisposableStore();
            this._pointerMoveCallback = null;
            this._onStopCallback = null;
        }
        dispose() {
            this.stopMonitoring(false);
            this._hooks.dispose();
        }
        stopMonitoring(invokeStopCallback, browserEvent) {
            if (!this.isMonitoring()) {
                // Not monitoring
                return;
            }
            // Unhook
            this._hooks.clear();
            this._pointerMoveCallback = null;
            const onStopCallback = this._onStopCallback;
            this._onStopCallback = null;
            if (invokeStopCallback && onStopCallback) {
                onStopCallback(browserEvent);
            }
        }
        isMonitoring() {
            return !!this._pointerMoveCallback;
        }
        startMonitoring(initialElement, pointerId, initialButtons, pointerMoveCallback, onStopCallback) {
            if (this.isMonitoring()) {
                this.stopMonitoring(false);
            }
            this._pointerMoveCallback = pointerMoveCallback;
            this._onStopCallback = onStopCallback;
            let eventSource = initialElement;
            try {
                initialElement.setPointerCapture(pointerId);
                this._hooks.add((0, lifecycle_1.toDisposable)(() => {
                    try {
                        initialElement.releasePointerCapture(pointerId);
                    }
                    catch (err) {
                        // See https://github.com/microsoft/vscode/issues/161731
                        //
                        // `releasePointerCapture` sometimes fails when being invoked with the exception:
                        //     DOMException: Failed to execute 'releasePointerCapture' on 'Element':
                        //     No active pointer with the given id is found.
                        //
                        // There's no need to do anything in case of failure
                    }
                }));
            }
            catch (err) {
                // See https://github.com/microsoft/vscode/issues/144584
                // See https://github.com/microsoft/vscode/issues/146947
                // `setPointerCapture` sometimes fails when being invoked
                // from a `mousedown` listener on macOS and Windows
                // and it always fails on Linux with the exception:
                //     DOMException: Failed to execute 'setPointerCapture' on 'Element':
                //     No active pointer with the given id is found.
                // In case of failure, we bind the listeners on the window
                eventSource = dom.getWindow(initialElement);
            }
            this._hooks.add(dom.addDisposableListener(eventSource, dom.EventType.POINTER_MOVE, (e) => {
                if (e.buttons !== initialButtons) {
                    // Buttons state has changed in the meantime
                    this.stopMonitoring(true);
                    return;
                }
                e.preventDefault();
                this._pointerMoveCallback(e);
            }));
            this._hooks.add(dom.addDisposableListener(eventSource, dom.EventType.POINTER_UP, (e) => this.stopMonitoring(true)));
        }
    }
    exports.GlobalPointerMoveMonitor = GlobalPointerMoveMonitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsUG9pbnRlck1vdmVNb25pdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvZ2xvYmFsUG9pbnRlck1vdmVNb25pdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLHdCQUF3QjtRQUFyQztZQUVrQixXQUFNLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDeEMseUJBQW9CLEdBQWdDLElBQUksQ0FBQztZQUN6RCxvQkFBZSxHQUEyQixJQUFJLENBQUM7UUEyRnhELENBQUM7UUF6Rk8sT0FBTztZQUNiLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRU0sY0FBYyxDQUFDLGtCQUEyQixFQUFFLFlBQTJDO1lBQzdGLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztnQkFDMUIsaUJBQWlCO2dCQUNqQixPQUFPO1lBQ1IsQ0FBQztZQUVELFNBQVM7WUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7WUFDakMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUM1QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUU1QixJQUFJLGtCQUFrQixJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUMxQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFTSxZQUFZO1lBQ2xCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNwQyxDQUFDO1FBRU0sZUFBZSxDQUNyQixjQUF1QixFQUN2QixTQUFpQixFQUNqQixjQUFzQixFQUN0QixtQkFBeUMsRUFDekMsY0FBK0I7WUFFL0IsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBQ0QsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO1lBQ2hELElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1lBRXRDLElBQUksV0FBVyxHQUFxQixjQUFjLENBQUM7WUFFbkQsSUFBSSxDQUFDO2dCQUNKLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtvQkFDakMsSUFBSSxDQUFDO3dCQUNKLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDakQsQ0FBQztvQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO3dCQUNkLHdEQUF3RDt3QkFDeEQsRUFBRTt3QkFDRixpRkFBaUY7d0JBQ2pGLDRFQUE0RTt3QkFDNUUsb0RBQW9EO3dCQUNwRCxFQUFFO3dCQUNGLG9EQUFvRDtvQkFDckQsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2Qsd0RBQXdEO2dCQUN4RCx3REFBd0Q7Z0JBQ3hELHlEQUF5RDtnQkFDekQsbURBQW1EO2dCQUNuRCxtREFBbUQ7Z0JBQ25ELHdFQUF3RTtnQkFDeEUsb0RBQW9EO2dCQUNwRCwwREFBMEQ7Z0JBQzFELFdBQVcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQ3hDLFdBQVcsRUFDWCxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksRUFDMUIsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDTCxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFLENBQUM7b0JBQ2xDLDRDQUE0QztvQkFDNUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDMUIsT0FBTztnQkFDUixDQUFDO2dCQUVELENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLG9CQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FDRCxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQ3hDLFdBQVcsRUFDWCxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFDeEIsQ0FBQyxDQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQzlDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQS9GRCw0REErRkMifQ==