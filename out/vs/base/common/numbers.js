/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlidingWindowAverage = exports.MovingAverage = exports.Counter = void 0;
    exports.clamp = clamp;
    exports.rot = rot;
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    function rot(index, modulo) {
        return (modulo + (index % modulo)) % modulo;
    }
    class Counter {
        constructor() {
            this._next = 0;
        }
        getNext() {
            return this._next++;
        }
    }
    exports.Counter = Counter;
    class MovingAverage {
        constructor() {
            this._n = 1;
            this._val = 0;
        }
        update(value) {
            this._val = this._val + (value - this._val) / this._n;
            this._n += 1;
            return this._val;
        }
        get value() {
            return this._val;
        }
    }
    exports.MovingAverage = MovingAverage;
    class SlidingWindowAverage {
        constructor(size) {
            this._n = 0;
            this._val = 0;
            this._values = [];
            this._index = 0;
            this._sum = 0;
            this._values = new Array(size);
            this._values.fill(0, 0, size);
        }
        update(value) {
            const oldValue = this._values[this._index];
            this._values[this._index] = value;
            this._index = (this._index + 1) % this._values.length;
            this._sum -= oldValue;
            this._sum += value;
            if (this._n < this._values.length) {
                this._n += 1;
            }
            this._val = this._sum / this._n;
            return this._val;
        }
        get value() {
            return this._val;
        }
    }
    exports.SlidingWindowAverage = SlidingWindowAverage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbnVtYmVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsc0JBRUM7SUFFRCxrQkFFQztJQU5ELFNBQWdCLEtBQUssQ0FBQyxLQUFhLEVBQUUsR0FBVyxFQUFFLEdBQVc7UUFDNUQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxTQUFnQixHQUFHLENBQUMsS0FBYSxFQUFFLE1BQWM7UUFDaEQsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztJQUM3QyxDQUFDO0lBRUQsTUFBYSxPQUFPO1FBQXBCO1lBQ1MsVUFBSyxHQUFHLENBQUMsQ0FBQztRQUtuQixDQUFDO1FBSEEsT0FBTztZQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUM7S0FDRDtJQU5ELDBCQU1DO0lBRUQsTUFBYSxhQUFhO1FBQTFCO1lBRVMsT0FBRSxHQUFHLENBQUMsQ0FBQztZQUNQLFNBQUksR0FBRyxDQUFDLENBQUM7UUFXbEIsQ0FBQztRQVRBLE1BQU0sQ0FBQyxLQUFhO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQWRELHNDQWNDO0lBRUQsTUFBYSxvQkFBb0I7UUFTaEMsWUFBWSxJQUFZO1lBUGhCLE9BQUUsR0FBVyxDQUFDLENBQUM7WUFDZixTQUFJLEdBQUcsQ0FBQyxDQUFDO1lBRUEsWUFBTyxHQUFhLEVBQUUsQ0FBQztZQUNoQyxXQUFNLEdBQVcsQ0FBQyxDQUFDO1lBQ25CLFNBQUksR0FBRyxDQUFDLENBQUM7WUFHaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBYTtZQUNuQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFdEQsSUFBSSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUM7WUFDdEIsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7WUFFbkIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQWpDRCxvREFpQ0MifQ==