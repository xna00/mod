/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Position = void 0;
    /**
     * A position in the editor.
     */
    class Position {
        constructor(lineNumber, column) {
            this.lineNumber = lineNumber;
            this.column = column;
        }
        /**
         * Create a new position from this position.
         *
         * @param newLineNumber new line number
         * @param newColumn new column
         */
        with(newLineNumber = this.lineNumber, newColumn = this.column) {
            if (newLineNumber === this.lineNumber && newColumn === this.column) {
                return this;
            }
            else {
                return new Position(newLineNumber, newColumn);
            }
        }
        /**
         * Derive a new position from this position.
         *
         * @param deltaLineNumber line number delta
         * @param deltaColumn column delta
         */
        delta(deltaLineNumber = 0, deltaColumn = 0) {
            return this.with(this.lineNumber + deltaLineNumber, this.column + deltaColumn);
        }
        /**
         * Test if this position equals other position
         */
        equals(other) {
            return Position.equals(this, other);
        }
        /**
         * Test if position `a` equals position `b`
         */
        static equals(a, b) {
            if (!a && !b) {
                return true;
            }
            return (!!a &&
                !!b &&
                a.lineNumber === b.lineNumber &&
                a.column === b.column);
        }
        /**
         * Test if this position is before other position.
         * If the two positions are equal, the result will be false.
         */
        isBefore(other) {
            return Position.isBefore(this, other);
        }
        /**
         * Test if position `a` is before position `b`.
         * If the two positions are equal, the result will be false.
         */
        static isBefore(a, b) {
            if (a.lineNumber < b.lineNumber) {
                return true;
            }
            if (b.lineNumber < a.lineNumber) {
                return false;
            }
            return a.column < b.column;
        }
        /**
         * Test if this position is before other position.
         * If the two positions are equal, the result will be true.
         */
        isBeforeOrEqual(other) {
            return Position.isBeforeOrEqual(this, other);
        }
        /**
         * Test if position `a` is before position `b`.
         * If the two positions are equal, the result will be true.
         */
        static isBeforeOrEqual(a, b) {
            if (a.lineNumber < b.lineNumber) {
                return true;
            }
            if (b.lineNumber < a.lineNumber) {
                return false;
            }
            return a.column <= b.column;
        }
        /**
         * A function that compares positions, useful for sorting
         */
        static compare(a, b) {
            const aLineNumber = a.lineNumber | 0;
            const bLineNumber = b.lineNumber | 0;
            if (aLineNumber === bLineNumber) {
                const aColumn = a.column | 0;
                const bColumn = b.column | 0;
                return aColumn - bColumn;
            }
            return aLineNumber - bLineNumber;
        }
        /**
         * Clone this position.
         */
        clone() {
            return new Position(this.lineNumber, this.column);
        }
        /**
         * Convert to a human-readable representation.
         */
        toString() {
            return '(' + this.lineNumber + ',' + this.column + ')';
        }
        // ---
        /**
         * Create a `Position` from an `IPosition`.
         */
        static lift(pos) {
            return new Position(pos.lineNumber, pos.column);
        }
        /**
         * Test if `obj` is an `IPosition`.
         */
        static isIPosition(obj) {
            return (obj
                && (typeof obj.lineNumber === 'number')
                && (typeof obj.column === 'number'));
        }
        toJSON() {
            return {
                lineNumber: this.lineNumber,
                column: this.column
            };
        }
    }
    exports.Position = Position;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS9wb3NpdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHOztPQUVHO0lBQ0gsTUFBYSxRQUFRO1FBVXBCLFlBQVksVUFBa0IsRUFBRSxNQUFjO1lBQzdDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILElBQUksQ0FBQyxnQkFBd0IsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFvQixJQUFJLENBQUMsTUFBTTtZQUM1RSxJQUFJLGFBQWEsS0FBSyxJQUFJLENBQUMsVUFBVSxJQUFJLFNBQVMsS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxRQUFRLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDRixDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCxLQUFLLENBQUMsa0JBQTBCLENBQUMsRUFBRSxjQUFzQixDQUFDO1lBQ3pELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLGVBQWUsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU0sQ0FBQyxLQUFnQjtZQUM3QixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU0sQ0FBQyxNQUFNLENBQUMs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