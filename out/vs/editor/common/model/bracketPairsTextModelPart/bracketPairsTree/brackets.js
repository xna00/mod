define(["require", "exports", "vs/base/common/strings", "./ast", "./length", "./smallImmutableSet", "./tokenizer"], function (require, exports, strings_1, ast_1, length_1, smallImmutableSet_1, tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageAgnosticBracketTokens = exports.BracketTokens = void 0;
    class BracketTokens {
        static createFromLanguage(configuration, denseKeyProvider) {
            function getId(bracketInfo) {
                return denseKeyProvider.getKey(`${bracketInfo.languageId}:::${bracketInfo.bracketText}`);
            }
            const map = new Map();
            for (const openingBracket of configuration.bracketsNew.openingBrackets) {
                const length = (0, length_1.toLength)(0, openingBracket.bracketText.length);
                const openingTextId = getId(openingBracket);
                const bracketIds = smallImmutableSet_1.SmallImmutableSet.getEmpty().add(openingTextId, smallImmutableSet_1.identityKeyProvider);
                map.set(openingBracket.bracketText, new tokenizer_1.Token(length, 1 /* TokenKind.OpeningBracket */, openingTextId, bracketIds, ast_1.BracketAstNode.create(length, openingBracket, bracketIds)));
            }
            for (const closingBracket of configuration.bracketsNew.closingBrackets) {
                const length = (0, length_1.toLength)(0, closingBracket.bracketText.length);
                let bracketIds = smallImmutableSet_1.SmallImmutableSet.getEmpty();
                const closingBrackets = closingBracket.getOpeningBrackets();
                for (const bracket of closingBrackets) {
                    bracketIds = bracketIds.add(getId(bracket), smallImmutableSet_1.identityKeyProvider);
                }
                map.set(closingBracket.bracketText, new tokenizer_1.Token(length, 2 /* TokenKind.ClosingBracket */, getId(closingBrackets[0]), bracketIds, ast_1.BracketAstNode.create(length, closingBracket, bracketIds)));
            }
            return new BracketTokens(map);
        }
        constructor(map) {
            this.map = map;
            this.hasRegExp = false;
            this._regExpGlobal = null;
        }
        getRegExpStr() {
            if (this.isEmpty) {
                return null;
            }
            else {
                const keys = [...this.map.keys()];
                keys.sort();
                keys.reverse();
                return keys.map(k => prepareBracketForRegExp(k)).join('|');
            }
        }
        /**
         * Returns null if there is no such regexp (because there are no brackets).
        */
        get regExpGlobal() {
            if (!this.hasRegExp) {
                const regExpStr = this.getRegExpStr();
                this._regExpGlobal = regExpStr ? new RegExp(regExpStr, 'gi') : null;
                this.hasRegExp = true;
            }
            return this._regExpGlobal;
        }
        getToken(value) {
            return this.map.get(value.toLowerCase());
        }
        findClosingTokenText(openingBracketIds) {
            for (const [closingText, info] of this.map) {
                if (info.kind === 2 /* TokenKind.ClosingBracket */ && info.bracketIds.intersects(openingBracketIds)) {
                    return closingText;
                }
            }
            return undefined;
        }
        get isEmpty() {
            return this.map.size === 0;
        }
    }
    exports.BracketTokens = BracketTokens;
    function prepareBracketForRegExp(str) {
        let escaped = (0, strings_1.escapeRegExpCharacters)(str);
        // These bracket pair delimiters start or end with letters
        // see https://github.com/microsoft/vscode/issues/132162 https://github.com/microsoft/vscode/issues/150440
        if (/^[\w ]+/.test(str)) {
            escaped = `\\b${escaped}`;
        }
        if (/[\w ]+$/.test(str)) {
            escaped = `${escaped}\\b`;
        }
        return escaped;
    }
    class LanguageAgnosticBracketTokens {
        constructor(denseKeyProvider, getLanguageConfiguration) {
            this.denseKeyProvider = denseKeyProvider;
            this.getLanguageConfiguration = getLanguageConfiguration;
            this.languageIdToBracketTokens = new Map();
        }
        didLanguageChange(languageId) {
            // Report a change whenever the language configuration updates.
            return this.languageIdToBracketTokens.has(languageId);
        }
        getSingleLanguageBracketTokens(languageId) {
            let singleLanguageBracketTokens = this.languageIdToBracketTokens.get(languageId);
            if (!singleLanguageBracketTokens) {
                singleLanguageBracketTokens = BracketTokens.createFromLanguage(this.getLanguageConfiguration(languageId), this.denseKeyProvider);
                this.languageIdToBracketTokens.set(languageId, singleLanguageBracketTokens);
            }
            return singleLanguageBracketTokens;
        }
        getToken(value, languageId) {
            const singleLanguageBracketTokens = this.getSingleLanguageBracketTokens(languageId);
            return singleLanguageBracketTokens.getToken(value);
        }
    }
    exports.LanguageAgnosticBracketTokens = LanguageAgnosticBracketTokens;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNUcmVlL2JyYWNrZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFZQSxNQUFhLGFBQWE7UUFDekIsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGFBQTRDLEVBQUUsZ0JBQTBDO1lBQ2pILFNBQVMsS0FBSyxDQUFDLFdBQXdCO2dCQUN0QyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxVQUFVLE1BQU0sV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDMUYsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBQ3JDLEtBQUssTUFBTSxjQUFjLElBQUksYUFBYSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDeEUsTUFBTSxNQUFNLEdBQUcsSUFBQSxpQkFBUSxFQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sVUFBVSxHQUFHLHFDQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsdUNBQW1CLENBQUMsQ0FBQztnQkFDeEYsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksaUJBQUssQ0FDNUMsTUFBTSxvQ0FFTixhQUFhLEVBQ2IsVUFBVSxFQUNWLG9CQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQ3pELENBQUMsQ0FBQztZQUNKLENB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