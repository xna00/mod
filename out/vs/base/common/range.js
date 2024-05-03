/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Range = void 0;
    var Range;
    (function (Range) {
        /**
         * Returns the intersection between two ranges as a range itself.
         * Returns `{ start: 0, end: 0 }` if the intersection is empty.
         */
        function intersect(one, other) {
            if (one.start >= other.end || other.start >= one.end) {
                return { start: 0, end: 0 };
            }
            const start = Math.max(one.start, other.start);
            const end = Math.min(one.end, other.end);
            if (end - start <= 0) {
                return { start: 0, end: 0 };
            }
            return { start, end };
        }
        Range.intersect = intersect;
        function isEmpty(range) {
            return range.end - range.start <= 0;
        }
        Range.isEmpty = isEmpty;
        function intersects(one, other) {
            return !isEmpty(intersect(one, other));
        }
        Range.intersects = intersects;
        function relativeComplement(one, other) {
            const result = [];
            const first = { start: one.start, end: Math.min(other.start, one.end) };
            const second = { start: Math.max(other.end, one.start), end: one.end };
            if (!isEmpty(first)) {
                result.push(first);
            }
            if (!isEmpty(second)) {
                result.push(second);
            }
            return result;
        }
        Range.relativeComplement = relativeComplement;
    })(Range || (exports.Range = Range = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3JhbmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxJQUFpQixLQUFLLENBNENyQjtJQTVDRCxXQUFpQixLQUFLO1FBRXJCOzs7V0FHRztRQUNILFNBQWdCLFNBQVMsQ0FBQyxHQUFXLEVBQUUsS0FBYTtZQUNuRCxJQUFJLEdBQUcsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFekMsSUFBSSxHQUFHLEdBQUcsS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDN0IsQ0FBQztZQUVELE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQWJlLGVBQVMsWUFheEIsQ0FBQTtRQUVELFNBQWdCLE9BQU8sQ0FBQyxLQUFhO1lBQ3BDLE9BQU8sS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRmUsYUFBTyxVQUV0QixDQUFBO1FBRUQsU0FBZ0IsVUFBVSxDQUFDLEdBQVcsRUFBRSxLQUFhO1lBQ3BELE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFGZSxnQkFBVSxhQUV6QixDQUFBO1FBRUQsU0FBZ0Isa0JBQWtCLENBQUMsR0FBVyxFQUFFLEtBQWE7WUFDNUQsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLE1BQU0sS0FBSyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN4RSxNQUFNLE1BQU0sR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFdkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQWRlLHdCQUFrQixxQkFjakMsQ0FBQTtJQUNGLENBQUMsRUE1Q2dCLEtBQUsscUJBQUwsS0FBSyxRQTRDckIifQ==