/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/services/search/common/search"], function (require, exports, range_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorMatchesToTextSearchResults = editorMatchesToTextSearchResults;
    exports.getTextSearchMatchWithModelContext = getTextSearchMatchWithModelContext;
    function editorMatchToTextSearchResult(matches, model, previewOptions) {
        const firstLine = matches[0].range.startLineNumber;
        const lastLine = matches[matches.length - 1].range.endLineNumber;
        const lineTexts = [];
        for (let i = firstLine; i <= lastLine; i++) {
            lineTexts.push(model.getLineContent(i));
        }
        return new search_1.TextSearchMatch(lineTexts.join('\n') + '\n', matches.map(m => new range_1.Range(m.range.startLineNumber - 1, m.range.startColumn - 1, m.range.endLineNumber - 1, m.range.endColumn - 1)), previewOptions);
    }
    /**
     * Combine a set of FindMatches into a set of TextSearchResults. They should be grouped by matches that start on the same line that the previous match ends on.
     */
    function editorMatchesToTextSearchResults(matches, model, previewOptions) {
        let previousEndLine = -1;
        const groupedMatches = [];
        let currentMatches = [];
        matches.forEach((match) => {
            if (match.range.startLineNumber !== previousEndLine) {
                currentMatches = [];
                groupedMatches.push(currentMatches);
            }
            currentMatches.push(match);
            previousEndLine = match.range.endLineNumber;
        });
        return groupedMatches.map(sameLineMatches => {
            return editorMatchToTextSearchResult(sameLineMatches, model, previewOptions);
        });
    }
    function getTextSearchMatchWithModelContext(matches, model, query) {
        const results = [];
        let prevLine = -1;
        for (let i = 0; i < matches.length; i++) {
            const { start: matchStartLine, end: matchEndLine } = getMatchStartEnd(matches[i]);
            if (typeof query.beforeContext === 'number' && query.beforeContext > 0) {
                const beforeContextStartLine = Math.max(prevLine + 1, matchStartLine - query.beforeContext);
                for (let b = beforeContextStartLine; b < matchStartLine; b++) {
                    results.push({
                        text: model.getLineContent(b + 1),
                        lineNumber: b + 1
                    });
                }
            }
            results.push(matches[i]);
            const nextMatch = matches[i + 1];
            const nextMatchStartLine = nextMatch ? getMatchStartEnd(nextMatch).start : Number.MAX_VALUE;
            if (typeof query.afterContext === 'number' && query.afterContext > 0) {
                const afterContextToLine = Math.min(nextMatchStartLine - 1, matchEndLine + query.afterContext, model.getLineCount() - 1);
                for (let a = matchEndLine + 1; a <= afterContextToLine; a++) {
                    results.push({
                        text: model.getLineContent(a + 1),
                        lineNumber: a + 1
                    });
                }
            }
            prevLine = matchEndLine;
        }
        return results;
    }
    function getMatchStartEnd(match) {
        const matchRanges = match.ranges;
        const matchStartLine = Array.isArray(matchRanges) ? matchRanges[0].startLineNumber : matchRanges.startLineNumber;
        const matchEndLine = Array.isArray(matchRanges) ? matchRanges[matchRanges.length - 1].endLineNumber : matchRanges.endLineNumber;
        return {
            start: matchStartLine,
            end: matchEndLine
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoSGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9jb21tb24vc2VhcmNoSGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdCaEcsNEVBaUJDO0lBRUQsZ0ZBa0NDO0lBdkVELFNBQVMsNkJBQTZCLENBQUMsT0FBb0IsRUFBRSxLQUFpQixFQUFFLGNBQTBDO1FBQ3pILE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7UUFFakUsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsSUFBSSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM1QyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsT0FBTyxJQUFJLHdCQUFlLENBQ3pCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxT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