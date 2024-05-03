/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StringEOL = void 0;
    exports.countEOL = countEOL;
    var StringEOL;
    (function (StringEOL) {
        StringEOL[StringEOL["Unknown"] = 0] = "Unknown";
        StringEOL[StringEOL["Invalid"] = 3] = "Invalid";
        StringEOL[StringEOL["LF"] = 1] = "LF";
        StringEOL[StringEOL["CRLF"] = 2] = "CRLF";
    })(StringEOL || (exports.StringEOL = StringEOL = {}));
    function countEOL(text) {
        let eolCount = 0;
        let firstLineLength = 0;
        let lastLineStart = 0;
        let eol = 0 /* StringEOL.Unknown */;
        for (let i = 0, len = text.length; i < len; i++) {
            const chr = text.charCodeAt(i);
            if (chr === 13 /* CharCode.CarriageReturn */) {
                if (eolCount === 0) {
                    firstLineLength = i;
                }
                eolCount++;
                if (i + 1 < len && text.charCodeAt(i + 1) === 10 /* CharCode.LineFeed */) {
                    // \r\n... case
                    eol |= 2 /* StringEOL.CRLF */;
                    i++; // skip \n
                }
                else {
                    // \r... case
                    eol |= 3 /* StringEOL.Invalid */;
                }
                lastLineStart = i + 1;
            }
            else if (chr === 10 /* CharCode.LineFeed */) {
                // \n... case
                eol |= 1 /* StringEOL.LF */;
                if (eolCount === 0) {
                    firstLineLength = i;
                }
                eolCount++;
                lastLineStart = i + 1;
            }
        }
        if (eolCount === 0) {
            firstLineLength = text.length;
        }
        return [eolCount, firstLineLength, text.length - lastLineStart, eol];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW9sQ291bnRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL2VvbENvdW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLDRCQW9DQztJQTNDRCxJQUFrQixTQUtqQjtJQUxELFdBQWtCLFNBQVM7UUFDMUIsK0NBQVcsQ0FBQTtRQUNYLCtDQUFXLENBQUE7UUFDWCxxQ0FBTSxDQUFBO1FBQ04seUNBQVEsQ0FBQTtJQUNULENBQUMsRUFMaUIsU0FBUyx5QkFBVCxTQUFTLFFBSzFCO0lBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQVk7UUFDcEMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQztRQUN4QixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxHQUFHLDRCQUErQixDQUFDO1FBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9CLElBQUksR0FBRyxxQ0FBNEIsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDcEIsZUFBZSxHQUFHLENBQUMsQ0FBQztnQkFDckIsQ0FBQztnQkFDRCxRQUFRLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQywrQkFBc0IsRUFBRSxDQUFDO29CQUNqRSxlQUFlO29CQUNmLEdBQUcsMEJBQWtCLENBQUM7b0JBQ3RCLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVTtnQkFDaEIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGFBQWE7b0JBQ2IsR0FBRyw2QkFBcUIsQ0FBQztnQkFDMUIsQ0FBQztnQkFDRCxhQUFhLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QixDQUFDO2lCQUFNLElBQUksR0FBRywrQkFBc0IsRUFBRSxDQUFDO2dCQUN0QyxhQUFhO2dCQUNiLEdBQUcsd0JBQWdCLENBQUM7Z0JBQ3BCLElBQUksUUFBUSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNwQixlQUFlLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQixDQUFDO2dCQUNELFFBQVEsRUFBRSxDQUFDO2dCQUNYLGFBQWEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBQ0QsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDcEIsZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDL0IsQ0FBQztRQUNELE9BQU8sQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3RFLENBQUMifQ==