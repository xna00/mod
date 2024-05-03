/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path"], function (require, exports, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertLinkRangeToBuffer = convertLinkRangeToBuffer;
    exports.convertBufferRangeToViewport = convertBufferRangeToViewport;
    exports.getXtermLineContent = getXtermLineContent;
    exports.getXtermRangesByAttr = getXtermRangesByAttr;
    exports.updateLinkWithRelativeCwd = updateLinkWithRelativeCwd;
    exports.osPathModule = osPathModule;
    /**
     * Converts a possibly wrapped link's range (comprised of string indices) into a buffer range that plays nicely with xterm.js
     *
     * @param lines A single line (not the entire buffer)
     * @param bufferWidth The number of columns in the terminal
     * @param range The link range - string indices
     * @param startLine The absolute y position (on the buffer) of the line
     */
    function convertLinkRangeToBuffer(lines, bufferWidth, range, startLine) {
        const bufferRange = {
            start: {
                x: range.startColumn,
                y: range.startLineNumber + startLine
            },
            end: {
                x: range.endColumn - 1,
                y: range.endLineNumber + startLine
            }
        };
        // Shift start range right for each wide character before the link
        let startOffset = 0;
        const startWrappedLineCount = Math.ceil(range.startColumn / bufferWidth);
        for (let y = 0; y < Math.min(startWrappedLineCount); y++) {
            const lineLength = Math.min(bufferWidth, (range.startColumn - 1) - y * bufferWidth);
            let lineOffset = 0;
            const line = lines[y];
            // Sanity check for line, apparently this can happen but it's not clear under what
            // circumstances this happens. Continue on, skipping the remainder of start offset if this
            // happens to minimize impact.
            if (!line) {
                break;
            }
            for (let x = 0; x < Math.min(bufferWidth, lineLength + lineOffset); x++) {
                const cell = line.getCell(x);
                // This is unexpected but it means the character doesn't exist, so we shouldn't add to
                // the offset
                if (!cell) {
                    break;
                }
                const width = cell.getWidth();
                if (width === 2) {
                    lineOffset++;
                }
                const char = cell.getChars();
                if (char.length > 1) {
                    lineOffset -= char.length - 1;
                }
            }
            startOffset += lineOffset;
        }
        // Shift end range right for each wide character inside the link
        let endOffset = 0;
        const endWrappedLineCount = Math.ceil(range.endColumn / bufferWidth);
        for (let y = Math.max(0, startWrappedLineCount - 1); y < endWrappedLineCount; y++) {
            const start = (y === startWrappedLineCount - 1 ? (range.startColumn - 1 + startOffset) % bufferWidth : 0);
            const lineLength = Math.min(bufferWidth, range.endColumn + startOffset - y * bufferWidth);
            let lineOffset = 0;
            const line = lines[y];
            // Sanity check for line, apparently this can happen but it's not clear under what
            // circumstances this happens. Continue on, skipping the remainder of start offset if this
            // happens to minimize impact.
            if (!line) {
                break;
            }
            for (let x = start; x < Math.min(bufferWidth, lineLength + lineOffset); x++) {
                const cell = line.getCell(x);
                // This is unexpected but it means the character doesn't exist, so we shouldn't add to
                // the offset
                if (!cell) {
                    break;
                }
                const width = cell.getWidth();
                const chars = cell.getChars();
                // Offset for null cells following wide characters
                if (width === 2) {
                    lineOffset++;
                }
                // Offset for early wrapping when the last cell in row is a wide character
                if (x === bufferWidth - 1 && chars === '') {
                    lineOffset++;
                }
                // Offset multi-code characters like emoji
                if (chars.length > 1) {
                    lineOffset -= chars.length - 1;
                }
            }
            endOffset += lineOffset;
        }
        // Apply the width character offsets to the result
        bufferRange.start.x += startOffset;
        bufferRange.end.x += startOffset + endOffset;
        // Convert back to wrapped lines
        while (bufferRange.start.x > bufferWidth) {
            bufferRange.start.x -= bufferWidth;
            bufferRange.start.y++;
        }
        while (bufferRange.end.x > bufferWidth) {
            bufferRange.end.x -= bufferWidth;
            bufferRange.end.y++;
        }
        return bufferRange;
    }
    function convertBufferRangeToViewport(bufferRange, viewportY) {
        return {
            start: {
                x: bufferRange.start.x - 1,
                y: bufferRange.start.y - viewportY - 1
            },
            end: {
                x: bufferRange.end.x - 1,
                y: bufferRange.end.y - viewportY - 1
            }
        };
    }
    function getXtermLineContent(buffer, lineStart, lineEnd, cols) {
        // Cap the maximum number of lines generated to prevent potential performance problems. This is
        // more of a sanity check as the wrapped line should already be trimmed down at this point.
        const maxLineLength = Math.max(2048, cols * 2);
        lineEnd = Math.min(lineEnd, lineStart + maxLineLength);
        let content = '';
        for (let i = lineStart; i <= lineEnd; i++) {
            // Make sure only 0 to cols are considered as resizing when windows mode is enabled will
            // retain buffer data outside of the terminal width as reflow is disabled.
            const line = buffer.getLine(i);
            if (line) {
                content += line.translateToString(true, 0, cols);
            }
        }
        return content;
    }
    function getXtermRangesByAttr(buffer, lineStart, lineEnd, cols) {
        let bufferRangeStart = undefined;
        let lastFgAttr = -1;
        let lastBgAttr = -1;
        const ranges = [];
        for (let y = lineStart; y <= lineEnd; y++) {
            const line = buffer.getLine(y);
            if (!line) {
                continue;
            }
            for (let x = 0; x < cols; x++) {
                const cell = line.getCell(x);
                if (!cell) {
                    break;
                }
                // HACK: Re-construct the attributes from fg and bg, this is hacky as it relies
                // upon the internal buffer bit layout
                const thisFgAttr = (cell.isBold() |
                    cell.isInverse() |
                    cell.isStrikethrough() |
                    cell.isUnderline());
                const thisBgAttr = (cell.isDim() |
                    cell.isItalic());
                if (lastFgAttr === -1 || lastBgAttr === -1) {
                    bufferRangeStart = { x, y };
                }
                else {
                    if (lastFgAttr !== thisFgAttr || lastBgAttr !== thisBgAttr) {
                        // TODO: x overflow
                        const bufferRangeEnd = { x, y };
                        ranges.push({
                            start: bufferRangeStart,
                            end: bufferRangeEnd
                        });
                        bufferRangeStart = { x, y };
                    }
                }
                lastFgAttr = thisFgAttr;
                lastBgAttr = thisBgAttr;
            }
        }
        return ranges;
    }
    // export function positionIsInRange(position: IBufferCellPosition, range: IBufferRange): boolean {
    // 	if (position.y < range.start.y || position.y > range.end.y) {
    // 		return false;
    // 	}
    // 	if (position.y === range.start.y && position.x < range.start.x) {
    // 		return false;
    // 	}
    // 	if (position.y === range.end.y && position.x > range.end.x) {
    // 		return false;
    // 	}
    // 	return true;
    // }
    /**
     * For shells with the CommandDetection capability, the cwd for a command relative to the line of
     * the particular link can be used to narrow down the result for an exact file match.
     */
    function updateLinkWithRelativeCwd(capabilities, y, text, osPath, logService) {
        const cwd = capabilities.get(2 /* TerminalCapability.CommandDetection */)?.getCwdForLine(y);
        logService.trace('terminalLinkHelpers#updateLinkWithRelativeCwd cwd', cwd);
        if (!cwd) {
            return undefined;
        }
        const result = [];
        const sep = osPath.sep;
        if (!text.includes(sep)) {
            result.push(osPath.resolve(cwd + sep + text));
        }
        else {
            let commonDirs = 0;
            let i = 0;
            const cwdPath = cwd.split(sep).reverse();
            const linkPath = text.split(sep);
            // Get all results as candidates, prioritizing the link with the most common directories.
            // For example if in the directory /home/common and the link is common/file, the result
            // should be: `['/home/common/common/file', '/home/common/file']`. The first is the most
            // likely as cwd detection is active.
            while (i < cwdPath.length) {
                result.push(osPath.resolve(cwd + sep + linkPath.slice(commonDirs).join(sep)));
                if (cwdPath[i] === linkPath[i]) {
                    commonDirs++;
                }
                else {
                    break;
                }
                i++;
            }
        }
        return result;
    }
    function osPathModule(os) {
        return os === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rSGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxMaW5rSGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsNERBdUdDO0lBRUQsb0VBV0M7SUFFRCxrREFlQztJQUVELG9EQTZDQztJQW9CRCw4REE4QkM7SUFFRCxvQ0FFQztJQWxQRDs7Ozs7OztPQU9HO0lBQ0gsU0FBZ0Isd0JBQXdCLENBQ3ZDLEtBQW9CLEVBQ3BCLFdBQW1CLEVBQ25CLEtBQWEsRUFDYixTQUFpQjtRQUVqQixNQUFNLFdBQVcsR0FBaUI7WUFDakMsS0FBSyxFQUFFO2dCQUNOLENBQUMsRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDcEIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxlQUFlLEdBQUcsU0FBUzthQUNwQztZQUNELEdBQUcsRUFBRTtnQkFDSixDQUFDLEVBQUUsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDO2dCQUN0QixDQUFDLEVBQUUsS0FBSyxDQUFDLGFBQWEsR0FBRyxTQUFTO2FBQ2xDO1NBQ0QsQ0FBQztRQUVGLGtFQUFrRTtRQUNsRSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDcEIsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLENBQUM7UUFDekUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzFELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxF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