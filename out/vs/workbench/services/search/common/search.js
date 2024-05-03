/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/objects", "vs/base/common/extpath", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/base/common/path", "vs/base/common/errors", "vs/workbench/services/search/common/searchExtTypes", "vs/base/common/async"], function (require, exports, arrays_1, glob, objects, extpath, strings_1, instantiation_1, paths, errors_1, searchExtTypes_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryGlobTester = exports.SerializableFileMatch = exports.SearchError = exports.SearchErrorCode = exports.SearchSortOrder = exports.ViewMode = exports.OneLineRange = exports.SearchRange = exports.TextSearchMatch = exports.FileMatch = exports.SearchCompletionExitCode = exports.QueryType = exports.SearchProviderType = exports.ISearchService = exports.SEARCH_EXCLUDE_CONFIG = exports.SEARCH_RESULT_LANGUAGE_ID = exports.VIEW_ID = exports.PANEL_ID = exports.VIEWLET_ID = exports.TextSearchCompleteMessageType = void 0;
    exports.resultIsMatch = resultIsMatch;
    exports.isFileMatch = isFileMatch;
    exports.isProgressMessage = isProgressMessage;
    exports.getExcludes = getExcludes;
    exports.pathIncludedInQuery = pathIncludedInQuery;
    exports.deserializeSearchError = deserializeSearchError;
    exports.serializeSearchError = serializeSearchError;
    exports.isSerializedSearchComplete = isSerializedSearchComplete;
    exports.isSerializedSearchSuccess = isSerializedSearchSuccess;
    exports.isSerializedFileMatch = isSerializedFileMatch;
    exports.isFilePatternMatch = isFilePatternMatch;
    exports.resolvePatternsForProvider = resolvePatternsForProvider;
    exports.hasSiblingPromiseFn = hasSiblingPromiseFn;
    exports.hasSiblingFn = hasSiblingFn;
    Object.defineProperty(exports, "TextSearchCompleteMessageType", { enumerable: true, get: function () { return searchExtTypes_1.TextSearchCompleteMessageType; } });
    exports.VIEWLET_ID = 'workbench.view.search';
    exports.PANEL_ID = 'workbench.panel.search';
    exports.VIEW_ID = 'workbench.view.search';
    exports.SEARCH_RESULT_LANGUAGE_ID = 'search-result';
    exports.SEARCH_EXCLUDE_CONFIG = 'search.exclude';
    // Warning: this pattern is used in the search editor to detect offsets. If you
    // change this, also change the search-result built-in extension
    const SEARCH_ELIDED_PREFIX = '⟪ ';
    const SEARCH_ELIDED_SUFFIX = ' characters skipped ⟫';
    const SEARCH_ELIDED_MIN_LEN = (SEARCH_ELIDED_PREFIX.length + SEARCH_ELIDED_SUFFIX.length + 5) * 2;
    exports.ISearchService = (0, instantiation_1.createDecorator)('searchService');
    /**
     * TODO@roblou - split text from file search entirely, or share code in a more natural way.
     */
    var SearchProviderType;
    (function (SearchProviderType) {
        SearchProviderType[SearchProviderType["file"] = 0] = "file";
        SearchProviderType[SearchProviderType["text"] = 1] = "text";
        SearchProviderType[SearchProviderType["aiText"] = 2] = "aiText";
    })(SearchProviderType || (exports.SearchProviderType = SearchProviderType = {}));
    var QueryType;
    (function (QueryType) {
        QueryType[QueryType["File"] = 1] = "File";
        QueryType[QueryType["Text"] = 2] = "Text";
        QueryType[QueryType["aiText"] = 3] = "aiText";
    })(QueryType || (exports.QueryType = QueryType = {}));
    function resultIsMatch(result) {
        return !!result.preview;
    }
    function isFileMatch(p) {
        return !!p.resource;
    }
    function isProgressMessage(p) {
        return !!p.message;
    }
    var SearchCompletionExitCode;
    (function (SearchCompletionExitCode) {
        SearchCompletionExitCode[SearchCompletionExitCode["Normal"] = 0] = "Normal";
        SearchCompletionExitCode[SearchCompletionExitCode["NewSearchStarted"] = 1] = "NewSearchStarted";
    })(SearchCompletionExitCode || (exports.SearchCompletionExitCode = SearchCompletionExitCode = {}));
    class FileMatch {
        constructor(resource) {
            this.resource = resource;
            this.results = [];
            // empty
        }
    }
    exports.FileMatch = FileMatch;
    class TextSearchMatch {
        constructor(text, range, previewOptions, webviewIndex) {
            this.ranges = range;
            this.webviewIndex = webviewIndex;
            // Trim preview if this is one match and a single-line match with a preview requested.
            // Otherwise send the full text, like for replace or for showing multiple previews.
            // TODO this is fishy.
            const ranges = Array.isArray(range) ? range : [range];
            if (previewOptions && previewOptions.matchLines === 1 && isSingleLineRangeList(ranges)) {
                // 1 line preview requested
                text = (0, strings_1.getNLines)(text, previewOptions.matchLines);
                let result = '';
                let shift = 0;
                let lastEnd = 0;
                const leadingChars = Math.floor(previewOptions.charsPerLine / 5);
                const matches = [];
                for (const range of ranges) {
                    const previewStart = Math.max(range.startColumn - leadingChars, 0);
                    const previewEnd = range.startColumn + previewOptions.charsPerLine;
                    if (previewStart > lastEnd + leadingChars + SEARCH_ELIDED_MIN_LEN) {
                        const elision = SEARCH_ELIDED_PREFIX + (previewStart - lastEnd) + SEARCH_ELIDED_SUFFIX;
                        result += elision + text.slice(previewStart, previewEnd);
                        shift += previewStart - (lastEnd + elision.length);
                    }
                    else {
                        result += text.slice(lastEnd, previewEnd);
                    }
                    matches.push(new OneLineRange(0, range.startColumn - shift, range.endColumn - shift));
                    lastEnd = previewEnd;
                }
                this.preview = { text: result, matches: Array.isArray(this.ranges) ? matches : matches[0] };
            }
            else {
                const firstMatchLine = Array.isArray(range) ? range[0].startLineNumber : range.startLineNumber;
                this.preview = {
                    text,
                    matches: (0, arrays_1.mapArrayOrNot)(range, r => new SearchRange(r.startLineNumber - firstMatchLine, r.startColumn, r.endLineNumber - firstMatchLine, r.endColumn))
                };
            }
        }
    }
    exports.TextSearchMatch = TextSearchMatch;
    function isSingleLineRangeList(ranges) {
        const line = ranges[0].startLineNumber;
        for (const r of ranges) {
            if (r.startLineNumber !== line || r.endLineNumber !== line) {
                return false;
            }
        }
        return true;
    }
    class SearchRange {
        constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
        }
    }
    exports.SearchRange = SearchRange;
    class OneLineRange extends SearchRange {
        constructor(lineNumber, startColumn, endColumn) {
            super(lineNumber, startColumn, lineNumber, endColumn);
        }
    }
    exports.OneLineRange = OneLineRange;
    var ViewMode;
    (function (ViewMode) {
        ViewMode["List"] = "list";
        ViewMode["Tree"] = "tree";
    })(ViewMode || (exports.ViewMode = ViewMode = {}));
    var SearchSortOrder;
    (function (SearchSortOrder) {
        SearchSortOrder["Default"] = "default";
        SearchSortOrder["FileNames"] = "fileNames";
        SearchSortOrder["Type"] = "type";
        SearchSortOrder["Modified"] = "modified";
        SearchSortOrder["CountDescending"] = "countDescending";
        SearchSortOrder["CountAscending"] = "countAscending";
    })(SearchSortOrder || (exports.SearchSortOrder = SearchSortOrder = {}));
    function getExcludes(configuration, includeSearchExcludes = true) {
        const fileExcludes = configuration && configuration.files && configuration.files.exclude;
        const searchExcludes = includeSearchExcludes && configuration && configuration.search && configuration.search.exclude;
        if (!fileExcludes && !searchExcludes) {
            return undefined;
        }
        if (!fileExcludes || !searchExcludes) {
            return fileExcludes || searchExcludes;
        }
        let allExcludes = Object.create(null);
        // clone the config as it could be frozen
        allExcludes = objects.mixin(allExcludes, objects.deepClone(fileExcludes));
        allExcludes = objects.mixin(allExcludes, objects.deepClone(searchExcludes), true);
        return allExcludes;
    }
    function pathIncludedInQuery(queryProps, fsPath) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, fsPath)) {
            return false;
        }
        if (queryProps.includePattern || queryProps.usingSearchPaths) {
            if (queryProps.includePattern && glob.match(queryProps.includePattern, fsPath)) {
                return true;
            }
            // If searchPaths are being used, the extra file must be in a subfolder and match the pattern, if present
            if (queryProps.usingSearchPaths) {
                return !!queryProps.folderQueries && queryProps.folderQueries.some(fq => {
                    const searchPath = fq.folder.fsPath;
                    if (extpath.isEqualOrParent(fsPath, searchPath)) {
                        const relPath = paths.relative(searchPath, fsPath);
                        return !fq.includePattern || !!glob.match(fq.includePattern, relPath);
                    }
                    else {
                        return false;
                    }
                });
            }
            return false;
        }
        return true;
    }
    var SearchErrorCode;
    (function (SearchErrorCode) {
        SearchErrorCode[SearchErrorCode["unknownEncoding"] = 1] = "unknownEncoding";
        SearchErrorCode[SearchErrorCode["regexParseError"] = 2] = "regexParseError";
        SearchErrorCode[SearchErrorCode["globParseError"] = 3] = "globParseError";
        SearchErrorCode[SearchErrorCode["invalidLiteral"] = 4] = "invalidLiteral";
        SearchErrorCode[SearchErrorCode["rgProcessError"] = 5] = "rgProcessError";
        SearchErrorCode[SearchErrorCode["other"] = 6] = "other";
        SearchErrorCode[SearchErrorCode["canceled"] = 7] = "canceled";
    })(SearchErrorCode || (exports.SearchErrorCode = SearchErrorCode = {}));
    class SearchError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.SearchError = SearchError;
    function deserializeSearchError(error) {
        const errorMsg = error.message;
        if ((0, errors_1.isCancellationError)(error)) {
            return new SearchError(errorMsg, SearchErrorCode.canceled);
        }
        try {
            const details = JSON.parse(errorMsg);
            return new SearchError(details.message, details.code);
        }
        catch (e) {
            return new SearchError(errorMsg, SearchErrorCode.other);
        }
    }
    function serializeSearchError(searchError) {
        const details = { message: searchError.message, code: searchError.code };
        return new Error(JSON.stringify(details));
    }
    function isSerializedSearchComplete(arg) {
        if (arg.type === 'error') {
            return true;
        }
        else if (arg.type === 'success') {
            return true;
        }
        else {
            return false;
        }
    }
    function isSerializedSearchSuccess(arg) {
        return arg.type === 'success';
    }
    function isSerializedFileMatch(arg) {
        return !!arg.path;
    }
    function isFilePatternMatch(candidate, filePatternToUse, fuzzy = true) {
        const pathToMatch = candidate.searchPath ? candidate.searchPath : candidate.relativePath;
        return fuzzy ?
            (0, strings_1.fuzzyContains)(pathToMatch, filePatternToUse) :
            glob.match(filePatternToUse, pathToMatch);
    }
    class SerializableFileMatch {
        constructor(path) {
            this.path = path;
            this.results = [];
        }
        addMatch(match) {
            this.results.push(match);
        }
        serialize() {
            return {
                path: this.path,
                results: this.results,
                numMatches: this.results.length
            };
        }
    }
    exports.SerializableFileMatch = SerializableFileMatch;
    /**
     *  Computes the patterns that the provider handles. Discards sibling clauses and 'false' patterns
     */
    function resolvePatternsForProvider(globalPattern, folderPattern) {
        const merged = {
            ...(globalPattern || {}),
            ...(folderPattern || {})
        };
        return Object.keys(merged)
            .filter(key => {
            const value = merged[key];
            return typeof value === 'boolean' && value;
        });
    }
    class QueryGlobTester {
        constructor(config, folderQuery) {
            this._parsedIncludeExpression = null;
            this._excludeExpression = {
                ...(config.excludePattern || {}),
                ...(folderQuery.excludePattern || {})
            };
            this._parsedExcludeExpression = glob.parse(this._excludeExpression);
            // Empty includeExpression means include nothing, so no {} shortcuts
            let includeExpression = config.includePattern;
            if (folderQuery.includePattern) {
                if (includeExpression) {
                    includeExpression = {
                        ...includeExpression,
                        ...folderQuery.includePattern
                    };
                }
                else {
                    includeExpression = folderQuery.includePattern;
                }
            }
            if (includeExpression) {
                this._parsedIncludeExpression = glob.parse(includeExpression);
            }
        }
        matchesExcludesSync(testPath, basename, hasSibling) {
            if (this._parsedExcludeExpression && this._parsedExcludeExpression(testPath, basename, hasSibling)) {
                return true;
            }
            return false;
        }
        /**
         * Guaranteed sync - siblingsFn should not return a promise.
         */
        includedInQuerySync(testPath, basename, hasSibling) {
            if (this._parsedExcludeExpression && this._parsedExcludeExpression(testPath, basename, hasSibling)) {
                return false;
            }
            if (this._parsedIncludeExpression && !this._parsedIncludeExpression(testPath, basename, hasSibling)) {
                return false;
            }
            return true;
        }
        /**
         * Evaluating the exclude expression is only async if it includes sibling clauses. As an optimization, avoid doing anything with Promises
         * unless the expression is async.
         */
        includedInQuery(testPath, basename, hasSibling) {
            const excluded = this._parsedExcludeExpression(testPath, basename, hasSibling);
            const isIncluded = () => {
                return this._parsedIncludeExpression ?
                    !!(this._parsedIncludeExpression(testPath, basename, hasSibling)) :
                    true;
            };
            if ((0, async_1.isThenable)(excluded)) {
                return excluded.then(excluded => {
                    if (excluded) {
                        return false;
                    }
                    return isIncluded();
                });
            }
            return isIncluded();
        }
        hasSiblingExcludeClauses() {
            return hasSiblingClauses(this._excludeExpression);
        }
    }
    exports.QueryGlobTester = QueryGlobTester;
    function hasSiblingClauses(pattern) {
        for (const key in pattern) {
            if (typeof pattern[key] !== 'boolean') {
                return true;
            }
        }
        return false;
    }
    function hasSiblingPromiseFn(siblingsFn) {
        if (!siblingsFn) {
            return undefined;
        }
        let siblings;
        return (name) => {
            if (!siblings) {
                siblings = (siblingsFn() || Promise.resolve([]))
                    .then(list => list ? listToMap(list) : {});
            }
            return siblings.then(map => !!map[name]);
        };
    }
    function hasSiblingFn(siblingsFn) {
        if (!siblingsFn) {
            return undefined;
        }
        let siblings;
        return (name) => {
            if (!siblings) {
                const list = siblingsFn();
                siblings = list ? listToMap(list) : {};
            }
            return !!siblings[name];
        };
    }
    function listToMap(list) {
        const map = {};
        for (const key of list) {
            map[key] = true;
        }
        return map;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL2NvbW1vbi9zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ09oRyxzQ0FFQztJQVFELGtDQUVDO0lBRUQsOENBRUM7SUFtTkQsa0NBa0JDO0lBRUQsa0RBMkJDO0lBa0JELHdEQWFDO0lBRUQsb0RBR0M7SUF5REQsZ0VBUUM7SUFFRCw4REFFQztJQUVELHNEQUVDO0lBRUQsZ0RBS0M7SUFzQ0QsZ0VBV0M7SUFrR0Qsa0RBYUM7SUFFRCxvQ0FhQztJQWp3QlEsOEdBSkEsOENBQTZCLE9BSUE7SUFFekIsUUFBQSxVQUFVLEdBQUcsdUJBQXVCLENBQUM7SUFDckMsUUFBQSxRQUFRLEdBQUcsd0JBQXdCLENBQUM7SUFDcEMsUUFBQSxPQUFPLEdBQUcsdUJBQXVCLENBQUM7SUFDbEMsUUFBQSx5QkFBeUIsR0FBRyxlQUFlLENBQUM7SUFFNUMsUUFBQSxxQkFBcUIsR0FBRyxnQkFBZ0IsQ0FBQztJQUV0RCwrRUFBK0U7SUFDL0UsZ0VBQWdFO0lBQ2hFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLE1BQU0sb0JBQW9CLEdBQUcsdUJBQXVCLENBQUM7SUFDckQsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXJGLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZUFBZSxDQUFDLENBQUM7SUFlL0U7O09BRUc7SUFDSCxJQUFrQixrQkFJakI7SUFKRCxXQUFrQixrQkFBa0I7UUFDbkMsMkRBQUksQ0FBQTtRQUNKLDJEQUFJLENBQUE7UUFDSiwrREFBTSxDQUFB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