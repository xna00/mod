/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/nullTokenize", "vs/base/common/lifecycle", "vs/base/common/observable"], function (require, exports, nullTokenize_1, lifecycle_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationSupportWithLineLimit = void 0;
    class TokenizationSupportWithLineLimit extends lifecycle_1.Disposable {
        get backgroundTokenizerShouldOnlyVerifyTokens() {
            return this._actual.backgroundTokenizerShouldOnlyVerifyTokens;
        }
        constructor(_encodedLanguageId, _actual, _maxTokenizationLineLength) {
            super();
            this._encodedLanguageId = _encodedLanguageId;
            this._actual = _actual;
            this._maxTokenizationLineLength = _maxTokenizationLineLength;
            this._register((0, observable_1.keepObserved)(this._maxTokenizationLineLength));
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        tokenize(line, hasEOL, state) {
            throw new Error('Not supported!');
        }
        tokenizeEncoded(line, hasEOL, state) {
            // Do not attempt to tokenize if a line is too long
            if (line.length >= this._maxTokenizationLineLength.get()) {
                return (0, nullTokenize_1.nullTokenizeEncoded)(this._encodedLanguageId, state);
            }
            return this._actual.tokenizeEncoded(line, hasEOL, state);
        }
        createBackgroundTokenizer(textModel, store) {
            if (this._actual.createBackgroundTokenizer) {
                return this._actual.createBackgroundTokenizer(textModel, store);
            }
            else {
                return undefined;
            }
        }
    }
    exports.TokenizationSupportWithLineLimit = TokenizationSupportWithLineLimit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uU3VwcG9ydFdpdGhMaW5lTGltaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS9icm93c2VyL3Rva2VuaXphdGlvblN1cHBvcnQvdG9rZW5pemF0aW9uU3VwcG9ydFdpdGhMaW5lTGltaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsZ0NBQWlDLFNBQVEsc0JBQVU7UUFDL0QsSUFBSSx5Q0FBeUM7WUFDNUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHlDQUF5QyxDQUFDO1FBQy9ELENBQUM7UUFFRCxZQUNrQixrQkFBOEIsRUFDOUIsT0FBNkIsRUFDN0IsMEJBQStDO1lBRWhFLEtBQUssRUFBRSxDQUFDO1lBSlMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFZO1lBQzlCLFlBQU8sR0FBUCxPQUFPLENBQXNCO1lBQzdCLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBcUI7WUFJaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFZLEVBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsZUFBZTtZQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBRUQsUUFBUSxDQUFDLElBQVksRUFBRSxNQUFlLEVBQUUsS0FBYTtZQUNwRCxNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELGVBQWUsQ0FBQyxJQUFZLEVBQUUsTUFBZSxFQUFFLEtBQWE7WUFDM0QsbURBQW1EO1lBQ25ELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFDMUQsT0FBTyxJQUFBLGtDQUFtQixFQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCx5QkFBeUIsQ0FBQyxTQUFxQixFQUFFLEtBQW1DO1lBQ25GLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBdkNELDRFQXVDQyJ9