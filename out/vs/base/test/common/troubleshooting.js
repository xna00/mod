/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beginTrackingDisposables = beginTrackingDisposables;
    exports.endTrackingDisposables = endTrackingDisposables;
    exports.beginLoggingFS = beginLoggingFS;
    exports.endLoggingFS = endLoggingFS;
    class DisposableTracker {
        constructor() {
            this.allDisposables = [];
        }
        trackDisposable(x) {
            this.allDisposables.push([x, new Error().stack]);
        }
        setParent(child, parent) {
            for (let idx = 0; idx < this.allDisposables.length; idx++) {
                if (this.allDisposables[idx][0] === child) {
                    this.allDisposables.splice(idx, 1);
                    return;
                }
            }
        }
        markAsDisposed(x) {
            for (let idx = 0; idx < this.allDisposables.length; idx++) {
                if (this.allDisposables[idx][0] === x) {
                    this.allDisposables.splice(idx, 1);
                    return;
                }
            }
        }
        markAsSingleton(disposable) {
            // noop
        }
    }
    let currentTracker = null;
    function beginTrackingDisposables() {
        currentTracker = new DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(currentTracker);
    }
    function endTrackingDisposables() {
        if (currentTracker) {
            (0, lifecycle_1.setDisposableTracker)(null);
            console.log(currentTracker.allDisposables.map(e => `${e[0]}\n${e[1]}`).join('\n\n'));
            currentTracker = null;
        }
    }
    function beginLoggingFS(withStacks = false) {
        self.beginLoggingFS?.(withStacks);
    }
    function endLoggingFS() {
        self.endLoggingFS?.();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJvdWJsZXNob290aW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL3Ryb3VibGVzaG9vdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdDaEcsNERBR0M7SUFFRCx3REFNQztJQUVELHdDQUVDO0lBRUQsb0NBRUM7SUEvQ0QsTUFBTSxpQkFBaUI7UUFBdkI7WUFDQyxtQkFBYyxHQUE0QixFQUFFLENBQUM7UUF1QjlDLENBQUM7UUF0QkEsZUFBZSxDQUFDLENBQWM7WUFDN0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQyxLQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxTQUFTLENBQUMsS0FBa0IsRUFBRSxNQUFtQjtZQUNoRCxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFDM0QsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUMzQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ25DLE9BQU87Z0JBQ1IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBQ0QsY0FBYyxDQUFDLENBQWM7WUFDNUIsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQzNELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELGVBQWUsQ0FBQyxVQUF1QjtZQUN0QyxPQUFPO1FBQ1IsQ0FBQztLQUNEO0lBRUQsSUFBSSxjQUFjLEdBQTZCLElBQUksQ0FBQztJQUVwRCxTQUFnQix3QkFBd0I7UUFDdkMsY0FBYyxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztRQUN6QyxJQUFBLGdDQUFvQixFQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxTQUFnQixzQkFBc0I7UUFDckMsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixJQUFBLGdDQUFvQixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDdkIsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixjQUFjLENBQUMsYUFBc0IsS0FBSztRQUNuRCxJQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQWdCLFlBQVk7UUFDckIsSUFBSyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7SUFDOUIsQ0FBQyJ9