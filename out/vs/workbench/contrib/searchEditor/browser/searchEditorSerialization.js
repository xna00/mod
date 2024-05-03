/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/nls", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/textfile/common/textfiles", "vs/css!./media/searchEditor"], function (require, exports, arrays_1, range_1, nls_1, searchModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSerializedSearchEditor = exports.parseSavedSearchEditor = exports.serializeSearchResultForEditor = exports.extractSearchQueryFromLines = exports.defaultSearchConfig = exports.extractSearchQueryFromModel = exports.serializeSearchConfiguration = void 0;
    // Using \r\n on Windows inserts an extra newline between results.
    const lineDelimiter = '\n';
    const translateRangeLines = (n) => (range) => new range_1.Range(range.startLineNumber + n, range.startColumn, range.endLineNumber + n, range.endColumn);
    const matchToSearchResultFormat = (match, longestLineNumber) => {
        const getLinePrefix = (i) => `${match.range().startLineNumber + i}`;
        const fullMatchLines = match.fullPreviewLines();
        const results = [];
        fullMatchLines
            .forEach((sourceLine, i) => {
            const lineNumber = getLinePrefix(i);
            const paddingStr = ' '.repeat(longestLineNumber - lineNumber.length);
            const prefix = `  ${paddingStr}${lineNumber}: `;
            const prefixOffset = prefix.length;
            // split instead of replace to avoid creating a new string object
            const line = prefix + (sourceLine.split(/\r?\n?$/, 1)[0] || '');
            const rangeOnThisLine = ({ start, end }) => new range_1.Range(1, (start ?? 1) + prefixOffset, 1, (end ?? sourceLine.length + 1) + prefixOffset);
            const matchRange = match.rangeInPreview();
            const matchIsSingleLine = matchRange.startLineNumber === matchRange.endLineNumber;
            let lineRange;
            if (matchIsSingleLine) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn, end: matchRange.endColumn }));
            }
            else if (i === 0) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn }));
            }
            else if (i === fullMatchLines.length - 1) {
                lineRange = (rangeOnThisLine({ end: matchRange.endColumn }));
            }
            else {
                lineRange = (rangeOnThisLine({}));
            }
            results.push({ lineNumber: lineNumber, line, ranges: [lineRange] });
        });
        return results;
    };
    function fileMatchToSearchResultFormat(fileMatch, labelFormatter) {
        const textSerializations = fileMatch.textMatches().length > 0 ? matchesToSearchResultFormat(fileMatch.resource, fileMatch.textMatches().sort(searchModel_1.searchMatchComparer), fileMatch.context, labelFormatter) : undefined;
        const cellSerializations = fileMatch.cellMatches().sort((a, b) => a.cellIndex - b.cellIndex).sort().filter(cellMatch => cellMatch.contentMatches.length > 0).map((cellMatch, index) => cellMatchToSearchResultFormat(cellMatch, labelFormatter, index === 0));
        return [textSerializations, ...cellSerializations].filter(x => !!x);
    }
    function matchesToSearchResultFormat(resource, sortedMatches, matchContext, labelFormatter, shouldUseHeader = true) {
        const longestLineNumber = sortedMatches[sortedMatches.length - 1].range().endLineNumber.toString().length;
        const text = shouldUseHeader ? [`${labelFormatter(resource)}:`] : [];
        const matchRanges = [];
        const targetLineNumberToOffset = {};
        const context = [];
        matchContext.forEach((line, lineNumber) => context.push({ line, lineNumber }));
        context.sort((a, b) => a.lineNumber - b.lineNumber);
        let lastLine = undefined;
        const seenLines = new Set();
        sortedMatches.forEach(match => {
            matchToSearchResultFormat(match, longestLineNumber).forEach(match => {
                if (!seenLines.has(match.lineNumber)) {
                    while (context.length && context[0].lineNumber < +match.lineNumber) {
                        const { line, lineNumber } = context.shift();
                        if (lastLine !== undefined && lineNumber !== lastLine + 1) {
                            text.push('');
                        }
                        text.push(`  ${' '.repeat(longestLineNumber - `${lineNumber}`.length)}${lineNumber}  ${line}`);
                        lastLine = lineNumber;
                    }
                    targetLineNumberToOffset[match.lineNumber] = text.length;
                    seenLines.add(match.lineNumber);
                    text.push(match.line);
                    lastLine = +match.lineNumber;
                }
                matchRanges.push(...match.ranges.map(translateRangeLines(targetLineNumberToOffset[match.lineNumber])));
            });
        });
        while (context.length) {
            const { line, lineNumber } = context.shift();
            text.push(`  ${lineNumber}  ${line}`);
        }
        return { text, matchRanges };
    }
    function cellMatchToSearchResultFormat(cellMatch, labelFormatter, shouldUseHeader) {
        return matchesToSearchResultFormat(cellMatch.cell?.uri ?? cellMatch.parent.resource, cellMatch.contentMatches.sort(searchModel_1.searchMatchComparer), cellMatch.context, labelFormatter, shouldUseHeader);
    }
    const contentPatternToSearchConfiguration = (pattern, includes, excludes, contextLines) => {
        return {
            query: pattern.contentPattern.pattern,
            isRegexp: !!pattern.contentPattern.isRegExp,
            isCaseSensitive: !!pattern.contentPattern.isCaseSensitive,
            matchWholeWord: !!pattern.contentPattern.isWordMatch,
            filesToExclude: excludes, filesToInclude: includes,
            showIncludesExcludes: !!(includes || excludes || pattern?.userDisabledExcludesAndIgnoreFiles),
            useExcludeSettingsAndIgnoreFiles: (pattern?.userDisabledExcludesAndIgnoreFiles === undefined ? true : !pattern.userDisabledExcludesAndIgnoreFiles),
            contextLines,
            onlyOpenEditors: !!pattern.onlyOpenEditors,
            notebookSearchConfig: {
                includeMarkupInput: !!pattern.contentPattern.notebookInfo?.isInNotebookMarkdownInput,
                includeMarkupPreview: !!pattern.contentPattern.notebookInfo?.isInNotebookMarkdownPreview,
                includeCodeInput: !!pattern.contentPattern.notebookInfo?.isInNotebookCellInput,
                includeOutput: !!pattern.contentPattern.notebookInfo?.isInNotebookCellOutput,
            }
        };
    };
    const serializeSearchConfiguration = (config) => {
        const removeNullFalseAndUndefined = (a) => a.filter(a => a !== false && a !== null && a !== undefined);
        const escapeNewlines = (str) => str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
        return removeNullFalseAndUndefined([
            `# Query: ${escapeNewlines(config.query ?? '')}`,
            (config.isCaseSensitive || config.matchWholeWord || config.isRegexp || config.useExcludeSettingsAndIgnoreFiles === false)
                && `# Flags: ${(0, arrays_1.coalesce)([
                    config.isCaseSensitive && 'CaseSensitive',
                    config.matchWholeWord && 'WordMatch',
                    config.isRegexp && 'RegExp',
                    config.onlyOpenEditors && 'OpenEditors',
                    (config.useExcludeSettingsAndIgnoreFiles === false) && 'IgnoreExcludeSettings'
                ]).join(' ')}`,
            config.filesToInclude ? `# Including: ${config.filesToInclude}` : undefined,
            config.filesToExclude ? `# Excluding: ${config.filesToExclude}` : undefined,
            config.contextLines ? `# ContextLines: ${config.contextLines}` : undefined,
            ''
        ]).join(lineDelimiter);
    };
    exports.serializeSearchConfiguration = serializeSearchConfiguration;
    const extractSearchQueryFromModel = (model) => (0, exports.extractSearchQueryFromLines)(model.getValueInRange(new range_1.Range(1, 1, 6, 1)).split(lineDelimiter));
    exports.extractSearchQueryFromModel = extractSearchQueryFromModel;
    const defaultSearchConfig = () => ({
        query: '',
        filesToInclude: '',
        filesToExclude: '',
        isRegexp: false,
        isCaseSensitive: false,
        useExcludeSettingsAndIgnoreFiles: true,
        matchWholeWord: false,
        contextLines: 0,
        showIncludesExcludes: false,
        onlyOpenEditors: false,
        notebookSearchConfig: {
            includeMarkupInput: true,
            includeMarkupPreview: false,
            includeCodeInput: true,
            includeOutput: true,
        }
    });
    exports.defaultSearchConfig = defaultSearchConfig;
    const extractSearchQueryFromLines = (lines) => {
        const query = (0, exports.defaultSearchConfig)();
        const unescapeNewlines = (str) => {
            let out = '';
            for (let i = 0; i < str.length; i++) {
                if (str[i] === '\\') {
                    i++;
                    const escaped = str[i];
                    if (escaped === 'n') {
                        out += '\n';
                    }
                    else if (escaped === '\\') {
                        out += '\\';
                    }
                    else {
                        throw Error((0, nls_1.localize)('invalidQueryStringError', "All backslashes in Query string must be escaped (\\\\)"));
                    }
                }
                else {
                    out += str[i];
                }
            }
            return out;
        };
        const parseYML = /^# ([^:]*): (.*)$/;
        for (const line of lines) {
            const parsed = parseYML.exec(line);
            if (!parsed) {
                continue;
            }
            const [, key, value] = parsed;
            switch (key) {
                case 'Query':
                    query.query = unescapeNewlines(value);
                    break;
                case 'Including':
                    query.filesToInclude = value;
                    break;
                case 'Excluding':
                    query.filesToExclude = value;
                    break;
                case 'ContextLines':
                    query.contextLines = +value;
                    break;
                case 'Flags': {
                    query.isRegexp = value.indexOf('RegExp') !== -1;
                    query.isCaseSensitive = value.indexOf('CaseSensitive') !== -1;
                    query.useExcludeSettingsAndIgnoreFiles = value.indexOf('IgnoreExcludeSettings') === -1;
                    query.matchWholeWord = value.indexOf('WordMatch') !== -1;
                    query.onlyOpenEditors = value.indexOf('OpenEditors') !== -1;
                }
            }
        }
        query.showIncludesExcludes = !!(query.filesToInclude || query.filesToExclude || !query.useExcludeSettingsAndIgnoreFiles);
        return query;
    };
    exports.extractSearchQueryFromLines = extractSearchQueryFromLines;
    const serializeSearchResultForEditor = (searchResult, rawIncludePattern, rawExcludePattern, contextLines, labelFormatter, sortOrder, limitHit) => {
        if (!searchResult.query) {
            throw Error('Internal Error: Expected query, got null');
        }
        const config = contentPatternToSearchConfiguration(searchResult.query, rawIncludePattern, rawExcludePattern, contextLines);
        const filecount = searchResult.fileCount() > 1 ? (0, nls_1.localize)('numFiles', "{0} files", searchResult.fileCount()) : (0, nls_1.localize)('oneFile', "1 file");
        const resultcount = searchResult.count() > 1 ? (0, nls_1.localize)('numResults', "{0} results", searchResult.count()) : (0, nls_1.localize)('oneResult', "1 result");
        const info = [
            searchResult.count()
                ? `${resultcount} - ${filecount}`
                : (0, nls_1.localize)('noResults', "No Results"),
        ];
        if (limitHit) {
            info.push((0, nls_1.localize)('searchMaxResultsWarning', "The result set only contains a subset of all matches. Be more specific in your search to narrow down the results."));
        }
        info.push('');
        const matchComparer = (a, b) => (0, searchModel_1.searchMatchComparer)(a, b, sortOrder);
        const allResults = flattenSearchResultSerializations((0, arrays_1.flatten)(searchResult.folderMatches().sort(matchComparer)
            .map(folderMatch => folderMatch.allDownstreamFileMatches().sort(matchComparer)
            .flatMap(fileMatch => fileMatchToSearchResultFormat(fileMatch, labelFormatter)))));
        return {
            matchRanges: allResults.matchRanges.map(translateRangeLines(info.length)),
            text: info.concat(allResults.text).join(lineDelimiter),
            config
        };
    };
    exports.serializeSearchResultForEditor = serializeSearchResultForEditor;
    const flattenSearchResultSerializations = (serializations) => {
        const text = [];
        const matchRanges = [];
        serializations.forEach(serialized => {
            serialized.matchRanges.map(translateRangeLines(text.length)).forEach(range => matchRanges.push(range));
            serialized.text.forEach(line => text.push(line));
            text.push(''); // new line
        });
        return { text, matchRanges };
    };
    const parseSavedSearchEditor = async (accessor, resource) => {
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const text = (await textFileService.read(resource)).value;
        return (0, exports.parseSerializedSearchEditor)(text);
    };
    exports.parseSavedSearchEditor = parseSavedSearchEditor;
    const parseSerializedSearchEditor = (text) => {
        const headerlines = [];
        const bodylines = [];
        let inHeader = true;
        for (const line of text.split(/\r?\n/g)) {
            if (inHeader) {
                headerlines.push(line);
                if (line === '') {
                    inHeader = false;
                }
            }
            else {
                bodylines.push(line);
            }
        }
        return { config: (0, exports.extractSearchQueryFromLines)(headerlines), text: bodylines.join('\n') };
    };
    exports.parseSerializedSearchEditor = parseSerializedSearchEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yU2VyaWFsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoRWRpdG9yL2Jyb3dzZXIvc2VhcmNoRWRpdG9yU2VyaWFsaXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsa0VBQWtFO0lBQ2xFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQztJQUUzQixNQUFNLG1CQUFtQixHQUN4QixDQUFDLENBQVMsRUFBRSxFQUFFLENBQ2IsQ0FBQyxLQUFZLEVBQUUsRUFBRSxDQUNoQixJQUFJLGFBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVyRyxNQUFNLHlCQUF5QixHQUFHLENBQUMsS0FBWSxFQUFFLGlCQUF5QixFQUEyRCxFQUFFO1FBQ3RJLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFFNUUsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFHaEQsTUFBTSxPQUFPLEdBQTRELEVBQUUsQ0FBQztRQUU1RSxjQUFjO2FBQ1osT0FBTyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFCLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMs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