/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "events", "string_decoder", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/uri", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchExtTypes", "vscode-regexpp", "@vscode/ripgrep", "./ripgrepSearchUtils"], function (require, exports, cp, events_1, string_decoder_1, arrays_1, collections_1, glob_1, strings_1, uri_1, search_1, searchExtTypes_1, vscode_regexpp_1, ripgrep_1, ripgrepSearchUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RipgrepParser = exports.RipgrepTextSearchEngine = void 0;
    exports.getRgArgs = getRgArgs;
    exports.unicodeEscapesToPCRE2 = unicodeEscapesToPCRE2;
    exports.fixRegexNewline = fixRegexNewline;
    exports.fixNewline = fixNewline;
    exports.performBraceExpansionForRipgrep = performBraceExpansionForRipgrep;
    // If @vscode/ripgrep is in an .asar file, then the binary is unpacked.
    const rgDiskPath = ripgrep_1.rgPath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');
    class RipgrepTextSearchEngine {
        constructor(outputChannel) {
            this.outputChannel = outputChannel;
        }
        provideTextSearchResults(query, options, progress, token) {
            this.outputChannel.appendLine(`provideTextSearchResults ${query.pattern}, ${JSON.stringify({
                ...options,
                ...{
                    folder: options.folder.toString()
                }
            })}`);
            return new Promise((resolve, reject) => {
                token.onCancellationRequested(() => cancel());
                const rgArgs = getRgArgs(query, options);
                const cwd = options.folder.fsPath;
                const escapedArgs = rgArgs
                    .map(arg => arg.match(/^-/) ? arg : `'${arg}'`)
                    .join(' ');
                this.outputChannel.appendLine(`${rgDiskPath} ${escapedArgs}\n - cwd: ${cwd}`);
                let rgProc = cp.spawn(rgDiskPath, rgArgs, { cwd });
                rgProc.on('error', e => {
                    console.error(e);
                    this.outputChannel.appendLine('Error: ' + (e && e.message));
                    reject((0, search_1.serializeSearchError)(new search_1.SearchError(e && e.message, search_1.SearchErrorCode.rgProcessError)));
                });
                let gotResult = false;
                const ripgrepParser = new RipgrepParser(options.maxResults, options.folder, options.previewOptions);
                ripgrepParser.on('result', (match) => {
                    gotResult = true;
                    dataWithoutResult = '';
                    progress.report(match);
                });
                let isDone = false;
                const cancel = () => {
                    isDone = true;
                    rgProc?.kill();
                    ripgrepParser?.cancel();
                };
                let limitHit = false;
                ripgrepParser.on('hitLimit', () => {
                    limitHit = true;
                    cancel();
                });
                let dataWithoutResult = '';
                rgProc.stdout.on('data', data => {
                    ripgrepParser.handleData(data);
                    if (!gotResult) {
                        dataWithoutResult += data;
                    }
                });
                let gotData = false;
                rgProc.stdout.once('data', () => gotData = true);
                let stderr = '';
                rgProc.stderr.on('data', data => {
                    const message = data.toString();
                    this.outputChannel.appendLine(message);
                    if (stderr.length + message.length < 1e6) {
                        stderr += message;
                    }
                });
                rgProc.on('close', () => {
                    this.outputChannel.appendLine(gotData ? 'Got data from stdout' : 'No data from stdout');
                    this.outputChannel.appendLine(gotResult ? 'Got result from parser' : 'No result from parser');
                    if (dataWithoutResult) {
                        this.outputChannel.appendLine(`Got data without result: ${dataWithoutResult}`);
                    }
                    this.outputChannel.appendLine('');
                    if (isDone) {
                        resolve({ limitHit });
                    }
                    else {
                        // Trigger last result
                        ripgrepParser.flush();
                        rgProc = null;
                        let searchError;
                        if (stderr && !gotData && (searchError = rgErrorMsgForDisplay(stderr))) {
                            reject((0, search_1.serializeSearchError)(new search_1.SearchError(searchError.message, searchError.code)));
                        }
                        else {
                            resolve({ limitHit });
                        }
                    }
                });
            });
        }
    }
    exports.RipgrepTextSearchEngine = RipgrepTextSearchEngine;
    /**
     * Read the first line of stderr and return an error for display or undefined, based on a list of
     * allowed properties.
     * Ripgrep produces stderr output which is not from a fatal error, and we only want the search to be
     * "failed" when a fatal error was produced.
     */
    function rgErrorMsgForDisplay(msg) {
        const lines = msg.split('\n');
        const firstLine = lines[0].trim();
        if (lines.some(l => l.startsWith('regex parse error'))) {
            return new search_1.SearchError(buildRegexParseError(lines), search_1.SearchErrorCode.regexParseError);
        }
        const match = firstLine.match(/grep config error: unknown encoding: (.*)/);
        if (match) {
            return new search_1.SearchError(`Unknown encoding: ${match[1]}`, search_1.SearchErrorCode.unknownEncoding);
        }
        if (firstLine.startsWith('error parsing glob')) {
            // Uppercase first letter
            return new search_1.SearchError(firstLine.charAt(0).toUpperCase() + firstLine.substr(1), search_1.SearchErrorCode.globParseError);
        }
        if (firstLine.startsWith('the literal')) {
            // Uppercase first letter
            return new search_1.SearchError(firstLine.charAt(0).toUpperCase() + firstLine.substr(1), search_1.SearchErrorCode.invalidLiteral);
        }
        if (firstLine.startsWith('PCRE2: error compiling pattern')) {
            return new search_1.SearchError(firstLine, search_1.SearchErrorCode.regexParseError);
        }
        return undefined;
    }
    function buildRegexParseError(lines) {
        const errorMessage = ['Regex parse error'];
        const pcre2ErrorLine = lines.filter(l => (l.startsWith('PCRE2:')));
        if (pcre2ErrorLine.length >= 1) {
            const pcre2ErrorMessage = pcre2ErrorLine[0].replace('PCRE2:', '');
            if (pcre2ErrorMessage.indexOf(':') !== -1 && pcre2ErrorMessage.split(':').length >= 2) {
                const pcre2ActualErrorMessage = pcre2ErrorMessage.split(':')[1];
                errorMessage.push(':' + pcre2ActualErrorMessage);
            }
        }
        return errorMessage.join('');
    }
    class RipgrepParser extends events_1.EventEmitter {
        constructor(maxResults, root, previewOptions) {
            super();
            this.maxResults = maxResults;
            this.root = root;
            this.previewOptions = previewOptions;
            this.remainder = '';
            this.isDone = false;
            this.hitLimit = false;
            this.numResults = 0;
            this.stringDecoder = new string_decoder_1.StringDecoder();
        }
        cancel() {
            this.isDone = true;
        }
        flush() {
            this.handleDecodedData(this.stringDecoder.end());
        }
        on(event, listener) {
            super.on(event, listener);
            return this;
        }
        handleData(data) {
            if (this.isDone) {
                return;
            }
            const dataStr = typeof data === 'string' ? data : this.stringDecoder.write(data);
            this.handleDecodedData(dataStr);
        }
        handleDecodedData(decodedData) {
            // check for newline before appending to remainder
            let newlineIdx = decodedData.indexOf('\n');
            // If the previous data chunk didn't end in a newline, prepend it to this chunk
            const dataStr = this.remainder + decodedData;
            if (newlineIdx >= 0) {
                newlineIdx += this.remainder.length;
            }
            else {
                // Shortcut
                this.remainder = dataStr;
                return;
            }
            let prevIdx = 0;
            while (newlineIdx >= 0) {
                this.handleLine(dataStr.substring(prevIdx, newlineIdx).trim());
                prevIdx = newlineIdx + 1;
                newlineIdx = dataStr.indexOf('\n', prevIdx);
            }
            this.remainder = dataStr.substring(prevIdx);
        }
        handleLine(outputLine) {
            if (this.isDone || !outputLine) {
                return;
            }
            let parsedLine;
            try {
                parsedLine = JSON.parse(outputLine);
            }
            catch (e) {
                throw new Error(`malformed line from rg: ${outputLine}`);
            }
            if (parsedLine.type === 'match') {
                const matchPath = bytesOrTextToString(parsedLine.data.path);
                const uri = uri_1.URI.joinPath(this.root, matchPath);
                const result = this.createTextSearchMatch(parsedLine.data, uri);
                this.onResult(result);
                if (this.hitLimit) {
                    this.cancel();
                    this.emit('hitLimit');
                }
            }
            else if (parsedLine.type === 'context') {
                const contextPath = bytesOrTextToString(parsedLine.data.path);
                const uri = uri_1.URI.joinPath(this.root, contextPath);
                const result = this.createTextSearchContext(parsedLine.data, uri);
                result.forEach(r => this.onResult(r));
            }
        }
        createTextSearchMatch(data, uri) {
            const lineNumber = data.line_number - 1;
            const fullText = bytesOrTextToString(data.lines);
            const fullTextBytes = Buffer.from(fullText);
            let prevMatchEnd = 0;
            let prevMatchEndCol = 0;
            let prevMatchEndLine = lineNumber;
            // it looks like certain regexes can match a line, but cause rg to not
            // emit any specific submatches for that line.
            // https://github.com/microsoft/vscode/issues/100569#issuecomment-738496991
            if (data.submatches.length === 0) {
                data.submatches.push(fullText.length
                    ? { start: 0, end: 1, match: { text: fullText[0] } }
                    : { start: 0, end: 0, match: { text: '' } });
            }
            const ranges = (0, arrays_1.coalesce)(data.submatches.map((match, i) => {
                if (this.hitLimit) {
                    return null;
                }
                this.numResults++;
                if (this.numResults >= this.maxResults) {
                    // Finish the line, then report the result below
                    this.hitLimit = true;
                }
                const matchText = bytesOrTextToString(match.match);
                const inBetweenText = fullTextBytes.slice(prevMatchEnd, match.start).toString();
                const inBetweenStats = getNumLinesAndLastNewlineLength(inBetweenText);
                const startCol = inBetweenStats.numLines > 0 ?
                    inBetweenStats.lastLineLength :
                    inBetweenStats.lastLineLength + prevMatchEndCol;
                const stats = getNumLinesAndLastNewlineLength(matchText);
                const startLineNumber = inBetweenStats.numLines + prevMatchEndLine;
                const endLineNumber = stats.numLines + startLineNumber;
                const endCol = stats.numLines > 0 ?
                    stats.lastLineLength :
                    stats.lastLineLength + startCol;
                prevMatchEnd = match.end;
                prevMatchEndCol = endCol;
                prevMatchEndLine = endLineNumber;
                return new searchExtTypes_1.Range(startLineNumber, startCol, endLineNumber, endCol);
            }));
            return (0, ripgrepSearchUtils_1.createTextSearchResult)(uri, fullText, ranges, this.previewOptions);
        }
        createTextSearchContext(data, uri) {
            const text = bytesOrTextToString(data.lines);
            const startLine = data.line_number;
            return text
                .replace(/\r?\n$/, '')
                .split('\n')
                .map((line, i) => {
                return {
                    text: line,
                    uri,
                    lineNumber: startLine + i
                };
            });
        }
        onResult(match) {
            this.emit('result', match);
        }
    }
    exports.RipgrepParser = RipgrepParser;
    function bytesOrTextToString(obj) {
        return obj.bytes ?
            Buffer.from(obj.bytes, 'base64').toString() :
            obj.text;
    }
    function getNumLinesAndLastNewlineLength(text) {
        const re = /\n/g;
        let numLines = 0;
        let lastNewlineIdx = -1;
        let match;
        while (match = re.exec(text)) {
            numLines++;
            lastNewlineIdx = match.index;
        }
        const lastLineLength = lastNewlineIdx >= 0 ?
            text.length - lastNewlineIdx - 1 :
            text.length;
        return { numLines, lastLineLength };
    }
    // exported for testing
    function getRgArgs(query, options) {
        const args = ['--hidden', '--no-require-git'];
        args.push(query.isCaseSensitive ? '--case-sensitive' : '--ignore-case');
        const { doubleStarIncludes, otherIncludes } = (0, collections_1.groupBy)(options.includes, (include) => include.startsWith('**') ? 'doubleStarIncludes' : 'otherIncludes');
        if (otherIncludes && otherIncludes.length) {
            const uniqueOthers = new Set();
            otherIncludes.forEach(other => { uniqueOthers.add(other); });
            args.push('-g', '!*');
            uniqueOthers
                .forEach(otherIncude => {
                spreadGlobComponents(otherIncude)
                    .map(ripgrepSearchUtils_1.anchorGlob)
                    .forEach(globArg => {
                    args.push('-g', globArg);
                });
            });
        }
        if (doubleStarIncludes && doubleStarIncludes.length) {
            doubleStarIncludes.forEach(globArg => {
                args.push('-g', globArg);
            });
        }
        options.excludes
            .map(ripgrepSearchUtils_1.anchorGlob)
            .forEach(rgGlob => args.push('-g', `!${rgGlob}`));
        if (options.maxFileSize) {
            args.push('--max-filesize', options.maxFileSize + '');
        }
        if (options.useIgnoreFiles) {
            if (!options.useParentIgnoreFiles) {
                args.push('--no-ignore-parent');
            }
        }
        else {
            // Don't use .gitignore or .ignore
            args.push('--no-ignore');
        }
        if (options.followSymlinks) {
            args.push('--follow');
        }
        if (options.encoding && options.encoding !== 'utf8') {
            args.push('--encoding', options.encoding);
        }
        // Ripgrep handles -- as a -- arg separator. Only --.
        // - is ok, --- is ok, --some-flag is also ok. Need to special case.
        if (query.pattern === '--') {
            query.isRegExp = true;
            query.pattern = '\\-\\-';
        }
        if (query.isMultiline && !query.isRegExp) {
            query.pattern = (0, strings_1.escapeRegExpCharacters)(query.pattern);
            query.isRegExp = true;
        }
        if (options.usePCRE2) {
            args.push('--pcre2');
        }
        // Allow $ to match /r/n
        args.push('--crlf');
        if (query.isRegExp) {
            query.pattern = unicodeEscapesToPCRE2(query.pattern);
            args.push('--engine', 'auto');
        }
        let searchPatternAfterDoubleDashes;
        if (query.isWordMatch) {
            const regexp = (0, strings_1.createRegExp)(query.pattern, !!query.isRegExp, { wholeWord: query.isWordMatch });
            const regexpStr = regexp.source.replace(/\\\//g, '/'); // RegExp.source arbitrarily returns escaped slashes. Search and destroy.
            args.push('--regexp', regexpStr);
        }
        else if (query.isRegExp) {
            let fixedRegexpQuery = fixRegexNewline(query.pattern);
            fixedRegexpQuery = fixNewline(fixedRegexpQuery);
            args.push('--regexp', fixedRegexpQuery);
        }
        else {
            searchPatternAfterDoubleDashes = query.pattern;
            args.push('--fixed-strings');
        }
        args.push('--no-config');
        if (!options.useGlobalIgnoreFiles) {
            args.push('--no-ignore-global');
        }
        args.push('--json');
        if (query.isMultiline) {
            args.push('--multiline');
        }
        if (options.beforeContext) {
            args.push('--before-context', options.beforeContext + '');
        }
        if (options.afterContext) {
            args.push('--after-context', options.afterContext + '');
        }
        // Folder to search
        args.push('--');
        if (searchPatternAfterDoubleDashes) {
            // Put the query after --, in case the query starts with a dash
            args.push(searchPatternAfterDoubleDashes);
        }
        args.push('.');
        return args;
    }
    /**
     * `"foo/*bar/something"` -> `["foo", "foo/*bar", "foo/*bar/something", "foo/*bar/something/**"]`
     */
    function spreadGlobComponents(globComponent) {
        const globComponentWithBraceExpansion = performBraceExpansionForRipgrep(globComponent);
        return globComponentWithBraceExpansion.flatMap((globArg) => {
            const components = (0, glob_1.splitGlobAware)(globArg, '/');
            return components.map((_, i) => components.slice(0, i + 1).join('/'));
        });
    }
    function unicodeEscapesToPCRE2(pattern) {
        // Match \u1234
        const unicodePattern = /((?:[^\\]|^)(?:\\\\)*)\\u([a-z0-9]{4})/gi;
        while (pattern.match(unicodePattern)) {
            pattern = pattern.replace(unicodePattern, `$1\\x{$2}`);
        }
        // Match \u{1234}
        // \u with 5-6 characters will be left alone because \x only takes 4 characters.
        const unicodePatternWithBraces = /((?:[^\\]|^)(?:\\\\)*)\\u\{([a-z0-9]{4})\}/gi;
        while (pattern.match(unicodePatternWithBraces)) {
            pattern = pattern.replace(unicodePatternWithBraces, `$1\\x{$2}`);
        }
        return pattern;
    }
    const isLookBehind = (node) => node.type === 'Assertion' && node.kind === 'lookbehind';
    function fixRegexNewline(pattern) {
        // we parse the pattern anew each tiem
        let re;
        try {
            re = new vscode_regexpp_1.RegExpParser().parsePattern(pattern);
        }
        catch {
            return pattern;
        }
        let output = '';
        let lastEmittedIndex = 0;
        const replace = (start, end, text) => {
            output += pattern.slice(lastEmittedIndex, start) + text;
            lastEmittedIndex = end;
        };
        const context = [];
        const visitor = new vscode_regexpp_1.RegExpVisitor({
            onCharacterEnter(char) {
                if (char.raw !== '\\n') {
                    return;
                }
                const parent = context[0];
                if (!parent) {
                    // simple char, \n -> \r?\n
                    replace(char.start, char.end, '\\r?\\n');
                }
                else if (context.some(isLookBehind)) {
                    // no-op in a lookbehind, see #100569
                }
                else if (parent.type === 'CharacterClass') {
                    if (parent.negate) {
                        // negative bracket expr, [^a-z\n] -> (?![a-z]|\r?\n)
                        const otherContent = pattern.slice(parent.start + 2, char.start) + pattern.slice(char.end, parent.end - 1);
                        if (parent.parent?.type === 'Quantifier') {
                            // If quantified, we can't use a negative lookahead in a quantifier.
                            // But `.` already doesn't match new lines, so we can just use that
                            // (with any other negations) instead.
                            replace(parent.start, parent.end, otherContent ? `[^${otherContent}]` : '.');
                        }
                        else {
                            replace(parent.start, parent.end, '(?!\\r?\\n' + (otherContent ? `|[${otherContent}]` : '') + ')');
                        }
                    }
                    else {
                        // positive bracket expr, [a-z\n] -> (?:[a-z]|\r?\n)
                        const otherContent = pattern.slice(parent.start + 1, char.start) + pattern.slice(char.end, parent.end - 1);
                        replace(parent.start, parent.end, otherContent === '' ? '\\r?\\n' : `(?:[${otherContent}]|\\r?\\n)`);
                    }
                }
                else if (parent.type === 'Quantifier') {
                    replace(char.start, char.end, '(?:\\r?\\n)');
                }
            },
            onQuantifierEnter(node) {
                context.unshift(node);
            },
            onQuantifierLeave() {
                context.shift();
            },
            onCharacterClassRangeEnter(node) {
                context.unshift(node);
            },
            onCharacterClassRangeLeave() {
                context.shift();
            },
            onCharacterClassEnter(node) {
                context.unshift(node);
            },
            onCharacterClassLeave() {
                context.shift();
            },
            onAssertionEnter(node) {
                if (isLookBehind(node)) {
                    context.push(node);
                }
            },
            onAssertionLeave(node) {
                if (context[0] === node) {
                    context.shift();
                }
            },
        });
        visitor.visit(re);
        output += pattern.slice(lastEmittedIndex);
        return output;
    }
    function fixNewline(pattern) {
        return pattern.replace(/\n/g, '\\r?\\n');
    }
    // brace expansion for ripgrep
    /**
     * Split string given first opportunity for brace expansion in the string.
     * - If the brace is prepended by a \ character, then it is escaped.
     * - Does not process escapes that are within the sub-glob.
     * - If two unescaped `{` occur before `}`, then ripgrep will return an error for brace nesting, so don't split on those.
     */
    function getEscapeAwareSplitStringForRipgrep(pattern) {
        let inBraces = false;
        let escaped = false;
        let fixedStart = '';
        let strInBraces = '';
        for (let i = 0; i < pattern.length; i++) {
            const char = pattern[i];
            switch (char) {
                case '\\':
                    if (escaped) {
                        // If we're already escaped, then just leave the escaped slash and the preceeding slash that escapes it.
                        // The two escaped slashes will result in a single slash and whatever processes the glob later will properly process the escape
                        if (inBraces) {
                            strInBraces += '\\' + char;
                        }
                        else {
                            fixedStart += '\\' + char;
                        }
                        escaped = false;
                    }
                    else {
                        escaped = true;
                    }
                    break;
                case '{':
                    if (escaped) {
                        // if we escaped this opening bracket, then it is to be taken literally. Remove the `\` because we've acknowleged it and add the `{` to the appropriate string
                        if (inBraces) {
                            strInBraces += char;
                        }
                        else {
                            fixedStart += char;
                        }
                        escaped = false;
                    }
                    else {
                        if (inBraces) {
                            // ripgrep treats this as attempting to do a nested alternate group, which is invalid. Return with pattern including changes from escaped braces.
                            return { strInBraces: fixedStart + '{' + strInBraces + '{' + pattern.substring(i + 1) };
                        }
                        else {
                            inBraces = true;
                        }
                    }
                    break;
                case '}':
                    if (escaped) {
                        // same as `}`, but for closing bracket
                        if (inBraces) {
                            strInBraces += char;
                        }
                        else {
                            fixedStart += char;
                        }
                        escaped = false;
                    }
                    else if (inBraces) {
                        // we found an end bracket to a valid opening bracket. Return the appropriate strings.
                        return { fixedStart, strInBraces, fixedEnd: pattern.substring(i + 1) };
                    }
                    else {
                        // if we're not in braces and not escaped, then this is a literal `}` character and we're still adding to fixedStart.
                        fixedStart += char;
                    }
                    break;
                default:
                    // similar to the `\\` case, we didn't do anything with the escape, so we should re-insert it into the appropriate string
                    // to be consumed later when individual parts of the glob are processed
                    if (inBraces) {
                        strInBraces += (escaped ? '\\' : '') + char;
                    }
                    else {
                        fixedStart += (escaped ? '\\' : '') + char;
                    }
                    escaped = false;
                    break;
            }
        }
        // we are haven't hit the last brace, so no splitting should occur. Return with pattern including changes from escaped braces.
        return { strInBraces: fixedStart + (inBraces ? ('{' + strInBraces) : '') };
    }
    /**
     * Parses out curly braces and returns equivalent globs. Only supports one level of nesting.
     * Exported for testing.
     */
    function performBraceExpansionForRipgrep(pattern) {
        const { fixedStart, strInBraces, fixedEnd } = getEscapeAwareSplitStringForRipgrep(pattern);
        if (fixedStart === undefined || fixedEnd === undefined) {
            return [strInBraces];
        }
        let arr = (0, glob_1.splitGlobAware)(strInBraces, ',');
        if (!arr.length) {
            // occurs if the braces are empty.
            arr = [''];
        }
        const ends = performBraceExpansionForRipgrep(fixedEnd);
        return arr.flatMap((elem) => {
            const start = fixedStart + elem;
            return ends.map((end) => {
                return start + end;
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcFRleHRTZWFyY2hFbmdpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvbm9kZS9yaXBncmVwVGV4dFNlYXJjaEVuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErV2hHLDhCQTBIQztJQWVELHNEQWdCQztJQXlCRCwwQ0FtRkM7SUFFRCxnQ0FFQztJQXlGRCwwRUFxQkM7SUFwdEJELHVFQUF1RTtJQUN2RSxNQUFNLFVBQVUsR0FBRyxnQkFBTSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBRTFGLE1BQWEsdUJBQXVCO1FBRW5DLFlBQW9CLGFBQTZCO1lBQTdCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtRQUFJLENBQUM7UUFFdEQsd0JBQXdCLENBQUMsS0FBc0IsRUFBRSxPQUEwQixFQUFFLFFBQW9DLEVBQUUsS0FBd0I7WUFDMUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsNEJBQTRCLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDMUYsR0FBRyxPQUFPO2dCQUNWLEdBQUc7b0JBQ0YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2lCQUNqQzthQUNELENBQUMsRUFBRSxDQUFDLENBQUM7WUFFTixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUN0QyxLQUFLLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFFOUMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFekMsTUFBTSxHQUFHLEdB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