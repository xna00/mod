/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/search/common/search", "vs/editor/common/core/range"], function (require, exports, search_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rawCellPrefix = void 0;
    exports.isINotebookFileMatchNoModel = isINotebookFileMatchNoModel;
    exports.genericCellMatchesToTextSearchMatches = genericCellMatchesToTextSearchMatches;
    function isINotebookFileMatchNoModel(object) {
        return 'cellResults' in object;
    }
    exports.rawCellPrefix = 'rawCell#';
    function genericCellMatchesToTextSearchMatches(contentMatches, buffer) {
        let previousEndLine = -1;
        const contextGroupings = [];
        let currentContextGrouping = [];
        contentMatches.forEach((match) => {
            if (match.range.startLineNumber !== previousEndLine) {
                if (currentContextGrouping.length > 0) {
                    contextGroupings.push([...currentContextGrouping]);
                    currentContextGrouping = [];
                }
            }
            currentContextGrouping.push(match);
            previousEndLine = match.range.endLineNumber;
        });
        if (currentContextGrouping.length > 0) {
            contextGroupings.push([...currentContextGrouping]);
        }
        const textSearchResults = contextGroupings.map((grouping) => {
            const lineTexts = [];
            const firstLine = grouping[0].range.startLineNumber;
            const lastLine = grouping[grouping.length - 1].range.endLineNumber;
            for (let i = firstLine; i <= lastLine; i++) {
                lineTexts.push(buffer.getLineContent(i));
            }
            return new search_1.TextSearchMatch(lineTexts.join('\n') + '\n', grouping.map(m => new range_1.Range(m.range.startLineNumber - 1, m.range.startColumn - 1, m.range.endLineNumber - 1, m.range.endColumn - 1)));
        });
        return textSearchResults;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTm90ZWJvb2tIZWxwZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvY29tbW9uL3NlYXJjaE5vdGVib29rSGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHLGtFQUVDO0lBSUQsc0ZBbUNDO0lBekNELFNBQWdCLDJCQUEyQixDQUFDLE1BQWtCO1FBQzdELE9BQU8sYUFBYSxJQUFJLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBRVksUUFBQSxhQUFhLEdBQUcsVUFBVSxDQUFDO0lBRXhDLFNBQWdCLHFDQUFxQyxDQUFDLGNBQTJCLEVBQUUsTUFBMkI7UUFDN0csSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekIsTUFBTSxnQkFBZ0IsR0FBa0IsRUFBRSxDQUFDO1FBQzNDLElBQUksc0JBQXNCLEdBQWdCLEVBQUUsQ0FBQztRQUU3QyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDaEMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsS0FBSyxlQUFlLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxzQkFBc0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO29CQUNuRCxzQkFBc0IsR0FBRyxFQUFFLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDO1lBRUQsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLGVBQWUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksc0JBQXNCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxNQUFNLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQzNELE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztZQUMvQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztZQUNwRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO1lBQ25FLEtBQUssSUFBSSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsSUFBSSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDNUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELE9BQU8sSUFBSSx3QkFBZSxDQUN6QixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksRUFDM0IsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQ3BJLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8saUJBQWlCLENBQUM7SUFDMUIsQ0FBQyJ9