/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Selection = exports.SelectionDirection = void 0;
    /**
     * The direction of a selection.
     */
    var SelectionDirection;
    (function (SelectionDirection) {
        /**
         * The selection starts above where it ends.
         */
        SelectionDirection[SelectionDirection["LTR"] = 0] = "LTR";
        /**
         * The selection starts below where it ends.
         */
        SelectionDirection[SelectionDirection["RTL"] = 1] = "RTL";
    })(SelectionDirection || (exports.SelectionDirection = SelectionDirection = {}));
    /**
     * A selection in the editor.
     * The selection is a range that has an orientation.
     */
    class Selection extends range_1.Range {
        constructor(selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn) {
            super(selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn);
            this.selectionStartLineNumber = selectionStartLineNumber;
            this.selectionStartColumn = selectionStartColumn;
            this.positionLineNumber = positionLineNumber;
            this.positionColumn = positionColumn;
        }
        /**
         * Transform to a human-readable representation.
         */
        toString() {
            return '[' + this.selectionStartLineNumber + ',' + this.selectionStartColumn + ' -> ' + this.positionLineNumber + ',' + this.positionColumn + ']';
        }
        /**
         * Test if equals other selection.
         */
        equalsSelection(other) {
            return (Selection.selectionsEqual(this, other));
        }
        /**
         * Test if the two selections are equal.
         */
        static selectionsEqual(a, b) {
            return (a.selectionStartLineNumber === b.selectionStartLineNumber &&
                a.selectionStartColumn === b.selectionStartColumn &&
                a.positionLineNumber === b.positionLineNumber &&
                a.positionColumn === b.positionColumn);
        }
        /**
         * Get directions (LTR or RTL).
         */
        getDirection() {
            if (this.selectionStartLineNumber === this.startLineNumber && this.selectionStartColumn === this.startColumn) {
                return 0 /* SelectionDirection.LTR */;
            }
            return 1 /* SelectionDirection.RTL */;
        }
        /**
         * Create a new selection with a different `positionLineNumber` and `positionColumn`.
         */
        setEndPosition(endLineNumber, endColumn) {
            if (this.getDirection() === 0 /* SelectionDirection.LTR */) {
                return new Selection(this.startLineNumber, this.startColumn, endLineNumber, endColumn);
            }
            return new Selection(endLineNumber, endColumn, this.startLineNumber, this.startColumn);
        }
        /**
         * Get the position at `positionLineNumber` and `positionColumn`.
         */
        getPosition() {
            return new position_1.Position(this.positionLineNumber, this.positionColumn);
        }
        /**
         * Get the position at the start of the selection.
        */
        getSelectionStart() {
            return new position_1.Position(this.selectionStartLineNumber, this.selectionStartColumn);
        }
        /**
         * Create a new selection with a different `selectionStartLineNumber` and `selectionStartColumn`.
         */
        setStartPosition(startLineNumber, startColumn) {
            if (this.getDirection() === 0 /* SelectionDirection.LTR */) {
                return new Selection(startLineNumber, startColumn, this.endLineNumber, this.endColumn);
            }
            return new Selection(this.endLineNumber, this.endColumn, startLineNumber, startColumn);
        }
        // ----
        /**
         * Create a `Selection` from one or two positions
         */
        static fromPositions(start, end = start) {
            return new Selection(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        /**
         * Creates a `Selection` from a range, given a direction.
         */
        static fromRange(range, direction) {
            if (direction === 0 /* SelectionDirection.LTR */) {
                return new Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
            }
            else {
                return new Selection(range.endLineNumber, range.endColumn, range.startLineNumber, range.startColumn);
            }
        }
        /**
         * Create a `Selection` from an `ISelection`.
         */
        static liftSelection(sel) {
            return new Selection(sel.selectionStartLineNumber, sel.selectionStartColumn, sel.positionLineNumber, sel.positionColumn);
        }
        /**
         * `a` equals `b`.
         */
        static selectionsArrEqual(a, b) {
            if (a && !b || !a && b) {
                return false;
            }
            if (!a && !b) {
                return true;
            }
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0, len = a.length; i < len; i++) {
                if (!this.selectionsEqual(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Test if `obj` is an `ISelection`.
         */
        static isISelection(obj) {
            return (obj
                && (typeof obj.selectionStartLineNumber === 'number')
                && (typeof obj.selectionStartColumn === 'number')
                && (typeof obj.positionLineNumber === 'number')
                && (typeof obj.positionColumn === 'number'));
        }
        /**
         * Create with a direction.
         */
        static createWithDirection(startLineNumber, startColumn, endLineNumber, endColumn, direction) {
            if (direction === 0 /* SelectionDirection.LTR */) {
                return new Selection(startLineNumber, startColumn, endLineNumber, endColumn);
            }
            return new Selection(endLineNumber, endColumn, startLineNumber, startColumn);
        }
    }
    exports.Selection = Selection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvcmUvc2VsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRCaEc7O09BRUc7SUFDSCxJQUFrQixrQkFTakI7SUFURCxXQUFrQixrQkFBa0I7UUFDbkM7O1dBRUc7UUFDSCx5REFBRyxDQUFBO1FBQ0g7O1dBRUc7UUFDSCx5REFBRyxDQUFBO0lBQ0osQ0FBQyxFQVRpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQVNuQztJQUVEOzs7T0FHRztJQUNILE1BQWEsU0FBVSxTQUFRLGFBQUs7UUFrQm5DLFlBQVksd0JBQWdDLEVBQUUsb0JBQTRCLEVBQUUsa0JBQTBCLEVBQUUsY0FBc0I7WUFDN0gsS0FBSyxDQUFDLHdCQUF3QixFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzFGLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx3QkFBd0IsQ0FBQztZQUN6RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7WUFDakQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO1lBQzdDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3RDLENBQUM7UUFFRDs7V0FFRztRQUNhLFFBQVE7WUFDdkIsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUM7UUFDbkosQ0FBQztRQUVEOztXQUVHO1FBQ0ksZUFBZSxDQUFDLEtBQWlCO1lBQ3ZDLE9BQU8sQ0FDTixTQUFT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