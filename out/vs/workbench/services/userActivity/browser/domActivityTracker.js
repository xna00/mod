/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom, window_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DomActivityTracker = void 0;
    /**
     * This uses a time interval and checks whether there's any activity in that
     * interval. A naive approach might be to use a debounce whenever an event
     * happens, but this has some scheduling overhead. Instead, the tracker counts
     * how many intervals have elapsed since any activity happened.
     *
     * If there's more than `MIN_INTERVALS_WITHOUT_ACTIVITY`, then say the user is
     * inactive. Therefore the maximum time before an inactive user is detected
     * is `CHECK_INTERVAL * (MIN_INTERVALS_WITHOUT_ACTIVITY + 1)`.
     */
    const CHECK_INTERVAL = 30_000;
    /** See {@link CHECK_INTERVAL} */
    const MIN_INTERVALS_WITHOUT_ACTIVITY = 2;
    const eventListenerOptions = {
        passive: true, /** does not preventDefault() */
        capture: true, /** should dispatch first (before anyone stopPropagation()) */
    };
    class DomActivityTracker extends lifecycle_1.Disposable {
        constructor(userActivityService) {
            super();
            let intervalsWithoutActivity = MIN_INTERVALS_WITHOUT_ACTIVITY;
            const intervalTimer = this._register(new dom.WindowIntervalTimer());
            const activeMutex = this._register(new lifecycle_1.MutableDisposable());
            activeMutex.value = userActivityService.markActive();
            const onInterval = () => {
                if (++intervalsWithoutActivity === MIN_INTERVALS_WITHOUT_ACTIVITY) {
                    activeMutex.clear();
                    intervalTimer.cancel();
                }
            };
            const onActivity = (targetWindow) => {
                // if was inactive, they've now returned
                if (intervalsWithoutActivity === MIN_INTERVALS_WITHOUT_ACTIVITY) {
                    activeMutex.value = userActivityService.markActive();
                    intervalTimer.cancelAndSet(onInterval, CHECK_INTERVAL, targetWindow);
                }
                intervalsWithoutActivity = 0;
            };
            this._register(event_1.Event.runAndSubscribe(dom.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add(dom.addDisposableListener(window.document, 'touchstart', () => onActivity(window), eventListenerOptions));
                disposables.add(dom.addDisposableListener(window.document, 'mousedown', () => onActivity(window), eventListenerOptions));
                disposables.add(dom.addDisposableListener(window.document, 'keydown', () => onActivity(window), eventListenerOptions));
            }, { window: window_1.mainWindow, disposables: this._store }));
            onActivity(window_1.mainWindow);
        }
    }
    exports.DomActivityTracker = DomActivityTracker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tQWN0aXZpdHlUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdXNlckFjdGl2aXR5L2Jyb3dzZXIvZG9tQWN0aXZpdHlUcmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRzs7Ozs7Ozs7O09BU0c7SUFDSCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUM7SUFFOUIsaUNBQWlDO0lBQ2pDLE1BQU0sOEJBQThCLEdBQUcsQ0FBQyxDQUFDO0lBRXpDLE1BQU0sb0JBQW9CLEdBQTRCO1FBQ3JELE9BQU8sRUFBRSxJQUFJLEVBQUUsZ0NBQWdDO1FBQy9DLE9BQU8sRUFBRSxJQUFJLEVBQUUsOERBQThEO0tBQzdFLENBQUM7SUFFRixNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBQ2pELFlBQVksbUJBQXlDO1lBQ3BELEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSx3QkFBd0IsR0FBRyw4QkFBOEIsQ0FBQztZQUM5RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztZQUNwRSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQzVELFdBQVcsQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFckQsTUFBTSxVQUFVLEdBQUcsR0FBRyxFQUFFO2dCQUN2QixJQUFJLEVBQUUsd0JBQXdCLEtBQUssOEJBQThCLEVBQUUsQ0FBQztvQkFDbkUsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNwQixhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixNQUFNLFVBQVUsR0FBRyxDQUFDLFlBQXdDLEVBQUUsRUFBRTtnQkFDL0Qsd0NBQXdDO2dCQUN4QyxJQUFJLHdCQUF3QixLQUFLLDhCQUE4QixFQUFFLENBQUM7b0JBQ2pFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JELGFBQWEsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztnQkFFRCx3QkFBd0IsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDO1lBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7Z0JBQ3pGLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzFILFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pILFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDeEgsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLG1CQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEQsVUFBVSxDQUFDLG1CQUFVLENBQUMsQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUFsQ0QsZ0RBa0NDIn0=