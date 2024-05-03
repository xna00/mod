/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/history", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/instantiation/common/instantiation"], function (require, exports, history_1, lifecycle_1, map_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveHistoryService = exports.IInteractiveHistoryService = void 0;
    exports.IInteractiveHistoryService = (0, instantiation_1.createDecorator)('IInteractiveHistoryService');
    class InteractiveHistoryService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._history = new map_1.ResourceMap();
        }
        addToHistory(uri, value) {
            if (!this._history.has(uri)) {
                this._history.set(uri, new history_1.HistoryNavigator2([value], 50));
                return;
            }
            const history = this._history.get(uri);
            history.resetCursor();
            if (history?.current() !== value) {
                history?.add(value);
            }
        }
        getPreviousValue(uri) {
            const history = this._history.get(uri);
            return history?.previous() ?? null;
        }
        getNextValue(uri) {
            const history = this._history.get(uri);
            return history?.next() ?? null;
        }
        replaceLast(uri, value) {
            if (!this._history.has(uri)) {
                this._history.set(uri, new history_1.HistoryNavigator2([value], 50));
                return;
            }
            else {
                const history = this._history.get(uri);
                if (history?.current() !== value) {
                    history?.replaceLast(value);
                }
            }
        }
        clearHistory(uri) {
            this._history.delete(uri);
        }
        has(uri) {
            return this._history.has(uri) ? true : false;
        }
    }
    exports.InteractiveHistoryService = InteractiveHistoryService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVIaXN0b3J5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW50ZXJhY3RpdmUvYnJvd3Nlci9pbnRlcmFjdGl2ZUhpc3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFuRixRQUFBLDBCQUEwQixHQUFHLElBQUEsK0JBQWUsRUFBNkIsNEJBQTRCLENBQUMsQ0FBQztJQWFwSCxNQUFhLHlCQUEwQixTQUFRLHNCQUFVO1FBSXhEO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQVcsRUFBNkIsQ0FBQztRQUM5RCxDQUFDO1FBRUQsWUFBWSxDQUFDLEdBQVEsRUFBRSxLQUFhO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSwyQkFBaUIsQ0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUM7WUFFeEMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RCLElBQUksT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBQ0QsZ0JBQWdCLENBQUMsR0FBUTtZQUN4QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxPQUFPLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUM7UUFDcEMsQ0FBQztRQUVELFlBQVksQ0FBQyxHQUFRO1lBQ3BCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXZDLE9BQU8sT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQztRQUNoQyxDQUFDO1FBRUQsV0FBVyxDQUFDLEdBQVEsRUFBRSxLQUFhO1lBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSwyQkFBaUIsQ0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE9BQU87WUFDUixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUNsQyxPQUFPLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixDQUFDO1lBQ0YsQ0FBQztRQUVGLENBQUM7UUFFRCxZQUFZLENBQUMsR0FBUTtZQUNwQixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsR0FBRyxDQUFDLEdBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUM5QyxDQUFDO0tBRUQ7SUF2REQsOERBdURDIn0=