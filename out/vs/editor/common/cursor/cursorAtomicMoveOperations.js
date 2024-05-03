/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/cursorColumns"], function (require, exports, cursorColumns_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AtomicTabMoveOperations = exports.Direction = void 0;
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Nearest"] = 2] = "Nearest";
    })(Direction || (exports.Direction = Direction = {}));
    class AtomicTabMoveOperations {
        /**
         * Get the visible column at the position. If we get to a non-whitespace character first
         * or past the end of string then return -1.
         *
         * **Note** `position` and the return value are 0-based.
         */
        static whitespaceVisibleColumn(lineContent, position, tabSize) {
            const lineLength = lineContent.length;
            let visibleColumn = 0;
            let prevTabStopPosition = -1;
            let prevTabStopVisibleColumn = -1;
            for (let i = 0; i < lineLength; i++) {
                if (i === position) {
                    return [prevTabStopPosition, prevTabStopVisibleColumn, visibleColumn];
                }
                if (visibleColumn % tabSize === 0) {
                    prevTabStopPosition = i;
                    prevTabStopVisibleColumn = visibleColumn;
                }
                const chCode = lineContent.charCodeAt(i);
                switch (chCode) {
                    case 32 /* CharCode.Space */:
                        visibleColumn += 1;
                        break;
                    case 9 /* CharCode.Tab */:
                        // Skip to the next multiple of tabSize.
                        visibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
                        break;
                    default:
                        return [-1, -1, -1];
                }
            }
            if (position === lineLength) {
                return [prevTabStopPosition, prevTabStopVisibleColumn, visibleColumn];
            }
            return [-1, -1, -1];
        }
        /**
         * Return the position that should result from a move left, right or to the
         * nearest tab, if atomic tabs are enabled. Left and right are used for the
         * arrow key movements, nearest is used for mouse selection. It returns
         * -1 if atomic tabs are not relevant and you should fall back to normal
         * behaviour.
         *
         * **Note**: `position` and the return value are 0-based.
         */
        static atomicPosition(lineContent, position, tabSize, direction) {
            const lineLength = lineContent.length;
            // Get the 0-based visible column corresponding to the position, or return
            // -1 if it is not in the initial whitespace.
            const [prevTabStopPosition, prevTabStopVisibleColumn, visibleColumn] = AtomicTabMoveOperations.whitespaceVisibleColumn(lineContent, position, tabSize);
            if (visibleColumn === -1) {
                return -1;
            }
            // Is the output left or right of the current position. The case for nearest
            // where it is the same as the current position is handled in the switch.
            let left;
            switch (direction) {
                case 0 /* Direction.Left */:
                    left = true;
                    break;
                case 1 /* Direction.Right */:
                    left = false;
                    break;
                case 2 /* Direction.Nearest */:
                    // The code below assumes the output position is either left or right
                    // of the input position. If it is the same, return immediately.
                    if (visibleColumn % tabSize === 0) {
                        return position;
                    }
                    // Go to the nearest indentation.
                    left = visibleColumn % tabSize <= (tabSize / 2);
                    break;
            }
            // If going left, we can just use the info about the last tab stop position and
            // last tab stop visible column that we computed in the first walk over the whitespace.
            if (left) {
                if (prevTabStopPosition === -1) {
                    return -1;
                }
                // If the direction is left, we need to keep scanning right to ensure
                // that targetVisibleColumn + tabSize is before non-whitespace.
                // This is so that when we press left at the end of a partial
                // indentation it only goes one character. For example '      foo' with
                // tabSize 4, should jump from position 6 to position 5, not 4.
                let currentVisibleColumn = prevTabStopVisibleColumn;
                for (let i = prevTabStopPosition; i < lineLength; ++i) {
                    if (currentVisibleColumn === prevTabStopVisibleColumn + tabSize) {
                        // It is a full indentation.
                        return prevTabStopPosition;
                    }
                    const chCode = lineContent.charCodeAt(i);
                    switch (chCode) {
                        case 32 /* CharCode.Space */:
                            currentVisibleColumn += 1;
                            break;
                        case 9 /* CharCode.Tab */:
                            currentVisibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(currentVisibleColumn, tabSize);
                            break;
                        default:
                            return -1;
                    }
                }
                if (currentVisibleColumn === prevTabStopVisibleColumn + tabSize) {
                    return prevTabStopPosition;
                }
                // It must have been a partial indentation.
                return -1;
            }
            // We are going right.
            const targetVisibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
            // We can just continue from where whitespaceVisibleColumn got to.
            let currentVisibleColumn = visibleColumn;
            for (let i = position; i < lineLength; i++) {
                if (currentVisibleColumn === targetVisibleColumn) {
                    return i;
                }
                const chCode = lineContent.charCodeAt(i);
                switch (chCode) {
                    case 32 /* CharCode.Space */:
                        currentVisibleColumn += 1;
                        break;
                    case 9 /* CharCode.Tab */:
                        currentVisibleColumn = cursorColumns_1.CursorColumns.nextRenderTabStop(currentVisibleColumn, tabSize);
                        break;
                    default:
                        return -1;
                }
            }
            // This condition handles when the target column is at the end of the line.
            if (currentVisibleColumn === targetVisibleColumn) {
                return lineLength;
            }
            return -1;
        }
    }
    exports.AtomicTabMoveOperations = AtomicTabMoveOperations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQXRvbWljTW92ZU9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY3Vyc29yL2N1cnNvckF0b21pY01vdmVPcGVyYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxJQUFrQixTQUlqQjtJQUpELFdBQWtCLFNBQVM7UUFDMUIseUNBQUksQ0FBQTtRQUNKLDJDQUFLLENBQUE7UUFDTCwrQ0FBTyxDQUFBO0lBQ1IsQ0FBQyxFQUppQixTQUFTLHlCQUFULFNBQVMsUUFJMUI7SUFFRCxNQUFhLHVCQUF1QjtRQUNuQzs7Ozs7V0FLRztRQUNJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxXQUFtQixFQUFFLFFBQWdCLEVBQUUsT0FBZTtZQUMzRixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQ3RDLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztZQUN0QixJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDcEIsT0FBTyxDQUFDLG1CQUFtQixFQUFFLHdCQUF3QixFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUNELElBQUksYUFBYSxHQUFHLE9BQU8sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbkMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO29CQUN4Qix3QkFBd0IsR0FBRyxhQUFhLENBQUM7Z0JBQzFDLENBQUM7Z0JBQ0QsTUFBTSxNQUFN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