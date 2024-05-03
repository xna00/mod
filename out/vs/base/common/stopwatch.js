/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StopWatch = void 0;
    const hasPerformanceNow = (globalThis.performance && typeof globalThis.performance.now === 'function');
    class StopWatch {
        static create(highResolution) {
            return new StopWatch(highResolution);
        }
        constructor(highResolution) {
            this._now = hasPerformanceNow && highResolution === false ? Date.now : globalThis.performance.now.bind(globalThis.performance);
            this._startTime = this._now();
            this._stopTime = -1;
        }
        stop() {
            this._stopTime = this._now();
        }
        reset() {
            this._startTime = this._now();
            this._stopTime = -1;
        }
        elapsed() {
            if (this._stopTime !== -1) {
                return this._stopTime - this._startTime;
            }
            return this._now() - this._startTime;
        }
    }
    exports.StopWatch = StopWatch;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcHdhdGNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9zdG9wd2F0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxJQUFJLE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssVUFBVSxDQUFDLENBQUM7SUFFdkcsTUFBYSxTQUFTO1FBT2QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUF3QjtZQUM1QyxPQUFPLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxZQUFZLGNBQXdCO1lBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLElBQUksY0FBYyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFdBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoSSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFFTSxJQUFJO1lBQ1YsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUIsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFFTSxPQUFPO1lBQ2IsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3pDLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3RDLENBQUM7S0FDRDtJQWhDRCw4QkFnQ0MifQ==