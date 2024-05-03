/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairWithMinIndentationInfo = exports.BracketPairInfo = exports.BracketInfo = void 0;
    class BracketInfo {
        constructor(range, 
        /** 0-based level */
        nestingLevel, nestingLevelOfEqualBracketType, isInvalid) {
            this.range = range;
            this.nestingLevel = nestingLevel;
            this.nestingLevelOfEqualBracketType = nestingLevelOfEqualBracketType;
            this.isInvalid = isInvalid;
        }
    }
    exports.BracketInfo = BracketInfo;
    class BracketPairInfo {
        constructor(range, openingBracketRange, closingBracketRange, 
        /** 0-based */
        nestingLevel, nestingLevelOfEqualBracketType, bracketPairNode) {
            this.range = range;
            this.openingBracketRange = openingBracketRange;
            this.closingBracketRange = closingBracketRange;
            this.nestingLevel = nestingLevel;
            this.nestingLevelOfEqualBracketType = nestingLevelOfEqualBracketType;
            this.bracketPairNode = bracketPairNode;
        }
        get openingBracketInfo() {
            return this.bracketPairNode.openingBracket.bracketInfo;
        }
        get closingBracketInfo() {
            return this.bracketPairNode.closingBracket?.bracketInfo;
        }
    }
    exports.BracketPairInfo = BracketPairInfo;
    class BracketPairWithMinIndentationInfo extends BracketPairInfo {
        constructor(range, openingBracketRange, closingBracketRange, 
        /**
         * 0-based
        */
        nestingLevel, nestingLevelOfEqualBracketType, bracketPairNode, 
        /**
         * -1 if not requested, otherwise the size of the minimum indentation in the bracket pair in terms of visible columns.
        */
        minVisibleColumnIndentation) {
            super(range, openingBracketRange, closingBracketRange, nestingLevel, nestingLevelOfEqualBracketType, bracketPairNode);
            this.minVisibleColumnIndentation = minVisibleColumnIndentation;
        }
    }
    exports.BracketPairWithMinIndentationInfo = BracketPairWithMinIndentationInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsQnJhY2tldFBhaXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3RleHRNb2RlbEJyYWNrZXRQYWlycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzRWhHLE1BQWEsV0FBVztRQUN2QixZQUNpQixLQUFZO1FBQzVCLG9CQUFvQjtRQUNKLFlBQW9CLEVBQ3BCLDhCQUFzQyxFQUN0QyxTQUFrQjtZQUpsQixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBRVosaUJBQVksR0FBWixZQUFZLENBQVE7WUFDcEIsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFRO1lBQ3RDLGNBQVMsR0FBVCxTQUFTLENBQVM7UUFDL0IsQ0FBQztLQUNMO0lBUkQsa0NBUUM7SUFFRCxNQUFhLGVBQWU7UUFDM0IsWUFDaUIsS0FBWSxFQUNaLG1CQUEwQixFQUMxQixtQkFBc0M7UUFDdEQsY0FBYztRQUNFLFlBQW9CLEVBQ3BCLDhCQUFzQyxFQUNyQyxlQUE0QjtZQU43QixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFPO1lBQzFCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBbUI7WUFFdEMsaUJBQVksR0FBWixZQUFZLENBQVE7WUFDcEIsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFRO1lBQ3JDLG9CQUFlLEdBQWYsZUFBZSxDQUFhO1FBRzlDLENBQUM7UUFFRCxJQUFXLGtCQUFrQjtZQUM1QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLFdBQWlDLENBQUM7UUFDOUUsQ0FBQztRQUVELElBQVcsa0JBQWtCO1lBQzVCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsV0FBNkMsQ0FBQztRQUMzRixDQUFDO0tBQ0Q7SUFwQkQsMENBb0JDO0lBRUQsTUFBYSxpQ0FBa0MsU0FBUSxlQUFlO1FBQ3JFLFlBQ0MsS0FBWSxFQUNaLG1CQUEwQixFQUMxQixtQkFBc0M7UUFDdEM7O1VBRUU7UUFDRixZQUFvQixFQUNwQiw4QkFBc0MsRUFDdEMsZUFBNEI7UUFDNUI7O1VBRUU7UUFDYywyQkFBbUM7WUFFbkQsS0FBSyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsOEJBQThCLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFGdEcsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFRO1FBR3BELENBQUM7S0FDRDtJQWxCRCw4RUFrQkMifQ==