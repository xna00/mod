/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/indentation/common/indentUtils", "vs/editor/common/languages/autoIndent", "vs/editor/common/languages/enterAction"], function (require, exports, strings, shiftCommand_1, range_1, selection_1, languageConfiguration_1, languageConfigurationRegistry_1, indentUtils, autoIndent_1, enterAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveLinesCommand = void 0;
    let MoveLinesCommand = class MoveLinesCommand {
        constructor(selection, isMovingDown, autoIndent, _languageConfigurationService) {
            this._languageConfigurationService = _languageConfigurationService;
            this._selection = selection;
            this._isMovingDown = isMovingDown;
            this._autoIndent = autoIndent;
            this._selectionId = null;
            this._moveEndLineSelectionShrink = false;
        }
        getEditOperations(model, builder) {
            const modelLineCount = model.getLineCount();
            if (this._isMovingDown && this._selection.endLineNumber === modelLineCount) {
                this._selectionId = builder.trackSelection(this._selection);
                return;
            }
            if (!this._isMovingDown && this._selection.startLineNumber === 1) {
                this._selectionId = builder.trackSelection(this._selection);
                return;
            }
            this._moveEndPositionDown = false;
            let s = this._selection;
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._moveEndPositionDown = true;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            const { tabSize, indentSize, insertSpaces } = model.getOptions();
            const indentConverter = this.buildIndentConverter(tabSize, indentSize, insertSpaces);
            const virtualModel = {
                tokenization: {
                    getLineTokens: (lineNumber) => {
                        return model.tokenization.getLineTokens(lineNumber);
                    },
                    getLanguageId: () => {
                        return model.getLanguageId();
                    },
                    getLanguageIdAtPosition: (lineNumber, column) => {
                        return model.getLanguageIdAtPosition(lineNumber, column);
                    },
                },
                getLineContent: null,
            };
            if (s.startLineNumber === s.endLineNumber && model.getLineMaxColumn(s.startLineNumber) === 1) {
                // Current line is empty
                const lineNumber = s.startLineNumber;
                const otherLineNumber = (this._isMovingDown ? lineNumber + 1 : lineNumber - 1);
                if (model.getLineMaxColumn(otherLineNumber) === 1) {
                    // Other line number is empty too, so no editing is needed
                    // Add a no-op to force running by the model
                    builder.addEditOperation(new range_1.Range(1, 1, 1, 1), null);
                }
                else {
                    // Type content from other line number on line number
                    builder.addEditOperation(new range_1.Range(lineNumber, 1, lineNumber, 1), model.getLineContent(otherLineNumber));
                    // Remove content from other line number
                    builder.addEditOperation(new range_1.Range(otherLineNumber, 1, otherLineNumber, model.getLineMaxColumn(otherLineNumber)), null);
                }
                // Track selection at the other line number
                s = new selection_1.Selection(otherLineNumber, 1, otherLineNumber, 1);
            }
            else {
                let movingLineNumber;
                let movingLineText;
                if (this._isMovingDown) {
                    movingLineNumber = s.endLineNumber + 1;
                    movingLineText = model.getLineContent(movingLineNumber);
                    // Delete line that needs to be moved
                    builder.addEditOperation(new range_1.Range(movingLineNumber - 1, model.getLineMaxColumn(movingLineNumber - 1), movingLineNumber, model.getLineMaxColumn(movingLineNumber)), null);
                    let insertingText = movingLineText;
                    if (this.shouldAutoIndent(model, s)) {
                        const movingLineMatchResult = this.matchEnterRule(model, indentConverter, tabSize, movingLineNumber, s.startLineNumber - 1);
                        // if s.startLineNumber - 1 matches onEnter rule, we still honor that.
                        if (movingLineMatchResult !== null) {
                            const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(movingLineNumber));
                            const newSpaceCnt = movingLineMatchResult + indentUtils.getSpaceCnt(oldIndentation, tabSize);
                            const newIndentation = indentUtils.generateIndent(newSpaceCnt, tabSize, insertSpaces);
                            insertingText = newIndentation + this.trimStart(movingLineText);
                        }
                        else {
                            // no enter rule matches, let's check indentatin rules then.
                            virtualModel.getLineContent = (lineNumber) => {
                                if (lineNumber === s.startLineNumber) {
                                    return model.getLineContent(movingLineNumber);
                                }
                                else {
                                    return model.getLineContent(lineNumber);
                                }
                            };
                            const indentOfMovingLine = (0, autoIndent_1.getGoodIndentForLine)(this._autoIndent, virtualModel, model.getLanguageIdAtPosition(movingLineNumber, 1), s.startLineNumber, indentConverter, this._languageConfigurationService);
                            if (indentOfMovingLine !== null) {
                                const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(movingLineNumber));
                                const newSpaceCnt = indentUtils.getSpaceCnt(indentOfMovingLine, tabSize);
                                const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                                if (newSpaceCnt !== oldSpaceCnt) {
                                    const newIndentation = indentUtils.generateIndent(newSpaceCnt, tabSize, insertSpaces);
                                    insertingText = newIndentation + this.trimStart(movingLineText);
                                }
                            }
                        }
                        // add edit operations for moving line first to make sure it's executed after we make indentation change
                        // to s.startLineNumber
                        builder.addEditOperation(new range_1.Range(s.startLineNumber, 1, s.startLineNumber, 1), insertingText + '\n');
                        const ret = this.matchEnterRuleMovingDown(model, indentConverter, tabSize, s.startLineNumber, movingLineNumber, insertingText);
                        // check if the line being moved before matches onEnter rules, if so let's adjust the indentation by onEnter rules.
                        if (ret !== null) {
                            if (ret !== 0) {
                                this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, ret);
                            }
                        }
                        else {
                            // it doesn't match onEnter rules, let's check indentation rules then.
                            virtualModel.getLineContent = (lineNumber) => {
                                if (lineNumber === s.startLineNumber) {
                                    return insertingText;
                                }
                                else if (lineNumber >= s.startLineNumber + 1 && lineNumber <= s.endLineNumber + 1) {
                                    return model.getLineContent(lineNumber - 1);
                                }
                                else {
                                    return model.getLineContent(lineNumber);
                                }
                            };
                            const newIndentatOfMovingBlock = (0, autoIndent_1.getGoodIndentForLine)(this._autoIndent, virtualModel, model.getLanguageIdAtPosition(movingLineNumber, 1), s.startLineNumber + 1, indentConverter, this._languageConfigurationService);
                            if (newIndentatOfMovingBlock !== null) {
                                const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(s.startLineNumber));
                                const newSpaceCnt = indentUtils.getSpaceCnt(newIndentatOfMovingBlock, tabSize);
                                const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                                if (newSpaceCnt !== oldSpaceCnt) {
                                    const spaceCntOffset = newSpaceCnt - oldSpaceCnt;
                                    this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, spaceCntOffset);
                                }
                            }
                        }
                    }
                    else {
                        // Insert line that needs to be moved before
                        builder.addEditOperation(new range_1.Range(s.startLineNumber, 1, s.startLineNumber, 1), insertingText + '\n');
                    }
                }
                else {
                    movingLineNumber = s.startLineNumber - 1;
                    movingLineText = model.getLineContent(movingLineNumber);
                    // Delete line that needs to be moved
                    builder.addEditOperation(new range_1.Range(movingLineNumber, 1, movingLineNumber + 1, 1), null);
                    // Insert line that needs to be moved after
                    builder.addEditOperation(new range_1.Range(s.endLineNumber, model.getLineMaxColumn(s.endLineNumber), s.endLineNumber, model.getLineMaxColumn(s.endLineNumber)), '\n' + movingLineText);
                    if (this.shouldAutoIndent(model, s)) {
                        virtualModel.getLineContent = (lineNumber) => {
                            if (lineNumber === movingLineNumber) {
                                return model.getLineContent(s.startLineNumber);
                            }
                            else {
                                return model.getLineContent(lineNumber);
                            }
                        };
                        const ret = this.matchEnterRule(model, indentConverter, tabSize, s.startLineNumber, s.startLineNumber - 2);
                        // check if s.startLineNumber - 2 matches onEnter rules, if so adjust the moving block by onEnter rules.
                        if (ret !== null) {
                            if (ret !== 0) {
                                this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, ret);
                            }
                        }
                        else {
                            // it doesn't match any onEnter rule, let's check indentation rules then.
                            const indentOfFirstLine = (0, autoIndent_1.getGoodIndentForLine)(this._autoIndent, virtualModel, model.getLanguageIdAtPosition(s.startLineNumber, 1), movingLineNumber, indentConverter, this._languageConfigurationService);
                            if (indentOfFirstLine !== null) {
                                // adjust the indentation of the moving block
                                const oldIndent = strings.getLeadingWhitespace(model.getLineContent(s.startLineNumber));
                                const newSpaceCnt = indentUtils.getSpaceCnt(indentOfFirstLine, tabSize);
                                const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndent, tabSize);
                                if (newSpaceCnt !== oldSpaceCnt) {
                                    const spaceCntOffset = newSpaceCnt - oldSpaceCnt;
                                    this.getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, spaceCntOffset);
                                }
                            }
                        }
                    }
                }
            }
            this._selectionId = builder.trackSelection(s);
        }
        buildIndentConverter(tabSize, indentSize, insertSpaces) {
            return {
                shiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.shiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                },
                unshiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.unshiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                }
            };
        }
        parseEnterResult(model, indentConverter, tabSize, line, enter) {
            if (enter) {
                let enterPrefix = enter.indentation;
                if (enter.indentAction === languageConfiguration_1.IndentAction.None) {
                    enterPrefix = enter.indentation + enter.appendText;
                }
                else if (enter.indentAction === languageConfiguration_1.IndentAction.Indent) {
                    enterPrefix = enter.indentation + enter.appendText;
                }
                else if (enter.indentAction === languageConfiguration_1.IndentAction.IndentOutdent) {
                    enterPrefix = enter.indentation;
                }
                else if (enter.indentAction === languageConfiguration_1.IndentAction.Outdent) {
                    enterPrefix = indentConverter.unshiftIndent(enter.indentation) + enter.appendText;
                }
                const movingLineText = model.getLineContent(line);
                if (this.trimStart(movingLineText).indexOf(this.trimStart(enterPrefix)) >= 0) {
                    const oldIndentation = strings.getLeadingWhitespace(model.getLineContent(line));
                    let newIndentation = strings.getLeadingWhitespace(enterPrefix);
                    const indentMetadataOfMovelingLine = (0, autoIndent_1.getIndentMetadata)(model, line, this._languageConfigurationService);
                    if (indentMetadataOfMovelingLine !== null && indentMetadataOfMovelingLine & 2 /* IndentConsts.DECREASE_MASK */) {
                        newIndentation = indentConverter.unshiftIndent(newIndentation);
                    }
                    const newSpaceCnt = indentUtils.getSpaceCnt(newIndentation, tabSize);
                    const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                    return newSpaceCnt - oldSpaceCnt;
                }
            }
            return null;
        }
        /**
         *
         * @param model
         * @param indentConverter
         * @param tabSize
         * @param line the line moving down
         * @param futureAboveLineNumber the line which will be at the `line` position
         * @param futureAboveLineText
         */
        matchEnterRuleMovingDown(model, indentConverter, tabSize, line, futureAboveLineNumber, futureAboveLineText) {
            if (strings.lastNonWhitespaceIndex(futureAboveLineText) >= 0) {
                // break
                const maxColumn = model.getLineMaxColumn(futureAboveLineNumber);
                const enter = (0, enterAction_1.getEnterAction)(this._autoIndent, model, new range_1.Range(futureAboveLineNumber, maxColumn, futureAboveLineNumber, maxColumn), this._languageConfigurationService);
                return this.parseEnterResult(model, indentConverter, tabSize, line, enter);
            }
            else {
                // go upwards, starting from `line - 1`
                let validPrecedingLine = line - 1;
                while (validPrecedingLine >= 1) {
                    const lineContent = model.getLineContent(validPrecedingLine);
                    const nonWhitespaceIdx = strings.lastNonWhitespaceIndex(lineContent);
                    if (nonWhitespaceIdx >= 0) {
                        break;
                    }
                    validPrecedingLine--;
                }
                if (validPrecedingLine < 1 || line > model.getLineCount()) {
                    return null;
                }
                const maxColumn = model.getLineMaxColumn(validPrecedingLine);
                const enter = (0, enterAction_1.getEnterAction)(this._autoIndent, model, new range_1.Range(validPrecedingLine, maxColumn, validPrecedingLine, maxColumn), this._languageConfigurationService);
                return this.parseEnterResult(model, indentConverter, tabSize, line, enter);
            }
        }
        matchEnterRule(model, indentConverter, tabSize, line, oneLineAbove, previousLineText) {
            let validPrecedingLine = oneLineAbove;
            while (validPrecedingLine >= 1) {
                // ship empty lines as empty lines just inherit indentation
                let lineContent;
                if (validPrecedingLine === oneLineAbove && previousLineText !== undefined) {
                    lineContent = previousLineText;
                }
                else {
                    lineContent = model.getLineContent(validPrecedingLine);
                }
                const nonWhitespaceIdx = strings.lastNonWhitespaceIndex(lineContent);
                if (nonWhitespaceIdx >= 0) {
                    break;
                }
                validPrecedingLine--;
            }
            if (validPrecedingLine < 1 || line > model.getLineCount()) {
                return null;
            }
            const maxColumn = model.getLineMaxColumn(validPrecedingLine);
            const enter = (0, enterAction_1.getEnterAction)(this._autoIndent, model, new range_1.Range(validPrecedingLine, maxColumn, validPrecedingLine, maxColumn), this._languageConfigurationService);
            return this.parseEnterResult(model, indentConverter, tabSize, line, enter);
        }
        trimStart(str) {
            return str.replace(/^\s+/, '');
        }
        shouldAutoIndent(model, selection) {
            if (this._autoIndent < 4 /* EditorAutoIndentStrategy.Full */) {
                return false;
            }
            // if it's not easy to tokenize, we stop auto indent.
            if (!model.tokenization.isCheapToTokenize(selection.startLineNumber)) {
                return false;
            }
            const languageAtSelectionStart = model.getLanguageIdAtPosition(selection.startLineNumber, 1);
            const languageAtSelectionEnd = model.getLanguageIdAtPosition(selection.endLineNumber, 1);
            if (languageAtSelectionStart !== languageAtSelectionEnd) {
                return false;
            }
            if (this._languageConfigurationService.getLanguageConfiguration(languageAtSelectionStart).indentRulesSupport === null) {
                return false;
            }
            return true;
        }
        getIndentEditsOfMovingBlock(model, builder, s, tabSize, insertSpaces, offset) {
            for (let i = s.startLineNumber; i <= s.endLineNumber; i++) {
                const lineContent = model.getLineContent(i);
                const originalIndent = strings.getLeadingWhitespace(lineContent);
                const originalSpacesCnt = indentUtils.getSpaceCnt(originalIndent, tabSize);
                const newSpacesCnt = originalSpacesCnt + offset;
                const newIndent = indentUtils.generateIndent(newSpacesCnt, tabSize, insertSpaces);
                if (newIndent !== originalIndent) {
                    builder.addEditOperation(new range_1.Range(i, 1, i, originalIndent.length + 1), newIndent);
                    if (i === s.endLineNumber && s.endColumn <= originalIndent.length + 1 && newIndent === '') {
                        // as users select part of the original indent white spaces
                        // when we adjust the indentation of endLine, we should adjust the cursor position as well.
                        this._moveEndLineSelectionShrink = true;
                    }
                }
            }
        }
        computeCursorState(model, helper) {
            let result = helper.getTrackedSelection(this._selectionId);
            if (this._moveEndPositionDown) {
                result = result.setEndPosition(result.endLineNumber + 1, 1);
            }
            if (this._moveEndLineSelectionShrink && result.startLineNumber < result.endLineNumber) {
                result = result.setEndPosition(result.endLineNumber, 2);
            }
            return result;
        }
    };
    exports.MoveLinesCommand = MoveLinesCommand;
    exports.MoveLinesCommand = MoveLinesCommand = __decorate([
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], MoveLinesCommand);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZUxpbmVzQ29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGluZXNPcGVyYXRpb25zL2Jyb3dzZXIvbW92ZUxpbmVzQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBVTVCLFlBQ0MsU0FBb0IsRUFDcEIsWUFBcUIsRUFDckIsVUFBb0MsRUFDWSw2QkFBNEQ7WUFBNUQsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUU1RyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUN6QixJQUFJLENBQUMsMkJBQTJCLEdBQUcsS0FBSyxDQUFDO1FBQzFDLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9BQThCO1lBRXpFLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUU1QyxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQzVFLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzVELE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xFLElBQUksQ0FB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