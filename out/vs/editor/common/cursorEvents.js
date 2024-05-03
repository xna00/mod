/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorChangeReason = void 0;
    /**
     * Describes the reason the cursor has changed its position.
     */
    var CursorChangeReason;
    (function (CursorChangeReason) {
        /**
         * Unknown or not set.
         */
        CursorChangeReason[CursorChangeReason["NotSet"] = 0] = "NotSet";
        /**
         * A `model.setValue()` was called.
         */
        CursorChangeReason[CursorChangeReason["ContentFlush"] = 1] = "ContentFlush";
        /**
         * The `model` has been changed outside of this cursor and the cursor recovers its position from associated markers.
         */
        CursorChangeReason[CursorChangeReason["RecoverFromMarkers"] = 2] = "RecoverFromMarkers";
        /**
         * There was an explicit user gesture.
         */
        CursorChangeReason[CursorChangeReason["Explicit"] = 3] = "Explicit";
        /**
         * There was a Paste.
         */
        CursorChangeReason[CursorChangeReason["Paste"] = 4] = "Paste";
        /**
         * There was an Undo.
         */
        CursorChangeReason[CursorChangeReason["Undo"] = 5] = "Undo";
        /**
         * There was a Redo.
         */
        CursorChangeReason[CursorChangeReason["Redo"] = 6] = "Redo";
    })(CursorChangeReason || (exports.CursorChangeReason = CursorChangeReason = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yRXZlbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvckV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7O09BRUc7SUFDSCxJQUFrQixrQkE2QmpCO0lBN0JELFdBQWtCLGtCQUFrQjtRQUNuQzs7V0FFRztRQUNILCtEQUFVLENBQUE7UUFDVjs7V0FFRztRQUNILDJFQUFnQixDQUFBO1FBQ2hCOztXQUVHO1FBQ0gsdUZBQXNCLENBQUE7UUFDdEI7O1dBRUc7UUFDSCxtRUFBWSxDQUFBO1FBQ1o7O1dBRUc7UUFDSCw2REFBUyxDQUFBO1FBQ1Q7O1dBRUc7UUFDSCwyREFBUSxDQUFBO1FBQ1I7O1dBRUc7UUFDSCwyREFBUSxDQUFBO0lBQ1QsQ0FBQyxFQTdCaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUE2Qm5DIn0=