/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, async_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActiveWindowManager = void 0;
    class ActiveWindowManager extends lifecycle_1.Disposable {
        constructor({ onDidOpenMainWindow, onDidFocusMainWindow, getActiveWindowId }) {
            super();
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            // remember last active window id upon events
            const onActiveWindowChange = event_1.Event.latch(event_1.Event.any(onDidOpenMainWindow, onDidFocusMainWindow));
            onActiveWindowChange(this.setActiveWindow, this, this.disposables);
            // resolve current active window
            this.firstActiveWindowIdPromise = (0, async_1.createCancelablePromise)(() => getActiveWindowId());
            (async () => {
                try {
                    const windowId = await this.firstActiveWindowIdPromise;
                    this.activeWindowId = (typeof this.activeWindowId === 'number') ? this.activeWindowId : windowId;
                }
                catch (error) {
                    // ignore
                }
                finally {
                    this.firstActiveWindowIdPromise = undefined;
                }
            })();
        }
        setActiveWindow(windowId) {
            if (this.firstActiveWindowIdPromise) {
                this.firstActiveWindowIdPromise.cancel();
                this.firstActiveWindowIdPromise = undefined;
            }
            this.activeWindowId = windowId;
        }
        async getActiveClientId() {
            const id = this.firstActiveWindowIdPromise ? (await this.firstActiveWindowIdPromise) : this.activeWindowId;
            return `window:${id}`;
        }
    }
    exports.ActiveWindowManager = ActiveWindowManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93VHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93cy9ub2RlL3dpbmRvd1RyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsbUJBQW9CLFNBQVEsc0JBQVU7UUFPbEQsWUFBWSxFQUFFLG1CQUFtQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUl6RTtZQUNBLEtBQUssRUFBRSxDQUFDO1lBVlEsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFZcEUsNkNBQTZDO1lBQzdDLE1BQU0sb0JBQW9CLEdBQUcsYUFBSyxDQUFDLEtBQUssQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUMvRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFbkUsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFBLCtCQUF1QixFQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztZQUNyRixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNYLElBQUksQ0FBQztvQkFDSixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQztvQkFDdkQsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLGNBQWMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUNsRyxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLFNBQVM7Z0JBQ1YsQ0FBQzt3QkFBUyxDQUFDO29CQUNWLElBQUksQ0FBQywwQkFBMEIsR0FBRyxTQUFTLENBQUM7Z0JBQzdDLENBQUM7WUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ04sQ0FBQztRQUVPLGVBQWUsQ0FBQyxRQUE0QjtZQUNuRCxJQUFJLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQywwQkFBMEIsR0FBRyxTQUFTLENBQUM7WUFDN0MsQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxLQUFLLENBQUMsaUJBQWlCO1lBQ3RCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBRTNHLE9BQU8sVUFBVSxFQUFFLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUE5Q0Qsa0RBOENDIn0=