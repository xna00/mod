/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/tokens/lineTokens", "vs/editor/common/core/position", "vs/editor/common/textModelEvents", "vs/editor/common/viewModel"], function (require, exports, lineTokens_1, position_1, textModelEvents_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createModelLineProjection = createModelLineProjection;
    function createModelLineProjection(lineBreakData, isVisible) {
        if (lineBreakData === null) {
            // No mapping needed
            if (isVisible) {
                return IdentityModelLineProjection.INSTANCE;
            }
            return HiddenModelLineProjection.INSTANCE;
        }
        else {
            return new ModelLineProjection(lineBreakData, isVisible);
        }
    }
    /**
     * This projection is used to
     * * wrap model lines
     * * inject text
     */
    class ModelLineProjection {
        constructor(lineBreakData, isVisible) {
            this._projectionData = lineBreakData;
            this._isVisible = isVisible;
        }
        isVisible() {
            return this._isVisible;
        }
        setVisible(isVisible) {
            this._isVisible = isVisible;
            return this;
        }
        getProjectionData() {
            return this._projectionData;
        }
        getViewLineCount() {
            if (!this._isVisible) {
                return 0;
            }
            return this._projectionData.getOutputLineCount();
        }
        getViewLineContent(model, modelLineNumber, outputLineIndex) {
            this._assertVisible();
            const startOffsetInInputWithInjections = outputLineIndex > 0 ? this._projectionData.breakOffsets[outputLineIndex - 1] : 0;
            const endOffsetInInputWithInjections = this._projectionData.breakOffsets[outputLineIndex];
            let r;
            if (this._projectionData.injectionOffsets !== null) {
                const injectedTexts = this._projectionData.injectionOffsets.map((offset, idx) => new textModelEvents_1.LineInjectedText(0, 0, offset + 1, this._projectionData.injectionOptions[idx], 0));
                const lineWithInjections = textModelEvents_1.LineInjectedText.applyInjectedText(model.getLineContent(modelLineNumber), injectedTexts);
                r = lineWithInjections.substring(startOffsetInInputWithInjections, endOffsetInInputWithInjections);
            }
            else {
                r = model.getValueInRange({
                    startLineNumber: modelLineNumber,
                    startColumn: startOffsetInInputWithInjections + 1,
                    endLineNumber: modelLineNumber,
                    endColumn: endOffsetInInputWithInjections + 1
                });
            }
            if (outputLineIndex > 0) {
                r = spaces(this._projectionData.wrappedTextIndentLength) + r;
            }
            return r;
        }
        getViewLineLength(model, modelLineNumber, outputLineIndex) {
            this._assertVisible();
            return this._projectionData.getLineLength(outputLineIndex);
        }
        getViewLineMinColumn(_model, _modelLineNumber, outputLineIndex) {
            this._assertVisible();
            return this._projectionData.getMinOutputOffset(outputLineIndex) + 1;
        }
        getViewLineMaxColumn(model, modelLineNumber, outputLineIndex) {
            this._assertVisible();
            return this._projectionData.getMaxOutputOffset(outputLineIndex) + 1;
        }
        /**
         * Try using {@link getViewLinesData} instead.
        */
        getViewLineData(model, modelLineNumber, outputLineIndex) {
            const arr = new Array();
            this.getViewLinesData(model, modelLineNumber, outputLineIndex, 1, 0, [true], arr);
            return arr[0];
        }
        getViewLinesData(model, modelLineNumber, outputLineIdx, lineCount, globalStartIndex, needed, result) {
            this._assertVisible();
            const lineBreakData = this._projectionData;
            const injectionOffsets = lineBreakData.injectionOffsets;
            const injectionOptions = lineBreakData.injectionOptions;
            let inlineDecorationsPerOutputLine = null;
            if (injectionOffsets) {
                inlineDecorationsPerOutputLine = [];
                let totalInjectedTextLengthBefore = 0;
                let currentInjectedOffset = 0;
                for (let outputLineIndex = 0; outputLineIndex < lineBreakData.getOutputLineCount(); outputLineIndex++) {
                    const inlineDecorations = new Array();
                    inlineDecorationsPerOutputLine[outputLineIndex] = inlineDecorations;
                    const lineStartOffsetInInputWithInjections = outputLineIndex > 0 ? lineBreakData.breakOffsets[outputLineIndex - 1] : 0;
                    const lineEndOffsetInInputWithInjections = lineBreakData.breakOffsets[outputLineIndex];
                    while (currentInjectedOffset < injectionOffsets.length) {
                        const length = injectionOptions[currentInjectedOffset].content.length;
                        const injectedTextStartOffsetInInputWithInjections = injectionOffsets[currentInjectedOffset] + totalInjectedTextLengthBefore;
                        const injectedTextEndOffsetInInputWithInjections = injectedTextStartOffsetInInputWithInjections + length;
                        if (injectedTextStartOffsetInInputWithInjections > lineEndOffsetInInputWithInjections) {
                            // Injected text only starts in later wrapped lines.
                            break;
                        }
                        if (lineStartOffsetInInputWithInjections < injectedTextEndOffsetInInputWithInjections) {
                            // Injected text ends after or in this line (but also starts in or before this line).
                            const options = injectionOptions[currentInjectedOffset];
                            if (options.inlineClassName) {
                                const offset = (outputLineIndex > 0 ? lineBreakData.wrappedTextIndentLength : 0);
                                const start = offset + Math.max(injectedTextStartOffsetInInputWithInjections - lineStartOffsetInInputWithInjections, 0);
                                const end = offset + Math.min(injectedTextEndOffsetInInputWithInjections - lineStartOffsetInInputWithInjections, lineEndOffsetInInputWithInjections - lineStartOffsetInInputWithInjections);
                                if (start !== end) {
                                    inlineDecorations.push(new viewModel_1.SingleLineInlineDecoration(start, end, options.inlineClassName, options.inlineClassNameAffectsLetterSpacing));
                                }
                            }
                        }
                        if (injectedTextEndOffsetInInputWithInjections <= lineEndOffsetInInputWithInjections) {
                            totalInjectedTextLengthBefore += length;
                            currentInjectedOffset++;
                        }
                        else {
                            // injected text breaks into next line, process it again
                            break;
                        }
                    }
                }
            }
            let lineWithInjections;
            if (injectionOffsets) {
                lineWithInjections = model.tokenization.getLineTokens(modelLineNumber).withInserted(injectionOffsets.map((offset, idx) => ({
                    offset,
                    text: injectionOptions[idx].content,
                    tokenMetadata: lineTokens_1.LineTokens.defaultTokenMetadata
                })));
            }
            else {
                lineWithInjections = model.tokenization.getLineTokens(modelLineNumber);
            }
            for (let outputLineIndex = outputLineIdx; outputLineIndex < outputLineIdx + lineCount; outputLineIndex++) {
                const globalIndex = globalStartIndex + outputLineIndex - outputLineIdx;
                if (!needed[globalIndex]) {
                    result[globalIndex] = null;
                    continue;
                }
                result[globalIndex] = this._getViewLineData(lineWithInjections, inlineDecorationsPerOutputLine ? inlineDecorationsPerOutputLine[outputLineIndex] : null, outputLineIndex);
            }
        }
        _getViewLineData(lineWithInjections, inlineDecorations, outputLineIndex) {
            this._assertVisible();
            const lineBreakData = this._projectionData;
            const deltaStartIndex = (outputLineIndex > 0 ? lineBreakData.wrappedTextIndentLength : 0);
            const lineStartOffsetInInputWithInjections = outputLineIndex > 0 ? lineBreakData.breakOffsets[outputLineIndex - 1] : 0;
            const lineEndOffsetInInputWithInjections = lineBreakData.breakOffsets[outputLineIndex];
            const tokens = lineWithInjections.sliceAndInflate(lineStartOffsetInInputWithInjections, lineEndOffsetInInputWithInjections, deltaStartIndex);
            let lineContent = tokens.getLineContent();
            if (outputLineIndex > 0) {
                lineContent = spaces(lineBreakData.wrappedTextIndentLength) + lineContent;
            }
            const minColumn = this._projectionData.getMinOutputOffset(outputLineIndex) + 1;
            const maxColumn = lineContent.length + 1;
            const continuesWithWrappedLine = (outputLineIndex + 1 < this.getViewLineCount());
            const startVisibleColumn = (outputLineIndex === 0 ? 0 : lineBreakData.breakOffsetsVisibleColumn[outputLineIndex - 1]);
            return new viewModel_1.ViewLineData(lineContent, continuesWithWrappedLine, minColumn, maxColumn, startVisibleColumn, tokens, inlineDecorations);
        }
        getModelColumnOfViewPosition(outputLineIndex, outputColumn) {
            this._assertVisible();
            return this._projectionData.translateToInputOffset(outputLineIndex, outputColumn - 1) + 1;
        }
        getViewPositionOfModelPosition(deltaLineNumber, inputColumn, affinity = 2 /* PositionAffinity.None */) {
            this._assertVisible();
            const r = this._projectionData.translateToOutputPosition(inputColumn - 1, affinity);
            return r.toPosition(deltaLineNumber);
        }
        getViewLineNumberOfModelPosition(deltaLineNumber, inputColumn) {
            this._assertVisible();
            const r = this._projectionData.translateToOutputPosition(inputColumn - 1);
            return deltaLineNumber + r.outputLineIndex;
        }
        normalizePosition(outputLineIndex, outputPosition, affinity) {
            const baseViewLineNumber = outputPosition.lineNumber - outputLineIndex;
            const normalizedOutputPosition = this._projectionData.normalizeOutputPosition(outputLineIndex, outputPosition.column - 1, affinity);
            const result = normalizedOutputPosition.toPosition(baseViewLineNumber);
            return result;
        }
        getInjectedTextAt(outputLineIndex, outputColumn) {
            return this._projectionData.getInjectedText(outputLineIndex, outputColumn - 1);
        }
        _assertVisible() {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
        }
    }
    /**
     * This projection does not change the model line.
    */
    class IdentityModelLineProjection {
        static { this.INSTANCE = new IdentityModelLineProjection(); }
        constructor() { }
        isVisible() {
            return true;
        }
        setVisible(isVisible) {
            if (isVisible) {
                return this;
            }
            return HiddenModelLineProjection.INSTANCE;
        }
        getProjectionData() {
            return null;
        }
        getViewLineCount() {
            return 1;
        }
        getViewLineContent(model, modelLineNumber, _outputLineIndex) {
            return model.getLineContent(modelLineNumber);
        }
        getViewLineLength(model, modelLineNumber, _outputLineIndex) {
            return model.getLineLength(modelLineNumber);
        }
        getViewLineMinColumn(model, modelLineNumber, _outputLineIndex) {
            return model.getLineMinColumn(modelLineNumber);
        }
        getViewLineMaxColumn(model, modelLineNumber, _outputLineIndex) {
            return model.getLineMaxColumn(modelLineNumber);
        }
        getViewLineData(model, modelLineNumber, _outputLineIndex) {
            const lineTokens = model.tokenization.getLineTokens(modelLineNumber);
            const lineContent = lineTokens.getLineContent();
            return new viewModel_1.ViewLineData(lineContent, false, 1, lineContent.length + 1, 0, lineTokens.inflate(), null);
        }
        getViewLinesData(model, modelLineNumber, _fromOuputLineIndex, _toOutputLineIndex, globalStartIndex, needed, result) {
            if (!needed[globalStartIndex]) {
                result[globalStartIndex] = null;
                return;
            }
            result[globalStartIndex] = this.getViewLineData(model, modelLineNumber, 0);
        }
        getModelColumnOfViewPosition(_outputLineIndex, outputColumn) {
            return outputColumn;
        }
        getViewPositionOfModelPosition(deltaLineNumber, inputColumn) {
            return new position_1.Position(deltaLineNumber, inputColumn);
        }
        getViewLineNumberOfModelPosition(deltaLineNumber, _inputColumn) {
            return deltaLineNumber;
        }
        normalizePosition(outputLineIndex, outputPosition, affinity) {
            return outputPosition;
        }
        getInjectedTextAt(_outputLineIndex, _outputColumn) {
            return null;
        }
    }
    /**
     * This projection hides the model line.
     */
    class HiddenModelLineProjection {
        static { this.INSTANCE = new HiddenModelLineProjection(); }
        constructor() { }
        isVisible() {
            return false;
        }
        setVisible(isVisible) {
            if (!isVisible) {
                return this;
            }
            return IdentityModelLineProjection.INSTANCE;
        }
        getProjectionData() {
            return null;
        }
        getViewLineCount() {
            return 0;
        }
        getViewLineContent(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineLength(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineMinColumn(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineMaxColumn(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineData(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLinesData(_model, _modelLineNumber, _fromOuputLineIndex, _toOutputLineIndex, _globalStartIndex, _needed, _result) {
            throw new Error('Not supported');
        }
        getModelColumnOfViewPosition(_outputLineIndex, _outputColumn) {
            throw new Error('Not supported');
        }
        getViewPositionOfModelPosition(_deltaLineNumber, _inputColumn) {
            throw new Error('Not supported');
        }
        getViewLineNumberOfModelPosition(_deltaLineNumber, _inputColumn) {
            throw new Error('Not supported');
        }
        normalizePosition(outputLineIndex, outputPosition, affinity) {
            throw new Error('Not supported');
        }
        getInjectedTextAt(_outputLineIndex, _outputColumn) {
            throw new Error('Not supported');
        }
    }
    const _spaces = [''];
    function spaces(count) {
        if (count >= _spaces.length) {
            for (let i = 1; i <= count; i++) {
                _spaces[i] = _makeSpaces(i);
            }
        }
        return _spaces[count];
    }
    function _makeSpaces(count) {
        return new Array(count + 1).join(' ');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxMaW5lUHJvamVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwvbW9kZWxMaW5lUHJvamVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQThDaEcsOERBVUM7SUFWRCxTQUFnQix5QkFBeUIsQ0FBQyxhQUE2QyxFQUFFLFNBQWtCO1FBQzFHLElBQUksYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQzVCLG9CQUFvQjtZQUNwQixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLE9BQU8sMkJBQTJCLENBQUMsUUFBUSxDQUFDO1lBQzdDLENBQUM7WUFDRCxPQUFPLHlCQUF5QixDQUFDLFFBQVEsQ0FBQztRQUMzQyxDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDMUQsQ0FBQztJQUNGLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxtQkFBbUI7UUFJeEIsWUFBWSxhQUFzQyxFQUFFLFNBQWtCO1lBQ3JFLElBQUksQ0FBQyxlQUFlLEdBQUcsYUFBYSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1FBQzdCLENBQUM7UUFFTSxTQUFTO1lBQ2YsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFFTSxVQUFVLENBQUMsU0FBa0I7WUFDbkMsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0saUJBQWlCO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRU0sZ0JBQWdCO1lBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFF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