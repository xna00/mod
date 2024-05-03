/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/textModelGuides", "vs/editor/common/model/textModel", "vs/editor/common/textModelEvents", "vs/editor/common/viewEvents", "vs/editor/common/viewModel/modelLineProjection", "vs/editor/common/model/prefixSumComputer", "vs/editor/common/viewModel"], function (require, exports, arrays, position_1, range_1, textModelGuides_1, textModel_1, textModelEvents_1, viewEvents, modelLineProjection_1, prefixSumComputer_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModelLinesFromModelAsIs = exports.ViewModelLinesFromProjectedModel = void 0;
    class ViewModelLinesFromProjectedModel {
        constructor(editorId, model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, fontInfo, tabSize, wrappingStrategy, wrappingColumn, wrappingIndent, wordBreak) {
            this._editorId = editorId;
            this.model = model;
            this._validModelVersionId = -1;
            this._domLineBreaksComputerFactory = domLineBreaksComputerFactory;
            this._monospaceLineBreaksComputerFactory = monospaceLineBreaksComputerFactory;
            this.fontInfo = fontInfo;
            this.tabSize = tabSize;
            this.wrappingStrategy = wrappingStrategy;
            this.wrappingColumn = wrappingColumn;
            this.wrappingIndent = wrappingIndent;
            this.wordBreak = wordBreak;
            this._constructLines(/*resetHiddenAreas*/ true, null);
        }
        dispose() {
            this.hiddenAreasDecorationIds = this.model.deltaDecorations(this.hiddenAreasDecorationIds, []);
        }
        createCoordinatesConverter() {
            return new CoordinatesConverter(this);
        }
        _constructLines(resetHiddenAreas, previousLineBreaks) {
            this.modelLineProjections = [];
            if (resetHiddenAreas) {
                this.hiddenAreasDecorationIds = this.model.deltaDecorations(this.hiddenAreasDecorationIds, []);
            }
            const linesContent = this.model.getLinesContent();
            const injectedTextDecorations = this.model.getInjectedTextDecorations(this._editorId);
            const lineCount = linesContent.length;
            const lineBreaksComputer = this.createLineBreaksComputer();
            const injectedTextQueue = new arrays.ArrayQueue(textModelEvents_1.LineInjectedText.fromDecorations(injectedTextDecorations));
            for (let i = 0; i < lineCount; i++) {
                const lineInjectedText = injectedTextQueue.takeWhile(t => t.lineNumber === i + 1);
                lineBreaksComputer.addRequest(linesContent[i], lineInjectedText, previousLineBreaks ? previousLineBreaks[i] : null);
            }
            const linesBreaks = lineBreaksComputer.finalize();
            const values = [];
            const hiddenAreas = this.hiddenAreasDecorationIds.map((areaId) => this.model.getDecorationRange(areaId)).sort(range_1.Range.compareRangesUsingStarts);
            let hiddenAreaStart = 1, hiddenAreaEnd = 0;
            let hiddenAreaIdx = -1;
            let nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : lineCount + 2;
            for (let i = 0; i < lineCount; i++) {
                const lineNumber = i + 1;
                if (lineNumber === nextLineNumberToUpdateHiddenArea) {
                    hiddenAreaIdx++;
                    hiddenAreaStart = hiddenAreas[hiddenAreaIdx].startLineNumber;
                    hiddenAreaEnd = hiddenAreas[hiddenAreaIdx].endLineNumber;
                    nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : lineCount + 2;
                }
                const isInHiddenArea = (lineNumber >= hiddenAreaStart && lineNumber <= hiddenAreaEnd);
                const line = (0, modelLineProjection_1.createModelLineProjection)(linesBreaks[i], !isInHiddenArea);
                values[i] = line.getViewLineCount();
                this.modelLineProjections[i] = line;
            }
            this._validModelVersionId = this.model.getVersionId();
            this.projectedModelLineLineCounts = new prefixSumComputer_1.ConstantTimePrefixSumComputer(values);
        }
        getHiddenAreas() {
            return this.hiddenAreasDecorationIds.map((decId) => this.model.getDecorationRange(decId));
        }
        setHiddenAreas(_ranges) {
            const validatedRanges = _ranges.map(r => this.model.validateRange(r));
            const newRanges = normalizeLineRanges(validatedRanges);
            // TODO@Martin: Please stop calling this method on each model change!
            // This checks if there really was a change
            const oldRanges = this.hiddenAreasDecorationIds.map((areaId) => this.model.getDecorationRange(areaId)).sort(range_1.Range.compareRangesUsingStarts);
            if (newRanges.length === oldRanges.length) {
                let hasDifference = false;
                for (let i = 0; i < newRanges.length; i++) {
                    if (!newRanges[i].equalsRange(oldRanges[i])) {
                        hasDifference = true;
                        break;
                    }
                }
                if (!hasDifference) {
                    return false;
                }
            }
            const newDecorations = newRanges.map((r) => ({
                range: r,
                options: textModel_1.ModelDecorationOptions.EMPTY,
            }));
            this.hiddenAreasDecorationIds = this.model.deltaDecorations(this.hiddenAreasDecorationIds, newDecorations);
            const hiddenAreas = newRanges;
            let hiddenAreaStart = 1, hiddenAreaEnd = 0;
            let hiddenAreaIdx = -1;
            let nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : this.modelLineProjections.length + 2;
            let hasVisibleLine = false;
            for (let i = 0; i < this.modelLineProjections.length; i++) {
                const lineNumber = i + 1;
                if (lineNumber === nextLineNumberToUpdateHiddenArea) {
                    hiddenAreaIdx++;
                    hiddenAreaStart = hiddenAreas[hiddenAreaIdx].startLineNumber;
                    hiddenAreaEnd = hiddenAreas[hiddenAreaIdx].endLineNumber;
                    nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : this.modelLineProjections.length + 2;
                }
                let lineChanged = false;
                if (lineNumber >= hiddenAreaStart && lineNumber <= hiddenAreaEnd) {
                    // Line should be hidden
                    if (this.modelLineProjections[i].isVisible()) {
                        this.modelLineProjections[i] = this.modelLineProjections[i].setVisible(false);
                        lineChanged = true;
                    }
                }
                else {
                    hasVisibleLine = true;
                    // Line should be visible
                    if (!this.modelLineProjections[i].isVisible()) {
                        this.modelLineProjections[i] = this.modelLineProjections[i].setVisible(true);
                        lineChanged = true;
                    }
                }
                if (lineChanged) {
                    const newOutputLineCount = this.modelLineProjections[i].getViewLineCount();
                    this.projectedModelLineLineCounts.setValue(i, newOutputLineCount);
                }
            }
            if (!hasVisibleLine) {
                // Cannot have everything be hidden => reveal everything!
                this.setHiddenAreas([]);
            }
            return true;
        }
        modelPositionIsVisible(modelLineNumber, _modelColumn) {
            if (modelLineNumber < 1 || modelLineNumber > this.modelLineProjections.length) {
                // invalid arguments
                return false;
            }
            return this.modelLineProjections[modelLineNumber - 1].isVisible();
        }
        getModelLineViewLineCount(modelLineNumber) {
            if (modelLineNumber < 1 || modelLineNumber > this.modelLineProjections.length) {
                // invalid arguments
                return 1;
            }
            return this.modelLineProjections[modelLineNumber - 1].getViewLineCount();
        }
        setTabSize(newTabSize) {
            if (this.tabSize === newTabSize) {
                return false;
            }
            this.tabSize = newTabSize;
            this._constructLines(/*resetHiddenAreas*/ false, null);
            return true;
        }
        setWrappingSettings(fontInfo, wrappingStrategy, wrappingColumn, wrappingIndent, wordBreak) {
            const equalFontInfo = this.fontInfo.equals(fontInfo);
            const equalWrappingStrategy = (this.wrappingStrategy === wrappingStrategy);
            const equalWrappingColumn = (this.wrappingColumn === wrappingColumn);
            const equalWrappingIndent = (this.wrappingIndent === wrappingIndent);
            const equalWordBreak = (this.wordBreak === wordBreak);
            if (equalFontInfo && equalWrappingStrategy && equalWrappingColumn && equalWrappingIndent && equalWordBreak) {
                return false;
            }
            const onlyWrappingColumnChanged = (equalFontInfo && equalWrappingStrategy && !equalWrappingColumn && equalWrappingIndent && equalWordBreak);
            this.fontInfo = fontInfo;
            this.wrappingStrategy = wrappingStrategy;
            this.wrappingColumn = wrappingColumn;
            this.wrappingIndent = wrappingIndent;
            this.wordBreak = wordBreak;
            let previousLineBreaks = null;
            if (onlyWrappingColumnChanged) {
                previousLineBreaks = [];
                for (let i = 0, len = this.modelLineProjections.length; i < len; i++) {
                    previousLineBreaks[i] = this.modelLineProjections[i].getProjectionData();
                }
            }
            this._constructLines(/*resetHiddenAreas*/ false, previousLineBreaks);
            return true;
        }
        createLineBreaksComputer() {
            const lineBreaksComputerFactory = (this.wrappingStrategy === 'advanced'
                ? this._domLineBreaksComputerFactory
                : this._monospaceLineBreaksComputerFactory);
            return lineBreaksComputerFactory.createLineBreaksComputer(this.fontInfo, this.tabSize, this.wrappingColumn, this.wrappingIndent, this.wordBreak);
        }
        onModelFlushed() {
            this._constructLines(/*resetHiddenAreas*/ true, null);
        }
        onModelLinesDeleted(versionId, fromLineNumber, toLineNumber) {
            if (!versionId || versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return null;
            }
            const outputFromLineNumber = (fromLineNumber === 1 ? 1 : this.projectedModelLineLineCounts.getPrefixSum(fromLineNumber - 1) + 1);
            const outputToLineNumber = this.projectedModelLineLineCounts.getPrefixSum(toLineNumber);
            this.modelLineProjections.splice(fromLineNumber - 1, toLineNumber - fromLineNumber + 1);
            this.projectedModelLineLineCounts.removeValues(fromLineNumber - 1, toLineNumber - fromLineNumber + 1);
            return new viewEvents.ViewLinesDeletedEvent(outputFromLineNumber, outputToLineNumber);
        }
        onModelLinesInserted(versionId, fromLineNumber, _toLineNumber, lineBreaks) {
            if (!versionId || versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return null;
            }
            // cannot use this.getHiddenAreas() because those decorations have already seen the effect of this model change
            const isInHiddenArea = (fromLineNumber > 2 && !this.modelLineProjections[fromLineNumber - 2].isVisible());
            const outputFromLineNumber = (fromLineNumber === 1 ? 1 : this.projectedModelLineLineCounts.getPrefixSum(fromLineNumber - 1) + 1);
            let totalOutputLineCount = 0;
            const insertLines = [];
            const insertPrefixSumValues = [];
            for (let i = 0, len = lineBreaks.length; i < len; i++) {
                const line = (0, modelLineProjection_1.createModelLineProjection)(lineBreaks[i], !isInHiddenArea);
                insertLines.push(line);
                const outputLineCount = line.getViewLineCount();
                totalOutputLineCount += outputLineCount;
                insertPrefixSumValues[i] = outputLineCount;
            }
            // TODO@Alex: use arrays.arrayInsert
            this.modelLineProjections =
                this.modelLineProjections.slice(0, fromLineNumber - 1)
                    .concat(insertLines)
                    .concat(this.modelLineProjections.slice(fromLineNumber - 1));
            this.projectedModelLineLineCounts.insertValues(fromLineNumber - 1, insertPrefixSumValues);
            return new viewEvents.ViewLinesInsertedEvent(outputFromLineNumber, outputFromLineNumber + totalOutputLineCount - 1);
        }
        onModelLineChanged(versionId, lineNumber, lineBreakData) {
            if (versionId !== null && versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return [false, null, null, null];
            }
            const lineIndex = lineNumber - 1;
            const oldOutputLineCount = this.modelLineProjections[lineIndex].getViewLineCount();
            const isVisible = this.modelLineProjections[lineIndex].isVisible();
            const line = (0, modelLineProjection_1.createModelLineProjection)(lineBreakData, isVisible);
            this.modelLineProjections[lineIndex] = line;
            const newOutputLineCount = this.modelLineProjections[lineIndex].getViewLineCount();
            let lineMappingChanged = false;
            let changeFrom = 0;
            let changeTo = -1;
            let insertFrom = 0;
            let insertTo = -1;
            let deleteFrom = 0;
            let deleteTo = -1;
            if (oldOutputLineCount > newOutputLineCount) {
                changeFrom = this.projectedModelLineLineCounts.getPrefixSum(lineNumber - 1) + 1;
                changeTo = changeFrom + newOutputLineCount - 1;
                deleteFrom = changeTo + 1;
                deleteTo = deleteFrom + (oldOutputLineCount - newOutputLineCount) - 1;
                lineMappingChanged = true;
            }
            else if (oldOutputLineCount < newOutputLineCount) {
                changeFrom = this.projectedModelLineLineCounts.getPrefixSum(lineNumber - 1) + 1;
                changeTo = changeFrom + oldOutputLineCount - 1;
                insertFrom = changeTo + 1;
                insertTo = insertFrom + (newOutputLineCount - oldOutputLineCount) - 1;
                lineMappingChanged = true;
            }
            else {
                changeFrom = this.projectedModelLineLineCounts.getPrefixSum(lineNumber - 1) + 1;
                changeTo = changeFrom + newOutputLineCount - 1;
            }
            this.projectedModelLineLineCounts.setValue(lineIndex, newOutputLineCount);
            const viewLinesChangedEvent = (changeFrom <= changeTo ? new viewEvents.ViewLinesChangedEvent(changeFrom, changeTo - changeFrom + 1) : null);
            const viewLinesInsertedEvent = (insertFrom <= insertTo ? new viewEvents.ViewLinesInsertedEvent(insertFrom, insertTo) : null);
            const viewLinesDeletedEvent = (deleteFrom <= deleteTo ? new viewEvents.ViewLinesDeletedEvent(deleteFrom, deleteTo) : null);
            return [lineMappingChanged, viewLinesChangedEvent, viewLinesInsertedEvent, viewLinesDeletedEvent];
        }
        acceptVersionId(versionId) {
            this._validModelVersionId = versionId;
            if (this.modelLineProjections.length === 1 && !this.modelLineProjections[0].isVisible()) {
                // At least one line must be visible => reset hidden areas
                this.setHiddenAreas([]);
            }
        }
        getViewLineCount() {
            return this.projectedModelLineLineCounts.getTotalSum();
        }
        _toValidViewLineNumber(viewLineNumber) {
            if (viewLineNumber < 1) {
                return 1;
            }
            const viewLineCount = this.getViewLineCount();
            if (viewLineNumber > viewLineCount) {
                return viewLineCount;
            }
            return viewLineNumber | 0;
        }
        getActiveIndentGuide(viewLineNumber, minLineNumber, maxLineNumber) {
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            minLineNumber = this._toValidViewLineNumber(minLineNumber);
            maxLineNumber = this._toValidViewLineNumber(maxLineNumber);
            const modelPosition = this.convertViewPositionToModelPosition(viewLineNumber, this.getViewLineMinColumn(viewLineNumber));
            const modelMinPosition = this.convertViewPositionToModelPosition(minLineNumber, this.getViewLineMinColumn(minLineNumber));
            const modelMaxPosition = this.convertViewPositionToModelPosition(maxLineNumber, this.getViewLineMinColumn(maxLineNumber));
            const result = this.model.guides.getActiveIndentGuide(modelPosition.lineNumber, modelMinPosition.lineNumber, modelMaxPosition.lineNumber);
            const viewStartPosition = this.convertModelPositionToViewPosition(result.startLineNumber, 1);
            const viewEndPosition = this.convertModelPositionToViewPosition(result.endLineNumber, this.model.getLineMaxColumn(result.endLineNumber));
            return {
                startLineNumber: viewStartPosition.lineNumber,
                endLineNumber: viewEndPosition.lineNumber,
                indent: result.indent
            };
        }
        // #region ViewLineInfo
        getViewLineInfo(viewLineNumber) {
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            const r = this.projectedModelLineLineCounts.getIndexOf(viewLineNumber - 1);
            const lineIndex = r.index;
            const remainder = r.remainder;
            return new ViewLineInfo(lineIndex + 1, remainder);
        }
        getMinColumnOfViewLine(viewLineInfo) {
            return this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewLineMinColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
        }
        getMaxColumnOfViewLine(viewLineInfo) {
            return this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewLineMaxColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
        }
        getModelStartPositionOfViewLine(viewLineInfo) {
            const line = this.modelLineProjections[viewLineInfo.modelLineNumber - 1];
            const minViewColumn = line.getViewLineMinColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
            const column = line.getModelColumnOfViewPosition(viewLineInfo.modelLineWrappedLineIdx, minViewColumn);
            return new position_1.Position(viewLineInfo.modelLineNumber, column);
        }
        getModelEndPositionOfViewLine(viewLineInfo) {
            const line = this.modelLineProjections[viewLineInfo.modelLineNumber - 1];
            const maxViewColumn = line.getViewLineMaxColumn(this.model, viewLineInfo.modelLineNumber, viewLineInfo.modelLineWrappedLineIdx);
            const column = line.getModelColumnOfViewPosition(viewLineInfo.modelLineWrappedLineIdx, maxViewColumn);
            return new position_1.Position(viewLineInfo.modelLineNumber, column);
        }
        getViewLineInfosGroupedByModelRanges(viewStartLineNumber, viewEndLineNumber) {
            const startViewLine = this.getViewLineInfo(viewStartLineNumber);
            const endViewLine = this.getViewLineInfo(viewEndLineNumber);
            const result = new Array();
            let lastVisibleModelPos = this.getModelStartPositionOfViewLine(startViewLine);
            let viewLines = new Array();
            for (let curModelLine = startViewLine.modelLineNumber; curModelLine <= endViewLine.modelLineNumber; curModelLine++) {
                const line = this.modelLineProjections[curModelLine - 1];
                if (line.isVisible()) {
                    const startOffset = curModelLine === startViewLine.modelLineNumber
                        ? startViewLine.modelLineWrappedLineIdx
                        : 0;
                    const endOffset = curModelLine === endViewLine.modelLineNumber
                        ? endViewLine.modelLineWrappedLineIdx + 1
                        : line.getViewLineCount();
                    for (let i = startOffset; i < endOffset; i++) {
                        viewLines.push(new ViewLineInfo(curModelLine, i));
                    }
                }
                if (!line.isVisible() && lastVisibleModelPos) {
                    const lastVisibleModelPos2 = new position_1.Position(curModelLine - 1, this.model.getLineMaxColumn(curModelLine - 1) + 1);
                    const modelRange = range_1.Range.fromPositions(lastVisibleModelPos, lastVisibleModelPos2);
                    result.push(new ViewLineInfoGroupedByModelRange(modelRange, viewLines));
                    viewLines = [];
                    lastVisibleModelPos = null;
                }
                else if (line.isVisible() && !lastVisibleModelPos) {
                    lastVisibleModelPos = new position_1.Position(curModelLine, 1);
                }
            }
            if (lastVisibleModelPos) {
                const modelRange = range_1.Range.fromPositions(lastVisibleModelPos, this.getModelEndPositionOfViewLine(endViewLine));
                result.push(new ViewLineInfoGroupedByModelRange(modelRange, viewLines));
            }
            return result;
        }
        // #endregion
        getViewLinesBracketGuides(viewStartLineNumber, viewEndLineNumber, activeViewPosition, options) {
            const modelActivePosition = activeViewPosition ? this.convertViewPositionToModelPosition(activeViewPosition.lineNumber, activeViewPosition.column) : null;
            const resultPerViewLine = [];
            for (const group of this.getViewLineInfosGroupedByModelRanges(viewStartLineNumber, viewEndLineNumber)) {
                const modelRangeStartLineNumber = group.modelRange.startLineNumber;
                const bracketGuidesPerModelLine = this.model.guides.getLinesBracketGuides(modelRangeStartLineNumber, group.modelRange.endLineNumber, modelActivePosition, options);
                for (const viewLineInfo of group.viewLines) {
                    const bracketGuides = bracketGuidesPerModelLine[viewLineInfo.modelLineNumber - modelRangeStartLineNumber];
                    // visibleColumns stay as they are (this is a bug and needs to be fixed, but it is not a regression)
                    // model-columns must be converted to view-model columns.
                    const result = bracketGuides.map(g => {
                        if (g.forWrappedLinesAfterColumn !== -1) {
                            const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.forWrappedLinesAfterColumn);
                            if (p.lineNumber >= viewLineInfo.modelLineWrappedLineIdx) {
                                return undefined;
                            }
                        }
                        if (g.forWrappedLinesBeforeOrAtColumn !== -1) {
                            const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.forWrappedLinesBeforeOrAtColumn);
                            if (p.lineNumber < viewLineInfo.modelLineWrappedLineIdx) {
                                return undefined;
                            }
                        }
                        if (!g.horizontalLine) {
                            return g;
                        }
                        let column = -1;
                        if (g.column !== -1) {
                            const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.column);
                            if (p.lineNumber === viewLineInfo.modelLineWrappedLineIdx) {
                                column = p.column;
                            }
                            else if (p.lineNumber < viewLineInfo.modelLineWrappedLineIdx) {
                                column = this.getMinColumnOfViewLine(viewLineInfo);
                            }
                            else if (p.lineNumber > viewLineInfo.modelLineWrappedLineIdx) {
                                return undefined;
                            }
                        }
                        const viewPosition = this.convertModelPositionToViewPosition(viewLineInfo.modelLineNumber, g.horizontalLine.endColumn);
                        const p = this.modelLineProjections[viewLineInfo.modelLineNumber - 1].getViewPositionOfModelPosition(0, g.horizontalLine.endColumn);
                        if (p.lineNumber === viewLineInfo.modelLineWrappedLineIdx) {
                            return new textModelGuides_1.IndentGuide(g.visibleColumn, column, g.className, new textModelGuides_1.IndentGuideHorizontalLine(g.horizontalLine.top, viewPosition.column), -1, -1);
                        }
                        else if (p.lineNumber < viewLineInfo.modelLineWrappedLineIdx) {
                            return undefined;
                        }
                        else {
                            if (g.visibleColumn !== -1) {
                                // Don't repeat horizontal lines that use visibleColumn for unrelated lines.
                                return undefined;
                            }
                            return new textModelGuides_1.IndentGuide(g.visibleColumn, column, g.className, new textModelGuides_1.IndentGuideHorizontalLine(g.horizontalLine.top, this.getMaxColumnOfViewLine(viewLineInfo)), -1, -1);
                        }
                    });
                    resultPerViewLine.push(result.filter((r) => !!r));
                }
            }
            return resultPerViewLine;
        }
        getViewLinesIndentGuides(viewStartLineNumber, viewEndLineNumber) {
            // TODO: Use the same code as in `getViewLinesBracketGuides`.
            // Future TODO: Merge with `getViewLinesBracketGuides`.
            // However, this requires more refactoring of indent guides.
            viewStartLineNumber = this._toValidViewLineNumber(viewStartLineNumber);
            viewEndLineNumber = this._toValidViewLineNumber(viewEndLineNumber);
            const modelStart = this.convertViewPositionToModelPosition(viewStartLineNumber, this.getViewLineMinColumn(viewStartLineNumber));
            const modelEnd = this.convertViewPositionToModelPosition(viewEndLineNumber, this.getViewLineMaxColumn(viewEndLineNumber));
            let result = [];
            const resultRepeatCount = [];
            const resultRepeatOption = [];
            const modelStartLineIndex = modelStart.lineNumber - 1;
            const modelEndLineIndex = modelEnd.lineNumber - 1;
            let reqStart = null;
            for (let modelLineIndex = modelStartLineIndex; modelLineIndex <= modelEndLineIndex; modelLineIndex++) {
                const line = this.modelLineProjections[modelLineIndex];
                if (line.isVisible()) {
                    const viewLineStartIndex = line.getViewLineNumberOfModelPosition(0, modelLineIndex === modelStartLineIndex ? modelStart.column : 1);
                    const viewLineEndIndex = line.getViewLineNumberOfModelPosition(0, this.model.getLineMaxColumn(modelLineIndex + 1));
                    const count = viewLineEndIndex - viewLineStartIndex + 1;
                    let option = 0 /* IndentGuideRepeatOption.BlockNone */;
                    if (count > 1 && line.getViewLineMinColumn(this.model, modelLineIndex + 1, viewLineEndIndex) === 1) {
                        // wrapped lines should block indent guides
                        option = (viewLineStartIndex === 0 ? 1 /* IndentGuideRepeatOption.BlockSubsequent */ : 2 /* IndentGuideRepeatOption.BlockAll */);
                    }
                    resultRepeatCount.push(count);
                    resultRepeatOption.push(option);
                    // merge into previous request
                    if (reqStart === null) {
                        reqStart = new position_1.Position(modelLineIndex + 1, 0);
                    }
                }
                else {
                    // hit invisible line => flush request
                    if (reqStart !== null) {
                        result = result.concat(this.model.guides.getLinesIndentGuides(reqStart.lineNumber, modelLineIndex));
                        reqStart = null;
                    }
                }
            }
            if (reqStart !== null) {
                result = result.concat(this.model.guides.getLinesIndentGuides(reqStart.lineNumber, modelEnd.lineNumber));
                reqStart = null;
            }
            const viewLineCount = viewEndLineNumber - viewStartLineNumber + 1;
            const viewIndents = new Array(viewLineCount);
            let currIndex = 0;
            for (let i = 0, len = result.length; i < len; i++) {
                let value = result[i];
                const count = Math.min(viewLineCount - currIndex, resultRepeatCount[i]);
                const option = resultRepeatOption[i];
                let blockAtIndex;
                if (option === 2 /* IndentGuideRepeatOption.BlockAll */) {
                    blockAtIndex = 0;
                }
                else if (option === 1 /* IndentGuideRepeatOption.BlockSubsequent */) {
                    blockAtIndex = 1;
                }
                else {
                    blockAtIndex = count;
                }
                for (let j = 0; j < count; j++) {
                    if (j === blockAtIndex) {
                        value = 0;
                    }
                    viewIndents[currIndex++] = value;
                }
            }
            return viewIndents;
        }
        getViewLineContent(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineContent(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineLength(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineLength(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineMinColumn(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineMinColumn(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineMaxColumn(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineMaxColumn(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLineData(viewLineNumber) {
            const info = this.getViewLineInfo(viewLineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getViewLineData(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
        }
        getViewLinesData(viewStartLineNumber, viewEndLineNumber, needed) {
            viewStartLineNumber = this._toValidViewLineNumber(viewStartLineNumber);
            viewEndLineNumber = this._toValidViewLineNumber(viewEndLineNumber);
            const start = this.projectedModelLineLineCounts.getIndexOf(viewStartLineNumber - 1);
            let viewLineNumber = viewStartLineNumber;
            const startModelLineIndex = start.index;
            const startRemainder = start.remainder;
            const result = [];
            for (let modelLineIndex = startModelLineIndex, len = this.model.getLineCount(); modelLineIndex < len; modelLineIndex++) {
                const line = this.modelLineProjections[modelLineIndex];
                if (!line.isVisible()) {
                    continue;
                }
                const fromViewLineIndex = (modelLineIndex === startModelLineIndex ? startRemainder : 0);
                let remainingViewLineCount = line.getViewLineCount() - fromViewLineIndex;
                let lastLine = false;
                if (viewLineNumber + remainingViewLineCount > viewEndLineNumber) {
                    lastLine = true;
                    remainingViewLineCount = viewEndLineNumber - viewLineNumber + 1;
                }
                line.getViewLinesData(this.model, modelLineIndex + 1, fromViewLineIndex, remainingViewLineCount, viewLineNumber - viewStartLineNumber, needed, result);
                viewLineNumber += remainingViewLineCount;
                if (lastLine) {
                    break;
                }
            }
            return result;
        }
        validateViewPosition(viewLineNumber, viewColumn, expectedModelPosition) {
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            const r = this.projectedModelLineLineCounts.getIndexOf(viewLineNumber - 1);
            const lineIndex = r.index;
            const remainder = r.remainder;
            const line = this.modelLineProjections[lineIndex];
            const minColumn = line.getViewLineMinColumn(this.model, lineIndex + 1, remainder);
            const maxColumn = line.getViewLineMaxColumn(this.model, lineIndex + 1, remainder);
            if (viewColumn < minColumn) {
                viewColumn = minColumn;
            }
            if (viewColumn > maxColumn) {
                viewColumn = maxColumn;
            }
            const computedModelColumn = line.getModelColumnOfViewPosition(remainder, viewColumn);
            const computedModelPosition = this.model.validatePosition(new position_1.Position(lineIndex + 1, computedModelColumn));
            if (computedModelPosition.equals(expectedModelPosition)) {
                return new position_1.Position(viewLineNumber, viewColumn);
            }
            return this.convertModelPositionToViewPosition(expectedModelPosition.lineNumber, expectedModelPosition.column);
        }
        validateViewRange(viewRange, expectedModelRange) {
            const validViewStart = this.validateViewPosition(viewRange.startLineNumber, viewRange.startColumn, expectedModelRange.getStartPosition());
            const validViewEnd = this.validateViewPosition(viewRange.endLineNumber, viewRange.endColumn, expectedModelRange.getEndPosition());
            return new range_1.Range(validViewStart.lineNumber, validViewStart.column, validViewEnd.lineNumber, validViewEnd.column);
        }
        convertViewPositionToModelPosition(viewLineNumber, viewColumn) {
            const info = this.getViewLineInfo(viewLineNumber);
            const inputColumn = this.modelLineProjections[info.modelLineNumber - 1].getModelColumnOfViewPosition(info.modelLineWrappedLineIdx, viewColumn);
            // console.log('out -> in ' + viewLineNumber + ',' + viewColumn + ' ===> ' + (lineIndex+1) + ',' + inputColumn);
            return this.model.validatePosition(new position_1.Position(info.modelLineNumber, inputColumn));
        }
        convertViewRangeToModelRange(viewRange) {
            const start = this.convertViewPositionToModelPosition(viewRange.startLineNumber, viewRange.startColumn);
            const end = this.convertViewPositionToModelPosition(viewRange.endLineNumber, viewRange.endColumn);
            return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        convertModelPositionToViewPosition(_modelLineNumber, _modelColumn, affinity = 2 /* PositionAffinity.None */, allowZeroLineNumber = false, belowHiddenRanges = false) {
            const validPosition = this.model.validatePosition(new position_1.Position(_modelLineNumber, _modelColumn));
            const inputLineNumber = validPosition.lineNumber;
            const inputColumn = validPosition.column;
            let lineIndex = inputLineNumber - 1, lineIndexChanged = false;
            if (belowHiddenRanges) {
                while (lineIndex < this.modelLineProjections.length && !this.modelLineProjections[lineIndex].isVisible()) {
                    lineIndex++;
                    lineIndexChanged = true;
                }
            }
            else {
                while (lineIndex > 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                    lineIndex--;
                    lineIndexChanged = true;
                }
            }
            if (lineIndex === 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                // Could not reach a real line
                // console.log('in -> out ' + inputLineNumber + ',' + inputColumn + ' ===> ' + 1 + ',' + 1);
                // TODO@alexdima@hediet this isn't soo pretty
                return new position_1.Position(allowZeroLineNumber ? 0 : 1, 1);
            }
            const deltaLineNumber = 1 + this.projectedModelLineLineCounts.getPrefixSum(lineIndex);
            let r;
            if (lineIndexChanged) {
                if (belowHiddenRanges) {
                    r = this.modelLineProjections[lineIndex].getViewPositionOfModelPosition(deltaLineNumber, 1, affinity);
                }
                else {
                    r = this.modelLineProjections[lineIndex].getViewPositionOfModelPosition(deltaLineNumber, this.model.getLineMaxColumn(lineIndex + 1), affinity);
                }
            }
            else {
                r = this.modelLineProjections[inputLineNumber - 1].getViewPositionOfModelPosition(deltaLineNumber, inputColumn, affinity);
            }
            // console.log('in -> out ' + inputLineNumber + ',' + inputColumn + ' ===> ' + r.lineNumber + ',' + r);
            return r;
        }
        /**
         * @param affinity The affinity in case of an empty range. Has no effect for non-empty ranges.
        */
        convertModelRangeToViewRange(modelRange, affinity = 0 /* PositionAffinity.Left */) {
            if (modelRange.isEmpty()) {
                const start = this.convertModelPositionToViewPosition(modelRange.startLineNumber, modelRange.startColumn, affinity);
                return range_1.Range.fromPositions(start);
            }
            else {
                const start = this.convertModelPositionToViewPosition(modelRange.startLineNumber, modelRange.startColumn, 1 /* PositionAffinity.Right */);
                const end = this.convertModelPositionToViewPosition(modelRange.endLineNumber, modelRange.endColumn, 0 /* PositionAffinity.Left */);
                return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
            }
        }
        getViewLineNumberOfModelPosition(modelLineNumber, modelColumn) {
            let lineIndex = modelLineNumber - 1;
            if (this.modelLineProjections[lineIndex].isVisible()) {
                // this model line is visible
                const deltaLineNumber = 1 + this.projectedModelLineLineCounts.getPrefixSum(lineIndex);
                return this.modelLineProjections[lineIndex].getViewLineNumberOfModelPosition(deltaLineNumber, modelColumn);
            }
            // this model line is not visible
            while (lineIndex > 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                lineIndex--;
            }
            if (lineIndex === 0 && !this.modelLineProjections[lineIndex].isVisible()) {
                // Could not reach a real line
                return 1;
            }
            const deltaLineNumber = 1 + this.projectedModelLineLineCounts.getPrefixSum(lineIndex);
            return this.modelLineProjections[lineIndex].getViewLineNumberOfModelPosition(deltaLineNumber, this.model.getLineMaxColumn(lineIndex + 1));
        }
        getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations) {
            const modelStart = this.convertViewPositionToModelPosition(range.startLineNumber, range.startColumn);
            const modelEnd = this.convertViewPositionToModelPosition(range.endLineNumber, range.endColumn);
            if (modelEnd.lineNumber - modelStart.lineNumber <= range.endLineNumber - range.startLineNumber) {
                // most likely there are no hidden lines => fast path
                // fetch decorations from column 1 to cover the case of wrapped lines that have whole line decorations at column 1
                return this.model.getDecorationsInRange(new range_1.Range(modelStart.lineNumber, 1, modelEnd.lineNumber, modelEnd.column), ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations);
            }
            let result = [];
            const modelStartLineIndex = modelStart.lineNumber - 1;
            const modelEndLineIndex = modelEnd.lineNumber - 1;
            let reqStart = null;
            for (let modelLineIndex = modelStartLineIndex; modelLineIndex <= modelEndLineIndex; modelLineIndex++) {
                const line = this.modelLineProjections[modelLineIndex];
                if (line.isVisible()) {
                    // merge into previous request
                    if (reqStart === null) {
                        reqStart = new position_1.Position(modelLineIndex + 1, modelLineIndex === modelStartLineIndex ? modelStart.column : 1);
                    }
                }
                else {
                    // hit invisible line => flush request
                    if (reqStart !== null) {
                        const maxLineColumn = this.model.getLineMaxColumn(modelLineIndex);
                        result = result.concat(this.model.getDecorationsInRange(new range_1.Range(reqStart.lineNumber, reqStart.column, modelLineIndex, maxLineColumn), ownerId, filterOutValidation, onlyMinimapDecorations));
                        reqStart = null;
                    }
                }
            }
            if (reqStart !== null) {
                result = result.concat(this.model.getDecorationsInRange(new range_1.Range(reqStart.lineNumber, reqStart.column, modelEnd.lineNumber, modelEnd.column), ownerId, filterOutValidation, onlyMinimapDecorations));
                reqStart = null;
            }
            result.sort((a, b) => {
                const res = range_1.Range.compareRangesUsingStarts(a.range, b.range);
                if (res === 0) {
                    if (a.id < b.id) {
                        return -1;
                    }
                    if (a.id > b.id) {
                        return 1;
                    }
                    return 0;
                }
                return res;
            });
            // Eliminate duplicate decorations that might have intersected our visible ranges multiple times
            const finalResult = [];
            let finalResultLen = 0;
            let prevDecId = null;
            for (const dec of result) {
                const decId = dec.id;
                if (prevDecId === decId) {
                    // skip
                    continue;
                }
                prevDecId = decId;
                finalResult[finalResultLen++] = dec;
            }
            return finalResult;
        }
        getInjectedTextAt(position) {
            const info = this.getViewLineInfo(position.lineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].getInjectedTextAt(info.modelLineWrappedLineIdx, position.column);
        }
        normalizePosition(position, affinity) {
            const info = this.getViewLineInfo(position.lineNumber);
            return this.modelLineProjections[info.modelLineNumber - 1].normalizePosition(info.modelLineWrappedLineIdx, position, affinity);
        }
        getLineIndentColumn(lineNumber) {
            const info = this.getViewLineInfo(lineNumber);
            if (info.modelLineWrappedLineIdx === 0) {
                return this.model.getLineIndentColumn(info.modelLineNumber);
            }
            // wrapped lines have no indentation.
            // We deliberately don't handle the case that indentation is wrapped
            // to avoid two view lines reporting indentation for the very same model line.
            return 0;
        }
    }
    exports.ViewModelLinesFromProjectedModel = ViewModelLinesFromProjectedModel;
    /**
     * Overlapping unsorted ranges:
     * [   )      [ )       [  )
     *    [    )      [       )
     * ->
     * Non overlapping sorted ranges:
     * [       )  [ ) [        )
     *
     * Note: This function only considers line information! Columns are ignored.
    */
    function normalizeLineRanges(ranges) {
        if (ranges.length === 0) {
            return [];
        }
        const sortedRanges = ranges.slice();
        sortedRanges.sort(range_1.Range.compareRangesUsingStarts);
        const result = [];
        let currentRangeStart = sortedRanges[0].startLineNumber;
        let currentRangeEnd = sortedRanges[0].endLineNumber;
        for (let i = 1, len = sortedRanges.length; i < len; i++) {
            const range = sortedRanges[i];
            if (range.startLineNumber > currentRangeEnd + 1) {
                result.push(new range_1.Range(currentRangeStart, 1, currentRangeEnd, 1));
                currentRangeStart = range.startLineNumber;
                currentRangeEnd = range.endLineNumber;
            }
            else if (range.endLineNumber > currentRangeEnd) {
                currentRangeEnd = range.endLineNumber;
            }
        }
        result.push(new range_1.Range(currentRangeStart, 1, currentRangeEnd, 1));
        return result;
    }
    /**
     * Represents a view line. Can be used to efficiently query more information about it.
     */
    class ViewLineInfo {
        get isWrappedLineContinuation() {
            return this.modelLineWrappedLineIdx > 0;
        }
        constructor(modelLineNumber, modelLineWrappedLineIdx) {
            this.modelLineNumber = modelLineNumber;
            this.modelLineWrappedLineIdx = modelLineWrappedLineIdx;
        }
    }
    /**
     * A list of view lines that have a contiguous span in the model.
    */
    class ViewLineInfoGroupedByModelRange {
        constructor(modelRange, viewLines) {
            this.modelRange = modelRange;
            this.viewLines = viewLines;
        }
    }
    class CoordinatesConverter {
        constructor(lines) {
            this._lines = lines;
        }
        // View -> Model conversion and related methods
        convertViewPositionToModelPosition(viewPosition) {
            return this._lines.convertViewPositionToModelPosition(viewPosition.lineNumber, viewPosition.column);
        }
        convertViewRangeToModelRange(viewRange) {
            return this._lines.convertViewRangeToModelRange(viewRange);
        }
        validateViewPosition(viewPosition, expectedModelPosition) {
            return this._lines.validateViewPosition(viewPosition.lineNumber, viewPosition.column, expectedModelPosition);
        }
        validateViewRange(viewRange, expectedModelRange) {
            return this._lines.validateViewRange(viewRange, expectedModelRange);
        }
        // Model -> View conversion and related methods
        convertModelPositionToViewPosition(modelPosition, affinity, allowZero, belowHiddenRanges) {
            return this._lines.convertModelPositionToViewPosition(modelPosition.lineNumber, modelPosition.column, affinity, allowZero, belowHiddenRanges);
        }
        convertModelRangeToViewRange(modelRange, affinity) {
            return this._lines.convertModelRangeToViewRange(modelRange, affinity);
        }
        modelPositionIsVisible(modelPosition) {
            return this._lines.modelPositionIsVisible(modelPosition.lineNumber, modelPosition.column);
        }
        getModelLineViewLineCount(modelLineNumber) {
            return this._lines.getModelLineViewLineCount(modelLineNumber);
        }
        getViewLineNumberOfModelPosition(modelLineNumber, modelColumn) {
            return this._lines.getViewLineNumberOfModelPosition(modelLineNumber, modelColumn);
        }
    }
    var IndentGuideRepeatOption;
    (function (IndentGuideRepeatOption) {
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockNone"] = 0] = "BlockNone";
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockSubsequent"] = 1] = "BlockSubsequent";
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockAll"] = 2] = "BlockAll";
    })(IndentGuideRepeatOption || (IndentGuideRepeatOption = {}));
    class ViewModelLinesFromModelAsIs {
        constructor(model) {
            this.model = model;
        }
        dispose() {
        }
        createCoordinatesConverter() {
            return new IdentityCoordinatesConverter(this);
        }
        getHiddenAreas() {
            return [];
        }
        setHiddenAreas(_ranges) {
            return false;
        }
        setTabSize(_newTabSize) {
            return false;
        }
        setWrappingSettings(_fontInfo, _wrappingStrategy, _wrappingColumn, _wrappingIndent) {
            return false;
        }
        createLineBreaksComputer() {
            const result = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    result.push(null);
                },
                finalize: () => {
                    return result;
                }
            };
        }
        onModelFlushed() {
        }
        onModelLinesDeleted(_versionId, fromLineNumber, toLineNumber) {
            return new viewEvents.ViewLinesDeletedEvent(fromLineNumber, toLineNumber);
        }
        onModelLinesInserted(_versionId, fromLineNumber, toLineNumber, lineBreaks) {
            return new viewEvents.ViewLinesInsertedEvent(fromLineNumber, toLineNumber);
        }
        onModelLineChanged(_versionId, lineNumber, lineBreakData) {
            return [false, new viewEvents.ViewLinesChangedEvent(lineNumber, 1), null, null];
        }
        acceptVersionId(_versionId) {
        }
        getViewLineCount() {
            return this.model.getLineCount();
        }
        getActiveIndentGuide(viewLineNumber, _minLineNumber, _maxLineNumber) {
            return {
                startLineNumber: viewLineNumber,
                endLineNumber: viewLineNumber,
                indent: 0
            };
        }
        getViewLinesBracketGuides(startLineNumber, endLineNumber, activePosition) {
            return new Array(endLineNumber - startLineNumber + 1).fill([]);
        }
        getViewLinesIndentGuides(viewStartLineNumber, viewEndLineNumber) {
            const viewLineCount = viewEndLineNumber - viewStartLineNumber + 1;
            const result = new Array(viewLineCount);
            for (let i = 0; i < viewLineCount; i++) {
                result[i] = 0;
            }
            return result;
        }
        getViewLineContent(viewLineNumber) {
            return this.model.getLineContent(viewLineNumber);
        }
        getViewLineLength(viewLineNumber) {
            return this.model.getLineLength(viewLineNumber);
        }
        getViewLineMinColumn(viewLineNumber) {
            return this.model.getLineMinColumn(viewLineNumber);
        }
        getViewLineMaxColumn(viewLineNumber) {
            return this.model.getLineMaxColumn(viewLineNumber);
        }
        getViewLineData(viewLineNumber) {
            const lineTokens = this.model.tokenization.getLineTokens(viewLineNumber);
            const lineContent = lineTokens.getLineContent();
            return new viewModel_1.ViewLineData(lineContent, false, 1, lineContent.length + 1, 0, lineTokens.inflate(), null);
        }
        getViewLinesData(viewStartLineNumber, viewEndLineNumber, needed) {
            const lineCount = this.model.getLineCount();
            viewStartLineNumber = Math.min(Math.max(1, viewStartLineNumber), lineCount);
            viewEndLineNumber = Math.min(Math.max(1, viewEndLineNumber), lineCount);
            const result = [];
            for (let lineNumber = viewStartLineNumber; lineNumber <= viewEndLineNumber; lineNumber++) {
                const idx = lineNumber - viewStartLineNumber;
                result[idx] = needed[idx] ? this.getViewLineData(lineNumber) : null;
            }
            return result;
        }
        getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations) {
            return this.model.getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations, onlyMarginDecorations);
        }
        normalizePosition(position, affinity) {
            return this.model.normalizePosition(position, affinity);
        }
        getLineIndentColumn(lineNumber) {
            return this.model.getLineIndentColumn(lineNumber);
        }
        getInjectedTextAt(position) {
            // Identity lines collection does not support injected text.
            return null;
        }
    }
    exports.ViewModelLinesFromModelAsIs = ViewModelLinesFromModelAsIs;
    class IdentityCoordinatesConverter {
        constructor(lines) {
            this._lines = lines;
        }
        _validPosition(pos) {
            return this._lines.model.validatePosition(pos);
        }
        _validRange(range) {
            return this._lines.model.validateRange(range);
        }
        // View -> Model conversion and related methods
        convertViewPositionToModelPosition(viewPosition) {
            return this._validPosition(viewPosition);
        }
        convertViewRangeToModelRange(viewRange) {
            return this._validRange(viewRange);
        }
        validateViewPosition(_viewPosition, expectedModelPosition) {
            return this._validPosition(expectedModelPosition);
        }
        validateViewRange(_viewRange, expectedModelRange) {
            return this._validRange(expectedModelRange);
        }
        // Model -> View conversion and related methods
        convertModelPositionToViewPosition(modelPosition) {
            return this._validPosition(modelPosition);
        }
        convertModelRangeToViewRange(modelRange) {
            return this._validRange(modelRange);
        }
        modelPositionIsVisible(modelPosition) {
            const lineCount = this._lines.model.getLineCount();
            if (modelPosition.lineNumber < 1 || modelPosition.lineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            return true;
        }
        modelRangeIsVisible(modelRange) {
            const lineCount = this._lines.model.getLineCount();
            if (modelRange.startLineNumber < 1 || modelRange.startLineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            if (modelRange.endLineNumber < 1 || modelRange.endLineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            return true;
        }
        getModelLineViewLineCount(modelLineNumber) {
            return 1;
        }
        getViewLineNumberOfModelPosition(modelLineNumber, modelColumn) {
            return modelLineNumber;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsTGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld01vZGVsL3ZpZXdNb2RlbExpbmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdEaEcsTUFBYSxnQ0FBZ0M7UUF3QjVDLFlBQ0MsUUFBZ0IsRUFDaEIsS0FBaUIsRUFDakIsNEJBQXdELEVBQ3hELGtDQUE4RCxFQUM5RCxRQUFrQixFQUNsQixPQUFlLEVBQ2YsZ0JBQXVDLEVBQ3ZDLGNBQXNCLEVBQ3RCLGNBQThCLEVBQzlCLFNBQStCO1lBRS9CLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsNkJBQTZCLEdBQUcsNEJBQTRCLENBQUM7WUFDbEUsSUFBSSxDQUFDLG1DQUFtQyxHQUFHLGtDQUFrQyxDQUFDO1lBQzlFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztZQUN6QyxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztZQUNyQyxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztZQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUUzQixJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFBLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsS0FBSyxD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