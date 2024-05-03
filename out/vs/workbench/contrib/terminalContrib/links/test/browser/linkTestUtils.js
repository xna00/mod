/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert"], function (require, exports, assert_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertLinkHelper = assertLinkHelper;
    async function assertLinkHelper(text, expected, detector, expectedType) {
        detector.xterm.reset();
        // Write the text and wait for the parser to finish
        await new Promise(r => detector.xterm.write(text, r));
        const textSplit = text.split('\r\n');
        const lastLineIndex = textSplit.filter((e, i) => i !== textSplit.length - 1).reduce((p, c) => {
            return p + Math.max(Math.ceil(c.length / 80), 1);
        }, 0);
        // Ensure all links are provided
        const lines = [];
        for (let i = 0; i < detector.xterm.buffer.active.cursorY + 1; i++) {
            lines.push(detector.xterm.buffer.active.getLine(i));
        }
        // Detect links always on the last line with content
        const actualLinks = (await detector.detect(lines, lastLineIndex, detector.xterm.buffer.active.cursorY)).map(e => {
            return {
                link: e.uri?.toString() ?? e.text,
                type: expectedType,
                bufferRange: e.bufferRange
            };
        });
        const expectedLinks = expected.map(e => {
            return {
                type: expectedType,
                link: 'uri' in e ? e.uri.toString() : e.text,
                bufferRange: {
                    start: { x: e.range[0][0], y: e.range[0][1] },
                    end: { x: e.range[1][0], y: e.range[1][1] },
                }
            };
        });
        (0, assert_1.deepStrictEqual)(actualLinks, expectedLinks);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua1Rlc3RVdGlscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL3Rlc3QvYnJvd3Nlci9saW5rVGVzdFV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLDRDQXdDQztJQXhDTSxLQUFLLFVBQVUsZ0JBQWdCLENBQ3JDLElBQVksRUFDWixRQUFtRyxFQUNuRyxRQUErQixFQUMvQixZQUE4QjtRQUU5QixRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXZCLG1EQUFtRDtRQUNuRCxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVGLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVOLGdDQUFnQztRQUNoQyxNQUFNLEtBQUssR0FBa0IsRUFBRSxDQUFDO1FBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ25FLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxvREFBb0Q7UUFDcEQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDL0csT0FBTztnQkFDTixJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSTtnQkFDakMsSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVzthQUMxQixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3RDLE9BQU87Z0JBQ04sSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLElBQUksRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDNUMsV0FBVyxFQUFFO29CQUNaLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUM3QyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtpQkFDM0M7YUFDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFBLHdCQUFlLEVBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdDLENBQUMifQ==