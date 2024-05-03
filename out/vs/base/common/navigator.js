/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ArrayNavigator = void 0;
    class ArrayNavigator {
        constructor(items, start = 0, end = items.length, index = start - 1) {
            this.items = items;
            this.start = start;
            this.end = end;
            this.index = index;
        }
        current() {
            if (this.index === this.start - 1 || this.index === this.end) {
                return null;
            }
            return this.items[this.index];
        }
        next() {
            this.index = Math.min(this.index + 1, this.end);
            return this.current();
        }
        previous() {
            this.index = Math.max(this.index - 1, this.start - 1);
            return this.current();
        }
        first() {
            this.index = this.start;
            return this.current();
        }
        last() {
            this.index = this.end - 1;
            return this.current();
        }
    }
    exports.ArrayNavigator = ArrayNavigator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9uYXZpZ2F0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsY0FBYztRQUUxQixZQUNrQixLQUFtQixFQUMxQixRQUFnQixDQUFDLEVBQ2pCLE1BQWMsS0FBSyxDQUFDLE1BQU0sRUFDMUIsUUFBUSxLQUFLLEdBQUcsQ0FBQztZQUhWLFVBQUssR0FBTCxLQUFLLENBQWM7WUFDMUIsVUFBSyxHQUFMLEtBQUssQ0FBWTtZQUNqQixRQUFHLEdBQUgsR0FBRyxDQUF1QjtZQUMxQixVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ3hCLENBQUM7UUFFTCxPQUFPO1lBQ04sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM5RCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRCxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRUQsUUFBUTtZQUNQLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUFwQ0Qsd0NBb0NDIn0=