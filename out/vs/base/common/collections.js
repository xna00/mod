/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupBy = groupBy;
    exports.diffSets = diffSets;
    exports.diffMaps = diffMaps;
    exports.intersection = intersection;
    /**
     * Groups the collection into a dictionary based on the provided
     * group function.
     */
    function groupBy(data, groupFn) {
        const result = Object.create(null);
        for (const element of data) {
            const key = groupFn(element);
            let target = result[key];
            if (!target) {
                target = result[key] = [];
            }
            target.push(element);
        }
        return result;
    }
    function diffSets(before, after) {
        const removed = [];
        const added = [];
        for (const element of before) {
            if (!after.has(element)) {
                removed.push(element);
            }
        }
        for (const element of after) {
            if (!before.has(element)) {
                added.push(element);
            }
        }
        return { removed, added };
    }
    function diffMaps(before, after) {
        const removed = [];
        const added = [];
        for (const [index, value] of before) {
            if (!after.has(index)) {
                removed.push(value);
            }
        }
        for (const [index, value] of after) {
            if (!before.has(index)) {
                added.push(value);
            }
        }
        return { removed, added };
    }
    /**
     * Computes the intersection of two sets.
     *
     * @param setA - The first set.
     * @param setB - The second iterable.
     * @returns A new set containing the elements that are in both `setA` and `setB`.
     */
    function intersection(setA, setB) {
        const result = new Set();
        for (const elem of setB) {
            if (setA.has(elem)) {
                result.add(elem);
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2NvbGxlY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRywwQkFXQztJQUVELDRCQWNDO0lBRUQsNEJBY0M7SUFTRCxvQ0FRQztJQWhFRDs7O09BR0c7SUFDSCxTQUFnQixPQUFPLENBQXdDLElBQVMsRUFBRSxPQUEwQjtRQUNuRyxNQUFNLE1BQU0sR0FBbUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQzVCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxTQUFnQixRQUFRLENBQUksTUFBYyxFQUFFLEtBQWE7UUFDeEQsTUFBTSxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQztRQUN0QixLQUFLLE1BQU0sT0FBTyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFDRCxLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxTQUFnQixRQUFRLENBQU8sTUFBaUIsRUFBRSxLQUFnQjtRQUNqRSxNQUFNLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQVEsRUFBRSxDQUFDO1FBQ3RCLEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBQ0QsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxTQUFnQixZQUFZLENBQUksSUFBWSxFQUFFLElBQWlCO1FBQzlELE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7UUFDNUIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN6QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9