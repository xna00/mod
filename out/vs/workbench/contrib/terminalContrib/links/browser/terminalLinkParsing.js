/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy"], function (require, exports, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.winDrivePrefix = void 0;
    exports.removeLinkSuffix = removeLinkSuffix;
    exports.removeLinkQueryString = removeLinkQueryString;
    exports.detectLinkSuffixes = detectLinkSuffixes;
    exports.getLinkSuffix = getLinkSuffix;
    exports.toLinkSuffix = toLinkSuffix;
    exports.detectLinks = detectLinks;
    /**
     * A regex that extracts the link suffix which contains line and column information. The link suffix
     * must terminate at the end of line.
     */
    const linkSuffixRegexEol = new lazy_1.Lazy(() => generateLinkSuffixRegex(true));
    /**
     * A regex that extracts the link suffix which contains line and column information.
     */
    const linkSuffixRegex = new lazy_1.Lazy(() => generateLinkSuffixRegex(false));
    function generateLinkSuffixRegex(eolOnly) {
        let ri = 0;
        let ci = 0;
        let rei = 0;
        let cei = 0;
        function r() {
            return `(?<row${ri++}>\\d+)`;
        }
        function c() {
            return `(?<col${ci++}>\\d+)`;
        }
        function re() {
            return `(?<rowEnd${rei++}>\\d+)`;
        }
        function ce() {
            return `(?<colEnd${cei++}>\\d+)`;
        }
        const eolSuffix = eolOnly ? '$' : '';
        // The comments in the regex below use real strings/numbers for better readability, here's
        // the legend:
        // - Path    = foo
        // - Row     = 339
        // - Col     = 12
        // - RowEnd  = 341
        // - ColEnd  = 789
        //
        // These all support single quote ' in the place of " and [] in the place of ()
        //
        // See the tests for an exhaustive list of all supported formats
        const lineAndColumnRegexClauses = [
            // foo:339
            // foo:339:12
            // foo:339:12-789
            // foo:339:12-341.789
            // foo:339.12
            // foo 339
            // foo 339:12                              [#140780]
            // foo 339.12
            // foo#339
            // foo#339:12                              [#190288]
            // foo#339.12
            // "foo",339
            // "foo",339:12
            // "foo",339.12
            // "foo",339.12-789
            // "foo",339.12-341.789
            `(?::|#| |['"],)${r()}([:.]${c()}(?:-(?:${re()}\\.)?${ce()})?)?` + eolSuffix,
            // The quotes below are optional           [#171652]
            // "foo", line 339                         [#40468]
            // "foo", line 339, col 12
            // "foo", line 339, column 12
            // "foo":line 339
            // "foo":line 339, col 12
            // "foo":line 339, column 12
            // "foo": line 339
            // "foo": line 339, col 12
            // "foo": line 339, column 12
            // "foo" on line 339
            // "foo" on line 339, col 12
            // "foo" on line 339, column 12
            // "foo" line 339 column 12
            // "foo", line 339, character 12           [#171880]
            // "foo", line 339, characters 12-789      [#171880]
            // "foo", lines 339-341                    [#171880]
            // "foo", lines 339-341, characters 12-789 [#178287]
            `['"]?(?:,? |: ?| on )lines? ${r()}(?:-${re()})?(?:,? (?:col(?:umn)?|characters?) ${c()}(?:-${ce()})?)?` + eolSuffix,
            // foo(339)
            // foo(339,12)
            // foo(339, 12)
            // foo (339)
            //   ...
            // foo: (339)
            //   ...
            `:? ?[\\[\\(]${r()}(?:, ?${c()})?[\\]\\)]` + eolSuffix,
        ];
        const suffixClause = lineAndColumnRegexClauses
            // Join all clauses together
            .join('|')
            // Convert spaces to allow the non-breaking space char (ascii 160)
            .replace(/ /g, `[${'\u00A0'} ]`);
        return new RegExp(`(${suffixClause})`, eolOnly ? undefined : 'g');
    }
    /**
     * Removes the optional link suffix which contains line and column information.
     * @param link The link to use.
     */
    function removeLinkSuffix(link) {
        const suffix = getLinkSuffix(link)?.suffix;
        if (!suffix) {
            return link;
        }
        return link.substring(0, suffix.index);
    }
    /**
     * Removes any query string from the link.
     * @param link The link to use.
     */
    function removeLinkQueryString(link) {
        // Skip ? in UNC paths
        const start = link.startsWith('\\\\?\\') ? 4 : 0;
        const index = link.indexOf('?', start);
        if (index === -1) {
            return link;
        }
        return link.substring(0, index);
    }
    function detectLinkSuffixes(line) {
        // Find all suffixes on the line. Since the regex global flag is used, lastIndex will be updated
        // in place such that there are no overlapping matches.
        let match;
        const results = [];
        linkSuffixRegex.value.lastIndex = 0;
        while ((match = linkSuffixRegex.value.exec(line)) !== null) {
            const suffix = toLinkSuffix(match);
            if (suffix === null) {
                break;
            }
            results.push(suffix);
        }
        return results;
    }
    /**
     * Returns the optional link suffix which contains line and column information.
     * @param link The link to parse.
     */
    function getLinkSuffix(link) {
        return toLinkSuffix(linkSuffixRegexEol.value.exec(link));
    }
    function toLinkSuffix(match) {
        const groups = match?.groups;
        if (!groups || match.length < 1) {
            return null;
        }
        return {
            row: parseIntOptional(groups.row0 || groups.row1 || groups.row2),
            col: parseIntOptional(groups.col0 || groups.col1 || groups.col2),
            rowEnd: parseIntOptional(groups.rowEnd0 || groups.rowEnd1 || groups.rowEnd2),
            colEnd: parseIntOptional(groups.colEnd0 || groups.colEnd1 || groups.colEnd2),
            suffix: { index: match.index, text: match[0] }
        };
    }
    function parseIntOptional(value) {
        if (value === undefined) {
            return value;
        }
        return parseInt(value);
    }
    // This defines valid path characters for a link with a suffix, the first `[]` of the regex includes
    // characters the path is not allowed to _start_ with, the second `[]` includes characters not
    // allowed at all in the path. If the characters show up in both regexes the link will stop at that
    // character, otherwise it will stop at a space character.
    const linkWithSuffixPathCharacters = /(?<path>(?:file:\/\/\/)?[^\s\|<>\[\({][^\s\|<>]*)$/;
    function detectLinks(line, os) {
        // 1: Detect all links on line via suffixes first
        const results = detectLinksViaSuffix(line);
        // 2: Detect all links without suffixes and merge non-conflicting ranges into the results
        const noSuffixPaths = detectPathsNoSuffix(line, os);
        binaryInsertList(results, noSuffixPaths);
        return results;
    }
    function binaryInsertList(list, newItems) {
        if (list.length === 0) {
            list.push(...newItems);
        }
        for (const item of newItems) {
            binaryInsert(list, item, 0, list.length);
        }
    }
    function binaryInsert(list, newItem, low, high) {
        if (list.length === 0) {
            list.push(newItem);
            return;
        }
        if (low > high) {
            return;
        }
        // Find the index where the newItem would be inserted
        const mid = Math.floor((low + high) / 2);
        if (mid >= list.length ||
            (newItem.path.index < list[mid].path.index && (mid === 0 || newItem.path.index > list[mid - 1].path.index))) {
            // Check if it conflicts with an existing link before adding
            if (mid >= list.length ||
                (newItem.path.index + newItem.path.text.length < list[mid].path.index && (mid === 0 || newItem.path.index > list[mid - 1].path.index + list[mid - 1].path.text.length))) {
                list.splice(mid, 0, newItem);
            }
            return;
        }
        if (newItem.path.index > list[mid].path.index) {
            binaryInsert(list, newItem, mid + 1, high);
        }
        else {
            binaryInsert(list, newItem, low, mid - 1);
        }
    }
    function detectLinksViaSuffix(line) {
        const results = [];
        // 1: Detect link suffixes on the line
        const suffixes = detectLinkSuffixes(line);
        for (const suffix of suffixes) {
            const beforeSuffix = line.substring(0, suffix.suffix.index);
            const possiblePathMatch = beforeSuffix.match(linkWithSuffixPathCharacters);
            if (possiblePathMatch && possiblePathMatch.index !== undefined && possiblePathMatch.groups?.path) {
                let linkStartIndex = possiblePathMatch.index;
                let path = possiblePathMatch.groups.path;
                // Extract a path prefix if it exists (not part of the path, but part of the underlined
                // section)
                let prefix = undefined;
                const prefixMatch = path.match(/^(?<prefix>['"]+)/);
                if (prefixMatch?.groups?.prefix) {
                    prefix = {
                        index: linkStartIndex,
                        text: prefixMatch.groups.prefix
                    };
                    path = path.substring(prefix.text.length);
                    // Don't allow suffix links to be returned when the link itself is the empty string
                    if (path.trim().length === 0) {
                        continue;
                    }
                    // If there are multiple characters in the prefix, trim the prefix if the _first_
                    // suffix character is the same as the last prefix character. For example, for the
                    // text `echo "'foo' on line 1"`:
                    //
                    // - Prefix='
                    // - Path=foo
                    // - Suffix=' on line 1
                    //
                    // If this fails on a multi-character prefix, just keep the original.
                    if (prefixMatch.groups.prefix.length > 1) {
                        if (suffix.suffix.text[0].match(/['"]/) && prefixMatch.groups.prefix[prefixMatch.groups.prefix.length - 1] === suffix.suffix.text[0]) {
                            const trimPrefixAmount = prefixMatch.groups.prefix.length - 1;
                            prefix.index += trimPrefixAmount;
                            prefix.text = prefixMatch.groups.prefix[prefixMatch.groups.prefix.length - 1];
                            linkStartIndex += trimPrefixAmount;
                        }
                    }
                }
                results.push({
                    path: {
                        index: linkStartIndex + (prefix?.text.length || 0),
                        text: path
                    },
                    prefix,
                    suffix
                });
            }
        }
        return results;
    }
    var RegexPathConstants;
    (function (RegexPathConstants) {
        RegexPathConstants["PathPrefix"] = "(?:\\.\\.?|\\~|file://)";
        RegexPathConstants["PathSeparatorClause"] = "\\/";
        // '":; are allowed in paths but they are often separators so ignore them
        // Also disallow \\ to prevent a catastropic backtracking case #24795
        RegexPathConstants["ExcludedPathCharactersClause"] = "[^\\0<>\\?\\s!`&*()'\":;\\\\]";
        RegexPathConstants["ExcludedStartPathCharactersClause"] = "[^\\0<>\\?\\s!`&*()\\[\\]'\":;\\\\]";
        RegexPathConstants["WinOtherPathPrefix"] = "\\.\\.?|\\~";
        RegexPathConstants["WinPathSeparatorClause"] = "(?:\\\\|\\/)";
        RegexPathConstants["WinExcludedPathCharactersClause"] = "[^\\0<>\\?\\|\\/\\s!`&*()'\":;]";
        RegexPathConstants["WinExcludedStartPathCharactersClause"] = "[^\\0<>\\?\\|\\/\\s!`&*()\\[\\]'\":;]";
    })(RegexPathConstants || (RegexPathConstants = {}));
    /**
     * A regex that matches non-Windows paths, such as `/foo`, `~/foo`, `./foo`, `../foo` and
     * `foo/bar`.
     */
    const unixLocalLinkClause = '(?:(?:' + RegexPathConstants.PathPrefix + '|(?:' + RegexPathConstants.ExcludedStartPathCharactersClause + RegexPathConstants.ExcludedPathCharactersClause + '*))?(?:' + RegexPathConstants.PathSeparatorClause + '(?:' + RegexPathConstants.ExcludedPathCharactersClause + ')+)+)';
    /**
     * A regex clause that matches the start of an absolute path on Windows, such as: `C:`, `c:`,
     * `file:///c:` (uri) and `\\?\C:` (UNC path).
     */
    exports.winDrivePrefix = '(?:\\\\\\\\\\?\\\\|file:\\/\\/\\/)?[a-zA-Z]:';
    /**
     * A regex that matches Windows paths, such as `\\?\c:\foo`, `c:\foo`, `~\foo`, `.\foo`, `..\foo`
     * and `foo\bar`.
     */
    const winLocalLinkClause = '(?:(?:' + `(?:${exports.winDrivePrefix}|${RegexPathConstants.WinOtherPathPrefix})` + '|(?:' + RegexPathConstants.WinExcludedStartPathCharactersClause + RegexPathConstants.WinExcludedPathCharactersClause + '*))?(?:' + RegexPathConstants.WinPathSeparatorClause + '(?:' + RegexPathConstants.WinExcludedPathCharactersClause + ')+)+)';
    function detectPathsNoSuffix(line, os) {
        const results = [];
        const regex = new RegExp(os === 1 /* OperatingSystem.Windows */ ? winLocalLinkClause : unixLocalLinkClause, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
            let text = match[0];
            let index = match.index;
            if (!text) {
                // Something matched but does not comply with the given match index, since this would
                // most likely a bug the regex itself we simply do nothing here
                break;
            }
            // Adjust the link range to exclude a/ and b/ if it looks like a git diff
            if (
            // --- a/foo/bar
            // +++ b/foo/bar
            ((line.startsWith('--- a/') || line.startsWith('+++ b/')) && index === 4) ||
                // diff --git a/foo/bar b/foo/bar
                (line.startsWith('diff --git') && (text.startsWith('a/') || text.startsWith('b/')))) {
                text = text.substring(2);
                index += 2;
            }
            results.push({
                path: {
                    index,
                    text
                },
                prefix: undefined,
                suffix: undefined
            });
        }
        return results;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUGFyc2luZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxMaW5rUGFyc2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtSWhHLDRDQU1DO0lBTUQsc0RBUUM7SUFFRCxnREFjQztJQU1ELHNDQUVDO0lBRUQsb0NBWUM7SUFlRCxrQ0FTQztJQXZMRDs7O09BR0c7SUFDSCxNQUFNLGtCQUFrQixHQUFHLElBQUksV0FBSSxDQUFTLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDakY7O09BRUc7SUFDSCxNQUFNLGVBQWUsR0FBRyxJQUFJLFdBQUksQ0FBUyxHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRS9FLFNBQVMsdUJBQXVCLENBQUMsT0FBZ0I7UUFDaEQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osU0FBUyxDQUFDO1lBQ1QsT0FBTyxTQUFTLEVBQUUsRUFBRSxRQUFRLENBQUM7UUFDOUIsQ0FBQztRQUNELFNBQVMsQ0FBQztZQUNULE9BQU8sU0FBUyxFQUFFLEVBQUUsUUFBUSxDQUFDO1FBQzlCLENBQUM7UUFDRCxTQUFTLEVBQUU7WUFDVixPQUFPLFlBQVksR0FBRyxFQUFFLFFBQVEsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsT0FBTyxZQUFZLEdBQUcsRUFBRSxRQUFRLENBQUM7UUFDbEMsQ0FBQztR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