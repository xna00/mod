/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers"], function (require, exports, terminalLinkHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalExternalLinkDetector = void 0;
    class TerminalExternalLinkDetector {
        constructor(id, xterm, _provideLinks) {
            this.id = id;
            this.xterm = xterm;
            this._provideLinks = _provideLinks;
            this.maxLinkLength = 2000;
        }
        async detect(lines, startLine, endLine) {
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > this.maxLinkLength) {
                return [];
            }
            const externalLinks = await this._provideLinks(text);
            if (!externalLinks) {
                return [];
            }
            const result = externalLinks.map(link => {
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: link.startIndex + 1,
                    startLineNumber: 1,
                    endColumn: link.startIndex + link.length + 1,
                    endLineNumber: 1
                }, startLine);
                const matchingText = text.substring(link.startIndex, link.startIndex + link.length) || '';
                const l = {
                    text: matchingText,
                    label: link.label,
                    bufferRange,
                    type: { id: this.id },
                    activate: link.activate
                };
                return l;
            });
            return result;
        }
    }
    exports.TerminalExternalLinkDetector = TerminalExternalLinkDetector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFeHRlcm5hbExpbmtEZXRlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxFeHRlcm5hbExpbmtEZXRlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSw0QkFBNEI7UUFHeEMsWUFDVSxFQUFVLEVBQ1YsS0FBZSxFQUNQLGFBQTBFO1lBRmxGLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixVQUFLLEdBQUwsS0FBSyxDQUFVO1lBQ1Asa0JBQWEsR0FBYixhQUFhLENBQTZEO1lBTG5GLGtCQUFhLEdBQUcsSUFBSSxDQUFDO1FBTzlCLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQW9CLEVBQUUsU0FBaUIsRUFBRSxPQUFlO1lBQ3BFLGtEQUFrRDtZQUNsRCxNQUFNLElBQUksR0FBRyxJQUFBLHlDQUFtQixFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEcsSUFBSSxJQUFJLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLFdBQVcsR0FBRyxJQUFBLDhDQUF3QixFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtvQkFDcEUsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQztvQkFDaEMsZUFBZSxFQUFFLENBQUM7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztvQkFDNUMsYUFBYSxFQUFFLENBQUM7aUJBQ2hCLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ2QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFMUYsTUFBTSxDQUFDLEdBQXdCO29CQUM5QixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNqQixXQUFXO29CQUNYLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO29CQUNyQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7aUJBQ3ZCLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztLQUNEO0lBM0NELG9FQTJDQyJ9