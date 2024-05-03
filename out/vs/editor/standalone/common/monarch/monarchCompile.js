/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/standalone/common/monarch/monarchCommon"], function (require, exports, monarchCommon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compile = compile;
    /*
     * Type helpers
     *
     * Note: this is just for sanity checks on the JSON description which is
     * helpful for the programmer. No checks are done anymore once the lexer is
     * already 'compiled and checked'.
     *
     */
    function isArrayOf(elemType, obj) {
        if (!obj) {
            return false;
        }
        if (!(Array.isArray(obj))) {
            return false;
        }
        for (const el of obj) {
            if (!(elemType(el))) {
                return false;
            }
        }
        return true;
    }
    function bool(prop, defValue) {
        if (typeof prop === 'boolean') {
            return prop;
        }
        return defValue;
    }
    function string(prop, defValue) {
        if (typeof (prop) === 'string') {
            return prop;
        }
        return defValue;
    }
    function arrayToHash(array) {
        const result = {};
        for (const e of array) {
            result[e] = true;
        }
        return result;
    }
    function createKeywordMatcher(arr, caseInsensitive = false) {
        if (caseInsensitive) {
            arr = arr.map(function (x) { return x.toLowerCase(); });
        }
        const hash = arrayToHash(arr);
        if (caseInsensitive) {
            return function (word) {
                return hash[word.toLowerCase()] !== undefined && hash.hasOwnProperty(word.toLowerCase());
            };
        }
        else {
            return function (word) {
                return hash[word] !== undefined && hash.hasOwnProperty(word);
            };
        }
    }
    function compileRegExp(lexer, str, handleSn) {
        // @@ must be interpreted as a literal @, so we replace all occurences of @@ with a placeholder character
        str = str.replace(/@@/g, `\x01`);
        let n = 0;
        let hadExpansion;
        do {
            hadExpansion = false;
            str = str.replace(/@(\w+)/g, function (s, attr) {
                hadExpansion = true;
                let sub = '';
                if (typeof (lexer[attr]) === 'string') {
                    sub = lexer[attr];
                }
                else if (lexer[attr] && lexer[attr] instanceof RegExp) {
                    sub = lexer[attr].source;
                }
                else {
                    if (lexer[attr] === undefined) {
                        throw monarchCommon.createError(lexer, 'language definition does not contain attribute \'' + attr + '\', used at: ' + str);
                    }
                    else {
                        throw monarchCommon.createError(lexer, 'attribute reference \'' + attr + '\' must be a string, used at: ' + str);
                    }
                }
                return (monarchCommon.empty(sub) ? '' : '(?:' + sub + ')');
            });
            n++;
        } while (hadExpansion && n < 5);
        // handle escaped @@
        str = str.replace(/\x01/g, '@');
        const flags = (lexer.ignoreCase ? 'i' : '') + (lexer.unicode ? 'u' : '');
        // handle $Sn
        if (handleSn) {
            const match = str.match(/\$[sS](\d\d?)/g);
            if (match) {
                let lastState = null;
                let lastRegEx = null;
                return (state) => {
                    if (lastRegEx && lastState === state) {
                        return lastRegEx;
                    }
                    lastState = state;
                    lastRegEx = new RegExp(monarchCommon.substituteMatchesRe(lexer, str, state), flags);
                    return lastRegEx;
                };
            }
        }
        return new RegExp(str, flags);
    }
    /**
     * Compiles guard functions for case matches.
     * This compiles 'cases' attributes into efficient match functions.
     *
     */
    function selectScrutinee(id, matches, state, num) {
        if (num < 0) {
            return id;
        }
        if (num < matches.length) {
            return matches[num];
        }
        if (num >= 100) {
            num = num - 100;
            const parts = state.split('.');
            parts.unshift(state);
            if (num < parts.length) {
                return parts[num];
            }
        }
        return null;
    }
    function createGuard(lexer, ruleName, tkey, val) {
        // get the scrutinee and pattern
        let scrut = -1; // -1: $!, 0-99: $n, 100+n: $Sn
        let oppat = tkey;
        let matches = tkey.match(/^\$(([sS]?)(\d\d?)|#)(.*)$/);
        if (matches) {
            if (matches[3]) { // if digits
                scrut = parseInt(matches[3]);
                if (matches[2]) {
                    scrut = scrut + 100; // if [sS] present
                }
            }
            oppat = matches[4];
        }
        // get operator
        let op = '~';
        let pat = oppat;
        if (!oppat || oppat.length === 0) {
            op = '!=';
            pat = '';
        }
        else if (/^\w*$/.test(pat)) { // just a word
            op = '==';
        }
        else {
            matches = oppat.match(/^(@|!@|~|!~|==|!=)(.*)$/);
            if (matches) {
                op = matches[1];
                pat = matches[2];
            }
        }
        // set the tester function
        let tester;
        // special case a regexp that matches just words
        if ((op === '~' || op === '!~') && /^(\w|\|)*$/.test(pat)) {
            const inWords = createKeywordMatcher(pat.split('|'), lexer.ignoreCase);
            tester = function (s) { return (op === '~' ? inWords(s) : !inWords(s)); };
        }
        else if (op === '@' || op === '!@') {
            const words = lexer[pat];
            if (!words) {
                throw monarchCommon.createError(lexer, 'the @ match target \'' + pat + '\' is not defined, in rule: ' + ruleName);
            }
            if (!(isArrayOf(function (elem) { return (typeof (elem) === 'string'); }, words))) {
                throw monarchCommon.createError(lexer, 'the @ match target \'' + pat + '\' must be an array of strings, in rule: ' + ruleName);
            }
            const inWords = createKeywordMatcher(words, lexer.ignoreCase);
            tester = function (s) { return (op === '@' ? inWords(s) : !inWords(s)); };
        }
        else if (op === '~' || op === '!~') {
            if (pat.indexOf('$') < 0) {
                // precompile regular expression
                const re = compileRegExp(lexer, '^' + pat + '$', false);
                tester = function (s) { return (op === '~' ? re.test(s) : !re.test(s)); };
            }
            else {
                tester = function (s, id, matches, state) {
                    const re = compileRegExp(lexer, '^' + monarchCommon.substituteMatches(lexer, pat, id, matches, state) + '$', false);
                    return re.test(s);
                };
            }
        }
        else { // if (op==='==' || op==='!=') {
            if (pat.indexOf('$') < 0) {
                const patx = monarchCommon.fixCase(lexer, pat);
                tester = function (s) { return (op === '==' ? s === patx : s !== patx); };
            }
            else {
                const patx = monarchCommon.fixCase(lexer, pat);
                tester = function (s, id, matches, state, eos) {
                    const patexp = monarchCommon.substituteMatches(lexer, patx, id, matches, state);
                    return (op === '==' ? s === patexp : s !== patexp);
                };
            }
        }
        // return the branch object
        if (scrut === -1) {
            return {
                name: tkey, value: val, test: function (id, matches, state, eos) {
                    return tester(id, id, matches, state, eos);
                }
            };
        }
        else {
            return {
                name: tkey, value: val, test: function (id, matches, state, eos) {
                    const scrutinee = selectScrutinee(id, matches, state, scrut);
                    return tester(!scrutinee ? '' : scrutinee, id, matches, state, eos);
                }
            };
        }
    }
    /**
     * Compiles an action: i.e. optimize regular expressions and case matches
     * and do many sanity checks.
     *
     * This is called only during compilation but if the lexer definition
     * contains user functions as actions (which is usually not allowed), then this
     * may be called during lexing. It is important therefore to compile common cases efficiently
     */
    function compileAction(lexer, ruleName, action) {
        if (!action) {
            return { token: '' };
        }
        else if (typeof (action) === 'string') {
            return action; // { token: action };
        }
        else if (action.token || action.token === '') {
            if (typeof (action.token) !== 'string') {
                throw monarchCommon.createError(lexer, 'a \'token\' attribute must be of type string, in rule: ' + ruleName);
            }
            else {
                // only copy specific typed fields (only happens once during compile Lexer)
                const newAction = { token: action.token };
                if (action.token.indexOf('$') >= 0) {
                    newAction.tokenSubst = true;
                }
                if (typeof (action.bracket) === 'string') {
                    if (action.bracket === '@open') {
                        newAction.bracket = 1 /* monarchCommon.MonarchBracket.Open */;
                    }
                    else if (action.bracket === '@close') {
                        newAction.bracket = -1 /* monarchCommon.MonarchBracket.Close */;
                    }
                    else {
                        throw monarchCommon.createError(lexer, 'a \'bracket\' attribute must be either \'@open\' or \'@close\', in rule: ' + ruleName);
                    }
                }
                if (action.next) {
                    if (typeof (action.next) !== 'string') {
                        throw monarchCommon.createError(lexer, 'the next state must be a string value in rule: ' + ruleName);
                    }
                    else {
                        let next = action.next;
                        if (!/^(@pop|@push|@popall)$/.test(next)) {
                            if (next[0] === '@') {
                                next = next.substr(1); // peel off starting @ sign
                            }
                            if (next.indexOf('$') < 0) { // no dollar substitution, we can check if the state exists
                                if (!monarchCommon.stateExists(lexer, monarchCommon.substituteMatches(lexer, next, '', [], ''))) {
                                    throw monarchCommon.createError(lexer, 'the next state \'' + action.next + '\' is not defined in rule: ' + ruleName);
                                }
                            }
                        }
                        newAction.next = next;
                    }
                }
                if (typeof (action.goBack) === 'number') {
                    newAction.goBack = action.goBack;
                }
                if (typeof (action.switchTo) === 'string') {
                    newAction.switchTo = action.switchTo;
                }
                if (typeof (action.log) === 'string') {
                    newAction.log = action.log;
                }
                if (typeof (action.nextEmbedded) === 'string') {
                    newAction.nextEmbedded = action.nextEmbedded;
                    lexer.usesEmbedded = true;
                }
                return newAction;
            }
        }
        else if (Array.isArray(action)) {
            const results = [];
            for (let i = 0, len = action.length; i < len; i++) {
                results[i] = compileAction(lexer, ruleName, action[i]);
            }
            return { group: results };
        }
        else if (action.cases) {
            // build an array of test cases
            const cases = [];
            // for each case, push a test function and result value
            for (const tkey in action.cases) {
                if (action.cases.hasOwnProperty(tkey)) {
                    const val = compileAction(lexer, ruleName, action.cases[tkey]);
                    // what kind of case
                    if (tkey === '@default' || tkey === '@' || tkey === '') {
                        cases.push({ test: undefined, value: val, name: tkey });
                    }
                    else if (tkey === '@eos') {
                        cases.push({ test: function (id, matches, state, eos) { return eos; }, value: val, name: tkey });
                    }
                    else {
                        cases.push(createGuard(lexer, ruleName, tkey, val)); // call separate function to avoid local variable capture
                    }
                }
            }
            // create a matching function
            const def = lexer.defaultToken;
            return {
                test: function (id, matches, state, eos) {
                    for (const _case of cases) {
                        const didmatch = (!_case.test || _case.test(id, matches, state, eos));
                        if (didmatch) {
                            return _case.value;
                        }
                    }
                    return def;
                }
            };
        }
        else {
            throw monarchCommon.createError(lexer, 'an action must be a string, an object with a \'token\' or \'cases\' attribute, or an array of actions; in rule: ' + ruleName);
        }
    }
    /**
     * Helper class for creating matching rules
     */
    class Rule {
        constructor(name) {
            this.regex = new RegExp('');
            this.action = { token: '' };
            this.matchOnlyAtLineStart = false;
            this.name = '';
            this.name = name;
        }
        setRegex(lexer, re) {
            let sregex;
            if (typeof (re) === 'string') {
                sregex = re;
            }
            else if (re instanceof RegExp) {
                sregex = re.source;
            }
            else {
                throw monarchCommon.createError(lexer, 'rules must start with a match string or regular expression: ' + this.name);
            }
            this.matchOnlyAtLineStart = (sregex.length > 0 && sregex[0] === '^');
            this.name = this.name + ': ' + sregex;
            this.regex = compileRegExp(lexer, '^(?:' + (this.matchOnlyAtLineStart ? sregex.substr(1) : sregex) + ')', true);
        }
        setAction(lexer, act) {
            this.action = compileAction(lexer, this.name, act);
        }
        resolveRegex(state) {
            if (this.regex instanceof RegExp) {
                return this.regex;
            }
            else {
                return this.regex(state);
            }
        }
    }
    /**
     * Compiles a json description function into json where all regular expressions,
     * case matches etc, are compiled and all include rules are expanded.
     * We also compile the bracket definitions, supply defaults, and do many sanity checks.
     * If the 'jsonStrict' parameter is 'false', we allow at certain locations
     * regular expression objects and functions that get called during lexing.
     * (Currently we have no samples that need this so perhaps we should always have
     * jsonStrict to true).
     */
    function compile(languageId, json) {
        if (!json || typeof (json) !== 'object') {
            throw new Error('Monarch: expecting a language definition object');
        }
        // Create our lexer
        const lexer = {};
        lexer.languageId = languageId;
        lexer.includeLF = bool(json.includeLF, false);
        lexer.noThrow = false; // raise exceptions during compilation
        lexer.maxStack = 100;
        // Set standard fields: be defensive about types
        lexer.start = (typeof json.start === 'string' ? json.start : null);
        lexer.ignoreCase = bool(json.ignoreCase, false);
        lexer.unicode = bool(json.unicode, false);
        lexer.tokenPostfix = string(json.tokenPostfix, '.' + lexer.languageId);
        lexer.defaultToken = string(json.defaultToken, 'source');
        lexer.usesEmbedded = false; // becomes true if we find a nextEmbedded action
        // For calling compileAction later on
        const lexerMin = json;
        lexerMin.languageId = languageId;
        lexerMin.includeLF = lexer.includeLF;
        lexerMin.ignoreCase = lexer.ignoreCase;
        lexerMin.unicode = lexer.unicode;
        lexerMin.noThrow = lexer.noThrow;
        lexerMin.usesEmbedded = lexer.usesEmbedded;
        lexerMin.stateNames = json.tokenizer;
        lexerMin.defaultToken = lexer.defaultToken;
        // Compile an array of rules into newrules where RegExp objects are created.
        function addRules(state, newrules, rules) {
            for (const rule of rules) {
                let include = rule.include;
                if (include) {
                    if (typeof (include) !== 'string') {
                        throw monarchCommon.createError(lexer, 'an \'include\' attribute must be a string at: ' + state);
                    }
                    if (include[0] === '@') {
                        include = include.substr(1); // peel off starting @
                    }
                    if (!json.tokenizer[include]) {
                        throw monarchCommon.createError(lexer, 'include target \'' + include + '\' is not defined at: ' + state);
                    }
                    addRules(state + '.' + include, newrules, json.tokenizer[include]);
                }
                else {
                    const newrule = new Rule(state);
                    // Set up new rule attributes
                    if (Array.isArray(rule) && rule.length >= 1 && rule.length <= 3) {
                        newrule.setRegex(lexerMin, rule[0]);
                        if (rule.length >= 3) {
                            if (typeof (rule[1]) === 'string') {
                                newrule.setAction(lexerMin, { token: rule[1], next: rule[2] });
                            }
                            else if (typeof (rule[1]) === 'object') {
                                const rule1 = rule[1];
                                rule1.next = rule[2];
                                newrule.setAction(lexerMin, rule1);
                            }
                            else {
                                throw monarchCommon.createError(lexer, 'a next state as the last element of a rule can only be given if the action is either an object or a string, at: ' + state);
                            }
                        }
                        else {
                            newrule.setAction(lexerMin, rule[1]);
                        }
                    }
                    else {
                        if (!rule.regex) {
                            throw monarchCommon.createError(lexer, 'a rule must either be an array, or an object with a \'regex\' or \'include\' field at: ' + state);
                        }
                        if (rule.name) {
                            if (typeof rule.name === 'string') {
                                newrule.name = rule.name;
                            }
                        }
                        if (rule.matchOnlyAtStart) {
                            newrule.matchOnlyAtLineStart = bool(rule.matchOnlyAtLineStart, false);
                        }
                        newrule.setRegex(lexerMin, rule.regex);
                        newrule.setAction(lexerMin, rule.action);
                    }
                    newrules.push(newrule);
                }
            }
        }
        // compile the tokenizer rules
        if (!json.tokenizer || typeof (json.tokenizer) !== 'object') {
            throw monarchCommon.createError(lexer, 'a language definition must define the \'tokenizer\' attribute as an object');
        }
        lexer.tokenizer = [];
        for (const key in json.tokenizer) {
            if (json.tokenizer.hasOwnProperty(key)) {
                if (!lexer.start) {
                    lexer.start = key;
                }
                const rules = json.tokenizer[key];
                lexer.tokenizer[key] = new Array();
                addRules('tokenizer.' + key, lexer.tokenizer[key], rules);
            }
        }
        lexer.usesEmbedded = lexerMin.usesEmbedded; // can be set during compileAction
        // Set simple brackets
        if (json.brackets) {
            if (!(Array.isArray(json.brackets))) {
                throw monarchCommon.createError(lexer, 'the \'brackets\' attribute must be defined as an array');
            }
        }
        else {
            json.brackets = [
                { open: '{', close: '}', token: 'delimiter.curly' },
                { open: '[', close: ']', token: 'delimiter.square' },
                { open: '(', close: ')', token: 'delimiter.parenthesis' },
                { open: '<', close: '>', token: 'delimiter.angle' }
            ];
        }
        const brackets = [];
        for (const el of json.brackets) {
            let desc = el;
            if (desc && Array.isArray(desc) && desc.length === 3) {
                desc = { token: desc[2], open: desc[0], close: desc[1] };
            }
            if (desc.open === desc.close) {
                throw monarchCommon.createError(lexer, 'open and close brackets in a \'brackets\' attribute must be different: ' + desc.open +
                    '\n hint: use the \'bracket\' attribute if matching on equal brackets is required.');
            }
            if (typeof desc.open === 'string' && typeof desc.token === 'string' && typeof desc.close === 'string') {
                brackets.push({
                    token: desc.token + lexer.tokenPostfix,
                    open: monarchCommon.fixCase(lexer, desc.open),
                    close: monarchCommon.fixCase(lexer, desc.close)
                });
            }
            else {
                throw monarchCommon.createError(lexer, 'every element in the \'brackets\' array must be a \'{open,close,token}\' object or array');
            }
        }
        lexer.brackets = brackets;
        // Disable throw so the syntax highlighter goes, no matter what
        lexer.noThrow = true;
        return lexer;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYXJjaENvbXBpbGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2NvbW1vbi9tb25hcmNoL21vbmFyY2hDb21waWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMmFoRywwQkF5SkM7SUExakJEOzs7Ozs7O09BT0c7SUFFSCxTQUFTLFNBQVMsQ0FBQyxRQUE2QixFQUFFLEdBQVE7UUFDekQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1YsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDM0IsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsS0FBSyxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNyQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxJQUFJLENBQUMsSUFBUyxFQUFFLFFBQWlCO1FBQ3pDLElBQUksT0FBTyxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDakIsQ0FBQztJQUVELFNBQVMsTUFBTSxDQUFDLElBQVMsRUFBRSxRQUFnQjtRQUMxQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNqQixDQUFD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