/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/model/textModelSearch"], function (require, exports, lifecycle_1, range_1, pieceTreeTextBufferBuilder_1, textModelSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellSearchModel = void 0;
    class CellSearchModel extends lifecycle_1.Disposable {
        constructor(_source, _inputTextBuffer, _outputs) {
            super();
            this._source = _source;
            this._inputTextBuffer = _inputTextBuffer;
            this._outputs = _outputs;
            this._outputTextBuffers = undefined;
        }
        _getFullModelRange(buffer) {
            const lineCount = buffer.getLineCount();
            return new range_1.Range(1, 1, lineCount, this._getLineMaxColumn(buffer, lineCount));
        }
        _getLineMaxColumn(buffer, lineNumber) {
            if (lineNumber < 1 || lineNumber > buffer.getLineCount()) {
                throw new Error('Illegal value for lineNumber');
            }
            return buffer.getLineLength(lineNumber) + 1;
        }
        get inputTextBuffer() {
            if (!this._inputTextBuffer) {
                const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
                builder.acceptChunk(this._source);
                const bufferFactory = builder.finish(true);
                const { textBuffer, disposable } = bufferFactory.create(1 /* DefaultEndOfLine.LF */);
                this._inputTextBuffer = textBuffer;
                this._register(disposable);
            }
            return this._inputTextBuffer;
        }
        get outputTextBuffers() {
            if (!this._outputTextBuffers) {
                this._outputTextBuffers = this._outputs.map((output) => {
                    const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
                    builder.acceptChunk(output);
                    const bufferFactory = builder.finish(true);
                    const { textBuffer, disposable } = bufferFactory.create(1 /* DefaultEndOfLine.LF */);
                    this._register(disposable);
                    return textBuffer;
                });
            }
            return this._outputTextBuffers;
        }
        findInInputs(target) {
            const searchParams = new textModelSearch_1.SearchParams(target, false, false, null);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return [];
            }
            const fullInputRange = this._getFullModelRange(this.inputTextBuffer);
            return this.inputTextBuffer.findMatchesLineByLine(fullInputRange, searchData, true, 5000);
        }
        findInOutputs(target) {
            const searchParams = new textModelSearch_1.SearchParams(target, false, false, null);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return [];
            }
            return this.outputTextBuffers.map(buffer => {
                const matches = buffer.findMatchesLineByLine(this._getFullModelRange(buffer), searchData, true, 5000);
                if (matches.length === 0) {
                    return undefined;
                }
                return {
                    textBuffer: buffer,
                    matches
                };
            }).filter((item) => !!item);
        }
    }
    exports.CellSearchModel = CellSearchModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFNlYXJjaE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvY29tbW9uL2NlbGxTZWFyY2hNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSxlQUFnQixTQUFRLHNCQUFVO1FBRTlDLFlBQXFCLE9BQWUsRUFBVSxnQkFBaUQsRUFBVSxRQUFrQjtZQUMxSCxLQUFLLEVBQUUsQ0FBQztZQURZLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFBVSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlDO1lBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBVTtZQURuSCx1QkFBa0IsR0FBc0MsU0FBUyxDQUFDO1FBRzFFLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxNQUEyQjtZQUNyRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDeEMsT0FBTyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVPLGlCQUFpQixDQUFDLE1BQTJCLEVBQUUsVUFBa0I7WUFDeEUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxJQUFJLGVBQWU7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxD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