/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cache"], function (require, exports, cache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClosingBracketKind = exports.OpeningBracketKind = exports.BracketKindBase = exports.LanguageBracketsConfiguration = void 0;
    /**
     * Captures all bracket related configurations for a single language.
     * Immutable.
    */
    class LanguageBracketsConfiguration {
        constructor(languageId, config) {
            this.languageId = languageId;
            const bracketPairs = config.brackets ? filterValidBrackets(config.brackets) : [];
            const openingBracketInfos = new cache_1.CachedFunction((bracket) => {
                const closing = new Set();
                return {
                    info: new OpeningBracketKind(this, bracket, closing),
                    closing,
                };
            });
            const closingBracketInfos = new cache_1.CachedFunction((bracket) => {
                const opening = new Set();
                const openingColorized = new Set();
                return {
                    info: new ClosingBracketKind(this, bracket, opening, openingColorized),
                    opening,
                    openingColorized,
                };
            });
            for (const [open, close] of bracketPairs) {
                const opening = openingBracketInfos.get(open);
                const closing = closingBracketInfos.get(close);
                opening.closing.add(closing.info);
                closing.opening.add(opening.info);
            }
            // Treat colorized brackets as brackets, and mark them as colorized.
            const colorizedBracketPairs = config.colorizedBracketPairs
                ? filterValidBrackets(config.colorizedBracketPairs)
                // If not configured: Take all brackets except `<` ... `>`
                // Many languages set < ... > as bracket pair, even though they also use it as comparison operator.
                // This leads to problems when colorizing this bracket, so we exclude it if not explicitly configured otherwise.
                // https://github.com/microsoft/vscode/issues/132476
                : bracketPairs.filter((p) => !(p[0] === '<' && p[1] === '>'));
            for (const [open, close] of colorizedBracketPairs) {
                const opening = openingBracketInfos.get(open);
                const closing = closingBracketInfos.get(close);
                opening.closing.add(closing.info);
                closing.openingColorized.add(opening.info);
                closing.opening.add(opening.info);
            }
            this._openingBrackets = new Map([...openingBracketInfos.cachedValues].map(([k, v]) => [k, v.info]));
            this._closingBrackets = new Map([...closingBracketInfos.cachedValues].map(([k, v]) => [k, v.info]));
        }
        /**
         * No two brackets have the same bracket text.
        */
        get openingBrackets() {
            return [...this._openingBrackets.values()];
        }
        /**
         * No two brackets have the same bracket text.
        */
        get closingBrackets() {
            return [...this._closingBrackets.values()];
        }
        getOpeningBracketInfo(bracketText) {
            return this._openingBrackets.get(bracketText);
        }
        getClosingBracketInfo(bracketText) {
            return this._closingBrackets.get(bracketText);
        }
        getBracketInfo(bracketText) {
            return this.getOpeningBracketInfo(bracketText) || this.getClosingBracketInfo(bracketText);
        }
    }
    exports.LanguageBracketsConfiguration = LanguageBracketsConfiguration;
    function filterValidBrackets(bracketPairs) {
        return bracketPairs.filter(([open, close]) => open !== '' && close !== '');
    }
    class BracketKindBase {
        constructor(config, bracketText) {
            this.config = config;
            this.bracketText = bracketText;
        }
        get languageId() {
            return this.config.languageId;
        }
    }
    exports.BracketKindBase = BracketKindBase;
    class OpeningBracketKind extends BracketKindBase {
        constructor(config, bracketText, openedBrackets) {
            super(config, bracketText);
            this.openedBrackets = openedBrackets;
            this.isOpeningBracket = true;
        }
    }
    exports.OpeningBracketKind = OpeningBracketKind;
    class ClosingBracketKind extends BracketKindBase {
        constructor(config, bracketText, 
        /**
         * Non empty array of all opening brackets this bracket closes.
        */
        openingBrackets, openingColorizedBrackets) {
            super(config, bracketText);
            this.openingBrackets = openingBrackets;
            this.openingColorizedBrackets = openingColorizedBrackets;
            this.isOpeningBracket = false;
        }
        /**
         * Checks if this bracket closes the given other bracket.
         * If the bracket infos come from different configurations, this method will return false.
        */
        closes(other) {
            if (other['config'] !== this.config) {
                return false;
            }
            return this.openingBrackets.has(other);
        }
        closesColorized(other) {
            if (other['config'] !== this.config) {
                return false;
            }
            return this.openingColorizedBrackets.has(other);
        }
        getOpeningBrackets() {
            return [...this.openingBrackets];
        }
    }
    exports.ClosingBracketKind = ClosingBracketKind;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VCcmFja2V0c0NvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3N1cHBvcnRzL2xhbmd1YWdlQnJhY2tldHNDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRzs7O01BR0U7SUFDRixNQUFhLDZCQUE2QjtRQUl6QyxZQUNpQixVQUFrQixFQUNsQyxNQUE2QjtZQURiLGVBQVUsR0FBVixVQUFVLENBQVE7WUFHbEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDakYsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHNCQUFjLENBQUMsQ0FBQyxPQUFlLEVBQUUsRUFBRTtnQkFDbEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7Z0JBRTlDLE9BQU87b0JBQ04sSUFBSSxFQUFFLElBQUksa0JBQWtCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUM7b0JBQ3BELE9BQU87aUJBQ1AsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHNCQUFjLENBQUMsQ0FBQyxPQUFlLEVBQUUsRUFBRTtnQkFDbEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7Z0JBQzlDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7Z0JBQ3ZELE9BQU87b0JBQ04sSUFBSSxFQUFFLElBQUksa0JBQWtCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLENBQUM7b0JB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