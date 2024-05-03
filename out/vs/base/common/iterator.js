/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Iterable = void 0;
    var Iterable;
    (function (Iterable) {
        function is(thing) {
            return thing && typeof thing === 'object' && typeof thing[Symbol.iterator] === 'function';
        }
        Iterable.is = is;
        const _empty = Object.freeze([]);
        function empty() {
            return _empty;
        }
        Iterable.empty = empty;
        function* single(element) {
            yield element;
        }
        Iterable.single = single;
        function wrap(iterableOrElement) {
            if (is(iterableOrElement)) {
                return iterableOrElement;
            }
            else {
                return single(iterableOrElement);
            }
        }
        Iterable.wrap = wrap;
        function from(iterable) {
            return iterable || _empty;
        }
        Iterable.from = from;
        function* reverse(array) {
            for (let i = array.length - 1; i >= 0; i--) {
                yield array[i];
            }
        }
        Iterable.reverse = reverse;
        function isEmpty(iterable) {
            return !iterable || iterable[Symbol.iterator]().next().done === true;
        }
        Iterable.isEmpty = isEmpty;
        function first(iterable) {
            return iterable[Symbol.iterator]().next().value;
        }
        Iterable.first = first;
        function some(iterable, predicate) {
            for (const element of iterable) {
                if (predicate(element)) {
                    return true;
                }
            }
            return false;
        }
        Iterable.some = some;
        function find(iterable, predicate) {
            for (const element of iterable) {
                if (predicate(element)) {
                    return element;
                }
            }
            return undefined;
        }
        Iterable.find = find;
        function* filter(iterable, predicate) {
            for (const element of iterable) {
                if (predicate(element)) {
                    yield element;
                }
            }
        }
        Iterable.filter = filter;
        function* map(iterable, fn) {
            let index = 0;
            for (const element of iterable) {
                yield fn(element, index++);
            }
        }
        Iterable.map = map;
        function* concat(...iterables) {
            for (const iterable of iterables) {
                yield* iterable;
            }
        }
        Iterable.concat = concat;
        function reduce(iterable, reducer, initialValue) {
            let value = initialValue;
            for (const element of iterable) {
                value = reducer(value, element);
            }
            return value;
        }
        Iterable.reduce = reduce;
        /**
         * Returns an iterable slice of the array, with the same semantics as `array.slice()`.
         */
        function* slice(arr, from, to = arr.length) {
            if (from < 0) {
                from += arr.length;
            }
            if (to < 0) {
                to += arr.length;
            }
            else if (to > arr.length) {
                to = arr.length;
            }
            for (; from < to; from++) {
                yield arr[from];
            }
        }
        Iterable.slice = slice;
        /**
         * Consumes `atMost` elements from iterable and returns the consumed elements,
         * and an iterable for the rest of the elements.
         */
        function consume(iterable, atMost = Number.POSITIVE_INFINITY) {
            const consumed = [];
            if (atMost === 0) {
                return [consumed, iterable];
            }
            const iterator = iterable[Symbol.iterator]();
            for (let i = 0; i < atMost; i++) {
                const next = iterator.next();
                if (next.done) {
                    return [consumed, Iterable.empty()];
                }
                consumed.push(next.value);
            }
            return [consumed, { [Symbol.iterator]() { return iterator; } }];
        }
        Iterable.consume = consume;
        async function asyncToArray(iterable) {
            const result = [];
            for await (const item of iterable) {
                result.push(item);
            }
            return Promise.resolve(result);
        }
        Iterable.asyncToArray = asyncToArray;
    })(Iterable || (exports.Iterable = Iterable = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2l0ZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRyxJQUFpQixRQUFRLENBaUp4QjtJQWpKRCxXQUFpQixRQUFRO1FBRXhCLFNBQWdCLEVBQUUsQ0FBVSxLQUFVO1lBQ3JDLE9BQU8sS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssVUFBVSxDQUFDO1FBQzNGLENBQUM7UUFGZSxXQUFFLEtBRWpCLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBa0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoRCxTQUFnQixLQUFLO1lBQ3BCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUZlLGNBQUssUUFFcEIsQ0FBQTtRQUVELFFBQWUsQ0FBQyxDQUFDLE1BQU0sQ0FBSSxPQUFVO1lBQ3BDLE1BQU0sT0FBTyxDQUFDO1FBQ2YsQ0FBQztRQUZnQixlQUFNLFNBRXRCLENBQUE7UUFFRCxTQUFnQixJQUFJLENBQUksaUJBQWtDO1lBQ3pELElBQUksRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxpQkFBaUIsQ0FBQztZQUMxQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0YsQ0FBQztRQU5lLGFBQUksT0FNbkIsQ0FBQTtRQUVELFNBQWdCLElBQUksQ0FBSSxRQUF3QztZQUMvRCxPQUFPLFFBQVEsSUFBSSxNQUFNLENBQUM7UUFDM0IsQ0FBQztRQUZlLGFBQUksT0FFbkIsQ0FBQTtRQUVELFFBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBSSxLQUFlO1lBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztRQUpnQixnQkFBTyxVQUl2QixDQUFBO1FBRUQsU0FBZ0IsT0FBTyxDQUFJLFFBQXdDO1lBQ2xFLE9BQU8sQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUM7UUFDdEUsQ0FBQztRQUZlLGdCQUFPLFVBRXRCLENBQUE7UUFFRCxTQUFnQixLQUFLLENBQUksUUFBcUI7WUFDN0MsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2pELENBQUM7UUFGZSxjQUFLLFFBRXBCLENBQUE7UUFFRCxTQUFnQixJQUFJLENBQUksUUFBcUIsRUFBRSxTQUE0QjtZQUMxRSxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN4QixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQVBlLGFBQUksT0FPbkIsQ0FBQTtRQUlELFNBQWdCLElBQUksQ0FBSSxRQUFxQixFQUFFLFNBQTRCO1lBQzFFLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sT0FBTyxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFSZSxhQUFJLE9BUW5CLENBQUE7UUFJRCxRQUFlLENBQUMsQ0FBQyxNQUFNLENBQUksUUFBcUIsRUFBRSxTQUE0QjtZQUM3RSxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN4QixNQUFNLE9BQU8sQ0FBQztnQkFDZixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFOZ0IsZUFBTSxTQU10QixDQUFBO1FBRUQsUUFBZSxDQUFDLENBQUMsR0FBRyxDQUFPLFFBQXFCLEVBQUUsRUFBOEI7WUFDL0UsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFMZ0IsWUFBRyxNQUtuQixDQUFBO1FBRUQsUUFBZSxDQUFDLENBQUMsTUFBTSxDQUFJLEdBQUcsU0FBd0I7WUFDckQsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ2pCLENBQUM7UUFDRixDQUFDO1FBSmdCLGVBQU0sU0FJdEIsQ0FBQTtRQUVELFNBQWdCLE1BQU0sQ0FBTyxRQUFxQixFQUFFLE9BQWlELEVBQUUsWUFBZTtZQUNySCxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUM7WUFDekIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQU5lLGVBQU0sU0FNckIsQ0FBQTtRQUVEOztXQUVHO1FBQ0gsUUFBZSxDQUFDLENBQUMsS0FBSyxDQUFJLEdBQXFCLEVBQUUsSUFBWSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTTtZQUM3RSxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDZCxJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUNwQixDQUFDO1lBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ1osRUFBRSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQztpQkFBTSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQ2pCLENBQUM7WUFFRCxPQUFPLElBQUksR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNGLENBQUM7UUFkZ0IsY0FBSyxRQWNyQixDQUFBO1FBRUQ7OztXQUdHO1FBQ0gsU0FBZ0IsT0FBTyxDQUFJLFFBQXFCLEVBQUUsU0FBaUIsTUFBTSxDQUFDLGlCQUFpQjtZQUMxRixNQUFNLFFBQVEsR0FBUSxFQUFFLENBQUM7WUFFekIsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUU3QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFN0IsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2YsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDckMsQ0FBQztnQkFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixDQUFDO1lBRUQsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBcEJlLGdCQUFPLFVBb0J0QixDQUFBO1FBRU0sS0FBSyxVQUFVLFlBQVksQ0FBSSxRQUEwQjtZQUMvRCxNQUFNLE1BQU0sR0FBUSxFQUFFLENBQUM7WUFDdkIsSUFBSSxLQUFLLEVBQUUsTUFBTSxJQUFJLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkIsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBTnFCLHFCQUFZLGVBTWpDLENBQUE7SUFDRixDQUFDLEVBakpnQixRQUFRLHdCQUFSLFFBQVEsUUFpSnhCIn0=