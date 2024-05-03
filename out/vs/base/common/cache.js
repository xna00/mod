/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation"], function (require, exports, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedFunction = exports.LRUCachedFunction = exports.Cache = void 0;
    class Cache {
        constructor(task) {
            this.task = task;
            this.result = null;
        }
        get() {
            if (this.result) {
                return this.result;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const promise = this.task(cts.token);
            this.result = {
                promise,
                dispose: () => {
                    this.result = null;
                    cts.cancel();
                    cts.dispose();
                }
            };
            return this.result;
        }
    }
    exports.Cache = Cache;
    /**
     * Uses a LRU cache to make a given parametrized function cached.
     * Caches just the last value.
    */
    class LRUCachedFunction {
        constructor(fn, _computeKey = JSON.stringify) {
            this.fn = fn;
            this._computeKey = _computeKey;
            this.lastCache = undefined;
            this.lastArgKey = undefined;
        }
        get(arg) {
            const key = this._computeKey(arg);
            if (this.lastArgKey !== key) {
                this.lastArgKey = key;
                this.lastCache = this.fn(arg);
            }
            return this.lastCache;
        }
    }
    exports.LRUCachedFunction = LRUCachedFunction;
    /**
     * Uses an unbounded cache (referential equality) to memoize the results of the given function.
    */
    class CachedFunction {
        get cachedValues() {
            return this._map;
        }
        constructor(fn) {
            this.fn = fn;
            this._map = new Map();
        }
        get(arg) {
            if (this._map.has(arg)) {
                return this._map.get(arg);
            }
            const value = this.fn(arg);
            this._map.set(arg, value);
            return value;
        }
    }
    exports.CachedFunction = CachedFunction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLEtBQUs7UUFHakIsWUFBb0IsSUFBMkM7WUFBM0MsU0FBSSxHQUFKLElBQUksQ0FBdUM7WUFEdkQsV0FBTSxHQUEwQixJQUFJLENBQUM7UUFDc0IsQ0FBQztRQUVwRSxHQUFHO1lBQ0YsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNwQixDQUFDO1lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1lBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXJDLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ2IsT0FBTztnQkFDUCxPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO29CQUNuQixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2IsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLENBQUM7YUFDRCxDQUFDO1lBRUYsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7S0FDRDtJQXhCRCxzQkF3QkM7SUFFRDs7O01BR0U7SUFDRixNQUFhLGlCQUFpQjtRQUk3QixZQUNrQixFQUE0QixFQUM1QixjQUFzQyxJQUFJLENBQUMsU0FBUztZQURwRCxPQUFFLEdBQUYsRUFBRSxDQUEwQjtZQUM1QixnQkFBVyxHQUFYLFdBQVcsQ0FBeUM7WUFMOUQsY0FBUyxHQUEwQixTQUFTLENBQUM7WUFDN0MsZUFBVSxHQUF3QixTQUFTLENBQUM7UUFNcEQsQ0FBQztRQUVNLEdBQUcsQ0FBQyxHQUFTO1lBQ25CLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxTQUFVLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBbEJELDhDQWtCQztJQUVEOztNQUVFO0lBQ0YsTUFBYSxjQUFjO1FBRTFCLElBQVcsWUFBWTtZQUN0QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVELFlBQTZCLEVBQXlCO1lBQXpCLE9BQUUsR0FBRixFQUFFLENBQXVCO1lBTHJDLFNBQUksR0FBRyxJQUFJLEdBQUcsRUFBZ0IsQ0FBQztRQUtVLENBQUM7UUFFcEQsR0FBRyxDQUFDLEdBQVM7WUFDbkIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN4QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBQzVCLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FDRDtJQWhCRCx3Q0FnQkMifQ==