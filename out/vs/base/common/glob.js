/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/extpath", "vs/base/common/map", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings"], function (require, exports, arrays_1, async_1, extpath_1, map_1, path_1, platform_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GLOB_SPLIT = exports.GLOBSTAR = void 0;
    exports.getEmptyExpression = getEmptyExpression;
    exports.splitGlobAware = splitGlobAware;
    exports.match = match;
    exports.parse = parse;
    exports.isRelativePattern = isRelativePattern;
    exports.getBasenameTerms = getBasenameTerms;
    exports.getPathTerms = getPathTerms;
    exports.patternsEquals = patternsEquals;
    function getEmptyExpression() {
        return Object.create(null);
    }
    exports.GLOBSTAR = '**';
    exports.GLOB_SPLIT = '/';
    const PATH_REGEX = '[/\\\\]'; // any slash or backslash
    const NO_PATH_REGEX = '[^/\\\\]'; // any non-slash and non-backslash
    const ALL_FORWARD_SLASHES = /\//g;
    function starsToRegExp(starCount, isLastPattern) {
        switch (starCount) {
            case 0:
                return '';
            case 1:
                return `${NO_PATH_REGEX}*?`; // 1 star matches any number of characters except path separator (/ and \) - non greedy (?)
            default:
                // Matches:  (Path Sep OR Path Val followed by Path Sep) 0-many times except when it's the last pattern
                //           in which case also matches (Path Sep followed by Path Val)
                // Group is non capturing because we don't need to capture at all (?:...)
                // Overall we use non-greedy matching because it could be that we match too much
                return `(?:${PATH_REGEX}|${NO_PATH_REGEX}+${PATH_REGEX}${isLastPattern ? `|${PATH_REGEX}${NO_PATH_REGEX}+` : ''})*?`;
        }
    }
    function splitGlobAware(pattern, splitChar) {
        if (!pattern) {
            return [];
        }
        const segments = [];
        let inBraces = false;
        let inBrackets = false;
        let curVal = '';
        for (const char of pattern) {
            switch (char) {
                case splitChar:
                    if (!inBraces && !inBrackets) {
                        segments.push(curVal);
                        curVal = '';
                        continue;
                    }
                    break;
                case '{':
                    inBraces = true;
                    break;
                case '}':
                    inBraces = false;
                    break;
                case '[':
                    inBrackets = true;
                    break;
                case ']':
                    inBrackets = false;
                    break;
            }
            curVal += char;
        }
        // Tail
        if (curVal) {
            segments.push(curVal);
        }
        return segments;
    }
    function parseRegExp(pattern) {
        if (!pattern) {
            return '';
        }
        let regEx = '';
        // Split up into segments for each slash found
        const segments = splitGlobAware(pattern, exports.GLOB_SPLIT);
        // Special case where we only have globstars
        if (segments.every(segment => segment === exports.GLOBSTAR)) {
            regEx = '.*';
        }
        // Build regex over segments
        else {
            let previousSegmentWasGlobStar = false;
            segments.forEach((segment, index) => {
                // Treat globstar specially
                if (segment === exports.GLOBSTAR) {
                    // if we have more than one globstar after another, just ignore it
                    if (previousSegmentWasGlobStar) {
                        return;
                    }
                    regEx += starsToRegExp(2, index === segments.length - 1);
                }
                // Anything else, not globstar
                else {
                    // States
                    let inBraces = false;
                    let braceVal = '';
                    let inBrackets = false;
                    let bracketVal = '';
                    for (const char of segment) {
                        // Support brace expansion
                        if (char !== '}' && inBraces) {
                            braceVal += char;
                            continue;
                        }
                        // Support brackets
                        if (inBrackets && (char !== ']' || !bracketVal) /* ] is literally only allowed as first character in brackets to match it */) {
                            let res;
                            // range operator
                            if (char === '-') {
                                res = char;
                            }
                            // negation operator (only valid on first index in bracket)
                            else if ((char === '^' || char === '!') && !bracketVal) {
                                res = '^';
                            }
                            // glob split matching is not allowed within character ranges
                            // see http://man7.org/linux/man-pages/man7/glob.7.html
                            else if (char === exports.GLOB_SPLIT) {
                                res = '';
                            }
                            // anything else gets escaped
                            else {
                                res = (0, strings_1.escapeRegExpCharacters)(char);
                            }
                            bracketVal += res;
                            continue;
                        }
                        switch (char) {
                            case '{':
                                inBraces = true;
                                continue;
                            case '[':
                                inBrackets = true;
                                continue;
                            case '}': {
                                const choices = splitGlobAware(braceVal, ',');
                                // Converts {foo,bar} => [foo|bar]
                                const braceRegExp = `(?:${choices.map(choice => parseRegExp(choice)).join('|')})`;
                                regEx += braceRegExp;
                                inBraces = false;
                                braceVal = '';
                                break;
                            }
                            case ']': {
                                regEx += ('[' + bracketVal + ']');
                                inBrackets = false;
                                bracketVal = '';
                                break;
                            }
                            case '?':
                                regEx += NO_PATH_REGEX; // 1 ? matches any single character except path separator (/ and \)
                                continue;
                            case '*':
                                regEx += starsToRegExp(1);
                                continue;
                            default:
                                regEx += (0, strings_1.escapeRegExpCharacters)(char);
                        }
                    }
                    // Tail: Add the slash we had split on if there is more to
                    // come and the remaining pattern is not a globstar
                    // For example if pattern: some/**/*.js we want the "/" after
                    // some to be included in the RegEx to prevent a folder called
                    // "something" to match as well.
                    if (index < segments.length - 1 && // more segments to come after this
                        (segments[index + 1] !== exports.GLOBSTAR || // next segment is not **, or...
                            index + 2 < segments.length // ...next segment is ** but there is more segments after that
                        )) {
                        regEx += PATH_REGEX;
                    }
                }
                // update globstar state
                previousSegmentWasGlobStar = (segment === exports.GLOBSTAR);
            });
        }
        return regEx;
    }
    // regexes to check for trivial glob patterns that just check for String#endsWith
    const T1 = /^\*\*\/\*\.[\w\.-]+$/; // **/*.something
    const T2 = /^\*\*\/([\w\.-]+)\/?$/; // **/something
    const T3 = /^{\*\*\/\*?[\w\.-]+\/?(,\*\*\/\*?[\w\.-]+\/?)*}$/; // {**/*.something,**/*.else} or {**/package.json,**/project.json}
    const T3_2 = /^{\*\*\/\*?[\w\.-]+(\/(\*\*)?)?(,\*\*\/\*?[\w\.-]+(\/(\*\*)?)?)*}$/; // Like T3, with optional trailing /**
    const T4 = /^\*\*((\/[\w\.-]+)+)\/?$/; // **/something/else
    const T5 = /^([\w\.-]+(\/[\w\.-]+)*)\/?$/; // something/else
    const CACHE = new map_1.LRUCache(10000); // bounded to 10000 elements
    const FALSE = function () {
        return false;
    };
    const NULL = function () {
        return null;
    };
    function parsePattern(arg1, options) {
        if (!arg1) {
            return NULL;
        }
        // Handle relative patterns
        let pattern;
        if (typeof arg1 !== 'string') {
            pattern = arg1.pattern;
        }
        else {
            pattern = arg1;
        }
        // Whitespace trimming
        pattern = pattern.trim();
        // Check cache
        const patternKey = `${pattern}_${!!options.trimForExclusions}`;
        let parsedPattern = CACHE.get(patternKey);
        if (parsedPattern) {
            return wrapRelativePattern(parsedPattern, arg1);
        }
        // Check for Trivials
        let match;
        if (T1.test(pattern)) {
            parsedPattern = trivia1(pattern.substr(4), pattern); // common pattern: **/*.txt just need endsWith check
        }
        else if (match = T2.exec(trimForExclusions(pattern, options))) { // common pattern: **/some.txt just need basename check
            parsedPattern = trivia2(match[1], pattern);
        }
        else if ((options.trimForExclusions ? T3_2 : T3).test(pattern)) { // repetition of common patterns (see above) {**/*.txt,**/*.png}
            parsedPattern = trivia3(pattern, options);
        }
        else if (match = T4.exec(trimForExclusions(pattern, options))) { // common pattern: **/something/else just need endsWith check
            parsedPattern = trivia4and5(match[1].substr(1), pattern, true);
        }
        else if (match = T5.exec(trimForExclusions(pattern, options))) { // common pattern: something/else just need equals check
            parsedPattern = trivia4and5(match[1], pattern, false);
        }
        // Otherwise convert to pattern
        else {
            parsedPattern = toRegExp(pattern);
        }
        // Cache
        CACHE.set(patternKey, parsedPattern);
        return wrapRelativePattern(parsedPattern, arg1);
    }
    function wrapRelativePattern(parsedPattern, arg2) {
        if (typeof arg2 === 'string') {
            return parsedPattern;
        }
        const wrappedPattern = function (path, basename) {
            if (!(0, extpath_1.isEqualOrParent)(path, arg2.base, !platform_1.isLinux)) {
                // skip glob matching if `base` is not a parent of `path`
                return null;
            }
            // Given we have checked `base` being a parent of `path`,
            // we can now remove the `base` portion of the `path`
            // and only match on the remaining path components
            // For that we try to extract the portion of the `path`
            // that comes after the `base` portion. We have to account
            // for the fact that `base` might end in a path separator
            // (https://github.com/microsoft/vscode/issues/162498)
            return parsedPattern((0, strings_1.ltrim)(path.substr(arg2.base.length), path_1.sep), basename);
        };
        // Make sure to preserve associated metadata
        wrappedPattern.allBasenames = parsedPattern.allBasenames;
        wrappedPattern.allPaths = parsedPattern.allPaths;
        wrappedPattern.basenames = parsedPattern.basenames;
        wrappedPattern.patterns = parsedPattern.patterns;
        return wrappedPattern;
    }
    function trimForExclusions(pattern, options) {
        return options.trimForExclusions && pattern.endsWith('/**') ? pattern.substr(0, pattern.length - 2) : pattern; // dropping **, tailing / is dropped later
    }
    // common pattern: **/*.txt just need endsWith check
    function trivia1(base, pattern) {
        return function (path, basename) {
            return typeof path === 'string' && path.endsWith(base) ? pattern : null;
        };
    }
    // common pattern: **/some.txt just need basename check
    function trivia2(base, pattern) {
        const slashBase = `/${base}`;
        const backslashBase = `\\${base}`;
        const parsedPattern = function (path, basename) {
            if (typeof path !== 'string') {
                return null;
            }
            if (basename) {
                return basename === base ? pattern : null;
            }
            return path === base || path.endsWith(slashBase) || path.endsWith(backslashBase) ? pattern : null;
        };
        const basenames = [base];
        parsedPattern.basenames = basenames;
        parsedPattern.patterns = [pattern];
        parsedPattern.allBasenames = basenames;
        return parsedPattern;
    }
    // repetition of common patterns (see above) {**/*.txt,**/*.png}
    function trivia3(pattern, options) {
        const parsedPatterns = aggregateBasenameMatches(pattern.slice(1, -1)
            .split(',')
            .map(pattern => parsePattern(pattern, options))
            .filter(pattern => pattern !== NULL), pattern);
        const patternsLength = parsedPatterns.length;
        if (!patternsLength) {
            return NULL;
        }
        if (patternsLength === 1) {
            return parsedPatterns[0];
        }
        const parsedPattern = function (path, basename) {
            for (let i = 0, n = parsedPatterns.length; i < n; i++) {
                if (parsedPatterns[i](path, basename)) {
                    return pattern;
                }
            }
            return null;
        };
        const withBasenames = parsedPatterns.find(pattern => !!pattern.allBasenames);
        if (withBasenames) {
            parsedPattern.allBasenames = withBasenames.allBasenames;
        }
        const allPaths = parsedPatterns.reduce((all, current) => current.allPaths ? all.concat(current.allPaths) : all, []);
        if (allPaths.length) {
            parsedPattern.allPaths = allPaths;
        }
        return parsedPattern;
    }
    // common patterns: **/something/else just need endsWith check, something/else just needs and equals check
    function trivia4and5(targetPath, pattern, matchPathEnds) {
        const usingPosixSep = path_1.sep === path_1.posix.sep;
        const nativePath = usingPosixSep ? targetPath : targetPath.replace(ALL_FORWARD_SLASHES, path_1.sep);
        const nativePathEnd = path_1.sep + nativePath;
        const targetPathEnd = path_1.posix.sep + targetPath;
        let parsedPattern;
        if (matchPathEnds) {
            parsedPattern = function (path, basename) {
                return typeof path === 'string' && ((path === nativePath || path.endsWith(nativePathEnd)) || !usingPosixSep && (path === targetPath || path.endsWith(targetPathEnd))) ? pattern : null;
            };
        }
        else {
            parsedPattern = function (path, basename) {
                return typeof path === 'string' && (path === nativePath || (!usingPosixSep && path === targetPath)) ? pattern : null;
            };
        }
        parsedPattern.allPaths = [(matchPathEnds ? '*/' : './') + targetPath];
        return parsedPattern;
    }
    function toRegExp(pattern) {
        try {
            const regExp = new RegExp(`^${parseRegExp(pattern)}$`);
            return function (path) {
                regExp.lastIndex = 0; // reset RegExp to its initial state to reuse it!
                return typeof path === 'string' && regExp.test(path) ? pattern : null;
            };
        }
        catch (error) {
            return NULL;
        }
    }
    function match(arg1, path, hasSibling) {
        if (!arg1 || typeof path !== 'string') {
            return false;
        }
        return parse(arg1)(path, undefined, hasSibling);
    }
    function parse(arg1, options = {}) {
        if (!arg1) {
            return FALSE;
        }
        // Glob with String
        if (typeof arg1 === 'string' || isRelativePattern(arg1)) {
            const parsedPattern = parsePattern(arg1, options);
            if (parsedPattern === NULL) {
                return FALSE;
            }
            const resultPattern = function (path, basename) {
                return !!parsedPattern(path, basename);
            };
            if (parsedPattern.allBasenames) {
                resultPattern.allBasenames = parsedPattern.allBasenames;
            }
            if (parsedPattern.allPaths) {
                resultPattern.allPaths = parsedPattern.allPaths;
            }
            return resultPattern;
        }
        // Glob with Expression
        return parsedExpression(arg1, options);
    }
    function isRelativePattern(obj) {
        const rp = obj;
        if (!rp) {
            return false;
        }
        return typeof rp.base === 'string' && typeof rp.pattern === 'string';
    }
    function getBasenameTerms(patternOrExpression) {
        return patternOrExpression.allBasenames || [];
    }
    function getPathTerms(patternOrExpression) {
        return patternOrExpression.allPaths || [];
    }
    function parsedExpression(expression, options) {
        const parsedPatterns = aggregateBasenameMatches(Object.getOwnPropertyNames(expression)
            .map(pattern => parseExpressionPattern(pattern, expression[pattern], options))
            .filter(pattern => pattern !== NULL));
        const patternsLength = parsedPatterns.length;
        if (!patternsLength) {
            return NULL;
        }
        if (!parsedPatterns.some(parsedPattern => !!parsedPattern.requiresSiblings)) {
            if (patternsLength === 1) {
                return parsedPatterns[0];
            }
            const resultExpression = function (path, basename) {
                let resultPromises = undefined;
                for (let i = 0, n = parsedPatterns.length; i < n; i++) {
                    const result = parsedPatterns[i](path, basename);
                    if (typeof result === 'string') {
                        return result; // immediately return as soon as the first expression matches
                    }
                    // If the result is a promise, we have to keep it for
                    // later processing and await the result properly.
                    if ((0, async_1.isThenable)(result)) {
                        if (!resultPromises) {
                            resultPromises = [];
                        }
                        resultPromises.push(result);
                    }
                }
                // With result promises, we have to loop over each and
                // await the result before we can return any result.
                if (resultPromises) {
                    return (async () => {
                        for (const resultPromise of resultPromises) {
                            const result = await resultPromise;
                            if (typeof result === 'string') {
                                return result;
                            }
                        }
                        return null;
                    })();
                }
                return null;
            };
            const withBasenames = parsedPatterns.find(pattern => !!pattern.allBasenames);
            if (withBasenames) {
                resultExpression.allBasenames = withBasenames.allBasenames;
            }
            const allPaths = parsedPatterns.reduce((all, current) => current.allPaths ? all.concat(current.allPaths) : all, []);
            if (allPaths.length) {
                resultExpression.allPaths = allPaths;
            }
            return resultExpression;
        }
        const resultExpression = function (path, base, hasSibling) {
            let name = undefined;
            let resultPromises = undefined;
            for (let i = 0, n = parsedPatterns.length; i < n; i++) {
                // Pattern matches path
                const parsedPattern = parsedPatterns[i];
                if (parsedPattern.requiresSiblings && hasSibling) {
                    if (!base) {
                        base = (0, path_1.basename)(path);
                    }
                    if (!name) {
                        name = base.substr(0, base.length - (0, path_1.extname)(path).length);
                    }
                }
                const result = parsedPattern(path, base, name, hasSibling);
                if (typeof result === 'string') {
                    return result; // immediately return as soon as the first expression matches
                }
                // If the result is a promise, we have to keep it for
                // later processing and await the result properly.
                if ((0, async_1.isThenable)(result)) {
                    if (!resultPromises) {
                        resultPromises = [];
                    }
                    resultPromises.push(result);
                }
            }
            // With result promises, we have to loop over each and
            // await the result before we can return any result.
            if (resultPromises) {
                return (async () => {
                    for (const resultPromise of resultPromises) {
                        const result = await resultPromise;
                        if (typeof result === 'string') {
                            return result;
                        }
                    }
                    return null;
                })();
            }
            return null;
        };
        const withBasenames = parsedPatterns.find(pattern => !!pattern.allBasenames);
        if (withBasenames) {
            resultExpression.allBasenames = withBasenames.allBasenames;
        }
        const allPaths = parsedPatterns.reduce((all, current) => current.allPaths ? all.concat(current.allPaths) : all, []);
        if (allPaths.length) {
            resultExpression.allPaths = allPaths;
        }
        return resultExpression;
    }
    function parseExpressionPattern(pattern, value, options) {
        if (value === false) {
            return NULL; // pattern is disabled
        }
        const parsedPattern = parsePattern(pattern, options);
        if (parsedPattern === NULL) {
            return NULL;
        }
        // Expression Pattern is <boolean>
        if (typeof value === 'boolean') {
            return parsedPattern;
        }
        // Expression Pattern is <SiblingClause>
        if (value) {
            const when = value.when;
            if (typeof when === 'string') {
                const result = (path, basename, name, hasSibling) => {
                    if (!hasSibling || !parsedPattern(path, basename)) {
                        return null;
                    }
                    const clausePattern = when.replace('$(basename)', () => name);
                    const matched = hasSibling(clausePattern);
                    return (0, async_1.isThenable)(matched) ?
                        matched.then(match => match ? pattern : null) :
                        matched ? pattern : null;
                };
                result.requiresSiblings = true;
                return result;
            }
        }
        // Expression is anything
        return parsedPattern;
    }
    function aggregateBasenameMatches(parsedPatterns, result) {
        const basenamePatterns = parsedPatterns.filter(parsedPattern => !!parsedPattern.basenames);
        if (basenamePatterns.length < 2) {
            return parsedPatterns;
        }
        const basenames = basenamePatterns.reduce((all, current) => {
            const basenames = current.basenames;
            return basenames ? all.concat(basenames) : all;
        }, []);
        let patterns;
        if (result) {
            patterns = [];
            for (let i = 0, n = basenames.length; i < n; i++) {
                patterns.push(result);
            }
        }
        else {
            patterns = basenamePatterns.reduce((all, current) => {
                const patterns = current.patterns;
                return patterns ? all.concat(patterns) : all;
            }, []);
        }
        const aggregate = function (path, basename) {
            if (typeof path !== 'string') {
                return null;
            }
            if (!basename) {
                let i;
                for (i = path.length; i > 0; i--) {
                    const ch = path.charCodeAt(i - 1);
                    if (ch === 47 /* CharCode.Slash */ || ch === 92 /* CharCode.Backslash */) {
                        break;
                    }
                }
                basename = path.substr(i);
            }
            const index = basenames.indexOf(basename);
            return index !== -1 ? patterns[index] : null;
        };
        aggregate.basenames = basenames;
        aggregate.patterns = patterns;
        aggregate.allBasenames = basenames;
        const aggregatedPatterns = parsedPatterns.filter(parsedPattern => !parsedPattern.basenames);
        aggregatedPatterns.push(aggregate);
        return aggregatedPatterns;
    }
    function patternsEquals(patternsA, patternsB) {
        return (0, arrays_1.equals)(patternsA, patternsB, (a, b) => {
            if (typeof a === 'string' && typeof b === 'string') {
                return a === b;
            }
            if (typeof a !== 'string' && typeof b !== 'string') {
                return a.base === b.base && a.pattern === b.pattern;
            }
            return false;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZ2xvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQ2hHLGdEQUVDO0lBNEJELHdDQTRDQztJQStZRCxzQkFNQztJQWNELHNCQTZCQztJQUVELDhDQU9DO0lBRUQsNENBRUM7SUFFRCxvQ0FFQztJQXdPRCx3Q0FZQztJQS93QkQsU0FBZ0Isa0JBQWtCO1FBQ2pDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBTVksUUFBQSxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLFFBQUEsVUFBVSxHQUFHLEdBQUcsQ0FBQztJQUU5QixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBRSx5QkFBeUI7SUFDeEQsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLENBQUMsa0NBQWtDO0lBQ3BFLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBRWxDLFNBQVMsYUFBYSxDQUFDLFNBQWlCLEVBQUUsYUFBdUI7UUFDaEUsUUFBUSxTQUFTLEVBQUUsQ0FBQztZQUNuQixLQUFLLENBQUM7Z0JBQ0wsT0FBTyxFQUFFLENBQUM7WUFDWCxLQUFLLENBQUM7Z0JBQ0wsT0FBTyxHQUFHLGFBQWEsSUFBSSxDQUFDLENBQUMsMkZBQTJGO1lBQ3pIO2dCQUNDLHVHQUF1RztnQkFDdkcsdUVBQXVFO2dCQUN2RSx5RUFBeUU7Z0JBQ3pFLGdGQUFnRjtnQkFDaEYsT0FBTyxNQUFNLFVBQVUsSUFBSSxhQUFhLElBQUksVUFBVSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO1FBQ3ZILENBQUM7SUFDRixDQUFDO0lBRUQs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