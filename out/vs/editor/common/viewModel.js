/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, arrays, strings, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewRulerDecorationsGroup = exports.ViewModelDecoration = exports.SingleLineInlineDecoration = exports.InlineDecoration = exports.InlineDecorationType = exports.ViewLineRenderingData = exports.ViewLineData = exports.MinimapLinesRenderingData = exports.Viewport = void 0;
    class Viewport {
        constructor(top, left, width, height) {
            this._viewportBrand = undefined;
            this.top = top | 0;
            this.left = left | 0;
            this.width = width | 0;
            this.height = height | 0;
        }
    }
    exports.Viewport = Viewport;
    class MinimapLinesRenderingData {
        constructor(tabSize, data) {
            this.tabSize = tabSize;
            this.data = data;
        }
    }
    exports.MinimapLinesRenderingData = MinimapLinesRenderingData;
    class ViewLineData {
        constructor(content, continuesWithWrappedLine, minColumn, maxColumn, startVisibleColumn, tokens, inlineDecorations) {
            this._viewLineDataBrand = undefined;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.startVisibleColumn = startVisibleColumn;
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
        }
    }
    exports.ViewLineData = ViewLineData;
    class ViewLineRenderingData {
        constructor(minColumn, maxColumn, content, continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, tokens, inlineDecorations, tabSize, startVisibleColumn) {
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.isBasicASCII = ViewLineRenderingData.isBasicASCII(content, mightContainNonBasicASCII);
            this.containsRTL = ViewLineRenderingData.containsRTL(content, this.isBasicASCII, mightContainRTL);
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
        }
        static isBasicASCII(lineContent, mightContainNonBasicASCII) {
            if (mightContainNonBasicASCII) {
                return strings.isBasicASCII(lineContent);
            }
            return true;
        }
        static containsRTL(lineContent, isBasicASCII, mightContainRTL) {
            if (!isBasicASCII && mightContainRTL) {
                return strings.containsRTL(lineContent);
            }
            return false;
        }
    }
    exports.ViewLineRenderingData = ViewLineRenderingData;
    var InlineDecorationType;
    (function (InlineDecorationType) {
        InlineDecorationType[InlineDecorationType["Regular"] = 0] = "Regular";
        InlineDecorationType[InlineDecorationType["Before"] = 1] = "Before";
        InlineDecorationType[InlineDecorationType["After"] = 2] = "After";
        InlineDecorationType[InlineDecorationType["RegularAffectingLetterSpacing"] = 3] = "RegularAffectingLetterSpacing";
    })(InlineDecorationType || (exports.InlineDecorationType = InlineDecorationType = {}));
    class InlineDecoration {
        constructor(range, inlineClassName, type) {
            this.range = range;
            this.inlineClassName = inlineClassName;
            this.type = type;
        }
    }
    exports.InlineDecoration = InlineDecoration;
    class SingleLineInlineDecoration {
        constructor(startOffset, endOffset, inlineClassName, inlineClassNameAffectsLetterSpacing) {
            this.startOffset = startOffset;
            this.endOffset = endOffset;
            this.inlineClassName = inlineClassName;
            this.inlineClassNameAffectsLetterSpacing = inlineClassNameAffectsLetterSpacing;
        }
        toInlineDecoration(lineNumber) {
            return new InlineDecoration(new range_1.Range(lineNumber, this.startOffset + 1, lineNumber, this.endOffset + 1), this.inlineClassName, this.inlineClassNameAffectsLetterSpacing ? 3 /* InlineDecorationType.RegularAffectingLetterSpacing */ : 0 /* InlineDecorationType.Regular */);
        }
    }
    exports.SingleLineInlineDecoration = SingleLineInlineDecoration;
    class ViewModelDecoration {
        constructor(range, options) {
            this._viewModelDecorationBrand = undefined;
            this.range = range;
            this.options = options;
        }
    }
    exports.ViewModelDecoration = ViewModelDecoration;
    class OverviewRulerDecorationsGroup {
        constructor(color, zIndex, 
        /**
         * Decorations are encoded in a number array using the following scheme:
         *  - 3*i = lane
         *  - 3*i+1 = startLineNumber
         *  - 3*i+2 = endLineNumber
         */
        data) {
            this.color = color;
            this.zIndex = zIndex;
            this.data = data;
        }
        static compareByRenderingProps(a, b) {
            if (a.zIndex === b.zIndex) {
                if (a.color < b.color) {
                    return -1;
                }
                if (a.color > b.color) {
                    return 1;
                }
                return 0;
            }
            return a.zIndex - b.zIndex;
        }
        static equals(a, b) {
            return (a.color === b.color
                && a.zIndex === b.zIndex
                && arrays.equals(a.data, b.data));
        }
        static equalsArr(a, b) {
            return arrays.equals(a, b, OverviewRulerDecorationsGroup.equals);
        }
    }
    exports.OverviewRulerDecorationsGroup = OverviewRulerDecorationsGroup;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtTWhHLE1BQWEsUUFBUTtRQVFwQixZQUFZLEdBQVcsRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLE1BQWM7WUFQM0QsbUJBQWMsR0FBUyxTQUFTLENBQUM7WUFRekMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUM7S0FDRDtJQWRELDRCQWNDO0lBd0JELE1BQWEseUJBQXlCO1FBSXJDLFlBQ0MsT0FBZSxFQUNmLElBQWdDO1lBRWhDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQVhELDhEQVdDO0lBRUQsTUFBYSxZQUFZO1FBaUN4QixZQUNDLE9BQWUsRUFDZix3QkFBaUMsRUFDakMsU0FBaUIsRUFDakIsU0FBaUIsRUFDakIsa0JBQTBCLEVBQzFCLE1BQXVCLEVBQ3ZCLGlCQUErRDtZQXZDaEUsdUJBQWtCLEdBQVMsU0FBUyxDQUFDO1lBeUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsd0JBQXdCLENBQUM7WUFDekQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO1lBQzdDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztRQUM1QyxDQUFDO0tBQ0Q7SUFsREQsb0NBa0RDO0lBRUQsTUFBYSxxQkFBcUI7UUEwQ2pDLFlBQ0MsU0FBaUIsRUFDakIsU0FBaUIsRUFDakIsT0FBZSxFQUNmLHdCQUFpQyxFQUNqQyxlQUF3QixFQUN4Qix5QkFBa0MsRUFDbEMsTUFBdUIsRUFDdkIsaUJBQXFDLEVBQ3JDLE9BQWUsRUFDZixrQkFBMEI7WUFFMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLHdCQUF3QixDQUFDO1lBRXpELElBQUksQ0FBQyxZQUFZLEdBQUcscUJBQXFCLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxXQUFXLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBRWxHLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztZQUMzQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7UUFDOUMsQ0FBQztRQUVNLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBbUIsRUFBRSx5QkFBa0M7WUFDakYsSUFBSSx5QkFBeUIsRUFBRSxDQUFDO2dCQUMvQixPQUFPLE9BQU8sQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBbUIsRUFBRSxZQUFxQixFQUFFLGVBQXdCO1lBQzdGLElBQUksQ0FBQyxZQUFZLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0tBQ0Q7SUFqRkQsc0RBaUZDO0lBRUQsSUFBa0Isb0JBS2pCO0lBTEQsV0FBa0Isb0JBQW9CO1FBQ3JDLHFFQUFXLENBQUE7UUFDWCxtRUFBVSxDQUFBO1FBQ1YsaUVBQVMsQ0FBQTtRQUNULGlIQUFpQyxDQUFBO0lBQ2xDLENBQUMsRUFMaUIsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFLckM7SUFFRCxNQUFhLGdCQUFnQjtRQUM1QixZQUNpQixLQUFZLEVBQ1osZUFBdUIsRUFDdkIsSUFBMEI7WUFGMUIsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ3ZCLFNBQUksR0FBSixJQUFJLENBQXNCO1FBRTNDLENBQUM7S0FDRDtJQVBELDRDQU9DO0lBRUQsTUFBYSwwQkFBMEI7UUFDdEMsWUFDaUIsV0FBbUIsRUFDbkIsU0FBaUIsRUFDakIsZUFBdUIsRUFDdkIsbUNBQTRDO1lBSDVDLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsb0JBQWUsR0FBZixlQUFlLENBQVE7WUFDdkIsd0NBQW1DLEdBQW5DLG1DQUFtQyxDQUFTO1FBRTdELENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxVQUFrQjtZQUNwQyxPQUFPLElBQUksZ0JBQWdCLENBQzFCLElBQUksYUFBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFDM0UsSUFBSSxDQUFDLGVBQWUsRUFDcEIsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLENBQUMsNERBQW9ELENBQUMscUNBQTZCLENBQzVILENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFoQkQsZ0VBZ0JDO0lBRUQsTUFBYSxtQkFBbUI7UUFNL0IsWUFBWSxLQUFZLEVBQUUsT0FBZ0M7WUFMMUQsOEJBQXlCLEdBQVMsU0FBUyxDQUFDO1lBTTNDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3hCLENBQUM7S0FDRDtJQVZELGtEQVVDO0lBRUQsTUFBYSw2QkFBNkI7UUFFekMsWUFDaUIsS0FBYSxFQUNiLE1BQWM7UUFDOUI7Ozs7O1dBS0c7UUFDYSxJQUFjO1lBUmQsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFdBQU0sR0FBTixNQUFNLENBQVE7WUFPZCxTQUFJLEdBQUosSUFBSSxDQUFVO1FBQzNCLENBQUM7UUFFRSxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBZ0MsRUFBRSxDQUFnQztZQUN2RyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN2QixPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztnQkFDRCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUM1QixDQUFDO1FBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFnQyxFQUFFLENBQWdDO1lBQ3RGLE9BQU8sQ0FDTixDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxLQUFLO21CQUNoQixDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNO21CQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNoQyxDQUFDO1FBQ0gsQ0FBQztRQUVNLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBa0MsRUFBRSxDQUFrQztZQUM3RixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRSxDQUFDO0tBQ0Q7SUF0Q0Qsc0VBc0NDIn0=