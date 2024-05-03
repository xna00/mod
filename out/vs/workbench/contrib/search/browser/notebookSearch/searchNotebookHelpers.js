/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/search/common/search", "vs/editor/common/core/range", "vs/workbench/contrib/search/common/searchNotebookHelpers"], function (require, exports, search_1, range_1, searchNotebookHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIDFromINotebookCellMatch = getIDFromINotebookCellMatch;
    exports.isINotebookFileMatchWithModel = isINotebookFileMatchWithModel;
    exports.isINotebookCellMatchWithModel = isINotebookCellMatchWithModel;
    exports.contentMatchesToTextSearchMatches = contentMatchesToTextSearchMatches;
    exports.webviewMatchesToTextSearchMatches = webviewMatchesToTextSearchMatches;
    function getIDFromINotebookCellMatch(match) {
        if (isINotebookCellMatchWithModel(match)) {
            return match.cell.id;
        }
        else {
            return `${searchNotebookHelpers_1.rawCellPrefix}${match.index}`;
        }
    }
    function isINotebookFileMatchWithModel(object) {
        return 'cellResults' in object && object.cellResults instanceof Array && object.cellResults.every(isINotebookCellMatchWithModel);
    }
    function isINotebookCellMatchWithModel(object) {
        return 'cell' in object;
    }
    function contentMatchesToTextSearchMatches(contentMatches, cell) {
        return (0, searchNotebookHelpers_1.genericCellMatchesToTextSearchMatches)(contentMatches, cell.textBuffer);
    }
    function webviewMatchesToTextSearchMatches(webviewMatches) {
        return webviewMatches
            .map(rawMatch => (rawMatch.searchPreviewInfo) ?
            new search_1.TextSearchMatch(rawMatch.searchPreviewInfo.line, new range_1.Range(0, rawMatch.searchPreviewInfo.range.start, 0, rawMatch.searchPreviewInfo.range.end), undefined, rawMatch.index) : undefined).filter((e) => !!e);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTm90ZWJvb2tIZWxwZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9ub3RlYm9va1NlYXJjaC9zZWFyY2hOb3RlYm9va0hlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsa0VBTUM7SUFTRCxzRUFFQztJQUVELHNFQUVDO0lBRUQsOEVBS0M7SUFFRCw4RUFVQztJQXhDRCxTQUFnQiwyQkFBMkIsQ0FBQyxLQUF5QjtRQUNwRSxJQUFJLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDMUMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUN0QixDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sR0FBRyxxQ0FBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QyxDQUFDO0lBQ0YsQ0FBQztJQVNELFNBQWdCLDZCQUE2QixDQUFDLE1BQVc7UUFDeEQsT0FBTyxhQUFhLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxXQUFXLFlBQVksS0FBSyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDbEksQ0FBQztJQUVELFNBQWdCLDZCQUE2QixDQUFDLE1BQVc7UUFDeEQsT0FBTyxNQUFNLElBQUksTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxTQUFnQixpQ0FBaUMsQ0FBQyxjQUEyQixFQUFFLElBQW9CO1FBQ2xHLE9BQU8sSUFBQSw2REFBcUMsRUFDM0MsY0FBYyxFQUNkLElBQUksQ0FBQyxVQUFVLENBQ2YsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQixpQ0FBaUMsQ0FBQyxjQUFzQztRQUN2RixPQUFPLGNBQWM7YUFDbkIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQ2YsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksd0JBQWUsQ0FDbEIsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFDL0IsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUM3RixTQUFTLEVBQ1QsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQzdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlDLENBQUMifQ==