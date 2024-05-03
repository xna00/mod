/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentRulesSupport = exports.IndentConsts = void 0;
    var IndentConsts;
    (function (IndentConsts) {
        IndentConsts[IndentConsts["INCREASE_MASK"] = 1] = "INCREASE_MASK";
        IndentConsts[IndentConsts["DECREASE_MASK"] = 2] = "DECREASE_MASK";
        IndentConsts[IndentConsts["INDENT_NEXTLINE_MASK"] = 4] = "INDENT_NEXTLINE_MASK";
        IndentConsts[IndentConsts["UNINDENT_MASK"] = 8] = "UNINDENT_MASK";
    })(IndentConsts || (exports.IndentConsts = IndentConsts = {}));
    function resetGlobalRegex(reg) {
        if (reg.global) {
            reg.lastIndex = 0;
        }
        return true;
    }
    class IndentRulesSupport {
        constructor(indentationRules) {
            this._indentationRules = indentationRules;
        }
        shouldIncrease(text) {
            if (this._indentationRules) {
                if (this._indentationRules.increaseIndentPattern && resetGlobalRegex(this._indentationRules.increaseIndentPattern) && this._indentationRules.increaseIndentPattern.test(text)) {
                    return true;
                }
                // if (this._indentationRules.indentNextLinePattern && this._indentationRules.indentNextLinePattern.test(text)) {
                // 	return true;
                // }
            }
            return false;
        }
        shouldDecrease(text) {
            if (this._indentationRules && this._indentationRules.decreaseIndentPattern && resetGlobalRegex(this._indentationRules.decreaseIndentPattern) && this._indentationRules.decreaseIndentPattern.test(text)) {
                return true;
            }
            return false;
        }
        shouldIndentNextLine(text) {
            if (this._indentationRules && this._indentationRules.indentNextLinePattern && resetGlobalRegex(this._indentationRules.indentNextLinePattern) && this._indentationRules.indentNextLinePattern.test(text)) {
                return true;
            }
            return false;
        }
        shouldIgnore(text) {
            // the text matches `unIndentedLinePattern`
            if (this._indentationRules && this._indentationRules.unIndentedLinePattern && resetGlobalRegex(this._indentationRules.unIndentedLinePattern) && this._indentationRules.unIndentedLinePattern.test(text)) {
                return true;
            }
            return false;
        }
        getIndentMetadata(text) {
            let ret = 0;
            if (this.shouldIncrease(text)) {
                ret += 1 /* IndentConsts.INCREASE_MASK */;
            }
            if (this.shouldDecrease(text)) {
                ret += 2 /* IndentConsts.DECREASE_MASK */;
            }
            if (this.shouldIndentNextLine(text)) {
                ret += 4 /* IndentConsts.INDENT_NEXTLINE_MASK */;
            }
            if (this.shouldIgnore(text)) {
                ret += 8 /* IndentConsts.UNINDENT_MASK */;
            }
            return ret;
        }
    }
    exports.IndentRulesSupport = IndentRulesSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50UnVsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3N1cHBvcnRzL2luZGVudFJ1bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxJQUFrQixZQUtqQjtJQUxELFdBQWtCLFlBQVk7UUFDN0IsaUVBQTBCLENBQUE7UUFDMUIsaUVBQTBCLENBQUE7UUFDMUIsK0VBQWlDLENBQUE7UUFDakMsaUVBQTBCLENBQUE7SUFDM0IsQ0FBQyxFQUxpQixZQUFZLDRCQUFaLFlBQVksUUFLN0I7SUFFRCxTQUFTLGdCQUFnQixDQUFDLEdBQVc7UUFDcEMsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELE1BQWEsa0JBQWtCO1FBSTlCLFlBQVksZ0JBQWlDO1lBQzVDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztRQUMzQyxDQUFDO1FBRU0sY0FBYyxDQUFDLElBQVk7WUFDakMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUMvSyxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2dCQUNELGlIQUFpSDtnQkFDakgsZ0JBQWdCO2dCQUNoQixJQUFJO1lBQ0wsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLGNBQWMsQ0FBQyxJQUFZO1lBQ2pDLElBQUksSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3pNLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLG9CQUFvQixDQUFDLElBQVk7WUFDdkMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDek0sT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sWUFBWSxDQUFDLElBQVk7WUFDL0IsMkNBQTJDO1lBQzNDLElBQUksSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3pNLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLGlCQUFpQixDQUFDLElBQVk7WUFDcEMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ1osSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLEdBQUcsc0NBQThCLENBQUM7WUFDbkMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvQixHQUFHLHNDQUE4QixDQUFDO1lBQ25DLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxHQUFHLDZDQUFxQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsR0FBRyxzQ0FBOEIsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO0tBQ0Q7SUE1REQsZ0RBNERDIn0=