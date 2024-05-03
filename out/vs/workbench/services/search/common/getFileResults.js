/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFileResults = void 0;
    const getFileResults = (bytes, pattern, options) => {
        let text;
        if (bytes[0] === 0xff && bytes[1] === 0xfe) {
            text = new TextDecoder('utf-16le').decode(bytes);
        }
        else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
            text = new TextDecoder('utf-16be').decode(bytes);
        }
        else {
            text = new TextDecoder('utf8').decode(bytes);
            if (text.slice(0, 1000).includes('\uFFFD') && bytes.includes(0)) {
                return [];
            }
        }
        const results = [];
        const patternIndecies = [];
        let patternMatch = null;
        let remainingResultQuota = options.remainingResultQuota;
        while (remainingResultQuota >= 0 && (patternMatch = pattern.exec(text))) {
            patternIndecies.push({ matchStartIndex: patternMatch.index, matchedText: patternMatch[0] });
            remainingResultQuota--;
        }
        if (patternIndecies.length) {
            const contextLinesNeeded = new Set();
            const resultLines = new Set();
            const lineRanges = [];
            const readLine = (lineNumber) => text.slice(lineRanges[lineNumber].start, lineRanges[lineNumber].end);
            let prevLineEnd = 0;
            let lineEndingMatch = null;
            const lineEndRegex = /\r?\n/g;
            while ((lineEndingMatch = lineEndRegex.exec(text))) {
                lineRanges.push({ start: prevLineEnd, end: lineEndingMatch.index });
                prevLineEnd = lineEndingMatch.index + lineEndingMatch[0].length;
            }
            if (prevLineEnd < text.length) {
                lineRanges.push({ start: prevLineEnd, end: text.length });
            }
            let startLine = 0;
            for (const { matchStartIndex, matchedText } of patternIndecies) {
                if (remainingResultQuota < 0) {
                    break;
                }
                while (Boolean(lineRanges[startLine + 1]) && matchStartIndex > lineRanges[startLine].end) {
                    startLine++;
                }
                let endLine = startLine;
                while (Boolean(lineRanges[endLine + 1]) && matchStartIndex + matchedText.length > lineRanges[endLine].end) {
                    endLine++;
                }
                if (options.beforeContext) {
                    for (let contextLine = Math.max(0, startLine - options.beforeContext); contextLine < startLine; contextLine++) {
                        contextLinesNeeded.add(contextLine);
                    }
                }
                let previewText = '';
                let offset = 0;
                for (let matchLine = startLine; matchLine <= endLine; matchLine++) {
                    let previewLine = readLine(matchLine);
                    if (options.previewOptions?.charsPerLine && previewLine.length > options.previewOptions.charsPerLine) {
                        offset = Math.max(matchStartIndex - lineRanges[startLine].start - 20, 0);
                        previewLine = previewLine.substr(offset, options.previewOptions.charsPerLine);
                    }
                    previewText += `${previewLine}\n`;
                    resultLines.add(matchLine);
                }
                const fileRange = new range_1.Range(startLine, matchStartIndex - lineRanges[startLine].start, endLine, matchStartIndex + matchedText.length - lineRanges[endLine].start);
                const previewRange = new range_1.Range(0, matchStartIndex - lineRanges[startLine].start - offset, endLine - startLine, matchStartIndex + matchedText.length - lineRanges[endLine].start - (endLine === startLine ? offset : 0));
                const match = {
                    ranges: fileRange,
                    preview: { text: previewText, matches: previewRange },
                };
                results.push(match);
                if (options.afterContext) {
                    for (let contextLine = endLine + 1; contextLine <= Math.min(endLine + options.afterContext, lineRanges.length - 1); contextLine++) {
                        contextLinesNeeded.add(contextLine);
                    }
                }
            }
            for (const contextLine of contextLinesNeeded) {
                if (!resultLines.has(contextLine)) {
                    results.push({
                        text: readLine(contextLine),
                        lineNumber: contextLine + 1,
                    });
                }
            }
        }
        return results;
    };
    exports.getFileResults = getFileResults;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0RmlsZVJlc3VsdHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL2dldEZpbGVSZXN1bHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU16RixNQUFNLGNBQWMsR0FBRyxDQUM3QixLQUFpQixFQUNqQixPQUFlLEVBQ2YsT0FLQyxFQUNxQixFQUFFO1FBRXhCLElBQUksSUFBWSxDQUFDO1FBQ2pCLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDNUMsSUFBSSxHQUFHLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRCxDQUFDO2FBQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuRCxJQUFJLEdBQUcsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELENBQUM7YUFBTSxDQUFDO1lBQ1AsSUFBSSxHQUFHLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pFLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLE9BQU8s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