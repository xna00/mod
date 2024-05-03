/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/strings", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/range", "vs/editor/common/model/textModelPart", "vs/editor/common/model/utils", "vs/editor/common/textModelGuides", "vs/base/common/errors"], function (require, exports, arraysFind_1, strings, cursorColumns_1, range_1, textModelPart_1, utils_1, textModelGuides_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairGuidesClassNames = exports.GuidesTextModelPart = void 0;
    class GuidesTextModelPart extends textModelPart_1.TextModelPart {
        constructor(textModel, languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.languageConfigurationService = languageConfigurationService;
        }
        getLanguageConfiguration(languageId) {
            return this.languageConfigurationService.getLanguageConfiguration(languageId);
        }
        _computeIndentLevel(lineIndex) {
            return (0, utils_1.computeIndentLevel)(this.textModel.getLineContent(lineIndex + 1), this.textModel.getOptions().tabSize);
        }
        getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber) {
            this.assertNotDisposed();
            const lineCount = this.textModel.getLineCount();
            if (lineNumber < 1 || lineNumber > lineCount) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            const foldingRules = this.getLanguageConfiguration(this.textModel.getLanguageId()).foldingRules;
            const offSide = Boolean(foldingRules && foldingRules.offSide);
            let up_aboveContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let up_aboveContentLineIndent = -1;
            let up_belowContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let up_belowContentLineIndent = -1;
            const up_resolveIndents = (lineNumber) => {
                if (up_aboveContentLineIndex !== -1 &&
                    (up_aboveContentLineIndex === -2 ||
                        up_aboveContentLineIndex > lineNumber - 1)) {
                    up_aboveContentLineIndex = -1;
                    up_aboveContentLineIndent = -1;
                    // must find previous line with content
                    for (let lineIndex = lineNumber - 2; lineIndex >= 0; lineIndex--) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            up_aboveContentLineIndex = lineIndex;
                            up_aboveContentLineIndent = indent;
                            break;
                        }
                    }
                }
                if (up_belowContentLineIndex === -2) {
                    up_belowContentLineIndex = -1;
                    up_belowContentLineIndent = -1;
                    // must find next line with content
                    for (let lineIndex = lineNumber; lineIndex < lineCount; lineIndex++) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            up_belowContentLineIndex = lineIndex;
                            up_belowContentLineIndent = indent;
                            break;
                        }
                    }
                }
            };
            let down_aboveContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let down_aboveContentLineIndent = -1;
            let down_belowContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let down_belowContentLineIndent = -1;
            const down_resolveIndents = (lineNumber) => {
                if (down_aboveContentLineIndex === -2) {
                    down_aboveContentLineIndex = -1;
                    down_aboveContentLineIndent = -1;
                    // must find previous line with content
                    for (let lineIndex = lineNumber - 2; lineIndex >= 0; lineIndex--) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            down_aboveContentLineIndex = lineIndex;
                            down_aboveContentLineIndent = indent;
                            break;
                        }
                    }
                }
                if (down_belowContentLineIndex !== -1 &&
                    (down_belowContentLineIndex === -2 ||
                        down_belowContentLineIndex < lineNumber - 1)) {
                    down_belowContentLineIndex = -1;
                    down_belowContentLineIndent = -1;
                    // must find next line with content
                    for (let lineIndex = lineNumber; lineIndex < lineCount; lineIndex++) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            down_belowContentLineIndex = lineIndex;
                            down_belowContentLineIndent = indent;
                            break;
                        }
                    }
                }
            };
            let startLineNumber = 0;
            let goUp = true;
            let endLineNumber = 0;
            let goDown = true;
            let indent = 0;
            let initialIndent = 0;
            for (let distance = 0; goUp || goDown; distance++) {
                const upLineNumber = lineNumber - distance;
                const downLineNumber = lineNumber + distance;
                if (distance > 1 && (upLineNumber < 1 || upLineNumber < minLineNumber)) {
                    goUp = false;
                }
                if (distance > 1 &&
                    (downLineNumber > lineCount || downLineNumber > maxLineNumber)) {
                    goDown = false;
                }
                if (distance > 50000) {
                    // stop processing
                    goUp = false;
                    goDown = false;
                }
                let upLineIndentLevel = -1;
                if (goUp && upLineNumber >= 1) {
                    // compute indent level going up
                    const currentIndent = this._computeIndentLevel(upLineNumber - 1);
                    if (currentIndent >= 0) {
                        // This line has content (besides whitespace)
                        // Use the line's indent
                        up_belowContentLineIndex = upLineNumber - 1;
                        up_belowContentLineIndent = currentIndent;
                        upLineIndentLevel = Math.ceil(currentIndent / this.textModel.getOptions().indentSize);
                    }
                    else {
                        up_resolveIndents(upLineNumber);
                        upLineIndentLevel = this._getIndentLevelForWhitespaceLine(offSide, up_aboveContentLineIndent, up_belowContentLineIndent);
                    }
                }
                let downLineIndentLevel = -1;
                if (goDown && downLineNumber <= lineCount) {
                    // compute indent level going down
                    const currentIndent = this._computeIndentLevel(downLineNumber - 1);
                    if (currentIndent >= 0) {
                        // This line has content (besides whitespace)
                        // Use the line's indent
                        down_aboveContentLineIndex = downLineNumber - 1;
                        down_aboveContentLineIndent = currentIndent;
                        downLineIndentLevel = Math.ceil(currentIndent / this.textModel.getOptions().indentSize);
                    }
                    else {
                        down_resolveIndents(downLineNumber);
                        downLineIndentLevel = this._getIndentLevelForWhitespaceLine(offSide, down_aboveContentLineIndent, down_belowContentLineIndent);
                    }
                }
                if (distance === 0) {
                    initialIndent = upLineIndentLevel;
                    continue;
                }
                if (distance === 1) {
                    if (downLineNumber <= lineCount &&
                        downLineIndentLevel >= 0 &&
                        initialIndent + 1 === downLineIndentLevel) {
                        // This is the beginning of a scope, we have special handling here, since we want the
                        // child scope indent to be active, not the parent scope
                        goUp = false;
                        startLineNumber = downLineNumber;
                        endLineNumber = downLineNumber;
                        indent = downLineIndentLevel;
                        continue;
                    }
                    if (upLineNumber >= 1 &&
                        upLineIndentLevel >= 0 &&
                        upLineIndentLevel - 1 === initialIndent) {
                        // This is the end of a scope, just like above
                        goDown = false;
                        startLineNumber = upLineNumber;
                        endLineNumber = upLineNumber;
                        indent = upLineIndentLevel;
                        continue;
                    }
                    startLineNumber = lineNumber;
                    endLineNumber = lineNumber;
                    indent = initialIndent;
                    if (indent === 0) {
                        // No need to continue
                        return { startLineNumber, endLineNumber, indent };
                    }
                }
                if (goUp) {
                    if (upLineIndentLevel >= indent) {
                        startLineNumber = upLineNumber;
                    }
                    else {
                        goUp = false;
                    }
                }
                if (goDown) {
                    if (downLineIndentLevel >= indent) {
                        endLineNumber = downLineNumber;
                    }
                    else {
                        goDown = false;
                    }
                }
            }
            return { startLineNumber, endLineNumber, indent };
        }
        getLinesBracketGuides(startLineNumber, endLineNumber, activePosition, options) {
            const result = [];
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                result.push([]);
            }
            // If requested, this could be made configurable.
            const includeSingleLinePairs = true;
            const bracketPairs = this.textModel.bracketPairs.getBracketPairsInRangeWithMinIndentation(new range_1.Range(startLineNumber, 1, endLineNumber, this.textModel.getLineMaxColumn(endLineNumber))).toArray();
            let activeBracketPairRange = undefined;
            if (activePosition && bracketPairs.length > 0) {
                const bracketsContainingActivePosition = (startLineNumber <= activePosition.lineNumber &&
                    activePosition.lineNumber <= endLineNumber
                    // We don't need to query the brackets again if the cursor is in the viewport
                    ? bracketPairs
                    : this.textModel.bracketPairs.getBracketPairsInRange(range_1.Range.fromPositions(activePosition)).toArray()).filter((bp) => range_1.Range.strictContainsPosition(bp.range, activePosition));
                activeBracketPairRange = (0, arraysFind_1.findLast)(bracketsContainingActivePosition, (i) => includeSingleLinePairs || i.range.startLineNumber !== i.range.endLineNumber)?.range;
            }
            const independentColorPoolPerBracketType = this.textModel.getOptions().bracketPairColorizationOptions.independentColorPoolPerBracketType;
            const colorProvider = new BracketPairGuidesClassNames();
            for (const pair of bracketPairs) {
                /*
    
    
                        {
                        |
                        }
    
                        {
                        |
                        ----}
    
                    ____{
                    |test
                    ----}
    
                    renderHorizontalEndLineAtTheBottom:
                        {
                        |
                        |x}
                        --
                    renderHorizontalEndLineAtTheBottom:
                    ____{
                    |test
                    | x }
                    ----
                */
                if (!pair.closingBracketRange) {
                    continue;
                }
                const isActive = activeBracketPairRange && pair.range.equalsRange(activeBracketPairRange);
                if (!isActive && !options.includeInactive) {
                    continue;
                }
                const className = colorProvider.getInlineClassName(pair.nestingLevel, pair.nestingLevelOfEqualBracketType, independentColorPoolPerBracketType) +
                    (options.highlightActive && isActive
                        ? ' ' + colorProvider.activeClassName
                        : '');
                const start = pair.openingBracketRange.getStartPosition();
                const end = pair.closingBracketRange.getStartPosition();
                const horizontalGuides = options.horizontalGuides === textModelGuides_1.HorizontalGuidesState.Enabled || (options.horizontalGuides === textModelGuides_1.HorizontalGuidesState.EnabledForActive && isActive);
                if (pair.range.startLineNumber === pair.range.endLineNumber) {
                    if (includeSingleLinePairs && horizontalGuides) {
                        result[pair.range.startLineNumber - startLineNumber].push(new textModelGuides_1.IndentGuide(-1, pair.openingBracketRange.getEndPosition().column, className, new textModelGuides_1.IndentGuideHorizontalLine(false, end.column), -1, -1));
                    }
                    continue;
                }
                const endVisibleColumn = this.getVisibleColumnFromPosition(end);
                const startVisibleColumn = this.getVisibleColumnFromPosition(pair.openingBracketRange.getStartPosition());
                const guideVisibleColumn = Math.min(startVisibleColumn, endVisibleColumn, pair.minVisibleColumnIndentation + 1);
                let renderHorizontalEndLineAtTheBottom = false;
                const firstNonWsIndex = strings.firstNonWhitespaceIndex(this.textModel.getLineContent(pair.closingBracketRange.startLineNumber));
                const hasTextBeforeClosingBracket = firstNonWsIndex < pair.closingBracketRange.startColumn - 1;
                if (hasTextBeforeClosingBracket) {
                    renderHorizontalEndLineAtTheBottom = true;
                }
                const visibleGuideStartLineNumber = Math.max(start.lineNumber, startLineNumber);
                const visibleGuideEndLineNumber = Math.min(end.lineNumber, endLineNumber);
                const offset = renderHorizontalEndLineAtTheBottom ? 1 : 0;
                for (let l = visibleGuideStartLineNumber; l < visibleGuideEndLineNumber + offset; l++) {
                    result[l - startLineNumber].push(new textModelGuides_1.IndentGuide(guideVisibleColumn, -1, className, null, l === start.lineNumber ? start.column : -1, l === end.lineNumber ? end.column : -1));
                }
                if (horizontalGuides) {
                    if (start.lineNumber >= startLineNumber && startVisibleColumn > guideVisibleColumn) {
                        result[start.lineNumber - startLineNumber].push(new textModelGuides_1.IndentGuide(guideVisibleColumn, -1, className, new textModelGuides_1.IndentGuideHorizontalLine(false, start.column), -1, -1));
                    }
                    if (end.lineNumber <= endLineNumber && endVisibleColumn > guideVisibleColumn) {
                        result[end.lineNumber - startLineNumber].push(new textModelGuides_1.IndentGuide(guideVisibleColumn, -1, className, new textModelGuides_1.IndentGuideHorizontalLine(!renderHorizontalEndLineAtTheBottom, end.column), -1, -1));
                    }
                }
            }
            for (const guides of result) {
                guides.sort((a, b) => a.visibleColumn - b.visibleColumn);
            }
            return result;
        }
        getVisibleColumnFromPosition(position) {
            return (cursorColumns_1.CursorColumns.visibleColumnFromColumn(this.textModel.getLineContent(position.lineNumber), position.column, this.textModel.getOptions().tabSize) + 1);
        }
        getLinesIndentGuides(startLineNumber, endLineNumber) {
            this.assertNotDisposed();
            const lineCount = this.textModel.getLineCount();
            if (startLineNumber < 1 || startLineNumber > lineCount) {
                throw new Error('Illegal value for startLineNumber');
            }
            if (endLineNumber < 1 || endLineNumber > lineCount) {
                throw new Error('Illegal value for endLineNumber');
            }
            const options = this.textModel.getOptions();
            const foldingRules = this.getLanguageConfiguration(this.textModel.getLanguageId()).foldingRules;
            const offSide = Boolean(foldingRules && foldingRules.offSide);
            const result = new Array(endLineNumber - startLineNumber + 1);
            let aboveContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let aboveContentLineIndent = -1;
            let belowContentLineIndex = -2; /* -2 is a marker for not having computed it */
            let belowContentLineIndent = -1;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const resultIndex = lineNumber - startLineNumber;
                const currentIndent = this._computeIndentLevel(lineNumber - 1);
                if (currentIndent >= 0) {
                    // This line has content (besides whitespace)
                    // Use the line's indent
                    aboveContentLineIndex = lineNumber - 1;
                    aboveContentLineIndent = currentIndent;
                    result[resultIndex] = Math.ceil(currentIndent / options.indentSize);
                    continue;
                }
                if (aboveContentLineIndex === -2) {
                    aboveContentLineIndex = -1;
                    aboveContentLineIndent = -1;
                    // must find previous line with content
                    for (let lineIndex = lineNumber - 2; lineIndex >= 0; lineIndex--) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            aboveContentLineIndex = lineIndex;
                            aboveContentLineIndent = indent;
                            break;
                        }
                    }
                }
                if (belowContentLineIndex !== -1 &&
                    (belowContentLineIndex === -2 || belowContentLineIndex < lineNumber - 1)) {
                    belowContentLineIndex = -1;
                    belowContentLineIndent = -1;
                    // must find next line with content
                    for (let lineIndex = lineNumber; lineIndex < lineCount; lineIndex++) {
                        const indent = this._computeIndentLevel(lineIndex);
                        if (indent >= 0) {
                            belowContentLineIndex = lineIndex;
                            belowContentLineIndent = indent;
                            break;
                        }
                    }
                }
                result[resultIndex] = this._getIndentLevelForWhitespaceLine(offSide, aboveContentLineIndent, belowContentLineIndent);
            }
            return result;
        }
        _getIndentLevelForWhitespaceLine(offSide, aboveContentLineIndent, belowContentLineIndent) {
            const options = this.textModel.getOptions();
            if (aboveContentLineIndent === -1 || belowContentLineIndent === -1) {
                // At the top or bottom of the file
                return 0;
            }
            else if (aboveContentLineIndent < belowContentLineIndent) {
                // we are inside the region above
                return 1 + Math.floor(aboveContentLineIndent / options.indentSize);
            }
            else if (aboveContentLineIndent === belowContentLineIndent) {
                // we are in between two regions
                return Math.ceil(belowContentLineIndent / options.indentSize);
            }
            else {
                if (offSide) {
                    // same level as region below
                    return Math.ceil(belowContentLineIndent / options.indentSize);
                }
                else {
                    // we are inside the region that ends below
                    return 1 + Math.floor(belowContentLineIndent / options.indentSize);
                }
            }
        }
    }
    exports.GuidesTextModelPart = GuidesTextModelPart;
    class BracketPairGuidesClassNames {
        constructor() {
            this.activeClassName = 'indent-active';
        }
        getInlineClassName(nestingLevel, nestingLevelOfEqualBracketType, independentColorPoolPerBracketType) {
            return this.getInlineClassNameOfLevel(independentColorPoolPerBracketType ? nestingLevelOfEqualBracketType : nestingLevel);
        }
        getInlineClassNameOfLevel(level) {
            // To support a dynamic amount of colors up to 6 colors,
            // we use a number that is a lcm of all numbers from 1 to 6.
            return `bracket-indent-guide lvl-${level % 30}`;
        }
    }
    exports.BracketPairGuidesClassNames = BracketPairGuidesClassNames;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGVzVGV4dE1vZGVsUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9ndWlkZXNUZXh0TW9kZWxQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLG1CQUFvQixTQUFRLDZCQUFhO1FBQ3JELFlBQ2tCLFNBQW9CLEVBQ3BCLDRCQUEyRDtZQUU1RSxLQUFLLEVBQUUsQ0FBQztZQUhTLGNBQVMsR0FBVCxTQUFTLENBQVc7WUFDcEIsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtRQUc3RSxDQUFDO1FBRU8sd0JBQXdCLENBQy9CLFVBQWtCO1lBRWxCLE9BQU8sSUFBSSxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixDQUNoRSxVQUFVLENBQ1YsQ0FBQztRQUNILENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxTQUFpQjtZQUM1QyxPQUFPLElBQUEsMEJBQWtCLEVBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLENBQ25DLENBQUM7UUFDSCxDQUFDO1FBRU0sb0JBQW9CLENBQzFCLFVBQWtCLEVBQ2xCLGFBQXFCLEVBQ3JCLGFBQXFCO1lBRXJCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFaEQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxJQUFJLFVBQVUsR0FBRyxTQUFTLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxJQUFJLDJCQUFrQixDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFH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