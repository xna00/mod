/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MonarchBracket = void 0;
    exports.isFuzzyActionArr = isFuzzyActionArr;
    exports.isFuzzyAction = isFuzzyAction;
    exports.isString = isString;
    exports.isIAction = isIAction;
    exports.empty = empty;
    exports.fixCase = fixCase;
    exports.sanitize = sanitize;
    exports.log = log;
    exports.createError = createError;
    exports.substituteMatches = substituteMatches;
    exports.substituteMatchesRe = substituteMatchesRe;
    exports.findRules = findRules;
    exports.stateExists = stateExists;
    /*
     * This module exports common types and functionality shared between
     * the Monarch compiler that compiles JSON to ILexer, and the Monarch
     * Tokenizer (that highlights at runtime)
     */
    /*
     * Type definitions to be used internally to Monarch.
     * Inside monarch we use fully typed definitions and compiled versions of the more abstract JSON descriptions.
     */
    var MonarchBracket;
    (function (MonarchBracket) {
        MonarchBracket[MonarchBracket["None"] = 0] = "None";
        MonarchBracket[MonarchBracket["Open"] = 1] = "Open";
        MonarchBracket[MonarchBracket["Close"] = -1] = "Close";
    })(MonarchBracket || (exports.MonarchBracket = MonarchBracket = {}));
    function isFuzzyActionArr(what) {
        return (Array.isArray(what));
    }
    function isFuzzyAction(what) {
        return !isFuzzyActionArr(what);
    }
    function isString(what) {
        return (typeof what === 'string');
    }
    function isIAction(what) {
        return !isString(what);
    }
    // Small helper functions
    /**
     * Is a string null, undefined, or empty?
     */
    function empty(s) {
        return (s ? false : true);
    }
    /**
     * Puts a string to lower case if 'ignoreCase' is set.
     */
    function fixCase(lexer, str) {
        return (lexer.ignoreCase && str ? str.toLowerCase() : str);
    }
    /**
     * Ensures there are no bad characters in a CSS token class.
     */
    function sanitize(s) {
        return s.replace(/[&<>'"_]/g, '-'); // used on all output token CSS classes
    }
    // Logging
    /**
     * Logs a message.
     */
    function log(lexer, msg) {
        console.log(`${lexer.languageId}: ${msg}`);
    }
    // Throwing errors
    function createError(lexer, msg) {
        return new Error(`${lexer.languageId}: ${msg}`);
    }
    // Helper functions for rule finding and substitution
    /**
     * substituteMatches is used on lexer strings and can substitutes predefined patterns:
     * 		$$  => $
     * 		$#  => id
     * 		$n  => matched entry n
     * 		@attr => contents of lexer[attr]
     *
     * See documentation for more info
     */
    function substituteMatches(lexer, str, id, matches, state) {
        const re = /\$((\$)|(#)|(\d\d?)|[sS](\d\d?)|@(\w+))/g;
        let stateMatches = null;
        return str.replace(re, function (full, sub, dollar, hash, n, s, attr, ofs, total) {
            if (!empty(dollar)) {
                return '$'; // $$
            }
            if (!empty(hash)) {
                return fixCase(lexer, id); // default $#
            }
            if (!empty(n) && n < matches.length) {
                return fixCase(lexer, matches[n]); // $n
            }
            if (!empty(attr) && lexer && typeof (lexer[attr]) === 'string') {
                return lexer[attr]; //@attribute
            }
            if (stateMatches === null) { // split state on demand
                stateMatches = state.split('.');
                stateMatches.unshift(state);
            }
            if (!empty(s) && s < stateMatches.length) {
                return fixCase(lexer, stateMatches[s]); //$Sn
            }
            return '';
        });
    }
    /**
     * substituteMatchesRe is used on lexer regex rules and can substitutes predefined patterns:
     * 		$Sn => n'th part of state
     *
     */
    function substituteMatchesRe(lexer, str, state) {
        const re = /\$[sS](\d\d?)/g;
        let stateMatches = null;
        return str.replace(re, function (full, s) {
            if (stateMatches === null) { // split state on demand
                stateMatches = state.split('.');
                stateMatches.unshift(state);
            }
            if (!empty(s) && s < stateMatches.length) {
                return fixCase(lexer, stateMatches[s]); //$Sn
            }
            return '';
        });
    }
    /**
     * Find the tokenizer rules for a specific state (i.e. next action)
     */
    function findRules(lexer, inState) {
        let state = inState;
        while (state && state.length > 0) {
            const rules = lexer.tokenizer[state];
            if (rules) {
                return rules;
            }
            const idx = state.lastIndexOf('.');
            if (idx < 0) {
                state = null; // no further parent
            }
            else {
                state = state.substr(0, idx);
            }
        }
        return null;
    }
    /**
     * Is a certain state defined? In contrast to 'findRules' this works on a ILexerMin.
     * This is used during compilation where we may know the defined states
     * but not yet whether the corresponding rules are correct.
     */
    function stateExists(lexer, inState) {
        let state = inState;
        while (state && state.length > 0) {
            const exist = lexer.stateNames[state];
            if (exist) {
                return true;
            }
            const idx = state.lastIndexOf('.');
            if (idx < 0) {
                state = null; // no further parent
            }
            else {
                state = state.substr(0, idx);
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYXJjaENvbW1vbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvY29tbW9uL21vbmFyY2gvbW9uYXJjaENvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrRGhHLDRDQUVDO0lBRUQsc0NBRUM7SUFFRCw0QkFFQztJQUVELDhCQUVDO0lBdUNELHNCQUVDO0lBS0QsMEJBRUM7SUFLRCw0QkFFQztJQU9ELGtCQUVDO0lBSUQsa0NBRUM7SUFhRCw4Q0F5QkM7SUFPRCxrREFhQztJQUtELDhCQWdCQztJQU9ELGtDQWdCQztJQTFPRDs7OztPQUlHO0lBRUg7OztPQUdHO0lBRUgsSUFBa0IsY0FJakI7SUFKRCxXQUFrQixjQUFjO1FBQy9CLG1EQUFRLENBQUE7UUFDUixtREFBUSxDQUFBO1FBQ1Isc0RBQVUsQ0FBQTtJQUNYLENBQUMsRUFKaUIsY0FBYyw4QkFBZCxjQUFjLFFBSS9CO0lBaUNELFNBQWdCLGdCQUFnQixDQUFDLElBQWlDO1FBQ2pFLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELFNBQWdCLGFBQWEsQ0FBQyxJQUFpQztRQUM5RCxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELFNBQWdCLFFBQVEsQ0FBQyxJQUFpQjtRQUN6QyxPQUFPLENBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELFNBQWdCLFNBQVMsQ0FBQyxJQUFpQjtRQUMxQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFrQ0QseUJBQXlCO0lBRXpCOztPQUVHO0lBQ0gsU0FBZ0IsS0FBSyxDQUFD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