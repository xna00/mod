/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/languages/supports", "vs/editor/common/languages/supports/richEditBrackets"], function (require, exports, arrays_1, supports_1, richEditBrackets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketElectricCharacterSupport = void 0;
    class BracketElectricCharacterSupport {
        constructor(richEditBrackets) {
            this._richEditBrackets = richEditBrackets;
        }
        getElectricCharacters() {
            const result = [];
            if (this._richEditBrackets) {
                for (const bracket of this._richEditBrackets.brackets) {
                    for (const close of bracket.close) {
                        const lastChar = close.charAt(close.length - 1);
                        result.push(lastChar);
                    }
                }
            }
            return (0, arrays_1.distinct)(result);
        }
        onElectricCharacter(character, context, column) {
            if (!this._richEditBrackets || this._richEditBrackets.brackets.length === 0) {
                return null;
            }
            const tokenIndex = context.findTokenIndexAtOffset(column - 1);
            if ((0, supports_1.ignoreBracketsInToken)(context.getStandardTokenType(tokenIndex))) {
                return null;
            }
            const reversedBracketRegex = this._richEditBrackets.reversedRegex;
            const text = context.getLineContent().substring(0, column - 1) + character;
            const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(reversedBracketRegex, 1, text, 0, text.length);
            if (!r) {
                return null;
            }
            const bracketText = text.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
            const isOpen = this._richEditBrackets.textIsOpenBracket[bracketText];
            if (isOpen) {
                return null;
            }
            const textBeforeBracket = context.getActualLineContentBefore(r.startColumn - 1);
            if (!/^\s*$/.test(textBeforeBracket)) {
                // There is other text on the line before the bracket
                return null;
            }
            return {
                matchOpenBracket: bracketText
            };
        }
    }
    exports.BracketElectricCharacterSupport = BracketElectricCharacterSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3RyaWNDaGFyYWN0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3N1cHBvcnRzL2VsZWN0cmljQ2hhcmFjdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBYSwrQkFBK0I7UUFJM0MsWUFBWSxnQkFBeUM7WUFDcEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDO1FBQzNDLENBQUM7UUFFTSxxQkFBcUI7WUFDM0IsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBRTVCLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVCLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN2RCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDbkMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN2QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFBLGlCQUFRLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVNLG1CQUFtQixDQUFDLFNBQWlCLEVBQUUsT0FBeUIsRUFBRSxNQUFjO1lBQ3RGLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzdFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUQsSUFBSSxJQUFBLGdDQUFxQixFQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQztZQUNsRSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxHQUFHLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDUixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFckYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3JFLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLHFEQUFxRDtnQkFDckQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTztnQkFDTixnQkFBZ0IsRUFBRSxXQUFXO2FBQzdCLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUExREQsMEVBMERDIn0=