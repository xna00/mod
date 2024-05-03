/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findSectionHeaders = findSectionHeaders;
    const markRegex = /\bMARK:\s*(.*)$/d;
    const trimDashesRegex = /^-+|-+$/g;
    /**
     * Find section headers in the model.
     *
     * @param model the text model to search in
     * @param options options to search with
     * @returns an array of section headers
     */
    function findSectionHeaders(model, options) {
        let headers = [];
        if (options.findRegionSectionHeaders && options.foldingRules?.markers) {
            const regionHeaders = collectRegionHeaders(model, options);
            headers = headers.concat(regionHeaders);
        }
        if (options.findMarkSectionHeaders) {
            const markHeaders = collectMarkHeaders(model);
            headers = headers.concat(markHeaders);
        }
        return headers;
    }
    function collectRegionHeaders(model, options) {
        const regionHeaders = [];
        const endLineNumber = model.getLineCount();
        for (let lineNumber = 1; lineNumber <= endLineNumber; lineNumber++) {
            const lineContent = model.getLineContent(lineNumber);
            const match = lineContent.match(options.foldingRules.markers.start);
            if (match) {
                const range = { startLineNumber: lineNumber, startColumn: match[0].length + 1, endLineNumber: lineNumber, endColumn: lineContent.length + 1 };
                if (range.endColumn > range.startColumn) {
                    const sectionHeader = {
                        range,
                        ...getHeaderText(lineContent.substring(match[0].length)),
                        shouldBeInComments: false
                    };
                    if (sectionHeader.text || sectionHeader.hasSeparatorLine) {
                        regionHeaders.push(sectionHeader);
                    }
                }
            }
        }
        return regionHeaders;
    }
    function collectMarkHeaders(model) {
        const markHeaders = [];
        const endLineNumber = model.getLineCount();
        for (let lineNumber = 1; lineNumber <= endLineNumber; lineNumber++) {
            const lineContent = model.getLineContent(lineNumber);
            addMarkHeaderIfFound(lineContent, lineNumber, markHeaders);
        }
        return markHeaders;
    }
    function addMarkHeaderIfFound(lineContent, lineNumber, sectionHeaders) {
        markRegex.lastIndex = 0;
        const match = markRegex.exec(lineContent);
        if (match) {
            const column = match.indices[1][0] + 1;
            const endColumn = match.indices[1][1] + 1;
            const range = { startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: endColumn };
            if (range.endColumn > range.startColumn) {
                const sectionHeader = {
                    range,
                    ...getHeaderText(match[1]),
                    shouldBeInComments: true
                };
                if (sectionHeader.text || sectionHeader.hasSeparatorLine) {
                    sectionHeaders.push(sectionHeader);
                }
            }
        }
    }
    function getHeaderText(text) {
        text = text.trim();
        const hasSeparatorLine = text.startsWith('-');
        text = text.replace(trimDashesRegex, '');
        return { text, hasSeparatorLine };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZFNlY3Rpb25IZWFkZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2ZpbmRTZWN0aW9uSGVhZGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZDaEcsZ0RBV0M7SUFyQkQsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUM7SUFDckMsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDO0lBRW5DOzs7Ozs7T0FNRztJQUNILFNBQWdCLGtCQUFrQixDQUFDLEtBQWlDLEVBQUUsT0FBaUM7UUFDdEcsSUFBSSxPQUFPLEdBQW9CLEVBQUUsQ0FBQztRQUNsQyxJQUFJLE9BQU8sQ0FBQyx3QkFBd0IsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3ZFLE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzRCxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQ0QsSUFBSSxPQUFPLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUNwQyxNQUFNLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUMsS0FBaUMsRUFBRSxPQUFpQztRQUNqRyxNQUFNLGFBQWEsR0FBb0IsRUFBRSxDQUFDO1FBQzFDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMzQyxLQUFLLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxVQUFVLElBQUksYUFBYSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDcEUsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFhLENBQUMsT0FBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxLQUFLLEdBQUcsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5SSxJQUFJLEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN6QyxNQUFNLGFBQWEsR0FBRzt3QkFDckIsS0FBSzt3QkFDTCxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDeEQsa0JBQWtCLEVBQUUsS0FBSztxQkFDekIsQ0FBQztvQkFDRixJQUFJLGFBQWEsQ0FBQyxJQUFJLElBQUksYUFBYSxDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQzFELGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ25DLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxhQUFhLENBQUM7SUFDdEIsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBaUM7UUFDNUQsTUFBTSxXQUFXLEdBQW9CLEVBQUUsQ0FBQztRQUN4QyxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0MsS0FBSyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxJQUFJLGFBQWEsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO1lBQ3BFLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsb0JBQW9CLENBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQ0QsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUMsV0FBbUIsRUFBRSxVQUFrQixFQUFFLGNBQStCO1FBQ3JHLFNBQVMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUMsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNYLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxPQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sS0FBSyxHQUFHLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDO1lBQ3BILElBQUksS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sYUFBYSxHQUFHO29CQUNyQixLQUFLO29CQUNMLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsa0JBQWtCLEVBQUUsSUFBSTtpQkFDeEIsQ0FBQztnQkFDRixJQUFJLGFBQWEsQ0FBQyxJQUFJLElBQUksYUFBYSxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQzFELGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFZO1FBQ2xDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbkIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6QyxPQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUM7SUFDbkMsQ0FBQyJ9