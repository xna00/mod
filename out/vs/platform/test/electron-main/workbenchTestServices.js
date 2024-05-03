/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event"], function (require, exports, async_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryTestStateMainService = exports.TestLifecycleMainService = void 0;
    class TestLifecycleMainService {
        constructor() {
            this.onBeforeShutdown = event_1.Event.None;
            this._onWillShutdown = new event_1.Emitter();
            this.onWillShutdown = this._onWillShutdown.event;
            this.onWillLoadWindow = event_1.Event.None;
            this.onBeforeCloseWindow = event_1.Event.None;
            this.wasRestarted = false;
            this.quitRequested = false;
            this.phase = 2 /* LifecycleMainPhase.Ready */;
        }
        async fireOnWillShutdown() {
            const joiners = [];
            this._onWillShutdown.fire({
                reason: 1 /* ShutdownReason.QUIT */,
                join(id, promise) {
                    joiners.push(promise);
                }
            });
            await async_1.Promises.settled(joiners);
        }
        registerWindow(window) { }
        registerAuxWindow(auxWindow) { }
        async reload(window, cli) { }
        async unload(window, reason) { return true; }
        setRelaunchHandler(handler) { }
        async relaunch(options) { }
        async quit(willRestart) { return true; }
        async kill(code) { }
        async when(phase) { }
    }
    exports.TestLifecycleMainService = TestLifecycleMainService;
    class InMemoryTestStateMainService {
        constructor() {
            this.data = new Map();
        }
        setItem(key, data) {
            this.data.set(key, data);
        }
        setItems(items) {
            for (const { key, data } of items) {
                this.data.set(key, data);
            }
        }
        getItem(key) {
            return this.data.get(key);
        }
        removeItem(key) {
            this.data.delete(key);
        }
        async close() { }
    }
    exports.InMemoryTestStateMainService = InMemoryTestStateMainService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXN0L2VsZWN0cm9uLW1haW4vd29ya2JlbmNoVGVzdFNlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLHdCQUF3QjtRQUFyQztZQUlDLHFCQUFnQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFYixvQkFBZSxHQUFHLElBQUksZUFBTyxFQUFpQixDQUFDO1lBQ3ZELG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFlckQscUJBQWdCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUM5Qix3QkFBbUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBRWpDLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1lBRXRCLFVBQUssb0NBQTRCO1FBV2xDLENBQUM7UUE5QkEsS0FBSyxDQUFDLGtCQUFrQjtZQUN2QixNQUFNLE9BQU8sR0FBb0IsRUFBRSxDQUFDO1lBRXBDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO2dCQUN6QixNQUFNLDZCQUFxQjtnQkFDM0IsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPO29CQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7YUFDRCxDQUFDLENBQUM7WUFFSCxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFVRCxjQUFjLENBQUMsTUFBbUIsSUFBVSxDQUFDO1FBQzdDLGlCQUFpQixDQUFDLFNBQTJCLElBQVUsQ0FBQztRQUN4RCxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQW1CLEVBQUUsR0FBc0IsSUFBbUIsQ0FBQztRQUM1RSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQW1CLEVBQUUsTUFBb0IsSUFBc0IsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzFGLGtCQUFrQixDQUFDLE9BQXlCLElBQVUsQ0FBQztRQUN2RCxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQStFLElBQW1CLENBQUM7UUFDbEgsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFxQixJQUFzQixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFhLElBQW1CLENBQUM7UUFDNUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUF5QixJQUFtQixDQUFDO0tBQ3hEO0lBdkNELDREQXVDQztJQUVELE1BQWEsNEJBQTRCO1FBQXpDO1lBSWtCLFNBQUksR0FBRyxJQUFJLEdBQUcsRUFBaUUsQ0FBQztRQXFCbEcsQ0FBQztRQW5CQSxPQUFPLENBQUMsR0FBVyxFQUFFLElBQTREO1lBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQStGO1lBQ3ZHLEtBQUssTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxDQUFJLEdBQVc7WUFDckIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQWtCLENBQUM7UUFDNUMsQ0FBQztRQUVELFVBQVUsQ0FBQyxHQUFXO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxLQUFvQixDQUFDO0tBQ2hDO0lBekJELG9FQXlCQyJ9