/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/pieceTreeTextBuffer/rbTreeBase", "vs/editor/common/model/textModelSearch"], function (require, exports, position_1, range_1, model_1, rbTreeBase_1, textModelSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PieceTreeBase = exports.StringBuffer = exports.Piece = void 0;
    exports.createLineStartsFast = createLineStartsFast;
    exports.createLineStarts = createLineStarts;
    // const lfRegex = new RegExp(/\r\n|\r|\n/g);
    const AverageBufferSize = 65535;
    function createUintArray(arr) {
        let r;
        if (arr[arr.length - 1] < 65536) {
            r = new Uint16Array(arr.length);
        }
        else {
            r = new Uint32Array(arr.length);
        }
        r.set(arr, 0);
        return r;
    }
    class LineStarts {
        constructor(lineStarts, cr, lf, crlf, isBasicASCII) {
            this.lineStarts = lineStarts;
            this.cr = cr;
            this.lf = lf;
            this.crlf = crlf;
            this.isBasicASCII = isBasicASCII;
        }
    }
    function createLineStartsFast(str, readonly = true) {
        const r = [0];
        let rLength = 1;
        for (let i = 0, len = str.length; i < len; i++) {
            const chr = str.charCodeAt(i);
            if (chr === 13 /* CharCode.CarriageReturn */) {
                if (i + 1 < len && str.charCodeAt(i + 1) === 10 /* CharCode.LineFeed */) {
                    // \r\n... case
                    r[rLength++] = i + 2;
                    i++; // skip \n
                }
                else {
                    // \r... case
                    r[rLength++] = i + 1;
                }
            }
            else if (chr === 10 /* CharCode.LineFeed */) {
                r[rLength++] = i + 1;
            }
        }
        if (readonly) {
            return createUintArray(r);
        }
        else {
            return r;
        }
    }
    function createLineStarts(r, str) {
        r.length = 0;
        r[0] = 0;
        let rLength = 1;
        let cr = 0, lf = 0, crlf = 0;
        let isBasicASCII = true;
        for (let i = 0, len = str.length; i < len; i++) {
            const chr = str.charCodeAt(i);
            if (chr === 13 /* CharCode.CarriageReturn */) {
                if (i + 1 < len && str.charCodeAt(i + 1) === 10 /* CharCode.LineFeed */) {
                    // \r\n... case
                    crlf++;
                    r[rLength++] = i + 2;
                    i++; // skip \n
                }
                else {
                    cr++;
                    // \r... case
                    r[rLength++] = i + 1;
                }
            }
            else if (chr === 10 /* CharCode.LineFeed */) {
                lf++;
                r[rLength++] = i + 1;
            }
            else {
                if (isBasicASCII) {
                    if (chr !== 9 /* CharCode.Tab */ && (chr < 32 || chr > 126)) {
                        isBasicASCII = false;
                    }
                }
            }
        }
        const result = new LineStarts(createUintArray(r), cr, lf, crlf, isBasicASCII);
        r.length = 0;
        return result;
    }
    class Piece {
        constructor(bufferIndex, start, end, lineFeedCnt, length) {
            this.bufferIndex = bufferIndex;
            this.start = start;
            this.end = end;
            this.lineFeedCnt = lineFeedCnt;
            this.length = length;
        }
    }
    exports.Piece = Piece;
    class StringBuffer {
        constructor(buffer, lineStarts) {
            this.buffer = buffer;
            this.lineStarts = lineStarts;
        }
    }
    exports.StringBuffer = StringBuffer;
    /**
     * Readonly snapshot for piece tree.
     * In a real multiple thread environment, to make snapshot reading always work correctly, we need to
     * 1. Make TreeNode.piece immutable, then reading and writing can run in parallel.
     * 2. TreeNode/Buffers normalization should not happen during snapshot reading.
     */
    class PieceTreeSnapshot {
        constructor(tree, BOM) {
            this._pieces = [];
            this._tree = tree;
            this._BOM = BOM;
            this._index = 0;
            if (tree.root !== rbTreeBase_1.SENTINEL) {
                tree.iterate(tree.root, node => {
                    if (node !== rbTreeBase_1.SENTINEL) {
                        this._pieces.push(node.piece);
                    }
                    return true;
                });
            }
        }
        read() {
            if (this._pieces.length === 0) {
                if (this._index === 0) {
                    this._index++;
                    return this._BOM;
                }
                else {
                    return null;
                }
            }
            if (this._index > this._pieces.length - 1) {
                return null;
            }
            if (this._index === 0) {
                return this._BOM + this._tree.getPieceContent(this._pieces[this._index++]);
            }
            return this._tree.getPieceContent(this._pieces[this._index++]);
        }
    }
    class PieceTreeSearchCache {
        constructor(limit) {
            this._limit = limit;
            this._cache = [];
        }
        get(offset) {
            for (let i = this._cache.length - 1; i >= 0; i--) {
                const nodePos = this._cache[i];
                if (nodePos.nodeStartOffset <= offset && nodePos.nodeStartOffset + nodePos.node.piece.length >= offset) {
                    return nodePos;
                }
            }
            return null;
        }
        get2(lineNumber) {
            for (let i = this._cache.length - 1; i >= 0; i--) {
                const nodePos = this._cache[i];
                if (nodePos.nodeStartLineNumber && nodePos.nodeStartLineNumber < lineNumber && nodePos.nodeStartLineNumber + nodePos.node.piece.lineFeedCnt >= lineNumber) {
                    return nodePos;
                }
            }
            return null;
        }
        set(nodePosition) {
            if (this._cache.length >= this._limit) {
                this._cache.shift();
            }
            this._cache.push(nodePosition);
        }
        validate(offset) {
            let hasInvalidVal = false;
            const tmp = this._cache;
            for (let i = 0; i < tmp.length; i++) {
                const nodePos = tmp[i];
                if (nodePos.node.parent === null || nodePos.nodeStartOffset >= offset) {
                    tmp[i] = null;
                    hasInvalidVal = true;
                    continue;
                }
            }
            if (hasInvalidVal) {
                const newArr = [];
                for (const entry of tmp) {
                    if (entry !== null) {
                        newArr.push(entry);
                    }
                }
                this._cache = newArr;
            }
        }
    }
    class PieceTreeBase {
        constructor(chunks, eol, eolNormalized) {
            this.create(chunks, eol, eolNormalized);
        }
        create(chunks, eol, eolNormalized) {
            this._buffers = [
                new StringBuffer('', [0])
            ];
            this._lastChangeBufferPos = { line: 0, column: 0 };
            this.root = rbTreeBase_1.SENTINEL;
            this._lineCnt = 1;
            this._length = 0;
            this._EOL = eol;
            this._EOLLength = eol.length;
            this._EOLNormalized = eolNormalized;
            let lastNode = null;
            for (let i = 0, len = chunks.length; i < len; i++) {
                if (chunks[i].buffer.length > 0) {
                    if (!chunks[i].lineStarts) {
                        chunks[i].lineStarts = createLineStartsFast(chunks[i].buffer);
                    }
                    const piece = new Piece(i + 1, { line: 0, column: 0 }, { line: chunks[i].lineStarts.length - 1, column: chunks[i].buffer.length - chunks[i].lineStarts[chunks[i].lineStarts.length - 1] }, chunks[i].lineStarts.length - 1, chunks[i].buffer.length);
                    this._buffers.push(chunks[i]);
                    lastNode = this.rbInsertRight(lastNode, piece);
                }
            }
            this._searchCache = new PieceTreeSearchCache(1);
            this._lastVisitedLine = { lineNumber: 0, value: '' };
            this.computeBufferMetadata();
        }
        normalizeEOL(eol) {
            const averageBufferSize = AverageBufferSize;
            const min = averageBufferSize - Math.floor(averageBufferSize / 3);
            const max = min * 2;
            let tempChunk = '';
            let tempChunkLen = 0;
            const chunks = [];
            this.iterate(this.root, node => {
                const str = this.getNodeContent(node);
                const len = str.length;
                if (tempChunkLen <= min || tempChunkLen + len < max) {
                    tempChunk += str;
                    tempChunkLen += len;
                    return true;
                }
                // flush anyways
                const text = tempChunk.replace(/\r\n|\r|\n/g, eol);
                chunks.push(new StringBuffer(text, createLineStartsFast(text)));
                tempChunk = str;
                tempChunkLen = len;
                return true;
            });
            if (tempChunkLen > 0) {
                const text = tempChunk.replace(/\r\n|\r|\n/g, eol);
                chunks.push(new StringBuffer(text, createLineStartsFast(text)));
            }
            this.create(chunks, eol, true);
        }
        // #region Buffer API
        getEOL() {
            return this._EOL;
        }
        setEOL(newEOL) {
            this._EOL = newEOL;
            this._EOLLength = this._EOL.length;
            this.normalizeEOL(newEOL);
        }
        createSnapshot(BOM) {
            return new PieceTreeSnapshot(this, BOM);
        }
        equal(other) {
            if (this.getLength() !== other.getLength()) {
                return false;
            }
            if (this.getLineCount() !== other.getLineCount()) {
                return false;
            }
            let offset = 0;
            const ret = this.iterate(this.root, node => {
                if (node === rbTreeBase_1.SENTINEL) {
                    return true;
                }
                const str = this.getNodeContent(node);
                const len = str.length;
                const startPosition = other.nodeAt(offset);
                const endPosition = other.nodeAt(offset + len);
                const val = other.getValueInRange2(startPosition, endPosition);
                offset += len;
                return str === val;
            });
            return ret;
        }
        getOffsetAt(lineNumber, column) {
            let leftLen = 0; // inorder
            let x = this.root;
            while (x !== rbTreeBase_1.SENTINEL) {
                if (x.left !== rbTreeBase_1.SENTINEL && x.lf_left + 1 >= lineNumber) {
                    x = x.left;
                }
                else if (x.lf_left + x.piece.lineFeedCnt + 1 >= lineNumber) {
                    leftLen += x.size_left;
                    // lineNumber >= 2
                    const accumualtedValInCurrentIndex = this.getAccumulatedValue(x, lineNumber - x.lf_left - 2);
                    return leftLen += accumualtedValInCurrentIndex + column - 1;
                }
                else {
                    lineNumber -= x.lf_left + x.piece.lineFeedCnt;
                    leftLen += x.size_left + x.piece.length;
                    x = x.right;
                }
            }
            return leftLen;
        }
        getPositionAt(offset) {
            offset = Math.floor(offset);
            offset = Math.max(0, offset);
            let x = this.root;
            let lfCnt = 0;
            const originalOffset = offset;
            while (x !== rbTreeBase_1.SENTINEL) {
                if (x.size_left !== 0 && x.size_left >= offset) {
                    x = x.left;
                }
                else if (x.size_left + x.piece.length >= offset) {
                    const out = this.getIndexOf(x, offset - x.size_left);
                    lfCnt += x.lf_left + out.index;
                    if (out.index === 0) {
                        const lineStartOffset = this.getOffsetAt(lfCnt + 1, 1);
                        const column = originalOffset - lineStartOffset;
                        return new position_1.Position(lfCnt + 1, column + 1);
                    }
                    return new position_1.Position(lfCnt + 1, out.remainder + 1);
                }
                else {
                    offset -= x.size_left + x.piece.length;
                    lfCnt += x.lf_left + x.piece.lineFeedCnt;
                    if (x.right === rbTreeBase_1.SENTINEL) {
                        // last node
                        const lineStartOffset = this.getOffsetAt(lfCnt + 1, 1);
                        const column = originalOffset - offset - lineStartOffset;
                        return new position_1.Position(lfCnt + 1, column + 1);
                    }
                    else {
                        x = x.right;
                    }
                }
            }
            return new position_1.Position(1, 1);
        }
        getValueInRange(range, eol) {
            if (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                return '';
            }
            const startPosition = this.nodeAt2(range.startLineNumber, range.startColumn);
            const endPosition = this.nodeAt2(range.endLineNumber, range.endColumn);
            const value = this.getValueInRange2(startPosition, endPosition);
            if (eol) {
                if (eol !== this._EOL || !this._EOLNormalized) {
                    return value.replace(/\r\n|\r|\n/g, eol);
                }
                if (eol === this.getEOL() && this._EOLNormalized) {
                    if (eol === '\r\n') {
                    }
                    return value;
                }
                return value.replace(/\r\n|\r|\n/g, eol);
            }
            return value;
        }
        getValueInRange2(startPosition, endPosition) {
            if (startPosition.node === endPosition.node) {
                const node = startPosition.node;
                const buffer = this._buffers[node.piece.bufferIndex].buffer;
                const startOffset = this.offsetInBuffer(node.piece.bufferIndex, node.piece.start);
                return buffer.substring(startOffset + startPosition.remainder, startOffset + endPosition.remainder);
            }
            let x = startPosition.node;
            const buffer = this._buffers[x.piece.bufferIndex].buffer;
            const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
            let ret = buffer.substring(startOffset + startPosition.remainder, startOffset + x.piece.length);
            x = x.next();
            while (x !== rbTreeBase_1.SENTINEL) {
                const buffer = this._buffers[x.piece.bufferIndex].buffer;
                const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
                if (x === endPosition.node) {
                    ret += buffer.substring(startOffset, startOffset + endPosition.remainder);
                    break;
                }
                else {
                    ret += buffer.substr(startOffset, x.piece.length);
                }
                x = x.next();
            }
            return ret;
        }
        getLinesContent() {
            const lines = [];
            let linesLength = 0;
            let currentLine = '';
            let danglingCR = false;
            this.iterate(this.root, node => {
                if (node === rbTreeBase_1.SENTINEL) {
                    return true;
                }
                const piece = node.piece;
                let pieceLength = piece.length;
                if (pieceLength === 0) {
                    return true;
                }
                const buffer = this._buffers[piece.bufferIndex].buffer;
                const lineStarts = this._buffers[piece.bufferIndex].lineStarts;
                const pieceStartLine = piece.start.line;
                const pieceEndLine = piece.end.line;
                let pieceStartOffset = lineStarts[pieceStartLine] + piece.start.column;
                if (danglingCR) {
                    if (buffer.charCodeAt(pieceStartOffset) === 10 /* CharCode.LineFeed */) {
                        // pretend the \n was in the previous piece..
                        pieceStartOffset++;
                        pieceLength--;
                    }
                    lines[linesLength++] = currentLine;
                    currentLine = '';
                    danglingCR = false;
                    if (pieceLength === 0) {
                        return true;
                    }
                }
                if (pieceStartLine === pieceEndLine) {
                    // this piece has no new lines
                    if (!this._EOLNormalized && buffer.charCodeAt(pieceStartOffset + pieceLength - 1) === 13 /* CharCode.CarriageReturn */) {
                        danglingCR = true;
                        currentLine += buffer.substr(pieceStartOffset, pieceLength - 1);
                    }
                    else {
                        currentLine += buffer.substr(pieceStartOffset, pieceLength);
                    }
                    return true;
                }
                // add the text before the first line start in this piece
                currentLine += (this._EOLNormalized
                    ? buffer.substring(pieceStartOffset, Math.max(pieceStartOffset, lineStarts[pieceStartLine + 1] - this._EOLLength))
                    : buffer.substring(pieceStartOffset, lineStarts[pieceStartLine + 1]).replace(/(\r\n|\r|\n)$/, ''));
                lines[linesLength++] = currentLine;
                for (let line = pieceStartLine + 1; line < pieceEndLine; line++) {
                    currentLine = (this._EOLNormalized
                        ? buffer.substring(lineStarts[line], lineStarts[line + 1] - this._EOLLength)
                        : buffer.substring(lineStarts[line], lineStarts[line + 1]).replace(/(\r\n|\r|\n)$/, ''));
                    lines[linesLength++] = currentLine;
                }
                if (!this._EOLNormalized && buffer.charCodeAt(lineStarts[pieceEndLine] + piece.end.column - 1) === 13 /* CharCode.CarriageReturn */) {
                    danglingCR = true;
                    if (piece.end.column === 0) {
                        // The last line ended with a \r, let's undo the push, it will be pushed by next iteration
                        linesLength--;
                    }
                    else {
                        currentLine = buffer.substr(lineStarts[pieceEndLine], piece.end.column - 1);
                    }
                }
                else {
                    currentLine = buffer.substr(lineStarts[pieceEndLine], piece.end.column);
                }
                return true;
            });
            if (danglingCR) {
                lines[linesLength++] = currentLine;
                currentLine = '';
            }
            lines[linesLength++] = currentLine;
            return lines;
        }
        getLength() {
            return this._length;
        }
        getLineCount() {
            return this._lineCnt;
        }
        getLineContent(lineNumber) {
            if (this._lastVisitedLine.lineNumber === lineNumber) {
                return this._lastVisitedLine.value;
            }
            this._lastVisitedLine.lineNumber = lineNumber;
            if (lineNumber === this._lineCnt) {
                this._lastVisitedLine.value = this.getLineRawContent(lineNumber);
            }
            else if (this._EOLNormalized) {
                this._lastVisitedLine.value = this.getLineRawContent(lineNumber, this._EOLLength);
            }
            else {
                this._lastVisitedLine.value = this.getLineRawContent(lineNumber).replace(/(\r\n|\r|\n)$/, '');
            }
            return this._lastVisitedLine.value;
        }
        _getCharCode(nodePos) {
            if (nodePos.remainder === nodePos.node.piece.length) {
                // the char we want to fetch is at the head of next node.
                const matchingNode = nodePos.node.next();
                if (!matchingNode) {
                    return 0;
                }
                const buffer = this._buffers[matchingNode.piece.bufferIndex];
                const startOffset = this.offsetInBuffer(matchingNode.piece.bufferIndex, matchingNode.piece.start);
                return buffer.buffer.charCodeAt(startOffset);
            }
            else {
                const buffer = this._buffers[nodePos.node.piece.bufferIndex];
                const startOffset = this.offsetInBuffer(nodePos.node.piece.bufferIndex, nodePos.node.piece.start);
                const targetOffset = startOffset + nodePos.remainder;
                return buffer.buffer.charCodeAt(targetOffset);
            }
        }
        getLineCharCode(lineNumber, index) {
            const nodePos = this.nodeAt2(lineNumber, index + 1);
            return this._getCharCode(nodePos);
        }
        getLineLength(lineNumber) {
            if (lineNumber === this.getLineCount()) {
                const startOffset = this.getOffsetAt(lineNumber, 1);
                return this.getLength() - startOffset;
            }
            return this.getOffsetAt(lineNumber + 1, 1) - this.getOffsetAt(lineNumber, 1) - this._EOLLength;
        }
        getCharCode(offset) {
            const nodePos = this.nodeAt(offset);
            return this._getCharCode(nodePos);
        }
        findMatchesInNode(node, searcher, startLineNumber, startColumn, startCursor, endCursor, searchData, captureMatches, limitResultCount, resultLen, result) {
            const buffer = this._buffers[node.piece.bufferIndex];
            const startOffsetInBuffer = this.offsetInBuffer(node.piece.bufferIndex, node.piece.start);
            const start = this.offsetInBuffer(node.piece.bufferIndex, startCursor);
            const end = this.offsetInBuffer(node.piece.bufferIndex, endCursor);
            let m;
            // Reset regex to search from the beginning
            const ret = { line: 0, column: 0 };
            let searchText;
            let offsetInBuffer;
            if (searcher._wordSeparators) {
                searchText = buffer.buffer.substring(start, end);
                offsetInBuffer = (offset) => offset + start;
                searcher.reset(0);
            }
            else {
                searchText = buffer.buffer;
                offsetInBuffer = (offset) => offset;
                searcher.reset(start);
            }
            do {
                m = searcher.next(searchText);
                if (m) {
                    if (offsetInBuffer(m.index) >= end) {
                        return resultLen;
                    }
                    this.positionInBuffer(node, offsetInBuffer(m.index) - startOffsetInBuffer, ret);
                    const lineFeedCnt = this.getLineFeedCnt(node.piece.bufferIndex, startCursor, ret);
                    const retStartColumn = ret.line === startCursor.line ? ret.column - startCursor.column + startColumn : ret.column + 1;
                    const retEndColumn = retStartColumn + m[0].length;
                    result[resultLen++] = (0, textModelSearch_1.createFindMatch)(new range_1.Range(startLineNumber + lineFeedCnt, retStartColumn, startLineNumber + lineFeedCnt, retEndColumn), m, captureMatches);
                    if (offsetInBuffer(m.index) + m[0].length >= end) {
                        return resultLen;
                    }
                    if (resultLen >= limitResultCount) {
                        return resultLen;
                    }
                }
            } while (m);
            return resultLen;
        }
        findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount) {
            const result = [];
            let resultLen = 0;
            const searcher = new textModelSearch_1.Searcher(searchData.wordSeparators, searchData.regex);
            let startPosition = this.nodeAt2(searchRange.startLineNumber, searchRange.startColumn);
            if (startPosition === null) {
                return [];
            }
            const endPosition = this.nodeAt2(searchRange.endLineNumber, searchRange.endColumn);
            if (endPosition === null) {
                return [];
            }
            let start = this.positionInBuffer(startPosition.node, startPosition.remainder);
            const end = this.positionInBuffer(endPosition.node, endPosition.remainder);
            if (startPosition.node === endPosition.node) {
                this.findMatchesInNode(startPosition.node, searcher, searchRange.startLineNumber, searchRange.startColumn, start, end, searchData, captureMatches, limitResultCount, resultLen, result);
                return result;
            }
            let startLineNumber = searchRange.startLineNumber;
            let currentNode = startPosition.node;
            while (currentNode !== endPosition.node) {
                const lineBreakCnt = this.getLineFeedCnt(currentNode.piece.bufferIndex, start, currentNode.piece.end);
                if (lineBreakCnt >= 1) {
                    // last line break position
                    const lineStarts = this._buffers[currentNode.piece.bufferIndex].lineStarts;
                    const startOffsetInBuffer = this.offsetInBuffer(currentNode.piece.bufferIndex, currentNode.piece.start);
                    const nextLineStartOffset = lineStarts[start.line + lineBreakCnt];
                    const startColumn = startLineNumber === searchRange.startLineNumber ? searchRange.startColumn : 1;
                    resultLen = this.findMatchesInNode(currentNode, searcher, startLineNumber, startColumn, start, this.positionInBuffer(currentNode, nextLineStartOffset - startOffsetInBuffer), searchData, captureMatches, limitResultCount, resultLen, result);
                    if (resultLen >= limitResultCount) {
                        return result;
                    }
                    startLineNumber += lineBreakCnt;
                }
                const startColumn = startLineNumber === searchRange.startLineNumber ? searchRange.startColumn - 1 : 0;
                // search for the remaining content
                if (startLineNumber === searchRange.endLineNumber) {
                    const text = this.getLineContent(startLineNumber).substring(startColumn, searchRange.endColumn - 1);
                    resultLen = this._findMatchesInLine(searchData, searcher, text, searchRange.endLineNumber, startColumn, resultLen, result, captureMatches, limitResultCount);
                    return result;
                }
                resultLen = this._findMatchesInLine(searchData, searcher, this.getLineContent(startLineNumber).substr(startColumn), startLineNumber, startColumn, resultLen, result, captureMatches, limitResultCount);
                if (resultLen >= limitResultCount) {
                    return result;
                }
                startLineNumber++;
                startPosition = this.nodeAt2(startLineNumber, 1);
                currentNode = startPosition.node;
                start = this.positionInBuffer(startPosition.node, startPosition.remainder);
            }
            if (startLineNumber === searchRange.endLineNumber) {
                const startColumn = startLineNumber === searchRange.startLineNumber ? searchRange.startColumn - 1 : 0;
                const text = this.getLineContent(startLineNumber).substring(startColumn, searchRange.endColumn - 1);
                resultLen = this._findMatchesInLine(searchData, searcher, text, searchRange.endLineNumber, startColumn, resultLen, result, captureMatches, limitResultCount);
                return result;
            }
            const startColumn = startLineNumber === searchRange.startLineNumber ? searchRange.startColumn : 1;
            resultLen = this.findMatchesInNode(endPosition.node, searcher, startLineNumber, startColumn, start, end, searchData, captureMatches, limitResultCount, resultLen, result);
            return result;
        }
        _findMatchesInLine(searchData, searcher, text, lineNumber, deltaOffset, resultLen, result, captureMatches, limitResultCount) {
            const wordSeparators = searchData.wordSeparators;
            if (!captureMatches && searchData.simpleSearch) {
                const searchString = searchData.simpleSearch;
                const searchStringLen = searchString.length;
                const textLength = text.length;
                let lastMatchIndex = -searchStringLen;
                while ((lastMatchIndex = text.indexOf(searchString, lastMatchIndex + searchStringLen)) !== -1) {
                    if (!wordSeparators || (0, textModelSearch_1.isValidMatch)(wordSeparators, text, textLength, lastMatchIndex, searchStringLen)) {
                        result[resultLen++] = new model_1.FindMatch(new range_1.Range(lineNumber, lastMatchIndex + 1 + deltaOffset, lineNumber, lastMatchIndex + 1 + searchStringLen + deltaOffset), null);
                        if (resultLen >= limitResultCount) {
                            return resultLen;
                        }
                    }
                }
                return resultLen;
            }
            let m;
            // Reset regex to search from the beginning
            searcher.reset(0);
            do {
                m = searcher.next(text);
                if (m) {
                    result[resultLen++] = (0, textModelSearch_1.createFindMatch)(new range_1.Range(lineNumber, m.index + 1 + deltaOffset, lineNumber, m.index + 1 + m[0].length + deltaOffset), m, captureMatches);
                    if (resultLen >= limitResultCount) {
                        return resultLen;
                    }
                }
            } while (m);
            return resultLen;
        }
        // #endregion
        // #region Piece Table
        insert(offset, value, eolNormalized = false) {
            this._EOLNormalized = this._EOLNormalized && eolNormalized;
            this._lastVisitedLine.lineNumber = 0;
            this._lastVisitedLine.value = '';
            if (this.root !== rbTreeBase_1.SENTINEL) {
                const { node, remainder, nodeStartOffset } = this.nodeAt(offset);
                const piece = node.piece;
                const bufferIndex = piece.bufferIndex;
                const insertPosInBuffer = this.positionInBuffer(node, remainder);
                if (node.piece.bufferIndex === 0 &&
                    piece.end.line === this._lastChangeBufferPos.line &&
                    piece.end.column === this._lastChangeBufferPos.column &&
                    (nodeStartOffset + piece.length === offset) &&
                    value.length < AverageBufferSize) {
                    // changed buffer
                    this.appendToNode(node, value);
                    this.computeBufferMetadata();
                    return;
                }
                if (nodeStartOffset === offset) {
                    this.insertContentToNodeLeft(value, node);
                    this._searchCache.validate(offset);
                }
                else if (nodeStartOffset + node.piece.length > offset) {
                    // we are inserting into the middle of a node.
                    const nodesToDel = [];
                    let newRightPiece = new Piece(piece.bufferIndex, insertPosInBuffer, piece.end, this.getLineFeedCnt(piece.bufferIndex, insertPosInBuffer, piece.end), this.offsetInBuffer(bufferIndex, piece.end) - this.offsetInBuffer(bufferIndex, insertPosInBuffer));
                    if (this.shouldCheckCRLF() && this.endWithCR(value)) {
                        const headOfRight = this.nodeCharCodeAt(node, remainder);
                        if (headOfRight === 10 /** \n */) {
                            const newStart = { line: newRightPiece.start.line + 1, column: 0 };
                            newRightPiece = new Piece(newRightPiece.bufferIndex, newStart, newRightPiece.end, this.getLineFeedCnt(newRightPiece.bufferIndex, newStart, newRightPiece.end), newRightPiece.length - 1);
                            value += '\n';
                        }
                    }
                    // reuse node for content before insertion point.
                    if (this.shouldCheckCRLF() && this.startWithLF(value)) {
                        const tailOfLeft = this.nodeCharCodeAt(node, remainder - 1);
                        if (tailOfLeft === 13 /** \r */) {
                            const previousPos = this.positionInBuffer(node, remainder - 1);
                            this.deleteNodeTail(node, previousPos);
                            value = '\r' + value;
                            if (node.piece.length === 0) {
                                nodesToDel.push(node);
                            }
                        }
                        else {
                            this.deleteNodeTail(node, insertPosInBuffer);
                        }
                    }
                    else {
                        this.deleteNodeTail(node, insertPosInBuffer);
                    }
                    const newPieces = this.createNewPieces(value);
                    if (newRightPiece.length > 0) {
                        this.rbInsertRight(node, newRightPiece);
                    }
                    let tmpNode = node;
                    for (let k = 0; k < newPieces.length; k++) {
                        tmpNode = this.rbInsertRight(tmpNode, newPieces[k]);
                    }
                    this.deleteNodes(nodesToDel);
                }
                else {
                    this.insertContentToNodeRight(value, node);
                }
            }
            else {
                // insert new node
                const pieces = this.createNewPieces(value);
                let node = this.rbInsertLeft(null, pieces[0]);
                for (let k = 1; k < pieces.length; k++) {
                    node = this.rbInsertRight(node, pieces[k]);
                }
            }
            // todo, this is too brutal. Total line feed count should be updated the same way as lf_left.
            this.computeBufferMetadata();
        }
        delete(offset, cnt) {
            this._lastVisitedLine.lineNumber = 0;
            this._lastVisitedLine.value = '';
            if (cnt <= 0 || this.root === rbTreeBase_1.SENTINEL) {
                return;
            }
            const startPosition = this.nodeAt(offset);
            const endPosition = this.nodeAt(offset + cnt);
            const startNode = startPosition.node;
            const endNode = endPosition.node;
            if (startNode === endNode) {
                const startSplitPosInBuffer = this.positionInBuffer(startNode, startPosition.remainder);
                const endSplitPosInBuffer = this.positionInBuffer(startNode, endPosition.remainder);
                if (startPosition.nodeStartOffset === offset) {
                    if (cnt === startNode.piece.length) { // delete node
                        const next = startNode.next();
                        (0, rbTreeBase_1.rbDelete)(this, startNode);
                        this.validateCRLFWithPrevNode(next);
                        this.computeBufferMetadata();
                        return;
                    }
                    this.deleteNodeHead(startNode, endSplitPosInBuffer);
                    this._searchCache.validate(offset);
                    this.validateCRLFWithPrevNode(startNode);
                    this.computeBufferMetadata();
                    return;
                }
                if (startPosition.nodeStartOffset + startNode.piece.length === offset + cnt) {
                    this.deleteNodeTail(startNode, startSplitPosInBuffer);
                    this.validateCRLFWithNextNode(startNode);
                    this.computeBufferMetadata();
                    return;
                }
                // delete content in the middle, this node will be splitted to nodes
                this.shrinkNode(startNode, startSplitPosInBuffer, endSplitPosInBuffer);
                this.computeBufferMetadata();
                return;
            }
            const nodesToDel = [];
            const startSplitPosInBuffer = this.positionInBuffer(startNode, startPosition.remainder);
            this.deleteNodeTail(startNode, startSplitPosInBuffer);
            this._searchCache.validate(offset);
            if (startNode.piece.length === 0) {
                nodesToDel.push(startNode);
            }
            // update last touched node
            const endSplitPosInBuffer = this.positionInBuffer(endNode, endPosition.remainder);
            this.deleteNodeHead(endNode, endSplitPosInBuffer);
            if (endNode.piece.length === 0) {
                nodesToDel.push(endNode);
            }
            // delete nodes in between
            const secondNode = startNode.next();
            for (let node = secondNode; node !== rbTreeBase_1.SENTINEL && node !== endNode; node = node.next()) {
                nodesToDel.push(node);
            }
            const prev = startNode.piece.length === 0 ? startNode.prev() : startNode;
            this.deleteNodes(nodesToDel);
            this.validateCRLFWithNextNode(prev);
            this.computeBufferMetadata();
        }
        insertContentToNodeLeft(value, node) {
            // we are inserting content to the beginning of node
            const nodesToDel = [];
            if (this.shouldCheckCRLF() && this.endWithCR(value) && this.startWithLF(node)) {
                // move `\n` to new node.
                const piece = node.piece;
                const newStart = { line: piece.start.line + 1, column: 0 };
                const nPiece = new Piece(piece.bufferIndex, newStart, piece.end, this.getLineFeedCnt(piece.bufferIndex, newStart, piece.end), piece.length - 1);
                node.piece = nPiece;
                value += '\n';
                (0, rbTreeBase_1.updateTreeMetadata)(this, node, -1, -1);
                if (node.piece.length === 0) {
                    nodesToDel.push(node);
                }
            }
            const newPieces = this.createNewPieces(value);
            let newNode = this.rbInsertLeft(node, newPieces[newPieces.length - 1]);
            for (let k = newPieces.length - 2; k >= 0; k--) {
                newNode = this.rbInsertLeft(newNode, newPieces[k]);
            }
            this.validateCRLFWithPrevNode(newNode);
            this.deleteNodes(nodesToDel);
        }
        insertContentToNodeRight(value, node) {
            // we are inserting to the right of this node.
            if (this.adjustCarriageReturnFromNext(value, node)) {
                // move \n to the new node.
                value += '\n';
            }
            const newPieces = this.createNewPieces(value);
            const newNode = this.rbInsertRight(node, newPieces[0]);
            let tmpNode = newNode;
            for (let k = 1; k < newPieces.length; k++) {
                tmpNode = this.rbInsertRight(tmpNode, newPieces[k]);
            }
            this.validateCRLFWithPrevNode(newNode);
        }
        positionInBuffer(node, remainder, ret) {
            const piece = node.piece;
            const bufferIndex = node.piece.bufferIndex;
            const lineStarts = this._buffers[bufferIndex].lineStarts;
            const startOffset = lineStarts[piece.start.line] + piece.start.column;
            const offset = startOffset + remainder;
            // binary search offset between startOffset and endOffset
            let low = piece.start.line;
            let high = piece.end.line;
            let mid = 0;
            let midStop = 0;
            let midStart = 0;
            while (low <= high) {
                mid = low + ((high - low) / 2) | 0;
                midStart = lineStarts[mid];
                if (mid === high) {
                    break;
                }
                midStop = lineStarts[mid + 1];
                if (offset < midStart) {
                    high = mid - 1;
                }
                else if (offset >= midStop) {
                    low = mid + 1;
                }
                else {
                    break;
                }
            }
            if (ret) {
                ret.line = mid;
                ret.column = offset - midStart;
                return null;
            }
            return {
                line: mid,
                column: offset - midStart
            };
        }
        getLineFeedCnt(bufferIndex, start, end) {
            // we don't need to worry about start: abc\r|\n, or abc|\r, or abc|\n, or abc|\r\n doesn't change the fact that, there is one line break after start.
            // now let's take care of end: abc\r|\n, if end is in between \r and \n, we need to add line feed count by 1
            if (end.column === 0) {
                return end.line - start.line;
            }
            const lineStarts = this._buffers[bufferIndex].lineStarts;
            if (end.line === lineStarts.length - 1) { // it means, there is no \n after end, otherwise, there will be one more lineStart.
                return end.line - start.line;
            }
            const nextLineStartOffset = lineStarts[end.line + 1];
            const endOffset = lineStarts[end.line] + end.column;
            if (nextLineStartOffset > endOffset + 1) { // there are more than 1 character after end, which means it can't be \n
                return end.line - start.line;
            }
            // endOffset + 1 === nextLineStartOffset
            // character at endOffset is \n, so we check the character before first
            // if character at endOffset is \r, end.column is 0 and we can't get here.
            const previousCharOffset = endOffset - 1; // end.column > 0 so it's okay.
            const buffer = this._buffers[bufferIndex].buffer;
            if (buffer.charCodeAt(previousCharOffset) === 13) {
                return end.line - start.line + 1;
            }
            else {
                return end.line - start.line;
            }
        }
        offsetInBuffer(bufferIndex, cursor) {
            const lineStarts = this._buffers[bufferIndex].lineStarts;
            return lineStarts[cursor.line] + cursor.column;
        }
        deleteNodes(nodes) {
            for (let i = 0; i < nodes.length; i++) {
                (0, rbTreeBase_1.rbDelete)(this, nodes[i]);
            }
        }
        createNewPieces(text) {
            if (text.length > AverageBufferSize) {
                // the content is large, operations like substring, charCode becomes slow
                // so here we split it into smaller chunks, just like what we did for CR/LF normalization
                const newPieces = [];
                while (text.length > AverageBufferSize) {
                    const lastChar = text.charCodeAt(AverageBufferSize - 1);
                    let splitText;
                    if (lastChar === 13 /* CharCode.CarriageReturn */ || (lastChar >= 0xD800 && lastChar <= 0xDBFF)) {
                        // last character is \r or a high surrogate => keep it back
                        splitText = text.substring(0, AverageBufferSize - 1);
                        text = text.substring(AverageBufferSize - 1);
                    }
                    else {
                        splitText = text.substring(0, AverageBufferSize);
                        text = text.substring(AverageBufferSize);
                    }
                    const lineStarts = createLineStartsFast(splitText);
                    newPieces.push(new Piece(this._buffers.length, /* buffer index */ { line: 0, column: 0 }, { line: lineStarts.length - 1, column: splitText.length - lineStarts[lineStarts.length - 1] }, lineStarts.length - 1, splitText.length));
                    this._buffers.push(new StringBuffer(splitText, lineStarts));
                }
                const lineStarts = createLineStartsFast(text);
                newPieces.push(new Piece(this._buffers.length, /* buffer index */ { line: 0, column: 0 }, { line: lineStarts.length - 1, column: text.length - lineStarts[lineStarts.length - 1] }, lineStarts.length - 1, text.length));
                this._buffers.push(new StringBuffer(text, lineStarts));
                return newPieces;
            }
            let startOffset = this._buffers[0].buffer.length;
            const lineStarts = createLineStartsFast(text, false);
            let start = this._lastChangeBufferPos;
            if (this._buffers[0].lineStarts[this._buffers[0].lineStarts.length - 1] === startOffset
                && startOffset !== 0
                && this.startWithLF(text)
                && this.endWithCR(this._buffers[0].buffer) // todo, we can check this._lastChangeBufferPos's column as it's the last one
            ) {
                this._lastChangeBufferPos = { line: this._lastChangeBufferPos.line, column: this._lastChangeBufferPos.column + 1 };
                start = this._lastChangeBufferPos;
                for (let i = 0; i < lineStarts.length; i++) {
                    lineStarts[i] += startOffset + 1;
                }
                this._buffers[0].lineStarts = this._buffers[0].lineStarts.concat(lineStarts.slice(1));
                this._buffers[0].buffer += '_' + text;
                startOffset += 1;
            }
            else {
                if (startOffset !== 0) {
                    for (let i = 0; i < lineStarts.length; i++) {
                        lineStarts[i] += startOffset;
                    }
                }
                this._buffers[0].lineStarts = this._buffers[0].lineStarts.concat(lineStarts.slice(1));
                this._buffers[0].buffer += text;
            }
            const endOffset = this._buffers[0].buffer.length;
            const endIndex = this._buffers[0].lineStarts.length - 1;
            const endColumn = endOffset - this._buffers[0].lineStarts[endIndex];
            const endPos = { line: endIndex, column: endColumn };
            const newPiece = new Piece(0, /** todo@peng */ start, endPos, this.getLineFeedCnt(0, start, endPos), endOffset - startOffset);
            this._lastChangeBufferPos = endPos;
            return [newPiece];
        }
        getLinesRawContent() {
            return this.getContentOfSubTree(this.root);
        }
        getLineRawContent(lineNumber, endOffset = 0) {
            let x = this.root;
            let ret = '';
            const cache = this._searchCache.get2(lineNumber);
            if (cache) {
                x = cache.node;
                const prevAccumulatedValue = this.getAccumulatedValue(x, lineNumber - cache.nodeStartLineNumber - 1);
                const buffer = this._buffers[x.piece.bufferIndex].buffer;
                const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
                if (cache.nodeStartLineNumber + x.piece.lineFeedCnt === lineNumber) {
                    ret = buffer.substring(startOffset + prevAccumulatedValue, startOffset + x.piece.length);
                }
                else {
                    const accumulatedValue = this.getAccumulatedValue(x, lineNumber - cache.nodeStartLineNumber);
                    return buffer.substring(startOffset + prevAccumulatedValue, startOffset + accumulatedValue - endOffset);
                }
            }
            else {
                let nodeStartOffset = 0;
                const originalLineNumber = lineNumber;
                while (x !== rbTreeBase_1.SENTINEL) {
                    if (x.left !== rbTreeBase_1.SENTINEL && x.lf_left >= lineNumber - 1) {
                        x = x.left;
                    }
                    else if (x.lf_left + x.piece.lineFeedCnt > lineNumber - 1) {
                        const prevAccumulatedValue = this.getAccumulatedValue(x, lineNumber - x.lf_left - 2);
                        const accumulatedValue = this.getAccumulatedValue(x, lineNumber - x.lf_left - 1);
                        const buffer = this._buffers[x.piece.bufferIndex].buffer;
                        const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
                        nodeStartOffset += x.size_left;
                        this._searchCache.set({
                            node: x,
                            nodeStartOffset,
                            nodeStartLineNumber: originalLineNumber - (lineNumber - 1 - x.lf_left)
                        });
                        return buffer.substring(startOffset + prevAccumulatedValue, startOffset + accumulatedValue - endOffset);
                    }
                    else if (x.lf_left + x.piece.lineFeedCnt === lineNumber - 1) {
                        const prevAccumulatedValue = this.getAccumulatedValue(x, lineNumber - x.lf_left - 2);
                        const buffer = this._buffers[x.piece.bufferIndex].buffer;
                        const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
                        ret = buffer.substring(startOffset + prevAccumulatedValue, startOffset + x.piece.length);
                        break;
                    }
                    else {
                        lineNumber -= x.lf_left + x.piece.lineFeedCnt;
                        nodeStartOffset += x.size_left + x.piece.length;
                        x = x.right;
                    }
                }
            }
            // search in order, to find the node contains end column
            x = x.next();
            while (x !== rbTreeBase_1.SENTINEL) {
                const buffer = this._buffers[x.piece.bufferIndex].buffer;
                if (x.piece.lineFeedCnt > 0) {
                    const accumulatedValue = this.getAccumulatedValue(x, 0);
                    const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
                    ret += buffer.substring(startOffset, startOffset + accumulatedValue - endOffset);
                    return ret;
                }
                else {
                    const startOffset = this.offsetInBuffer(x.piece.bufferIndex, x.piece.start);
                    ret += buffer.substr(startOffset, x.piece.length);
                }
                x = x.next();
            }
            return ret;
        }
        computeBufferMetadata() {
            let x = this.root;
            let lfCnt = 1;
            let len = 0;
            while (x !== rbTreeBase_1.SENTINEL) {
                lfCnt += x.lf_left + x.piece.lineFeedCnt;
                len += x.size_left + x.piece.length;
                x = x.right;
            }
            this._lineCnt = lfCnt;
            this._length = len;
            this._searchCache.validate(this._length);
        }
        // #region node operations
        getIndexOf(node, accumulatedValue) {
            const piece = node.piece;
            const pos = this.positionInBuffer(node, accumulatedValue);
            const lineCnt = pos.line - piece.start.line;
            if (this.offsetInBuffer(piece.bufferIndex, piece.end) - this.offsetInBuffer(piece.bufferIndex, piece.start) === accumulatedValue) {
                // we are checking the end of this node, so a CRLF check is necessary.
                const realLineCnt = this.getLineFeedCnt(node.piece.bufferIndex, piece.start, pos);
                if (realLineCnt !== lineCnt) {
                    // aha yes, CRLF
                    return { index: realLineCnt, remainder: 0 };
                }
            }
            return { index: lineCnt, remainder: pos.column };
        }
        getAccumulatedValue(node, index) {
            if (index < 0) {
                return 0;
            }
            const piece = node.piece;
            const lineStarts = this._buffers[piece.bufferIndex].lineStarts;
            const expectedLineStartIndex = piece.start.line + index + 1;
            if (expectedLineStartIndex > piece.end.line) {
                return lineStarts[piece.end.line] + piece.end.column - lineStarts[piece.start.line] - piece.start.column;
            }
            else {
                return lineStarts[expectedLineStartIndex] - lineStarts[piece.start.line] - piece.start.column;
            }
        }
        deleteNodeTail(node, pos) {
            const piece = node.piece;
            const originalLFCnt = piece.lineFeedCnt;
            const originalEndOffset = this.offsetInBuffer(piece.bufferIndex, piece.end);
            const newEnd = pos;
            const newEndOffset = this.offsetInBuffer(piece.bufferIndex, newEnd);
            const newLineFeedCnt = this.getLineFeedCnt(piece.bufferIndex, piece.start, newEnd);
            const lf_delta = newLineFeedCnt - originalLFCnt;
            const size_delta = newEndOffset - originalEndOffset;
            const newLength = piece.length + size_delta;
            node.piece = new Piece(piece.bufferIndex, piece.start, newEnd, newLineFeedCnt, newLength);
            (0, rbTreeBase_1.updateTreeMetadata)(this, node, size_delta, lf_delta);
        }
        deleteNodeHead(node, pos) {
            const piece = node.piece;
            const originalLFCnt = piece.lineFeedCnt;
            const originalStartOffset = this.offsetInBuffer(piece.bufferIndex, piece.start);
            const newStart = pos;
            const newLineFeedCnt = this.getLineFeedCnt(piece.bufferIndex, newStart, piece.end);
            const newStartOffset = this.offsetInBuffer(piece.bufferIndex, newStart);
            const lf_delta = newLineFeedCnt - originalLFCnt;
            const size_delta = originalStartOffset - newStartOffset;
            const newLength = piece.length + size_delta;
            node.piece = new Piece(piece.bufferIndex, newStart, piece.end, newLineFeedCnt, newLength);
            (0, rbTreeBase_1.updateTreeMetadata)(this, node, size_delta, lf_delta);
        }
        shrinkNode(node, start, end) {
            const piece = node.piece;
            const originalStartPos = piece.start;
            const originalEndPos = piece.end;
            // old piece, originalStartPos, start
            const oldLength = piece.length;
            const oldLFCnt = piece.lineFeedCnt;
            const newEnd = start;
            const newLineFeedCnt = this.getLineFeedCnt(piece.bufferIndex, piece.start, newEnd);
            const newLength = this.offsetInBuffer(piece.bufferIndex, start) - this.offsetInBuffer(piece.bufferIndex, originalStartPos);
            node.piece = new Piece(piece.bufferIndex, piece.start, newEnd, newLineFeedCnt, newLength);
            (0, rbTreeBase_1.updateTreeMetadata)(this, node, newLength - oldLength, newLineFeedCnt - oldLFCnt);
            // new right piece, end, originalEndPos
            const newPiece = new Piece(piece.bufferIndex, end, originalEndPos, this.getLineFeedCnt(piece.bufferIndex, end, originalEndPos), this.offsetInBuffer(piece.bufferIndex, originalEndPos) - this.offsetInBuffer(piece.bufferIndex, end));
            const newNode = this.rbInsertRight(node, newPiece);
            this.validateCRLFWithPrevNode(newNode);
        }
        appendToNode(node, value) {
            if (this.adjustCarriageReturnFromNext(value, node)) {
                value += '\n';
            }
            const hitCRLF = this.shouldCheckCRLF() && this.startWithLF(value) && this.endWithCR(node);
            const startOffset = this._buffers[0].buffer.length;
            this._buffers[0].buffer += value;
            const lineStarts = createLineStartsFast(value, false);
            for (let i = 0; i < lineStarts.length; i++) {
                lineStarts[i] += startOffset;
            }
            if (hitCRLF) {
                const prevStartOffset = this._buffers[0].lineStarts[this._buffers[0].lineStarts.length - 2];
                this._buffers[0].lineStarts.pop();
                // _lastChangeBufferPos is already wrong
                this._lastChangeBufferPos = { line: this._lastChangeBufferPos.line - 1, column: startOffset - prevStartOffset };
            }
            this._buffers[0].lineStarts = this._buffers[0].lineStarts.concat(lineStarts.slice(1));
            const endIndex = this._buffers[0].lineStarts.length - 1;
            const endColumn = this._buffers[0].buffer.length - this._buffers[0].lineStarts[endIndex];
            const newEnd = { line: endIndex, column: endColumn };
            const newLength = node.piece.length + value.length;
            const oldLineFeedCnt = node.piece.lineFeedCnt;
            const newLineFeedCnt = this.getLineFeedCnt(0, node.piece.start, newEnd);
            const lf_delta = newLineFeedCnt - oldLineFeedCnt;
            node.piece = new Piece(node.piece.bufferIndex, node.piece.start, newEnd, newLineFeedCnt, newLength);
            this._lastChangeBufferPos = newEnd;
            (0, rbTreeBase_1.updateTreeMetadata)(this, node, value.length, lf_delta);
        }
        nodeAt(offset) {
            let x = this.root;
            const cache = this._searchCache.get(offset);
            if (cache) {
                return {
                    node: cache.node,
                    nodeStartOffset: cache.nodeStartOffset,
                    remainder: offset - cache.nodeStartOffset
                };
            }
            let nodeStartOffset = 0;
            while (x !== rbTreeBase_1.SENTINEL) {
                if (x.size_left > offset) {
                    x = x.left;
                }
                else if (x.size_left + x.piece.length >= offset) {
                    nodeStartOffset += x.size_left;
                    const ret = {
                        node: x,
                        remainder: offset - x.size_left,
                        nodeStartOffset
                    };
                    this._searchCache.set(ret);
                    return ret;
                }
                else {
                    offset -= x.size_left + x.piece.length;
                    nodeStartOffset += x.size_left + x.piece.length;
                    x = x.right;
                }
            }
            return null;
        }
        nodeAt2(lineNumber, column) {
            let x = this.root;
            let nodeStartOffset = 0;
            while (x !== rbTreeBase_1.SENTINEL) {
                if (x.left !== rbTreeBase_1.SENTINEL && x.lf_left >= lineNumber - 1) {
                    x = x.left;
                }
                else if (x.lf_left + x.piece.lineFeedCnt > lineNumber - 1) {
                    const prevAccumualtedValue = this.getAccumulatedValue(x, lineNumber - x.lf_left - 2);
                    const accumulatedValue = this.getAccumulatedValue(x, lineNumber - x.lf_left - 1);
                    nodeStartOffset += x.size_left;
                    return {
                        node: x,
                        remainder: Math.min(prevAccumualtedValue + column - 1, accumulatedValue),
                        nodeStartOffset
                    };
                }
                else if (x.lf_left + x.piece.lineFeedCnt === lineNumber - 1) {
                    const prevAccumualtedValue = this.getAccumulatedValue(x, lineNumber - x.lf_left - 2);
                    if (prevAccumualtedValue + column - 1 <= x.piece.length) {
                        return {
                            node: x,
                            remainder: prevAccumualtedValue + column - 1,
                            nodeStartOffset
                        };
                    }
                    else {
                        column -= x.piece.length - prevAccumualtedValue;
                        break;
                    }
                }
                else {
                    lineNumber -= x.lf_left + x.piece.lineFeedCnt;
                    nodeStartOffset += x.size_left + x.piece.length;
                    x = x.right;
                }
            }
            // search in order, to find the node contains position.column
            x = x.next();
            while (x !== rbTreeBase_1.SENTINEL) {
                if (x.piece.lineFeedCnt > 0) {
                    const accumulatedValue = this.getAccumulatedValue(x, 0);
                    const nodeStartOffset = this.offsetOfNode(x);
                    return {
                        node: x,
                        remainder: Math.min(column - 1, accumulatedValue),
                        nodeStartOffset
                    };
                }
                else {
                    if (x.piece.length >= column - 1) {
                        const nodeStartOffset = this.offsetOfNode(x);
                        return {
                            node: x,
                            remainder: column - 1,
                            nodeStartOffset
                        };
                    }
                    else {
                        column -= x.piece.length;
                    }
                }
                x = x.next();
            }
            return null;
        }
        nodeCharCodeAt(node, offset) {
            if (node.piece.lineFeedCnt < 1) {
                return -1;
            }
            const buffer = this._buffers[node.piece.bufferIndex];
            const newOffset = this.offsetInBuffer(node.piece.bufferIndex, node.piece.start) + offset;
            return buffer.buffer.charCodeAt(newOffset);
        }
        offsetOfNode(node) {
            if (!node) {
                return 0;
            }
            let pos = node.size_left;
            while (node !== this.root) {
                if (node.parent.right === node) {
                    pos += node.parent.size_left + node.parent.piece.length;
                }
                node = node.parent;
            }
            return pos;
        }
        // #endregion
        // #region CRLF
        shouldCheckCRLF() {
            return !(this._EOLNormalized && this._EOL === '\n');
        }
        startWithLF(val) {
            if (typeof val === 'string') {
                return val.charCodeAt(0) === 10;
            }
            if (val === rbTreeBase_1.SENTINEL || val.piece.lineFeedCnt === 0) {
                return false;
            }
            const piece = val.piece;
            const lineStarts = this._buffers[piece.bufferIndex].lineStarts;
            const line = piece.start.line;
            const startOffset = lineStarts[line] + piece.start.column;
            if (line === lineStarts.length - 1) {
                // last line, so there is no line feed at the end of this line
                return false;
            }
            const nextLineOffset = lineStarts[line + 1];
            if (nextLineOffset > startOffset + 1) {
                return false;
            }
            return this._buffers[piece.bufferIndex].buffer.charCodeAt(startOffset) === 10;
        }
        endWithCR(val) {
            if (typeof val === 'string') {
                return val.charCodeAt(val.length - 1) === 13;
            }
            if (val === rbTreeBase_1.SENTINEL || val.piece.lineFeedCnt === 0) {
                return false;
            }
            return this.nodeCharCodeAt(val, val.piece.length - 1) === 13;
        }
        validateCRLFWithPrevNode(nextNode) {
            if (this.shouldCheckCRLF() && this.startWithLF(nextNode)) {
                const node = nextNode.prev();
                if (this.endWithCR(node)) {
                    this.fixCRLF(node, nextNode);
                }
            }
        }
        validateCRLFWithNextNode(node) {
            if (this.shouldCheckCRLF() && this.endWithCR(node)) {
                const nextNode = node.next();
                if (this.startWithLF(nextNode)) {
                    this.fixCRLF(node, nextNode);
                }
            }
        }
        fixCRLF(prev, next) {
            const nodesToDel = [];
            // update node
            const lineStarts = this._buffers[prev.piece.bufferIndex].lineStarts;
            let newEnd;
            if (prev.piece.end.column === 0) {
                // it means, last line ends with \r, not \r\n
                newEnd = { line: prev.piece.end.line - 1, column: lineStarts[prev.piece.end.line] - lineStarts[prev.piece.end.line - 1] - 1 };
            }
            else {
                // \r\n
                newEnd = { line: prev.piece.end.line, column: prev.piece.end.column - 1 };
            }
            const prevNewLength = prev.piece.length - 1;
            const prevNewLFCnt = prev.piece.lineFeedCnt - 1;
            prev.piece = new Piece(prev.piece.bufferIndex, prev.piece.start, newEnd, prevNewLFCnt, prevNewLength);
            (0, rbTreeBase_1.updateTreeMetadata)(this, prev, -1, -1);
            if (prev.piece.length === 0) {
                nodesToDel.push(prev);
            }
            // update nextNode
            const newStart = { line: next.piece.start.line + 1, column: 0 };
            const newLength = next.piece.length - 1;
            const newLineFeedCnt = this.getLineFeedCnt(next.piece.bufferIndex, newStart, next.piece.end);
            next.piece = new Piece(next.piece.bufferIndex, newStart, next.piece.end, newLineFeedCnt, newLength);
            (0, rbTreeBase_1.updateTreeMetadata)(this, next, -1, -1);
            if (next.piece.length === 0) {
                nodesToDel.push(next);
            }
            // create new piece which contains \r\n
            const pieces = this.createNewPieces('\r\n');
            this.rbInsertRight(prev, pieces[0]);
            // delete empty nodes
            for (let i = 0; i < nodesToDel.length; i++) {
                (0, rbTreeBase_1.rbDelete)(this, nodesToDel[i]);
            }
        }
        adjustCarriageReturnFromNext(value, node) {
            if (this.shouldCheckCRLF() && this.endWithCR(value)) {
                const nextNode = node.next();
                if (this.startWithLF(nextNode)) {
                    // move `\n` forward
                    value += '\n';
                    if (nextNode.piece.length === 1) {
                        (0, rbTreeBase_1.rbDelete)(this, nextNode);
                    }
                    else {
                        const piece = nextNode.piece;
                        const newStart = { line: piece.start.line + 1, column: 0 };
                        const newLength = piece.length - 1;
                        const newLineFeedCnt = this.getLineFeedCnt(piece.bufferIndex, newStart, piece.end);
                        nextNode.piece = new Piece(piece.bufferIndex, newStart, piece.end, newLineFeedCnt, newLength);
                        (0, rbTreeBase_1.updateTreeMetadata)(this, nextNode, -1, -1);
                    }
                    return true;
                }
            }
            return false;
        }
        // #endregion
        // #endregion
        // #region Tree operations
        iterate(node, callback) {
            if (node === rbTreeBase_1.SENTINEL) {
                return callback(rbTreeBase_1.SENTINEL);
            }
            const leftRet = this.iterate(node.left, callback);
            if (!leftRet) {
                return leftRet;
            }
            return callback(node) && this.iterate(node.right, callback);
        }
        getNodeContent(node) {
            if (node === rbTreeBase_1.SENTINEL) {
                return '';
            }
            const buffer = this._buffers[node.piece.bufferIndex];
            const piece = node.piece;
            const startOffset = this.offsetInBuffer(piece.bufferIndex, piece.start);
            const endOffset = this.offsetInBuffer(piece.bufferIndex, piece.end);
            const currentContent = buffer.buffer.substring(startOffset, endOffset);
            return currentContent;
        }
        getPieceContent(piece) {
            const buffer = this._buffers[piece.bufferIndex];
            const startOffset = this.offsetInBuffer(piece.bufferIndex, piece.start);
            const endOffset = this.offsetInBuffer(piece.bufferIndex, piece.end);
            const currentContent = buffer.buffer.substring(startOffset, endOffset);
            return currentContent;
        }
        /**
         *      node              node
         *     /  \              /  \
         *    a   b    <----   a    b
         *                         /
         *                        z
         */
        rbInsertRight(node, p) {
            const z = new rbTreeBase_1.TreeNode(p, 1 /* NodeColor.Red */);
            z.left = rbTreeBase_1.SENTINEL;
            z.right = rbTreeBase_1.SENTINEL;
            z.parent = rbTreeBase_1.SENTINEL;
            z.size_left = 0;
            z.lf_left = 0;
            const x = this.root;
            if (x === rbTreeBase_1.SENTINEL) {
                this.root = z;
                z.color = 0 /* NodeColor.Black */;
            }
            else if (node.right === rbTreeBase_1.SENTINEL) {
                node.right = z;
                z.parent = node;
            }
            else {
                const nextNode = (0, rbTreeBase_1.leftest)(node.right);
                nextNode.left = z;
                z.parent = nextNode;
            }
            (0, rbTreeBase_1.fixInsert)(this, z);
            return z;
        }
        /**
         *      node              node
         *     /  \              /  \
         *    a   b     ---->   a    b
         *                       \
         *                        z
         */
        rbInsertLeft(node, p) {
            const z = new rbTreeBase_1.TreeNode(p, 1 /* NodeColor.Red */);
            z.left = rbTreeBase_1.SENTINEL;
            z.right = rbTreeBase_1.SENTINEL;
            z.parent = rbTreeBase_1.SENTINEL;
            z.size_left = 0;
            z.lf_left = 0;
            if (this.root === rbTreeBase_1.SENTINEL) {
                this.root = z;
                z.color = 0 /* NodeColor.Black */;
            }
            else if (node.left === rbTreeBase_1.SENTINEL) {
                node.left = z;
                z.parent = node;
            }
            else {
                const prevNode = (0, rbTreeBase_1.righttest)(node.left); // a
                prevNode.right = z;
                z.parent = prevNode;
            }
            (0, rbTreeBase_1.fixInsert)(this, z);
            return z;
        }
        getContentOfSubTree(node) {
            let str = '';
            this.iterate(node, node => {
                str += this.getNodeContent(node);
                return true;
            });
            return str;
        }
    }
    exports.PieceTreeBase = PieceTreeBase;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGllY2VUcmVlQmFzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9waWVjZVRyZWVUZXh0QnVmZmVyL3BpZWNlVHJlZUJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUNoRyxvREF5QkM7SUFFRCw0Q0FtQ0M7SUF0RkQsNkNBQTZDO0lBQzdDLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBRWhDLFNBQVMsZUFBZSxDQUFDLEdBQWE7UUFDckMsSUFBSSxDQUFDLENBQUM7UUFDTixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDO1lBQ2pDLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQzthQUFNLENBQUM7WUFDUCxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFDRCxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNkLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVELE1BQU0sVUFBVTtRQUNmLFlBQ2lCLFVBQWdELEVBQ2hELEVBQVUsRUFDVixFQUFVLEVBQ1YsSUFBWSxFQUNaLFlBQXFCO1lBSnJCLGVBQVUsR0FBVixVQUFVLENBQXNDO1lBQ2hELE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQ1YsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNaLGlCQUFZLEdBQVosWUFBWSxDQUFTO1FBQ2xDLENBQUM7S0FDTDtJQUVELFNBQWdCLG9CQUFvQixDQUFDLEdBQVcsRUFBRSxXQUFvQixJQUFJ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