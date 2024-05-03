/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeBase", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer"], function (require, exports, strings, pieceTreeBase_1, pieceTreeTextBuffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PieceTreeTextBufferBuilder = void 0;
    class PieceTreeTextBufferFactory {
        constructor(_chunks, _bom, _cr, _lf, _crlf, _containsRTL, _containsUnusualLineTerminators, _isBasicASCII, _normalizeEOL) {
            this._chunks = _chunks;
            this._bom = _bom;
            this._cr = _cr;
            this._lf = _lf;
            this._crlf = _crlf;
            this._containsRTL = _containsRTL;
            this._containsUnusualLineTerminators = _containsUnusualLineTerminators;
            this._isBasicASCII = _isBasicASCII;
            this._normalizeEOL = _normalizeEOL;
        }
        _getEOL(defaultEOL) {
            const totalEOLCount = this._cr + this._lf + this._crlf;
            const totalCRCount = this._cr + this._crlf;
            if (totalEOLCount === 0) {
                // This is an empty file or a file with precisely one line
                return (defaultEOL === 1 /* DefaultEndOfLine.LF */ ? '\n' : '\r\n');
            }
            if (totalCRCount > totalEOLCount / 2) {
                // More than half of the file contains \r\n ending lines
                return '\r\n';
            }
            // At least one line more ends in \n
            return '\n';
        }
        create(defaultEOL) {
            const eol = this._getEOL(defaultEOL);
            const chunks = this._chunks;
            if (this._normalizeEOL &&
                ((eol === '\r\n' && (this._cr > 0 || this._lf > 0))
                    || (eol === '\n' && (this._cr > 0 || this._crlf > 0)))) {
                // Normalize pieces
                for (let i = 0, len = chunks.length; i < len; i++) {
                    const str = chunks[i].buffer.replace(/\r\n|\r|\n/g, eol);
                    const newLineStart = (0, pieceTreeBase_1.createLineStartsFast)(str);
                    chunks[i] = new pieceTreeBase_1.StringBuffer(str, newLineStart);
                }
            }
            const textBuffer = new pieceTreeTextBuffer_1.PieceTreeTextBuffer(chunks, this._bom, eol, this._containsRTL, this._containsUnusualLineTerminators, this._isBasicASCII, this._normalizeEOL);
            return { textBuffer: textBuffer, disposable: textBuffer };
        }
        getFirstLineText(lengthLimit) {
            return this._chunks[0].buffer.substr(0, lengthLimit).split(/\r\n|\r|\n/)[0];
        }
    }
    class PieceTreeTextBufferBuilder {
        constructor() {
            this.chunks = [];
            this.BOM = '';
            this._hasPreviousChar = false;
            this._previousChar = 0;
            this._tmpLineStarts = [];
            this.cr = 0;
            this.lf = 0;
            this.crlf = 0;
            this.containsRTL = false;
            this.containsUnusualLineTerminators = false;
            this.isBasicASCII = true;
        }
        acceptChunk(chunk) {
            if (chunk.length === 0) {
                return;
            }
            if (this.chunks.length === 0) {
                if (strings.startsWithUTF8BOM(chunk)) {
                    this.BOM = strings.UTF8_BOM_CHARACTER;
                    chunk = chunk.substr(1);
                }
            }
            const lastChar = chunk.charCodeAt(chunk.length - 1);
            if (lastChar === 13 /* CharCode.CarriageReturn */ || (lastChar >= 0xD800 && lastChar <= 0xDBFF)) {
                // last character is \r or a high surrogate => keep it back
                this._acceptChunk1(chunk.substr(0, chunk.length - 1), false);
                this._hasPreviousChar = true;
                this._previousChar = lastChar;
            }
            else {
                this._acceptChunk1(chunk, false);
                this._hasPreviousChar = false;
                this._previousChar = lastChar;
            }
        }
        _acceptChunk1(chunk, allowEmptyStrings) {
            if (!allowEmptyStrings && chunk.length === 0) {
                // Nothing to do
                return;
            }
            if (this._hasPreviousChar) {
                this._acceptChunk2(String.fromCharCode(this._previousChar) + chunk);
            }
            else {
                this._acceptChunk2(chunk);
            }
        }
        _acceptChunk2(chunk) {
            const lineStarts = (0, pieceTreeBase_1.createLineStarts)(this._tmpLineStarts, chunk);
            this.chunks.push(new pieceTreeBase_1.StringBuffer(chunk, lineStarts.lineStarts));
            this.cr += lineStarts.cr;
            this.lf += lineStarts.lf;
            this.crlf += lineStarts.crlf;
            if (!lineStarts.isBasicASCII) {
                // this chunk contains non basic ASCII characters
                this.isBasicASCII = false;
                if (!this.containsRTL) {
                    this.containsRTL = strings.containsRTL(chunk);
                }
                if (!this.containsUnusualLineTerminators) {
                    this.containsUnusualLineTerminators = strings.containsUnusualLineTerminators(chunk);
                }
            }
        }
        finish(normalizeEOL = true) {
            this._finish();
            return new PieceTreeTextBufferFactory(this.chunks, this.BOM, this.cr, this.lf, this.crlf, this.containsRTL, this.containsUnusualLineTerminators, this.isBasicASCII, normalizeEOL);
        }
        _finish() {
            if (this.chunks.length === 0) {
                this._acceptChunk1('', true);
            }
            if (this._hasPreviousChar) {
                this._hasPreviousChar = false;
                // recreate last chunk
                const lastChunk = this.chunks[this.chunks.length - 1];
                lastChunk.buffer += String.fromCharCode(this._previousChar);
                const newLineStarts = (0, pieceTreeBase_1.createLineStartsFast)(lastChunk.buffer);
                lastChunk.lineStarts = newLineStarts;
                if (this._previousChar === 13 /* CharCode.CarriageReturn */) {
                    this.cr++;
                }
            }
        }
    }
    exports.PieceTreeTextBufferBuilder = PieceTreeTextBufferBuilder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGllY2VUcmVlVGV4dEJ1ZmZlckJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvcGllY2VUcmVlVGV4dEJ1ZmZlci9waWVjZVRyZWVUZXh0QnVmZmVyQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBTSwwQkFBMEI7UUFFL0IsWUFDa0IsT0FBdUIsRUFDdkIsSUFBWSxFQUNaLEdBQVcsRUFDWCxHQUFXLEVBQ1gsS0FBYSxFQUNiLFlBQXFCLEVBQ3JCLCtCQUF3QyxFQUN4QyxhQUFzQixFQUN0QixhQUFzQjtZQVJ0QixZQUFPLEdBQVAsT0FBTyxDQUFnQjtZQUN2QixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUNYLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFDWCxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsaUJBQVksR0FBWixZQUFZLENBQVM7WUFDckIsb0NBQStCLEdBQS9CLCtCQUErQixDQUFTO1lBQ3hDLGtCQUFhLEdBQWIsYUFBYSxDQUFTO1lBQ3RCLGtCQUFhLEdBQWIsYUFBYSxDQUFTO1FBQ3BDLENBQUM7UUFFRyxPQUFPLENBQUMsVUFBNEI7WUFDM0MsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDdkQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksYUFBYSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QiwwREFBMEQ7Z0JBQzFELE9BQU8sQ0FBQyxVQUFVLGdDQUF3QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFDRCxJQUFJLFlBQVksR0FBRyxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLHdEQUF3RDtnQkFDeEQsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBQ0Qsb0NBQW9DO1lBQ3BDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLE1BQU0sQ0FBQyxVQUE0QjtZQUN6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFFNUIsSUFBSSxJQUFJLENBQUMsYUFBYTtnQkFDckIsQ0FBQyxDQUFDLEdBQUcsS0FBSyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3VCQUMvQyxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDdEQsQ0FBQztnQkFDRixtQkFBbUI7Z0JBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDbkQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN6RCxNQUFNLFlBQVksR0FBRyxJQUFBLG9DQUFvQixFQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMvQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDakQsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLHlDQUFtQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQywrQkFBK0IsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNwSyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUM7UUFDM0QsQ0FBQztRQUVNLGdCQUFnQixDQUFDLFdBQW1CO1lBQzFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsQ0FBQztLQUNEO0lBRUQsTUFBYSwwQkFBMEI7UUFldEM7WUFDQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUVkLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7WUFFekIsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDWixJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNaLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLDhCQUE4QixHQUFHLEtBQUssQ0FBQztZQUM1QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUMxQixDQUFDO1FBRU0sV0FBVyxDQUFDLEtBQWE7WUFDL0IsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDO29CQUN0QyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDcEQsSUFBSSxRQUFRLHFDQUE0QixJQUFJLENBQUMsUUFBUSxJQUFJLE1BQU0sSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDeEYsMkRBQTJEO2dCQUMzRCxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzdELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDO1lBQy9CLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztnQkFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhLENBQUMsS0FBYSxFQUFFLGlCQUEwQjtZQUM5RCxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsZ0JBQWdCO2dCQUNoQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDckUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhLENBQUMsS0FBYTtZQUNsQyxNQUFNLFVBQVUsR0FBRyxJQUFBLGdDQUFnQixFQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSw0QkFBWSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLEVBQUUsSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxJQUFJLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQztZQUU3QixJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUM5QixpREFBaUQ7Z0JBQ2pELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO2dCQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9DLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO29CQUMxQyxJQUFJLENBQUMsOEJBQThCLEdBQUcsT0FBTyxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNyRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTSxNQUFNLENBQUMsZUFBd0IsSUFBSTtZQUN6QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZixPQUFPLElBQUksMEJBQTBCLENBQ3BDLElBQUksQ0FBQyxNQUFNLEVBQ1gsSUFBSSxDQUFDLEdBQUcsRUFDUixJQUFJLENBQUMsRUFBRSxFQUNQLElBQUksQ0FBQyxFQUFFLEVBQ1AsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLENBQUMsV0FBVyxFQUNoQixJQUFJLENBQUMsOEJBQThCLEVBQ25DLElBQUksQ0FBQyxZQUFZLEVBQ2pCLFlBQVksQ0FDWixDQUFDO1FBQ0gsQ0FBQztRQUVPLE9BQU87WUFDZCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztnQkFDOUIsc0JBQXNCO2dCQUN0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxTQUFTLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLGFBQWEsR0FBRyxJQUFBLG9DQUFvQixFQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0QsU0FBUyxDQUFDLFVBQVUsR0FBRyxhQUFhLENBQUM7Z0JBQ3JDLElBQUksSUFBSSxDQUFDLGFBQWEscUNBQTRCLEVBQUUsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNYLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBekhELGdFQXlIQyJ9