/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentGuideHorizontalLine = exports.IndentGuide = exports.HorizontalGuidesState = void 0;
    var HorizontalGuidesState;
    (function (HorizontalGuidesState) {
        HorizontalGuidesState[HorizontalGuidesState["Disabled"] = 0] = "Disabled";
        HorizontalGuidesState[HorizontalGuidesState["EnabledForActive"] = 1] = "EnabledForActive";
        HorizontalGuidesState[HorizontalGuidesState["Enabled"] = 2] = "Enabled";
    })(HorizontalGuidesState || (exports.HorizontalGuidesState = HorizontalGuidesState = {}));
    class IndentGuide {
        constructor(visibleColumn, column, className, 
        /**
         * If set, this indent guide is a horizontal guide (no vertical part).
         * It starts at visibleColumn and continues until endColumn.
        */
        horizontalLine, 
        /**
         * If set (!= -1), only show this guide for wrapped lines that don't contain this model column, but are after it.
        */
        forWrappedLinesAfterColumn, forWrappedLinesBeforeOrAtColumn) {
            this.visibleColumn = visibleColumn;
            this.column = column;
            this.className = className;
            this.horizontalLine = horizontalLine;
            this.forWrappedLinesAfterColumn = forWrappedLinesAfterColumn;
            this.forWrappedLinesBeforeOrAtColumn = forWrappedLinesBeforeOrAtColumn;
            if ((visibleColumn !== -1) === (column !== -1)) {
                throw new Error();
            }
        }
    }
    exports.IndentGuide = IndentGuide;
    class IndentGuideHorizontalLine {
        constructor(top, endColumn) {
            this.top = top;
            this.endColumn = endColumn;
        }
    }
    exports.IndentGuideHorizontalLine = IndentGuideHorizontalLine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsR3VpZGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3RleHRNb2RlbEd1aWRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2QmhHLElBQVkscUJBSVg7SUFKRCxXQUFZLHFCQUFxQjtRQUNoQyx5RUFBUSxDQUFBO1FBQ1IseUZBQWdCLENBQUE7UUFDaEIsdUVBQU8sQ0FBQTtJQUNSLENBQUMsRUFKVyxxQkFBcUIscUNBQXJCLHFCQUFxQixRQUloQztJQVFELE1BQWEsV0FBVztRQUN2QixZQUNpQixhQUEwQixFQUMxQixNQUFtQixFQUNuQixTQUFpQjtRQUNqQzs7O1VBR0U7UUFDYyxjQUFnRDtRQUNoRTs7VUFFRTtRQUNjLDBCQUF1QyxFQUN2QywrQkFBNEM7WUFaNUMsa0JBQWEsR0FBYixhQUFhLENBQWE7WUFDMUIsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBS2pCLG1CQUFjLEdBQWQsY0FBYyxDQUFrQztZQUloRCwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQWE7WUFDdkMsb0NBQStCLEdBQS9CLCtCQUErQixDQUFhO1lBRTVELElBQUksQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNuQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBcEJELGtDQW9CQztJQUVELE1BQWEseUJBQXlCO1FBQ3JDLFlBQ2lCLEdBQVksRUFDWixTQUFpQjtZQURqQixRQUFHLEdBQUgsR0FBRyxDQUFTO1lBQ1osY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUM5QixDQUFDO0tBQ0w7SUFMRCw4REFLQyJ9