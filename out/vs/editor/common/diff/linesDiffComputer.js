/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MovedText = exports.LinesDiff = void 0;
    class LinesDiff {
        constructor(changes, 
        /**
         * Sorted by original line ranges.
         * The original line ranges and the modified line ranges must be disjoint (but can be touching).
         */
        moves, 
        /**
         * Indicates if the time out was reached.
         * In that case, the diffs might be an approximation and the user should be asked to rerun the diff with more time.
         */
        hitTimeout) {
            this.changes = changes;
            this.moves = moves;
            this.hitTimeout = hitTimeout;
        }
    }
    exports.LinesDiff = LinesDiff;
    class MovedText {
        constructor(lineRangeMapping, changes) {
            this.lineRangeMapping = lineRangeMapping;
            this.changes = changes;
        }
        flip() {
            return new MovedText(this.lineRangeMapping.flip(), this.changes.map(c => c.flip()));
        }
    }
    exports.MovedText = MovedText;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNEaWZmQ29tcHV0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9saW5lc0RpZmZDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxTQUFTO1FBQ3JCLFlBQ1UsT0FBNEM7UUFFckQ7OztXQUdHO1FBQ00sS0FBMkI7UUFFcEM7OztXQUdHO1FBQ00sVUFBbUI7WUFabkIsWUFBTyxHQUFQLE9BQU8sQ0FBcUM7WUFNNUMsVUFBSyxHQUFMLEtBQUssQ0FBc0I7WUFNM0IsZUFBVSxHQUFWLFVBQVUsQ0FBUztRQUU3QixDQUFDO0tBQ0Q7SUFqQkQsOEJBaUJDO0lBRUQsTUFBYSxTQUFTO1FBVXJCLFlBQ0MsZ0JBQWtDLEVBQ2xDLE9BQTRDO1lBRTVDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztZQUN6QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBRU0sSUFBSTtZQUNWLE9BQU8sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDO0tBQ0Q7SUFyQkQsOEJBcUJDIn0=