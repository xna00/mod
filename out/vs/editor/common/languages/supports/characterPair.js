/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/languageConfiguration"], function (require, exports, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterPairSupport = void 0;
    class CharacterPairSupport {
        static { this.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_QUOTES = ';:.,=}])> \n\t'; }
        static { this.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_BRACKETS = '\'"`;:.,=}])> \n\t'; }
        static { this.DEFAULT_AUTOCLOSE_BEFORE_WHITESPACE = ' \n\t'; }
        constructor(config) {
            if (config.autoClosingPairs) {
                this._autoClosingPairs = config.autoClosingPairs.map(el => new languageConfiguration_1.StandardAutoClosingPairConditional(el));
            }
            else if (config.brackets) {
                this._autoClosingPairs = config.brackets.map(b => new languageConfiguration_1.StandardAutoClosingPairConditional({ open: b[0], close: b[1] }));
            }
            else {
                this._autoClosingPairs = [];
            }
            if (config.__electricCharacterSupport && config.__electricCharacterSupport.docComment) {
                const docComment = config.__electricCharacterSupport.docComment;
                // IDocComment is legacy, only partially supported
                this._autoClosingPairs.push(new languageConfiguration_1.StandardAutoClosingPairConditional({ open: docComment.open, close: docComment.close || '' }));
            }
            this._autoCloseBeforeForQuotes = typeof config.autoCloseBefore === 'string' ? config.autoCloseBefore : CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_QUOTES;
            this._autoCloseBeforeForBrackets = typeof config.autoCloseBefore === 'string' ? config.autoCloseBefore : CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_BRACKETS;
            this._surroundingPairs = config.surroundingPairs || this._autoClosingPairs;
        }
        getAutoClosingPairs() {
            return this._autoClosingPairs;
        }
        getAutoCloseBeforeSet(forQuotes) {
            return (forQuotes ? this._autoCloseBeforeForQuotes : this._autoCloseBeforeForBrackets);
        }
        getSurroundingPairs() {
            return this._surroundingPairs;
        }
    }
    exports.CharacterPairSupport = CharacterPairSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyUGFpci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvc3VwcG9ydHMvY2hhcmFjdGVyUGFpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSxvQkFBb0I7aUJBRWhCLHFEQUFnRCxHQUFHLGdCQUFnQixDQUFDO2lCQUNwRSx1REFBa0QsR0FBRyxvQkFBb0IsQ0FBQztpQkFDMUUsd0NBQW1DLEdBQUcsT0FBTyxDQUFDO1FBTzlELFlBQVksTUFBNkI7WUFDeEMsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLDBEQUFrQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEcsQ0FBQztpQkFBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4SCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsMEJBQTBCLElBQUksTUFBTSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN2RixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsMEJBQTBCLENBQUMsVUFBVSxDQUFDO2dCQUNoRSxrREFBa0Q7Z0JBQ2xELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvSCxDQUFDO1lBRUQsSUFBSSxDQUFDLHlCQUF5QixHQUFHLE9BQU8sTUFBTSxDQUFDLGVBQWUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGdEQUFnRCxDQUFDO1lBQzdLLElBQUksQ0FBQywyQkFBMkIsR0FBRyxPQUFPLE1BQU0sQ0FBQyxlQUFlLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxrREFBa0QsQ0FBQztZQUVqTCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUM1RSxDQUFDO1FBRU0sbUJBQW1CO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7UUFFTSxxQkFBcUIsQ0FBQyxTQUFrQjtZQUM5QyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFTSxtQkFBbUI7WUFDekIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQzs7SUExQ0Ysb0RBMkNDIn0=